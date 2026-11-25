// Task 42ax: 3 tầng của 2 kim tự tháp #ai-pyramid canh từ ĐÁY lên ĐỈNH đúng tỷ lệ CHIỀU CAO 70% / 20% / 10%.
// Đo trên toạ độ SVG thật: chiều cao hiện của mỗi tầng (polygon.py-lt) chia tổng 3 tầng = 70/20/10 (sai số 0.3 điểm %),
// tầng 1 nằm dưới cùng, 3 tầng chung 2 cạnh bên (đỉnh tháp, không méo), 2 khe bằng nhau, clipPath vệt quét = tầng đáy,
// đường gióng nằm trong khe, chữ / icon / hình của tầng đáy và tầng giữa nằm gọn trong dải chiều cao của tầng đó.
// Chạy: node tests/check-pyramid-height.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const fig = (html.match(/<figure class="mv pyr rv"[\s\S]*?<\/figure>/) || [])[0] || '';
const svgs = fig.match(/<svg class="py-svg"[\s\S]*?<\/svg>/g) || [];
ok(svgs.length === 2, `cần 2 svg.py-svg (thấy ${svgs.length})`);
const pts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const attr = (tag, a) => { const m = tag.match(new RegExp(`\\s${a}="([-\\d.]+)"`)); return m ? +m[1] : NaN; };
const EPS = 0.6;

for (const [i, svg] of svgs.entries()) {
  const tag = i ? 'sales' : 'gen';
  const part = (t) => {
    const a = svg.indexOf(`<g class="py-t py-t${t}">`);
    const b = t < 3 ? svg.indexOf(`<g class="py-t py-t${t + 1}">`) : svg.indexOf('<circle class="py-fly"');
    return a < 0 || b < 0 ? '' : svg.slice(a, b);
  };
  const tiers = [1, 2, 3].map((t) => {
    const g = part(t);
    const p = (g.match(/<polygon class="py-lt" points="([^"]+)"/) || [])[1];
    ok(p, `${tag}: thiếu polygon.py-lt tầng ${t}`);
    const v = p ? pts(p) : [[0, 0]];
    const ys = v.map((q) => q[1]);
    return { t, g, v, top: Math.min(...ys), bot: Math.max(...ys) };
  });
  const [t1, t2, t3] = tiers;
  const h = tiers.map((x) => x.bot - x.top);
  const sum = h[0] + h[1] + h[2];
  const pct = h.map((x) => +(x / sum * 100).toFixed(2));
  // 1) Tỷ lệ chiều cao từ đáy lên: 70 / 20 / 10
  [70, 20, 10].forEach((want, k) => ok(Math.abs(pct[k] - want) <= 0.3, `${tag}: tầng ${k + 1} cao ${pct[k]}% (cần ${want}%), cao px = ${h.map((x) => x.toFixed(1)).join('/')}`));
  // 2) Thứ tự đáy -> đỉnh, 2 khe bằng nhau
  ok(t1.top > t2.bot && t2.top > t3.bot, `${tag}: thứ tự tầng phải 70% dưới cùng, 10% trên cùng`);
  const g1 = t1.top - t2.bot, g2 = t2.top - t3.bot;
  ok(Math.abs(g1 - g2) <= 0.2 && g1 <= 8, `${tag}: 2 khe giữa các tầng phải bằng nhau và nhỏ (đang ${g1.toFixed(1)} / ${g2.toFixed(1)})`);
  // 3) Cùng một tháp: mọi đỉnh polygon nằm trên 2 cạnh bên nối đỉnh tháp với 2 góc đáy
  const apex = t3.v.find((q) => q[1] === t3.top) || [150, t3.top];
  const base = t1.v.filter((q) => q[1] === t1.bot).map((q) => q[0]);
  const cx = apex[0], W = (Math.max(...base) - Math.min(...base)) / 2, H = t1.bot - apex[1];
  for (const tr of tiers) for (const [x, y] of tr.v) {
    const hw = W * (y - apex[1]) / H;
    ok(Math.abs(Math.abs(x - cx) - hw) <= EPS, `${tag}: đỉnh (${x},${y}) tầng ${tr.t} lệch cạnh bên tháp (cần |x-${cx}|=${hw.toFixed(2)})`);
  }
  // 4) Bóng (py-sh) và clipPath vệt quét trùng tầng tương ứng
  for (const tr of tiers) {
    const sh = (tr.g.match(/<polygon class="py-sh" points="([^"]+)"/) || [])[1];
    ok(sh && sh === (tr.g.match(/<polygon class="py-lt" points="([^"]+)"/) || [])[1], `${tag}: py-sh tầng ${tr.t} phải trùng py-lt`);
  }
  const clip = (svg.match(/<clipPath id="py-clip-[a-z]+"><polygon points="([^"]+)"/) || [])[1];
  ok(clip && clip === (t1.g.match(/<polygon class="py-lt" points="([^"]+)"/) || [])[1], `${tag}: clipPath vệt quét phải trùng tầng đáy`);
  const gl = (t3.g.match(/<polygon class="py-gl" points="([^"]+)"/) || [])[1];
  ok(gl && gl === (t3.g.match(/<polygon class="py-lt" points="([^"]+)"/) || [])[1], `${tag}: viền sáng py-gl phải trùng tầng đỉnh`);
  // 5) Đường gióng nằm trong 2 khe
  const gd = [...svg.matchAll(/<line class="py-gd"[^>]*>/g)].map((m) => attr(m[0], 'y1')).sort((a, b) => a - b);
  ok(gd.length === 2 && gd[0] >= t3.bot && gd[0] <= t2.top && gd[1] >= t2.bot && gd[1] <= t1.top, `${tag}: đường gióng py-gd phải nằm trong 2 khe (đang y=${gd.join(',')})`);
  // 6) Nội dung tầng đáy + tầng giữa nằm trong dải chiều cao của tầng (bỏ vệt quét, nó bị clip)
  for (const tr of [t1, t2]) {
    const g = tr.g.replace(/<rect class="py-scan"[^>]*>/g, '');
    const boxes = [];
    for (const m of g.matchAll(/<(?:image|rect)\b[^>]*>/g)) { const y = attr(m[0], 'y'), hh = attr(m[0], 'height'); if (!isNaN(y)) boxes.push([y, y + hh, m[0].slice(0, 40)]); }
    for (const m of g.matchAll(/<text\b[^>]*>/g)) { const y = attr(m[0], 'y'); const fs = /py-pc1/.test(m[0]) ? 30 : /py-pc2/.test(m[0]) ? 17 : 11; if (!isNaN(y)) boxes.push([y - fs * 0.72, y, m[0].slice(0, 40)]); }
    for (const m of g.matchAll(/<line\b[^>]*>/g)) boxes.push([Math.min(attr(m[0], 'y1'), attr(m[0], 'y2')), Math.max(attr(m[0], 'y1'), attr(m[0], 'y2')), m[0].slice(0, 40)]);
    for (const m of g.matchAll(/<polygon\b[^>]*points="([^"]+)"/g)) { const ys = pts(m[1]).map((q) => q[1]); boxes.push([Math.min(...ys), Math.max(...ys), m[0].slice(0, 40)]); }
    for (const [a, b, s] of boxes) ok(a >= tr.top - EPS && b <= tr.bot + EPS, `${tag}: ${s} (y ${a.toFixed(1)}-${b.toFixed(1)}) tràn khỏi tầng ${tr.t} (${tr.top}-${tr.bot})`);
  }
  if (i === 0) console.log(`  ${tag}: cao tầng 1/2/3 = ${h.map((x) => x.toFixed(1)).join(' / ')} px = ${pct.join(' / ')} %`);
}

if (fails.length) { console.error('FAIL check-pyramid-height:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-pyramid-height: 2 tháp, 3 tầng cao đúng 70/20/10 từ đáy lên, chung cạnh bên, khe đều, nội dung nằm trong tầng');
