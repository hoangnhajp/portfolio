// Task kfh1: workflow "những việc đã làm" (#projects) chạy animation thật trong Chrome headless (CDP), chuyển động bình thường:
// mỗi làn có vệt sáng pjfRun đang chạy, icon pjfHi nhấn sáng lần lượt, 12 bước hiện đủ (opacity 1 sau khi vào khung nhìn),
// đường nối nằm trong làn và đi qua tâm mọi icon (lệch <= 1.5px); màn hẹp đổi sang pjfRunV (dọc);
// prefers-reduced-motion: không còn animation nào trong .pjf, vệt sáng ẩn. SHOT_DIR=<thư mục> để lưu ảnh khối workflow.
// Chạy: node tests/browser-work-flow.mjs (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const chromePath = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'pjf-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const f = document.querySelector('#projects .pjf');
  const names = (el) => el.getAnimations().map((a) => a.animationName + ':' + a.playState);
  return { lanes: [...f.querySelectorAll('.pjf-ln')].map((ln) => {
    const lr = ln.getBoundingClientRect(), row = ln.querySelector('.pjf-row'), rr = row.getBoundingClientRect();
    const bs = getComputedStyle(row, '::before'), vert = parseFloat(bs.width) < 4;
    const lc = vert ? rr.left + parseFloat(bs.left) + parseFloat(bs.width) / 2 : rr.top + parseFloat(bs.top) + parseFloat(bs.height) / 2;
    const off = Math.max(...[...ln.querySelectorAll('.pjf-ic')].map((i) => { const r = i.getBoundingClientRect(); return Math.abs((vert ? r.left + r.width / 2 : r.top + r.height / 2) - lc); }));
    return { off: Math.round(off * 10) / 10, run: row.getAnimations({ subtree: true }).filter((a) => /^pjfRun/.test(a.animationName)).map((a) => a.animationName + ':' + a.playState),
      runShown: getComputedStyle(row, '::after').display !== 'none', all: ln.getAnimations({ subtree: true }).length, hi: [...ln.querySelectorAll('.pjf-ic')].map((i) => names(i).join(',')),
      steps: [...ln.querySelectorAll('.pjf-row>li')].map((li) => +getComputedStyle(li).opacity),
      out: [...ln.querySelectorAll('.pj-c')].some((a) => { const r = a.getBoundingClientRect(); return r.left < lr.left - 1 || r.right > lr.right + 1; }) };
  }), overflowX: document.documentElement.scrollWidth - innerWidth };
})()`;

async function main() {
  let port;
  for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch {} }
  if (!port) throw new Error('Chrome không mở cổng debug');
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = []; let loaded = null;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Page.loadEventFired' && loaded) loaded();
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  for (const [lang, w, rm] of [['vi', 1280], ['ja', 1280], ['en', 900], ['vi', 390], ['ja', 390], ['vi', 1280, 1], ['ja', 390, 1]]) {
    const tag = `${lang}/${w}px${rm ? '/reduced-motion' : ''}`;
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: rm ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url: `${pageUrl}?lang=${lang}#projects` }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(document.querySelector('#projects .pjf').scrollIntoView({block:'center'}), new Promise((r) => setTimeout(r, 2600)))`);
    const r = await evaluate(PROBE); checks++;
    ok(r.lanes.length === 4, `${tag}: cần 4 làn, đang ${r.lanes.length}`);
    const runName = w <= 700 ? 'pjfRunV' : 'pjfRun';
    for (const [i, ln] of r.lanes.entries()) {
      ok(ln.off <= 1.5, `${tag}: làn ${i + 1} đường nối lệch tâm icon ${ln.off}px`);
      if (rm) { ok(ln.all === 0 && !ln.runShown, `${tag}: làn ${i + 1} vẫn còn animation (${ln.all}) / vệt sáng`); ok(ln.steps.every((o) => o > 0.99), `${tag}: làn ${i + 1} có bước bị ẩn`); continue; }
      ok(ln.run.includes(runName + ':running'), `${tag}: làn ${i + 1} không có vệt sáng ${runName} đang chạy (${ln.run})`);
      ok(ln.hi.every((h) => h.includes('pjfHi:running')), `${tag}: làn ${i + 1} có icon không chạy pjfHi`);
      ok(ln.steps.every((o) => o > 0.99), `${tag}: làn ${i + 1} có bước chưa hiện đủ ${ln.steps}`);
      ok(!ln.out, `${tag}: làn ${i + 1} có bước tràn khỏi làn`);
    }
    ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
    if (SHOT) {
      const b = await evaluate(`(() => { const r = document.querySelector('#projects .pjf').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`);
      const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...b, scale: 1 } });
      writeFileSync(join(SHOT, `pjf-${lang}-${w}.png`), Buffer.from(s.result.data, 'base64'));
    }
  }
  ok(errors.length === 0, `lỗi JS: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-work-flow (${fails.length})\n- ` + fails.slice(0, 30).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-work-flow: ${checks} lượt (JA/EN/VI, 1280 / 900 / 390px + 2 lượt reduced-motion): 4 làn có vệt sáng chạy, icon sáng lần lượt, đường nối qua tâm icon, 12 bước hiện đủ, reduced-motion tắt hết animation, không tràn, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
