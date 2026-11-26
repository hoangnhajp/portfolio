// Task 4ubf: tab "Task: HR" (4 trang) đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): vào #hr-top thì tab HR sáng, 4 trang hiện, khối nội dung không vượt đáy tờ,
//    chữ trong thẻ không tràn thẻ, thẻ cùng hàng thẳng mép trên, không tràn ngang, reduced-motion hiện đủ.
// 2) Có chuyển động (1280): khối vào khung thì thẻ / bước chạy hrRise rồi hiện đủ (opacity 1).
// 3) 0 lỗi JS.
// Chạy: node tests/browser-hr-tab.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'hr-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['hr-top', 'hr-hire', 'hr-people', 'hr-ops', 'hr-dept', 'hr-qa', 'hr-care', 'hr-cb']; // task o98x: thêm 4 trang 04-07

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1; };
  const main = document.querySelector('main[data-view="hr"]');
  const over = [], bottom = [], rows = [];
  for (const [sel, boxSel] of [['.hr-c h3,.hr-c p,.hr-ic', '.hr-c'], ['.hr-st h3,.hr-st p,.hr-st img', '.hr-st'], ['.hr-g .card h3,.hr-g .lines', '.card'], ['.meta b', '.meta>div'],
    ['.hx-dp b,.hx-dp p,.hx-dp img', '.hx-dp'], ['.hx-out b,.hx-out small,.hx-pd b,.hx-pd small,.hx-ck b,.hx-ck small,.hx-tl b,.hx-tl small,.hx-pay b', 'li']])
    for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
  // nhãn năm dưới thước tháng (#hr-cb) không chồng nhau
  const ya = [...main.querySelectorAll('.hx-ya span')].filter(vis).map((e) => e.getBoundingClientRect()).sort((a, b) => a.left - b.left);
  for (let k = 1; k < ya.length; k++) if (ya[k].left < ya[k - 1].right + 4) over.push('.hx-ya: nhãn năm chồng nhau');
  for (const pg of main.querySelectorAll('.pg')) {
    const pb = pg.getBoundingClientRect().bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
      const cb = c.getBoundingClientRect().bottom; if (cb > pb + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
  }
  for (const grid of main.querySelectorAll('.hr-ar,.hr-fl,.hr-g,.hx-out,.hx-ck,.hx-pay,.hx-tl ol')) {
    // gom thẻ theo hàng (đỉnh cách nhau < 30px là cùng hàng), trong 1 hàng các đỉnh phải trùng nhau
    const tops = [...grid.children].filter(vis).map((c) => c.getBoundingClientRect().top).sort((a, b) => a - b);
    let row = [];
    for (const t of tops.concat(Infinity)) {
      if (row.length && t - row[0] >= 30) { const d = row[row.length - 1] - row[0]; if (d > 1) rows.push(grid.className + ' lệch ' + Math.round(d) + 'px'); row = []; }
      row.push(t);
    }
  }
  return { view: document.body.dataset.view, on: document.querySelector('.top-nav a.on')?.dataset.view,
    sb: !document.querySelector('.sb-nav[data-for="hr"]').hidden,
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, bottom, rows,
    hidden: [...main.querySelectorAll('.hr-c,.hr-st,.hr-g .card,.hx-dp,.hx-out li,.hx-pd li,.hx-ck li,.hx-tl li,.hx-pay li,.pg>.rv')].filter((e) => vis(e) && +getComputedStyle(e).opacity < 0.95).length,
    overflowX: document.documentElement.scrollWidth - innerWidth,
    // task o98x: chiều cao tờ (khung 794x1123 ở bề rộng desktop) + số animation đang chạy trong khối hx-*
    tall: innerWidth >= 1000 ? [...main.querySelectorAll('.pg')].filter((p) => p.offsetHeight > 1124).map((p) => p.id + ' ' + p.offsetHeight + 'px') : [],
    hxAnim: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.parentElement && a.effect.target.parentElement.closest('.hx-hub,.hx-out,.hx-qa,.hx-ck,.hx-tl,.hx-pay,.hx-yr')).length };
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
      await go(`${pageUrl}?lang=${lang}&mode=pdf#hr-top`, w, true);
      await reveal('main[data-view="hr"] .pg');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'hr' && r.on === 'hr' && r.sb, `${tag}: tab HR chưa bật (view ${r.view}, menu ${r.on}, sidebar ${r.sb})`);
      ok(r.pages === PAGES.length, `${tag}: cần ${PAGES.length} trang HR, đang ${r.pages}`);
      ok(!r.over.length, `${tag}: chữ tràn thẻ ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.rows.length, `${tag}: thẻ cùng hàng lệch mép trên ${r.rows.slice(0, 3).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} khối mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      ok(!r.tall.length, `${tag}: tờ HR cao quá 1123px ${r.tall.join(' | ')}`);
      ok(r.hxAnim === 0, `${tag}: reduced-motion còn ${r.hxAnim} animation trong khối hx-*`);
      if (w !== 820) for (const s of PAGES) await shot(`hr-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Chuyển động thật: vào khung thì chạy, xong thì hiện đủ
  await go(`${pageUrl}?lang=ja&mode=pdf#hr-hire`, 1280, false);
  await evaluate(`(document.querySelector('#hr-hire .hr-fl').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const m1 = await evaluate(`(() => { const b = document.querySelector('#hr-hire .hr-fl'); const an = document.getAnimations().filter((a) => a.effect && a.effect.target && b.contains(a.effect.target) && /^hr/.test(a.animationName || ''));
    return { inn: b.classList.contains('sr-in'), rise: an.filter((a) => a.animationName === 'hrRise').length, pop: an.filter((a) => a.animationName === 'hrPop').length }; })()`); checks++;
  ok(m1.inn && m1.rise === 6 && m1.pop === 6,`chuyển động: tiến trình tuyển dụng vào khung mà chưa chạy hrRise / hrPop (${JSON.stringify(m1)})`);
  await sleep(2200);
  const m2 = await evaluate(`[...document.querySelectorAll('#hr-hire .hr-st')].filter((e) => +getComputedStyle(e).opacity > 0.99).length`); checks++;
  ok(m2 === 6, `chuyển động: sau khi chạy còn bước chưa hiện đủ (${m2}/6)`);
  // 3) task o98x: 4 trang mới, khối vào khung thì chạy đúng hình động (tia phòng ban, vòng PDCA, mốc theo dõi, 53 vạch tháng 02/2022-06/2026)
  const WANT = [['#hr-dept .hx-hub', { hxGrow: 4, hxRun: 4 }], ['#hr-qa .hx-qa', { hxSpin: 1, hxLit: 8 }],
    ['#hr-care .hx-tl', { hxFill: 1, hxTrack: 1, hrPop: 6 }], ['#hr-cb .hx-yr', { hxTick: 53, hrPop: 5 }], ['#hr-cb .hx-pay', { hxWave: 5 }]];
  for (const [sel, want] of WANT) {
    await evaluate(`(document.querySelector('${sel}').scrollIntoView({ block: 'center', behavior: 'instant' }), new Promise((r) => setTimeout(r, 500)))`);
    const got = await evaluate(`(() => { const b = document.querySelector('${sel}'); const c = {}; for (const a of document.getAnimations())
      if (a.effect && a.effect.target && b.contains(a.effect.target)) c[a.animationName] = (c[a.animationName] || 0) + 1; return { inn: b.classList.contains('sr-in'), c }; })()`); checks++;
    ok(got.inn && Object.entries(want).every(([k, v]) => (got.c[k] || 0) >= v), `chuyển động ${sel}: cần ${JSON.stringify(want)}, có ${JSON.stringify(got)}`);
  }
  await sleep(3200);
  const m3 = await evaluate(`[...document.querySelectorAll('#hr-cb .hx-mo i')].filter((e) => +getComputedStyle(e).opacity > 0.99).length`); checks++;
  ok(m3 === 53, `chuyển động: 53 vạch tháng chưa sáng đủ (${m3}/53)`);
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-hr-tab (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-hr-tab: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): tab HR ${PAGES.length} trang, chữ không tràn thẻ, không vượt đáy tờ, thẻ cùng hàng thẳng mép, chạy khi vào khung, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
