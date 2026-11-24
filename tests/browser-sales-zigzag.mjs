// Task p0r6: workflow zigzag Sales (#w-mycom) + logo công ty, đo trên Chrome headless thật (CDP).
// 1) 3 ngôn ngữ x 5 bề rộng (reduced-motion): đường nối đi qua đúng tâm 7 chấm, so le (ngang trên rộng, dọc trên hẹp),
//    nhãn không ngắt giữa từ, không đè nhau, không tràn khung; 7 bước sáng hết, không có cục sáng.
// 2) Có chuyển động (vi, 1280): cục sáng chạy, bước sáng dần (giữa chừng sáng một phần, hết vòng sáng đủ 7).
// 3) Logo thật tải được ở cảnh #career và góc trái 4 trang Career (nằm trên dòng Career). Không tràn ngang, 0 lỗi JS.
// Chạy: node tests/browser-sales-zigzag.mjs   (thoát 0 = đạt; SHOT_DIR=<thư mục> để lưu ảnh). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'zz-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// task pt2m: đo cả 2 workflow của #w-mycom (Sales 7 bước, HR 4 bước), bỏ qua icon <img> khi tìm nhãn, kiểm icon tải được
const probe = (sel) => `(() => {
  const z = document.querySelector('${sel}'); const zr = z.getBoundingClientRect();
  const ds = [...z.querySelectorAll('.zz-d')].map((d) => { const r = d.getBoundingClientRect(); return [r.left + r.width / 2 - zr.left, r.top + r.height / 2 - zr.top]; });
  const d = z.querySelector('.zz-lit').getAttribute('d') || '';
  const pts = [...d.matchAll(/(-?[\\d.]+) (-?[\\d.]+)/g)].map((m) => [+m[1], +m[2]]);
  const broken = []; const over = []; const rects = [];
  for (const t of z.querySelectorAll('.zz-t')) {
    const sp = [...t.children].find((s) => s.tagName === 'SPAN' && getComputedStyle(s).display !== 'none'); if (!sp) continue;
    const r = t.getBoundingClientRect(); rects.push([r.left, r.top, r.right, r.bottom, sp.textContent]);
    if (r.left < zr.left - 1 || r.right > zr.right + 1) over.push(sp.textContent);
    const n = sp.firstChild; const re = /[A-Za-zÀ-ỹ0-9][A-Za-zÀ-ỹ0-9'’-]*/g; let m;
    while ((m = re.exec(n.nodeValue))) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
      if (new Set([...rg.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top))).size > 1) broken.push(m[0]); }
  }
  const hit = []; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], b = rects[j];
    if (a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1) hit.push(a[4] + ' / ' + b[4]); }
  const logos = [...document.querySelectorAll('#career img[src^="assets/logos/"], .colg img')].map((i) => ({ s: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0 }));
  const colg = ['w-mycom', 'w-jil', 'w-it', 'w-early'].map((id) => { const s = document.getElementById(id); const c = s.querySelector('.colg').getBoundingClientRect(), e = s.querySelector('.eb').getBoundingClientRect();
    return { id, above: c.bottom <= e.top + 1, left: Math.abs(c.left - e.left) <= 2, fit: c.width <= 300 }; });
  const ic = [...z.querySelectorAll('.zz-n')].map((n) => { const i = n.querySelector('.zz-ic'); return !!i && i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width >= 20; });
  return { ds, pts, ic, on: z.querySelectorAll('.zz-n.on').length, orb: +getComputedStyle(z.querySelector('.zz-orb')).opacity, broken, over, hit, logos, colg,
    w: Math.round(zr.width), overflowX: document.documentElement.scrollWidth - innerWidth };
})()`;
const PROBE = probe('#w-mycom [data-zz]'), PROBE_HR = probe('#w-mycom .zz--4[data-zz]');

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
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, reduce) => {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    // đi qua 4 trang Career để logo tải (lazy) rồi dừng ở workflow
    for (const s of ['#career', '#w-jil', '#w-it', '#w-early']) await evaluate(`(document.querySelector('${s}').scrollIntoView(), new Promise((r) => setTimeout(r, 250)))`);
    await evaluate(`(document.querySelector('#w-mycom .zz--4').scrollIntoView({block:'center'}), new Promise((r) => setTimeout(r, 600)))`);
    await evaluate(`(document.querySelector('#w-mycom [data-zz]').scrollIntoView({block:'center'}), new Promise((r) => setTimeout(r, 1200)))`);
  };
  const near = (a, b) => Math.abs(a[0] - b[0]) <= 2 && Math.abs(a[1] - b[1]) <= 2;
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 900, 640, 390, 340]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#w-mycom`, w, true);
      const r = await evaluate(PROBE); checks++;
      ok(r.pts.length === 7 && r.ds.length === 7, `${tag}: đường nối cần 7 điểm (đang ${r.pts.length}, chấm ${r.ds.length})`);
      ok(r.pts.every((p, i) => r.ds[i] && near(p, r.ds[i])), `${tag}: đường nối không đi qua tâm chấm ${JSON.stringify(r.pts.map((p, i) => [p, r.ds[i]]).slice(0, 3))}`);
      const dy = r.ds.slice(1).map((p, i) => p[1] - r.ds[i][1]), dx = r.ds.slice(1).map((p, i) => p[0] - r.ds[i][0]);
      if (r.w > 560) ok(dy.every((v, i) => Math.abs(v) > 40 && (i === 0 || Math.sign(v) !== Math.sign(dy[i - 1]))) && dx.every((v) => v > 20), `${tag}: khung rộng chưa zigzag ngang (dy ${dy.map(Math.round)})`);
      else ok(dx.every((v, i) => Math.abs(v) > 20 && (i === 0 || Math.sign(v) !== Math.sign(dx[i - 1]))) && dy.every((v) => v > 20), `${tag}: khung hẹp chưa zigzag dọc (dx ${dx.map(Math.round)})`);
      ok(!r.broken.length, `${tag}: nhãn ngắt giữa từ ${r.broken.join(',')}`);
      ok(!r.over.length, `${tag}: nhãn tràn khung ${r.over.join(' | ')}`);
      ok(!r.hit.length, `${tag}: nhãn đè nhau ${r.hit.slice(0, 2).join(' | ')}`);
      ok(r.on === 7 && r.orb === 0, `${tag}: reduced-motion cần sáng đủ 7 bước, không cục sáng (on ${r.on}, orb ${r.orb})`);
      ok(r.logos.length === 9 && r.logos.every((l) => l.ok), `${tag}: logo chưa tải được ${r.logos.filter((l) => !l.ok).map((l) => l.s).join(',')} (${r.logos.length}/9)`);
      for (const c of r.colg) ok(c.above && c.left && c.fit, `${tag}: logo #${c.id} không nằm góc trái trên dòng Career (hoặc khung bị kéo giãn)`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      ok(r.ic.length === 7 && r.ic.every(Boolean), `${tag}: icon Sales chưa tải / quá nhỏ ${JSON.stringify(r.ic)}`);
      const h = await evaluate(PROBE_HR); checks++;
      ok(h.pts.length === 4 && h.pts.every((p, i) => h.ds[i] && near(p, h.ds[i])), `${tag} HR: đường nối không qua tâm 4 chấm`);
      const hy = h.ds.slice(1).map((p, i) => p[1] - h.ds[i][1]), hx = h.ds.slice(1).map((p, i) => p[0] - h.ds[i][0]);
      if (h.w > 560) ok(hy.every((v, i) => Math.abs(v) > 40 && (i === 0 || Math.sign(v) !== Math.sign(hy[i - 1]))) && hx.every((v) => v > 20), `${tag} HR: khung rộng chưa zigzag ngang`);
      else ok(hx.every((v, i) => Math.abs(v) > 20 && (i === 0 || Math.sign(v) !== Math.sign(hx[i - 1]))) && hy.every((v) => v > 20), `${tag} HR: khung hẹp chưa zigzag dọc`);
      ok(!h.broken.length && !h.over.length && !h.hit.length, `${tag} HR: nhãn ngắt từ / tràn / đè ${[...h.broken, ...h.over, ...h.hit].slice(0, 3).join(' | ')}`);
      ok(h.on === 4 && h.orb === 0, `${tag} HR: reduced-motion cần sáng đủ 4 bước (on ${h.on})`);
      ok(h.ic.length === 4 && h.ic.every(Boolean), `${tag} HR: icon chưa tải / quá nhỏ ${JSON.stringify(h.ic)}`);
      if (SHOT && (w === 1280 || w === 390)) {
        const s = await send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(SHOT, `zz-${lang}-${w}.png`), Buffer.from(s.result.data, 'base64'));
      }
    }
  }
  // Chuyển động thật: bước sáng dần theo cục sáng, hết vòng sáng đủ
  await go(`${pageUrl}?lang=vi#w-mycom`, 1280, false);
  const mid = await evaluate(`new Promise((r) => setTimeout(() => r((${PROBE})), 2600))`); checks++;
  ok(mid.on >= 2 && mid.on <= 6, `chuyển động: giữa chừng cần sáng một phần (đang ${mid.on}/7)`);
  ok(mid.orb > 0.5, `chuyển động: cục sáng không hiện (opacity ${mid.orb})`);
  if (SHOT) { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOT, 'zz-vi-1280-motion.png'), Buffer.from(s.result.data, 'base64')); }
  // poll trong 12s (hơn 1 vòng): lấy số bước sáng lớn nhất, không phụ thuộc máy nhanh / chậm
  const maxOn = await evaluate(`new Promise((r) => { let m = 0; const t0 = Date.now(); (function tick() {
    m = Math.max(m, document.querySelectorAll('#w-mycom [data-zz] .zz-n.on').length);
    if (m === 7 || Date.now() - t0 > 12000) r(m); else setTimeout(tick, 100); })(); })`); checks++;
  ok(maxOn === 7, `chuyển động: hết đường cần sáng đủ 7 (tối đa ${maxOn})`);
  await evaluate(`(document.querySelector('#w-mycom .zz--4').scrollIntoView({block:'center'}), 1)`);
  const maxHr = await evaluate(`new Promise((r) => { let m = 0, lo = 9; const t0 = Date.now(); (function tick() {
    const n = document.querySelectorAll('#w-mycom .zz--4 .zz-n.on').length; m = Math.max(m, n); lo = Math.min(lo, n);
    if ((m === 4 && lo < 4) || Date.now() - t0 > 12000) r([lo, m]); else setTimeout(tick, 100); })(); })`); checks++;
  ok(maxHr[1] === 4 && maxHr[0] < 4, `chuyển động HR: bước cần sáng dần tới đủ 4 (thấp nhất ${maxHr[0]}, cao nhất ${maxHr[1]})`);
  if (SHOT) {
    for (const s of ['#career .gx', '#w-mycom .colg', '#w-early .colg', '#w-jil .colg']) {
      await evaluate(`(document.querySelector('${s}').scrollIntoView({block:'center'}), new Promise((r) => setTimeout(r, 1500)))`);
      const c = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOT, `top-${s.replace(/\W+/g, '')}.png`), Buffer.from(c.result.data, 'base64'));
    }
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-zigzag (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-zigzag: ${checks} lượt (3 ngôn ngữ x 5 bề rộng + chuyển động): đường nối qua tâm 7 chấm, zigzag ngang / dọc, nhãn không ngắt từ / đè / tràn, cục sáng chạy và bước sáng dần, 9 logo tải được, logo góc trái 4 trang Career, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
