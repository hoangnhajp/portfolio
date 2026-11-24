// Bỏ hẳn trang "CV (PDF)" nhúng PDF trong portfolio (task 4pxr). Sau task jofj (bỏ trang Liên hệ) còn 01..13; task ye4s bỏ 11~13 nên còn 01..10.
// Link sidebar "Mở CV (PDF)" vẫn giữ. Chạy: node tests/check-no-cv-section.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!/id="cv"/.test(html), 'còn section #cv');
ok(!/href="#cv"/.test(html), 'còn link tới #cv (sidebar / mục lục)');
ok(!/<iframe[^>]+Rirekisho_ThaiTranHoangNha\.pdf/.test(html), 'còn khung nhúng PDF CV');
ok(!/class="cv-(btn|frame|act)/.test(html) && !/\.cv-(btn|frame|act)\b/.test(html), 'còn HTML / CSS của trang CV');
for (const t of ['新しいタブで開く', 'PDFをダウンロード', 'CV của tôi<br />']) ok(!html.includes(t), `còn chữ của trang CV: "${t}"`);
ok(/class="sb-pdf" href="Rirekisho_ThaiTranHoangNha\.pdf"/.test(html), 'mất link sidebar mở CV (PDF), phải giữ');

// Đánh số liên tục 01..10 (task jofj bỏ trang Liên hệ, task ye4s bỏ 11~13): section, footer "NN ／ 10", sidebar và mục lục
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const nums = [...prof.matchAll(/<section[^>]*data-num="(\d+)"/g)].map((m) => m[1]);
const want = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
ok(nums.join(',') === want.join(','), `data-num phải 01..10, đang ${nums.join(',')}`);
const ft = [...prof.matchAll(/<p>(\d+) ／ (\d+)<\/p>/g)];
ok(ft.length === 10 && ft.every(([, a, b], i) => a === want[i] && b === '10'), `footer phải 01..10 ／ 10, đang ${ft.map((m) => m[1] + '/' + m[2]).join(',')}`);
ok(/href="#pcai" data-sec="pcai"><em>10<\/em>/.test(html), 'sidebar: #pcai phải là 10');
ok(/<a href="#pcai"><em>10<\/em>/.test(html), 'mục lục: #pcai phải là 10');
ok(!/<em>1[1-5]<\/em>/.test(prof) && !/／ 1[1-5]</.test(html), 'còn số trang 11..15');

if (fails.length) { console.error(`FAIL check-no-cv-section (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-cv-section: không còn trang CV (PDF), đánh số 01..10, link sidebar PDF vẫn giữ');
