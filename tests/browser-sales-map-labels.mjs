// Bản đồ công tác (#sales-map): mọi điểm (TP.HCM, Đà Nẵng, Long An, Cần Thơ, Hậu Giang, Sóc Trăng, Bạc Liêu, Cà Mau) đều có nhãn
// hiện rõ, nằm trong khung bản đồ, và nhãn không bị icon (kho lạnh, cá / tôm), chấm hay nhãn của điểm khác che.
// Quét nhiều bề rộng x 3 ngôn ngữ x 2 chế độ (web, ?mode=pdf) ở reduced-motion, cộng khung cuối phim (mọi nhãn đã hiện).
// Chạy: node tests/browser-sales-map-labels.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sml-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let checks = 0;
const POINTS = ['TP.HCM', 'Đà Nẵng', 'Long An', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau'];

// Trả về danh sách lỗi: điểm thiếu nhãn, nhãn ra ngoài khung, nhãn bị phần tử của điểm khác che > 3% diện tích nhãn.
const PROBE = `(() => {
  const R = (e) => e.getBoundingClientRect();
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0 && +s.opacity > 0.5; };
  const out = [], seen = [];
  for (const mp of document.querySelectorAll('#sales-map .sm-map')) {
    const B = R(mp), pts = [...mp.querySelectorAll('.sm-pt,.sm-hcm')];
    for (const p of pts) {
      const name = p.querySelector('[data-l="vi"]').textContent.trim(); seen.push(name);
      const nm = [...p.querySelectorAll('.sm-nm')].find(vis);
      if (!nm) { out.push(name + ': chấm không có nhãn'); continue; }
      const a = R(nm), area = a.width * a.height;
      if (a.left < B.left - 2 || a.right > B.right + 2 || a.top < B.top - 2 || a.bottom > B.bottom + 2) out.push(name + ': nhãn ra ngoài khung bản đồ');
      for (const q of pts) {
        if (q === p) continue;
        for (const e of q.querySelectorAll('.sm-wh,.sm-sf,.sm-mk,.sm-pin,.sm-nm')) {
          if (!vis(e)) continue;
          const b = R(e), ix = Math.min(a.right, b.right) - Math.max(a.left, b.left), iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ix > 0 && iy > 0 && ix * iy > 0.03 * area)
            out.push(name + ' bị che bởi ' + e.className.replace('sm-', '') + ' của ' + q.querySelector('[data-l="vi"]').textContent.trim() + ' ' + Math.round(ix * iy / area * 100) + '%');
        }
      }
    }
  }
  return { out, seen };
})()`;

async function main() {
  let port;
  for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = readFileSync(join(dir, 'DevToolsActivePort'), 'utf8').split('\n')[0].trim(); } catch {} }
  if (!port) throw new Error('Chrome không mở cổng debug');
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pend = new Map(); let loaded = null;
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
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
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(120);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(250);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(document.querySelector('#sales-map').scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 450)))`);
  };
  const check = (tag, r) => {
    checks++;
    for (const n of POINTS) if (!r.seen.includes(n)) fails.push(`${tag}: bản đồ thiếu điểm ${n}`);
    for (const m of r.out) fails.push(`${tag}: ${m}`);
  };

  // 1) Bố cục tĩnh (reduced-motion: mọi nhãn hiện), web + pdf, 3 ngôn ngữ, nhiều bề rộng
  for (const mode of ['', 'pdf']) for (const lang of ['vi', 'ja', 'en'])
    for (const w of [360, 390, 480, 600, 720, 820, 920, 960, 1000, 1040, 1280, 1600]) {
      await go(`${pageUrl}?lang=${lang}${mode ? '&mode=' + mode : ''}#sales-map`, w, true);
      check(`${mode || 'web'}/${lang}/${w}px`, await evaluate(PROBE));
    }
  // 2) Có chuyển động: dừng phim ở khung cuối (12s / 16s, mọi kho lạnh + nhãn đã hiện) rồi đo lại
  for (const lang of ['vi', 'ja']) for (const w of [1280, 960, 390]) {
    await go(`${pageUrl}?lang=${lang}#sales-map`, w, false);
    await evaluate(`(() => { const f = document.querySelector('#sales-map'); document.getAnimations().filter((a) => f.contains(a.effect && a.effect.target))
      .forEach((a) => { a.pause(); a.currentTime = 12000 + (a.effect.getTiming().delay || 0); }); return 1; })()`);
    await sleep(100);
    check(`anim/${lang}/${w}px@12s`, await evaluate(PROBE));
  }
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-sales-map-labels (${fails.length})\n- ` + [...new Set(fails)].slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-sales-map-labels: ${checks} lượt (web + pdf x 3 ngôn ngữ x 12 bề rộng + khung cuối phim): 8 điểm đều có nhãn, trong khung, không bị icon / nhãn điểm khác che`);
    process.exit(0);
  }, 300);
});
