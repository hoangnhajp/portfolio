// 3 trang JILNESTA cuối tab Sales (#sales-jil-hcm bản đồ TP.HCM, #sales-jil-offshore Việt Nam | online | Nhật Bản, #sales-jil-flow phim
// salaryman 8 bước) + badge logo công ty trên trang Sales, đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 1280 / 820 / 390 (reduced-motion): chữ không tràn khung, khối không vượt đáy tờ, nhãn / icon bản đồ không đè nhau
//    (kể cả logo văn phòng), nhãn trong khung bản đồ, cầu nối nằm giữa 2 bản đồ (hoặc giữa khi xếp dọc), badge logo mọi trang Sales
//    cao >= 26px và nằm trong tờ, logo #w-mycom phóng to, không tràn ngang.
// 2) Có chuyển động (1280): 3 phim chạy khi vào khung, hình đổi theo thời gian, mỗi lúc tối đa 1 phụ đề, nút dừng đứng hình; 0 lỗi JS.
// Chạy: node tests/browser-sales-jil.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sj-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['sales-jil-hcm', 'sales-jil-offshore', 'sales-jil-flow'];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const R = (e) => e.getBoundingClientRect();
  const inside = (e, box, t = 1) => { const r = R(e), b = R(box); return r.left >= b.left - t && r.right <= b.right + t && r.top >= b.top - t && r.bottom <= b.bottom + t; };
  const secs = ${JSON.stringify(PAGES)}.map((id) => document.getElementById(id));
  const over = [], bottom = [], clash = [], logo = [];
  for (const pg of secs) {
    for (const [sel, boxSel] of [['.sc-list b,.sc-list p,.sc-list img', 'li'], ['.meta b', '.meta>div'], ['.sf-tt,.sf-ds,.sf-no', '.sf-stage'], ['.chip', '.kw1'], ['.mv-cap', '.mv'], ['.jl-leg span', '.sm-pn'], ['.jl-bt,.jl-bi,.jl-blg', '.mv'], ['.co-nm', '.colg']])
      for (const e of pg.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(pg.id + ' ' + sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
    const pb = R(pg).bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco') || c.classList.contains('pganh')) continue;
      const cb = R(c).bottom; if (cb > pb + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
    for (const mp of pg.querySelectorAll('.sm-map')) {
      if (!vis(mp)) continue;
      const groups = [...mp.querySelectorAll('.sm-pt,.jl-off,.sm-tag')].map((g) => ({ id: (g.querySelector('[data-l]:not([style*="none"])') || g).textContent.trim() || g.className,
        rs: (g.classList.contains('sm-tag') ? [g] : [...g.querySelectorAll('.sm-nm,.sm-wh,.jl-lg')]).filter(vis).map(R) }));
      for (const g of mp.querySelectorAll('.sm-nm,.sm-tag,.jl-lg')) if (vis(g) && !inside(g, mp, 4)) over.push(pg.id + ' nhãn bản đồ ra ngoài khung: ' + (g.textContent.trim() || g.className).slice(0, 20));
      for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++)
        for (const a of groups[i].rs) for (const b of groups[j].rs) {
          const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ix > 0 && iy > 0 && ix * iy > .15 * Math.min(a.width * a.height, b.width * b.height)) clash.push(pg.id.slice(10) + ' ' + groups[i].id.slice(0, 14) + ' x ' + groups[j].id.slice(0, 14));
        }
    }
  }
  for (const pg of document.querySelectorAll('main[data-view="sales"] .pg')) {
    const l = pg.querySelector(':scope>.colg--co img');
    if (!l) { logo.push(pg.id + ' thiếu badge'); continue; }
    if (R(l).height < 26 || !inside(l, pg)) logo.push(pg.id + ' logo ' + Math.round(R(l).height) + 'px');
  }
  const br = document.querySelector('#sales-jil-offshore .jl-br'), pv = document.querySelector('.jl-pn--vn'), pj = document.querySelector('.jl-pn--jp');
  const row = Math.abs(R(pv).top - R(pj).top) < 2;
  const brOk = row ? (R(br).left >= R(pv).right - 1 && R(br).right <= R(pj).left + 1) : (R(br).top >= R(pv).bottom - 1 && R(br).bottom <= R(pj).top + 1);
  return { view: document.body.dataset.view, over, bottom, clash: [...new Set(clash)], logo, brOk, row,
    anim: document.getAnimations().filter((a) => /^(jl|sfN8)/.test(a.animationName || '')).length,
    hidden: secs.flatMap((s) => [...s.querySelectorAll('.sm-wh,.sm-nm,.sm-d,.sc-list li,.jl-dot')]).filter((e) => vis(e) && +getComputedStyle(e).opacity < 0.95).length,
    mapH: Math.round(Math.min(...secs.flatMap((s) => [...s.querySelectorAll('.sm-map')]).filter(vis).map((m) => R(m).height))),
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
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const reveal = (sel) => evaluate(`(async () => { for (const s of document.querySelectorAll('${sel}')) { s.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 450)); } return 1; })()`);

  // 1) Bố cục tĩnh (reduced-motion): 3 ngôn ngữ x 3 bề rộng
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}&mode=pdf#sales-top`, w, true);
      await reveal('main[data-view="sales"] .pg');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'sales', `${tag}: tab Sales chưa bật (${r.view})`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động`);
      ok(!r.over.length, `${tag}: chữ / hình tràn khung ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.clash.length, `${tag}: nhãn / icon bản đồ đè nhau ${r.clash.slice(0, 4).join(' | ')}`);
      ok(!r.logo.length, `${tag}: badge logo ${r.logo.slice(0, 4).join(' | ')}`);
      ok(r.brOk, `${tag}: cầu nối remote không nằm giữa 2 bản đồ (row=${r.row})`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} phần tử mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      ok(r.mapH > 120, `${tag}: bản đồ quá nhỏ (${r.mapH}px)`);
      if (w !== 820) {
        for (const s of PAGES) await shot(`jil-${lang}-${w}-${s}.png`, '#' + s);
        if (lang === 'vi') { await shot(`jil-${lang}-${w}-sales-pr.png`, '#sales-pr'); await shot(`jil-${lang}-${w}-sales-top.png`, '#sales-top'); }
      }
    }
  }
  // Logo #w-mycom (tab hồ sơ) phóng to
  await go(`${pageUrl}?lang=ja&mode=pdf#w-mycom`, 1280, true); await reveal('#w-mycom');
  const lh = await evaluate(`Math.round(document.querySelector('#w-mycom>.colg img').getBoundingClientRect().height)`); checks++;
  ok(lh >= 38, `#w-mycom logo MAYEKAWA chưa phóng to (${lh}px)`);
  await shot('jil-ja-1280-w-mycom.png', '#w-mycom');

  // 2) Chuyển động thật (1280, vi)
  await go(`${pageUrl}?lang=vi&mode=pdf#sales-jil-hcm`, 1280, false);
  await reveal('#sales-jil-hcm,#sales-jil-offshore,#sales-jil-flow');
  for (const [fig, pre, caps, parts] of [['#sales-jil-hcm .jlmap', /^jlm/, '.mv-cap', '.sm-wh'], ['#sales-jil-offshore .jloff', /^jl[oBF]/, '.mv-cap', '.sm-wh,.sm-d'], ['#sales-jil-flow .sf--jil', /^sfN8/, '.sf-tx', '.sf-sc']]) {
    await evaluate(`(document.querySelector('${fig}').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 600)))`);
    const probe = `(() => { const f = document.querySelector('${fig}');
      const an = document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target) && ${pre}.test(a.animationName || ''));
      const caps = [...f.querySelectorAll('${caps}')].filter((c) => c.offsetParent && +getComputedStyle(c).opacity > .5).length;
      return { n: an.length, t: an.length ? Math.round(an[0].currentTime) : -1, caps, off: f.classList.contains('is-off') }; })()`;
    const sel = parts.split(',').map((p) => `${fig} ${p}`).join(',');
    const seen = new Set(); let capsBad = 0, a1;
    for (let i = 0; i < 7; i++) {
      const s = await evaluate(probe); if (!i) a1 = s;
      if (s.caps > 1) capsBad++;
      seen.add(await evaluate(`[...document.querySelectorAll('${sel}')].map((e) => +getComputedStyle(e).opacity > .5 ? 1 : 0).join('')`));
      if (i === 3) await shot(`jil-anim-${fig.split(' ')[0].slice(1)}.png`, fig);
      await sleep(1000);
    }
    checks++;
    ok(a1.n >= 6 && !a1.off, `${fig}: chưa chạy chuyển động khi vào khung (${JSON.stringify(a1)})`);
    ok(seen.size >= 2, `${fig}: hình không đổi theo thời gian`);
    ok(!capsBad, `${fig}: có lúc hiện > 1 phụ đề`);
    await evaluate(`document.querySelector('${fig} .mv-pp').click()`); await sleep(300);
    const p1 = await evaluate(probe); await sleep(1200); const p2 = await evaluate(probe); checks++;
    ok(p1.t === p2.t, `${fig}: bấm dừng mà vẫn chạy (${p1.t} -> ${p2.t})`);
    await evaluate(`document.querySelector('${fig} .mv-pp').click()`);
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-jil (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-jil: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): 3 trang JILNESTA không tràn, bản đồ không đè, cầu nối đúng chỗ, badge logo mọi trang Sales, logo #w-mycom phóng to, 3 phim chạy + dừng được, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
