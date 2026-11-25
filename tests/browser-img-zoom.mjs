// Task oj95: kiểm trên Chrome headless thật (CDP): bấm hình nào trên portfolio thì hình đó phóng to (lightbox).
// PDF view + Slide view (bấm hình không lật slide), phím Esc / ← / →, nút, bấm nền đóng, bàn phím Enter, đổi ngôn ngữ, điện thoại, icon gx không mở.
// Chạy: node tests/browser-img-zoom.mjs   (thoát 0 = đạt, khoảng 40 giây). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'zm-'));
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
  const go = async (url, w = 1440, h = 900) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(700);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const click = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    await sleep(350);
  };
  const VK = { Escape: 27, ArrowLeft: 37, ArrowRight: 39, Enter: 13 };
  const key = async (k) => {
    for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: VK[k] });
    await sleep(300);
  };
  const zs = () => evaluate('window.imgZoom.state()');
  // Cuộn hình vào giữa màn rồi trả toạ độ tâm + kích thước, kiểm phần tử ở tâm đúng là hình
  const imgAt = async (sel) => evaluate(`(async () => { const i = document.querySelector(${JSON.stringify(sel)}); if (!i) return null;
    i.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 900)); const b = i.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2; return { x, y, w: b.width, hit: document.elementFromPoint(x, y) === i, alt: i.alt }; })()`);
  const bigBox = () => evaluate(`(() => { const b = document.querySelector('#zm .zm-i').getBoundingClientRect(); return { w: b.width, h: b.height, l: b.left, t: b.top, r: b.right, btm: b.bottom, vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth }; })()`);

  // 1) PDF view, desktop: bấm ảnh công tác 03 của dòng sự kiện
  await go(pageUrl + '?mode=pdf#sales-pr');
  const SEL3 = '#sales-pr .evrow li:nth-child(3) img';
  let p = await imgAt(SEL3);
  ok(p && p.hit, 'PDF view: không bấm trúng ảnh 03 của #sales-pr');
  ok(await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(SEL3)})).cursor === 'zoom-in'`), 'ảnh chưa có con trỏ zoom-in');
  await click(p.x, p.y);
  let s = await zs();
  ok(s.open, 'PDF view: bấm ảnh không mở hộp phóng to');
  const i3 = await evaluate(`(() => { const m = document.querySelector('main.wrap:not([hidden])'); return [...m.querySelectorAll('img[data-zm]')].filter((x) => x.getClientRects().length).indexOf(document.querySelector(${JSON.stringify(SEL3)})); })()`);
  ok(i3 >= 2 && s.index === i3 && s.total >= 12, `PDF view: sai vị trí ảnh ${s.index + 1} / ${s.total} (cần ${i3 + 1} / >=12, cả tab Sales)`);
  ok(s.caption === p.alt && s.caption.length > 0, 'chú thích phải là alt của ảnh');
  await sleep(300);
  let b = await bigBox();
  ok(b.w >= p.w * 3 && b.w >= 600, `ảnh phóng to chưa đủ lớn: ${Math.round(b.w)}px so với ${Math.round(p.w)}px`);
  ok(b.l >= 0 && b.t >= 0 && b.r <= b.vw && b.btm <= b.vh, 'ảnh phóng to tràn khỏi màn');
  ok(await evaluate(`document.documentElement.classList.contains('zm-on') && getComputedStyle(document.documentElement).overflow === 'hidden'`), 'chưa khoá cuộn trang khi xem ảnh');
  ok(await evaluate(`document.activeElement && document.activeElement.classList.contains('zm-x')`), 'focus chưa vào nút đóng');
  await key('ArrowRight'); s = await zs();
  ok(s.index === i3 + 1, 'phím → chưa sang ảnh kế');
  await key('ArrowLeft'); await key('ArrowLeft'); s = await zs();
  ok(s.index === i3 - 1, 'phím ← chưa lùi ảnh');
  await click(b.vw - 37, b.vh / 2); s = await zs();
  ok(s.open && s.index === i3, 'nút sau (→) chưa sang ảnh kế');
  await key('Escape'); s = await zs();
  ok(!s.open, 'Esc chưa đóng hộp ảnh');
  ok(await evaluate(`!document.documentElement.classList.contains('zm-on')`), 'đóng rồi vẫn khoá cuộn');
  // Mở bằng chuột: đóng xong focus không nằm trên ảnh, Space không mở lại hộp (review: Space phải về cuộn / lật slide)
  ok(await evaluate(`document.activeElement !== document.querySelector(${JSON.stringify(SEL3)})`), 'mở bằng chuột: đóng xong focus không được kẹt trên ảnh');
  await key(' '); s = await zs();
  ok(!s.open, 'sau khi đóng, Space mở lại hộp ảnh');
  // Bàn phím: Enter trên ảnh đang focus mở hộp, Esc đóng thì focus về ảnh; bấm nền đóng
  await evaluate(`document.querySelector(${JSON.stringify(SEL3)}).focus({ preventScroll: true })`);
  await key('Enter'); s = await zs();
  ok(s.open && s.index === i3, 'Enter trên ảnh đang chọn chưa mở hộp');
  await key('Escape');
  ok(await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(SEL3)})`), 'mở bằng bàn phím: đóng xong focus chưa trả về ảnh');
  ok(await evaluate(`(() => { const i = document.querySelector(${JSON.stringify(SEL3)}); return i.getAttribute('role') === 'button' && i.tabIndex === 0; })()`), 'ảnh chưa có role=button + tabindex');
  await key('Enter');
  await click(30, b.vh - 20); s = await zs();
  ok(!s.open, 'bấm nền tối chưa đóng hộp ảnh');
  // Ảnh alt rỗng có figcaption (ảnh chụp màn hình tab SW, nếu có): chú thích lấy chữ ngôn ngữ đang hiện
  const nb = await evaluate(`(() => { const i = document.querySelector('main.wrap img[data-zm][alt=""]'); if (!i || !i.closest('figure') || !i.closest('figure').querySelector('figcaption')) return null;
    const v = i.closest('main.wrap').dataset.view; location.hash = i.closest('section.pg').id; return v; })()`);
  if (nb) {
    await sleep(900);
    const q = await evaluate(`(() => { const i = document.querySelector('main.wrap:not([hidden]) img[data-zm][alt=""]'); i.scrollIntoView({ block: 'center' });
      const c = [...i.closest('figure').querySelectorAll('figcaption [data-l]')].find((x) => x.getClientRects().length); return { exp: c ? c.textContent.trim() : '', lb: !!i.getAttribute('aria-labelledby') }; })()`);
    await sleep(900);
    await evaluate(`window.imgZoom.open(document.querySelector('main.wrap:not([hidden]) img[data-zm][alt=""]'), false)`); s = await zs();
    ok(s.open && q.exp && s.caption === q.exp, `ảnh alt rỗng: chú thích chưa lấy từ figcaption ("${s.caption}" / "${q.exp}")`);
    ok(q.lb, 'ảnh alt rỗng: chưa có aria-labelledby tới figcaption');
    await key('Escape');
    await go(pageUrl + '?mode=pdf#sales-pr');
  }
  // Ảnh lớn ở #sales-trips (khác section, cùng tab)
  p = await imgAt('#sales-trips img[src*="trip-cold-storage-visit"]');
  await click(p.x, p.y); s = await zs();
  ok(s.open && /trip-cold-storage-visit/.test(s.src), '#sales-trips: bấm ảnh không mở đúng ảnh');
  await key('Escape');
  // Icon 3D (assets/gx) không mở
  const ic = await evaluate(`(() => { const i = [...document.querySelectorAll('main.wrap:not([hidden]) img[src*="assets/gx/"]')].find((x) => x.getClientRects().length && !x.closest('a,button')); if (!i) return null;
    i.scrollIntoView({ block: 'center' }); const b = i.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) === i]; })()`);
  if (ic && ic[2]) { await sleep(600); await click(ic[0], ic[1]); ok(!(await zs()).open, 'icon 3D assets/gx không được mở hộp phóng to'); }

  // 2) Đổi ngôn ngữ EN: chú thích + nhãn nút theo EN
  await evaluate(`document.querySelector('.sb-lang button[data-lang="en"]').click()`); await sleep(400);
  p = await imgAt(SEL3);
  await click(p.x, p.y); s = await zs();
  const en = await evaluate(`document.querySelector(${JSON.stringify(SEL3)}).dataset.altEn`);
  ok(s.open && s.caption === en, `EN: chú thích chưa theo tiếng Anh ("${s.caption}")`);
  ok(await evaluate(`document.querySelector('#zm .zm-x').getAttribute('aria-label') === 'Close'`), 'EN: nút đóng chưa là "Close"');
  await key('Escape');
  await evaluate(`document.querySelector('.sb-lang button[data-lang="ja"]') && document.querySelector('.sb-lang button[data-lang="ja"]').click()`);

  // 3) Slide view: bấm ảnh mở hộp, KHÔNG lật slide; phím ← → trong hộp không đổi slide
  await go(pageUrl + '?mode=slide#sales-pr');
  let sv = await evaluate('window.slideView.state()');
  ok(sv.mode === 'slide' && sv.id === 'sales-pr', `Slide view: chưa vào tờ #sales-pr (${sv.id})`);
  for (let k = 0; k < 8; k++) {
    const shown = await evaluate(`(() => { const i = document.querySelector('.pg.sv-cur .evrow li:nth-child(3) img'); const st = i && i.closest('.sv-step'); return !!i && (!st || st.classList.contains('sv-in')); })()`);
    if (shown) break;
    await key('ArrowRight'); await sleep(500);
  }
  await sleep(900);
  sv = await evaluate('window.slideView.state()');
  p = await evaluate(`(() => { const i = document.querySelector('.pg.sv-cur .evrow li:nth-child(3) img'); const b = i.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
    return { x, y, hit: document.elementFromPoint(x, y) === i }; })()`);
  ok(p.hit, 'Slide view: không bấm trúng ảnh 03');
  await click(p.x, p.y); s = await zs();
  const svIdx = s.index;
  let sv2 = await evaluate('window.slideView.state()');
  ok(s.open && s.total >= 10, `Slide view: bấm ảnh không mở hộp phóng to với đủ ảnh của tờ (${s.total})`);
  ok(sv2.id === sv.id && sv2.step === sv.step, `Slide view: bấm ảnh làm lật slide (${sv.id}#${sv.step} -> ${sv2.id}#${sv2.step})`);
  await key('ArrowRight'); await key('ArrowRight');
  sv2 = await evaluate('window.slideView.state()'); s = await zs();
  ok(s.open && s.index === (svIdx + 2) % s.total, 'Slide view: phím → trong hộp chưa sang ảnh kế');
  ok(sv2.id === sv.id && sv2.step === sv.step, 'Slide view: phím → khi đang xem ảnh lọt sang lật slide');
  b = await bigBox();
  await click(b.vw - 37, 37); s = await zs();
  sv2 = await evaluate('window.slideView.state()');
  ok(!s.open, 'Slide view: nút đóng chưa đóng hộp');
  ok(sv2.id === sv.id && sv2.step === sv.step, 'Slide view: bấm nút đóng làm lật slide');

  // 4) Điện thoại: ảnh vừa màn, không tràn ngang
  await go(pageUrl + '?mode=pdf#sales-pr', 390, 844);
  p = await imgAt(SEL3);
  await click(p.x, p.y); s = await zs();
  ok(s.open, 'điện thoại: bấm ảnh không mở hộp');
  await sleep(300);
  b = await bigBox();
  ok(b.l >= 0 && b.r <= b.vw + 0.5 && b.t >= 0 && b.btm <= b.vh + 0.5 && b.w >= 300, `điện thoại: ảnh tràn / quá nhỏ (${Math.round(b.l)}..${Math.round(b.r)} x ${Math.round(b.t)}..${Math.round(b.btm)})`);
  ok(b.sw <= b.vw, 'điện thoại: trang tràn ngang khi mở hộp');
  await key('Escape');

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-img-zoom (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-img-zoom: ${checks} lượt kiểm, 0 lỗi JS: bấm ảnh phóng to (PDF view + Slide view không lật slide), Esc / ← / → / nút / bấm nền, Enter, chú thích theo ngôn ngữ, điện thoại vừa màn, icon gx không mở`);
    process.exit(0);
  }, 300);
});
