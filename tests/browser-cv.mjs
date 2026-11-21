// Kiểm trang theo CV mới trên Chrome headless thật (CDP, không cần thư viện): lỗi JS, 3 ngôn ngữ, mobile, in A4, nhúng PDF.
// Chạy: node tests/browser-cv.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'cvb-'));
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
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w = 1280, media = '') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(400);
  };

  const EXPECT = {
    ja: ['営業部 アシスタントマネージャー 兼 人事部長', 'ベトナム支店 営業マネージャー', '顧客の課題を聞き取り'],
    en: ['Assistant manager, Sales department, and head of HR', 'Sales manager, Vietnam branch', 'Hearing client issues'],
    vi: ['Trợ lý trưởng phòng Kinh doanh kiêm trưởng phòng Nhân sự', 'Quản lý kinh doanh, chi nhánh Việt Nam', 'Lắng nghe vấn đề của khách'],
  };
  // Chữ Nhật được phép còn hiện ở EN / VI (tên riêng, nhãn ngôn ngữ, eyebrow gốc)
  const JA_OK = /^(日本語|タイ　チャン　ホアン　ニャ|目次)$/;
  const probe = (view, lang) => `(() => {
    const main = document.querySelector('main[data-view="${view}"]');
    const vis = (e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const wrong = [...document.querySelectorAll('[data-l]')].filter((e) => e.dataset.l !== '${lang}' && vis(e)).length;
    const leaf = [...main.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && /[\\u3040-\\u30ff\\u4e00-\\u9faf]/.test(n.nodeValue)))
      .map((e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.trim()).join('').trim()).filter(Boolean);
    const ifr = main.querySelector('#cv iframe');
    return { view: document.body.dataset.view, hidden: main.hidden, lang: document.documentElement.lang, wrong, leaf,
      text: main.innerText, overflowX: document.documentElement.scrollWidth - innerWidth,
      iframe: ifr ? { src: ifr.getAttribute('src'), h: ifr.getBoundingClientRect().height } : null,
      sbPdf: document.querySelector('.sb-pdf')?.getAttribute('href') };
  })()`;

  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 390]) {
      const tag = `profile/${lang}/${w}px`;
      await go(`${pageUrl}?lang=${lang}#cover`, w);
      const r = await evaluate(probe('profile', lang)); checks++;
      ok(r.view === 'profile' && !r.hidden, `${tag}: view không mở (${r.view})`);
      ok(r.lang === lang, `${tag}: html lang = ${r.lang}`);
      ok(r.wrong === 0, `${tag}: ${r.wrong} khối khác ngôn ngữ đang hiện`);
      for (const s of EXPECT[lang]) ok(r.text.includes(s), `${tag}: thiếu chuỗi "${s}"`);
      ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
      ok(r.iframe && r.iframe.src.startsWith('Rirekisho_ThaiTranHoangNha.pdf') && r.iframe.h >= 300, `${tag}: khung PDF CV lỗi ${JSON.stringify(r.iframe)}`);
      ok(r.sbPdf === 'Rirekisho_ThaiTranHoangNha.pdf', `${tag}: link PDF sidebar = ${r.sbPdf}`);
      if (lang !== 'ja') {
        const bad = r.leaf.filter((t) => !JA_OK.test(t) && !/^[A-Za-z0-9 ]+ ／ /.test(t));
        ok(bad.length === 0, `${tag}: còn chữ Nhật chưa dịch: ${bad.slice(0, 6).join(' | ')}`);
      }
      await go(`${pageUrl}?lang=${lang}#sales-top`, w);
      const s = await evaluate(probe('sales', lang)); checks++;
      ok(s.view === 'sales' && !s.hidden && s.overflowX <= 1, `sales/${lang}/${w}px: view lỗi hoặc tràn ngang`);
      ok(/2026/.test(s.text) && !/2024年3月|03\/2024|March 2024/.test(s.text), `sales/${lang}/${w}px: giai đoạn Sales chưa theo CV mới`);
    }
    // In A4: không trang nào bị cắt nội dung (pg cao cố định, overflow hidden)
    for (const [view, hash] of [['profile', 'cover'], ['sales', 'sales-top']]) {
      await go(`${pageUrl}?lang=${lang}#${hash}`, 794, 'print'); checks++;
      // Đo phần tử nội dung thật (bỏ hoạ tiết .deco tràn có chủ ý): đáy phần tử thấp nhất so với đáy trang
      const over = await evaluate(`[...document.querySelectorAll('main[data-view="${view}"] .pg')].map((p) => {
        const pb = p.getBoundingClientRect().bottom;
        const els = [...p.querySelectorAll('*')].filter((e) => !e.closest('.deco') && e.getClientRects().length && getComputedStyle(e).display !== 'none');
        return [p.id, Math.round(Math.max(0, ...els.map((e) => e.getBoundingClientRect().bottom - pb)))];
      }).filter(([, d]) => d > 1)`);
      ok(over.length === 0, `in ${view}/${lang}: trang bị cắt ${JSON.stringify(over)}`);
    }
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-cv (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`PASS browser-cv: ${checks} lượt kiểm, 0 lỗi JS, 3 ngôn ngữ x profile/sales x desktop/mobile, không sót chữ Nhật ở EN/VI, in A4 không cắt trang, khung PDF CV hiện`);
    process.exit(0);
  }, 300);
});
