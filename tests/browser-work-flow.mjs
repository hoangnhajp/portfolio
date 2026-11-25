// Task kfh1 + mwuc: workflow "những việc đã làm" (#projects) chạy animation thật trong Chrome headless (CDP).
// mwuc: 4 làn nối thành MỘT đường ống liên tục kiểu ziczac (A trái -> phải, vòng xuống B phải -> trái, vòng xuống C trái -> phải, D phải -> trái),
// đường ống đi qua tâm cả 12 icon theo đúng thứ tự 01 -> 12, chỗ quay đầu nằm ở mép làn (không cắt qua chữ), một cục sáng chạy liên tục
// dọc ống (vị trí đổi theo thời gian), icon được cục sáng đi qua thì sáng; 12 bước hiện đủ; màn hẹp: ống dọc qua tâm icon;
// prefers-reduced-motion: ống đứng yên, không còn animation nào trong .pjf, không có cục sáng. SHOT_DIR=<thư mục> để lưu ảnh khối workflow.
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
  const f = document.querySelector('#projects .pjf'), fr = f.getBoundingClientRect();
  const pipe = f.querySelector('.pjf-pipe path.pjf-tube'), orb = f.querySelector('.pjf-orb');
  const lanes = [...f.querySelectorAll('.pjf-ln')].map((ln) => {
    const lr = ln.getBoundingClientRect();
    return { dir: [...ln.querySelectorAll('.pjf-ic')].map((i) => { const r = i.getBoundingClientRect(); return Math.round(r.left + r.width / 2); }),
      all: ln.getAnimations({ subtree: true }).length,
      steps: [...ln.querySelectorAll('.pjf-row>li')].map((li) => +getComputedStyle(li).opacity),
      out: [...ln.querySelectorAll('.pj-c')].some((a) => { const r = a.getBoundingClientRect(); return r.left < lr.left - 1 || r.right > lr.right + 1; }) };
  });
  let pipeInfo = null;
  if (pipe && pipe.getTotalLength) {
    const L = pipe.getTotalLength(), d = pipe.getAttribute('d') || '', pts = [];
    for (let s = 0; s <= L; s += 0.5) { const p = pipe.getPointAtLength(s); pts.push([p.x + fr.left, p.y + fr.top, s]); }
    const near = [...f.querySelectorAll('.pjf-ic')].map((i) => { const r = i.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let best = 1e9, at = 0; for (const [x, y, s] of pts) { const dd = Math.hypot(x - cx, y - cy); if (dd < best) { best = dd; at = s; } } return [Math.round(best * 10) / 10, at]; });
    const cross = [...f.querySelectorAll('.pj-co, .pjf-lb')].filter((b) => { const r = b.getBoundingClientRect(); return pts.some(([x, y]) => x > r.left + 1 && x < r.right - 1 && y > r.top + 1 && y < r.bottom - 1); }).map((b) => b.textContent.trim().slice(0, 20));
    // chỗ vòng giữa làn k và k+1: đoạn dọc phải nằm sát mép phải (làn lẻ thứ tự 1, 3 trên màn rộng) hoặc mép trái (còn lại)
    const lns = [...f.querySelectorAll('.pjf-ln')], turns = [];
    for (let k = 0; k + 1 < lns.length; k++) {
      const a = [...lns[k].querySelectorAll('.pjf-ic')].pop().getBoundingClientRect(), b = lns[k + 1].querySelector('.pjf-ic').getBoundingClientRect(), lr = lns[k].getBoundingClientRect();
      const ys = [a.bottom + 4, b.top - 4], right = innerWidth > 700 && k % 2 === 0, edge = right ? lr.right : lr.left;
      const xs = pts.filter(([, y]) => y > ys[0] && y < ys[1]).map(([x]) => x);
      turns.push(xs.length ? Math.round(Math.max(...xs.map((x) => Math.abs(x - edge)))) : 999);
    }
    pipeInfo = { turns, L: Math.round(L), moves: (d.match(/M/g) || []).length, off: Math.max(...near.map((n) => n[0])), order: near.map((n) => n[1]), cross };
  }
  const o = orb ? orb.getBoundingClientRect() : null;
  return { lanes, pipe: pipeInfo, orb: o ? [Math.round(o.left), Math.round(o.top)] : null, orbShown: !!orb && +getComputedStyle(orb).opacity > 0.5 && getComputedStyle(orb).display !== 'none',
    lit: f.querySelectorAll('.pjf-row>li.on').length, overflowX: document.documentElement.scrollWidth - innerWidth };
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
    ok(r.pipe, `${tag}: thiếu đường ống .pjf-pipe path.pjf-tube`);
    if (r.pipe) {
      ok(r.pipe.moves === 1, `${tag}: đường ống bị đứt thành ${r.pipe.moves} đoạn (cần 1 đường liền)`);
      ok(r.pipe.off <= 1.5, `${tag}: đường ống lệch tâm icon ${r.pipe.off}px`);
      ok(r.pipe.order.every((s, i, a) => i === 0 || s > a[i - 1] + 10), `${tag}: ống không đi qua icon theo thứ tự 01 -> 12 (${r.pipe.order.map(Math.round)})`);
      ok(r.pipe.turns.every((t) => t <= 30), `${tag}: chỗ vòng giữa các làn không nằm sát mép đúng chiều (cách mép ${r.pipe.turns}px)`);
      ok(r.pipe.cross.length === 0, `${tag}: ống cắt qua chữ: ${r.pipe.cross}`);
    }
    if (w > 700) for (const [i, ln] of r.lanes.entries()) {
      const inc = ln.dir.every((x, k, a) => k === 0 || x > a[k - 1]), dec = ln.dir.every((x, k, a) => k === 0 || x < a[k - 1]);
      ok(i % 2 === 0 ? inc : dec, `${tag}: làn ${i + 1} phải chạy ${i % 2 === 0 ? 'trái -> phải' : 'phải -> trái'} (x tâm icon ${ln.dir})`);
    }
    for (const [i, ln] of r.lanes.entries()) {
      ok(ln.steps.every((o) => o > 0.99), `${tag}: làn ${i + 1} có bước chưa hiện đủ ${ln.steps}`);
      if (rm) ok(ln.all === 0, `${tag}: làn ${i + 1} vẫn còn animation (${ln.all})`);
      else ok(!ln.out, `${tag}: làn ${i + 1} có bước tràn khỏi làn`);
    }
    if (rm) ok(!r.orbShown, `${tag}: reduced-motion vẫn hiện cục sáng`);
    else {
      ok(r.orbShown, `${tag}: không thấy cục sáng chạy`);
      // theo dõi trong trang 2.7s: vị trí cục sáng và số icon đang sáng ở từng khung hình
      const t = await evaluate(`new Promise((res) => { const f = document.querySelector('#projects .pjf'), o = f.querySelector('.pjf-orb'), seen = new Set(), lit = new Set(); let far = 0; const t0 = performance.now();
        (function tick() { const r = o.getBoundingClientRect(); seen.add(Math.round(r.left) + ',' + Math.round(r.top)); f.querySelectorAll('.pjf-row>li.on').forEach((li) => { lit.add([...f.querySelectorAll('.pjf-row>li')].indexOf(li)); const c = li.querySelector('.pjf-ic').getBoundingClientRect(); far = Math.max(far, Math.hypot(c.left + c.width / 2 - r.left - r.width / 2, c.top + c.height / 2 - r.top - r.height / 2)); });
          if (performance.now() - t0 < 2700) requestAnimationFrame(tick); else res({ seen: seen.size, lit: [...lit], far: Math.round(far) }); })(); })`);
      const seen = { size: t.seen }, lit = t.lit.length;
      ok(seen.size >= 5, `${tag}: cục sáng không chạy liên tục (chỉ ${seen.size} vị trí khác nhau sau 2.7s)`);
      ok(lit >= 3, `${tag}: trong 2.7s chỉ ${lit} icon sáng (cần >= 3 icon sáng lần lượt khi cục sáng đi qua)`);
      ok(t.far <= 34, `${tag}: icon sáng khi cục sáng còn ở xa ${t.far}px`);
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
    console.log(`PASS browser-work-flow: ${checks} lượt (JA/EN/VI, 1280 / 900 / 390px + 2 lượt reduced-motion): 1 đường ống liền qua tâm 12 icon theo thứ tự, ziczac A trái->phải / B phải->trái / C trái->phải / D phải->trái, không cắt chữ, cục sáng chạy liên tục, icon sáng khi được đi qua, reduced-motion đứng yên, không tràn, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
