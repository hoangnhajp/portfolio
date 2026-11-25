// Bố cục kiểu PowerPoint trên Chrome headless thật (CDP): màn rộng > 900px thì menu tab là cột dọc bên TRÁI
// (bấm chọn được, như khung danh sách slide), nút PDF view / Slide view nằm đầu cột đó; tờ A4 nằm bên PHẢI cột,
// không đè lên cột, cả ở PDF view lẫn Slide view (sân khấu và thanh điều khiển slide canh giữa phần bên phải).
// Mobile <= 900px giữ menu ngang như cũ. Bản in không có cột.
// Chạy: node tests/browser-rail.mjs   (thoát 0 = đạt, khoảng 40 giây). CHROME=<đường dẫn> để đổi trình duyệt.
// SHOTS=<thư mục> để lưu ảnh chụp màn làm bằng chứng.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'rail-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; };
  const top = document.querySelector('.top'), main = document.querySelector('main:not([hidden])');
  const links = [...document.querySelectorAll('.top-nav a')].map(R);
  const pages = [...main.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none').map(R);
  const sv = document.documentElement.classList.contains('sv');
  return { vw: document.documentElement.clientWidth, vh: innerHeight, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sv, top: R(top), topBg: getComputedStyle(top).backgroundColor, topDisp: getComputedStyle(top).display, links,
    on: document.querySelector('.top-nav a.on')?.dataset.view, onBg: (() => { const a = document.querySelector('.top-nav a.on'); return a ? getComputedStyle(a).backgroundColor : ''; })(),
    mode: R(document.getElementById('sv-mode')), modeBtns: [...document.querySelectorAll('#sv-mode button')].map(R),
    bar: sv ? R(document.getElementById('sv-bar')) : null, main: R(main), pages,
    cur: R(document.querySelector('main:not([hidden]) > .pg.sv-cur')) };
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
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, h = 900, media = '') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(500);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const shot = async (name) => {
    if (!process.env.SHOTS) return;
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(process.env.SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64'));
  };
  const click = (sel) => evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return 0; e.click(); return 1; })()`);
  const railChecks = (r, tag) => {
    checks++;
    ok(r.topDisp !== 'none' && r.top, `${tag}: không thấy menu tab`);
    if (!r.top) return;
    ok(r.top.l <= 24 && r.top.l >= 0, `${tag}: cột menu không sát mép trái (left ${Math.round(r.top.l)})`);
    ok(r.top.w >= 160 && r.top.w <= 260, `${tag}: cột menu rộng ${Math.round(r.top.w)}px, cần 160..260 (cột dọc, không phải thanh ngang)`);
    ok(r.top.h > r.top.w, `${tag}: menu chưa dựng dọc (cao ${Math.round(r.top.h)} <= rộng ${Math.round(r.top.w)})`);
    ok(/11,\s*28,\s*56/.test(r.topBg), `${tag}: cột menu không nền navy (${r.topBg})`);
    ok(r.links.length === 10, `${tag}: menu có ${r.links.length} tab, cần 10`);
    r.links.forEach((a, i) => {
      ok(a.l >= r.top.l - 1 && a.r <= r.top.r + 1, `${tag}: tab ${i + 1} lòi ra ngoài cột (${Math.round(a.l)}..${Math.round(a.r)})`);
      ok(a.b <= r.vh + 1 && a.t >= 0, `${tag}: tab ${i + 1} ra ngoài màn (top ${Math.round(a.t)}, bottom ${Math.round(a.b)})`);
      if (i) ok(a.t >= r.links[i - 1].b - 1 && Math.abs(a.l - r.links[i - 1].l) < 2, `${tag}: tab ${i + 1} không xếp dọc dưới tab ${i}`);
    });
    ok(/246,\s*130,\s*9/.test(r.onBg), `${tag}: tab đang mở không cam (${r.onBg})`);
    ok(r.mode && r.mode.l >= r.top.l - 1 && r.mode.r <= r.top.r + 1 && r.mode.t >= r.top.t - 1 && r.links[0] && r.mode.b <= r.links[0].t + 1,
      `${tag}: nút PDF view / Slide view không nằm đầu cột trái (${JSON.stringify(r.mode)})`);
    ok(r.modeBtns.length === 2 && r.modeBtns.every((b) => b.w > 40 && b.l >= r.top.l - 1 && b.r <= r.top.r + 1), `${tag}: nút chế độ xem bị cắt / lòi khỏi cột`);
    ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
  };

  // 1) PDF view desktop: cột trái + tờ A4 bên phải, 3 ngôn ngữ, vài tab
  for (const [lang, hash, w] of [['vi', 'cover', 1440], ['ja', 'sales-top', 1440], ['en', 'ap-top', 1440], ['vi', 'cover', 1280], ['vi', 'cover', 1024], ['ja', 'cover', 1920]]) {
    const tag = `pdf ${hash}/${lang}/${w}`;
    await go(`${pageUrl}?lang=${lang}&mode=pdf#${hash}`, w);
    const r = await evaluate(PROBE);
    railChecks(r, tag);
    ok(!r.sv, `${tag}: không ở PDF view`);
    ok(r.pages.length >= 2, `${tag}: chỉ thấy ${r.pages.length} tờ`);
    r.pages.forEach((p, i) => ok(p.l >= r.top.r + 12 && p.r <= r.vw + 1, `${tag}: tờ ${i + 1} đè cột trái hoặc tràn phải (${Math.round(p.l)}..${Math.round(p.r)}, cột tới ${Math.round(r.top.r)})`));
    if (w === 1024) ok(r.pages.every((p) => p.w >= 740), `${tag}: tờ co quá hẹp (${r.pages.map((p) => Math.round(p.w)).slice(0, 2)}px, cần >= 740)`);
    if (w >= 1280) ok(r.pages.every((p) => Math.abs(p.w - 794) <= 1), `${tag}: tờ không đủ khổ A4 794px (${r.pages.map((p) => Math.round(p.w)).slice(0, 2)})`);
    if (w === 1920) ok(r.pages.length > 1 && Math.abs(r.pages[0].t - r.pages[1].t) < 2, `${tag}: rộng 1920 không còn hai tờ một hàng`);
    if (w === 1440 && lang === 'vi') await shot('rail-pdf-1440');
  }

  // 2) Bấm tab trong cột trái chuyển tab
  await go(`${pageUrl}?lang=vi&mode=pdf#cover`, 1440);
  await click('.top-nav a[data-view="sales"]'); await sleep(700);
  let r = await evaluate(PROBE); checks++;
  ok(r.on === 'sales', `bấm tab Sales ở cột trái: tab đang mở là ${r.on}`);

  // 3) Slide view: bấm nút trong cột, sân khấu bên phải cột, thanh điều khiển canh giữa phần phải
  await click('#sv-mode button[data-mode="slide"]'); await sleep(1000);
  r = await evaluate(PROBE);
  railChecks(r, 'slide 1440');
  ok(r.sv, 'slide 1440: bấm Slide view trong cột trái không vào Slide view');
  ok(r.cur && r.cur.l >= r.top.r + 8 && r.cur.r <= r.vw + 1, `slide 1440: tờ slide đè cột trái (${r.cur && Math.round(r.cur.l)}, cột tới ${Math.round(r.top.r)})`);
  if (r.cur) { const mid = (r.top.r + r.vw) / 2, c = (r.cur.l + r.cur.r) / 2; ok(Math.abs(c - mid) < 24, `slide 1440: tờ không canh giữa phần bên phải (tâm ${Math.round(c)}, cần ~${Math.round(mid)})`); }
  ok(r.bar && r.bar.l >= r.top.r + 8, `slide 1440: thanh điều khiển slide đè cột trái (${r.bar && Math.round(r.bar.l)})`);
  if (r.bar) { const mid = (r.top.r + r.vw) / 2, c = (r.bar.l + r.bar.r) / 2; ok(Math.abs(c - mid) < 24, `slide 1440: thanh điều khiển không canh giữa phần phải (tâm ${Math.round(c)}, cần ~${Math.round(mid)})`); }
  await shot('rail-slide-1440');
  await click('.top-nav a[data-view="ai"]'); await sleep(900);
  r = await evaluate(PROBE); checks++;
  ok(r.sv && r.on === 'ai' && r.cur && r.cur.l >= r.top.r + 8, `slide: bấm tab AI ở cột trái không sang tờ đầu tab AI (on=${r.on})`);
  await click('#sv-mode button[data-mode="pdf"]'); await sleep(700);
  r = await evaluate(PROBE); checks++;
  ok(!r.sv && r.pages.every((p) => p.l >= r.top.r + 12), 'về PDF view: tờ đè cột trái hoặc không thoát Slide view');

  // 4) Màn thấp 1366x640: mọi tab vẫn bấm được (cột cuộn được nếu cần) và không tràn ngang
  await go(`${pageUrl}?lang=vi&mode=pdf#cover`, 1366, 640);
  r = await evaluate(`(() => { const t = document.querySelector('.top'); const cs = getComputedStyle(t);
    return { fits: t.scrollHeight <= t.clientHeight + 1 || /auto|scroll/.test(cs.overflowY), bottom: t.getBoundingClientRect().bottom, vh: innerHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth }; })()`); checks++;
  ok(r.fits && r.bottom <= r.vh + 1, `1366x640: cột menu cắt mất tab (bottom ${Math.round(r.bottom)} / ${r.vh})`);
  ok(r.overflowX <= 1, `1366x640: tràn ngang ${r.overflowX}px`);

  // 5) Mobile 390: giữ menu ngang phía trên, không tràn
  await go(`${pageUrl}?lang=vi&mode=pdf#cover`, 390, 844);
  r = await evaluate(PROBE); checks++;
  ok(r.top && r.top.h < 80 && r.top.w > r.top.h, `390: menu không còn là thanh ngang (${r.top && Math.round(r.top.w)}x${r.top && Math.round(r.top.h)})`);
  ok(r.overflowX <= 1, `390: tràn ngang ${r.overflowX}px`);
  r.pages.forEach((p, i) => ok(p.l >= 6 && p.r <= 390 - 6, `390: tờ ${i + 1} dính mép (${Math.round(p.l)}..${Math.round(p.r)})`));

  // 6) Bản in: không có cột menu, tờ không bị dời phải
  await go(`${pageUrl}?lang=vi&mode=pdf#cover`, 794, 1123, 'print');
  r = await evaluate(PROBE); checks++;
  ok(r.topDisp === 'none', 'in: còn cột menu');
  ok(r.pages.every((p) => p.l < 40), `in: tờ bị dời phải (${r.pages.map((p) => Math.round(p.l)).slice(0, 3)})`);

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-rail (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-rail: ${checks} lượt kiểm, 0 lỗi JS: màn rộng có cột menu dọc bên trái (10 tab bấm được, nút PDF view / Slide view ở đầu cột), tờ A4 bên phải không đè cột ở PDF view và Slide view (tờ + thanh điều khiển canh giữa phần phải), 1920 vẫn hai tờ một hàng, màn thấp không cắt tab, mobile giữ menu ngang, bản in không có cột`);
    process.exit(0);
  }, 300);
});
