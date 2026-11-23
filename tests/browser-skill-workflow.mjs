// Task m3tn: đo 6 workflow của thẻ kỹ năng tab Team trên Chrome headless thật, ở 3 bề rộng khung (230 / 330 / 540px) x 3 ngôn ngữ:
// icon + nhãn nằm gọn trong khung, nhãn không đè nhau / không đè icon, chữ nhãn không bị cắt, sau khi vào cảnh bước sáng lần lượt
// (3 vòng gxsStep lệch pha đang chạy); reduced-motion: 0 animation, quầng sáng ẩn, nhãn vẫn rõ.
// Chạy: node tests/browser-skill-workflow.mjs   (thoát 0 = đạt; cần Chrome)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { openChrome, sleep } from '../tools/team-flow/cdp.mjs';

const url = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

const MEASURE = (w, lang) => `(async () => {
  document.documentElement.lang = '${lang}';
  document.getElementById('wf-t')?.remove();
  const o = document.createElement('div'); o.id = 'wf-t';
  o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;display:flex;flex-wrap:wrap;gap:12px;padding:12px;align-content:flex-start';
  const src = [...document.querySelectorAll('#team-skills .sv-card .gxs')];
  src.forEach((g) => { const k = g.cloneNode(true); k.style.cssText = 'margin:0;flex:none;width:${w}px'; k.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }); o.appendChild(k); });
  document.body.appendChild(o);
  const fs = [...o.querySelectorAll('.gxs')];
  await Promise.all([...o.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
  fs.forEach((f) => { f.classList.remove('is-off'); f.classList.add('is-in'); });
  await new Promise((r) => setTimeout(r, 2600));
  const op = (e, top) => { let v = 1; for (let x = e; x && x !== top.parentElement; x = x.parentElement) v *= +getComputedStyle(x).opacity; return v; };
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  return fs.map((f) => {
    const fr = f.getBoundingClientRect();
    const pls = [...f.querySelectorAll('.gxs-at>.gx-pl')], lbs = [...f.querySelectorAll('.gxs-lb')];
    const parts = [...pls, ...lbs];
    const outside = parts.filter((e) => { const r = e.getBoundingClientRect(); return r.left < fr.left - 1 || r.right > fr.right + 1 || r.top < fr.top - 1 || r.bottom > fr.bottom + 1; }).length;
    const rs = parts.map((e) => e.getBoundingClientRect());
    let overlap = 0; for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) if (hit(rs[a], rs[b])) overlap++;
    const clipped = lbs.filter((e) => e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1).map((e) => e.innerText.replace(/\\s+/g, ' ') + ' ' + e.scrollWidth + 'x' + e.scrollHeight + '/' + e.clientWidth + 'x' + e.clientHeight).join('; ');
    const txt = lbs.map((e) => e.innerText.replace(/\\s+/g, ' ').trim());
    const small = lbs.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 9).length;
    const faint = parts.filter((e) => op(e, f) < 0.95).length;
    const steps = f.getAnimations({ subtree: true }).filter((a) => a.animationName === 'gxsStep' && a.playState === 'running' && a.effect.getTiming().iterations === Infinity).length;
    const hlShown = [...f.querySelectorAll('.gxs-hl')].filter((e) => +getComputedStyle(e).opacity > 0.05).length;
    return { key: f.dataset.k, kind: f.className, n: pls.length, lbs: lbs.length, outside, overlap, clipped, txt, small, faint, steps, hlShown, all: f.getAnimations({ subtree: true }).length };
  });
})()`;

const c = await openChrome();
try {
  for (const reduced of [false, true]) {
    await c.go(url, 1400, 1000, { reducedMotion: reduced });
    await sleep(500);
    for (const lang of ['ja', 'en', 'vi']) for (const w of reduced ? [330] : [230, 330, 540]) {
      const res = await c.evaluate(MEASURE(w, lang));
      ok(Array.isArray(res) && res.length === 6, `${lang}@${w}px: cần 6 cảnh, thấy ${res && res.length}`);
      for (const r of res || []) {
        checks++;
        const at = `${r.key} ${lang}@${w}px${reduced ? ' (reduced)' : ''}`;
        ok(/gxs--wf/.test(r.kind), `${at}: chưa là workflow (${r.kind})`);
        ok(r.n === 3 && r.lbs === 3, `${at}: cần 3 bước + 3 nhãn (${r.n}/${r.lbs})`);
        ok(!r.outside, `${at}: ${r.outside} phần tử lọt khỏi khung`);
        ok(!r.overlap, `${at}: ${r.overlap} cặp icon / nhãn đè nhau`);
        ok(!r.clipped, `${at}: nhãn bị cắt chữ: ${r.clipped}`);
        ok(!r.small, `${at}: ${r.small} nhãn chữ nhỏ hơn 9px`);
        ok(r.txt.every((t) => /^0[1-3] \S/.test(t)), `${at}: nhãn rỗng / sai số (${r.txt.join(' | ')})`);
        ok(!r.faint, `${at}: ${r.faint} icon / nhãn còn mờ sau khi vào cảnh`);
        if (reduced) ok(r.all === 0 && r.hlShown === 0, `${at}: reduced-motion còn ${r.all} animation / ${r.hlShown} quầng sáng`);
        else ok(r.steps === 6, `${at}: bước sáng lần lượt không chạy (${r.steps} vòng gxsStep, cần 6 = 3 quầng + 3 nhãn)`);
      }
    }
  }
  ok(!c.errors.length, `lỗi JS: ${c.errors.slice(0, 2).join(' | ')}`);
} finally { c.close(); }

if (fails.length) { console.error(`FAIL browser-skill-workflow (${fails.length})\n- ` + fails.slice(0, 30).join('\n- ')); process.exit(1); }
console.log(`PASS browser-skill-workflow: ${checks} lượt đo, 6 workflow x JA/EN/VI x 230/330/540px + reduced-motion: gọn khung, không đè, không cắt chữ, bước sáng lần lượt`);
