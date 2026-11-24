// Task d704: chữ và icon của bảng "mảng việc" (#projects) vừa khít bố cục xung quanh, chữ tinh giản.
// Chrome headless thật (CDP), 3 ngôn ngữ x 10 bề rộng (1440 xuống 340):
// 1) cảnh 8 ô icon (.gx--grid): mỗi nhãn nằm trên 1 dòng, không ngắt giữa từ ("Marketin g"), không tràn ô; icon cùng cỡ, cân giữa ô
// 2) cảnh lưới khác (Sales / Team / AI): nhãn không ngắt giữa từ
// 3) task kfh1: workflow 12 bước .pj-c chỉ ghi tên: tên tối đa 3 dòng, không ngắt giữa từ, không câu kể / nhãn, icon cùng cỡ, bước không tràn làn, tổng chữ <= trần
// 4) không tràn ngang, không lỗi JS.
// Chạy: node tests/browser-work-areas-fit.mjs [--report]   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const REPORT = process.argv.includes('--report');
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'waf-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;
const MAX_CARD_CHARS = { vi: 50, en: 50, ja: 16 };   // trần tổng chữ hiển thị của 1 bước (số + tên)

const PROBE = `(() => {
  const vis = (e) => e && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
  // các dòng (top) mà một đoạn text chiếm; và các từ bị ngắt giữa chừng
  const lineInfo = (el) => {
    const tops = new Set(); const broken = [];
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) {
      if (!vis(n.parentElement)) continue;
      const all = document.createRange(); all.selectNodeContents(n);
      for (const x of all.getClientRects()) if (x.width > 0) tops.add(Math.round(x.top));
      // ngắt giữa từ: chỉ xét từ Latin / Việt / số; chữ Nhật được xuống dòng giữa các ký tự
      const re = /[A-Za-zÀ-ỹ0-9][A-Za-zÀ-ỹ0-9'’-]*/g; let m;
      while ((m = re.exec(n.nodeValue))) {
        const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const t = new Set([...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)));
        if (t.size > 1) broken.push(m[0]);
      }
    }
    const arr = [...tops].sort((a, b) => a - b); let lines = 0, last = -99;
    for (const v of arr) { if (v - last > 4) lines++; last = v; }
    return { lines, broken };
  };
  const text = (el) => { let s = ''; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode());) if (vis(n.parentElement)) s += n.nodeValue; return s.replace(/\\s+/g, ' ').trim(); };
  const sec = document.querySelector('#projects');
  const out = { tiles: [], cards: [], otherGrid: [], overflowX: document.documentElement.scrollWidth - innerWidth };
  const fig = sec.querySelector('.gx--grid');
  for (const t of fig.querySelectorAll('.gx-tile')) {
    const lb = t.querySelector('.gx-lb'), pl = t.querySelector('.gx-pl');
    const tb = t.getBoundingClientRect(), lr = lb.getBoundingClientRect(), pr = pl.getBoundingClientRect();
    const li = lineInfo(lb);
    out.tiles.push({ t: text(lb), lines: li.lines, broken: li.broken, over: Math.round(Math.max(lr.right - tb.right, tb.left - lr.left, lb.scrollWidth - lb.clientWidth)),
      icon: Math.round(pr.width), top: Math.round(tb.top), w: Math.round(tb.width), h: Math.round(tb.height) });
  }
  for (const c of sec.querySelectorAll('.pj-c')) {
    const all = text(c);
    const ln = c.closest('.pjf-ln'), lr = ln ? ln.getBoundingClientRect() : null, cr = c.getBoundingClientRect();
    const ic = c.querySelector('.pjf-ic img');
    const brokenAll = [];
    for (const part of c.querySelectorAll('.pj-top,.pj-co,.pj-role,.pj-pt,.pj-tags i')) if (vis(part)) brokenAll.push(...lineInfo(part).broken);
    const vtags = [...c.querySelectorAll('.pj-tags i')].filter(vis);
    out.cards.push({ co: text(c.querySelector('.pj-co')), coLines: lineInfo(c.querySelector('.pj-co')).lines,
      ptLines: vis(c.querySelector('.pj-pt')) ? lineInfo(c.querySelector('.pj-pt')).lines : 0,
      role: vis(c.querySelector('.pj-role')), tags: vtags.length, detail: !!c.querySelector('.pj-pt,.pj-tags,.pj-go'),
      icon: ic && vis(ic) ? Math.round(ic.getBoundingClientRect().width) : 0,
      out: lr ? Math.round(Math.max(cr.right - lr.right, lr.left - cr.left, 0)) : 99, chars: [...all.replace(/\\s/g, '')].length, broken: brokenAll });
  }
  for (const lb of document.querySelectorAll('main .gx--grid .gx-tile .gx-lb')) {
    if (lb.closest('#projects') || !vis(lb)) continue;
    const li = lineInfo(lb); if (li.broken.length) out.otherGrid.push(text(lb));
  }
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
  // reduced-motion: cảnh và chữ hiện đủ ngay, đo đúng bố cục cuối
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const go = async (url, w) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(500);
    await evaluate(`document.fonts.ready.then(() => 1)`);
    await evaluate(`(document.querySelector('#projects').scrollIntoView(), new Promise((r) => setTimeout(r, 400)))`);
  };
  const rep = {};
  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1440, 1280, 900, 800, 700, 640, 601, 480, 390, 340]) {
      const tag = `${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#projects`, w);
      const r = await evaluate(PROBE); checks++;
      rep[tag] = r;
      if (SHOT && w === 1280) {
        await evaluate(`document.querySelector('#projects .gx--grid').scrollIntoView({block:'start'})`); await sleep(300);
        const s = await send('Page.captureScreenshot', { format: 'png' });
        writeFileSync(join(SHOT, `projects-${lang}-${w}.png`), Buffer.from(s.result.data, 'base64'));
      }
      ok(r.tiles.length === 8, `${tag}: cảnh icon cần 8 ô (đang ${r.tiles.length})`);
      for (const t of r.tiles) {
        ok(t.lines === 1, `${tag}: nhãn ô "${t.t}" chiếm ${t.lines} dòng (cần 1)`);
        ok(!t.broken.length, `${tag}: nhãn ô "${t.t}" bị ngắt giữa từ`);
        ok(t.over <= 1, `${tag}: nhãn ô "${t.t}" tràn ô ${t.over}px`);
      }
      const icons = new Set(r.tiles.map((t) => t.icon)), hs = r.tiles.map((t) => t.h);
      ok(icons.size === 1, `${tag}: icon các ô không cùng cỡ ${[...icons]}`);
      const rows = new Set(r.tiles.map((t) => t.top)).size;
      if (w >= 900) ok(rows === 2, `${tag}: màn rộng cần 8 ô icon xếp 2 hàng (4 cột), đang ${rows} hàng`);
      ok(Math.max(...hs) - Math.min(...hs) <= 2, `${tag}: các ô cao lệch nhau ${hs}`);
      ok(r.cards.length === 12, `${tag}: cần 12 thẻ (đang ${r.cards.length})`);
      for (const c of r.cards) {
        ok(c.coLines >= 1 && c.coLines <= 3, `${tag}: tên bước "${c.co}" ${c.coLines} dòng (1 đến 3)`);
        ok(!c.detail && !c.ptLines && !c.tags, `${tag}: bước "${c.co}" còn câu kể / nhãn (chỉ để tên)`);
        ok(c.icon > 0, `${tag}: bước "${c.co}" không thấy icon`);
        ok(c.out <= 1, `${tag}: bước "${c.co}" tràn khỏi làn ${c.out}px`);
        ok(!c.role, `${tag}: thẻ "${c.co}" còn dòng phụ .pj-role (trùng ý câu kể)`);
        ok(c.chars <= MAX_CARD_CHARS[lang], `${tag}: thẻ "${c.co}" ${c.chars} ký tự (trần ${MAX_CARD_CHARS[lang]})`);
        ok(!c.broken.length, `${tag}: thẻ "${c.co}" có chữ bị ngắt giữa từ ${c.broken.join(',')}`);
      }
      ok(new Set(r.cards.map((c) => c.icon)).size === 1, `${tag}: icon các bước không cùng cỡ ${[...new Set(r.cards.map((c) => c.icon))]}`);
      ok(!r.otherGrid.length, `${tag}: cảnh lưới khác có nhãn ngắt giữa từ ${r.otherGrid.join(' | ')}`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
    }
  }
  if (REPORT) console.log(JSON.stringify(Object.fromEntries(Object.entries(rep).map(([k, r]) => [k, {
    tiles: r.tiles.map((t) => `${t.t}:${t.lines}L${t.broken.length ? '!' : ''}/${t.icon}px/${t.w}x${t.h}`).join(' '),
    cards: r.cards.map((c) => `${c.chars}c ${c.coLines}/${c.ptLines}L t${c.tags}${c.role ? ' +role' : ''}${c.broken.length ? ' !' + c.broken : ''}`).join(' | '),
    other: r.otherGrid }])), null, 1));
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-work-areas-fit (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-work-areas-fit: ${checks} lượt (3 ngôn ngữ x 10 bề rộng): 8 ô icon nhãn 1 dòng không ngắt từ, icon cùng cỡ; workflow 12 bước chỉ ghi tên <= 3 dòng, icon cùng cỡ, không ngắt từ, không tràn làn; không tràn, 0 lỗi JS`);
    process.exit(0);
  }, 300);
});
