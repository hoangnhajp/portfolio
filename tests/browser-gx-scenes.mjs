// Cảnh minh hoạ động kiểu GPRFLEXEYE (task kzo4) trên Chrome headless thật (CDP), 3 ngôn ngữ x desktop 1280 / điện thoại 390:
// 1) cuộn tới cảnh: có class is-in, animation vào cảnh + vòng lặp đang chạy; 2) sau khi vào cảnh xong: mọi icon / nhãn hiện rõ,
// icon tải được, không nhãn nào lọt khỏi khung cảnh hay đè lên nhau, trang không tràn ngang, chỉ nhãn đúng ngôn ngữ hiện;
// 3) cuộn đi: is-off, vòng lặp dừng; 4) prefers-reduced-motion: 0 animation, mọi thứ hiện sẵn, bộ đếm đúng số cuối; 5) 0 lỗi JS.
// Chạy: node tests/browser-gx-scenes.mjs [thư mục lưu ảnh]   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const shotDir = process.argv[2];
if (shotDir) mkdirSync(shotDir, { recursive: true });
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'gxs-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const TABS = { cover: ['profile', 'projects', 'skillmap', 'career', 'w-mycom', 'w-jil', 'w-it', 'w-early', 'pcai'], // task ye4s bỏ aiops, aidash, pr
  'sales-top': ['sales-top', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi', 'sales-flow'], 'team-top': ['team-records'], 'ai-top': ['ai-people'] };

// Đo 1 cảnh: phần tử nhìn thấy (đúng ngôn ngữ), độ hiện, khung, chồng lấn nhãn
const MEASURE = (id) => `(() => {
  const f = document.querySelector('#${id} .gx'); if (!f || !f.getClientRects().length) return { missing: true };
  const fr = f.getBoundingClientRect();
  const vis = (e) => e.getClientRects().length > 0;
  const op = (e) => { let o = 1; for (let x = e; x && x !== f.parentElement; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o; };
  const parts = [...f.querySelectorAll('.gx-pl,.gx-lb,.gx-chip,.gx-num,.gx-unit,.gx-bar,.gx-tile,.gx-tag')].filter(vis);
  const faint = parts.filter((e) => op(e) < 0.95).map((e) => e.className + ':' + op(e).toFixed(2));
  const imgs = [...f.querySelectorAll('img')];
  const broken = imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src'));
  const texts = [...f.querySelectorAll('.gx-lb,.gx-chip,.gx-unit,.gx-num')].filter(vis).filter((e) => e.textContent.trim());
  const outside = texts.filter((e) => { const r = e.getBoundingClientRect(); return r.left < fr.left - 1 || r.right > fr.right + 1 || r.top < fr.top - 1 || r.bottom > fr.bottom + 1; })
    .map((e) => e.textContent.trim().slice(0, 24));
  const rs = texts.map((e) => e.getBoundingClientRect());
  const overlap = [];
  for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) {
    if (texts[a].contains(texts[b]) || texts[b].contains(texts[a])) continue;
    const w = Math.min(rs[a].right, rs[b].right) - Math.max(rs[a].left, rs[b].left), h = Math.min(rs[a].bottom, rs[b].bottom) - Math.max(rs[a].top, rs[b].top);
    if (w > 2 && h > 2) overlap.push(texts[a].textContent.trim().slice(0, 14) + ' / ' + texts[b].textContent.trim().slice(0, 14));
  }
  const wrongLang = [...f.querySelectorAll('[data-l]')].filter((e) => vis(e) && e.dataset.l !== document.documentElement.lang).length;
  const nums = [...f.querySelectorAll('.gx-num')].map((n) => ({ v: +n.style.getPropertyValue('--v'), shown: +getComputedStyle(n).getPropertyValue('--n') }));
  const anims = f.getAnimations({ subtree: true }).filter((a) => /^gx/.test(a.animationName || ''));
  // Sidebar cố định / thanh trên không được che cảnh
  const sb = document.getElementById('sb'); const sr = sb && sb.getClientRects().length && getComputedStyle(sb).position === 'fixed' && getComputedStyle(sb).visibility !== 'hidden' ? sb.getBoundingClientRect() : null;
  const covered = sr && sr.width > 0 && sr.left < fr.right - 1 && sr.right > fr.left + 1 && sr.top < fr.bottom && sr.bottom > fr.top && sr.left < innerWidth && sr.right > 0 ? Math.round(fr.right - sr.left) : 0;
  // Số trong vòng % phải nằm gọn trong lòng vòng (đường kính trong ~ 78% khung vòng)
  const ringSpill = [...f.querySelectorAll('.gx-orb--ring')].map((o) => { const r = o.getBoundingClientRect(), v = o.querySelector('.gx-val').getBoundingClientRect(), pad = r.width * 0.1;
    return Math.max(r.left + pad - v.left, v.right - (r.right - pad), r.top + pad - v.top, v.bottom - (r.bottom - pad)); }).filter((d) => d > 1).map((d) => Math.round(d));
  // Nhãn ngắn (<= 8 ký tự) phải nằm trọn 1 dòng, không để rơi 1 chữ xuống dòng dưới
  const split = innerWidth >= 1000 ? [...f.querySelectorAll('.gx-lb')].filter(vis).filter((e) => e.innerText.trim().length <= 8)
    .filter((e) => { const r = document.createRange(); r.selectNodeContents(e); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1; }).map((e) => e.innerText.trim()) : [];
  return { covered, ringSpill, split, w: fr.width, h: fr.height, inC: f.classList.contains('is-in'), off: f.classList.contains('is-off'), parts: parts.length, faint, broken, outside, overlap, wrongLang, nums,
    total: anims.length, running: anims.filter((a) => a.playState === 'running').length, loops: anims.filter((a) => a.effect.getTiming().iterations === Infinity && a.playState === 'running').length,
    overflowX: document.documentElement.scrollWidth - innerWidth };
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
  const shot = async (sid, name) => {
    if (!shotDir) return;
    const box = await evaluate(`(() => { const r = document.querySelector('#${sid} .gx').getBoundingClientRect(); return { x: r.left + scrollX - 12, y: r.top + scrollY - 12, width: r.width + 24, height: r.height + 24, scale: 1 }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: box, captureBeyondViewport: true });
    writeFileSync(join(shotDir, name + '.png'), Buffer.from(r.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, motion = 'no-preference') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(700);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const center = (sid) => evaluate(`(document.querySelector('#${sid} .gx').scrollIntoView({ block: 'center', behavior: 'instant' }), 1)`);
  const loadImgs = (sid) => evaluate(`Promise.all([...document.querySelectorAll('#${sid} .gx img')].map((i) => i.decode().catch(() => 0))).then(() => 1)`);

  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 390]) {
      for (const [tab, ids] of Object.entries(TABS)) {
        await go(`${pageUrl}?lang=${lang}#${tab}`, w);
        for (const sid of ids) {
          const tag = `${sid}/${lang}/${w}px`;
          await center(sid); await sleep(250);
          const live = await evaluate(MEASURE(sid)); checks++;
          if (live.missing) { ok(false, `${tag}: không thấy cảnh .gx`); continue; }
          ok(live.inC, `${tag}: cuộn tới mà chưa có is-in`);
          ok(live.total >= 6 && live.running >= 6, `${tag}: animation chưa chạy (${live.running}/${live.total})`);
          ok(live.loops >= 2, `${tag}: thiếu vòng lặp chuyển động nền (${live.loops})`);
          // Tua hết animation vào cảnh (không lặp) để đo trạng thái cuối
          await evaluate(`(document.querySelector('#${sid} .gx').getAnimations({ subtree: true }).forEach((a) => { if (a.effect.getTiming().iterations !== Infinity) a.finish(); }), 1)`);
          await loadImgs(sid); await sleep(60);
          const m = await evaluate(MEASURE(sid)); checks++;
          ok(m.faint.length === 0, `${tag}: còn phần tử mờ sau khi vào cảnh ${m.faint.slice(0, 4).join(' | ')}`);
          ok(m.broken.length === 0, `${tag}: icon không tải được ${m.broken.join(', ')}`);
          ok(m.outside.length === 0, `${tag}: nhãn lọt khỏi khung cảnh ${m.outside.join(' | ')}`);
          ok(m.overlap.length === 0, `${tag}: nhãn đè nhau ${m.overlap.slice(0, 3).join(' | ')}`);
          ok(m.wrongLang === 0, `${tag}: hiện ${m.wrongLang} nhãn sai ngôn ngữ`);
          ok(m.overflowX <= 1, `${tag}: tràn ngang ${m.overflowX}px`);
          ok(!m.covered, `${tag}: sidebar che mất ${m.covered}px của cảnh`);
          ok(!m.split.length, `${tag}: nhãn ngắn bị ngắt dòng ${m.split.join(' | ')}`);
          ok(!m.ringSpill.length, `${tag}: số tràn ra khỏi vòng ${m.ringSpill.join(',')}px`);
          ok(m.h >= 150 && m.h <= (w < 600 ? 560 : 420), `${tag}: chiều cao cảnh bất thường ${Math.round(m.h)}px`);
          ok(m.nums.every((n) => +n.shown === n.v), `${tag}: bộ đếm không dừng đúng số cuối ${JSON.stringify(m.nums)}`);
          if (lang === 'ja' || (lang === 'vi' && w === 390)) await shot(sid, `${sid}-${lang}-${w}`);
        }
        // Cuộn đi: cảnh cuối tab phải is-off và dừng vòng lặp
        const last = ids[ids.length - 1];
        await evaluate(`scrollTo({ top: 0, behavior: 'instant' })`); await sleep(300);
        const below = await evaluate(`(() => { const r = document.querySelector('#${last} .gx').getBoundingClientRect(); return r.top > innerHeight || r.bottom < 0; })()`);
        if (below) {
          const off = await evaluate(MEASURE(last)); checks++;
          ok(off.off && off.running === 0, `${last}/${lang}/${w}px: ra khỏi màn hình mà chưa dừng (off=${off.off}, chạy ${off.running})`);
        }
      }
    }
  }
  // Chạy thật, không tua: 2,6 giây sau khi cuộn tới, mọi phần tử của cảnh đã vào hết (bắt lỗi kẹt animation mà phép tua che mất)
  for (const [tab, ids] of Object.entries(TABS)) {
    await go(`${pageUrl}?lang=ja#${tab}`, 1280); await sleep(3500); // chờ trang tự cuộn về mục đích xong
    for (const sid of ids) {
      await center(sid); await loadImgs(sid); await sleep(2600);
      const m = await evaluate(MEASURE(sid)); checks++;
      ok(!m.off && m.faint.length === 0, `${sid}/live: 2,6s sau khi cuộn tới vẫn còn phần tử chưa hiện ${m.faint.slice(0, 4).join(' | ')} (off=${m.off})`);
      ok(m.nums.every((n) => +n.shown === n.v), `${sid}/live: bộ đếm chưa tới số cuối ${JSON.stringify(m.nums)}`);
    }
  }
  // Giảm chuyển động: không animation, mọi thứ hiện sẵn
  for (const [tab, ids] of Object.entries(TABS)) {
    await go(`${pageUrl}?lang=ja#${tab}`, 1280, 'reduce');
    for (const sid of ids) {
      await center(sid); await loadImgs(sid); await sleep(80);
      const m = await evaluate(MEASURE(sid)); checks++;
      ok(m.total === 0, `${sid}/reduce: vẫn còn ${m.total} animation`);
      ok(m.faint.length === 0, `${sid}/reduce: phần tử chưa hiện ${m.faint.slice(0, 3).join(' | ')}`);
      ok(m.nums.every((n) => +n.shown === n.v), `${sid}/reduce: bộ đếm không hiện số cuối ${JSON.stringify(m.nums)}`);
      if (sid === ids[0]) await shot(sid, `${sid}-reduced-motion`);
    }
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-gx-scenes (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-gx-scenes: ${checks} lượt đo, 0 lỗi JS; 17 cảnh x 3 ngôn ngữ x desktop/điện thoại: vào cảnh khi cuộn tới, vòng lặp nền chạy, icon tải được, nhãn không lọt khung / không đè nhau / đúng ngôn ngữ, không tràn ngang, bộ đếm đúng số cuối, ra khỏi màn hình thì dừng, reduced-motion tĩnh`);
    process.exit(0);
  }, 300);
});
