// Task edof: 2 kim tự tháp động ở #ai-pyramid (tab AI), đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 4 bề rộng (reduced-motion): 2 tháp hiện, đủ 3 tầng sáng, chú giải không tràn cột / không ngắt giữa từ,
//    tháp không đè chú giải, màn hẹp xếp 1 cột, chỉ phụ đề tổng kết hiện, không tràn ngang.
// 2) Có chuyển động (1280): trong 1 chu kỳ lần lượt hiện đủ 4 phụ đề (mỗi lúc 1), vệt quét AI và hạt thời gian có lúc hiện,
//    tầng đỉnh có lúc còn tối rồi sáng; nút dừng làm đứng hình; cuộn ra khỏi màn hình thì .is-off.
// 3) Bản in A4: tháp hiện tĩnh, trang không bị cắt. 0 lỗi JS.
// Chạy: node tests/browser-ai-pyramid.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'pyr-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const f = document.querySelector('#ai-pyramid .pyr'); const fr = f.getBoundingClientRect();
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const cols = [...f.querySelectorAll('.py-col')].map((c) => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
  const over = [], broken = [], hit = [];
  for (const c of f.querySelectorAll('.py-col')) {
    const cr = c.getBoundingClientRect(); const sv = c.querySelector('.py-svg').getBoundingClientRect(); const lg = c.querySelector('.py-leg').getBoundingClientRect();
    if (sv.bottom > lg.top + 1) hit.push('tháp đè chú giải');
    for (const e of c.querySelectorAll('.py-nm,.py-tk,.py-hd')) { if (!vis(e)) continue; const r = e.getBoundingClientRect();
      if (r.left < cr.left - 1 || r.right > cr.right + 1) over.push(e.textContent.slice(0, 30));
      const n = e.firstChild; const re = /[A-Za-zÀ-ỹ0-9][A-Za-zÀ-ỹ0-9'’-]*/g; let m;
      while ((m = re.exec(n.nodeValue))) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        if (new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top))).size > 1) broken.push(m[0]); } }
  }
  for (const e of f.querySelectorAll('.mv-cap')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.left < fr.left - 1 || r.right > fr.right + 1 || r.bottom > fr.bottom + 1) over.push('cap ' + e.className); }
  const caps = [...f.querySelectorAll('.mv-cap')].filter((e) => vis(e) && +getComputedStyle(e).opacity > 0.5).map((e) => e.className.match(/py-c\\d/)[0]);
  const lit = [...f.querySelectorAll('.py-col--gen .py-lt')].map((e) => +getComputedStyle(e).opacity);
  const op = (s) => Math.max(0, ...[...f.querySelectorAll(s)].map((e) => +getComputedStyle(e).opacity));
  const imgs = [...f.querySelectorAll('image')].length;
  return { w: Math.round(fr.width), h: Math.round(fr.height), cols, over, broken, hit, caps, lit, scan: op('.py-scan'), fly: op('.py-fly'), glow: op('.py-gl'),
    imgs, off: f.classList.contains('is-off'), paused: f.classList.contains('is-paused'), overflowX: document.documentElement.scrollWidth - innerWidth };
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
  const shot = async (name) => { if (!SHOT) return; const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64')); };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce, media = '') => {
    await send('Emulation.setEmulatedMedia', { media, features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(document.querySelector('#ai-pyramid .pyr').scrollIntoView({block:'center'}), new Promise((r) => setTimeout(r, 1200)))`);
  };
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 900, 390, 340]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#ai-pyramid`, w, true);
      const r = await evaluate(PROBE); checks++;
      ok(r.cols.length === 2, `${tag}: cần 2 tháp`);
      if (w >= 900) ok(Math.abs(r.cols[0][1] - r.cols[1][1]) < 2 && r.cols[0][2] <= r.cols[1][0] + 1, `${tag}: màn rộng 2 tháp phải cạnh nhau`);
      else ok(r.cols[1][1] >= r.cols[0][3] - 1, `${tag}: màn hẹp 2 tháp phải xếp dọc`);
      ok(!r.over.length, `${tag}: chữ tràn ${r.over.slice(0, 3).join(' | ')}`);
      ok(!r.broken.length, `${tag}: ngắt giữa từ ${r.broken.slice(0, 5).join(',')}`);
      ok(!r.hit.length, `${tag}: ${r.hit[0]}`);
      ok(r.lit.length === 3 && r.lit.every((v) => v > 0.95), `${tag}: reduced-motion cần 3 tầng sáng (${r.lit})`);
      ok(r.caps.join() === 'py-c4', `${tag}: reduced-motion chỉ hiện phụ đề tổng kết (đang ${r.caps})`);
      ok(r.scan === 0 && r.fly === 0, `${tag}: reduced-motion không có vệt quét / hạt bay`);
      ok(r.imgs === 10, `${tag}: cần 10 icon trong 2 tháp (đang ${r.imgs})`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w === 1280 || w === 390) await shot(`pyr-${lang}-${w}.png`);
    }
  }
  // Chuyển động thật: lấy mẫu 13s (hơn 1 chu kỳ 12s)
  await go(`${pageUrl}?lang=vi#ai-pyramid`, 1280, false);
  const seen = await evaluate(`new Promise((res) => { const s = { caps: new Set(), multi: 0, scan: 0, fly: 0, glow: 0, darkTop: 1, litTop: 0 }; const t0 = Date.now();
    (function tick() { const r = (${PROBE}); r.caps.forEach((c) => s.caps.add(c)); if (r.caps.length > 1) s.multi++;
      s.scan = Math.max(s.scan, r.scan); s.fly = Math.max(s.fly, r.fly); s.glow = Math.max(s.glow, r.glow);
      s.darkTop = Math.min(s.darkTop, r.lit[2]); s.litTop = Math.max(s.litTop, r.lit[2]);
      if (Date.now() - t0 > 13000) res({ ...s, caps: [...s.caps].sort() }); else setTimeout(tick, 80); })(); })`); checks++;
  ok(seen.caps.join() === 'py-c1,py-c2,py-c3,py-c4', `chuyển động: phải lần lượt hiện đủ 4 phụ đề (thấy ${seen.caps})`);
  ok(seen.multi <= 3, `chuyển động: có ${seen.multi} lần 2 phụ đề cùng hiện rõ`);
  ok(seen.scan > 0.5 && seen.fly > 0.5 && seen.glow > 0.5, `chuyển động: vệt quét / hạt bay / tầng đỉnh phát sáng chưa hiện (${seen.scan}, ${seen.fly}, ${seen.glow})`);
  ok(seen.darkTop < 0.3 && seen.litTop > 0.95, `chuyển động: tầng đỉnh phải tối rồi sáng (${seen.darkTop} -> ${seen.litTop})`);
  // chờ tới cảnh tầng đỉnh (phụ đề 3) để chụp khung có hạt bay
  await evaluate(`new Promise((r) => { const t0 = Date.now(); (function w() { if ((${PROBE}).caps.includes('py-c3') || Date.now() - t0 > 13000) r(1); else setTimeout(w, 60); })(); })`);
  await sleep(1000); await shot('pyr-vi-1280-motion.png');
  // Nút dừng: đứng hình
  await evaluate(`document.querySelector('#ai-pyramid .mv-pp').click()`);
  const a1 = await evaluate(`document.querySelector('#ai-pyramid .py-t1').getAnimations()[0]?.currentTime`); await sleep(600);
  const a2 = await evaluate(`[document.querySelector('#ai-pyramid .py-t1').getAnimations()[0]?.currentTime, document.querySelector('#ai-pyramid .mv-pp').getAttribute('aria-pressed')]`); checks++;
  ok(a1 != null && Math.abs(a2[0] - a1) < 50 && a2[1] === 'true', `nút dừng: chuyển động chưa dừng (${a1} -> ${a2[0]}, aria ${a2[1]})`);
  // Ra khỏi màn hình: .is-off
  await evaluate(`(document.querySelector('#ai-people').scrollIntoView(), new Promise((r) => setTimeout(r, 600)))`);
  const off = await evaluate(`document.querySelector('#ai-pyramid .pyr').classList.contains('is-off')`); checks++;
  ok(off, 'ra khỏi màn hình: phim chưa dừng (.is-off)');
  // Bản in
  for (const lang of ['ja', 'vi']) {
    await go(`${pageUrl}?lang=${lang}#ai-pyramid`, 794, false, 'print');
    const p = await evaluate(`(() => { const s = document.getElementById('ai-pyramid'); const f = s.querySelector('.pyr');
      return { disp: getComputedStyle(f).display, cut: s.scrollHeight - s.clientHeight, lit: [...f.querySelectorAll('.py-lt')].every((e) => +getComputedStyle(e).opacity > .95) }; })()`); checks++;
    ok(p.disp === 'block' && p.lit, `in/${lang}: kim tự tháp phải hiện tĩnh đủ tầng (${p.disp}, lit ${p.lit})`);
    ok(p.cut <= 1, `in/${lang}: trang #ai-pyramid bị cắt ${p.cut}px`);
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ai-pyramid (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-ai-pyramid: ${checks} lượt (3 ngôn ngữ x 4 bề rộng + chuyển động + nút dừng + ra khỏi màn hình + in): 2 tháp x 3 tầng, chữ không tràn / ngắt từ, 4 phụ đề lần lượt, vệt quét AI, hạt bay, đỉnh phát sáng, in tĩnh không cắt, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
