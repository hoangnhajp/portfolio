// Task cfc8: QA hình học "cân đối, canh đều" cho TOÀN BỘ portfolio, đo trên Chrome headless thật (CDP), CÓ chuyển động
// (lỗi lệch chỉ lộ ra khi animation chạy: keyframe ghi đè transform căn giữa; chạy reduced-motion sẽ không thấy).
// Mỗi tab (data-view) x mỗi trang .pg: cuộn tới, chờ khối vào khung, tua các animation hữu hạn tới cuối (Animation.finish), rồi đo:
//  R1 transform-override: phần tử dựa vào transform tĩnh để định vị (vd translate(-50%,-50%)) mà animation đẩy lệch tâm > 6px.
//  R2 anchor: phần tử đặt bằng toạ độ --x / --y phải có TÂM khung trùng điểm neo (left, top) trong 2px.
//  R3 edge: đường nối (phần tử --x/--y có --a hoặc --l) phải thẳng hàng với tâm 2 nút ở 2 đầu (lệch vuông góc <= 3px).
//  R4 clip: chữ không tràn ra ngoài tờ .pg / ra ngoài thẻ .card chứa nó; nhãn nowrap không bị cắt.
//  R5 row: các thẻ .card cùng hàng trong 1 lưới phải cùng mép trên (lệch <= 1px).
// Chạy: node tests/browser-visual-balance.mjs   (thoát 0 = đạt). Biến: CHROME, SHOT_DIR, VB_URL (trang khác), VB_SCOPE (selector khối cần đo, mặc định section.pg[id]),
//   VB_PAGES=id1,id2 (chỉ đo vài khối), VB_WIDTHS="1280,390", VB_LANGS="ja,en,vi" (khổ < 600px chỉ chạy ngôn ngữ cuối).
// Bản sao dùng chung: C:/Users/hoang/.claude/skills/media-business-video/scripts/motion_balance_audit.mjs (giữ 2 file giống hệt).
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CANDIDATES = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean);
const chromePath = CANDIDATES.find((p) => existsSync(p));
if (!chromePath) { console.error('FAIL: không tìm thấy Chrome (đặt biến CHROME)'); process.exit(1); }
const SHOT = process.env.SHOT_DIR || '';
const pageUrl = process.env.VB_URL || pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const WIDTHS = (process.env.VB_WIDTHS || '1280,390').split(',').map(Number);
const LANGS = (process.env.VB_LANGS || 'ja,en,vi').split(',');
const dir = mkdtempSync(join(tmpdir(), 'vb-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--no-first-run',
  '--no-default-browser-check', '--disable-gpu', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
let pagesChecked = 0;

// Đo trong trang. Trả danh sách lỗi dạng chuỗi. TOL chỉnh được.
const PROBE = (pgId) => `(() => {
  const TOL = { shift: 6, anchor: 2, edge: 3, clip: 1.5, row: 1 };
  const pg = document.getElementById(${JSON.stringify(pgId)}); if (!pg) return [];
  const out = [];
  const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && e.getClientRects().length > 0; };
  const name = (e) => (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : '')) + (e.textContent.trim() ? ' "' + e.textContent.trim().slice(0, 18) + '"' : '');
  const ctr = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  for (const a of document.getAnimations()) if (a.effect && pg.contains(a.effect.target) && a.effect.getTiming().iterations !== Infinity) { try { a.finish(); } catch {} }
  const all = [...pg.querySelectorAll('*')].filter(vis);
  const identity = (t) => t === 'none' || /^matrix\\(1, 0, 0, 1, 0, 0\\)$/.test(t);
  // R1: transform-override
  for (const e of all) {
    const an = e.getAnimations().filter((a) => a.effect && a.effect.getKeyframes().some((k) => 'transform' in k));
    if (!an.length) continue;
    const r1 = e.getBoundingClientRect();
    const old = e.style.getPropertyValue('animation'), oldP = e.style.getPropertyPriority('animation');
    e.style.setProperty('animation', 'none', 'important');
    const st = getComputedStyle(e).transform; const r0 = e.getBoundingClientRect();
    if (old) e.style.setProperty('animation', old, oldP); else e.style.removeProperty('animation');
    for (const a of e.getAnimations()) if (a.effect.getTiming().iterations !== Infinity) { try { a.finish(); } catch {} } // bật lại thì animation chạy lại từ đầu: tua tới cuối
    if (identity(st)) continue;
    const m = new DOMMatrix(st); if (Math.abs(m.a * m.d - m.b * m.c) < 0.05 || (Math.abs(m.e) < 0.5 && Math.abs(m.f) < 0.5)) continue; // chỉ xét transform có dịch chuyển định vị, bỏ scale(0) ẩn
    const [ax, ay] = ctr(r1), [bx, by] = ctr(r0); const d = Math.hypot(ax - bx, ay - by);
    if (d > TOL.shift) out.push('R1 animation ghi đè transform định vị, lệch ' + d.toFixed(1) + 'px: ' + name(e));
  }
  // R2 + R3: neo toạ độ và đường nối
  const anchored = all.filter((e) => /--x\\s*:/.test(e.getAttribute('style') || '') && /--y\\s*:/.test(e.getAttribute('style') || '') && getComputedStyle(e).position === 'absolute');
  const isEdge = (e) => /--(a|l)\\s*:/.test(e.getAttribute('style') || '');
  const nodes = anchored.filter((e) => !isEdge(e));
  for (const e of nodes) {
    const op = e.offsetParent; if (!op) continue;
    const cs = getComputedStyle(e); const pin = document.createElement('i');
    pin.style.cssText = 'position:absolute;width:0;height:0;margin:0;padding:0;border:0;left:' + cs.left + ';top:' + cs.top; op.appendChild(pin);
    const pp = pin.getBoundingClientRect(); pin.remove(); const px = pp.left, py = pp.top; // điểm neo trong không gian đã transform của khung cha
    const [cx, cy] = ctr(e.getBoundingClientRect()); const d = Math.hypot(cx - px, cy - py);
    if (d > TOL.anchor) out.push('R2 tâm lệch điểm neo ' + d.toFixed(1) + 'px: ' + name(e));
  }
  for (const e of anchored.filter(isEdge)) {
    const mk = (side) => { const p = document.createElement('i'); p.style.cssText = 'position:absolute;width:0;height:0;top:50%;' + side + ':0'; e.appendChild(p); const r = p.getBoundingClientRect(); p.remove(); return [r.left, r.top]; };
    const s = mk('left'), t = mk('right'); const L = Math.hypot(t[0] - s[0], t[1] - s[1]); if (L < 4) continue;
    const ux = (t[0] - s[0]) / L, uy = (t[1] - s[1]) / L;
    const sib = nodes.filter((n) => n.parentElement === e.parentElement).map((n) => { const r = n.getBoundingClientRect(); return [...ctr(r), Math.hypot(r.width, r.height) / 2 + 8]; });
    const near = (end) => { let best = null; for (const [cx, cy, reach] of sib) { const tp = ((cx - s[0]) * ux + (cy - s[1]) * uy) / L; const perp = Math.abs((cx - s[0]) * uy - (cy - s[1]) * ux);
      const ok = end ? tp >= 0.85 : tp <= 0.15; if (!ok) continue; const dist = end ? Math.abs(tp - 1) * L : Math.abs(tp) * L; if (dist > reach) continue; /* đầu mút phải chạm / sát vòng nút, không chỉ cùng hướng */ if (!best || dist < best.dist) best = { dist, perp }; } return best; };
    const a = near(false), b = near(true);
    if (!a || !b) out.push('R3 đường nối không có nút ở ' + (!a ? 'đầu' : 'cuối') + ': ' + name(e));
    else if (a.perp > TOL.edge || b.perp > TOL.edge) out.push('R3 đường nối lệch tâm nút ' + Math.max(a.perp, b.perp).toFixed(1) + 'px: ' + name(e));
  }
  // R4: chữ tràn tờ / thẻ / nhãn nowrap bị cắt
  const pr = pg.getBoundingClientRect();
  const leaves = all.filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('[aria-hidden="true"] .mo-kb, .pganh, .ft'));
  for (const e of leaves) {
    const r = e.getBoundingClientRect(); if (r.width <= 2 || r.height <= 2) continue;
    let hid = false; for (let a = e; a && a !== pg; a = a.parentElement) { const c = getComputedStyle(a); if ((c.clip && c.clip !== 'auto') || c.clipPath !== 'none' || +c.opacity < 0.05) { hid = true; break; } }
    if (hid) continue; // chữ chỉ dành cho trình đọc màn hình (sr-only) hoặc đang ẩn
    if (r.left < pr.left - TOL.clip || r.right > pr.right + TOL.clip) { out.push('R4 chữ tràn ra ngoài tờ [' + Math.round(r.left) + '..' + Math.round(r.right) + ' / tờ ' + Math.round(pr.left) + '..' + Math.round(pr.right) + ']: ' + name(e)); continue; }
    for (let a = e.parentElement; a && a !== pg; a = a.parentElement) {
      const c = getComputedStyle(a); if (!a.classList.contains('card') && c.overflowX === 'visible' && c.overflowY === 'visible') continue;
      const b = a.getBoundingClientRect(); if (r.left < b.left - TOL.clip || r.right > b.right + TOL.clip || r.top < b.top - TOL.clip || r.bottom > b.bottom + TOL.clip) { out.push('R4 chữ tràn / bị cắt bởi khung ' + name(a).slice(0, 40) + ': ' + name(e)); break; }
    }
    if (getComputedStyle(e).whiteSpace === 'nowrap' && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible') out.push('R4 nhãn nowrap bị cắt: ' + name(e));
  }
  // R5: thẻ cùng hàng cùng mép trên
  for (const g of all.filter((e) => getComputedStyle(e).display === 'grid')) {
    const kids = [...g.children].filter((k) => k.classList.contains('card') && vis(k) && getComputedStyle(k).position !== 'absolute');
    if (kids.length < 2) continue;
    const tops = kids.map((k) => k.getBoundingClientRect().top).sort((x, y) => x - y);
    for (let i = 1; i < tops.length; i++) { const d = tops[i] - tops[i - 1]; if (d > TOL.row && d < 12) { out.push('R5 thẻ cùng hàng lệch mép trên ' + d.toFixed(1) + 'px: ' + name(g)); break; } }
  }
  return out;
})()`;

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
    if (m.method === 'Page.loadEventFired' && loaded) loaded();
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  const go = async (url, w) => {
    await send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 1000, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.navigate', { url: 'about:blank' }); await sleep(120);
    const p = new Promise((r) => { loaded = r; });
    await send('Page.navigate', { url }); await p; await sleep(300);
    await evaluate(`document.fonts.ready.then(() => 1)`);
  };
  await go(pageUrl, 1280);
  const SCOPE = process.env.VB_SCOPE || 'section.pg[id]'; // trang khác: đặt selector các khối cần đo (phải có id)
  const views = await evaluate(`(() => { const ms = [...document.querySelectorAll('main[data-view]')]; const ids = (r) => [...r.querySelectorAll(${JSON.stringify(SCOPE)})].map((s) => s.id);
    return ms.length ? ms.map((m) => [m.dataset.view, ids(m)]) : [['page', ids(document)]]; })()`);
  for (const w of WIDTHS) for (const lang of (w < 600 ? LANGS.slice(-1) : LANGS)) for (const [view, ids] of views) {
    await go(`${pageUrl.split('#')[0]}?lang=${lang}#${ids[0]}`, w);
    for (const pid of ids.filter((x) => !process.env.VB_PAGES || process.env.VB_PAGES.split(',').includes(x))) {
      await evaluate(`(async () => { const p = document.getElementById('${pid}'); const top = p.getBoundingClientRect().top + scrollY;
        for (let y = top; y < top + p.offsetHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
        p.scrollIntoView({ block: 'start' }); await new Promise((r) => setTimeout(r, 380)); return 1; })()`);
      const bad = await evaluate(PROBE(pid)); pagesChecked++;
      for (const b of bad) fails.push(`${lang}/${w}px #${pid}: ${b}`);
      if (SHOT && bad.length) { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(SHOT, `vb-${lang}-${w}-${pid}.png`), Buffer.from(s.result.data, 'base64')); }
    }
  }
  if (errors.length) fails.push('lỗi JS: ' + errors.slice(0, 3).join(' | '));
  ws.close();
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  chrome.kill();
  setTimeout(() => {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    const uniq = [...new Set(fails)];
    if (uniq.length) { console.error(`FAIL browser-visual-balance (${uniq.length} lỗi / ${pagesChecked} lượt trang)\n- ` + uniq.slice(0, 80).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-visual-balance: ${pagesChecked} lượt trang (${LANGS.join('/')} x ${WIDTHS.join('/')}px, có chuyển động): không animation nào ghi đè transform định vị, nút trùng điểm neo, đường nối thẳng tâm nút, chữ không tràn, thẻ cùng hàng thẳng mép`);
    process.exit(0);
  }, 300);
});
