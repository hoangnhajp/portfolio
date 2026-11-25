// Task 4n9v: kiểm trên Chrome headless thật (CDP) mục "Nguồn tham khảo" cuối 7 trang tab Andpad Info:
// khối nguồn nằm trọn trong tờ, cách mép dưới >= 22px (được lấn vào lề dưới như chú thích cuối trang) (PDF view desktop 3 ngôn ngữ + bản in A4), không chồng lên nội dung phía trên,
// số trích dẫn hiện được, chữ nguồn đọc được (>= 7px), điện thoại không tràn ngang, không lỗi console.
// Chạy: node tests/browser-ap-refs.mjs   (thoát 0 = đạt, khoảng 30 giây). SHOT=<thư mục> để lưu ảnh chụp. CHROME=<đường dẫn>.
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
const IDS = ['ap-top', 'ap-products', 'ap-shots', 'ap-vn', 'ap-news', 'ap-market', 'ap-compete', 'ap-app', 'ap-scope', 'ap-role'];
const dir = mkdtempSync(join(tmpdir(), 'apr-'));
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
  // Hiện cả trang (ảnh lazy tải xong) rồi đo khối nguồn của trang id
  const measure = (pid) => evaluate(`(async () => { const s = document.getElementById('${pid}'); s.scrollIntoView({ block: 'start' });
    s.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); await Promise.all([...s.querySelectorAll('img')].map((i) => i.decode().catch(() => 0)));
    await new Promise((r) => setTimeout(r, 300));
    const sb = s.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(s).paddingBottom);
    const rf = s.querySelector('.ap-refs'); const rb = rf.getBoundingClientRect();
    const prev = [...s.children].filter((e) => e !== rf && e.offsetParent && !e.matches('.pg-bg, .pgno, [class*="pganh"]') && getComputedStyle(e).position !== 'absolute');
    const above = Math.max(...prev.map((e) => e.getBoundingClientRect().bottom)); const culprit = prev.find((e) => e.getBoundingClientRect().bottom === above)?.className || '';
    const lis = [...rf.querySelectorAll('li')]; const last = lis[lis.length - 1].getBoundingClientRect();
    const sup = [...s.querySelectorAll('.ap-c')].find((e) => e.offsetParent); const sr = sup ? sup.getBoundingClientRect() : { width: 0, height: 0 };
    return { visible: s.offsetParent !== null, n: lis.length, out: Math.round(rb.bottom - (sb.bottom - Math.min(pad, 22))), lastOut: last.bottom > sb.bottom - 1,
      overlap: Math.round(above - rb.top), culprit, font: parseFloat(getComputedStyle(lis[0]).fontSize), sup: sr.width > 0 && sr.height > 0,
      overX: lis.filter((l) => l.scrollWidth > l.clientWidth + 1).length }; })()`);
  const shot = async (pid, name) => {
    if (!process.env.SHOT) return;
    const b = await evaluate(`(() => { const r = document.getElementById('${pid}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
    writeFileSync(join(process.env.SHOT, `${pid}-${name}.png`), Buffer.from(r.result.data, 'base64'));
  };
  const setLang = async (lang) => { await evaluate(`(() => { const b = document.querySelector('.sb-lang button[data-lang="${lang}"]'); if (b) b.click(); })()`); await sleep(300); };
  const report = [];

  // 1) Desktop PDF view, 3 ngôn ngữ
  await go(pageUrl + '?mode=pdf#ap-top', 1440, 900);
  for (const lang of ['ja', 'en', 'vi']) {
    await setLang(lang);
    for (const pid of IDS) {
      const m = await measure(pid);
      report.push(`desk ${lang} ${pid}: n=${m.n} out=${m.out} overlap=${m.overlap} ${m.overlap > 0 ? m.culprit : ''}`);
      ok(m.visible, `desktop ${lang}: #${pid} không hiện`);
      ok(m.out <= 0 && !m.lastOut, `desktop ${lang}: #${pid} khối nguồn tràn khỏi tờ ${m.out}px`);
      ok(m.overlap <= 0, `desktop ${lang}: #${pid} nội dung chồng lên khối nguồn ${m.overlap}px`);
      ok(m.font >= 7, `desktop ${lang}: #${pid} chữ nguồn quá nhỏ ${m.font}px`);
      ok(m.sup, `desktop ${lang}: #${pid} số trích dẫn không hiện`);
      ok(m.overX === 0, `desktop ${lang}: #${pid} ${m.overX} dòng nguồn tràn ngang`);
      if (lang === 'vi') await shot(pid, 'desktop-vi');
    }
  }
  // 2) Bản in A4
  await go(pageUrl + '?mode=pdf#ap-top', 794, 1123, 'print');
  for (const lang of ['ja', 'vi']) {
    await setLang(lang);
    for (const pid of IDS) {
      const m = await measure(pid);
      report.push(`print ${lang} ${pid}: n=${m.n} out=${m.out} overlap=${m.overlap}`);
      ok(m.out <= 0 && !m.lastOut, `in A4 ${lang}: #${pid} khối nguồn tràn khỏi tờ ${m.out}px`);
      ok(m.overlap <= 0, `in A4 ${lang}: #${pid} nội dung chồng lên khối nguồn ${m.overlap}px`);
      await shot(pid, `print-${lang}`);
    }
  }
  // 3) Điện thoại: không tràn ngang
  await go(pageUrl + '?mode=pdf#ap-top', 390, 844);
  for (const pid of IDS) {
    const m = await measure(pid);
    ok(m.overX === 0, `điện thoại: #${pid} ${m.overX} dòng nguồn tràn ngang`);
  }
  ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'điện thoại: trang tràn ngang');
  ok(errors.length === 0, 'lỗi console: ' + errors.slice(0, 3).join(' | '));
  if (process.env.VERBOSE) console.log(report.join('\n'));
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ap-refs (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`OK browser-ap-refs: ${checks} kiểm tra (7 trang, khối nguồn trọn trong tờ desktop 3 ngôn ngữ + in A4, không chồng nội dung, điện thoại)`);
    process.exit(0);
  }, 300);
});
