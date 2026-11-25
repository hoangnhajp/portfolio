// Task 04fj: "phân ra các sản phẩm, dịch vụ mà Andpad triển khai tại VN và thông tin hình ảnh về nó".
// Kiểm: tab Andpad Info có trang #ap-vn ngay sau #ap-shots; trang chia 2 phần: SẢN PHẨM có tại Việt Nam (.ap-vp) và
// DỊCH VỤ ANDPAD làm tại Việt Nam (.ap-vs); mỗi mục có ảnh chính thức assets/ap/vn-*.webp (WebP thật, kích thước khai báo khớp
// file, alt, không bọc trong <a> để bấm phóng to), danh sách ảnh trùng tools/ap/fetch-vn.py (tái tạo được từ nguồn chính thức);
// đủ JA / EN / VI, có nguồn; sidebar, ảnh nền pganh, CSS riêng trong <head>, reduced-motion / in tĩnh.
// Chạy: node tests/check-ap-vn.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.includes('ap-vn') && ids.indexOf('ap-vn') === ids.indexOf('ap-shots') + 1, `#ap-vn phải đứng ngay sau #ap-shots: ${ids}`);
const s = (main.match(/<section class="pg"[^>]*id="ap-vn"[\s\S]*?<\/section>/) || [''])[0];
const vi = strip([...s.matchAll(/data-l="vi">([\s\S]*?)<\/(?:span|p|h3|b|em)>/g)].map((m) => m[1]).join(' '));

// 1) Hai phần tách riêng: sản phẩm và dịch vụ
const prods = [...s.matchAll(/<figure class="ap-vp"[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
const svcs = [...s.matchAll(/<figure class="ap-vs"[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
ok(prods.length >= 3, `#ap-vn cần >= 3 sản phẩm có tại Việt Nam (.ap-vp), thấy ${prods.length}`);
ok(svcs.length >= 3, `#ap-vn cần >= 3 dịch vụ tại Việt Nam (.ap-vs), thấy ${svcs.length}`);
ok(/class="ap-vgrp[^"]*"[^>]*data-k="prod"/.test(s) && /class="ap-vgrp[^"]*"[^>]*data-k="svc"/.test(s), '#ap-vn thiếu 2 khối nhóm data-k="prod" và data-k="svc"');
ok(s.indexOf('data-k="prod"') < s.indexOf('data-k="svc"'), 'khối sản phẩm phải đứng trước khối dịch vụ');

// 2) Mỗi mục có ảnh chính thức, có thật, đúng kích thước, phóng to được
const keys = [];
for (const f of [...prods, ...svcs]) {
  const img = (f.match(/<img\b[^>]*>/) || [''])[0];
  const k = (img.match(/src="assets\/ap\/(vn-[\w-]+)\.webp"/) || [])[1];
  ok(k, `mục thiếu ảnh assets/ap/vn-*.webp: ${strip(f).slice(0, 60)}`);
  if (!k) continue;
  keys.push(k);
  const file = p(`assets/ap/${k}.webp`);
  if (!existsSync(file)) { fails.push(`thiếu file assets/ap/${k}.webp`); continue; }
  const b = readFileSync(file);
  ok(b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', `${k}.webp không phải WebP`);
  ok(b.length < 140 * 1024, `${k}.webp nặng quá 140KB`);
  const fmt = b.toString('ascii', 12, 16);
  let w = 0, h = 0;
  if (fmt === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
  else if (fmt === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
  else if (fmt === 'VP8L') { const v = b.readUInt32LE(21); w = (v & 0x3fff) + 1; h = ((v >> 14) & 0x3fff) + 1; }
  ok(new RegExp(`width="${w}" height="${h}"`).test(img), `${k}: width/height khai báo khác file thật ${w}x${h}`);
  ok(/\balt="[^"]{8,}"/.test(img), `${k}: thiếu alt mô tả`);
  ok(/loading="lazy"/.test(img), `${k}: thiếu loading="lazy"`);
  ok(!/<a\b[^>]*>[^]*?<img/.test(f.split('<figcaption')[0]), `${k}: ảnh bị bọc trong <a> (không phóng to được)`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`data-l="${l}">[^<]+<`).test(f), `${k}: chú thích thiếu ${l}`);
  ok(/<a href="https:\/\/[^"]+" target="_blank" rel="noopener">/.test(f), `${k}: thiếu link nguồn ảnh / trang gốc`);
}
ok(new Set(keys).size === keys.length, `ảnh bị lặp: ${keys}`);
const py = existsSync(p('tools/ap/fetch-vn.py')) ? readFileSync(p('tools/ap/fetch-vn.py'), 'utf8') : '';
ok(py, 'thiếu tools/ap/fetch-vn.py (script tải ảnh chính thức)');
const pyKeys = [...py.matchAll(/'(vn-[\w-]+)':\s*'https:\/\//g)].map((m) => m[1]);
ok(pyKeys.sort().join(',') === [...keys].sort().join(','), `fetch-vn.py và trang lệch nhau: ${pyKeys} / ${keys}`);

// 3) Nội dung VI: đúng các ý của ANDPAD tại Việt Nam
for (const k of ['tiếng Việt', 'Quản lý thi công', 'Chat', 'Bản vẽ', 'TP.HCM', 'Hà Nội', 'JETRO', 'Customer Success'])
  ok(vi.includes(k), `#ap-vn (vi) thiếu "${k}"`);

// 4) Tiêu đề, câu dẫn 3 ngôn ngữ, cân bộ, nguồn, không gạch dài
ok(/<h2 class="kw\b[^"]*\brv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), '#ap-vn thiếu h2 3 ngôn ngữ');
for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub\\b[^"]*\\brv"[^>]*data-l="${l}"`).test(s), `#ap-vn thiếu câu dẫn ${l}`);
const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
ok(c[0] > 10 && c[0] === c[1] && c[1] === c[2], `#ap-vn số khối ja/en/vi lệch hoặc quá ít: ${c}`);
ok(/class="ap-src\b/.test(s), '#ap-vn thiếu dòng nguồn');
ok((s.match(/<a\b[^>]*href="https?:/g) || []).length >= 6, '#ap-vn cần >= 6 link nguồn / trang gốc');
for (const a of s.match(/<a\b[^>]*href="https?:[^>]*>/g) || []) ok(/target="_blank"/.test(a) && /rel="noopener"/.test(a), `link ngoài thiếu target/rel: ${a.slice(0, 80)}`);
ok(!s.includes('—'), 'có dấu gạch ngang dài');

// 5) Sidebar, ảnh nền pganh, CSS riêng
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#ap-shots"[^<]*(?:<(?!\/a>)[^<]*)*<\/a>\s*<a href="#ap-vn" data-sec="ap-vn"><em>VN<\/em>/.test(sb), 'sidebar ap thiếu mục VN #ap-vn ngay sau #ap-shots');
ok(/var IDS=\[[^\]]*'ap-shots','ap-vn'/.test(html), "pganh IDS thiếu 'ap-vn' sau 'ap-shots'");
ok(existsSync(p('assets/pg/ap-vn.webp')), 'thiếu ảnh nền assets/pg/ap-vn.webp');
const css = (html.match(/<!-- ap-vn-css:start -->([\s\S]*?)<!-- ap-vn-css:end -->/) || [])[1] || '';
ok(css, 'thiếu khối <!-- ap-vn-css:start/end -->');
ok(html.indexOf('<!-- ap-vn-css:end -->') < html.indexOf('</head>'), 'ap-vn-css phải nằm trong <head>');
for (const kf of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
  const props = [...kf[2].matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  ok(props.every((x) => x === 'transform' || x === 'opacity'), `@keyframes ${kf[1]} animate ngoài transform/opacity`);
}
ok(/prefers-reduced-motion:reduce\)\{[^}]*animation:none/.test(css), 'thiếu nhánh reduced-motion');
ok(/@media print\{[^}]*animation:none/.test(css), 'bản in phải tắt animation');

if (fails.length) { console.error('FAIL check-ap-vn:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-vn: #ap-vn ${prods.length} sản phẩm + ${svcs.length} dịch vụ tại Việt Nam, ${keys.length} ảnh chính thức, JA/EN/VI`);
