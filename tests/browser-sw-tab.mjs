// Task g6pn: tab "Software Products" (4 trang) đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): vào #sw-top thì tab SW sáng, 4 trang hiện, mọi ảnh chụp màn hình tải được,
//    khối nội dung không vượt đáy tờ, chữ / ảnh không tràn thẻ, thẻ cùng hàng thẳng mép trên, không tràn ngang.
// 2) Có chuyển động (1280): khối ảnh vào khung thì chạy swRise rồi hiện đủ (opacity 1).
// 3) 0 lỗi JS.
// Chạy: node tests/browser-sw-tab.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sw-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['sw-top', 'sw-remote', 'sw-talent', 'sw-leads'];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1; };
  const main = document.querySelector('main[data-view="sw"]');
  const over = [], bottom = [], rows = [];
  for (const [sel, boxSel] of [['.sw-p h3,.sw-p p,.sw-p img', '.sw-p'], ['.hr-st h3,.hr-st p,.hr-st img', '.hr-st'], ['.sw-shot img,.sw-shot figcaption span', '.sw-shot'], ['.sw-fn h3,.sw-fn p', 'li']])
    for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
  for (const pg of main.querySelectorAll('.pg')) {
    const pb = pg.getBoundingClientRect().bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
      const cb = c.getBoundingClientRect().bottom; if (cb > pb + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
  }
  for (const grid of main.querySelectorAll('.sw-pr,.hr-fl,.sw-gal,.sw-fn')) {
    // gom thẻ theo hàng (đỉnh cách nhau < 30px là cùng hàng), trong 1 hàng các đỉnh phải trùng nhau
    const tops = [...grid.children].filter(vis).map((c) => c.getBoundingClientRect().top).sort((a, b) => a - b);
    let row = [];
    for (const t of tops.concat(Infinity)) {
      if (row.length && t - row[0] >= 30) { const d = row[row.length - 1] - row[0]; if (d > 1) rows.push(grid.className + ' lệch ' + Math.round(d) + 'px'); row = []; }
      row.push(t);
    }
  }
  return { view: document.body.dataset.view, on: document.querySelector('.top-nav a.on')?.dataset.view,
    sb: !document.querySelector('.sb-nav[data-for="sw"]').hidden,
    imgs: [...main.querySelectorAll('img')].length, broken: [...main.querySelectorAll('img')].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')),
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, bottom, rows,
    hidden: [...main.querySelectorAll('.sw-p,.hr-st,.sw-shot,.sw-fn li')].filter((e) => +getComputedStyle(e).opacity < 0.95).length,
    overflowX: document.documentElement.scrollWidth - innerWidth };
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
  const shot = async (name, sel) => {
    if (!SHOT) return;
    const clip = await evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height, scale: 1 }; })()`);
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const reveal = (sel) => evaluate(`(async () => { for (const s of document.querySelectorAll('${sel}')) { s.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 450)); } return 1; })()`);

  // 1) Bố cục, reduced-motion
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}&mode=pdf#sw-top`, w, true);
      await reveal('main[data-view="sw"] .pg');
      await evaluate(`Promise.all([...document.querySelectorAll('main[data-view="sw"] img')].map((i) => (i.loading = 'eager', i.decode().catch(() => 0))))`);
      const r = await evaluate(PROBE); checks++;
      ok(r.imgs >= 16 && !r.broken.length, `${tag}: ảnh không tải được (${r.imgs} ảnh) ${r.broken.slice(0, 4).join(' | ')}`);
      ok(r.view === 'sw' && r.on === 'sw' && r.sb, `${tag}: tab SW chưa bật (view ${r.view}, menu ${r.on}, sidebar ${r.sb})`);
      ok(r.pages === 4, `${tag}: cần 4 trang SW, đang ${r.pages}`);
      ok(!r.over.length, `${tag}: chữ tràn thẻ ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.rows.length, `${tag}: thẻ cùng hàng lệch mép trên ${r.rows.slice(0, 3).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} khối mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w !== 820) for (const s of PAGES) await shot(`sw-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Chuyển động thật: vào khung thì chạy, xong thì hiện đủ
  await go(`${pageUrl}?lang=ja&mode=pdf#sw-remote`, 1280, false);
  await evaluate(`(document.querySelector('#sw-remote .sw-gal').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const m1 = await evaluate(`(() => { const b = document.querySelector('#sw-remote .sw-gal'); const an = document.getAnimations().filter((a) => a.effect && a.effect.target && b.contains(a.effect.target) && a.animationName === 'swRise');
    return { inn: b.classList.contains('sr-in'), rise: an.length, n: b.children.length }; })()`); checks++;
  ok(m1.inn && m1.rise === m1.n && m1.n === 5, `chuyển động: khối ảnh vào khung mà chưa chạy swRise (${JSON.stringify(m1)})`);
  await sleep(2200);
  const m2 = await evaluate(`[...document.querySelectorAll('#sw-remote .sw-shot')].filter((e) => +getComputedStyle(e).opacity > 0.99).length`); checks++;
  ok(m2 === 5, `chuyển động: sau khi chạy còn ảnh chưa hiện đủ (${m2}/5)`);
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sw-tab (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sw-tab: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): tab SW 4 trang, ảnh tải đủ, chữ / ảnh không tràn thẻ, không vượt đáy tờ, thẻ cùng hàng thẳng mép, chạy khi vào khung, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
