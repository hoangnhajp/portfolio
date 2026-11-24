// motion-all (task bye2) trên Chrome headless thật (CDP): phần còn tĩnh bên trong khối chuyển động như video.
// 1) (bỏ theo task ye4s: trang #aidash có biểu đồ đã xoá). 2) Ảnh công tác Sales: mỗi ảnh nằm trong khung .mo-kb cùng cỡ ảnh, khung cắt tràn, Ken Burns lặp đang chạy,
//    ảnh hiện rõ sau khi vào. 3) Dòng sự kiện: mục hiện đủ, chấm mốc sáng lặp. 4) Icon trong cảnh gx (thẻ nhãn / ô lưới) trôi lặp.
// 5) Số liệu .mo-cnt đếm lên và dừng đúng số gốc. 6) 3 ngôn ngữ x 1280 / 390: không tràn ngang. 7) reduced-motion: không gắn gì, 0 animation mo*,
//    số giữ nguyên. 8) Chế độ in: mọi phần hiện, không animation. 9) 0 lỗi JS.
// Chạy: node tests/browser-motion-all.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const pageUrl = pathToFileURL(process.env.PAGE || fileURLToPath(new URL('../index.html', import.meta.url))).href;
const dir = mkdtempSync(join(tmpdir(), 'moa-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Đo 1 vùng (selector gốc): animation mo*/gxFloat đang chạy, vòng lặp, độ hiện
const ANIMS = (sel) => `(() => { const els = [...document.querySelectorAll(${JSON.stringify(sel)})].filter((e) => e.getClientRects().length);
  const a = els.flatMap((e) => e.getAnimations({ subtree: true })).filter((x) => /^(mo|gxFloat)/.test(x.animationName || ''));
  return { n: els.length, on: els.filter((e) => e.classList.contains('mo-on')).length, off: els.filter((e) => e.classList.contains('mo-off')).length,
    total: a.length, running: a.filter((x) => x.playState === 'running').length,
    loops: a.filter((x) => x.effect.getTiming().iterations === Infinity && x.playState === 'running').length }; })()`;
const FINISH = (sel) => `([...document.querySelectorAll(${JSON.stringify(sel)})].forEach((e) => e.getAnimations({ subtree: true }).forEach((a) => { if (a.effect.getTiming().iterations !== Infinity) a.finish(); })), 1)`;
const op = `(e) => { let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o; }`;

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
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w, motion = 'no-preference', media = '') => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Emulation.setEmulatedMedia', { media, features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(150);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(900);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  const center = (sel) => evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return 0; e.scrollIntoView({ block: 'center', behavior: 'instant' }); return 1; })()`);
  const decode = (sel) => evaluate(`Promise.all([...document.querySelectorAll(${JSON.stringify(sel)})].map((i) => i.decode().catch(() => 0))).then(() => 1)`);

  for (const lang of ['ja', 'en', 'vi']) {
    for (const w of [1280, 390]) {
      const T = `${lang}/${w}px`;
      // ── 1) (task ye4s) trang #aidash có 3 biểu đồ đã bỏ khỏi tab Profile, không còn biểu đồ để đo
      await go(`${pageUrl}?lang=${lang}#cover`, w);
      // ── 4) Icon cảnh gx (thẻ nhãn) trôi lặp: thử ở cảnh vòng #skillmap
      await center('#skillmap .gx'); await sleep(400);
      const gi = await evaluate(ANIMS('#skillmap .gx .gx-tag .gx-pl img')); checks++;
      ok(gi.n >= 2 && gi.loops >= gi.n, `${T}: icon thẻ nhãn cảnh gx chưa trôi lặp (${gi.loops}/${gi.n})`);
      // ── 5) Số liệu đếm lên rồi dừng đúng số gốc
      const nums = await evaluate(`[...document.querySelectorAll('main[data-view="profile"] .mo-cnt')].filter((n) => n.getClientRects().length).length`);
      ok(nums >= 2, `${T}: tab hồ sơ cần >= 2 số đếm lên (đang ${nums})`);
      ok(await evaluate(`document.querySelectorAll('.sk7 .mo-cnt').length`) === 0, `${T}: số thứ tự lưới .sk7 bị đếm lên`);
      const seen = await evaluate(`new Promise((res) => { const ns = [...document.querySelectorAll('main[data-view="profile"] .mo-cnt')].filter((n) => n.getClientRects().length && !n.classList.contains('mo-on'));
        const n = ns[0]; if (!n) return res({ none: true }); const goal = n.getAttribute('data-mo-n'); const vals = new Set();
        const mo = new MutationObserver(() => vals.add(n.textContent)); mo.observe(n, { childList: true, characterData: true, subtree: true });
        n.scrollIntoView({ block: 'center', behavior: 'instant' }); setTimeout(() => { mo.disconnect(); res({ goal, last: n.textContent.trim(), steps: vals.size }); }, 1800); })`); checks++;
      if (!seen.none) ok(seen.steps >= 3 && seen.last === seen.goal, `${T}: số không đếm lên / không dừng đúng số gốc ${JSON.stringify(seen)}`);
      // Mọi số đã vào màn hình đều đúng số gốc
      await evaluate(`(async () => { for (const n of document.querySelectorAll('main[data-view="profile"] .mo-cnt')) { if (n.getClientRects().length) { n.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } } })()`);
      await sleep(1600);
      const bad = await evaluate(`[...document.querySelectorAll('main[data-view="profile"] .mo-cnt')].filter((n) => n.getClientRects().length && n.textContent.trim() !== n.getAttribute('data-mo-n')).map((n) => n.textContent + '≠' + n.getAttribute('data-mo-n'))`); checks++;
      ok(!bad.length, `${T}: số chưa về đúng số gốc ${bad.slice(0, 4).join(' | ')}`);
      ok(await evaluate(`document.documentElement.scrollWidth - innerWidth`) <= 1, `${T}: tab hồ sơ tràn ngang`);

      // ── 2) Ảnh công tác + 3) dòng sự kiện ở tab Sales
      await go(`${pageUrl}?lang=${lang}#sales-top`, w);
      const ph = await evaluate(`(() => { const im = [...document.querySelectorAll('#sales-trips .mo-kb>img, #sales-trips figure>img, #sales-pr .evrow img')];
        return { n: im.length, wrapped: im.filter((i) => i.parentElement.classList.contains('mo-kb')).length }; })()`); checks++;
      ok(ph.n === 12 && ph.wrapped === 12, `${T}: ảnh công tác phải đủ 12 và nằm trong khung .mo-kb (${ph.wrapped}/${ph.n})`);
      for (const sel of ['#sales-trips', '#sales-pr .evrow']) {
        await evaluate(`(async () => { for (const w of document.querySelectorAll('${sel} .mo-kb')) { w.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)); } })()`); await sleep(400); await decode(`${sel} img`);
        const a = await evaluate(ANIMS(`${sel} .mo-kb`)); checks++;
        ok(a.n && a.on === a.n, `${T}: ${sel}: khung ảnh cuộn tới mà chưa mo-on (${a.on}/${a.n})`);
        ok(a.loops >= 1 && a.loops >= a.n - a.off, `${T}: ${sel}: Ken Burns chưa lặp ở khung đang thấy (${a.loops}/${a.n - a.off})`);
        await evaluate(FINISH('body'));
        const g = await evaluate(`(() => { const o = ${op}; const ws = [...document.querySelectorAll('${sel} .mo-kb')];
          return ws.map((w) => { const i = w.firstElementChild, wr = w.getBoundingClientRect(), cs = getComputedStyle(w);
            return { clip: cs.overflow === 'hidden', dh: Math.abs(wr.height - i.offsetHeight), dw: Math.abs(wr.width - i.offsetWidth), op: o(i), loaded: i.complete && i.naturalWidth > 0 }; }); })()`); checks++;
        ok(g.every((x) => x.clip), `${T}: ${sel}: khung ảnh không cắt tràn (Ken Burns sẽ lấn ra ngoài)`);
        ok(g.every((x) => x.dh <= 1 && x.dw <= 1), `${T}: ${sel}: khung ảnh lệch cỡ với ảnh ${JSON.stringify(g.map((x) => [x.dw, x.dh]))}`);
        ok(g.every((x) => x.op > 0.95), `${T}: ${sel}: ảnh chưa hiện rõ sau khi vào (${g.map((x) => x.op.toFixed(2)).join(',')})`);
        ok(g.every((x) => x.loaded), `${T}: ${sel}: ảnh không tải được`);
      }
      const ev = await evaluate(`(() => { const o = ${op}; const r = document.querySelector('#sales-pr .evrow'); const li = [...r.children];
        const ticks = r.getAnimations({ subtree: true }).filter((a) => a.animationName === 'moTick' && a.playState === 'running').length;
        return { on: r.classList.contains('mo-on'), faint: li.filter((l) => o(l) < 0.95).length, n: li.length, ticks }; })()`); checks++;
      ok(ev.on && ev.faint === 0, `${T}: dòng sự kiện chưa hiện đủ (on=${ev.on}, mờ ${ev.faint}/${ev.n})`);
      ok(ev.ticks === ev.n, `${T}: chấm mốc dòng sự kiện chưa sáng lặp (${ev.ticks}/${ev.n})`);
      ok(await evaluate(`document.documentElement.scrollWidth - innerWidth`) <= 1, `${T}: tab Sales tràn ngang`);
    }
  }
  // Ô lưới cảnh gx (tab Team) trôi lặp
  await go(`${pageUrl}?lang=ja#team-top`, 1280);
  const hasTile = await evaluate(`!!document.querySelector('main[data-view="team"] .gx-tile')`);
  if (hasTile) {
    await center('main[data-view="team"] .gx-tile'); await sleep(500);
    const t = await evaluate(ANIMS('main[data-view="team"] .gx-tile .gx-pl img')); checks++;
    ok(t.loops >= 1, `team: icon ô lưới cảnh gx chưa trôi lặp (${t.loops}/${t.n})`);
  }

  // ── 7) reduced-motion: không gắn, không animation mo*, số giữ nguyên, ảnh không bị bọc
  for (const tab of ['cover', 'sales-top']) {
    await go(`${pageUrl}?lang=ja#${tab}`, 1280, 'reduce');
    const r = await evaluate(`(() => { const a = document.getAnimations().filter((x) => /^(mo|gxFloat)/.test(x.animationName || ''));
      return { arm: document.querySelectorAll('.mo-arm,.mo-kb').length, anims: a.length }; })()`); checks++;
    ok(r.arm === 0 && r.anims === 0, `${tab}/reduce: vẫn gắn motion-all (${r.arm} phần tử, ${r.anims} animation)`);
  }
  // ── 8) Chế độ in: mọi phần đã gắn đều hiện, không animation mo*
  await go(`${pageUrl}?lang=ja#sales-top`, 1280, 'no-preference', 'print');
  const pr = await evaluate(`(() => { const o = ${op}; const s = [...document.querySelectorAll('.mo-kb>img,.evrow>li')].filter((e) => e.getClientRects().length);
    return { n: s.length, faint: s.filter((e) => o(e) < 0.95).length, anims: document.getAnimations().filter((x) => /^mo/.test(x.animationName || '')).length }; })()`); checks++;
  ok(pr.n >= 10 && pr.faint === 0 && pr.anims === 0, `print: phần motion-all chưa hiện tĩnh (${JSON.stringify(pr)})`);

  ok(errors.length === 0, `lỗi JS/console: ${errors.slice(0, 5).join(' | ')}`);
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    if (fails.length) { console.error(`FAIL browser-motion-all (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-motion-all: ${checks} lượt đo, 0 lỗi JS; 3 ngôn ngữ x 1280/390: 12 ảnh công tác Ken Burns trong khung cùng cỡ, dòng sự kiện sáng lặp, icon cảnh gx trôi, số đếm lên đúng số gốc, không tràn ngang; reduced-motion và bản in tĩnh`);
    process.exit(0);
  }, 300);
});
