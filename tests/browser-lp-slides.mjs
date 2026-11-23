// Task m9qu: kiểm trên Chrome headless thật (CDP) rằng mỗi section hiện như một trang slide kiểu
// Landing Page GPR FLEXEYE: tờ có bóng đổ trên nền tím nhạt, các tờ không chồng nhau, số slide "NN / tổng"
// (data-slide + ::after) đúng thứ tự trong từng tab, phím ←/→ nhảy đúng hàng slide (1 hoặc 2 tờ một hàng),
// không tràn ngang, mobile không tràn, bản in A4 giữ nguyên (không bo góc, không bóng, không số slide).
// Kích thước / bo góc / vị trí số trang do khối lp-same (task lcbk) quyết, test này không ép.
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

  // 1) Desktop 1280 + 1600: 4 tab x 3 ngôn ngữ
  for (const [w, langs] of [[1280, ['ja', 'en', 'vi']], [1600, ['ja']]]) {
    for (const lang of langs) {
      for (const hash of ['cover', 'sales-top', 'team-top', 'ai-top']) {
        const tag = `${hash}/${lang}/${w}`;
        await go(`${pageUrl}?lang=${lang}#${hash}`, w);
        const r = await evaluate(PROBE); checks++;
        ok(r.slides.length >= 4, `${tag}: chỉ thấy ${r.slides.length} slide`);
        ok(/207,\s*201,\s*227/.test(r.bg), `${tag}: nền sau slide không phải tím nhạt Landing Page (${r.bg.slice(0, 60)})`);
        ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
        r.slides.forEach((s, i) => {
          ok(s.shadow && s.shadow !== 'none', `${tag}: #${s.id} không có bóng đổ (không thành tờ riêng)`);
          ok(s.left >= 8 && s.right <= r.w - 8, `${tag}: #${s.id} dính mép (${Math.round(s.left)}..${Math.round(s.right)})`);
          const want = `${pad(i + 1)} / ${pad(r.slides.length)}`;
          ok(s.slide === want, `${tag}: #${s.id} data-slide "${s.slide}" khác "${want}"`);
          ok(s.chipDisp !== 'none' && s.chip.includes(want), `${tag}: #${s.id} không hiện số slide (${s.chip})`);
          for (const o of r.slides.slice(0, i)) {
            const overlap = s.left < o.right - 1 && o.left < s.right - 1 && s.top < o.bottom - 1 && o.top < s.bottom - 1;
            ok(!overlap, `${tag}: #${s.id} chồng lên #${o.id}`);
          }
        });
      }
    }
  }

  // 2) Phím ←/→ nhảy theo hàng slide (reduced-motion để cuộn tức thì); thử cả 1 tờ / hàng và 2 tờ / hàng
  const ROWS = `(() => { const m = document.querySelector('main:not([hidden])');
    const ps = [...m.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none');
    const tops = ps.map((p) => Math.round(p.getBoundingClientRect().top));
    const firsts = []; tops.forEach((t, i) => { if (!firsts.length || t > tops[firsts[firsts.length - 1]] + 10) firsts.push(i) });
    return { tops, firsts, smt: parseFloat(getComputedStyle(ps[0]).scrollMarginTop) || 0 }; })()`;
  for (const w of [1280, 1800]) {
    await go(`${pageUrl}?lang=ja#profile`, w, '', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await evaluate('window.scrollTo({top:0,behavior:"instant"}),1'); await sleep(200);
    const base = await evaluate(ROWS);
    const near = async (k, msg) => { const r = await evaluate(ROWS); checks++;
      const t = r.tops[base.firsts[k]];
      ok(Math.abs(t - r.smt) <= 12, `${w}px ${msg}: hàng slide ${k + 1} (#${base.firsts[k] + 1}) phải lên đầu (top ${t}px, mong ${r.smt})`); };
    await key('ArrowRight', 39); await sleep(400); await near(1, 'phím →');
    await key('ArrowRight', 39); await sleep(400); await near(2, 'phím → lần 2');
    await key('ArrowLeft', 37); await sleep(400); await near(1, 'phím ←');
    // vừa bấm tab trên thanh menu (con trỏ đang ở link) thì phím → vẫn chạy
    await evaluate('window.scrollTo({top:0,behavior:"instant"}),document.querySelector(".top-nav a")?.focus(),1'); await sleep(200);
    await key('ArrowRight', 39); await sleep(400); await near(1, 'phím → khi con trỏ ở link tab');
  }

  // 3) Mobile 390
  for (const hash of ['cover', 'team-top']) {
    await go(`${pageUrl}?lang=vi#${hash}`, 390);
    const r = await evaluate(PROBE); checks++;
    ok(r.overflowX <= 1, `${hash}/390: tràn ngang ${r.overflowX}px`);
    r.slides.forEach((s) => ok(s.left >= 0 && s.right <= 390, `${hash}/390: #${s.id} tràn mép (${Math.round(s.left)}..${Math.round(s.right)})`));
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
    console.log(`PASS browser-lp-slides: ${checks} lượt kiểm, 0 lỗi JS: 4 tab x 3 ngôn ngữ mỗi section là 1 tờ có bóng trên nền tím, không chồng nhau, số slide NN / tổng đúng thứ tự; phím ←/→ nhảy đúng hàng slide ở 1280 và 1800px; mobile không tràn; bản in A4 giữ nguyên`);
    process.exit(0);
  }, 300);
});
