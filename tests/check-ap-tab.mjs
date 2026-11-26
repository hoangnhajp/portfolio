// Task m07v: tab menu "Andpad Info" (thông tin công ty ANDPAD), đứng ngay sau JD ANDPAD, 4 trang riêng:
// #ap-top (tổng quan công ty + ANDPAD Vietnam), #ap-products (bản đồ sản phẩm theo nhóm), #ap-news (hoạt động, event,
// mốc thời gian, AI). Task orn3: đã bỏ trang #ap-role (04 FORECAST), xem tests/check-ap-no-role.mjs.
// Số liệu lấy từ nguồn công khai (andpad.co.jp, andpad.jp, PR Times, báo), mỗi trang ghi nguồn + ngày tra cứu; phần dự báo ghi rõ là dự báo.
// Mỗi trang có ảnh nền riêng (assets/pg/ap-*.webp, ChatGPT worker), icon 3D assets/gx, chuyển động chỉ transform/opacity,
// tắt khi reduced-motion và bản in. Đủ JA / EN / VI.
// Chạy: node tests/check-ap-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const IDS4 = ['ap-top', 'ap-products', 'ap-news'];
// task ls8q: thêm trang #ap-shots (ảnh sản phẩm) sau #ap-products; nội dung trang đó do tests/check-ap-shots.mjs kiểm
const GUIDE = ['ap-guide', 'ap-guide-site', 'ap-guide-docs', 'ap-guide-money']; // slide hướng dẫn chức năng: nội dung do tests/check-ap-guide.mjs kiểm
const ALL = ['ap-top', 'ap-products', 'ap-shots', 'ap-vn', ...GUIDE, 'ap-news', 'ap-market', 'ap-compete', 'ap-vs-scale', 'ap-vs-map', 'ap-vs-win', 'ap-app', 'ap-scope']; // #ap-app, #ap-scope do tests/check-ap-app.mjs kiểm; task m07v bổ sung: #ap-market do tests/check-ap-market.mjs kiểm nội dung; task 04fj: #ap-vn do tests/check-ap-vn.mjs kiểm

// 1) Menu trên: "Andpad Info" ngay sau JD ANDPAD, thứ tự menu khớp thứ tự main
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#ap-top" data-view="ap">Andpad Info<\/a>/.test(topNav), 'top-nav thiếu <a href="#ap-top" data-view="ap">Andpad Info</a>');
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
ok(order.indexOf('ap') > 0 && order[order.indexOf('ap') - 1] === 'jd', `tab ap phải đứng ngay sau jd: ${order}`);
ok(order.join(',') === views.join(','), `menu trên và main lệch nhau: ${order} / ${views}`);

// 2) Main + đúng 4 trang, nằm ngoài khối sinh tự động jd:start/end
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="ap" hidden>');
const jdBlock = (html.match(/<!-- jd:start -->[\s\S]*?<!-- jd:end -->/) || [''])[0];
ok(!jdBlock.includes('data-view="ap"'), 'tab ap không được nằm trong khối jd:start/end (build.mjs sẽ ghi đè)');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === ALL.join(','), `section tab ap: ${ids.join(',')}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];

// 3) Sidebar đủ 4 mục, 3 ngôn ngữ
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="ap" hidden>');
const sbIds = [...sb.matchAll(/href="#([\w-]+)" data-sec="([\w-]+)"/g)].filter((m) => m[1] === m[2]).map((m) => m[1]).join(',');
ok(sbIds === ALL.join(','), `sidebar ap trỏ: ${sbIds}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === ALL.length, `sidebar ap thiếu nhãn ${l}`);

// 4) Ảnh nền riêng mỗi trang (pganh IDS + file có thật)
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of ALL) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(p(`assets/pg/${id}.webp`)), `thiếu assets/pg/${id}.webp`);
}

// 5) Mỗi trang: tiêu đề + câu dẫn đủ 3 ngôn ngữ, icon 3D, khối data-l đủ bộ, có dòng nguồn
for (const id of IDS4) {
  const s = sec(id);
  ok(/<h2 class="kw\b[^"]*\brv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), `#${id} thiếu h2 3 ngôn ngữ`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub\\b[^"]*\\brv"[^>]*data-l="${l}"`).test(s), `#${id} thiếu câu dẫn ${l}`);
  const icons = [...s.matchAll(/<img src="(assets\/gx\/[\w-]+\.webp)"/g)].map((m) => m[1]);
  ok(icons.length >= 4, `#${id} cần >= 4 icon 3D assets/gx, thấy ${icons.length}`);
  for (const f of icons) ok(existsSync(p(f)), `thiếu ${f}`);
  for (const tag of s.match(/<img\b[^>]*>/g) || []) ok(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag), `ảnh thiếu width/height: ${tag.slice(0, 70)}`);
  const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] === c[1] && c[1] === c[2], `#${id} số khối ja/en/vi lệch: ${c.join('/')}`);
  ok(/class="ap-src\b/.test(s), `#${id} thiếu dòng nguồn .ap-src`);
}
// Link ngoài mở tab mới an toàn
for (const a of main.match(/<a\b[^>]*href="https?:[^>]*>/g) || []) ok(/target="_blank"/.test(a) && /rel="noopener"/.test(a), `link ngoài thiếu target/rel: ${a.slice(0, 80)}`);
ok((main.match(/href="https:\/\/(andpad\.co\.jp|andpad\.jp|prtimes\.jp|careers\.andpad\.vn)/g) || []).length >= 4, 'cần dẫn nguồn chính thức (andpad.co.jp / andpad.jp / prtimes.jp / careers.andpad.vn)');

const vi = (id) => strip([...sec(id).matchAll(/<(\w+)\b[^>]*data-l="vi"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]).join(' '));
const T = vi('ap-top'), P = vi('ap-products'), N = vi('ap-news');
// Tổng quan: thông tin công ty đã tra cứu
for (const k of ['2012', '1,072', 'ANDPAD Vietnam', 'Hà Nội', 'TP.HCM']) ok((T + strip(sec('ap-top'))).includes(k), `#ap-top thiếu "${k}"`);
// Sản phẩm: đủ nhóm và các sản phẩm lõi
const prodCards = (sec('ap-products').match(/class="ap-pd"/g) || []).length;
ok(prodCards >= 16, `#ap-products cần >= 16 thẻ sản phẩm .ap-pd, thấy ${prodCards}`);
ok((sec('ap-products').match(/class="ap-grp/g) || []).length >= 4, '#ap-products cần >= 4 nhóm sản phẩm .ap-grp');
for (const k of ['施工管理', '図面', '黒板', '検査', '受発注', '引合粗利管理', 'おうちノート', '入退場管理', 'Analytics', 'API']) ok(sec('ap-products').includes(k), `#ap-products thiếu sản phẩm "${k}"`);
// Hoạt động, event: mốc thời gian + event + AI + Việt Nam
ok((sec('ap-news').match(/class="ap-ev"/g) || []).length >= 8, '#ap-news cần >= 8 mốc .ap-ev');
for (const k of ['ANDPAD AWARD', 'JETRO', 'AI', 'tiếng Việt', 'Series D']) ok((N + strip(sec('ap-news'))).includes(k), `#ap-news thiếu "${k}"`);
ok(!main.includes('—'), 'có dấu gạch ngang dài');

// 6) CSS: khối riêng, chỉ animate transform / opacity, reduced-motion + in tĩnh
const css = (html.match(/<!-- ap-css:start -->([\s\S]*?)<!-- ap-css:end -->/) || [])[1] || '';
ok(css, 'thiếu khối <!-- ap-css:start/end -->');
ok(html.indexOf('<!-- ap-css:end -->') < html.indexOf('</head>'), 'ap-css phải nằm trong <head>');
for (const kf of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
  const props = [...kf[2].matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  ok(props.every((x) => x === 'transform' || x === 'opacity'), `@keyframes ${kf[1]} animate ngoài transform/opacity: ${props}`);
}
ok(/html\.sr [^{]*\.sr-in/.test(css), 'chuyển động phải chờ khối hiện (.sr-in)');
for (const c of new Set([...css.matchAll(/\.([\w-]+)\.sr-in/g)].map((m) => m[1])))
  ok(new RegExp(`class="[^"]*\\b${c}\\b[^"]*\\brv\\b`).test(main), `selector .${c}.sr-in không bao giờ khớp: .${c} không mang lớp rv`);
ok(/prefers-reduced-motion:reduce\)\{[^}]*animation:none/.test(css), 'thiếu nhánh reduced-motion tắt animation');
ok(/@media print\{[^}]*animation:none/.test(css), 'bản in phải tắt animation');

if (fails.length) { console.error('FAIL check-ap-tab:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-tab: tab Andpad Info 4 trang (' + IDS4.join(', ') + '), nguồn, ảnh nền, icon, JA/EN/VI, chuyển động an toàn');
