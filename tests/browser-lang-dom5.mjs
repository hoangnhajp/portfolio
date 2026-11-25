// Task dom5: đo trên Chrome headless thật (CDP) tiến trình 6 bước #lang-ja: mỗi đoạn nối nét đứt nằm GIỮA 2 icon kề nhau
// (bắt đầu sau mép icon này, dừng trước mép icon kế, không chạm / xuyên icon nào), đúng trục tâm icon, mũi tên chạm cuối đoạn.
// 3 ngôn ngữ x 4 bề rộng (1280 / 1000 ngang, 820 / 390 dọc), reduced-motion; rồi có chuyển động: 10 animation lgSeg chạy, 0 lỗi JS.
// Chạy: node tests/browser-lang-dom5.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'dom5-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Toạ độ đoạn nối = hộp li + left/top/width/height đã tính của ::after (px); mũi tên = tâm hộp ::before (8x8 trước khi xoay) + 4*sqrt2 theo hướng.
const PROBE = `(() => {
  const lis = [...document.querySelectorAll('#lang-ja .lg-tk')];
  const ic = lis.map((li) => li.querySelector('img').getBoundingClientRect());
  const segs = lis.map((li, i) => {
    const a = getComputedStyle(li, '::after'), b = getComputedStyle(li, '::before'), r = li.getBoundingClientRect();
    if (a.content === 'none' || a.display === 'none') return null;
    const L = r.left + parseFloat(a.left), T = r.top + parseFloat(a.top), W = parseFloat(a.width), H = parseFloat(a.height);
    const bx = r.left + parseFloat(b.left) + 4, by = r.top + parseFloat(b.top) + 4;
    return { i, l: L, t: T, r: L + W, b: T + H, w: W, h: H, dashed: /repeating-linear-gradient/.test(a.backgroundImage), op: +a.opacity, arrow: [bx, by] };
  });
  return { n: lis.length, ic: ic.map((q) => ({ l: q.left, t: q.top, r: q.right, b: q.bottom, cx: (q.left + q.right) / 2, cy: (q.top + q.bottom) / 2 })), segs,
    oldLine: ['::before', '::after'].map((p) => getComputedStyle(document.querySelector('#lang-ja .lg-tks'), p).content).filter((c) => c !== 'none').length,
    x: document.documentElement.scrollWidth - innerWidth };
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
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
    if (m.method === 'Page.loadEventFired' && loaded) loaded();
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  const shot = async (name) => {
    if (!SHOT) return;
    const clip = await evaluate(`(() => { const r = document.querySelector('#lang-ja .lg-track').getBoundingClientRect(); return { x: 0, y: r.top + scrollY - 10, width: innerWidth, height: r.height + 20, scale: 1 }; })()`);
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip }); writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(document.querySelector('#lang-ja .lg-track').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 1200)))`);
  };

  const GAP = 3; // khoảng hở tối thiểu giữa đầu đoạn nối và mép icon
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 1000, 820, 390]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#lang-ja`, w, true);
      const r = await evaluate(PROBE); checks++;
      ok(r.n === 6, `${tag}: cần 6 bước, đang ${r.n}`);
      ok(r.oldLine === 0, `${tag}: còn vạch liền .lg-tks::before/::after xuyên icon`);
      ok(r.segs[5] === null, `${tag}: bước cuối không được có đoạn nối`);
      ok(r.x <= 1, `${tag}: tràn ngang ${r.x}px`);
      const horiz = w > 900;
      for (let i = 0; i < 5; i++) {
        const s = r.segs[i], a = r.ic[i], b = r.ic[i + 1];
        if (!s) { ok(false, `${tag}: thiếu đoạn nối ${i + 1} -> ${i + 2}`); continue; }
        ok(s.dashed, `${tag}: đoạn ${i + 1} không phải nét đứt`);
        ok(s.op >= 0.99, `${tag}: reduced-motion đoạn ${i + 1} còn mờ (${s.op})`);
        // không đoạn nào được chồng lên bất kỳ icon nào
        const hit = r.ic.findIndex((q) => s.l < q.r && s.r > q.l && s.t < q.b && s.b > q.t);
        ok(hit < 0, `${tag}: đoạn ${i + 1} đi xuyên icon ${hit + 1}`);
        if (horiz) {
          ok(s.l >= a.r + GAP && s.r <= b.l - GAP && s.w >= 8, `${tag}: đoạn ${i + 1} phải nằm giữa mép phải icon ${i + 1} (${a.r.toFixed(1)}) và mép trái icon ${i + 2} (${b.l.toFixed(1)}), đang ${s.l.toFixed(1)}..${s.r.toFixed(1)}`);
          ok(Math.abs((s.t + s.b) / 2 - a.cy) <= 1.5 && Math.abs(a.cy - b.cy) <= 1.5, `${tag}: đoạn ${i + 1} lệch trục tâm icon (${((s.t + s.b) / 2).toFixed(1)} vs ${a.cy.toFixed(1)})`);
          ok(Math.abs(s.arrow[0] + 5.66 - s.r) <= 2.5 && Math.abs(s.arrow[1] - a.cy) <= 1.5, `${tag}: mũi tên ${i + 1} không chạm cuối đoạn (${s.arrow.map((v) => v.toFixed(1))} vs ${s.r.toFixed(1)})`);
        } else {
          ok(s.t >= a.b + GAP && s.b <= b.t - GAP && s.h >= 8, `${tag}: đoạn dọc ${i + 1} phải nằm giữa đáy icon ${i + 1} (${a.b.toFixed(1)}) và đỉnh icon ${i + 2} (${b.t.toFixed(1)}), đang ${s.t.toFixed(1)}..${s.b.toFixed(1)}`);
          ok(Math.abs((s.l + s.r) / 2 - a.cx) <= 1.5 && Math.abs(a.cx - b.cx) <= 1.5, `${tag}: đoạn dọc ${i + 1} lệch trục tâm icon`);
          ok(Math.abs(s.arrow[1] + 5.66 - s.b) <= 2.5 && Math.abs(s.arrow[0] - a.cx) <= 1.5, `${tag}: mũi tên dọc ${i + 1} không chạm cuối đoạn`);
        }
      }
      if ((lang === 'vi' || lang === 'ja') && (w === 1280 || w === 390)) await shot(`dom5-${lang}-${w}.png`);
    }
  }
  // Có chuyển động: 5 đoạn + 5 mũi tên chạy lgSeg, đoạn sáng lần lượt (không cùng lúc sáng hết)
  await go(`${pageUrl}?lang=vi#lang-ja`, 1280, false);
  const mv = await evaluate(`new Promise((res) => { const lis = [...document.querySelectorAll('#lang-ja .lg-tk')].slice(0, 5); const seen = new Set(); let allLit = 0; const t0 = Date.now();
    (function tick() { const op = lis.map((li) => +getComputedStyle(li, '::after').opacity); const lit = op.map((o, i) => o > 0.9 ? i : -1).filter((i) => i >= 0);
      lit.forEach((i) => seen.add(i)); if (lit.length === 5) allLit++;
      if (Date.now() - t0 > 7400) res({ seen: [...seen].sort().join(), allLit, run: document.getAnimations().filter((a) => a.animationName === 'lgSeg' && a.playState === 'running').length }); else setTimeout(tick, 80); })(); })`); checks++;
  ok(mv.run === 10, `chuyển động: cần 10 animation lgSeg đang chạy (5 đoạn + 5 mũi tên), đang ${mv.run}`);
  ok(mv.seen === '0,1,2,3,4', `chuyển động: 5 đoạn phải lần lượt sáng (đã sáng ${mv.seen})`);
  ok(mv.allLit === 0, `chuyển động: 5 đoạn không được sáng cùng lúc (${mv.allLit} khung)`);
  await shot('dom5-vi-1280-motion.png');
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-lang-dom5 (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-lang-dom5: ${checks} lượt (3 ngôn ngữ x 4 bề rộng + chuyển động): 5 đoạn nét đứt nằm giữa từng cặp icon, không xuyên icon nào, đúng trục tâm, mũi tên chạm cuối đoạn; có chuyển động 10 lgSeg chạy, đoạn sáng lần lượt; 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
