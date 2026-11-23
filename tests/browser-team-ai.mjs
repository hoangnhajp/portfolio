// Tab Team Management + AI Skills (task cg5a) trên Chrome headless thật (CDP): lỗi JS, 3 ngôn ngữ, mobile, in A4, mục lục, link chéo.
// Chạy: node tests/browser-team-ai.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt; SHOT=vi SHOT_DIR=<thư mục> để chụp ảnh.
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

  const probe = (view, lang) => `(() => {
    const main = document.querySelector('main[data-view="${view}"]');
    const vis = (e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const wrong = [...document.querySelectorAll('[data-l]')].filter((e) => e.dataset.l !== '${lang}' && vis(e)).length;
    const leaf = [...main.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && /[\\u3040-\\u30ff\\u4e00-\\u9faf]/.test(n.nodeValue)))
      .map((e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.nodeValue.trim()).join('').trim()).filter(Boolean);
    const nav = document.querySelector('.sb-nav[data-for="${view}"]');
    return { view: document.body.dataset.view, hidden: main.hidden, lang: document.documentElement.lang, wrong, leaf,
      text: main.innerText, overflowX: document.documentElement.scrollWidth - innerWidth,
      navShown: !!nav && !nav.hidden, otherNavs: [...document.querySelectorAll('.sb-nav')].filter((n) => n !== nav && !n.hidden).length,
      topOn: document.querySelector('.top-nav a.on')?.dataset.view, pages: main.querySelectorAll('.pg').length };
  })()`;
  const EXPECT = { team: { ja: '部下5～6名', en: 'team of five', vi: 'đội 5 người' }, ai: { ja: '80～90%', en: '80 to 90%', vi: '80 đến 90%' } };
  for (const [view, hash] of [['team', 'team-top'], ['ai', 'ai-top']]) {
    for (const lang of ['ja', 'en', 'vi']) {
      for (const w of [1280, 390]) {
        const tag = `${view}/${lang}/${w}px`;
        await go(`${pageUrl}?lang=${lang}#${hash}`, w);
        const r = await evaluate(probe(view, lang)); checks++;
        ok(r.view === view && !r.hidden && r.topOn === view, `${tag}: view không mở (${r.view}, top ${r.topOn})`);
        ok(r.navShown && r.otherNavs === 0, `${tag}: mục lục sidebar sai (navShown ${r.navShown}, khác đang hiện ${r.otherNavs})`);
        ok(r.pages === 4, `${tag}: số trang ${r.pages}`);
        ok(r.lang === lang && r.wrong === 0, `${tag}: lang ${r.lang}, ${r.wrong} khối khác ngôn ngữ đang hiện`);
        ok(r.text.includes(EXPECT[view][lang]), `${tag}: thiếu "${EXPECT[view][lang]}"`);
        ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
        if (lang !== 'ja') ok(r.leaf.length === 0, `${tag}: còn chữ Nhật: ${r.leaf.slice(0, 6).join(' | ')}`);
      }
      // In A4: không trang nào bị cắt nội dung
      await go(`${pageUrl}?lang=${lang}#${hash}`, 794, 'print'); checks++;
      const over = await evaluate(`[...document.querySelectorAll('main[data-view="${view}"] .pg')].map((p) => {
        const pb = p.getBoundingClientRect().bottom;
        const els = [...p.querySelectorAll('*')].filter((e) => !e.closest('.deco') && e.getClientRects().length && getComputedStyle(e).display !== 'none');
        return [p.id, Math.round(Math.max(0, ...els.map((e) => e.getBoundingClientRect().bottom - pb)))];
      }).filter(([, d]) => d > 1)`);
      ok(over.length === 0, `in ${view}/${lang}: trang bị cắt ${JSON.stringify(over)}`);
    }
  }
  // Link chéo từ tab Team sang trang AI業務管理 của Profile: router đổi view
  await go(`${pageUrl}?lang=vi#team-daily`, 1280);
  await evaluate("[...document.querySelectorAll('#team-daily a[href=\"#aiops\"]')].find((a) => a.getClientRects().length).click()");
  await sleep(300); checks++;
  const cross = await evaluate("({ view: document.body.dataset.view, hash: location.hash })");
  ok(cross.view === 'profile' && cross.hash === '#aiops', `link #aiops từ tab Team không mở Profile: ${JSON.stringify(cross)}`);
  if (process.env.SHOT) for (const [view, hash] of [['team', 'team-records'], ['ai', 'ai-approach']]) {
    await go(`${pageUrl}?lang=${process.env.SHOT}#${hash}`, 1280);
    const s = await send('Page.captureScreenshot', { format: 'png' });
    (await import('node:fs')).writeFileSync(join(process.env.SHOT_DIR || tmpdir(), `${view}-${process.env.SHOT}.png`), Buffer.from(s.result.data, 'base64'));
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-team-ai (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
    console.log(`PASS browser-team-ai: ${checks} lượt kiểm, 0 lỗi JS, tab Team + AI x 3 ngôn ngữ x desktop/mobile, mục lục riêng, không sót chữ Nhật ở EN/VI, in A4 không cắt trang, link chéo sang Profile`);
    process.exit(0);
  }, 300);
});
