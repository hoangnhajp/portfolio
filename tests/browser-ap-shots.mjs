// Task ls8q: kiểm trên Chrome headless thật (CDP) trang #ap-shots (ảnh sản phẩm chính thức ANDPAD):
// 22 ảnh tải được, lưới 5 cột trên màn rộng / 2 cột trên điện thoại, không thẻ nào tràn khỏi tờ (cả bản in A4 cao cố định),
// chú thích không tràn, 3 ngôn ngữ, bấm ảnh mở hộp phóng to (khối zoom), không lỗi console.
// Chạy: node tests/browser-ap-shots.mjs   (thoát 0 = đạt, khoảng 20 giây). SHOT=<thư mục> để lưu ảnh chụp. CHROME=<đường dẫn>.
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
const dir = mkdtempSync(join(tmpdir(), 'aps-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };

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
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, h, media = '') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(700);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  // Cuộn qua cả tờ để ảnh lazy tải hết, chờ ảnh decode xong
  const ready = () => evaluate(`(async () => { const s = document.getElementById('ap-shots'); s.scrollIntoView(); await new Promise((r) => setTimeout(r, 600));
    window.scrollBy(0, s.offsetHeight / 2); await new Promise((r) => setTimeout(r, 400)); s.scrollIntoView({ block: 'start' });
    const imgs = [...s.querySelectorAll('.ap-sh img')]; imgs.forEach((i) => { i.loading = 'eager'; });
    await Promise.all(imgs.map((i) => i.decode().catch(() => 0))); await new Promise((r) => setTimeout(r, 900)); return imgs.length; })()`);
  const measure = () => evaluate(`(() => { const s = document.getElementById('ap-shots'); const sb = s.getBoundingClientRect();
    const figs = [...s.querySelectorAll('.ap-sh')]; const top = figs.map((f) => Math.round(f.getBoundingClientRect().top));
    const cs = getComputedStyle(s);
    return { n: figs.length, loaded: figs.filter((f) => f.querySelector('img').naturalWidth > 0).length,
      cols: top.filter((t) => t === top[0]).length, visible: s.offsetParent !== null,
      out: figs.filter((f) => { const b = f.getBoundingClientRect(); return b.bottom > sb.bottom - parseFloat(cs.paddingBottom) + 1 || b.right > sb.right + 1 || b.left < sb.left - 1; }).length,
      srcOut: (() => { const b = s.querySelector('.ap-src').getBoundingClientRect(); return b.bottom > sb.bottom + 1; })(),
      capOver: figs.filter((f) => [...f.querySelectorAll('figcaption a, figcaption span')].some((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1)).length,
      imgH: Math.round(figs[0].querySelector('img').getBoundingClientRect().height),
      cap: figs.map((f) => [...f.querySelectorAll('figcaption span')].filter((e) => e.offsetParent).map((e) => e.textContent).join('')).slice(0, 3) }; })()`);
  const shot = async (name) => {
    if (!process.env.SHOT) return;
    const b = await evaluate(`(() => { const r = document.getElementById('ap-shots').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
    writeFileSync(join(process.env.SHOT, `ap-shots-${name}.png`), Buffer.from(r.result.data, 'base64'));
  };

  // 1) Desktop PDF view, 3 ngôn ngữ
  await go(pageUrl + '?mode=pdf#ap-shots', 1440, 900);
  ok(await ready() >= 20, 'desktop: thiếu ảnh trong #ap-shots');
  for (const lang of ['ja', 'en', 'vi']) {
    await evaluate(`(() => { const b = document.querySelector('.sb-lang button[data-lang="${lang}"]'); if (b) b.click(); })()`); await sleep(400);
    const m = await measure();
    ok(m.visible, `desktop ${lang}: #ap-shots không hiện`);
    ok(m.loaded === m.n && m.n >= 20, `desktop ${lang}: ảnh tải được ${m.loaded}/${m.n}`);
    ok(m.cols === 5, `desktop ${lang}: lưới phải 5 cột, thấy ${m.cols}`);
    ok(m.out === 0 && !m.srcOut, `desktop ${lang}: ${m.out} thẻ / dòng nguồn tràn khỏi tờ`);
    ok(m.capOver === 0, `desktop ${lang}: ${m.capOver} chú thích tràn ngang`);
    ok(m.imgH >= 60, `desktop ${lang}: ảnh quá nhỏ (${m.imgH}px)`);
    ok(m.cap.every((t) => t.length > 1), `desktop ${lang}: chú thích ngôn ngữ trống ${JSON.stringify(m.cap)}`);
    if (lang === 'vi') ok(m.cap[0] === 'Quản lý thi công', `desktop vi: chú thích đầu sai "${m.cap[0]}"`);
    await shot(`desktop-${lang}`);
  }
  // 2) Bấm ảnh mở hộp phóng to
  const p = await evaluate(`(async () => { const i = document.querySelector('#ap-shots .ap-sh:nth-child(3) img'); i.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 900)); const b = i.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
    return { x, y, hit: document.elementFromPoint(x, y) === i, cur: getComputedStyle(i).cursor }; })()`);
  ok(p.hit, 'không bấm trúng ảnh sản phẩm thứ 3');
  ok(p.cur === 'zoom-in', `ảnh sản phẩm chưa có con trỏ zoom-in (${p.cur})`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(500);
  const z = await evaluate(`window.imgZoom ? window.imgZoom.state() : null`);
  ok(z && z.open, 'bấm ảnh sản phẩm không mở hộp phóng to');
  const zsrc = await evaluate(`(() => { const i = document.querySelector('#zm .zm-i'); return i ? i.getAttribute('src') : ''; })()`);
  ok(/assets\/ap\/drawings\.webp/.test(zsrc), `hộp phóng to hiện sai ảnh: ${zsrc}`);

  // 3) Bản in A4 (tờ cao cố định): không thẻ nào bị cắt
  await go(pageUrl + '?mode=pdf#ap-shots', 794, 1123, 'print');
  await ready();
  const pr = await measure();
  ok(pr.loaded === pr.n, `in: ảnh tải được ${pr.loaded}/${pr.n}`);
  ok(pr.out === 0 && !pr.srcOut, `in: ${pr.out} thẻ / dòng nguồn tràn khỏi tờ A4`);
  await shot('print');

  // 4) Điện thoại
  await go(pageUrl + '?mode=pdf#ap-shots', 390, 844);
  await ready();
  const mo = await measure();
  ok(mo.cols === 2, `điện thoại: lưới phải 2 cột, thấy ${mo.cols}`);
  ok(mo.out === 0 && mo.capOver === 0, `điện thoại: ${mo.out} thẻ tràn, ${mo.capOver} chú thích tràn`);
  ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'điện thoại: trang tràn ngang');
  await shot('mobile');

  ok(errors.length === 0, 'lỗi console: ' + errors.slice(0, 3).join(' | '));
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ap-shots (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`OK browser-ap-shots: ${checks} kiểm tra (desktop 3 ngôn ngữ 5 cột, phóng to, in A4 không tràn, điện thoại 2 cột)`);
    process.exit(0);
  }, 300);
});
