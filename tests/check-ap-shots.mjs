// Task ls8q: người dùng muốn ảnh minh hoạ ĐÚNG sản phẩm ANDPAD được tải về và đặt trong tab Andpad Info.
// Kiểm: trang #ap-shots ngay sau #ap-products; >= 20 ảnh sản phẩm assets/ap/<key>.webp (WebP thật, có thật, kích thước
// khai báo khớp file), mỗi ảnh khớp đúng 1 link trang sản phẩm chính thức andpad.jp/products/<key>, ảnh không bọc trong <a>
// (bấm phóng to được), danh sách ảnh trùng với tools/ap/fetch-shots.py; sidebar + ảnh nền pganh; 3 ngôn ngữ; CSS riêng.
// Chạy: node tests/check-ap-shots.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.indexOf('ap-shots') === ids.indexOf('ap-products') + 1 && ids.includes('ap-shots'), `#ap-shots phải đứng ngay sau #ap-products: ${ids}`);
const s = (main.match(/<section class="pg"[^>]*id="ap-shots"[\s\S]*?<\/section>/) || [''])[0];

// 1) Ảnh sản phẩm: đủ, có thật, WebP, đúng kích thước, đúng link sản phẩm
const figs = [...s.matchAll(/<figure class="ap-sh"[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
ok(figs.length >= 20, `#ap-shots cần >= 20 ảnh sản phẩm, thấy ${figs.length}`);
const keys = [];
for (const f of figs) {
  const img = (f.match(/<img\b[^>]*>/) || [''])[0];
  const k = (img.match(/src="assets\/ap\/([\w-]+)\.webp"/) || [])[1];
  ok(k, `ảnh không nằm trong assets/ap: ${img.slice(0, 80)}`);
  if (!k) continue;
  keys.push(k);
  const file = p(`assets/ap/${k}.webp`);
  if (!existsSync(file)) { fails.push(`thiếu file assets/ap/${k}.webp`); continue; }
  const b = readFileSync(file);
  ok(b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', `${k}.webp không phải WebP`);
  ok(b.length < 120 * 1024, `${k}.webp nặng quá 120KB`);
  const fmt = b.toString('ascii', 12, 16);
  let w = 0, h = 0;
  if (fmt === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
  else if (fmt === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
  else if (fmt === 'VP8L') { const v = b.readUInt32LE(21); w = (v & 0x3fff) + 1; h = ((v >> 14) & 0x3fff) + 1; }
  ok(new RegExp(`width="${w}" height="${h}"`).test(img), `${k}: width/height khai báo khác file thật ${w}x${h}`);
  ok(/\balt="ANDPAD [^"]{2,}"/.test(img), `${k}: thiếu alt tên sản phẩm`);
  ok(/loading="lazy"/.test(img), `${k}: thiếu loading="lazy"`);
  const want = k === 'app_market' ? 'https://appmarket.andpad.jp/' : `https://andpad.jp/products/${k}`;
  ok(f.includes(`<a href="${want}" target="_blank" rel="noopener">ANDPAD `), `${k}: chú thích thiếu link đúng trang sản phẩm ${want}`);
  ok(!/<a\b[^>]*>[^]*?<img/.test(f.split('<figcaption>')[0]), `${k}: ảnh bị bọc trong <a> (không phóng to được)`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<span data-l="${l}">[^<]+</span>`).test(f), `${k}: chú thích thiếu ${l}`);
}
ok(new Set(keys).size === keys.length, 'có ảnh sản phẩm bị lặp');
for (const k of ['construction_management', 'chat', 'drawings', 'blackboard', 'inspection', 'edi', 'erp', 'ouchi_note', 'analytics', 'api'])
  ok(keys.includes(k), `#ap-shots thiếu ảnh sản phẩm lõi "${k}"`);

// 2) Danh sách ảnh khớp script tải (ảnh nào trên trang cũng tái tạo được từ nguồn chính thức)
const py = readFileSync(p('tools/ap/fetch-shots.py'), 'utf8');
const pyKeys = [...py.matchAll(/'([\w-]+)':\s*(?:U|THEME)\s*\+/g)].map((m) => m[1]);
ok(pyKeys.sort().join(',') === [...keys].sort().join(','), `fetch-shots.py và trang lệch nhau: ${pyKeys} / ${keys}`);
ok(/https:\/\/andpad\.jp\/wp-content\/uploads\//.test(py), 'fetch-shots.py phải tải từ andpad.jp');

// 3) Tiêu đề, câu dẫn 3 ngôn ngữ, nguồn, không gạch dài
ok(/<h2 class="kw\b[^"]*\brv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), '#ap-shots thiếu h2 3 ngôn ngữ');
for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub\\b[^"]*\\brv"[^>]*data-l="${l}"`).test(s), `#ap-shots thiếu câu dẫn ${l}`);
const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
ok(c[0] === c[1] && c[1] === c[2], `#ap-shots số khối ja/en/vi lệch: ${c}`);
ok(/class="ap-src\b[\s\S]*href="https:\/\/andpad\.jp\/products"/.test(s), '#ap-shots thiếu dòng nguồn andpad.jp/products');
ok(!s.includes('—'), 'có dấu gạch ngang dài');

// 4) Sidebar, ảnh nền pganh, CSS riêng
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#ap-products"[^]*?<\/a>\s*<a href="#ap-shots" data-sec="ap-shots">/.test(sb), 'sidebar ap thiếu mục #ap-shots ngay sau #ap-products');
ok(/var IDS=\[[^\]]*'ap-products','ap-shots'/.test(html), "pganh IDS thiếu 'ap-shots' sau 'ap-products'");
ok(existsSync(p('assets/pg/ap-shots.webp')), 'thiếu ảnh nền assets/pg/ap-shots.webp');
const css = (html.match(/<!-- ap-shots-css:start -->([\s\S]*?)<!-- ap-shots-css:end -->/) || [])[1] || '';
ok(/\.ap-shs\{[^}]*grid-template-columns:repeat\(5,1fr\)/.test(css), 'thiếu CSS lưới .ap-shs 5 cột');
ok(html.indexOf('<!-- ap-shots-css:end -->') < html.indexOf('</head>'), 'ap-shots-css phải nằm trong <head>');
ok(/prefers-reduced-motion:reduce\)\{[^}]*\.ap-sh[^}]*animation:none/.test(css), 'thiếu nhánh reduced-motion cho .ap-sh');

if (fails.length) { console.error('FAIL check-ap-shots:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-shots: #ap-shots ${figs.length} ảnh sản phẩm chính thức andpad.jp, link đúng trang, phóng to được, JA/EN/VI`);
