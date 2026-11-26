// 3 trang Sales mới (#sales-map bản đồ công tác, #sales-cycle chu trình 7 bước, #sales-pain nỗi lo khách hàng), đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 3 bề rộng (reduced-motion): tab Sales 12 trang, chữ / icon không tràn thẻ, khối không vượt đáy tờ, nhãn và icon
//    trên bản đồ không đè nhau giữa các điểm, nhãn nằm trong khung bản đồ, nét nối tiến trình 7 bước không chồng icon,
//    reduced-motion hiện đủ và đứng yên, không tràn ngang.
// 2) Có chuyển động (1280): 3 phim chạy khi vào khung, hình thay đổi theo thời gian, mỗi lúc tối đa 1 phụ đề, nút dừng đứng hình;
//    bấm hình trong phim không mở hộp phóng to; 0 lỗi JS.
// Chạy: node tests/browser-sales-2nov.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sl-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const PAGES = ['sales-top', 'sales-map', 'sales-cycle', 'sales-pain'];

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const R = (e) => e.getBoundingClientRect();
  const inside = (e, box, t = 1) => { const r = R(e), b = R(box); return r.left >= b.left - t && r.right <= b.right + t && r.top >= b.top - t && r.bottom <= b.bottom + t; };
  const main = document.querySelector('main[data-view="sales"]');
  const over = [], bottom = [], clash = [], seg = [];
  for (const [sel, boxSel] of [['.sp-cd b,.sp-cd p,.sp-cd img', '.sp-cd'], ['.sc-list b,.sc-list p,.sc-list img', 'li'], ['.meta b', '.meta>div'], ['.sc-tt,.sc-ds,.sc-no', '.sc-stage'], ['.chip', '.kw1'], ['.mv-cap', '.mv']])
    for (const e of main.querySelectorAll(sel)) { if (!vis(e)) continue; const box = e.closest(boxSel); if (box && !inside(e, box)) over.push(sel.split(',')[0] + ': ' + e.textContent.trim().slice(0, 30)); }
  for (const pg of main.querySelectorAll('.pg')) {
    const pb = R(pg).bottom;
    for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
      const cb = R(c).bottom; if (cb > pb + 1) bottom.push(pg.id + ' ' + (c.className || c.tagName) + ' +' + Math.round(cb - pb) + 'px'); }
  }
  let mapH = 1e9;
  for (const mp of main.querySelectorAll('.sm-map')) {
    if (!vis(mp)) continue; mapH = Math.min(mapH, R(mp).height);
    const groups = [...mp.querySelectorAll('.sm-pt,.sm-hcm,.sm-tag')].map((g) => ({ id: (g.querySelector('[data-l]:not([style*="none"])') || g).textContent.trim() || g.className,
      rs: (g.classList.contains('sm-tag') ? [g] : [...g.querySelectorAll('.sm-nm,.sm-wh,.sm-sf')]).filter(vis).map(R) }));
    for (const g of mp.querySelectorAll('.sm-nm,.sm-tag')) if (vis(g) && !inside(g, mp, 4)) over.push('nhãn bản đồ ra ngoài khung: ' + g.textContent.trim().slice(0, 20));
    for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++)
      for (const a of groups[i].rs) for (const b of groups[j].rs) {
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 0 && iy > 0 && ix * iy > .15 * Math.min(a.width * a.height, b.width * b.height)) clash.push(groups[i].id.slice(0, 14) + ' x ' + groups[j].id.slice(0, 14));
      }
  }
  const nds = [...main.querySelectorAll('.sc-nd')];
  nds.forEach((n, i) => { if (i === nds.length - 1) return; const a = getComputedStyle(n, '::after'); if (a.display === 'none' || a.content === 'none') return;
    const x0 = R(n).left + parseFloat(a.left), x1 = x0 + parseFloat(a.width), me = R(n.querySelector('.sc-dt')), nx = R(nds[i + 1].querySelector('.sc-dt'));
    if (x0 < me.right + 2 || x1 > nx.left - 2) seg.push('đoạn ' + (i + 1) + ': ' + Math.round(x0 - me.right) + '/' + Math.round(nx.left - x1)); });
  return { view: document.body.dataset.view,
    anim: document.getAnimations().filter((a) => /^(sm|sc|sp)/.test(a.animationName || '') && main.contains(a.effect && a.effect.target)).length,
    pages: [...main.querySelectorAll('.pg')].filter(vis).length, over, bottom, clash: [...new Set(clash)], seg, mapH: Math.round(mapH),
    hidden: [...main.querySelectorAll('.sm-wh,.sm-sf,.sm-nm,.sm-d,.sp-cd,.sp-ok,.sc-list li')].filter((e) => vis(e) && +getComputedStyle(e).opacity < 0.95).length,
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
      ok(r.pages === 12, `${tag}: cần 12 trang Sales (9 MAYEKAWA + 3 JILNESTA), đang ${r.pages}`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động`);
      ok(!r.over.length, `${tag}: chữ / hình tràn khung ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.clash.length, `${tag}: nhãn / icon bản đồ đè nhau ${r.clash.slice(0, 4).join(' | ')}`);
      ok(!r.seg.length, `${tag}: nét nối tiến trình chồng icon ${r.seg.slice(0, 3).join(' | ')}`);
      ok(r.hidden === 0, `${tag}: reduced-motion còn ${r.hidden} phần tử mờ`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      ok(r.mapH > 120, `${tag}: bản đồ quá nhỏ (${r.mapH}px)`);
      if (w !== 820) for (const s of PAGES) await shot(`sales-${lang}-${w}-${s}.png`, '#' + s);
    }
  }

  // 2) Chuyển động thật (1280, vi): bản đồ, chu trình 7 bước, nỗi lo; nút dừng đứng hình; 1 phụ đề mỗi lúc
  await go(`${pageUrl}?lang=vi&mode=pdf#sales-map`, 1280, false);
  await reveal('#sales-map,#sales-cycle,#sales-pain');
  for (const [fig, pre, caps] of [['#sales-map .smap', /^sm[AHWFN]\d$/, '.sm-caps .mv-cap'], ['#sales-cycle .scyc', /^(sc[SLD]\d|scFx\w+|scMe)$/, '.sc-tx'], ['#sales-pain .spain', /^sp[PGSK]\d$/, '.sp-caps .mv-cap']]) {
    await evaluate(`(document.querySelector('${fig}').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 600)))`);
    const probe = `(() => { const f = document.querySelector('${fig}');
      const an = document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target) && ${pre}.test(a.animationName || ''));
      const caps = '${caps}' ? [...f.querySelectorAll('${caps}')].filter((c) => c.offsetParent && +getComputedStyle(c).opacity > .5).length : 1;
      return { n: an.length, t: an.length ? Math.round(an[0].currentTime) : -1, caps, off: f.classList.contains('is-off') }; })()`;
    const seen = new Set(); let capsBad = 0, a1;
    for (let i = 0; i < 6; i++) {
      const s = await evaluate(probe); if (!i) a1 = s;
      if (s.caps > 1) capsBad++;
      const vis = await evaluate(`[...document.querySelectorAll('${fig} .sm-wh,${fig} .sc-sc,${fig} .sp-s')].map((e) => +getComputedStyle(e).opacity > .5 ? 1 : 0).join('')`);
      seen.add(vis); await sleep(900);
    }
    checks++;
    ok(a1.n >= 7 && !a1.off, `${fig}: chưa chạy chuyển động khi vào khung (${JSON.stringify(a1)})`);
    ok(seen.size >= 2, `${fig}: hình không đổi theo thời gian (${[...seen].join(',')})`);
    ok(!capsBad, `${fig}: có lúc hiện > 1 phụ đề`);
    await shot(`sales-anim-${fig.split(' ')[0].slice(1)}.png`, fig);
    await evaluate(`document.querySelector('${fig} .mv-pp').click()`); await sleep(300);
    const p1 = await evaluate(probe); await sleep(1200); const p2 = await evaluate(probe); checks++;
    ok(p1.t === p2.t, `${fig}: bấm dừng mà vẫn chạy (${p1.t} -> ${p2.t})`);
    await evaluate(`document.querySelector('${fig} .mv-pp').click()`);
  }
  // Hiệu ứng riêng từng bước chạy thật + người que di chuyển dọc dải 7 bước
  await evaluate(`(document.querySelector('#sales-cycle .scyc').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 400)))`);
  const fxP = `(() => { const f = document.querySelector('#sales-cycle .scyc'); const an = document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target));
    return { fx: new Set(an.filter((a) => /^scFx/.test(a.animationName)).map((a) => a.animationName)).size, x: Math.round(f.querySelector('.sc-me').getBoundingClientRect().left) }; })()`;
  const f1 = await evaluate(fxP); await sleep(3200); const f2 = await evaluate(fxP); checks++;
  ok(f1.fx >= 14, `hiệu ứng từng bước chưa chạy đủ loại (${f1.fx})`);
  ok(Math.abs(f2.x - f1.x) > 20, `người que không di chuyển dọc dải bước (${f1.x} -> ${f2.x})`);
  // Ở giữa mỗi bước: người que đứng ngay trên nút của bước đó (lệch tâm < 6px) và hiện rõ, kể cả bước 7
  for (let i = 0; i < 7; i++) {
    const m = await evaluate(`(() => { const f = document.querySelector('#sales-cycle .scyc');
      document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target)).forEach((a) => { a.pause(); a.currentTime = ${i * 3000 + 1500}; });
      const me = f.querySelector('.sc-me').getBoundingClientRect(), nd = f.querySelector('.sc-nd.sc-s${i} .sc-dt').getBoundingClientRect();
      return { dx: Math.round(Math.abs(me.left + me.width / 2 - nd.left - nd.width / 2)), op: +getComputedStyle(f.querySelector('.sc-run')).opacity }; })()`); checks++;
    ok(m.dx < 6 && m.op > 0.9, `bước ${i + 1}: người que lệch nút ${m.dx}px / mờ ${m.op}`);
  }
  await evaluate(`document.getAnimations().forEach((a) => a.play())`);
  for (const [i, t] of [[1, 4500], [4, 13500]]) { await evaluate(`document.getAnimations().filter((a) => document.querySelector('#sales-cycle .scyc').contains(a.effect && a.effect.target) && /^sc[SLD][0-9]$|^scMe$|^scFx/.test(a.animationName)).forEach((a) => { a.currentTime = /^scFx/.test(a.animationName) ? 1500 : ${t}; })`); await sleep(200); await shot(`sales-cycle-step${i + 1}.png`, '#sales-cycle .scyc'); }
  // Bấm vào icon trong hình động không mở hộp phóng to ảnh
  await evaluate(`document.querySelector('#sales-cycle .sc-sc img').click()`); await sleep(300); checks++;
  ok(!(await evaluate(`!!document.querySelector('.zm-box.on,.zm.on,[class*="zoom"].is-open,dialog[open]')`)), 'bấm hình trong phim Sales mở hộp phóng to');
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-2nov (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-2nov: ${checks} lượt (3 ngôn ngữ x 3 bề rộng + chuyển động): Sales 12 trang, bản đồ / chu trình / nỗi lo không tràn, không đè, nét nối không chồng icon, 3 phim chạy + dừng được, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
