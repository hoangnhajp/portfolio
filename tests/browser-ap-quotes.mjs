// Kiểm trên Chrome headless thật (CDP) tooltip dẫn chứng của tab Andpad Info: rê chuột lên thông tin có số [n] hiện
// tên nguồn theo ngôn ngữ đang xem + đoạn nguyên văn + link; mọi trang có tooltip; Tab / Esc; Slide view bấm số [n] không lật slide; bản in ẩn.
// Chạy: node tests/browser-ap-quotes.mjs   (thoát 0 = đạt, khoảng 1 phút). CHROME=<đường dẫn>.
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
const dir = mkdtempSync(join(tmpdir(), 'apq-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };

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
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, h) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(900);
  };
  const lang = async (l) => { await evaluate(`document.querySelector('.sb-lang button[data-lang="${l}"]').click()`); await sleep(300); };
  // Rê chuột thật (CDP) lên phần tử chứa số [n] đầu tiên có chữ `txt` trong trang `pid`; trả về nội dung tooltip
  const hover = async (pid, txt, retry = 1) => {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 }); await sleep(300);
    const b = await evaluate(`(async () => { const s = document.getElementById('${pid}'); s.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 500));
      const sup = [...s.querySelectorAll('sup.ap-c')].find((x) => x.getClientRects().length && x.parentElement.textContent.includes(${JSON.stringify(txt)}));
      if (!sup) return null; sup.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 300));
      const r = sup.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
    if (!b) return null;
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: b.x, y: b.y }); await sleep(300);
    // bố cục có thể còn trượt ngay sau cú nhảy cuộn dài (ảnh nền tải lười): đo lại và rê lại 1 lần
    if (retry && await evaluate(`document.getElementById('ap-tip').hidden`)) return hover(pid, txt, 0);
    return evaluate(`(() => { const t = document.getElementById('ap-tip'); if (!t || t.hidden) return { shown: false };
      const r = t.getBoundingClientRect(); const vis = (e) => e.getClientRects().length > 0;
      return { shown: true, text: t.innerText, quotes: [...t.querySelectorAll('blockquote')].map((q) => q.textContent),
        heads: [...t.querySelectorAll('.ap-tip-h span[data-l]')].filter(vis).map((x) => x.textContent),
        links: [...t.querySelectorAll('a')].map((a) => a.href), inView: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1 && r.width > 100 }; })()`);
  };

  // 1) Desktop, 3 ngôn ngữ: rê lên số SPIDERPLUS ở #ap-vs-scale => nguyên văn "導入社数 2300 社以上" của spider-plus.com
  await go(pageUrl + '?mode=pdf#ap-vs-scale', 1440, 900);
  for (const [l, num, title] of [['ja', '2,300社以上', 'SPIDERPLUS 公式サイト'], ['en', '2,300+', 'SPIDERPLUS official site'], ['vi', 'Hơn 2.300', 'Trang chính thức SPIDERPLUS']]) {
    await lang(l);
    const t = await hover('ap-vs-scale', num);
    ok(t && t.shown, `${l}: rê lên số SPIDERPLUS không hiện tooltip`);
    if (!t || !t.shown) continue;
    ok(t.quotes.some((q) => q.includes('導入社数 2300 社以上')), `${l}: tooltip thiếu nguyên văn 導入社数 2300 社以上: ${t.quotes.join(' | ').slice(0, 160)}`);
    ok(t.heads.some((h) => h.includes(title)), `${l}: tên nguồn phải theo ngôn ngữ đang xem (${title}), thấy: ${t.heads.join(' | ')}`);
    ok(t.links.some((u) => u.startsWith('https://spider-plus.com')), `${l}: tooltip thiếu link nguồn`);
    ok(t.inView, `${l}: tooltip ra ngoài màn hình`);
  }
  // 2) KANNA 10万社: nguyên văn của tin lp.kanna4u.com/news/c3rgh_zk-6j/
  await lang('vi');
  const k = await hover('ap-vs-scale', 'Hơn 100.000');
  ok(k && k.shown && k.quotes.some((q) => q.includes('10万社')) && k.links.some((u) => u.includes('c3rgh_zk-6j')), `KANNA: tooltip thiếu nguyên văn 10万社 / link tin: ${k && k.text && k.text.slice(0, 160)}`);
  // 3) Mọi trang của tab: số [n] đầu tiên đều có tooltip có >= 1 đoạn nguyên văn và link
  const pages = await evaluate(`[...document.querySelectorAll('main[data-view="ap"] section.pg')].map((s) => s.id)`);
  ok(pages.length >= 14, `tab Andpad Info chỉ có ${pages.length} trang`);
  for (const pid of pages) {
    const t = await hover(pid, '');
    ok(t && t.shown && t.quotes.length >= 1 && t.links.length >= 1, `#${pid}: tooltip số [n] đầu tiên không hiện / không có nguyên văn`);
  }
  // 4) Bàn phím: focus số [n] => tooltip; Esc => đóng
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 }); await sleep(300);
  await evaluate(`(() => { const s = [...document.querySelectorAll('#ap-top sup.ap-c')].find((x) => x.getClientRects().length); s.scrollIntoView({ block: 'center' }); s.focus(); })()`); await sleep(250);
  ok(await evaluate(`!document.getElementById('ap-tip').hidden`), 'focus vào số [n] không hiện tooltip');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150);
  ok(await evaluate(`document.getElementById('ap-tip').hidden`), 'Esc không đóng tooltip');
  // 5) Slide view: bấm số [n] ghim tooltip, không lật slide
  await go(pageUrl + '?mode=slide#ap-vs-scale', 1280, 800); await sleep(1500);
  const state = `(() => { const v = [...document.querySelectorAll('main[data-view="ap"] section.pg')].filter((s) => s.getClientRects().length && getComputedStyle(s).visibility !== 'hidden').map((s) => s.id); return location.hash + '|' + v.join(','); })()`;
  const before = await evaluate(state);
  const pos = await evaluate(`(() => { const s = [...document.querySelectorAll('#ap-vs-scale sup.ap-c')].find((x) => { const r = x.getBoundingClientRect(); return r.width && r.top > 0 && r.bottom < innerHeight; }); if (!s) return null; const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (pos) {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: pos.x, y: pos.y, button: 'left', clickCount: 1 });
    await sleep(600);
    ok(await evaluate(`!document.getElementById('ap-tip').hidden`), 'Slide view: bấm số [n] không ghim tooltip');
    ok(await evaluate(state) === before, 'Slide view: bấm số [n] làm lật slide');
  } else ok(false, 'Slide view: không thấy số [n] trong khung nhìn của #ap-vs-scale');
  // 6) Điện thoại 375px: chạm số [n] => hộp nằm trọn trong màn hình
  await go(pageUrl + '#ap-vs-scale', 375, 700); await sleep(800);
  const mp = await evaluate(`(async () => { const s = [...document.querySelectorAll('#ap-vs-scale sup.ap-c')].filter((x) => x.getClientRects().length)[2]; if (!s) return null; s.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 400)); const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (mp) {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: mp.x, y: mp.y, button: 'left', clickCount: 1 });
    await sleep(400);
    ok(await evaluate(`(() => { const t = document.getElementById('ap-tip'); if (t.hidden) return false; const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= document.documentElement.clientWidth + 1; })()`), 'điện thoại: chạm số [n] không hiện hộp, hoặc hộp tràn ngang');
  } else ok(false, 'điện thoại: không thấy số [n]');
  // 7) Bản in: tooltip ẩn
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  ok(await evaluate(`getComputedStyle(document.getElementById('ap-tip')).display === 'none'`), 'bản in vẫn hiện tooltip');
  ok(errors.length === 0, 'lỗi console: ' + errors.slice(0, 3).join(' | '));
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-ap-quotes (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`OK browser-ap-quotes: ${checks} kiểm tra (tooltip nguyên văn 3 ngôn ngữ, mọi trang tab Andpad Info, bàn phím, Slide view, bản in)`);
    process.exit(0);
  }, 300);
});
