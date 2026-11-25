// Bỏ hẳn trang "Liên hệ / Contact / 連絡先" (task jofj), sau task ye4s tab Profile còn 10 trang 01..10; task a9f4 bỏ #pcai nên còn 01..09.
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

// Đánh số liên tục 01..09 (task ye4s bỏ 11~13, task a9f4 bỏ #pcai): section, footer "NN ／ 09", sidebar và mục lục kết thúc ở 09 (#w-early)
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const want = Array.from({ length: 9 }, (_, i) => String(i + 1).padStart(2, '0'));
const nums = [...prof.matchAll(/<section[^>]*data-num="(\d+)"/g)].map((m) => m[1]);
ok(nums.join(',') === want.join(','), `data-num phải 01..09, đang ${nums.join(',')}`);
const ft = [...prof.matchAll(/<p>(\d+) ／ (\d+)<\/p>/g)];
ok(ft.length === 9 && ft.every(([, a, b], i) => a === want[i] && b === '09'), `footer phải 01..09 ／ 09, đang ${ft.map((m) => m[1] + '/' + m[2]).join(',')}`);
ok(!/<em>1[1-4]<\/em>/.test(prof) && !/／ 1[1-4]</.test(html), 'còn số trang 11..14');
ok(/href="#w-early" data-sec="w-early"><em>09<\/em>/.test(html), 'sidebar: #w-early phải là mục cuối 09');
ok(/<a href="#w-early"><em>09<\/em>/.test(html), 'mục lục: #w-early phải là mục cuối 09');
// Trang cuối (#w-early, task a9f4 bỏ #pcai) vẫn hiện chân trang trên desktop như trang Liên hệ trước đây
ok(/#w-early>\.ft\{display:flex\}/.test(html), 'CSS desktop: thiếu #w-early>.ft{display:flex} cho chân trang trang cuối');

if (fails.length) { console.error(`FAIL check-no-contact-page (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-contact-page: không còn trang Liên hệ, đánh số 01..09, #w-early là trang cuối');
