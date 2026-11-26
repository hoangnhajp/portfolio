// Trang "sau khi ký hợp đồng" tab Sales (#sales-after MAYEKAWA, #sales-jil-after JILNESTA) + nhãn giai đoạn hợp đồng
// (#sales-cycle, #sales-jil-flow), đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 1280 / 820 / 390 (reduced-motion): nhãn giai đoạn hiện đúng 1 ngôn ngữ, nằm trong tờ, đoạn đang nói được tô sáng;
//    chữ không tràn khung (danh sách, chip, nhãn cảnh), khối không vượt đáy tờ, không tràn ngang, cảnh 4 bước hiện đủ.
// 2) Có chuyển động (1280): cảnh 4 bước chạy khi vào khung; 0 lỗi JS.
// Chạy: node tests/browser-sales-after-45aq.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sa-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const NEW = ['sales-after', 'sales-jil-after'];
const PH = ['sales-cycle', 'sales-jil-flow', ...NEW];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const R = (e) => e.getBoundingClientRect();
  const inside = (e, box, t = 1) => { const r = R(e), b = R(box); return r.left >= b.left - t && r.right <= b.right + t && r.top >= b.top - t && r.bottom <= b.bottom + t; };
  const over = [], bottom = [], ph = [], flow = [];
  for (const id of ${JSON.stringify(PH)}) {
    const pg = document.getElementById(id), s = pg && pg.querySelector('.sph');
    if (!s || !vis(s)) { ph.push(id + ' không thấy nhãn giai đoạn'); continue; }
    if (!inside(s, pg)) ph.push(id + ' nhãn giai đoạn ra ngoài tờ');
    const segs = [...s.querySelectorAll('.sph-s')];
    if (segs.length !== 2) ph.push(id + ' cần 2 đoạn');
    for (const g of segs) { const shown = [...g.querySelectorAll('[data-l]')].filter(vis); if (shown.length !== 1) ph.push(id + ' đoạn hiện ' + shown.length + ' ngôn ngữ'); if (!inside(g, s, 1)) ph.push(id + ' chữ tràn khỏi nhãn'); }
    const on = s.querySelector('.sph-s.is-on'), want = ${JSON.stringify(NEW)}.includes(id) ? 1 : 0;
    if (!on || segs.indexOf(on) !== want) ph.push(id + ' tô sáng sai đoạn');
    else if (getComputedStyle(on).color !== 'rgb(255, 255, 255)') ph.push(id + ' đoạn sáng không đổi màu');
  }
  for (const id of ${JSON.stringify(NEW)}) {
    const pg = document.getElementById(id);
    for (const [sel, boxSel] of [['.sc-list b,.sc-list p,.sc-list img', 'li'], ['.chip', '.kw1'], ['.gx-lb,.gx-chip', '.gx'], ['.co-nm', '.colg']])
      for (const e of pg.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(id + ' ' + sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
    const pb = R(pg).bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco') || c.classList.contains('pganh')) continue;
      const cb = R(c).bottom; if (cb > pb + 1) bottom.push(id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
    const f = pg.querySelector('.sa-flow');
    const st = f ? [...f.querySelectorAll('.gx-st')].filter((e) => vis(e) && +getComputedStyle(e).opacity > .95 && R(e).width > 20) : [];
    if (st.length !== 4) flow.push(id + ' cảnh hiện ' + st.length + '/4 bước');
    if (f && !inside(f, pg, 1)) flow.push(id + ' cảnh ra ngoài tờ');
    if ([...pg.querySelectorAll('.sc-list li')].filter(vis).length !== 4) flow.push(id + ' danh sách không đủ 4 việc');
  }
  return { view: document.body.dataset.view, over, bottom, ph, flow, overflowX: document.documentElement.scrollWidth - innerWidth };
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

  // 1) Bố cục tĩnh (reduced-motion): 3 ngôn ngữ x 3 bề rộng
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}&mode=pdf#sales-top`, w, true);
      await reveal(PH.map((x) => '#' + x).join(','));
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'sales', `${tag}: tab Sales chưa bật (${r.view})`);
      ok(!r.ph.length, `${tag}: nhãn giai đoạn ${r.ph.slice(0, 4).join(' | ')}`);
      ok(!r.over.length, `${tag}: chữ / hình tràn khung ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.flow.length, `${tag}: ${r.flow.slice(0, 4).join(' | ')}`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w !== 820) for (const s of PH) await shot(`after-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Chuyển động thật (1280, vi): cảnh 4 bước chạy khi vào khung
  await go(`${pageUrl}?lang=vi&mode=pdf#sales-after`, 1280, false);
  for (const s of NEW) {
    await evaluate(`(async () => { const f = document.querySelector('#${s} .sa-flow'); for (let i = 0; i < 20 && !f.classList.contains('is-in'); i++) { f.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 250)); } return 1; })()`);
    const a = await evaluate(`(() => { const f = document.querySelector('#${s} .sa-flow');
      return { in: f.classList.contains('is-in'), n: document.getAnimations().filter((x) => f.contains(x.effect && x.effect.target)).length }; })()`); checks++;
    ok(a.in && a.n >= 4, `#${s}: cảnh 4 bước chưa chạy khi vào khung (${JSON.stringify(a)})`);
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-after-45aq (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-after-45aq: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): nhãn trước / sau khi ký hợp đồng đúng, 2 trang sau ký hợp đồng không tràn, cảnh 4 bước chạy, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
