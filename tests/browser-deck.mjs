// Task nod3: 2 lưới 6 thẻ (#team-skills, #ai-uses) chạy như slide thuyết trình, đo trên Chrome headless thật (CDP),
// 3 ngôn ngữ x desktop / điện thoại: 1) mỗi lúc đúng 1 slide hiện, đủ 6 chấm; 2) desktop: hình trái, chữ phải; điện thoại: hình trên;
// slide vừa 1 màn hình, chữ không tràn khung, trang không tràn ngang; 3) nút sau / trước / chấm / phím mũi tên / Home / End, quay vòng;
// 4) hiệu ứng vào slide (deckVis / deckUp) chạy khi chuyển; 5) tự chuyển slide, dừng khi ra khỏi màn hình, nút tự chạy tắt được;
// 6) reduced-motion: không animation, không tự chạy, nút vẫn chuyển được; 7) bản in: 6 thẻ hiện đủ, ẩn thanh điều khiển.
// Chạy: node tests/browser-deck.mjs [thư mục lưu ảnh]   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
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
const dir = mkdtempSync(join(tmpdir(), 'dek-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const PROBE = (sec) => `(() => {
  const d = document.querySelector('#${sec} [data-deck]');
  if (!d || !d.classList.contains('deck-on')) return { missing: true };
  const vis = (e) => e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
  const cards = [...d.children].filter((c) => c.classList.contains('card'));
  const shown = cards.map((c, i) => ({ i, st: getComputedStyle(c) })).filter((x) => x.st.visibility === 'visible' && +x.st.opacity > 0.9).map((x) => x.i);
  const cur = cards.findIndex((c) => c.classList.contains('is-cur'));
  const c = cards[cur], cr = c.getBoundingClientRect(), dr = d.getBoundingClientRect();
  const v = c.firstElementChild.getBoundingClientRect(), t = c.querySelector('.deck-txt').getBoundingClientRect();
  const h3 = [...c.querySelectorAll('h3')].filter(vis), p = [...c.querySelectorAll('p')].filter(vis);
  const anims = c.getAnimations({ subtree: true }).filter((a) => /^deck/.test(a.animationName || '')).map((a) => a.animationName);
  return { n: cards.length, shown, cur, count: d.querySelector('.deck-count b').textContent,
    dots: d.querySelectorAll('.deck-dots button').length, curDot: [...d.querySelectorAll('.deck-dots button')].findIndex((b) => b.getAttribute('aria-current') === 'true'),
    inert: cards.filter((x, i) => i !== cur && x.hasAttribute('inert') && x.getAttribute('aria-hidden') === 'true').length,
    vis: { l: v.left, r: v.right, t: v.top, b: v.bottom, w: v.width }, txt: { l: t.left, r: t.right, t: t.top, b: t.bottom },
    card: { l: cr.left, r: cr.right, t: cr.top, b: cr.bottom, h: cr.height }, deckH: dr.height, vh: innerHeight,
    h3: h3.length === 1 ? h3[0].textContent.trim() : null, p: p.length === 1 ? p[0].textContent.trim().length : 0, anims,
    pp: d.querySelector('.deck-pp') ? d.querySelector('.deck-pp').getAttribute('aria-pressed') : null,
    play: d.classList.contains('is-play'), barRows: new Set([...d.querySelectorAll('.deck-bar > button, .deck-dots button')].map((b) => Math.round(b.getBoundingClientRect().top))).size, hold: d.classList.contains('is-hold'), overflowX: document.documentElement.scrollWidth - innerWidth };
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
  const center = (sec) => evaluate(`(document.querySelector('#${sec} [data-deck]').scrollIntoView({ block: 'center', behavior: 'instant' }), 1)`);
  const shot = async (sec, name) => {
    if (!shotDir) return;
    await center(sec); await sleep(900);
    const box = await evaluate(`(() => { const r = document.querySelector('#${sec} [data-deck]').getBoundingClientRect(); return { x: r.left + scrollX - 8, y: r.top + scrollY - 8, width: r.width + 16, height: r.height + 16, scale: 1 }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'png', clip: box, captureBeyondViewport: true });
    writeFileSync(join(shotDir, name + '.png'), Buffer.from(r.result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, motion = 'no-preference') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 600 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(900);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const click = (sec, sel) => evaluate(`(document.querySelector('#${sec} [data-deck] ${sel}').click(), 1)`);
  const key = (sec, k) => evaluate(`(document.querySelector('#${sec} [data-deck]').dispatchEvent(new KeyboardEvent('keydown', { key: '${k}', bubbles: true })), 1)`);

  for (const sec of ['team-skills', 'ai-uses']) {
    for (const lang of ['ja', 'en', 'vi']) {
      for (const w of [1280, 390]) {
        const tag = `${sec}/${lang}/${w}px`;
        await go(`${pageUrl}?lang=${lang}#${sec}`, w);
        // Tắt tự chạy tạm thời để đo tĩnh (bấm lại ở bước 5)
        await click(sec, '.deck-pp'); await center(sec); await sleep(1000);
        let r = await evaluate(PROBE(sec)); checks++;
        if (r.missing) { ok(false, `${tag}: không thấy lưới deck-on`); continue; }
        ok(r.n === 6 && r.dots === 6, `${tag}: cần 6 slide + 6 chấm (${r.n}/${r.dots})`);
        ok(r.shown.length === 1 && r.shown[0] === r.cur && r.cur === 0, `${tag}: phải hiện đúng slide 1, thấy ${JSON.stringify(r.shown)}`);
        ok(r.count === '01' && r.curDot === 0 && r.inert === 5, `${tag}: bộ đếm / chấm / inert sai ${r.count} ${r.curDot} ${r.inert}`);
        ok(!!r.h3 && r.p > 20, `${tag}: slide thiếu tiêu đề / đoạn văn đúng ngôn ngữ`);
        if (w >= 900) ok(r.vis.r <= r.txt.l && r.vis.w >= 0.45 * (r.card.r - r.card.l), `${tag}: desktop cần hình trái (>= 45% thẻ), chữ phải ${JSON.stringify([r.vis, r.txt])}`);
        else ok(r.vis.b <= r.txt.t + 1, `${tag}: điện thoại cần hình trên chữ`);
        ok(r.txt.b <= r.card.b + 1 && r.txt.r <= r.card.r + 1, `${tag}: chữ tràn khỏi khung slide`);
        ok(r.deckH <= r.vh - 20, `${tag}: slide cao hơn màn hình (${Math.round(r.deckH)} > ${r.vh})`);
        ok(r.overflowX <= 1, `${tag}: tràn ngang ${r.overflowX}px`);
        ok(r.barRows === 1, `${tag}: thanh điều khiển bị rớt dòng (${r.barRows} hàng)`);
        if (lang !== 'en') await shot(sec, `${sec}-${lang}-${w}-s1`);
        // 3) điều hướng
        await click(sec, '.deck-next'); await sleep(120);
        r = await evaluate(PROBE(sec)); checks++;
        ok(r.cur === 1 && r.count === '02' && r.curDot === 1, `${tag}: nút sau không sang slide 2 (${r.cur})`);
        ok(r.anims.includes('deckVis') && r.anims.includes('deckUp'), `${tag}: thiếu hiệu ứng vào slide ${JSON.stringify(r.anims)}`);
        await sleep(800);
        r = await evaluate(PROBE(sec));
        ok(r.shown.length === 1 && r.shown[0] === 1, `${tag}: sau chuyển vẫn còn >1 slide hiện ${JSON.stringify(r.shown)}`);
        if (lang !== 'en' && w >= 900) await shot(sec, `${sec}-${lang}-${w}-s2`);
        const live = await evaluate(`document.querySelector('#${sec} .deck-live').textContent`);
        ok(live.startsWith('2 / 6 ') && live.length > 8, `${tag}: vùng aria-live chưa báo slide mới (${live})`);
        await evaluate(`(document.querySelector('#${sec} [data-deck]').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true })), 1)`);
        r = await evaluate(PROBE(sec));
        ok(r.cur === 1, `${tag}: Alt+→ không được chuyển slide (để trình duyệt xử lý)`);
        await key(sec, 'ArrowRight'); r = await evaluate(PROBE(sec)); checks++;
        ok(r.cur === 2, `${tag}: phím → không sang slide 3`);
        await key(sec, 'ArrowLeft'); r = await evaluate(PROBE(sec));
        ok(r.cur === 1, `${tag}: phím ← không lùi`);
        await key(sec, 'End'); r = await evaluate(PROBE(sec));
        ok(r.cur === 5 && r.count === '06', `${tag}: End không tới slide 6`);
        await click(sec, '.deck-next'); r = await evaluate(PROBE(sec));
        ok(r.cur === 0, `${tag}: slide 6 bấm sau không quay về 1`);
        await click(sec, '.deck-prev'); r = await evaluate(PROBE(sec));
        ok(r.cur === 5, `${tag}: slide 1 bấm trước không về 6`);
        await click(sec, '.deck-dots button[data-i="3"]'); r = await evaluate(PROBE(sec));
        ok(r.cur === 3, `${tag}: bấm chấm 04 không tới slide 4`);
        // 5) tự chạy: rút ngắn thời gian slide để đo nhanh
        await evaluate(`document.querySelector('#${sec} [data-deck]').style.setProperty('--deck-t', '700ms')`);
        await click(sec, '.deck-pp'); await center(sec); await sleep(100);
        r = await evaluate(PROBE(sec)); const s0 = r.cur; checks++;
        ok(r.pp === 'true' && r.play && !r.hold, `${tag}: bật tự chạy sai ${JSON.stringify([r.pp, r.play, r.hold])}`);
        await sleep(1700);
        r = await evaluate(PROBE(sec));
        ok(r.cur !== s0, `${tag}: không tự chuyển slide (vẫn ${r.cur})`);
        await evaluate(`scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })`); await sleep(300);
        r = await evaluate(PROBE(sec)); const s1 = r.cur; await sleep(1700);
        const r2 = await evaluate(PROBE(sec)); checks++;
        ok(r.hold && r2.cur === s1, `${tag}: không dừng khi ra khỏi màn hình (${s1} -> ${r2.cur})`);
        await center(sec); await click(sec, '.deck-pp'); await sleep(100);
        r = await evaluate(PROBE(sec)); const s2 = r.cur; await sleep(1700);
        const r3 = await evaluate(PROBE(sec)); checks++;
        ok(r.pp === 'false' && !r.play && r3.cur === s2, `${tag}: tắt tự chạy mà vẫn chuyển (${s2} -> ${r3.cur})`);
      }
    }
    // 6) reduced-motion
    await go(`${pageUrl}?lang=vi#${sec}`, 1280, 'reduce'); await center(sec); await sleep(300);
    let r = await evaluate(PROBE(sec)); checks++;
    ok(r.pp === null && !r.play, `${sec}/reduce: không được tự chạy / không có nút tự chạy`);
    await click(sec, '.deck-next'); r = await evaluate(PROBE(sec));
    ok(r.cur === 1 && r.anims.length === 0 && r.shown.length === 1 && r.shown[0] === 1, `${sec}/reduce: chuyển slide phải tức thì, không animation ${JSON.stringify([r.cur, r.anims, r.shown])}`);
    // 7) bản in: lưới 6 thẻ đầy đủ, ẩn thanh điều khiển
    await send('Emulation.setEmulatedMedia', { media: 'print', features: [] }); await sleep(200);
    const pr = await evaluate(`(() => { const d = document.querySelector('#${sec} [data-deck]');
      const cs = [...d.children].filter((c) => c.classList.contains('card'));
      return { vis: cs.filter((c) => getComputedStyle(c).visibility === 'visible' && c.getClientRects().length).length,
        cols: getComputedStyle(d).gridTemplateColumns.split(' ').length, bar: getComputedStyle(d.querySelector('.deck-bar')).display }; })()`); checks++;
    ok(pr.vis === 6 && pr.cols === 3 && pr.bar === 'none', `${sec}/print: bản in phải là lưới 3 cột đủ 6 thẻ ${JSON.stringify(pr)}`);
    await send('Emulation.setEmulatedMedia', { media: '', features: [] });
  }
  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill(); setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch {} }, 500);
  if (fails.length) { console.error(`FAIL browser-deck (${fails.length}/${checks}):\n- ` + fails.join('\n- ')); process.exit(1); }
  console.log(`OK browser-deck: ${checks} phép đo, 2 lưới x 3 ngôn ngữ x desktop / điện thoại + reduced-motion + bản in`);
  process.exit(0);
});
