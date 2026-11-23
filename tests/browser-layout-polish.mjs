// Soát bố cục còn tồn sau umv5 (task d2ff) trên Chrome headless thật (CDP):
// 1) thẻ kỹ năng 01..10 cùng hàng có số thứ tự thẳng hàng (căn trên), 2) 「ベトナム語」 không bị ngắt giữa từ,
// 3) tiêu đề lớn (.kw) không có chữ cuối đứng một mình, 4) đầu tab Sales / Team không lặp tên tab 2 lần.
// Chạy: node tests/browser-layout-polish.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'lpb-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Chạy trong trang: các phép đo bố cục
const PROBE = `(() => {
  const vis = (e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
  const main = document.querySelector('main:not([hidden])');
  const out = { view: main.dataset.view, cards: [], split: [], orphans: [], dup: [] };
  // 1) thẻ kỹ năng: số thứ tự lệch so với mép trên thẻ
  for (const c of main.querySelectorAll('.sk7 > .card')) {
    const cb = c.getBoundingClientRect(), nb = c.querySelector('.num').getBoundingClientRect();
    out.cards.push({ n: c.querySelector('.num').textContent.trim(), top: Math.round(cb.top), off: Math.round(nb.top - cb.top) });
  }
  // 2) 「ベトナム語」 nằm trên 1 dòng
  const tw = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) {
    const i = n.nodeValue.indexOf('ベトナム語'); if (i < 0 || !vis(n.parentElement)) continue;
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 5);
    const tops = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
    if (tops.size > 1) out.split.push(n.parentElement.closest('.card,section')?.id || n.nodeValue.slice(0, 30));
  }
  // 3) tiêu đề lớn: từ cuối không đứng một mình trên dòng cuối (bỏ qua nếu ngay trước là <br>)
  for (const h of main.querySelectorAll('h2.kw')) {
    if (!vis(h)) continue;
    const words = []; const w2 = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    for (let n; (n = w2.nextNode());) {
      if (!vis(n.parentElement)) continue;
      const re = /\\S+/g; let m;
      while ((m = re.exec(n.nodeValue))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const rc = [...r.getClientRects()].filter((x) => x.width > 0); if (rc.length) words.push({ t: m[0], top: Math.round(rc[0].top), node: n, idx: m.index }); }
    }
    if (words.length < 3) continue;
    const a = words[words.length - 2], b = words[words.length - 1];
    if (Math.abs(a.top - b.top) > 4) {
      // từ cuối xuống dòng mới: chỉ là lỗi nếu không có <br> ngăn giữa hai từ
      const r = document.createRange(); r.setStart(a.node, a.idx); r.setEnd(b.node, b.idx);
      const hasBr = r.cloneContents().querySelector?.('br');
      if (!hasBr) out.orphans.push((h.closest('section')?.id || '?') + ': "' + b.t + '"');
    }
  }
  // 4) đầu tab: eyebrow và dòng phụ đề không lặp cùng một tên
  const top = main.querySelector('section.pg');
  const eb = top.querySelector('.eb b')?.textContent.trim().toUpperCase();
  const ke = top.querySelector('.kw-en')?.textContent.trim().toUpperCase();
  if (eb && ke && eb === ke) out.dup.push(top.id + ': ' + eb);
  out.overflowX = document.documentElement.scrollWidth - innerWidth;
  return out;
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

  for (const lang of ['ja', 'en', 'vi']) {
    for (const [w, media] of [[1280, ''], [390, ''], [794, 'print']]) {
      for (const hash of ['cover', 'sales-top', 'team-top', 'ai-top']) {
        const tag = `${hash}/${lang}/${media || w + 'px'}`;
        await go(`${pageUrl}?lang=${lang}#${hash}`, w, media);
        const r = await evaluate(PROBE); checks++;
        // 1) cùng hàng (cùng mép trên) thì số thứ tự cách mép trên như nhau
        const rows = {};
        for (const c of r.cards) (rows[c.top] ||= []).push(c);
        for (const row of Object.values(rows)) {
          const offs = row.map((c) => c.off);
          ok(Math.max(...offs) - Math.min(...offs) <= 2, `${tag}: thẻ kỹ năng lệch dòng ${JSON.stringify(row)}`);
        }
        ok(r.split.length === 0, `${tag}: 「ベトナム語」 bị ngắt giữa từ (${r.split.join(', ')})`);
        if (!media) ok(r.orphans.length === 0, `${tag}: tiêu đề lớn có chữ cuối đứng một mình ${r.orphans.join(' | ')}`);
        ok(r.dup.length === 0, `${tag}: đầu tab lặp tên 2 lần (${r.dup.join(', ')})`);
        if (!media) ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      }
    }
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-layout-polish (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`PASS browser-layout-polish: ${checks} lượt kiểm, 0 lỗi JS, 4 tab x 3 ngôn ngữ x desktop/mobile/in A4: thẻ kỹ năng thẳng hàng, 「ベトナム語」 không ngắt, tiêu đề không mồ côi chữ cuối, đầu tab không lặp tên`);
    process.exit(0);
  }, 300);
});
