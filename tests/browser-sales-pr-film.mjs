// Trang Sales 05 (#sales-pr): phim từng bước .sf (tools/film/step-film.mjs), đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 1280 / 820 / 390 / 340 (reduced-motion): phim hiện, đứng yên ở bước 1, chữ không tràn, khối không vượt đáy tờ,
//    nét nối không chồng icon, 6 nút 1 hàng, rộng 2 cột / hẹp dọc, không tràn ngang.
// 2) Có chuyển động (1280): chạy khi vào khung, giữa mỗi khe đúng 1 chữ + 1 cảnh + nút sáng, người chạy đứng trên nút, nút dừng
//    đứng hình, ra khỏi màn hình .is-off, bấm hình không mở hộp phóng to, 0 lỗi JS.
// Chạy: node tests/browser-sales-pr-film.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sf-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const FIG = '#sales-pr .sf';

const PROBE = `(() => {
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const R = (e) => e.getBoundingClientRect();
  const inside = (e, box, t = 1) => { const r = R(e), b = R(box); return r.left >= b.left - t && r.right <= b.right + t && r.top >= b.top - t && r.bottom <= b.bottom + t; };
  const pg = document.querySelector('#sales-pr'), f = pg.querySelector('.sf');
  const over = [], seg = [], bottom = [];
  for (const e of f.querySelectorAll('.sf-tt,.sf-ds,.sf-no')) if (vis(e) && !inside(e, f.querySelector('.sf-stage'))) over.push(e.textContent.trim().slice(0, 30));
  for (const e of f.querySelectorAll('.sf-trk,.sf-stage,.mv-head')) if (vis(e) && !inside(e, f, 2)) over.push('khối ' + e.className + ' ra ngoài phim');
  const pb = R(pg).bottom;
  for (const c of pg.children) { const s = getComputedStyle(c); if (!vis(c) || s.position === 'absolute' || s.position === 'fixed' || c.classList.contains('deco')) continue;
    if (R(c).bottom > pb + 1) bottom.push((c.className || c.tagName) + ' +' + Math.round(R(c).bottom - pb) + 'px'); }
  const nds = [...f.querySelectorAll('.sf-nd')];
  nds.forEach((n, i) => { if (i === nds.length - 1) return; const a = getComputedStyle(n, '::after'); if (a.display === 'none' || a.content === 'none') return;
    const x0 = R(n).left + parseFloat(a.left), x1 = x0 + parseFloat(a.width), me = R(n.querySelector('.sf-dt')), nx = R(nds[i + 1].querySelector('.sf-dt'));
    if (x0 < me.right + 2 || x1 > nx.left - 2) seg.push('đoạn ' + (i + 1) + ': ' + Math.round(x0 - me.right) + '/' + Math.round(nx.left - x1)); });
  const tx = [...f.querySelectorAll('.sf-tx')].filter((e) => +getComputedStyle(e).opacity > .5);
  const scn = R(f.querySelector('.sf-scn'));
  return { view: document.body.dataset.view, shown: vis(f), over, seg, bottom, tx: tx.length, step1: !!(tx[0] && tx[0].classList.contains('sf-s0')),
    scnW: Math.round(scn.width), cols: getComputedStyle(f.querySelector('.sf-stage')).gridTemplateColumns.split(' ').length,
    nodes: nds.length, nodeRow: new Set(nds.map((n) => Math.round(R(n).top))).size,
    anim: document.getAnimations().filter((a) => a.animationName && a.effect && a.effect.target !== f && f.contains(a.effect.target)).map((a) => a.animationName + "@" + a.effect.target.className).join(" ") || 0,
    gx: pg.querySelectorAll('figure.gx').length, overflowX: document.documentElement.scrollWidth - innerWidth };
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

  // 1) Bố cục tĩnh (reduced-motion): 3 ngôn ngữ x 4 bề rộng
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 820, 390, 340]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}&mode=pdf#sales-pr`, w, true);
      await reveal('#sales-pr');
      const r = await evaluate(PROBE); checks++;
      ok(r.view === 'sales' && r.shown, `${tag}: phim #sales-pr không hiện (${r.view})`);
      ok(r.gx === 0, `${tag}: #sales-pr còn cảnh .gx cũ`);
      ok(r.anim === 0, `${tag}: reduced-motion còn ${r.anim} chuyển động`);
      ok(r.tx === 1 && r.step1, `${tag}: khung tĩnh phải hiện đúng chữ bước 1 (${r.tx})`);
      ok(!r.over.length, `${tag}: chữ / khối tràn phim ${r.over.slice(0, 4).join(' | ')}`);
      ok(!r.bottom.length, `${tag}: khối vượt đáy tờ ${r.bottom.slice(0, 4).join(' | ')}`);
      ok(!r.seg.length, `${tag}: nét nối chồng icon ${r.seg.slice(0, 3).join(' | ')}`);
      ok(r.nodes === 6 && r.nodeRow === 1, `${tag}: thanh 6 bước phải nằm 1 hàng (${r.nodes} nút, ${r.nodeRow} hàng)`);
      ok(w > 700 ? r.cols === 2 : r.cols === 1, `${tag}: bố cục ${r.cols} cột sai (rộng: 2 cột, hẹp: dọc)`);
      ok(r.scnW >= 150, `${tag}: cảnh nhân vật quá nhỏ (${r.scnW}px)`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      if (w === 1280 || w === 390) await shot(`pr-${lang}-${w}.png`, FIG);
    }
  }

  // 2) Chuyển động thật (1280, vi)
  await go(`${pageUrl}?lang=vi&mode=pdf#sales-pr`, 1280, false);
  await reveal('#sales-pr');
  await evaluate(`(document.querySelector('${FIG}').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 600)))`);
  const probe = `(() => { const f = document.querySelector('${FIG}');
    const an = document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target) && /^sfN6/.test(a.animationName || ''));
    return { n: an.length, t: an.length ? Math.round(an[0].currentTime) : -1, off: f.classList.contains('is-off'),
      fx: new Set(document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target) && /^sf[A-Z]/.test(a.animationName || '') && !/^sfN/.test(a.animationName)).map((a) => a.animationName)).size }; })()`;
  const a1 = await evaluate(probe); checks++;
  ok(a1.n >= 6 * 3 + 1 && !a1.off, `phim chưa chạy khi vào khung (${JSON.stringify(a1)})`);
  ok(a1.fx >= 12, `đạo cụ chưa chạy đủ loại hiệu ứng (${a1.fx})`);
  // nút dừng kiểm TRƯỚC khi tua bằng script (gọi pause()/play() từ script thì animation-play-state của CSS không còn tác dụng)
  await evaluate(`document.querySelector('${FIG} .mv-pp').click()`); await sleep(300);
  const p1 = await evaluate(probe); await sleep(1200); const p2 = await evaluate(probe); checks++;
  ok(p1.t === p2.t, `bấm dừng mà vẫn chạy (${p1.t} -> ${p2.t})`);
  await evaluate(`document.querySelector('${FIG} .mv-pp').click()`);
  for (let i = 0; i < 6; i++) {
    const m = await evaluate(`(() => { const f = document.querySelector('${FIG}');
      document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target) && /^sf/.test(a.animationName || '')).forEach((a) => { a.pause(); a.currentTime = /^sfN6/.test(a.animationName) ? ${i * 3000 + 1500} : 1200; });
      const me = f.querySelector('.sf-me').getBoundingClientRect(), nd = f.querySelector('.sf-nd.sf-s${i} .sf-dt').getBoundingClientRect();
      const idx = (sel) => [...f.querySelectorAll(sel)].map((e, k) => +getComputedStyle(e).opacity > .5 ? k : -1).filter((k) => k >= 0).join();
      return { dx: Math.round(Math.abs(me.left + me.width / 2 - nd.left - nd.width / 2)), op: +getComputedStyle(f.querySelector('.sf-run')).opacity,
        on: idx('.sf-tx'), sc: idx('.sf-sc'), lit: +getComputedStyle(f.querySelector('.sf-nd.sf-s${i} .sf-lit')).opacity }; })()`); checks++;
    ok(m.dx < 6 && m.op > 0.9, `bước ${i + 1}: người chạy lệch nút ${m.dx}px / mờ ${m.op}`);
    ok(m.on === String(i) && m.sc === String(i), `bước ${i + 1}: chữ / cảnh hiện sai (${m.on} / ${m.sc})`);
    ok(m.lit > 0.9, `bước ${i + 1}: nút bước chưa sáng (${m.lit})`);
    await shot(`pr-anim-step${i + 1}.png`, FIG);
  }
  await evaluate(`(scrollTo(0, 0), new Promise((r) => setTimeout(r, 500)))`); checks++;
  ok(await evaluate(`document.querySelector('${FIG}').classList.contains('is-off')`), 'ra khỏi màn hình phim không dừng (.is-off)');
  await evaluate(`(document.querySelector('${FIG}').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 400)))`);
  await evaluate(`document.querySelector('${FIG} .sf-sc img').click()`); await sleep(300); checks++;
  ok(!(await evaluate(`!!document.querySelector('.zm-box.on,.zm.on,[class*="zoom"].is-open,dialog[open]')`)), 'bấm hình trong phim mở hộp phóng to');
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-pr-film (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-pr-film: ${checks} lượt (3 ngôn ngữ x 4 bề rộng + chuyển động): phim 6 bước #sales-pr không tràn, nét nối không chồng icon, mỗi lúc 1 bước, người chạy khớp nút, dừng / .is-off được, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
