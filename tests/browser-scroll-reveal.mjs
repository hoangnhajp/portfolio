// Task zcd9: kéo tới đâu hiện ra tới đó (như D:\Gprflexeye Homepages\Landing Page, assets/js/hien-dan.js).
// Chrome headless thật (CDP). Khối nội dung = mọi .rv trong .pg + con trực tiếp của .pg không phải nền trang trí
// (.deco / position:absolute) và không chứa .rv. Đạt khi:
// 1) mở trang: khối còn nằm dưới khung nhìn thì ĐANG ẨN (opacity ~0), kể cả khi trang của nó đã lộ một phần;
// 2) cuộn dần từng nấc: khối nào đã vào khung nhìn (mép trên < 80% chiều cao) thì hiện đủ (opacity ~1);
// 3) cuộn tới cuối tab: không còn khối nào bị giữ ẩn;
// 4) prefers-reduced-motion và chế độ in: mọi khối hiện ngay, không cần cuộn; 5) không lỗi JS.
// Chạy: node tests/browser-scroll-reveal.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'srv-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Trả danh sách khối đang hiển thị (không display:none) của tab đang mở, kèm vị trí và độ mờ thực (nhân dồn lên tới .pg).
const PROBE = `(() => {
  const main = document.querySelector('main:not([hidden])');
  const set = new Set(main.querySelectorAll('.pg .rv'));
  for (const pg of main.querySelectorAll('.pg')) for (const c of pg.children) {
    if (c.classList.contains('deco') || c.querySelector('.rv')) continue;
    const p = getComputedStyle(c).position; if (p === 'absolute' || p === 'fixed') continue;
    set.add(c);
  }
  const op = (e) => { let o = 1; for (let x = e; x && !x.classList.contains('pg'); x = x.parentElement) o *= +getComputedStyle(x).opacity; return o; };
  const out = [];
  for (const e of set) {
    if (!e.getClientRects().length) continue;
    const r = e.getBoundingClientRect(); if (r.height < 2) continue;
    out.push({ id: (e.closest('section')?.id || '?') + '>' + e.tagName.toLowerCase() + '.' + [...e.classList].join('.'),
      top: Math.round(r.top), bottom: Math.round(r.bottom), op: Math.round(op(e) * 100) / 100 });
  }
  return { vh: innerHeight, y: scrollY, max: document.documentElement.scrollHeight - innerHeight, blocks: out };
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
  const go = async (url, w, { media = '', reduce = false } = {}) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media, features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await sleep(1200);
  };
  const list5 = (a) => a.slice(0, 5).map((b) => `${b.id}@${b.top}(op ${b.op})`).join(', ');

  // A) Cuộn dần trên desktop và mobile, mỗi tab
  for (const [w, hash, lang] of [[1280, 'cover', 'ja'], [1280, 'sales-top', 'en'], [390, 'team-top', 'vi'], [1280, 'ai-top', 'ja']]) {
    const tag = `${hash}/${lang}/${w}px`;
    await go(`${pageUrl}?lang=${lang}#${hash}`, w);
    let r = await evaluate(PROBE); checks++;
    const below = r.blocks.filter((b) => b.top > r.vh + 40);
    const shownBelow = below.filter((b) => b.op > 0.05);
    ok(below.length > 0, `${tag}: không có khối nào dưới khung nhìn để kiểm (trang quá ngắn?)`);
    ok(shownBelow.length === 0, `${tag}: ${shownBelow.length}/${below.length} khối còn ở dưới khung nhìn nhưng đã hiện sẵn: ${list5(shownBelow)}`);
    const step = Math.round(r.vh * 0.45);
    let late = [];
    for (let guard = 0; guard < 80; guard++) {
      const y = await evaluate(`(scrollBy(0, ${step}), scrollY)`);
      await sleep(1100);
      r = await evaluate(PROBE); checks++;
      late = late.concat(r.blocks.filter((b) => b.bottom > 0 && b.top < r.vh * 0.8 && b.op < 0.95).map((b) => ({ ...b, y })));
      if (r.y >= r.max - 2) break;
    }
    ok(late.length === 0, `${tag}: ${late.length} lượt khối đã vào khung nhìn mà chưa hiện: ${list5(late)}`);
    await sleep(1200);
    r = await evaluate(PROBE);
    const stuck = r.blocks.filter((b) => b.top < r.vh && b.op < 0.95);
    ok(stuck.length === 0, `${tag}: cuộn tới cuối vẫn còn ${stuck.length} khối trong khung nhìn bị ẩn: ${list5(stuck)}`);
  }

  // B) reduced-motion và in A4: hiện ngay mọi khối, không cần cuộn
  for (const [opt, tag] of [[{ reduce: true }, 'reduced-motion'], [{ media: 'print' }, 'print']]) {
    await go(`${pageUrl}?lang=ja#cover`, opt.media ? 794 : 1280, opt);
    const r = await evaluate(PROBE); checks++;
    const hid = r.blocks.filter((b) => b.op < 0.95);
    ok(hid.length === 0, `${tag}: ${hid.length} khối bị ẩn: ${list5(hid)}`);
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-scroll-reveal (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`PASS browser-scroll-reveal: ${checks} lượt đo, 0 lỗi JS; 4 tab (desktop + mobile): khối dưới khung nhìn ẩn, cuộn tới đâu hiện tới đó, cuối tab không sót; reduced-motion và in A4 hiện đủ ngay`);
    process.exit(0);
  }, 300);
});
