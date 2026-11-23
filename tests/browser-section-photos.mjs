// Task ice8: mỗi section là 1 hình, hiện ra theo từng section khi cuộn (như .pganh của Landing Page GPR FLEXEYE).
// Chrome headless thật (CDP). Đạt khi, ở cả 4 tab (desktop + mobile):
// 1) mỗi section.pg đang hiển thị có ĐÚNG 1 lớp .pganh, ảnh nền khác nhau giữa các section;
// 2) mở trang: section còn nằm dưới khung nhìn thì lớp ảnh CHƯA hiện (opacity ~0) và chưa tải ảnh;
// 3) cuộn tới đâu: section nào đã vào khung nhìn thì lớp ảnh hiện (opacity ~1) và ảnh tải được (naturalWidth > 0);
// 4) lớp ảnh nằm DƯỚI chữ: điểm giữa tiêu đề h2 trả về chính tiêu đề, không phải .pganh;
// 5) reduced-motion: ảnh hiện ngay; bản in: .pganh display:none; 6) không lỗi JS / không ảnh lỗi 404.
// Chạy: node tests/browser-section-photos.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'pgp-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Trạng thái lớp ảnh của mọi section đang hiển thị trong tab đang mở
const PROBE = `(() => {
  const main = document.querySelector('main:not([hidden])');
  const out = [];
  for (const pg of main.querySelectorAll('section.pg')) {
    if (!pg.getClientRects().length) continue;
    const L = pg.querySelectorAll(':scope>.pganh');
    const d = L[0]; const r = pg.getBoundingClientRect();
    const bg = d ? getComputedStyle(d.firstElementChild).backgroundImage : '';
    let cover = null;
    const h = pg.querySelector('h2');
    if (h && r.top >= 0 && r.top < innerHeight) {
      const hr = h.getBoundingClientRect(); const x = hr.left + Math.min(hr.width / 2, 40), y = hr.top + hr.height / 2;
      if (y > 0 && y < innerHeight) { const e = document.elementFromPoint(x, y); cover = !!(e && e.closest('.pganh')); }
    }
    out.push({ id: pg.id, n: L.length, top: Math.round(r.top), bottom: Math.round(r.bottom),
      op: d ? Math.round(+getComputedStyle(d).opacity * 100) / 100 : -1, disp: d ? getComputedStyle(d).display : '',
      bg: bg === 'none' ? '' : bg, z: d ? getComputedStyle(d).zIndex : '', cover });
  }
  return { vh: innerHeight, y: scrollY, max: document.documentElement.scrollHeight - innerHeight, s: out };
})()`;
// Tải thử từng ảnh đã gán để chắc không 404 / hỏng
const LOADED = `Promise.all([...document.querySelectorAll('.pganh-hinh')].map(s => getComputedStyle(s).backgroundImage)
  .filter(b => b && b !== 'none').map(b => new Promise(r => { const i = new Image(); i.onload = () => r([b, i.naturalWidth, i.naturalHeight]);
  i.onerror = () => r([b, 0, 0]); i.src = b.slice(5, -2); })))`;

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
  const go = async (url, w, { media = '', reduce = false } = {}) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media, features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await sleep(1600);
  };
  const ls = (a) => a.slice(0, 5).map((b) => `#${b.id}@${b.top}(op ${b.op})`).join(', ');
  const seenAll = new Map(); const visible = new Set();

  // A) Cuộn dần ở từng tab, desktop + mobile
  for (const [w, hash, lang] of [[1280, 'cover', 'ja'], [1280, 'sales-top', 'en'], [390, 'team-top', 'vi'], [1280, 'ai-top', 'ja']]) {
    const tag = `${hash}/${lang}/${w}px`;
    await go(`${pageUrl}?lang=${lang}#${hash}`, w);
    let r = await evaluate(PROBE); checks++;
    ok(r.s.length >= 4, `${tag}: chỉ thấy ${r.s.length} section`);
    for (const s of r.s) ok(s.n === 1, `${tag}: #${s.id} có ${s.n} lớp .pganh (cần đúng 1)`);
    for (const s of r.s) ok(s.z === '-1', `${tag}: #${s.id} lớp ảnh z-index ${s.z} (cần -1, dưới chữ)`);
    const far = r.s.filter((s) => s.top > r.vh * 2.2);
    ok(far.length > 0, `${tag}: không có section nào ở xa dưới để kiểm`);
    const early = r.s.filter((s) => s.top > r.vh + 40 && s.op > 0.05);
    ok(early.length === 0, `${tag}: ${early.length} section còn dưới khung nhìn mà ảnh đã hiện: ${ls(early)}`);
    const pre = far.filter((s) => s.bg);
    ok(pre.length === 0, `${tag}: ${pre.length} section ở xa đã tải ảnh sớm: ${ls(pre)}`);
    const step = Math.round(r.vh * 0.5);
    let late = [], covered = [];
    for (let guard = 0; guard < 90; guard++) {
      await evaluate(`(scrollBy(0, ${step}), scrollY)`);
      await sleep(1700);
      r = await evaluate(PROBE); checks++;
      late = late.concat(r.s.filter((s) => s.bottom > 0 && s.top < r.vh * 0.8 && (s.op < 0.95 || !s.bg)));
      covered = covered.concat(r.s.filter((s) => s.cover === true));
      if (r.y >= r.max - 2) break;
    }
    ok(late.length === 0, `${tag}: ${late.length} lượt section đã vào khung nhìn mà ảnh chưa hiện / chưa tải: ${ls(late)}`);
    ok(covered.length === 0, `${tag}: lớp ảnh đè lên tiêu đề ở ${ls(covered)}`);
    for (const s of r.s) { visible.add(s.id); if (s.bg) seenAll.set(s.id, s.bg); }
    const imgs = await evaluate(LOADED); checks++;
    const bad = imgs.filter((x) => !(x[1] > 0 && x[2] > x[1]));
    ok(imgs.length >= r.s.length - 1, `${tag}: chỉ ${imgs.length}/${r.s.length} ảnh đã gán sau khi cuộn hết`);
    ok(bad.length === 0, `${tag}: ảnh hỏng hoặc không dọc: ${bad.map((x) => x[0]).slice(0, 3).join(', ')}`);
  }
  const urls = [...seenAll.values()];
  ok(new Set(urls).size === urls.length, `có section dùng chung ảnh: ${urls.length} section / ${new Set(urls).size} ảnh`);
  ok(urls.length === visible.size && urls.length >= 20, `chỉ ${urls.length}/${visible.size} section hiển thị có ảnh`);

  // B) reduced-motion: hiện ngay; in: ẩn
  await go(`${pageUrl}?lang=ja#cover`, 1280, { reduce: true });
  let r = await evaluate(PROBE); checks++;
  const hid = r.s.filter((s) => s.op < 0.95);
  ok(hid.length === 0, `reduced-motion: ${hid.length} lớp ảnh chưa hiện: ${ls(hid)}`);
  await go(`${pageUrl}?lang=ja#cover`, 794, { media: 'print' });
  r = await evaluate(PROBE); checks++;
  const shown = r.s.filter((s) => s.disp !== 'none');
  ok(shown.length === 0, `print: ${shown.length} lớp ảnh vẫn hiển thị khi in`);
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
  return seenAll.size;
}

let total = 0;
main().then((n) => { total = n; }).catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-section-photos (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`PASS browser-section-photos: ${checks} lượt đo, ${total} section mỗi section 1 ảnh riêng; ảnh hiện theo từng section khi cuộn, chưa tải sớm, nằm dưới chữ; reduced-motion hiện ngay, in ẩn; 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
