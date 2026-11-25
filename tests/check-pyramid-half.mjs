// Task 0i62: tầng giữa (20%) của 2 kim tự tháp #ai-pyramid là "một nửa AI, một nửa con người".
// Kiểm tĩnh: mỗi tháp có nửa trái tầng giữa tô màu AI (py-half), nhãn AI + nhãn người trên tầng giữa,
// chú giải tầng 20% ghi AI 50% / người 50% đủ JA/EN/VI, phụ đề cảnh 2 nói nửa nửa, animation chỉ transform/opacity.
// Chạy: node tests/check-pyramid-half.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const count = (s, re) => (s.match(re) || []).length;
const fig = (html.match(/<figure class="mv pyr rv"[\s\S]*?<\/figure>/) || [])[0] || '';
ok(fig, 'thiếu <figure class="mv pyr rv">');

// SVG: trong <g class="py-t py-t2"> của mỗi tháp có nửa AI + nhãn AI + nhãn người
const t2 = [...fig.matchAll(/<g class="py-t py-t2">([\s\S]*?)<\/g><g class="py-t py-t3">/g)].map((m) => m[1]);
ok(t2.length === 2, `cần tầng giữa ở 2 tháp (thấy ${t2.length})`);
for (const [i, g] of t2.entries()) {
  const tag = i ? 'sales' : 'gen';
  // py-half trùng hình tầng giữa (đổi chiều cao tầng vẫn khớp), tô bằng gradient AI cắt cứng ở x=150 (giữa tháp)
  const half = (g.match(/<polygon class="py-half" points="([^"]+)" fill="url\(#(py-gh-[a-z]+)\)"/) || []);
  const lt = (g.match(/<polygon class="py-lt" points="([^"]+)"/) || [])[1];
  ok(half[1] && half[1] === lt, `${tag}: tầng giữa thiếu nửa AI (polygon.py-half trùng py-lt, fill py-gh-*)`);
  const grad = (fig.match(new RegExp(`<linearGradient id="${half[2]}"[^>]*>([\\s\\S]*?)</linearGradient>`)) || [''])[0];
  ok(/gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="0"/.test(grad), `${tag}: gradient nửa AI phải theo trục ngang toàn khung 0..300`);
  ok(/<stop offset="\.5" stop-color="#26B3F4"\/><stop offset="\.5" stop-color="#26B3F4" stop-opacity="0"\/>/.test(grad), `${tag}: gradient nửa AI phải cắt cứng tại giữa (offset .5)`);
  ok(/<line class="py-mid"/.test(g), `${tag}: thiếu vạch chia đôi tầng giữa (py-mid)`);
  ok(/<g class="py-ai py-ai2">[\s\S]*?>AI<\/text>/.test(g), `${tag}: tầng giữa thiếu nhãn AI (py-ai2)`);
  ok(/<g class="py-hu">/.test(g), `${tag}: tầng giữa thiếu nhãn con người (py-hu)`);
}

// Chú giải tầng 20%: AI 50% + người 50% đủ 3 ngôn ngữ, ở cả 2 tháp
const r2 = [...fig.matchAll(/<li class="py-r py-r2">([\s\S]*?)<\/li>/g)].map((m) => m[1]);
ok(r2.length === 2, 'cần chú giải tầng 20% ở 2 tháp');
for (const [l, hu] of [['ja', '人 50%'], ['en', 'People 50%'], ['vi', 'Người 50%']])
  for (const r of r2) {
    const nm = (r.match(new RegExp(`<b class="py-nm" data-l="${l}">([\\s\\S]*?)</b>`)) || [])[1] || '';
    ok(/<i class="py-hf py-hf--ai">AI 50%<\/i>/.test(nm) && nm.includes(`<i class="py-hf py-hf--hu">${hu}</i>`), `chú giải 20% (${l}) thiếu AI 50% / ${hu}`);
  }

// Phụ đề cảnh 2 nói rõ nửa nửa
ok(/<p class="mv-cap py-c2" data-l="ja">[^<]*半分ずつ/.test(fig), 'phụ đề 2 JA phải nói AIと人が半分ずつ');
ok(/<p class="mv-cap py-c2" data-l="en">[^<]*half and half/.test(fig), 'phụ đề 2 EN phải nói half and half');
ok(/<p class="mv-cap py-c2" data-l="vi">[^<]*một nửa AI, một nửa con người/.test(fig), 'phụ đề 2 VI phải nói một nửa AI, một nửa con người');

// CSS: nhãn tầng giữa có animation riêng theo cảnh 2, chỉ transform/opacity
const css = (html.match(/<!-- pyr-css:start -->([\s\S]*?)<!-- pyr-css:end -->/) || [])[1] || '';
ok(/\.py-ai\.py-ai2\{animation:pyAi2 var\(--py-t\)/.test(css), 'nhãn AI tầng giữa cần animation pyAi2 dùng --py-t');
ok(/\.py-hu\{animation:pyHu var\(--py-t\)/.test(css), 'nhãn người tầng giữa cần animation pyHu dùng --py-t');
for (const n of ['pyAi2', 'pyHu']) {
  const body = (css.match(new RegExp(`@keyframes ${n}\\{((?:[^{}]*\\{[^{}]*\\})*)\\}`)) || [])[1] || '';
  ok(body, `thiếu @keyframes ${n}`);
  ok([...body.matchAll(/([a-z-]+)\s*:/g)].every((m) => m[1] === 'transform' || m[1] === 'opacity'), `${n} chỉ được đổi transform/opacity`);
}
ok(count(css, /\.py-hf/g) >= 2, 'thiếu CSS cho chip py-hf');

if (fails.length) { console.error('FAIL check-pyramid-half:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-pyramid-half: tầng giữa 2 tháp chia đôi AI / con người (SVG + nhãn + chú giải JA/EN/VI + phụ đề), animation chỉ transform/opacity');
