// Task m3tn: 6 thẻ kỹ năng tab Team (#team-skills) bỏ kiểu icon to ở giữa (lõi quỹ đạo / biểu đồ), thay bằng workflow:
// 3 bước nối mũi tên, mỗi bước có nhãn đánh số đủ JA / EN / VI, bước sáng lần lượt (chỉ transform / opacity), tắt khi giảm chuyển động.
// Chạy: node tests/check-skill-workflow.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
const html = readFileSync(file, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';

const cards = sec('team-skills').split('<div class="card sv-card">').slice(1);
ok(cards.length === 6, `team-skills: cần 6 thẻ, thấy ${cards.length}`);
const firstSteps = [];
cards.forEach((c, i) => {
  const w = `team-skills#${i + 1}`;
  const sp = (c.match(/<div class="sv-spot gxs [^"]*"[\s\S]*?<!--\/gxs-->/) || [])[0] || '';
  ok(/^<div class="sv-spot gxs gxs--wf"/.test(sp), `${w}: chưa là workflow (gxs--wf), đang ${(sp.match(/gxs--\w+/) || ['không có cảnh'])[0]}`);
  ok(!/gx-pl--l|gx-orb|gxs-ring|gx-chartc/.test(sp), `${w}: còn icon to / quỹ đạo / biểu đồ giữa khung`);
  ok((sp.match(/<img /g) || []).length === 3, `${w}: cần đúng 3 icon bước`);
  ok((sp.match(/<i class="gxs-ln"/g) || []).length === 2, `${w}: cần 2 mũi tên nối 3 bước`);
  ok((sp.match(/<i class="gxs-hl"><\/i>/g) || []).length === 3, `${w}: cần 3 quầng sáng bước (gxs-hl)`);
  const lbs = [...sp.matchAll(/<b class="gxs-lb"><i>(\d\d)<\/i>([\s\S]*?)<\/b>/g)];
  ok(lbs.length === 3, `${w}: cần 3 nhãn bước, có ${lbs.length}`);
  ok(lbs.map((m) => m[1]).join(',') === '01,02,03', `${w}: nhãn phải đánh số 01,02,03`);
  for (const [, , t] of lbs) for (const l of ['ja', 'en', 'vi']) {
    const s = (t.match(new RegExp(`<span data-l="${l}">([^<]+)</span>`)) || [])[1] || '';
    ok(s.trim() && s.length <= 18, `${w}: nhãn ${l} thiếu hoặc dài quá 18 ký tự (${s})`);
    ok(!/[—–]/.test(s) && !/\d/.test(s), `${w}: nhãn ${l} có gạch dài / con số (${s})`);
  }
  firstSteps.push((sp.match(/assets\/gx\/([a-z-]+)\.webp/) || [])[1]);
});
ok(new Set(cards.map((c) => (c.match(/data-k="([\w-]+)"/) || [])[1])).size === 6, 'data-k của 6 thẻ phải khác nhau');

// CSS: mũi tên ở đầu nét, bước sáng lần lượt bằng keyframes gxsStep (chỉ transform / opacity), giảm chuyển động tắt hết
const css = (html.match(/<style id="gx-css">([\s\S]*?)<\/style>/) || [])[1] || '';
const kf = (css.match(/@keyframes gxsStep\{([\s\S]*?\})\}/) || [])[1] || '';
ok(kf, 'thiếu @keyframes gxsStep');
ok(kf && [...kf.matchAll(/([a-z-]+):/g)].every((m) => ['transform', 'opacity'].includes(m[1])), 'gxsStep chỉ được đổi transform / opacity');
ok(/html\.js \.gxs [^{]*\.gxs-hl[^{]*\{animation:gxsStep [^}]*infinite/.test(css), 'quầng sáng gxs-hl phải chạy gxsStep lặp');
ok(/html\.js \.gxs [^{]*\.gxs-lb::before[^{]*\{animation:gxsStep [^}]*infinite/.test(css), 'nhãn bước phải sáng theo cùng nhịp gxsStep');
ok(/\.gxs--wf \.gxs-ln::after\{[^}]*rotate\(45deg\)/.test(css), 'thiếu đầu mũi tên trên nét nối');
ok(/@media \(prefers-reduced-motion:reduce\)\{\.gxs \*,\.gxs \*::before/.test(css), 'giảm chuyển động phải tắt cả ::before của nhãn');
ok(/\.gxs-hl\{[^}]*opacity:0/.test(css), 'quầng sáng phải ẩn mặc định (reduced-motion không còn quầng đứng yên)');

if (fails.length) { console.error(`FAIL check-skill-workflow (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-skill-workflow: 6 thẻ kỹ năng Team = workflow 3 bước (nhãn 01..03 JA/EN/VI, mũi tên, bước sáng lần lượt), không còn icon to ở giữa');
