// Trang Sales 06 (#sales-reports): 6 thẻ salaryman động .srp, đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 1280 / 820 / 390 / 340 (reduced-motion): đủ 6 thẻ, đứng yên, chữ + popup chat không tràn thẻ,
//    khối không vượt đáy tờ, rộng 3 cột / hẹp 2 hoặc 1 cột, không tràn ngang.
// 2) Có chuyển động (1280): thẻ vào lần lượt, cảnh nhún, đạo cụ bật, 3 popup chat tiếng Nhật hiện lần lượt, 0 lỗi JS,
//    bấm hình không mở hộp phóng to.
// Chạy: node tests/browser-sales-reports-anim.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const chromePath = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'srp-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const R = (e) => e.getBoundingClientRect();
  const inside = (e, box, t = 1) => { const r = R(e), b = R(box); return r.left >= b.left - t && r.right <= b.right + t && r.top >= b.top - t && r.bottom <= b.bottom + t; };
  const pg = document.querySelector('#sales-reports'), g = pg.querySelector('.srp'), cards = [...g.querySelectorAll('.srp-c')];
  const over = [], bottom = [];
  for (const c of cards) for (const e of c.querySelectorAll('.lbl,h3,.srp-scn,.srp-b')) if (vis(e) && !inside(e, c, 2)) over.push((e.className || e.tagName) + ': ' + e.textContent.trim().slice(0, 24));
  const pb = R(pg).bottom;
  for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
    if (R(c).bottom > pb + 1) bottom.push((c.className || c.tagName) + ' +' + Math.round(R(c).bottom - pb) + 'px'); }
  const h3 = cards.map((c) => [...c.querySelectorAll('h3 [data-l]')].filter(vis).length);
  return { view: document.body.dataset.view, n: cards.length, shown: cards.every(vis), over, bottom, h3: h3.join(''),
    cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, scn: Math.round(R(cards[0].querySelector('.srp-scn')).width),
    bub: [...g.querySelectorAll('.srp-b')].filter((b) => vis(b) && +getComputedStyle(b).opacity > .5).length,
    anim: document.getAnimations().filter((a) => /^srp/.test(a.animationName || '') && g.contains(a.effect && a.effect.target)).length,
    overflowX: document.documentElement.scrollWidth - innerWidth };
})()`;

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
  const shot = async (name) => {
    if (!SHOT) return;
    const clip = await evaluate(`(() => { const r = document.querySelector('#sales-reports').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height, scale: 1 }; })()`);
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(async () => { const s = document.querySelector('#sales-reports'); s.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 600)); return 1; })()`);
  };

  // 1) Bố cục tĩnh (reduced-motion)
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390, 340]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}&mode=pdf#sales-reports`, w, true);
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'sales' && r.n === 6 && r.shown, `${tag}: 6 thẻ #sales-reports không hiện đủ (${r.view}, ${r.n})`);
      ok(r.h3 === '111111', `${tag}: mỗi tiêu đề phải hiện đúng 1 ngôn ngữ (${r.h3})`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động`);
      ok(r.bub === 3, `${tag}: khung tĩnh phải hiện đủ 3 popup chat (${r.bub})`);
      ok(!r.over.length, `${tag}: chữ / popup tràn thẻ ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(w > 700 ? r.cols === 3 : w > 420 ? r.cols === 2 : r.cols === 1, `${tag}: số cột ${r.cols} sai`);
      ok(r.scn >= 110, `${tag}: cảnh nhân vật quá nhỏ (${r.scn}px)`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w === 1280 || w === 390) await shot(`srp-${lang}-${w}.png`);
    }
  }

  // 2) Chuyển động thật (1280, vi)
  await go(`${pageUrl}?lang=vi&mode=pdf#sales-reports`, 1280, false);
  const a = await evaluate(`(() => { const g = document.querySelector('#sales-reports .srp');
    const an = document.getAnimations().filter((x) => /^srp/.test(x.animationName || '') && g.contains(x.effect && x.effect.target)).map((x) => x.animationName);
    return { names: [...new Set(an)].sort().join(','), n: an.length }; })()`); checks++;
  ok(a.names === 'srpBob,srpChat,srpIn,srpPop' && a.n >= 6 * 3 + 3, `chuyển động chưa chạy đủ (${JSON.stringify(a)})`);
  // sau khi trang hiện xong (rv + thẻ vào lần lượt), cả 6 thẻ phải rõ hẳn, không kẹt ở trạng thái mờ
  await sleep(2500);
  const vis = await evaluate(`(() => { const op = (e) => { let o = 1; for (; e && e !== document.body; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; };
    return [...document.querySelectorAll('#sales-reports .srp-c')].map((c) => op(c.querySelector('h3')) > .95 ? 1 : 0).join(''); })()`); checks++;
  ok(vis === '111111', `có chuyển động: 6 thẻ chưa hiện rõ sau 2,5 giây (${vis})`);
  // tua 3 mốc của vòng chat 9s: popup hiện lần lượt 1 -> 2 -> 3
  const seen = [];
  for (const t of [1200, 2600, 4000]) {
    seen.push(await evaluate(`(() => { const bs = [...document.querySelectorAll('#sales-reports .srp-b')];
      document.getAnimations().filter((x) => x.animationName === 'srpChat').forEach((x) => { x.pause(); x.currentTime = ${t}; });
      return bs.filter((b) => +getComputedStyle(b).opacity > .5).length; })()`));
  }
  checks++;
  ok(seen.join() === '1,2,3', `popup chat phải hiện lần lượt 1, 2, 3 câu (${seen.join()})`);
  await shot('srp-anim-vi-1280.png');
  await evaluate(`document.querySelector('#sales-reports .srp-scn img').click()`); await sleep(300); checks++;
  ok(!(await evaluate(`!!document.querySelector('.zm-box.on,.zm.on,[class*="zoom"].is-open,dialog[open]')`)), 'bấm hình trong thẻ mở hộp phóng to');
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-reports-anim (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-reports-anim: ${checks} lượt (3 ngôn ngữ x 4 bề rộng + chuyển động): 6 thẻ salaryman không tràn, popup chat tiếng Nhật hiện lần lượt, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
