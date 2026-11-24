// Hồ sơ dạng lý lịch (không câu chào) + bảng dự án / portfolio (task 62qd).
// Chạy: node tests/check-profile-board.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
const count = (s, re) => (s.match(re) || []).length;

// 1. Mục Hồ sơ: không còn câu chào, tiêu đề là tên + chức danh như lý lịch
const prof = sec('profile');
ok(prof, 'thiếu section #profile');
for (const g of ['はじめまして', 'Hello, I am', 'Xin chào', 'tôi là<br','Hi, I']) ok(!prof.includes(g), `#profile còn câu chào "${g}"`);
const h2 = (prof.match(/<h2[\s\S]*?<\/h2>/) || [''])[0];
for (const n of ['タイ チャン ホアン ニャ', 'Thai Tran Hoang Nha', 'Thái Trần Hoàng Nhã']) ok(h2.includes(n), `tiêu đề #profile thiếu tên "${n}"`);
ok(/class="kw-en[^"]*"[\s\S]*?data-l="ja"[\s\S]*?data-l="en"[\s\S]*?data-l="vi"/.test(prof), '#profile thiếu dòng chức danh 3 ngôn ngữ');

// 2. Bảng dự án: section riêng ngay sau #profile, >= 8 thẻ link tới phần chi tiết có thật
const order = [...html.matchAll(/<section[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(order[order.indexOf('profile') + 1] === 'projects', `#projects phải nằm ngay sau #profile, đang: ${order.slice(0, 6).join(',')}`);
const pj = sec('projects');
ok(pj, 'thiếu section #projects');
const cards = [...pj.matchAll(/<a class="pj-c"[^>]*href="#([\w-]+)"[\s\S]*?<\/a>/g)];
ok(cards.length >= 8, `bảng dự án cần >= 8 thẻ, đang ${cards.length}`);
for (const [c, id] of cards) {
  ok(order.includes(id), `thẻ trỏ tới #${id} không tồn tại`);
  const n = ['ja', 'en', 'vi'].map((l) => count(c, new RegExp(`data-l="${l}"`, 'g')));
  ok(n[0] >= 1 && n[0] === n[1] && n[1] === n[2], `thẻ #${id}: khối ja/en/vi lệch ${n.join('/')}`);
}
ok(!/[—]/.test(pj + h2), 'có dấu gạch ngang dài');

// 3. Điều hướng: sidebar + mục lục có #projects; số trang liền mạch, footer khớp tổng
ok(/<a href="#projects" data-sec="projects">/.test(html), 'sidebar thiếu link #projects');
ok(/<nav class="toc[\s\S]*?<a href="#projects">/.test(html), 'mục lục thiếu link #projects');
const pv = html.slice(html.indexOf('<main class="wrap" data-view="profile"'), html.indexOf('<main class="wrap" data-view="sales"'));
const nums = [...pv.matchAll(/<section[^>]*data-num="(\d+)"/g)].map((m) => +m[1]);
ok(nums.every((n, i) => n === i + 1), `data-num không liền mạch: ${nums.join(',')}`);
const total = nums.length;
const fts = [...pv.matchAll(/<p>(\d+) ／ (\d+)<\/p>/g)];
ok(fts.length === total && fts.every((m, i) => +m[1] === i + 1 && +m[2] === total), `footer số trang lệch: ${fts.map((m) => m[1] + '/' + m[2]).join(',')}`);
const sbProf = (html.match(/<nav class="sb-nav" data-for="profile">[\s\S]*?<\/nav>/) || [''])[0];
const sbNums = [...sbProf.matchAll(/data-sec="[\w-]+"><em>(\d+)<\/em>/g)].map((m) => +m[1]);
ok(sbNums.join(',') === nums.join(','), `số sidebar lệch data-num: ${sbNums.join(',')}`);

if (fails.length) { console.error(`FAIL check-profile-board (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-profile-board: #profile không câu chào, tiêu đề tên + chức danh, bảng dự án ${cards.length} thẻ ngay sau hồ sơ, ${total} trang đánh số liền mạch`);
