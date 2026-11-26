// Kiểm trên Chrome headless thật (CDP) 3 slide chart đối thủ ANDPAD (#ap-vs-scale, #ap-vs-map, #ap-vs-win):
// thanh dài đúng tỉ lệ số liệu, nhãn bản đồ định vị không chồng nhau / không ra ngoài khung, không khối nào tràn khỏi tờ
// (PDF view 3 ngôn ngữ và bản in A4), điện thoại không tràn ngang, không lỗi console.
// Chạy: node tests/browser-ap-vs.mjs   (thoát 0 = đạt, khoảng 30 giây). SHOT=<thư mục> để lưu ảnh chụp. CHROME=<đường dẫn>.
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
const dir = mkdtempSync(join(tmpdir(), 'apvs-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const PAGES = ['ap-vs-scale', 'ap-vs-map', 'ap-vs-win'];

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
  const ready = (pid) => evaluate(`(async () => { const s = document.getElementById('${pid}'); s.scrollIntoView({ block: 'start' });
    s.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); await Promise.all([...s.querySelectorAll('img')].map((i) => i.decode().catch(() => 0)));
    await new Promise((r) => setTimeout(r, 1400)); return 1; })()`);
  // Đo: khối tràn khỏi tờ, chữ tràn ngang, tỉ lệ thanh, nhãn bản đồ chồng / ra ngoài
  const measure = (pid) => evaluate(`(() => { const s = document.getElementById('${pid}'); const sb = s.getBoundingClientRect(); const cs = getComputedStyle(s);
    const vis = (e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const blocks = [...s.querySelectorAll(':scope > *:not(.deco)')].filter(vis);
    const out = blocks.filter((e) => { const b = e.getBoundingClientRect(); return b.bottom > sb.bottom + 1 || b.right > sb.right + 1 || b.left < sb.left - 1; }).map((e) => e.className);
    const over = [...s.querySelectorAll('.ap-vb-r > *, .ap-vw-r > *, .ap-vs-end span, .ap-vs-na span')].filter(vis).filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.slice(0, 30));
    const tracks = [...s.querySelectorAll('.ap-vb')].map((c) => [...c.querySelectorAll('.ap-vb-t i')].map((i) => ({ v: i.dataset.v, w: i.getBoundingClientRect().width, t: i.parentElement.getBoundingClientRect().width })));
    const svg = s.querySelector('.ap-vm-svg'); let lab = null;
    if (svg) { const vb = svg.getBoundingClientRect(); const ts = [...svg.querySelectorAll('text')].filter(vis).map((t) => t.getBoundingClientRect());
      const outT = ts.filter((r) => r.left < vb.left - 1 || r.right > vb.right + 1 || r.top < vb.top - 20 || r.bottom > vb.bottom + 1).length;
      const tx = [...svg.querySelectorAll('text')].filter(vis).map((t) => t.textContent); const pairs = [];
      let hit = 0; for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const a = ts[i], b = ts[j];
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) { hit++; pairs.push(tx[i] + ' / ' + tx[j]); } }
      lab = { n: ts.length, outT, hit, pairs }; }
    return { visible: s.offsetParent !== null, out, over, tracks, lab }; })()`);
  const shot = async (pid, name) => {
    if (!process.env.SHOT) return;
    const b = await evaluate(`(() => { const r = document.getElementById('${pid}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } });
    writeFileSync(join(process.env.SHOT, `${pid}-${name}.png`), Buffer.from(r.result.data, 'base64'));
  };
  const check = (m, where) => {
    ok(m.visible, `${where}: trang không hiện`);
    ok(m.out.length === 0, `${where}: khối tràn khỏi tờ: ${m.out.join(' | ')}`);
    ok(m.over.length === 0, `${where}: chữ tràn ngang: ${m.over.join(' | ')}`);
    for (const rows of m.tracks) {
      const num = rows.filter((r) => /^\d+(\.\d+)?$/.test(r.v));
      const max = Math.max(...num.map((r) => +r.v));
      for (const r of num) if (+r.v > 0) ok(Math.abs(r.w / r.t - r.v / max) < 0.03, `${where}: thanh ${r.v} dài ${(r.w / r.t).toFixed(3)} thay vì ${(r.v / max).toFixed(3)}`);
    }
    if (m.lab) { ok(m.lab.n >= 16, `${where}: bản đồ thiếu nhãn (${m.lab.n})`); ok(m.lab.outT === 0 && m.lab.hit === 0, `${where}: nhãn bản đồ ra ngoài ${m.lab.outT}, chồng nhau ${m.lab.hit} (${m.lab.pairs.slice(0, 3).join('; ')})`); }
  };

  // 1) Desktop PDF view, 3 ngôn ngữ
  for (const pid of PAGES) {
    await go(pageUrl + `?mode=pdf#${pid}`, 1440, 900, 'screen');
    await send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await ready(pid);
    for (const lang of ['ja', 'en', 'vi']) {
      await evaluate(`(() => { const b = document.querySelector('.sb-lang button[data-lang="${lang}"]'); if (b) b.click(); })()`); await sleep(400);
      check(await measure(pid), `${pid} desktop ${lang}`);
      await shot(pid, `desktop-${lang}`);
    }
  }
  // 2) Bản in A4
  for (const pid of PAGES) {
    await go(pageUrl + `?mode=pdf#${pid}`, 794, 1123, 'print');
    await ready(pid);
    check(await measure(pid), `${pid} in A4`);
    await shot(pid, 'print');
  }
  // 3) Điện thoại (chế độ thường): không tràn ngang, chữ không tràn, khối không ra ngoài tờ; bản đồ cuộn trong thẻ, chữ >= 9px
  for (const pid of PAGES) {
    await go(pageUrl + `#${pid}`, 390, 844);
    await ready(pid);
    ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `${pid} điện thoại: trang tràn ngang`);
    const m = await measure(pid);
    ok(m.out.length === 0 && m.over.length === 0, `${pid} điện thoại: tràn ${m.out.join(' | ')} ${m.over.join(' | ')}`);
    if (pid === 'ap-vs-map') ok(await evaluate(`(() => { const t = [...document.querySelectorAll('#ap-vs-map .ap-vm-t')].find((e) => e.getClientRects().length); return t ? t.getBoundingClientRect().height >= 9 : false; })()`), 'điện thoại: chữ bản đồ quá nhỏ');
    await shot(pid, 'mobile');
  }

  ok(errors.length === 0, 'lỗi console: ' + errors.slice(0, 3).join(' | '));
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ap-vs (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`OK browser-ap-vs: ${checks} kiểm tra (3 slide x 3 ngôn ngữ, tỉ lệ thanh, nhãn bản đồ, in A4, điện thoại)`);
    process.exit(0);
  }, 300);
});
