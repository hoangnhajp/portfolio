// 3 slide hình tóm gọn đối thủ ANDPAD (#ap-vs-scale, #ap-vs-map, #ap-vs-win), ngay sau #ap-compete:
// chủ yếu chart / hình, ít chữ, mỗi slide 1 câu kết; số liệu khớp dữ liệu đã dẫn nguồn ở #ap-compete (tools/ap/market.mjs).
// Chạy: node tests/check-ap-vs.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (f) => fileURLToPath(new URL(`../${f}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const main = (html.match(/<!-- ap:start -->([\s\S]*?)<!-- ap:end -->/) || [])[1] || '';
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
const strip = (s) => s.replace(/<sup class="ap-c">[^<]*<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const vi = (s) => strip([...s.matchAll(/<(\w+)\b[^>]*data-l="vi"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]).join(' '));
const PAGES = ['ap-vs-scale', 'ap-vs-map', 'ap-vs-win'];

// 1) Thứ tự: ngay sau #ap-compete, trước #ap-app
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
const at = ids.indexOf('ap-compete');
ok(at >= 0 && ids.slice(at + 1, at + 4).join(',') === PAGES.join(','), `3 slide phải ngay sau #ap-compete, đang: ${ids.slice(at, at + 5).join(',')}`);

for (const id of PAGES) {
  const s = sec(id);
  ok(s, `thiếu #${id}`);
  if (!s) continue;
  // 2) Có hình: chart (div / svg .ap-vs-chart) có aria-label + tooltip trên từng mark, icon 3D
  ok(/<(div|svg) class="ap-vs-chart[^"]*"[^>]*role="img"[^>]*aria-label="[^"]+"/.test(s), `#${id} cần chart .ap-vs-chart role="img" aria-label`);
  ok((s.match(/<title>[^<]+<\/title>|\btitle="[^"]+"/g) || []).length >= 3, `#${id} chart cần tooltip (title) trên từng mark`);
  ok((s.match(/<img src="assets\/gx\/[\w-]+\.webp"/g) || []).length >= 1, `#${id} cần icon 3D assets/gx`);
  // 3) Ít chữ: phần chữ VI ngoài mục nguồn <= 120 từ; đúng 1 câu kết 3 ngôn ngữ
  const body = s.replace(/<div class="ap-src ap-refs[\s\S]*$/, '');
  const words = vi(body).split(' ').filter(Boolean).length;
  ok(words <= 120, `#${id} quá nhiều chữ: ${words} từ VI (tối đa 120)`);
  ok((s.match(/<p class="ap-vs-end[^"]*"/g) || []).length === 1, `#${id} cần đúng 1 câu kết p.ap-vs-end`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="ap-vs-end[^"]*"[\\s\\S]*?data-l="${l}"`).test(s), `#${id} câu kết thiếu ${l}`);
  const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] === c[1] && c[1] === c[2], `#${id} số khối ja/en/vi lệch: ${c.join('/')}`);
  ok(/class="ap-src ap-refs/.test(s), `#${id} thiếu mục nguồn`);
  // 4) Menu, ảnh nền
  ok(new RegExp(`<a href="#${id}" data-sec="${id}">`).test(html), `sidebar thiếu #${id}`);
  ok(((html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').includes(`'${id}'`) && existsSync(p(`assets/pg/${id}.webp`)), `thiếu ảnh nền assets/pg/${id}.webp trong IDS`);
}

// 5) Số liệu khớp nguồn đã kiểm (không bịa)
const S = vi(sec('ap-vs-scale')), M = vi(sec('ap-vs-map')), W = vi(sec('ap-vs-win'));
for (const k of ['279.000', '100.000', '23.000', '818.000', '800.000', '8 năm']) ok(S.includes(k), `#ap-vs-scale thiếu số "${k}"`);
ok(/data-v="279000"/.test(sec('ap-vs-scale')) && /data-v="100000"/.test(sec('ap-vs-scale')) && /data-v="23000"/.test(sec('ap-vs-scale')), '#ap-vs-scale: thanh phải mang đúng giá trị data-v');
for (const k of ['ANDPAD', 'SPIDERPLUS', 'KANNA', 'Photoruction', 'Dandori Work', 'Buildee']) ok(M.includes(k), `#ap-vs-map thiếu "${k}"`);
for (const k of ['0 yên', '50.000', '200.000', 'báo giá']) ok(W.includes(k), `#ap-vs-win thiếu "${k}"`);
// Không ghi % thị phần (ANDPAD không công bố)
for (const id of PAGES) ok(!/\d+(,\d+)?\s?%/.test(vi(sec(id))), `#${id} không được ghi % thị phần`);
// Nguồn đối thủ: link đúng trang của chính công ty
const links = PAGES.map((id) => [...sec(id).matchAll(/<a href="(https:[^"]+)"/g)].map((m) => m[1])).flat();
for (const d of ['spider-plus.com', 'kanna4u.com', 'dandori-work.com', 'buildee.jp', 'andpad']) ok(links.some((u) => u.includes(d)), `thiếu nguồn ${d}`);

// Số trên 3 slide phải là số đã dẫn nguồn ở trang so sánh (tools/ap/market.mjs), không thêm số mới
const mk = readFileSync(p('tools/ap/market.mjs'), 'utf8');
for (const k of ['23.000', '100.000', '800.000', '50.000', '200.000', '15.000', '30.000', '1.061', '279.000']) ok(mk.includes(k), `số "${k}" không có trong dữ liệu đã dẫn nguồn`);
// Bản đồ: chỉ ANDPAD ở nửa "trọn quy trình" (khớp câu kết), không vẽ vùng nhận định không có nguồn
const map = sec('ap-vs-map');
const mid = +((map.match(/class="ap-vm-ax"\/><line x1="([\d.]+)"/) || [])[1]);
const pts = [...map.matchAll(/<g class="ap-vm-p( is-me)?"><title>([^:]+):[^<]*<\/title><circle cx="([\d.]+)"/g)].map((m) => [m[2], +m[3], !!m[1]]);
ok(pts.length === 6, `bản đồ cần 6 điểm, thấy ${pts.length}`);
ok(mid > 0 && pts.filter(([, x]) => x > mid).map(([n]) => n).join() === 'ANDPAD', `nửa phải bản đồ chỉ được có ANDPAD: ${pts.filter(([, x]) => x > mid).map(([n]) => n)}`);
ok(!/ap-vm-gap|空白地帯/.test(map), 'bản đồ không được có ô "còn trống" (nhận định không có nguồn)');
// Thanh "báo giá riêng" không được vẽ dài (dễ đọc thành đắt nhất)
for (const m of sec('ap-vs-win').matchAll(/data-v="quote" style="--w:([\d.]+)%"/g)) ok(+m[1] === 0, 'thanh báo giá riêng phải dài 0');

// 6) CSS riêng
ok(/<!-- ap-vs-css:start -->[\s\S]*?<!-- ap-vs-css:end -->/.test(html), 'thiếu khối <!-- ap-vs-css:start/end -->');

if (fails.length) { console.error(`FAIL check-ap-vs (${fails.length}):\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-vs: 3 slide chart đối thủ (quy mô, bản đồ định vị, ai thắng ở đâu), ít chữ, 1 câu kết, số khớp nguồn');
