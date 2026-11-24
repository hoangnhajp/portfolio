// Bỏ hẳn trang "Liên hệ / Contact / 連絡先" (task jofj), sau task ye4s tab Profile còn 10 trang 01..10.
// Chạy: node tests/check-no-contact-page.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!/id="contact"/.test(html), 'còn section #contact');
ok(!/href="#contact"/.test(html), 'còn link tới #contact (sidebar / mục lục)');
ok(!/#contact\b/.test(html), 'còn CSS / JS trỏ #contact');
for (const t of ['連絡先', 'Cảm ơn anh/chị đã dành thời gian', 'Thank you for taking', 'ありがとうございます。</i>', 'mailto:nhatth3107', 'tel:+84903191364'])
  ok(!html.includes(t), `còn nội dung trang Liên hệ: "${t}"`);

// Đánh số liên tục 01..10 (task ye4s bỏ 11~13): section, footer "NN ／ 10", sidebar và mục lục kết thúc ở 10 (#pcai)
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const want = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
const nums = [...prof.matchAll(/<section[^>]*data-num="(\d+)"/g)].map((m) => m[1]);
ok(nums.join(',') === want.join(','), `data-num phải 01..10, đang ${nums.join(',')}`);
const ft = [...prof.matchAll(/<p>(\d+) ／ (\d+)<\/p>/g)];
ok(ft.length === 10 && ft.every(([, a, b], i) => a === want[i] && b === '10'), `footer phải 01..10 ／ 10, đang ${ft.map((m) => m[1] + '/' + m[2]).join(',')}`);
ok(!/<em>1[1-4]<\/em>/.test(prof) && !/／ 1[1-4]</.test(html), 'còn số trang 11..14');
ok(/href="#pcai" data-sec="pcai"><em>10<\/em>/.test(html), 'sidebar: #pcai phải là mục cuối 10');
ok(/<a href="#pcai"><em>10<\/em>/.test(html), 'mục lục: #pcai phải là mục cuối 10');
// Trang cuối (#pcai) vẫn hiện chân trang trên desktop như trang Liên hệ trước đây
ok(/#pcai>\.ft\{display:flex\}/.test(html), 'CSS desktop: thiếu #pcai>.ft{display:flex} cho chân trang trang cuối');

if (fails.length) { console.error(`FAIL check-no-contact-page (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-contact-page: không còn trang Liên hệ, đánh số 01..10, #pcai là trang cuối');
