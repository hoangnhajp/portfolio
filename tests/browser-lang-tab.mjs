// Task a9f4: tab Languages (4 trang) + #ai-tools của tab AI, đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): vào #lang-top thì tab Languages sáng, 2 cờ trên menu có kích thước, 4 trang hiện,
//    chữ trong khối động không tràn khung (thẻ ngôn ngữ, hội thoại, sân khấu, sơ đồ cầu nối), không tràn ngang, reduced-motion hiện đủ.
// 2) Có chuyển động (1280): khối vào khung nhìn thì chạy (.lg-on + animation running), ra khỏi thì dừng (paused);
//    hội thoại lần lượt hiện 1 rồi đủ 4 bong bóng; sân khấu mỗi lúc chỉ 1 slide; #ai-tools 4 thẻ chạy khi vào khung.
// 3) Tab My Profile không còn #pcai. 0 lỗi JS.
// Chạy: node tests/browser-lang-tab.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'lang-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1; };
  const over = [];
  const pairs = [['.lg-lang .lg-name,.lg-lang .lg-cert,.lg-lang .lg-use', '.lg-lang'], ['.lg-bub', '.lg-chat'], ['.lg-tk h3,.lg-tk p', '.lg-tk'], ['.lg-hr h3,.lg-hr p', '.lg-hr'],
    ['.lg-sl b', '.lg-screen'], ['.lg-node b,.lg-doc,.lg-hub', '.lg-bridge'], ['.lg-link-t', '.lg-link']];
  const main = document.querySelector('main[data-view="lang"]');
  for (const [sel, boxSel] of pairs) for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 24)); }
  // nhãn / tài liệu trong sơ đồ cầu nối không đè nhau
  const tags = [...main.querySelectorAll('.lg-node b,.lg-node .lg-flagb,.lg-doc,.lg-hub img')].filter(vis).map((e) => [e.textContent.trim().slice(0, 12) || 'hub', e.getBoundingClientRect()]);
  const hit = [];
  for (let i = 0; i < tags.length; i++) for (let j = i + 1; j < tags.length; j++) { const a = tags[i][1], b = tags[j][1];
    if (a.left < b.right - 2 && b.left < a.right - 2 && a.top < b.bottom - 2 && b.top < a.bottom - 2) hit.push(tags[i][0] + ' x ' + tags[j][0]); }
  const flags = [...document.querySelectorAll('.top-nav a[data-view="lang"] .flg')].map((f) => { const r = f.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  return { view: document.body.dataset.view, on: document.querySelector('.top-nav a.on')?.dataset.view, flags,
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, hit,
    hidden: [...main.querySelectorAll('.lg-lang,.lg-tk,.lg-hr,.lg-node,.lg-bub')].filter((e) => +getComputedStyle(e).opacity < 0.95).length,
    overflowX: document.documentElement.scrollWidth - innerWidth };
})()`;
const RUN = (sel) => `(() => { const b = document.querySelector('${sel}'); const an = document.getAnimations().filter((a) => a.effect && a.effect.target && b.contains(a.effect.target));
  return { on: b.classList.contains('lg-on'), n: an.length, run: an.filter((a) => a.playState === 'running').length, paused: an.filter((a) => a.playState === 'paused').length }; })()`;

async function main() {
  let port;
  for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch {} }
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
  const shot = async (name, full) => {
    if (!SHOT) return;
    const p = full ? { format: 'png', captureBeyondViewport: true, clip: await evaluate(`(() => { const r = document.querySelector('${full}').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height, scale: 1 }; })()`) } : { format: 'png' };
    const s = await send('Page.captureScreenshot', p); writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const reveal = (sel) => evaluate(`(async () => { for (const s of document.querySelectorAll('${sel}')) { s.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 450)); } return 1; })()`);

  // 1) Bố cục, reduced-motion
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#lang-top`, w, true);
      await reveal('main[data-view="lang"] .pg');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'lang' && r.on === 'lang', `${tag}: tab Languages chưa bật (view ${r.view}, menu ${r.on})`);
      ok(r.flags.length === 2 && r.flags.every(([fw, fh]) => fw >= 14 && fh >= 9), `${tag}: 2 cờ trên menu chưa hiện (${JSON.stringify(r.flags)})`);
      ok(r.pages === 4, `${tag}: cần 4 trang Languages, đang ${r.pages}`);
      ok(!r.over.length, `${tag}: chữ tràn khung ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.hit.length, `${tag}: nhãn sơ đồ đè nhau ${r.hit.slice(0, 3).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} khối mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (lang === 'vi' || (lang === 'ja' && w === 1280)) for (const s of ['lang-top', 'lang-ja', 'lang-en', 'lang-bridge']) await shot(`lang-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Chuyển động thật
  await go(`${pageUrl}?lang=ja#lang-top`, 1280, false);
  await evaluate(`(document.querySelector('#lang-top .lg-meter').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 900)))`);
  const m1 = await evaluate(RUN('#lang-top .lg-meter')); checks++;
  ok(m1.on && m1.run > 0, `chuyển động: thẻ ngôn ngữ vào khung mà chưa chạy (${JSON.stringify(m1)})`);
  await evaluate(`(document.querySelector('#lang-bridge').scrollIntoView({ block: 'end' }), new Promise((r) => setTimeout(r, 700)))`);
  const m2 = await evaluate(RUN('#lang-top .lg-meter')); checks++;
  ok(!m2.on && m2.run === 0 && m2.paused > 0, `chuyển động: ra khỏi khung mà thẻ ngôn ngữ chưa dừng (${JSON.stringify(m2)})`);
  const b1 = await evaluate(RUN('#lang-bridge .lg-bridge')); checks++;
  ok(b1.on && b1.run > 0, `chuyển động: sơ đồ cầu nối chưa chạy (${JSON.stringify(b1)})`);
  // Hội thoại: lấy mẫu 1 chu kỳ 12s từ lúc vào khung
  await evaluate(`(document.querySelector('#lang-ja .lg-chat').scrollIntoView({ block: 'center' }), 1)`);
  const chat = await evaluate(`new Promise((res) => { const c = document.querySelector('#lang-ja .lg-chat'); const t0 = Date.now(); const seen = [];
    (function tick() { const n = [...c.querySelectorAll('.lg-msg')].filter((e) => +getComputedStyle(e).opacity > 0.9).length; seen.push(n);
      if (Date.now() - t0 > 12500) res({ max: Math.max(...seen), sawOne: seen.includes(1), sawZero: seen.includes(0) }); else setTimeout(tick, 100); })(); })`); checks++;
  ok(chat.max === 4 && chat.sawOne && chat.sawZero, `chuyển động: hội thoại phải hiện dần 1 rồi đủ 4 bong bóng (${JSON.stringify(chat)})`);
  await evaluate(`(document.querySelector('#lang-en .lg-stage').scrollIntoView({ block: 'center' }), 1)`);
  const stage = await evaluate(`new Promise((res) => { const st = document.querySelector('#lang-en .lg-stage'); const t0 = Date.now(); let multi = 0; const shown = new Set();
    (function tick() { const v = [...st.querySelectorAll('.lg-sl')].map((e, i) => [i, +getComputedStyle(e).opacity]).filter(([, o]) => o > 0.6); if (v.length > 1) multi++; v.forEach(([i]) => shown.add(i));
      if (Date.now() - t0 > 9500) res({ multi, shown: [...shown].sort().join() }); else setTimeout(tick, 100); })(); })`); checks++;
  ok(stage.multi === 0 && stage.shown === '0,1,2', `chuyển động: sân khấu phải lần lượt 3 slide, mỗi lúc 1 (${JSON.stringify(stage)})`);
  await shot('lang-ja-1280-stage-motion.png', '#lang-en');
  // #ai-tools
  await go(`${pageUrl}?lang=vi#ai-tools`, 1280, false);
  await evaluate(`(document.querySelector('#ai-tools .tk').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 1500)))`);
  const tk = await evaluate(`(() => { const r = (${RUN('#ai-tools .tk')}); r.cards = document.querySelectorAll('#ai-tools .tk-c').length; r.view = document.body.dataset.view;
    r.vis = [...document.querySelectorAll('#ai-tools .tk-c')].filter((e) => +getComputedStyle(e).opacity > 0.95).length; return r; })()`); checks++;
  ok(tk.view === 'ai' && tk.cards === 4 && tk.on && tk.run > 0 && tk.vis === 4, `#ai-tools: 4 thẻ phải hiện và chạy (${JSON.stringify(tk)})`);
  await shot('ai-tools-vi-1280.png', '#ai-tools');
  await go(`${pageUrl}?lang=ja#ai-tools`, 390, true);
  await reveal('#ai-tools');
  const tkm = await evaluate(`({ x: document.documentElement.scrollWidth - innerWidth })`); checks++;
  ok(tkm.x <= 1, `#ai-tools/390: tràn ngang ${tkm.x}px`);
  await shot('ai-tools-ja-390.png', '#ai-tools');
  // 3) Profile không còn #pcai
  await go(`${pageUrl}?lang=ja#cover`, 1280, true);
  const prof = await evaluate(`({ view: document.body.dataset.view, pcai: !!document.getElementById('pcai'), last: [...document.querySelectorAll('main[data-view="profile"] .pg')].pop().id })`); checks++;
  ok(prof.view === 'profile' && !prof.pcai && prof.last === 'w-early', `Profile: trang cuối phải là #w-early, không còn #pcai (${JSON.stringify(prof)})`);
  await shot('top-nav-ja-1280.png');
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-lang-tab (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-lang-tab: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động + #ai-tools + Profile): tab Languages 2 cờ, 4 trang, chữ không tràn, sơ đồ không đè, chạy khi vào khung / dừng khi ra, hội thoại 1 -> 4, sân khấu 1 slide mỗi lúc, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
