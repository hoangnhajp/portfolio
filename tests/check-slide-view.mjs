// Task 93oy: trang có 2 chế độ xem. "PDF view" = cách trình bày hiện tại (các tờ xếp dọc, cuộn).
// "Slide view" = cố định một tờ giữa màn hình, mỗi cú bấm hiện khối / hiệu ứng tiếp theo, hết khối thì sang section kế.
// Kiểm tĩnh khối CSS/JS riêng có marker (không đụng khối của task khác).
// Chạy: node tests/check-slide-view.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const count = (s) => html.split(s).length - 1;

for (const m of ['<!-- sv-css:start -->', '<!-- sv-css:end -->', '<!-- sv:start -->', '<!-- sv:end -->'])
  ok(count(m) === 1, `marker ${m} phải có đúng 1 lần (đang ${count(m)})`);
const css = (html.match(/<!-- sv-css:start -->([\s\S]*?)<!-- sv-css:end -->/) || [])[1] || '';
const js = (html.match(/<!-- sv:start -->([\s\S]*?)<!-- sv:end -->/) || [])[1] || '';
ok(css.length > 0, 'thiếu khối CSS sv');
ok(js.length > 0, 'thiếu khối JS sv');

// Hai chế độ, đúng tên người dùng đặt
ok(/PDF view/.test(js), 'nút chuyển chế độ phải có nhãn "PDF view"');
ok(/Slide view/.test(js), 'nút chuyển chế độ phải có nhãn "Slide view"');
ok(/localStorage/.test(js), 'chế độ đã chọn phải được nhớ (localStorage)');
ok(/aria-pressed/.test(js), 'nút chuyển chế độ phải báo trạng thái (aria-pressed)');

// Slide view: bấm chuột / phím để hiện bước kế
ok(/addEventListener\('click'/.test(js), 'Slide view phải bắt cú bấm chuột để sang bước kế');
ok(/ArrowRight/.test(js) && /ArrowLeft/.test(js), 'Slide view phải có phím ← / →');
ok(/addEventListener\('keydown',[\s\S]*?,true\)/.test(js), 'phím của Slide view phải bắt ở pha capture để thắng phím cuộn của PDF view');
ok(/prefers-reduced-motion/.test(js), 'Slide view phải tôn trọng reduced-motion');
ok(/window\.slideView\s*=/.test(js), 'thiếu window.slideView để test đo');

// CSS: chỉ màn hình (bản in giữ nguyên), không dùng animation trên thuộc tính gây layout
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<\/?style[^>]*>/g, '').trim();
ok(/^@media screen\b/.test(stripped), 'khối CSS sv phải nằm trong @media screen (bản in giữ nguyên)');
ok(!/@media print\b[^{]*\{[^}]*html\.sv/.test(css), 'không được bật Slide view khi in');
ok(/\.sv-step:not\(\.sv-in\)\{visibility:hidden\}/.test(css), 'khối chưa tới lượt phải visibility:hidden (không bấm / Tab trúng link, nút ẩn)');
ok(/scrollIntoView\(\{block:'nearest'/.test(js), 'tờ cao phải cuộn (sv-scroll) thì cuộn tới khối vừa hiện');
ok(/html\.sv\b/.test(css),'CSS Slide view phải gắn theo lớp html.sv (PDF view không đổi)');
const kfs = [...css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?\})\s*\}/g)].map((m) => m[1]);
ok(kfs.length >= 1, 'Slide view cần ít nhất 1 keyframes cho hiệu ứng vào');
for (const k of kfs) {
  const props = [...k.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  ok(props.every((p) => ['opacity', 'transform', 'translate', 'scale', 'filter'].includes(p)), `keyframes chỉ được animate transform/opacity (gặp ${props.join(',')})`);
}

if (fails.length) { console.error(`FAIL check-slide-view (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-slide-view: có khối sv riêng, 2 chế độ PDF view / Slide view nhớ lựa chọn, bấm chuột hoặc phím để hiện bước kế, CSS chỉ màn hình, hiệu ứng chỉ transform/opacity');
