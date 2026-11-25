// Task g9d5: tab "IT Knowledge" (4 trang) + menu không còn chữ "Task", đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): vào #it-top thì tab IT sáng, 4 trang hiện, khối nội dung không vượt đáy tờ,
//    chữ trong thẻ / tầng không tràn, thẻ cùng hàng thẳng mép trên, không tràn ngang, reduced-motion hiện đủ và đứng yên.
// 2) Có chuyển động (1280): lưới ngôn ngữ chạy hrRise; sơ đồ 4 tầng: điểm request chạy dọc (itRun), 4 tầng sáng lần lượt (itLit),
//    điểm nằm trong khung sơ đồ và thực sự di chuyển.
// 3) Menu hiển thị không còn chữ "Task", 0 lỗi JS.
// Chạy: node tests/browser-it-tab.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'it-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['it-top', 'it-stack', 'it-arch', 'it-change'];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1; };
  const main = document.querySelector('main[data-view="it"]');
  const over = [], bottom = [], rows = [];
  for (const [sel, boxSel] of [['.hr-c h3,.hr-c p,.hr-ic', '.hr-c'], ['.hr-st h3,.hr-st p,.hr-st img', '.hr-st'], ['.hr-g .card h3,.hr-g .lines', '.card'], ['.meta b', '.meta>div'], ['.it-k h3,.it-k p,.it-k .lbl', '.it-k'], ['.it-ly b,.it-ly span,.it-ly img', '.it-ly'], ['.it-p b,.it-p .it-p-t,.it-p .lbl', '.it-p']])
    for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
  for (const pg of main.querySelectorAll('.pg')) {
    const pb = pg.getBoundingClientRect().bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
      const cb = c.getBoundingClientRect().bottom; if (cb > pb + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
  }
  for (const grid of main.querySelectorAll('.hr-ar,.hr-fl,.hr-g,.it-lg,.it-pf')) {
    // gom thẻ theo hàng (đỉnh cách nhau < 30px là cùng hàng), trong 1 hàng các đỉnh phải trùng nhau
    const tops = [...grid.children].filter(vis).map((c) => c.getBoundingClientRect().top).sort((a, b) => a - b);
    let row = [];
    for (const t of tops.concat(Infinity)) {
      if (row.length && t - row[0] >= 30) { const d = row[row.length - 1] - row[0]; if (d > 1) rows.push(grid.className + ' lệch ' + Math.round(d) + 'px'); row = []; }
      row.push(t);
    }
  }
  return { view: document.body.dataset.view, on: document.querySelector('.top-nav a.on')?.dataset.view,
    sb: !document.querySelector('.sb-nav[data-for="it"]').hidden,
    navTask: [...document.querySelectorAll('.top-nav a')].map((a) => a.textContent.trim()).filter((t) => /task/i.test(t)),
    anim: document.getAnimations().filter((a) => /^(it|hr)/.test(a.animationName || '') && main.contains(a.effect && a.effect.target)).length,
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, bottom, rows,
    hidden: [...main.querySelectorAll('.hr-c,.hr-st,.hr-g .card,.it-k,.it-ly,.it-p')].filter((e) => +getComputedStyle(e).opacity < 0.95).length,
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
      await go(`${pageUrl}?lang=${lang}&mode=pdf#it-top`, w, true);
      await reveal('main[data-view="it"] .pg');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'it' && r.on === 'it' && r.sb, `${tag}: tab IT chưa bật (view ${r.view}, menu ${r.on}, sidebar ${r.sb})`);
      ok(r.pages === 4, `${tag}: cần 4 trang IT, đang ${r.pages}`);
      ok(!r.navTask.length, `${tag}: menu còn chữ Task: ${r.navTask.join(' | ')}`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động trong tab IT`);
      ok(!r.over.length, `${tag}: chữ tràn thẻ ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.rows.length, `${tag}: thẻ cùng hàng lệch mép trên ${r.rows.slice(0, 3).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} khối mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w !== 820) for (const s of PAGES) await shot(`it-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Chuyển động thật: lưới ngôn ngữ nảy lên; sơ đồ: điểm request chạy, 4 tầng sáng lần lượt
  await go(`${pageUrl}?lang=ja&mode=pdf#it-stack`, 1280, false);
  await evaluate(`(document.querySelector('#it-stack .it-lg').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const m1 = await evaluate(`(() => { const b = document.querySelector('#it-stack .it-lg'); return { inn: b.classList.contains('sr-in'),
    rise: document.getAnimations().filter((a) => a.animationName === 'hrRise' && b.contains(a.effect.target)).length }; })()`); checks++;
  ok(m1.inn && m1.rise === 8, `chuyển động: lưới ngôn ngữ vào khung mà chưa chạy hrRise cho 8 thẻ (${JSON.stringify(m1)})`);
  await sleep(2000);
  const m2 = await evaluate(`[...document.querySelectorAll('#it-stack .it-k')].filter((e) => +getComputedStyle(e).opacity > 0.99).length`); checks++;
  ok(m2 === 8, `chuyển động: sau khi chạy còn thẻ ngôn ngữ chưa hiện đủ (${m2}/8)`);
  await evaluate(`(document.querySelector('#it-arch .it-sys').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const sysProbe = `(() => { const s = document.querySelector('#it-arch .it-sys'), d = s.querySelector('.it-dot'), r = d.getBoundingClientRect(), b = s.getBoundingClientRect();
    const an = document.getAnimations().filter((a) => s.contains(a.effect && a.effect.target));
    return { inn: s.classList.contains('sr-in'), run: an.filter((a) => a.animationName === 'itRun').length, lit: an.filter((a) => a.animationName === 'itLit').length,
      y: r.top - b.top, inBox: r.top >= b.top - 8 && r.bottom <= b.bottom + 8 && r.left >= b.left - 8 && r.right <= b.right + 8 }; })()`;
  const s1 = await evaluate(sysProbe); await sleep(1500); const s2 = await evaluate(sysProbe); checks++;
  ok(s1.inn && s1.run === 1 && s1.lit === 4, `sơ đồ: cần 1 itRun + 4 itLit khi vào khung (${JSON.stringify(s1)})`);
  ok(s1.inBox && s2.inBox, `sơ đồ: điểm request ra ngoài khung (${JSON.stringify([s1, s2])})`);
  ok(Math.abs(s2.y - s1.y) > 20, `sơ đồ: điểm request không di chuyển (${Math.round(s1.y)} -> ${Math.round(s2.y)})`);
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-it-tab (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-it-tab: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): menu không còn chữ Task, tab IT 4 trang, chữ không tràn, không vượt đáy tờ, thẻ cùng hàng thẳng mép, sơ đồ có điểm request chạy và 4 tầng sáng, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
