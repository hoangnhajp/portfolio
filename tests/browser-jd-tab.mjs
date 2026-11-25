// Task wp5x: tab "JD ANDPAD" (2 trang #jd-top nguyên văn JD, #jd-fit biểu đồ chân dung ứng viên), đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): vào #jd-top thì tab JD sáng, 2 trang hiện; ở 1280px mỗi trang vừa đúng 1 tờ A4
//    (cao <= 1123px); khối không vượt đáy tờ; chữ trong thẻ không tràn thẻ; nhãn radar nằm trong khung thẻ; không tràn ngang;
//    reduced-motion hiện đủ, đứng yên.
// 2) Bản in A4: nội dung 2 trang JD nằm trọn trong tờ (tờ in overflow:hidden nên tràn là mất chữ).
// 3) Nét đứt 4 chặng: mỗi đoạn nối từ mép icon này tới mép icon kế, không chồng icon (ngang ở 1280, dọc ở 390).
// 4) Có chuyển động (1280): radar mọc (jdGrow), thanh mọc (jdBar), chặng / chân dung nảy (jdRise); sau ~2s hiện đủ. 0 lỗi JS.
// Chạy: node tests/browser-jd-tab.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'jd-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['jd-top', 'jd-fit'];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const inside = (e, box) => { const r = e.getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1; };
  const main = document.querySelector('main[data-view="jd"]');
  const over = [], bottom = [];
  for (const [sel, boxSel] of [['.jd-c h3,.jd-c p,.jd-c .lbl,.jd-kw,.jd-leg li,.jd-per li,.jd-rd,.jd-comp', '.jd-c'], ['.jd-radar text', '.jd-c'], ['.jd-st h3,.jd-st p,.jd-st img', '.jd-st'], ['.jd-go a', '.jd-per li'], ['.jd-doc li,.jd-doc p,.jd-doc h4', '.jd-doc']])
    for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
  const heights = {};
  for (const pg of main.querySelectorAll('.pg')) {
    const pr = pg.getBoundingClientRect(); heights[pg.id] = Math.round(pr.height);
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
      const cb = c.getBoundingClientRect().bottom; if (cb > pr.bottom + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pr.bottom) + 'px'); }
  }
  // Nét đứt giữa 2 icon kế nhau: tính từ toạ độ ::after so với icon hiện tại và icon kế
  const links = [], sts = [...main.querySelectorAll('.jd-st')];
  sts.slice(0, -1).forEach((li, i) => {
    const a = getComputedStyle(li, '::after'), lr = li.getBoundingClientRect();
    const x = lr.left + parseFloat(a.left), y = lr.top + parseFloat(a.top), w = parseFloat(a.width), h = parseFloat(a.height);
    const ic = li.querySelector('img').getBoundingClientRect(), nx = sts[i + 1].querySelector('img').getBoundingClientRect();
    const horiz = w > h;
    const gapA = horiz ? x - ic.right : y - ic.bottom, gapB = horiz ? nx.left - (x + w) : nx.top - (y + h);
    links.push({ horiz, gapA: Math.round(gapA), gapB: Math.round(gapB), len: Math.round(horiz ? w : h) });
  });
  return { view: document.body.dataset.view, on: document.querySelector('.top-nav a.on')?.dataset.view,
    sb: !document.querySelector('.sb-nav[data-for="jd"]').hidden,
    anim: document.getAnimations().filter((a) => /^jd/.test(a.animationName || '') && main.contains(a.effect && a.effect.target)).length,
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, bottom, heights, links,
    hidden: [...main.querySelectorAll('.jd-c,.jd-st,.jd-per li,.jd-rd,.jd-doc')].filter((e) => +getComputedStyle(e).opacity < 0.95).length,
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
  const shot = async (name, sel) => {
    if (!SHOT) return;
    const clip = await evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: 0, y: r.top + scrollY, width: innerWidth, height: r.height, scale: 1 }; })()`);
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
    writeFileSync(join(SHOT, name), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce, media = '') => {
    await send('Emulation.setEmulatedMedia', { media, features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
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
      await go(`${pageUrl}?lang=${lang}&mode=pdf#jd-top`, w, true);
      await reveal('main[data-view="jd"] .pg');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'jd' && r.on === 'jd' && r.sb, `${tag}: tab JD chưa bật (view ${r.view}, menu ${r.on}, sidebar ${r.sb})`);
      ok(r.pages === 2, `${tag}: cần 2 trang JD, đang ${r.pages}`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động trong tab JD`);
      ok(!r.over.length, `${tag}: chữ tràn thẻ ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} khối mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w === 1280) for (const s of PAGES) ok(r.heights[s] <= 1124, `${tag}: #${s} cao ${r.heights[s]}px, vượt 1 tờ A4 (1123px)`);
      ok(r.links.length === 3, `${tag}: cần 3 đoạn nét đứt giữa 4 chặng, thấy ${r.links.length}`);
      for (const l of r.links) {
        ok(l.horiz === (w > 700), `${tag}: nét đứt sai hướng ${JSON.stringify(l)}`);
        ok(l.gapA >= 3 && l.gapA <= 10 && l.gapB >= 3 && l.gapB <= 16 && l.len > 8, `${tag}: nét đứt chồng icon hoặc hở quá xa ${JSON.stringify(l)}`);
      }
      if (w !== 820) for (const s of PAGES) await shot(`jd-${lang}-${w}-${s}.png`, '#' + s);
    }
  }
  // 2) Bản in A4: nội dung nằm trọn trong tờ
  for (const lang of ['ja', 'vi']) {
    await go(`${pageUrl}?lang=${lang}#jd-top`, 794, true, 'print');
    const pr = await evaluate(`(() => { const out = [];
      for (const pg of document.querySelectorAll('main[data-view="jd"] .pg')) { const b = pg.getBoundingClientRect();
        for (const c of pg.children) { const s = getComputedStyle(c); if (s.display === 'none' || s.position === 'absolute' || c.classList.contains('deco')) continue;
          const r = c.getBoundingClientRect(); if (r.bottom > b.bottom + 1 || r.right > b.right + 1) out.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(r.bottom - b.bottom)); } }
      return out; })()`); checks++;
    ok(!pr.length, `in A4 ${lang}: nội dung vượt tờ ${pr.slice(0, 4).join(' | ')}`);
  }
  // 3) Chuyển động thật
  await go(`${pageUrl}?lang=ja&mode=pdf#jd-fit`, 1280, false);
  await evaluate(`(document.querySelector('#jd-fit .jd-g').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const m1 = await evaluate(`(() => { const g = document.querySelector('#jd-fit .jd-g'); const an = document.getAnimations().filter((a) => g.contains(a.effect && a.effect.target));
    return { inn: g.classList.contains('sr-in'), grow: an.filter((a) => a.animationName === 'jdGrow').length, bar: an.filter((a) => a.animationName === 'jdBar').length }; })()`); checks++;
  ok(m1.inn && m1.grow === 1 && m1.bar === 9, `chuyển động: radar / thanh chưa chạy (${JSON.stringify(m1)})`);
  await evaluate(`(document.querySelector('#jd-fit .jd-g2').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  const m2 = await evaluate(`document.getAnimations().filter((a) => a.animationName === 'jdRise').length`); checks++;
  ok(m2 >= 8, `chuyển động: chặng / chân dung / vòng phỏng vấn chưa nảy (${m2})`);
  await sleep(2200);
  const m3 = await evaluate(`[...document.querySelectorAll('#jd-fit .jd-st,#jd-fit .jd-per li,#jd-fit .jd-rd,#jd-fit .jd-shape')].filter((e) => +getComputedStyle(e).opacity < 0.99).length`); checks++;
  ok(m3 === 0, `chuyển động: sau khi chạy còn ${m3} phần tử chưa hiện đủ`);
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-jd-tab (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-jd-tab: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + in A4 + chuyển động): tab JD 2 trang vừa 1 tờ A4 mỗi trang, chữ không tràn, nét đứt không chồng icon, in A4 trọn tờ, radar / thanh / chặng chạy rồi hiện đủ, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
