// Task v3c1: 14 cảnh động .gxs (icon video GPRFLEXEYE) đo trên Chrome headless thật. Mỗi cảnh được đặt ở 3 bề rộng (thẻ hẹp 230px,
// thẻ thường 330px, đầu tab 880px): icon tải được, cỡ icon đúng 84% ô kính (không bị luật .sv-hero img cũ kéo giãn), icon / chip / biểu đồ
// nằm gọn trong khung, các ô icon không đè nhau, sau khi vào cảnh có vòng lặp gx* đang chạy và mọi icon hiện rõ;
// reduced-motion: 0 animation, mọi icon vẫn hiện.
// Chạy: node tests/browser-gxs.mjs   (thoát 0 = đạt; cần Chrome)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { openChrome, sleep } from '../tools/team-flow/cdp.mjs';

const url = pathToFileURL(fileURLToPath(new URL('../index.html', import.meta.url))).href;
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
let checks = 0;

// Dựng bản sao của 14 cảnh vào 1 lớp phủ cố định (không phụ thuộc tab / slide đang mở), đo sau khi chuyển động vào cảnh xong
const MEASURE = (w) => `(async () => {
  document.getElementById('gxs-t')?.remove();
  const o = document.createElement('div'); o.id = 'gxs-t';
  o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;display:flex;flex-wrap:wrap;gap:12px;padding:12px;align-content:flex-start';
  const src = [...document.querySelectorAll('.gxs')];
  src.forEach((g) => { const k = g.cloneNode(true); k.style.cssText = 'margin:0;flex:none;width:${w}px'; k.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
    // giữ ngữ cảnh thật: cảnh đầu tab nằm trong figure.sv-hero (bắt luật CSS cũ của .sv-hero img)
    if (g.parentElement.classList.contains('sv-hero')) { const h = document.createElement('figure'); h.className = 'sv-hero'; h.style.cssText = 'margin:0;flex:none'; h.appendChild(k); o.appendChild(h); } else o.appendChild(k); });
  document.body.appendChild(o);
  const fs = [...o.querySelectorAll('.gxs')];
  await Promise.all([...o.querySelectorAll('img')].map((i) => i.decode().catch(() => {})));
  fs.forEach((f) => { f.classList.remove('is-off'); f.classList.add('is-in'); });
  await new Promise((r) => setTimeout(r, 2600));
  const op = (e, top) => { let v = 1; for (let x = e; x && x !== top.parentElement; x = x.parentElement) v *= +getComputedStyle(x).opacity; return v; };
  return fs.map((f) => {
    const fr = f.getBoundingClientRect(), key = f.dataset.k;
    const imgs = [...f.querySelectorAll('img')];
    const broken = imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).length;
    const pls = [...f.querySelectorAll('.gx-pl')];
    const badSize = pls.map((p) => { const i = p.querySelector('img'), a = p.getBoundingClientRect().width, b = i.getBoundingClientRect().width; return b / a; })
      .filter((r) => r > 0.92 || r < 0.6).length;
    const parts = [...f.querySelectorAll('.gx-pl,.gx-chip,.gx-chartc')];
    const outside = parts.filter((e) => { const r = e.getBoundingClientRect(); return r.left < fr.left - 1 || r.right > fr.right + 1 || r.top < fr.top - 1 || r.bottom > fr.bottom + 1; }).map((e) => e.className);
    const rs = [...f.querySelectorAll('.gxs-at>.gx-pl,.gxs-at>.gx-orb,.gxs-tx>.gx-chip,.gx-chartc')].map((e) => e.getBoundingClientRect());
    let overlap = 0;
    for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) {
      const x = Math.min(rs[a].right, rs[b].right) - Math.max(rs[a].left, rs[b].left), y = Math.min(rs[a].bottom, rs[b].bottom) - Math.max(rs[a].top, rs[b].top);
      if (x > 3 && y > 3) overlap++;
    }
    const faint = parts.filter((e) => op(e, f) < 0.95).length;
    const loops = f.getAnimations({ subtree: true }).filter((a) => /^gx/.test(a.animationName) && a.effect.getTiming().iterations === Infinity && a.playState === 'running').length;
    const all = f.getAnimations({ subtree: true }).length;
    return { key, n: imgs.length, broken, badSize, outside, overlap, faint, loops, all };
  });
})()`;

const c = await openChrome();
try {
  for (const reduced of [false, true]) {
    await c.go(url, 1400, 1000, { reducedMotion: reduced });
    await sleep(500);
    for (const w of reduced ? [330] : [230, 330, 880]) {
      const res = await c.evaluate(MEASURE(w));
      ok(Array.isArray(res) && res.length === 12, `${w}px: cần 12 cảnh .gxs, thấy ${res && res.length}`);
      for (const r of res || []) {
        checks++;
        const at = `${r.key}@${w}px${reduced ? ' (reduced-motion)' : ''}`;
        ok(r.n >= 3 && !r.broken, `${at}: ${r.broken}/${r.n} icon không tải được`);
        ok(!r.badSize, `${at}: ${r.badSize} icon sai cỡ trong ô kính`);
        ok(!r.outside.length, `${at}: lọt khỏi khung: ${r.outside.join(', ')}`);
        ok(!r.overlap, `${at}: ${r.overlap} cặp icon / chip đè nhau`);
        ok(!r.faint, `${at}: ${r.faint} phần tử còn mờ sau khi vào cảnh`);
        if (reduced) ok(r.all === 0, `${at}: reduced-motion vẫn còn ${r.all} animation`);
        else ok(r.loops >= 3, `${at}: vòng lặp chuyển động không chạy (${r.loops})`);
      }
    }
  }
  ok(!c.errors.length, `lỗi JS: ${c.errors.slice(0, 2).join(' | ')}`);
} finally { c.close(); }

if (fails.length) { console.error(`FAIL browser-gxs (${fails.length})\n- ` + fails.slice(0, 30).join('\n- ')); process.exit(1); }
console.log(`PASS browser-gxs: ${checks} lượt đo, 12 cảnh x 230/330/880px + reduced-motion: icon video tải đủ, đúng cỡ, không lọt khung, không đè nhau, vòng lặp chạy, reduced-motion tĩnh`);
