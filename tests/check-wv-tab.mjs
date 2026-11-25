// Task wxw5: tab menu "Work Philosophy" (Quan điểm công việc), đứng ngay trước JD ANDPAD, 3 trang riêng:
// #wv-kaizen (phân tích vấn đề và kaizen: vòng 6 bước + 5 Why + 3 nguyên tắc), #wv-data (nhận định bằng số liệu,
// không cảm tính: so cảm tính / số liệu, biểu đồ trước sau, 4 bước dữ liệu), #wv-people (con người thời AI:
// trách nhiệm, tạo quan hệ, giữ quan hệ; 4 bước giải quyết vấn đề giữa người với người).
// Mỗi trang có ảnh nền riêng (assets/pg/wv-*.webp, ChatGPT worker), icon 3D assets/gx, chuyển động chỉ transform/opacity,
// tắt khi reduced-motion và bản in. Đủ JA / EN / VI.
// Chạy: node tests/check-wv-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const IDS3 = ['wv-kaizen', 'wv-data', 'wv-people'];

// 1) Menu trên: "Work Philosophy" ngay trước JD ANDPAD, thứ tự menu khớp thứ tự main
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#wv-kaizen" data-view="wv">Work Philosophy<\/a>/.test(topNav), 'top-nav thiếu <a href="#wv-kaizen" data-view="wv">Work Philosophy</a>');
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
ok(order.indexOf('wv') >= 0 && order[order.indexOf('wv') + 1] === 'jd', `tab wv phải đứng ngay trước jd: ${order}`);
ok(order.join(',') === views.join(','), `menu trên và main lệch nhau: ${order} / ${views}`);

// 2) Main + đúng 3 trang
const main = (html.match(/<main class="wrap" data-view="wv" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="wv" hidden>');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === IDS3.join(','), `section tab wv: ${ids.join(',')}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];

// 3) Sidebar đủ 3 mục, 3 ngôn ngữ
const sb = (html.match(/<nav class="sb-nav" data-for="wv" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="wv" hidden>');
const sbIds = [...sb.matchAll(/href="#([\w-]+)" data-sec="([\w-]+)"/g)].filter((m) => m[1] === m[2]).map((m) => m[1]).join(',');
ok(sbIds === IDS3.join(','), `sidebar wv trỏ: ${sbIds}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 3, `sidebar wv thiếu nhãn ${l}`);

// 4) Ảnh nền riêng mỗi trang (pganh IDS + file có thật)
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of IDS3) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(p(`assets/pg/${id}.webp`)), `thiếu assets/pg/${id}.webp`);
}

// 5) Mỗi trang: tiêu đề + câu dẫn + hàng chip đủ 3 ngôn ngữ; nội dung đúng ý người dùng
for (const id of IDS3) {
  const s = sec(id);
  ok(/<h2 class="kw rv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), `#${id} thiếu h2 3 ngôn ngữ`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub rv"[^>]*data-l="${l}"`).test(s), `#${id} thiếu câu dẫn ${l}`);
  ok(/<div class="kw1 rv"/.test(s), `#${id} thiếu hàng keyword .kw1`);
  const icons = [...s.matchAll(/<img src="(assets\/gx\/[\w-]+\.webp)"/g)].map((m) => m[1]);
  ok(icons.length >= 6, `#${id} cần >= 6 icon 3D assets/gx, thấy ${icons.length}`);
  for (const f of icons) ok(existsSync(p(f)), `thiếu ${f}`);
  for (const tag of s.match(/<img\b[^>]*>/g) || []) ok(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag), `ảnh thiếu width/height: ${tag.slice(0, 70)}`);
  // mọi khối data-l đi đủ bộ ja/en/vi
  const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] === c[1] && c[1] === c[2], `#${id} số khối ja/en/vi lệch: ${c.join('/')}`);
}
const vi = (id) => strip([...sec(id).matchAll(/<(\w+)\b[^>]*data-l="vi"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]).join(' '));
const K = vi('wv-kaizen'), D = vi('wv-data'), P = vi('wv-people');
for (const k of ['nguyên nhân gốc', 'kaizen', '5 Why', 'chuẩn hoá', 'đo']) ok(K.toLowerCase().includes(k.toLowerCase()), `#wv-kaizen (vi) thiếu ý "${k}"`);
for (const k of ['số liệu', 'cảm tính', 'trước và sau']) ok(D.includes(k), `#wv-data (vi) thiếu ý "${k}"`);
for (const k of ['trách nhiệm', 'tạo quan hệ', 'giữ quan hệ', 'giữa người với người', 'AI']) ok(P.includes(k), `#wv-people (vi) thiếu ý "${k}"`);
ok((sec('wv-kaizen').match(/class="wv-st"/g) || []).length === 6, '#wv-kaizen cần vòng kaizen 6 bước .wv-st');
ok((sec('wv-kaizen').match(/<li[^>]*class="[^"]*wv-w\b/g) || []).length === 6, '#wv-kaizen cần thang 5 Why (5 tầng + nguyên nhân gốc)');
ok(/class="card wv-ng/.test(sec('wv-data')) && /class="card wv-ok/.test(sec('wv-data')), '#wv-data cần cặp thẻ cảm tính / số liệu');
ok((sec('wv-data').match(/<i\b[^>]*style="--h:/g) || []).length >= 8, '#wv-data cần biểu đồ cột trước / sau (>= 8 cột)');
ok(/class="wv-ring"/.test(sec('wv-people')) && (sec('wv-people').match(/class="card wv-v"/g) || []).length === 3, '#wv-people cần vòng AI + 3 thẻ giá trị');
ok((sec('wv-people').match(/class="wv-st"/g) || []).length === 4, '#wv-people cần 4 bước giải quyết vấn đề giữa người với người');
// không bịa số liệu: trang không chứa số phần trăm / số tiền tự đặt
ok(!/\d+\s?%|\d+[,.]\d+\s?(đ|VND|USD)/.test(strip(main)), 'tab wv không được ghi số liệu tự đặt (%, tiền)');
ok(!main.includes('—'), 'có dấu gạch ngang dài');

// 6) CSS: khối riêng, chỉ animate transform / opacity, reduced-motion + in tĩnh
const css = (html.match(/<!-- wv-css:start -->([\s\S]*?)<!-- wv-css:end -->/) || [])[1] || '';
ok(css, 'thiếu khối <!-- wv-css:start/end -->');
ok(html.indexOf('<!-- wv-css:end -->') < html.indexOf('</head>'), 'wv-css phải nằm trong <head>');
for (const kf of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
  const props = [...kf[2].matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  ok(props.every((x) => x === 'transform' || x === 'opacity'), `@keyframes ${kf[1]} animate ngoài transform/opacity: ${props}`);
}
ok(/html\.sr [^{]*\.sr-in/.test(css), 'chuyển động phải chờ khối hiện (.sr-in)');
// .sr-in chỉ được gắn cho phần tử .rv (khối sr): mọi lớp đứng trước .sr-in trong wv-css phải là phần tử mang rv trong tab wv
for (const c of new Set([...css.matchAll(/\.([\w-]+)\.sr-in/g)].map((m) => m[1])))
  ok(new RegExp(`class="[^"]*\\b${c}\\b[^"]*\\brv\\b`).test(main), `selector .${c}.sr-in không bao giờ khớp: .${c} không mang lớp rv`);
ok(/prefers-reduced-motion:reduce\)\{[^}]*animation:none/.test(css), 'thiếu nhánh reduced-motion tắt animation');
ok(/@media print\{[^}]*animation:none/.test(css), 'bản in phải tắt animation');

if (fails.length) { console.error('FAIL check-wv-tab:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-wv-tab: tab Work Philosophy 3 trang (' + IDS3.join(', ') + '), ảnh nền, icon, JA/EN/VI, chuyển động an toàn');
