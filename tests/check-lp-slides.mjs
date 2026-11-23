// Task m9qu: trình bày từng section thành một trang slide như Landing Page GPR FLEXEYE
// (D:\Gprflexeye Homepages\Landing Page: trang giấy trắng bo góc, bóng đổ, thanh chương mép trái,
// số trang, xếp dọc trên nền tím nhạt). Kiểm tĩnh khối CSS/JS riêng có marker.
// Chạy: node tests/check-lp-slides.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const count = (s) => html.split(s).length - 1;

for (const m of ['<!-- lp-slide-css:start -->', '<!-- lp-slide-css:end -->', '<!-- lp-slide:start -->', '<!-- lp-slide:end -->'])
  ok(count(m) === 1, `marker ${m} phải có đúng 1 lần (đang ${count(m)})`);

const css = (html.match(/<!-- lp-slide-css:start -->([\s\S]*?)<!-- lp-slide-css:end -->/) || [])[1] || '';
const js = (html.match(/<!-- lp-slide:start -->([\s\S]*?)<!-- lp-slide:end -->/) || [])[1] || '';
ok(css.length > 0, 'thiếu khối CSS lp-slide');
ok(js.length > 0, 'thiếu khối JS lp-slide');

// CSS chỉ áp cho màn hình: bản in A4 giữ nguyên
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<\/?style[^>]*>/g, '').trim();
ok(/^@media screen\b/.test(stripped), 'khối CSS phải nằm trọn trong @media screen (không đụng bản in)');
ok(!/@media print/.test(css), 'khối CSS không được có @media print');
ok(/\.wrap>\.pg\{[^}]*border-radius:\s*\d+px/.test(css), 'slide phải bo góc như trang Landing Page');
ok(/\.wrap>\.pg\{[^}]*box-shadow:/.test(css), 'slide phải có bóng đổ như trang Landing Page');
ok(/main\.wrap\{[^}]*gap:\s*\d+px/.test(css), 'các slide phải cách nhau (gap) như Landing Page');
ok(/#cfc9e3/.test(css), 'nền sau slide phải là tím nhạt của Landing Page (#cfc9e3)');
ok(/\[data-slide\]::after\{[^}]*content:\s*attr\(data-slide\)/.test(css), 'thiếu chip số slide (content:attr(data-slide))');
ok(/prefers-reduced-motion/.test(js), 'chuyển slide bằng phím phải tôn trọng reduced-motion');

// JS: đánh số theo từng tab, phím ←/→ nhảy slide, không cướp phím khi đang ở ô nhập / khối có điều khiển riêng
ok(/data-slide/.test(js) && /' \/ '/.test(js), 'JS phải gán data-slide dạng "NN / tổng"');
ok(/ArrowRight/.test(js) && /ArrowLeft/.test(js), 'JS phải xử lý phím ArrowRight / ArrowLeft');
ok(/defaultPrevented/.test(js), 'JS phải nhường phím nếu khối khác (deck) đã xử lý');
ok(/closest\('input,textarea,select,\[contenteditable\],video,audio,\[data-deck\]'\)/.test(js), 'JS phải nhường phím khi đang ở ô nhập / video / deck');
ok(/\[data-slide\]::after\{[^}]*pointer-events:\s*none/.test(css), 'chip số slide không được chặn click');
ok(!/innerHTML/.test(js), 'JS không được ghi innerHTML');

if (fails.length) { console.error(`FAIL check-lp-slides (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lp-slides: khối CSS slide kiểu Landing Page (chỉ màn hình, bo góc, bóng, nền tím, chip số slide) + JS đánh số theo tab và phím ←/→');
