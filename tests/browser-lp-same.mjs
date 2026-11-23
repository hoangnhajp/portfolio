// Task lcbk: trên Chrome headless thật (CDP), portfolio phải trình bày Y HỆT Landing Page GPR FLEXEYE
// (D:\Gprflexeye Homepages\Landing Page): nền tím #cfc9e3 -> #b3abce, mỗi section là một tờ A4 794px bo 3px
// có bóng đổ như mẫu, khe giữa tờ >= 72px, thanh chương mép trái 5px, chân trang .ft hiện, bìa nền navy,
// menu tab là viên thuốc navy nổi (tab đang mở màu cam #F68209), nút ngôn ngữ là viên thuốc navy góc phải
// có quả địa cầu (bấm đổi đúng ngôn ngữ), mục lục thành ngăn kéo; tiêu đề .kw tiếng Anh / Việt là
// Space Grotesk chữ hoa. Mobile 390 không tràn; bản in A4 giữ nguyên (không bóng, ẩn nút nổi).
// Chạy: node tests/browser-lp-same.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'lpsame-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const main = document.querySelector('main:not([hidden])');
  const ps = [...main.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none');
  const cs = (e) => e ? getComputedStyle(e) : null;
  const top = document.querySelector('.top'), tr = top.getBoundingClientRect(), on = document.querySelector('.top-nav a.on');
  const i18n = document.getElementById('lp-i18n'), sb = document.getElementById('sb'), sbBtn = document.getElementById('sbBtn');
  const kw = [...main.querySelectorAll('.pg .kw')].find((k) => k.offsetParent);
  return {
    lang: document.documentElement.lang, w: document.documentElement.clientWidth,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bg: cs(main).backgroundImage,
    slides: ps.map((p) => { const r = p.getBoundingClientRect(), s = cs(p), ft = p.querySelector(':scope>.ft');
      return { id: p.id, dark: p.classList.contains('pg--dark'), top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right,
        width: r.width, height: r.height, radius: parseFloat(s.borderTopLeftRadius), shadow: s.boxShadow, bgi: s.backgroundImage,
        stripe: parseFloat(getComputedStyle(p, '::before').width) || 0, ft: ft ? cs(ft).display : 'none' }; }),
    top: { disp: cs(top).display, w: tr.width, h: tr.height, radius: parseFloat(cs(top).borderTopLeftRadius), bg: cs(top).backgroundColor,
      onBg: on ? cs(on).backgroundColor : '', onColor: on ? cs(on).color : '' },
    i18n: i18n ? { disp: cs(i18n).display, pos: cs(i18n).position, bg: cs(i18n).backgroundColor, n: i18n.querySelectorAll('button').length,
      svg: !!i18n.querySelector('svg'), right: i18n.getBoundingClientRect().right, pressed: (i18n.querySelector('button[aria-pressed="true"]') || {}).dataset?.lang } : null,
    sbX: sb ? new DOMMatrixReadOnly(cs(sb).transform).m41 : 0, sbBtn: sbBtn ? cs(sbBtn).display : 'none',
    kw: kw ? { ff: cs(kw).fontFamily, tt: cs(kw).textTransform } : null
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
  const go = async (url, w, media = '') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };

  // 1) Desktop 1440: 4 tab x 3 ngôn ngữ
  for (const lang of ['ja', 'en', 'vi']) {
    for (const hash of ['cover', 'sales-top', 'team-top', 'ai-top']) {
      const tag = `${hash}/${lang}/1440`;
      await go(`${pageUrl}?lang=${lang}#${hash}`, 1440);
      const r = await evaluate(PROBE); checks++;
      ok(r.slides.length >= 4, `${tag}: chỉ thấy ${r.slides.length} tờ`);
      ok(/207,\s*201,\s*227/.test(r.bg) && /179,\s*171,\s*206/.test(r.bg), `${tag}: nền không phải tím Landing Page (${r.bg.slice(0, 80)})`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      r.slides.forEach((s, i) => {
        ok(Math.abs(s.width - 794) <= 1, `${tag}: #${s.id} rộng ${Math.round(s.width)}px, mẫu là tờ A4 794px`);
        ok(s.height >= 1122, `${tag}: #${s.id} cao ${Math.round(s.height)}px, mẫu là tờ A4 >= 1123px`);
        ok(s.radius === 3, `${tag}: #${s.id} bo ${s.radius}px, mẫu bo 3px`);
        ok(/-34px/.test(s.shadow), `${tag}: #${s.id} bóng đổ khác mẫu (${s.shadow.slice(0, 60)})`);
        ok(s.stripe === 5, `${tag}: #${s.id} thanh chương ${s.stripe}px, mẫu 5px`);
        ok(s.ft !== 'none', `${tag}: #${s.id} ẩn chân trang .ft (mẫu có)`);
        if (i) ok(s.top - r.slides[i - 1].bottom >= 72 || Math.abs(s.top - r.slides[i - 1].top) < 2, `${tag}: #${s.id} khe tờ ${Math.round(s.top - r.slides[i - 1].bottom)}px < 72`);
      });
      if (hash === 'cover') ok(r.slides[0].dark && /8,\s*21,\s*43/.test(r.slides[0].bgi), `${tag}: bìa không phải nền navy như mẫu`);
      ok(r.top.disp !== 'none' && r.top.w < r.w - 200 && r.top.radius >= 20, `${tag}: menu tab không phải viên thuốc nổi (rộng ${Math.round(r.top.w)}, bo ${r.top.radius})`);
      ok(/11,\s*28,\s*56/.test(r.top.bg), `${tag}: menu tab không nền navy (${r.top.bg})`);
      ok(/246,\s*130,\s*9/.test(r.top.onBg), `${tag}: tab đang mở không cam #F68209 (${r.top.onBg})`);
      ok(r.i18n && r.i18n.disp !== 'none' && r.i18n.pos === 'fixed' && r.i18n.n === 3 && r.i18n.svg, `${tag}: thiếu nút ngôn ngữ nổi kiểu mẫu`);
      ok(r.i18n && r.i18n.right >= r.w - 40, `${tag}: nút ngôn ngữ không ở góc phải`);
      ok(r.i18n && r.i18n.pressed === lang, `${tag}: nút ngôn ngữ không đánh dấu ${lang} (${r.i18n && r.i18n.pressed})`);
      ok(r.sbX > 100 && r.sbBtn !== 'none', `${tag}: mục lục chưa thành ngăn kéo (dịch ${r.sbX}px, nút ${r.sbBtn})`);
      if (lang !== 'ja' && r.kw) ok(/Space Grotesk/.test(r.kw.ff) && r.kw.tt === 'uppercase', `${tag}: tiêu đề .kw chưa Space Grotesk chữ hoa (${r.kw.ff} ${r.kw.tt})`);
    }
  }

  // 2) Bấm nút ngôn ngữ nổi đổi đúng ngôn ngữ
  await go(`${pageUrl}?lang=ja#cover`, 1440);
  for (const l of ['en', 'vi', 'ja']) {
    await evaluate(`document.querySelector('#lp-i18n button[data-lang="${l}"]').click(),1`); await sleep(150);
    const r = await evaluate(PROBE); checks++;
    ok(r.lang === l && r.i18n.pressed === l, `bấm ${l}: lang=${r.lang}, nút sáng=${r.i18n.pressed}`);
  }
  // ngăn kéo mục lục mở / đóng
  await evaluate(`document.getElementById('sbBtn').click(),1`); await sleep(450); checks++;
  ok(Math.abs((await evaluate(PROBE)).sbX) < 2, 'bấm 目次: ngăn kéo mục lục không mở');
  await evaluate(`document.getElementById('sbBtn').click(),1`); await sleep(450);

  // 3) Rộng 1920: hai tờ một hàng như mẫu
  await go(`${pageUrl}?lang=ja#cover`, 1920);
  const wide = await evaluate(PROBE); checks++;
  ok(wide.slides.length > 1 && Math.abs(wide.slides[0].top - wide.slides[1].top) < 2, 'rộng 1920: không xếp hai tờ một hàng như mẫu');
  ok(wide.overflowX <= 1, `rộng 1920: tràn ngang ${wide.overflowX}px`);

  // 4) Mobile 390
  for (const hash of ['cover', 'team-top', 'ai-top']) {
    await go(`${pageUrl}?lang=vi#${hash}`, 390);
    const r = await evaluate(PROBE); checks++;
    ok(r.overflowX <= 1, `${hash}/390: tràn ngang ${r.overflowX}px`);
    r.slides.forEach((s) => ok(s.left >= 6 && s.right <= 390 - 6, `${hash}/390: #${s.id} dính mép (${Math.round(s.left)}..${Math.round(s.right)})`));
    ok(r.top.w <= 390 && r.i18n && r.i18n.disp !== 'none', `${hash}/390: menu / nút ngôn ngữ tràn hoặc mất`);
  }

  // 5) Bản in A4 giữ nguyên
  await go(`${pageUrl}?lang=ja#cover`, 794, 'print');
  const pr = await evaluate(PROBE); checks++;
  pr.slides.forEach((s) => {
    ok(s.radius === 0, `in: #${s.id} bị bo góc (${s.radius}px)`);
    ok(s.shadow === 'none', `in: #${s.id} còn bóng đổ`);
  });
  ok(pr.i18n && pr.i18n.disp === 'none', 'in: còn nút ngôn ngữ nổi');
  ok(pr.top.disp === 'none', 'in: còn menu tab');

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-lp-same (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-lp-same: ${checks} lượt kiểm, 0 lỗi JS: 4 tab x 3 ngôn ngữ đúng kiểu Landing Page (tờ A4 794px bo 3px, nền tím, bìa navy, chân trang, menu và nút ngôn ngữ viên thuốc navy nổi, mục lục ngăn kéo, tiêu đề chữ hoa), 1920 hai tờ một hàng, mobile không tràn, bản in giữ nguyên`);
    process.exit(0);
  }, 300);
});
