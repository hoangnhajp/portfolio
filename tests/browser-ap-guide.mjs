// Kiểm trên Chrome headless thật (CDP) 4 slide hướng dẫn chức năng ANDPAD (#ap-guide, #ap-guide-site, #ap-guide-docs, #ap-guide-money):
// ảnh thẻ tải được, luồng 5 bước một hàng, thẻ 2 cột trên màn rộng / 1 cột trên điện thoại, không khối nào tràn khỏi tờ
// (cả bản in A4 cao cố định), chữ không tràn ngang, 3 ngôn ngữ, bấm ảnh mở hộp phóng to, không lỗi console.
// Chạy: node tests/browser-ap-guide.mjs   (thoát 0 = đạt, khoảng 30 giây). SHOT=<thư mục> để lưu ảnh chụp. CHROME=<đường dẫn>.
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
const dir = mkdtempSync(join(tmpdir(), 'apg-'));
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
  const IDS = ['ap-guide', 'ap-guide-site', 'ap-guide-docs', 'ap-guide-money'];
  // Cuộn qua từng tờ để ảnh lazy tải hết, chờ ảnh decode xong
  const ready = () => evaluate(`(async () => { let n = 0; for (const id of ${JSON.stringify(IDS)}) { const s = document.getElementById(id); s.scrollIntoView(); await new Promise((r) => setTimeout(r, 400));
    window.scrollBy(0, s.offsetHeight / 2); await new Promise((r) => setTimeout(r, 300));
    const imgs = [...s.querySelectorAll('img')]; imgs.forEach((i) => { i.loading = 'eager'; }); await Promise.all(imgs.map((i) => i.decode().catch(() => 0))); n += imgs.length; }
    await new Promise((r) => setTimeout(r, 900)); return n; })()`);
  // Mỗi tờ: số thẻ, ảnh tải được, số cột, phần tử tràn khỏi tờ, chữ tràn ngang
  const measure = (id) => evaluate(`(() => { const s = document.getElementById('${id}'); const sb = s.getBoundingClientRect(); const cs = getComputedStyle(s);
    const items = [...s.querySelectorAll('.ap-gc, .ap-gf, .ap-gtip')]; const top = items.map((f) => Math.round(f.getBoundingClientRect().top));
    return { n: s.querySelectorAll('.ap-gc').length, steps: s.querySelectorAll('.ap-gf').length, visible: s.offsetParent !== null,
      loaded: [...s.querySelectorAll('.ap-gc img')].filter((i) => i.naturalWidth > 0).length,
      cols: top.filter((t) => t === top[0]).length,
      out: items.filter((f) => { const b = f.getBoundingClientRect(); return b.bottom > sb.bottom - parseFloat(cs.paddingBottom) + 1 || b.right > sb.right + 1 || b.left < sb.left - 1; }).length,
      srcOut: s.querySelector('.ap-src').getBoundingClientRect().bottom > sb.bottom + 1,
      over: [...s.querySelectorAll('.ap-gc p, .ap-gfn, .ap-gf p, .ap-gchip')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).length,
      empty: [...s.querySelectorAll('.ap-guse, .ap-ggain')].filter((e) => e.offsetParent && e.textContent.trim().length < 6).length }; })()`);
  const shot = async (id, name) => {
    if (!process.env.SHOT) return;
    const b = await evaluate(`(() => { const r = document.getElementById('${id}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
    writeFileSync(join(process.env.SHOT, `${id}-${name}.png`), Buffer.from(r.result.data, 'base64'));
  };

  // 1) Desktop PDF view, 3 ngôn ngữ: 5 bước một hàng, thẻ 2 cột, không tràn
  await go(pageUrl + '?mode=pdf#ap-guide', 1440, 900);
  ok(await ready() >= 21, 'desktop: thiếu ảnh trong slide hướng dẫn');
  for (const lang of ['ja', 'en', 'vi']) {
    await evaluate(`(() => { const b = document.querySelector('.sb-lang button[data-lang="${lang}"]'); if (b) b.click(); })()`); await sleep(400);
    for (const id of IDS) {
      const m = await measure(id);
      ok(m.visible, `desktop ${lang}: #${id} không hiện`);
      if (id === 'ap-guide') ok(m.steps === 5 && m.cols === 5, `desktop ${lang}: luồng phải 5 bước một hàng, thấy ${m.steps} bước / ${m.cols} cột`);
      else { ok(m.loaded === m.n && m.n >= 6, `desktop ${lang} #${id}: ảnh tải được ${m.loaded}/${m.n}`); ok(m.cols === 2, `desktop ${lang} #${id}: thẻ phải 2 cột, thấy ${m.cols}`); }
      ok(m.out === 0 && !m.srcOut, `desktop ${lang} #${id}: ${m.out} khối / dòng nguồn tràn khỏi tờ`);
      ok(m.over === 0 && m.empty === 0, `desktop ${lang} #${id}: ${m.over} chữ tràn ngang, ${m.empty} dòng trống`);
      await shot(id, `desktop-${lang}`);
    }
  }
  // 2) Bấm ảnh thẻ sản phẩm mở hộp phóng to
  const p = await evaluate(`(async () => { const i = document.querySelector('#ap-guide-site .ap-gc[data-k="drawings"] img'); i.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 900)); const b = i.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
    return { x, y, hit: document.elementFromPoint(x, y) === i }; })()`);
  ok(p.hit, 'không bấm trúng ảnh thẻ Bản vẽ');
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(500);
  const z = await evaluate(`window.imgZoom ? window.imgZoom.state() : null`);
  ok(z && z.open, 'bấm ảnh thẻ sản phẩm không mở hộp phóng to');

  // 3) Bản in A4 (tờ cao cố định): không khối nào bị cắt
  await go(pageUrl + '?mode=pdf#ap-guide', 794, 1123, 'print');
  await ready();
  for (const id of IDS) {
    const m = await measure(id);
    ok(m.out === 0 && !m.srcOut, `in A4 #${id}: ${m.out} khối / dòng nguồn tràn khỏi tờ`);
    await shot(id, 'print');
  }

  // 4) Điện thoại: 1 cột, không tràn ngang
  await go(pageUrl + '?mode=pdf#ap-guide', 390, 844);
  await ready();
  for (const id of IDS) {
    const m = await measure(id);
    ok(m.out === 0 && m.over === 0, `điện thoại #${id}: ${m.out} khối tràn, ${m.over} chữ tràn`);
    if (id !== 'ap-guide') ok(m.cols === 1, `điện thoại #${id}: thẻ phải 1 cột, thấy ${m.cols}`);
  }
  ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'điện thoại: trang tràn ngang');
  await shot('ap-guide-site', 'mobile');

  ok(errors.length === 0, 'lỗi console: ' + errors.slice(0, 3).join(' | '));
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ap-guide (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`OK browser-ap-guide: ${checks} kiểm tra (4 slide, desktop 3 ngôn ngữ, phóng to, in A4 không tràn, điện thoại 1 cột)`);
    process.exit(0);
  }, 300);
});
