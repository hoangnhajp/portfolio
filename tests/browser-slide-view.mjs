// Task 93oy: kiểm trên Chrome headless thật (CDP) 2 chế độ xem portfolio.
// PDF view (mặc định) = như hiện tại; Slide view = cố định 1 tờ giữa màn, mỗi cú bấm / phím -> hiện khối kế, hết khối sang section kế.
// Chạy: node tests/browser-slide-view.mjs   (thoát 0 = đạt, khoảng 1 phút). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'sv-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

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
  let W = 1440, H = 900;
  const go = async (url, w = 1440, h = 900, media = '', features = []) => {
    W = w; H = h;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media, features });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(600);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const click = async (x, y) => {
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  };
  const key = async (k, code) => {
    for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: code });
  };
  const clickSel = async (sel) => {
    const r = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`);
    if (!r) { fails.push(`không thấy ${sel}`); return; }
    await click(r[0], r[1]);
  };
  // Bấm vào lề trái của tờ đang hiện (vùng không có link / nút) như người xem bấm để sang bước kế
  const clickSlide = async () => {
    const r = await evaluate(`(() => { const p = document.querySelector('main:not([hidden]) > .pg.sv-cur'); if (!p) return null; const b = p.getBoundingClientRect();
      const x = b.left + 8, y = b.top + Math.min(b.height, innerHeight - b.top) * 0.5; const e = document.elementFromPoint(x, y);
      return [x, y, !!(e && e.closest('a,button,input,select,textarea,video,label,summary,[data-deck]'))]; })()`);
    if (!r) { fails.push('Slide view: không có tờ .sv-cur'); return; }
    ok(!r[2], 'điểm bấm thử rơi vào phần tử tương tác');
    await click(r[0], r[1]);
  };
  const ST = `(() => { const s = window.slideView && window.slideView.state(); const m = document.querySelector('main:not([hidden])');
    const shown = [...m.children].filter((p) => p.classList.contains('pg') && getComputedStyle(p).display !== 'none');
    const cur = m.querySelector(':scope > .pg.sv-cur'); const b = cur && cur.getBoundingClientRect();
    const op = []; if (cur) [...cur.querySelectorAll(':scope > .sv-step')].forEach((e) => { const g = +e.dataset.svg, o = +getComputedStyle(e).opacity;
      op[g] = op[g] === undefined ? o : Math.min(op[g], o); });
    return { s, sv: document.documentElement.classList.contains('sv'), view: m.dataset.view, shown: shown.map((p) => p.id),
      rect: b && { l: b.left, r: b.right, t: b.top, b: b.bottom }, vw: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      op, onTab: document.querySelector('.top-nav a.on')?.dataset.view,
      lang: document.documentElement.lang, bar: document.querySelector('#sv-bar .sv-n')?.textContent || '',
      btn: [...document.querySelectorAll('#sv-mode button')].map((x) => x.textContent.trim() + ':' + x.getAttribute('aria-pressed')) }; })()`;
  const st = () => evaluate(ST);

  // 1) Mặc định PDF view: như hiện tại, nhiều tờ xếp dọc
  await go(`${pageUrl}?lang=ja#cover`);
  await evaluate('localStorage.clear(),1');
  await go(`${pageUrl}?lang=ja#cover`);
  let r = await st(); checks++;
  ok(!r.sv && r.s && r.s.mode === 'pdf', `mặc định phải là PDF view (sv=${r.sv}, mode=${r.s && r.s.mode})`);
  ok(r.shown.length >= 4, `PDF view phải hiện nhiều tờ (đang ${r.shown.length})`);
  ok(r.btn.join('|') === 'PDF view:true|Slide view:false', `nút chế độ sai: ${r.btn.join('|')}`);

  // 2) Bấm Slide view: chỉ còn 1 tờ cố định, vừa khung nhìn
  await clickSel('#sv-mode button[data-mode="slide"]'); await sleep(900);
  r = await st(); checks++;
  ok(r.sv && r.s && r.s.mode === 'slide', 'bấm "Slide view" phải bật Slide view');
  ok(r.btn.join('|') === 'PDF view:false|Slide view:true', `nút chế độ sai sau khi bật: ${r.btn.join('|')}`);
  ok(r.shown.length === 1 && r.shown[0] === 'cover', `Slide view phải chỉ hiện đúng 1 tờ #cover (đang ${r.shown.join(',')})`);
  ok(r.rect && r.rect.l >= 0 && r.rect.r <= W && r.rect.t >= 0 && r.rect.b <= H, `tờ phải nằm trọn trong khung nhìn ${W}x${H}: ${JSON.stringify(r.rect)}`);
  ok(r.s && r.s.total >= 9 && /^01 \/ \d\d$/.test(r.bar), `thanh điều khiển phải ghi "01 / tổng" (đang "${r.bar}", total ${r.s && r.s.total})`);
  const y0 = await evaluate('scrollY'); await evaluate('window.scrollBy(0,600),1'); await sleep(200);
  ok(await evaluate('scrollY') === y0, 'Slide view phải cố định (cuộn trang không được dịch chuyển)');

  // 3) Mỗi cú bấm hiện khối tiếp theo; hết khối thì sang section kế
  await evaluate('window.slideView.go("profile"),1'); await sleep(900);
  r = await st(); checks++;
  ok(r.s.id === 'profile' && r.s.step === 1 && r.s.steps >= 3, `vào #profile phải chỉ hiện khối tiêu đề (step ${r.s.step}/${r.s.steps})`);
  ok(r.op[0] > 0.95 && r.op.slice(1).every((o) => o < 0.05), `chỉ khối đầu hiện, các khối sau ẩn: ${r.op.join(',')}`);
  const steps = r.s.steps;
  for (let k = 2; k <= steps; k++) {
    await clickSlide(); await sleep(1000);
    r = await st(); checks++;
    ok(r.s.id === 'profile' && r.s.step === k, `bấm lần ${k - 1}: phải hiện khối ${k}/${steps} (đang ${r.s.id} ${r.s.step})`);
    ok(r.op.slice(0, k).every((o) => o > 0.95) && r.op.slice(k).every((o) => o < 0.05), `bấm lần ${k - 1}: độ hiện các khối sai ${r.op.join(',')}`);
  }
  await clickSlide(); await sleep(1000);
  r = await st(); checks++;
  ok(r.s.id === 'projects' && r.s.step === 1, `hết khối phải sang section kế #projects (đang ${r.s.id} ${r.s.step})`);
  ok(r.shown.length === 1, 'sang section kế vẫn chỉ hiện 1 tờ');
  ok(/^\d\d \/ \d\d$/.test(r.bar) && r.bar.startsWith(String(r.s.index + 1).padStart(2, '0')), `số trang thanh điều khiển sai: ${r.bar}`);
  // phím → cũng đi tiếp, ← lùi về tờ trước (hiện đủ)
  await key('ArrowRight', 39); await sleep(900);
  r = await st(); checks++;
  ok(r.s.id === 'projects' && r.s.step === 2, `phím → phải hiện khối kế (đang ${r.s.id} ${r.s.step})`);
  await key('ArrowLeft', 37); await sleep(900);
  r = await st(); checks++;
  ok(r.s.id === 'profile' && r.s.step === r.s.steps, `phím ← phải lùi về #profile hiện đủ (đang ${r.s.id} ${r.s.step}/${r.s.steps})`);
  ok(r.op.every((o) => o > 0.95), `lùi về tờ trước phải hiện đủ khối: ${r.op.join(',')}`);

  // 4) Bấm nút ngôn ngữ không bị tính là "sang bước kế"
  const before = (await st()).s;
  await clickSel('#lp-i18n button[data-lang="en"]'); await sleep(600);
  r = await st(); checks++;
  ok(r.lang === 'en' && r.s.id === before.id && r.s.step === before.step, `bấm nút ngôn ngữ không được chuyển bước (lang ${r.lang}, ${r.s.id} ${r.s.step})`);

  // 5) Hết tab My Profile thì sang tab kế (Task: Sales)
  await evaluate('window.slideView.go("w-early"),1'); await sleep(700);
  for (let i = 0; i < 12 && (await st()).s.id === 'w-early'; i++) { await clickSlide(); await sleep(700); }
  r = await st(); checks++;
  ok(r.s.id === 'sales-top' && r.view === 'sales' && r.onTab === 'sales', `hết tab Profile phải sang tab Sales (đang ${r.s.id}, view ${r.view}, tab ${r.onTab})`);
  // bấm tab menu: vào tờ đầu của tab đó
  await clickSel('.top-nav a[data-view="ai"]'); await sleep(900);
  r = await st(); checks++;
  ok(r.view === 'ai' && r.s.id === 'ai-top' && r.shown.length === 1, `bấm tab AI phải vào tờ #ai-top (đang ${r.view} ${r.s.id}, ${r.shown.length} tờ)`);

  // 6) Tải lại vẫn nhớ Slide view
  await go(`${pageUrl}?lang=vi#team-top`);
  r = await st(); checks++;
  ok(r.sv && r.s.mode === 'slide' && r.s.id === 'team-top' && r.shown.length === 1, `tải lại phải giữ Slide view tại #team-top (sv ${r.sv}, ${r.s && r.s.id})`);
  ok(r.overflowX <= 1, `Slide view tràn ngang ${r.overflowX}px`);

  // 7) In khi đang Slide view: vẫn in đủ các tờ như PDF view
  await send('Emulation.setEmulatedMedia', { media: 'print' }); await sleep(300);
  const nPrint = await evaluate(`[...document.querySelectorAll('main:not([hidden]) > .pg')].filter((p) => getComputedStyle(p).display !== 'none').length`); checks++;
  ok(nPrint >= 4, `in trong Slide view phải ra đủ tờ (đang ${nPrint})`);
  await send('Emulation.setEmulatedMedia', { media: '' }); await sleep(200);

  // 8) Về PDF view: trả nguyên trạng
  await clickSel('#sv-mode button[data-mode="pdf"]'); await sleep(700);
  r = await st(); checks++;
  ok(!r.sv && r.s.mode === 'pdf' && r.shown.length >= 3, `bấm "PDF view" phải về cách xem cũ (sv ${r.sv}, ${r.shown.length} tờ)`);
  const leftover = await evaluate(`document.querySelectorAll('.sv-step,.sv-cur,.sv-in').length`);
  ok(leftover === 0, `PDF view còn sót ${leftover} lớp sv-*`);
  await evaluate('window.scrollTo({ top: 1500, behavior: "instant" }),1'); await sleep(200);
  ok(await evaluate('scrollY') > 1000, 'PDF view phải cuộn được như cũ');

  // 9) Mobile 390x844 Slide view: không tràn
  await evaluate('localStorage.setItem("pfViewMode","slide"),1');
  await go(`${pageUrl}?lang=vi#profile`, 390, 844);
  r = await st(); checks++;
  ok(r.sv && r.shown.length === 1, `mobile: Slide view phải hiện 1 tờ (${r.shown.length})`);
  ok(r.overflowX <= 1 && r.rect && r.rect.l >= 0 && r.rect.r <= 390, `mobile: tờ tràn mép ${JSON.stringify(r.rect)} overflowX ${r.overflowX}`);
  await clickSlide(); await sleep(900);
  ok((await st()).s.step === 2, 'mobile: chạm vào tờ phải hiện khối kế');

  // 10) reduced-motion: hiện đủ khối ngay, bấm là sang tờ kế
  await go(`${pageUrl}?lang=ja#profile`, 1440, 900, '', [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  r = await st(); checks++;
  ok(r.s && r.s.step === r.s.steps && r.op.every((o) => o > 0.95), `reduced-motion: phải hiện đủ khối ngay (${r.s && r.s.step}/${r.s && r.s.steps}, ${r.op.join(',')})`);
  await clickSlide(); await sleep(400);
  ok((await st()).s.id === 'projects', 'reduced-motion: bấm phải sang tờ kế');

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-slide-view (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-slide-view: ${checks} lượt kiểm, 0 lỗi JS: mặc định PDF view; Slide view cố định 1 tờ vừa khung, mỗi cú bấm hiện khối kế rồi sang section kế, phím ← / →, hết tab sang tab kế, bấm tab menu vào tờ đầu, nhớ chế độ khi tải lại, in vẫn đủ tờ, về PDF view sạch, mobile không tràn, reduced-motion hiện đủ`);
    process.exit(0);
  }, 300);
});
