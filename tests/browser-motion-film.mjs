// Phim workflow 4.8s ở tab Team / AI (task 2fl9) trên Chrome headless thật (CDP), 3 ngôn ngữ x desktop / điện thoại:
// 1) animation đang chạy, chu kỳ 4..5 giây; 2) tại mốc dừng của từng bước, điểm chạy nằm đúng tâm ô bước đó (lệch <= 3px)
// và ô bước đã sáng; 3) mỗi lúc chỉ 1 phụ đề hiện; 4) không tràn ngang, chữ không lọt ra ngoài khung phim;
// 5) nút dừng: aria-pressed=true và animation dừng; 6) prefers-reduced-motion: không animation, mọi bước hiện sáng.
// Chạy: node tests/browser-motion-film.mjs [thư mục lưu ảnh]   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const shotDir = process.argv[2];
if (shotDir) mkdirSync(shotDir, { recursive: true });
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'mvf-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Đặt mọi animation trong phim về thời điểm t (ms) rồi đo
const PROBE = (sec, t) => `(() => {
  const f = document.querySelector('#${sec} .mv');
  if (!f || !f.getClientRects().length) return { missing: true };
  const anims = f.getAnimations({ subtree: true }).filter((a) => /^mv/.test(a.animationName || ''));
  const running = anims.filter((a) => a.playState === 'running').length;
  const durs = [...new Set(anims.map((a) => a.effect.getTiming().duration))];
  if (${t} >= 0) anims.forEach((a) => { a.pause(); a.currentTime = ${t}; });
  const fr = f.getBoundingClientRect(), tok = f.querySelector('.mv-tok').getBoundingClientRect();
  const nodes = [...f.querySelectorAll('.mv-node')].map((n) => {
    const d = n.querySelector('.mv-dot').getBoundingClientRect();
    return { cx: d.left + d.width / 2, lit: +getComputedStyle(n.querySelector('.mv-lit')).opacity };
  });
  const caps = [...f.querySelectorAll('.mv-cap')].filter((c) => c.getClientRects().length && +getComputedStyle(c).opacity > 0.5).map((c) => c.className.match(/mv-c\\d/)[0]);
  const outside = [...f.querySelectorAll('.mv-lb,.mv-chip,.mv-cap,.mv-tt,.mv-pp')].filter((e) => e.getClientRects().length)
    .filter((e) => { const r = e.getBoundingClientRect(); return r.left < fr.left - 1 || r.right > fr.right + 1; }).map((e) => e.textContent.trim().slice(0, 20));
  return { running, total: anims.length, durs, tokX: tok.left + tok.width / 2, tokOp: +getComputedStyle(f.querySelector('.mv-run')).opacity,
    nodes, caps, outside, fw: fr.width, overflowX: document.documentElement.scrollWidth - innerWidth };
})()`;

async function main() {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    try { port = readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch {}
  }
  if (!port) throw new Error('Chrome không mở cổng debug');
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); const errors = []; let loaded = null;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Page.loadEventFired' && loaded) loaded();
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  const shot = async (sec, name) => {
    if (!shotDir) return;
    await evaluate(`document.querySelector('#${sec} .mv').scrollIntoView({block:'center'})`); await sleep(60);
    const box = await evaluate(`(() => { const r = document.querySelector('#${sec} .mv').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: 1 }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: box, captureBeyondViewport: true });
    writeFileSync(join(shotDir, name + '.png'), Buffer.from(r.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, motion = 'no-preference') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(1200);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };

  // Mốc dừng của từng bước (theo keyframes mvRun, chu kỳ T): bước k sáng, điểm chạy ở tâm bước k, phụ đề mv-c(k)
  const HOLD = [0.12, 0.30, 0.48, 0.66, 0.85];
  for (const sec of ['team-top', 'ai-top']) {
    for (const lang of ['ja', 'en', 'vi']) {
      for (const w of [1280, 390]) {
        const tag = `${sec}/${lang}/${w}px`;
        await go(`${pageUrl}?lang=${lang}#${sec}`, w);
        const live = await evaluate(PROBE(sec, -1)); checks++;
        if (live.missing) { ok(false, `${tag}: không thấy phim .mv`); continue; }
        ok(live.total >= 15 && live.running === live.total, `${tag}: animation chưa chạy (${live.running}/${live.total})`);
        ok(live.durs.length === 1 && live.durs[0] >= 4000 && live.durs[0] <= 5000, `${tag}: chu kỳ không thống nhất 4..5s: ${live.durs}`);
        const T = live.durs[0];
        // Nút dừng / phát (đo trước khi test tự đặt currentTime)
        await evaluate(`(document.querySelector('#${sec} .mv-pp').click(), 1)`);
        const p = await evaluate(`(() => { const f = document.querySelector('#${sec} .mv'), b = f.querySelector('.mv-pp');
          const a = f.getAnimations({ subtree: true }).filter((x) => /^mv/.test(x.animationName || ''));
          return { pressed: b.getAttribute('aria-pressed'), paused: f.classList.contains('is-paused'), running: a.filter((x) => x.playState === 'running').length }; })()`); checks++;
        ok(p.pressed === 'true' && p.paused && p.running === 0, `${tag}: nút dừng không dừng được ${JSON.stringify(p)}`);
        const q = await evaluate(`(() => { const f = document.querySelector('#${sec} .mv'); f.querySelector('.mv-pp').click();
          return { pressed: f.querySelector('.mv-pp').getAttribute('aria-pressed'), running: f.getAnimations({ subtree: true }).filter((x) => x.playState === 'running').length }; })()`);
        ok(q.pressed === 'false' && q.running >= 15, `${tag}: bấm lần 2 không phát lại ${JSON.stringify(q)}`);
        // Cuộn khỏi màn hình: tự dừng; cuộn lại: chạy tiếp
        const cnt = `document.querySelector('#${sec} .mv').getAnimations({ subtree: true }).filter((x) => x.playState === 'running').length`;
        await evaluate(`scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`); await sleep(400);
        const off = await evaluate(cnt);
        await evaluate(`document.querySelector('#${sec} .mv').scrollIntoView({ block: 'center', behavior: 'instant' })`); await sleep(400);
        const on = await evaluate(cnt); checks++;
        ok(off === 0 && on >= 15, `${tag}: không tự dừng khi ra khỏi màn hình (ngoài: ${off}, trong: ${on})`);
        for (let k = 0; k < HOLD.length; k++) {
          const r = await evaluate(PROBE(sec, Math.round(HOLD[k] * T))); checks++;
          const dx = Math.abs(r.tokX - r.nodes[k].cx);
          ok(dx <= 3, `${tag} bước ${k + 1}: điểm chạy lệch tâm ô ${dx.toFixed(1)}px`);
          ok(r.tokOp > 0.9, `${tag} bước ${k + 1}: điểm chạy không hiện (opacity ${r.tokOp})`);
          ok(r.nodes.slice(0, k + 1).every((n) => n.lit > 0.9), `${tag} bước ${k + 1}: các ô đã đi qua chưa sáng ${JSON.stringify(r.nodes.map((n) => n.lit))}`);
          ok(r.nodes.slice(k + 1).every((n) => n.lit < 0.1), `${tag} bước ${k + 1}: ô chưa tới đã sáng`);
          ok(r.caps.length === 1 && r.caps[0] === `mv-c${k + 1}`, `${tag} bước ${k + 1}: phụ đề sai ${JSON.stringify(r.caps)}`);
          ok(r.outside.length === 0, `${tag}: chữ lọt khỏi khung phim ${r.outside.join(' | ')}`);
          ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
          if (lang === 'ja' || (lang === 'vi' && w === 390)) await shot(sec, `${sec}-${lang}-${w}-step${k + 1}`);
        }
      }
    }
    // Giảm chuyển động: không animation, mọi bước sáng, hiện phụ đề kết quả
    await go(`${pageUrl}?lang=ja#${sec}`, 1280, 'reduce');
    const rm = await evaluate(PROBE(sec, -1)); checks++;
    ok(rm.total === 0, `${sec}/reduce: vẫn còn ${rm.total} animation`);
    ok(rm.nodes.every((n) => n.lit > 0.9), `${sec}/reduce: không phải mọi bước đều sáng`);
    ok(rm.caps.length === 1 && rm.caps[0] === 'mv-c5', `${sec}/reduce: phụ đề tĩnh sai ${JSON.stringify(rm.caps)}`);
    await shot(sec, `${sec}-reduced-motion`);
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-motion-film (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-motion-film: ${checks} lượt đo, 0 lỗi JS; 2 phim x 3 ngôn ngữ x desktop/điện thoại: chạy chu kỳ 4..5s, điểm chạy khớp tâm 5 mốc, ô sáng đúng thứ tự, 1 phụ đề mỗi lúc, không tràn, nút dừng / phát, reduced-motion tĩnh`);
    process.exit(0);
  }, 300);
});
