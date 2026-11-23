// Task m9qu: kiểm trên Chrome headless thật (CDP) rằng mỗi section hiện như một trang slide kiểu
// Landing Page GPR FLEXEYE: tờ trắng bo góc + bóng đổ trên nền tím nhạt, các slide cách nhau,
// chip "NN / tổng" đúng thứ tự trong từng tab, phím ←/→ nhảy đúng slide, không tràn ngang,
// mobile vẫn gọn, bản in A4 giữ nguyên (không bo góc, không bóng, không chip).
// Chạy: node tests/browser-lp-slides.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'lps-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const main = document.querySelector('main:not([hidden])');
  const ps = [...main.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none');
  const after = (p) => getComputedStyle(p, '::after');
  return {
    view: main.dataset.view, w: document.documentElement.clientWidth, overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bg: getComputedStyle(main).backgroundImage,
    slides: ps.map((p) => { const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      return { id: p.id, top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right,
        radius: parseFloat(cs.borderTopLeftRadius), shadow: cs.boxShadow, slide: p.dataset.slide || '',
        chip: after(p).content, chipDisp: after(p).display }; })
  };
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
  const go = async (url, w, media = '', features = []) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media, features });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const key = async (k, code) => {
    for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: code });
  };
  const pad = (n) => String(n).padStart(2, '0');

  // 1) Desktop 1280: 4 tab x 3 ngôn ngữ
  for (const lang of ['ja', 'en', 'vi']) {
    for (const hash of ['cover', 'sales-top', 'team-top', 'ai-top']) {
      const tag = `${hash}/${lang}/1280`;
      await go(`${pageUrl}?lang=${lang}#${hash}`, 1280);
      const r = await evaluate(PROBE); checks++;
      ok(r.slides.length >= 4, `${tag}: chỉ thấy ${r.slides.length} slide`);
      ok(/207,\s*201,\s*227/.test(r.bg), `${tag}: nền sau slide không phải tím nhạt Landing Page (${r.bg.slice(0, 60)})`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      r.slides.forEach((s, i) => {
        ok(s.radius >= 12, `${tag}: #${s.id} không bo góc (${s.radius}px)`);
        ok(s.shadow && s.shadow !== 'none', `${tag}: #${s.id} không có bóng đổ`);
        ok(s.left >= 16, `${tag}: #${s.id} dính mép trái (${Math.round(s.left)}px)`);
        ok(s.right <= r.w - 248 - 16 + 1, `${tag}: #${s.id} đè sidebar (${Math.round(s.right)}px)`);
        const want = `${pad(i + 1)} / ${pad(r.slides.length)}`;
        ok(s.slide === want, `${tag}: #${s.id} data-slide "${s.slide}" khác "${want}"`);
        ok(s.chipDisp !== 'none' && s.chip.includes(want), `${tag}: #${s.id} không hiện chip số slide (${s.chip})`);
        if (i) ok(s.top - r.slides[i - 1].bottom >= 40, `${tag}: #${s.id} dính slide trước (khe ${Math.round(s.top - r.slides[i - 1].bottom)}px)`);
      });
    }
  }

  // 2) Phím ←/→ nhảy slide (reduced-motion để cuộn tức thì)
  await go(`${pageUrl}?lang=ja#team-top`, 1280, '', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await evaluate('window.scrollTo({top:0,behavior:"instant"}),1'); await sleep(200);
  const slideTop = (i) => evaluate(`(() => { const m = document.querySelector('main:not([hidden])');
    const ps = [...m.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none');
    return Math.round(ps[${i}].getBoundingClientRect().top); })()`);
  await key('ArrowRight', 39); await sleep(500); checks++;
  const t1 = await slideTop(1);
  ok(t1 >= 70 && t1 <= 95, `phím →: slide 2 phải lên sát dưới thanh menu (top ${t1}px, mong 82)`);
  await key('ArrowRight', 39); await sleep(500); checks++;
  const t2 = await slideTop(2);
  ok(t2 >= 70 && t2 <= 95, `phím → lần 2: slide 3 phải lên đầu (top ${t2}px)`);
  await key('ArrowLeft', 37); await sleep(500); checks++;
  const t1b = await slideTop(1);
  ok(t1b >= 70 && t1b <= 95, `phím ←: phải quay về slide 2 (top ${t1b}px)`);
  // vừa bấm tab trên thanh menu (con trỏ đang ở link) thì phím → vẫn chạy
  await evaluate('window.scrollTo({top:0,behavior:"instant"}),document.querySelector(".top-nav a.on").focus(),1'); await sleep(200);
  await key('ArrowRight', 39); await sleep(500); checks++;
  const t1c = await slideTop(1);
  ok(t1c >= 70 && t1c <= 95, `phím → khi con trỏ ở link tab: slide 2 phải lên đầu (top ${t1c}px)`);

  // 3) Mobile 390
  for (const hash of ['cover', 'team-top']) {
    await go(`${pageUrl}?lang=vi#${hash}`, 390);
    const r = await evaluate(PROBE); checks++;
    ok(r.overflowX <= 1, `${hash}/390: tràn ngang ${r.overflowX}px`);
    r.slides.forEach((s) => {
      ok(s.left >= 6 && s.right <= 390 - 6, `${hash}/390: #${s.id} dính mép (${Math.round(s.left)}..${Math.round(s.right)})`);
      ok(s.radius >= 10, `${hash}/390: #${s.id} không bo góc`);
    });
  }

  // 4) Bản in A4 giữ nguyên
  await go(`${pageUrl}?lang=ja#cover`, 794, 'print');
  const pr = await evaluate(PROBE); checks++;
  pr.slides.forEach((s) => {
    ok(s.radius === 0, `in: #${s.id} bị bo góc (${s.radius}px)`);
    ok(s.shadow === 'none', `in: #${s.id} còn bóng đổ`);
    ok(!s.chip.includes(' / '), `in: #${s.id} còn chip số slide`);
  });

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-lp-slides (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-lp-slides: ${checks} lượt kiểm, 0 lỗi JS: 4 tab x 3 ngôn ngữ mỗi section là 1 slide (bo góc, bóng, nền tím, khe >= 40px, chip NN / tổng đúng thứ tự), phím ←/→ nhảy đúng slide, mobile không tràn, bản in A4 giữ nguyên`);
    process.exit(0);
  }, 300);
});
