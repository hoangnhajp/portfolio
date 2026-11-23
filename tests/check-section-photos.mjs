// Task ice8: mỗi section là 1 hình, như Landing Page GPR FLEXEYE (D:\Gprflexeye Homepages\Landing Page, lớp .pganh):
// mỗi section.pg có đúng một ảnh chụp riêng làm nền mờ (assets/pg/<id>.webp), không dùng lại kiểu icon kính
// trong suốt hồng (assets/skills, assets/icons), ảnh hiện ra theo từng section khi cuộn tới.
// Kiểm tĩnh (không cần Chrome): khối pganh-css + pganh có mặt, danh sách id khớp mọi section.pg, mỗi file ảnh tồn tại,
// là WebP dọc, nhẹ, không trùng nhau; bản in ẩn ảnh; reduced-motion hiện tĩnh.
// Chạy: node tests/check-section-photos.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const css = (html.match(/<!-- pganh-css:start -->([\s\S]*?)<!-- pganh-css:end -->/) || [])[1] || '';
const js = (html.match(/<!-- pganh:start -->([\s\S]*?)<!-- pganh:end -->/) || [])[1] || '';
ok(css, 'thiếu khối <!-- pganh-css:start/end -->');
ok(js, 'thiếu khối <!-- pganh:start/end -->');
ok(html.indexOf('<!-- pganh-css:end -->') < html.indexOf('</head>'), 'khối pganh-css phải nằm trong <head>');

// Mọi section.pg có id phải có ảnh riêng
const ids = [...html.matchAll(/<section\b[^>]*\bclass="[^"]*\bpg\b[^"]*"[^>]*>/g)]
  .map((m) => (m[0].match(/\bid="([^"]+)"/) || [])[1]).filter(Boolean);
ok(ids.length >= 20, `chỉ thấy ${ids.length} section.pg`);
const list = ((js.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').match(/'[^']+'/g)?.map((s) => s.slice(1, -1)) || [];
ok(list.length, 'khối pganh thiếu mảng var IDS=[...]');
for (const id of ids) ok(list.includes(id), `section #${id} chưa có ảnh trong IDS`);
for (const id of list) ok(ids.includes(id), `IDS có #${id} nhưng không có section.pg này`);

// File ảnh: WebP thật, dọc, nhẹ, không trùng
const hashes = new Map();
for (const id of list) {
  const f = join(root, 'assets', 'pg', `${id}.webp`);
  if (!existsSync(f)) { fails.push(`thiếu file assets/pg/${id}.webp`); continue; }
  const b = readFileSync(f);
  ok(b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', `${id}.webp không phải WebP`);
  const kb = statSync(f).size / 1024;
  ok(kb > 8 && kb < 160, `${id}.webp nặng ${kb.toFixed(0)}KB (cần 8..160KB)`);
  // Kích thước: VP8 (lossy) khung đầu ở byte 26..29, VP8X ở 24..29
  let w = 0, h = 0; const fmt = b.toString('ascii', 12, 16);
  if (fmt === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
  else if (fmt === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
  else if (fmt === 'VP8L') { const v = b.readUInt32LE(21); w = (v & 0x3fff) + 1; h = ((v >> 14) & 0x3fff) + 1; }
  ok(h > w && w >= 600, `${id}.webp phải là ảnh dọc rộng >= 600px (đang ${w}x${h})`);
  const hash = createHash('sha1').update(b).digest('hex');
  ok(!hashes.has(hash), `${id}.webp trùng ảnh với ${hashes.get(hash)}`);
  hashes.set(hash, id);
}

// Không dùng lại kiểu icon kính trong suốt hồng đã bị cấm
ok(!/assets\/(skills|icons)\//.test(html), 'index.html còn tham chiếu assets/skills hoặc assets/icons (kiểu icon cấm)');

// Hành vi: lớp nền dưới chữ, hiện theo từng section, in ẩn, reduced-motion tĩnh
ok(/\.pganh\{[^}]*position:absolute[^}]*z-index:-1/.test(css), '.pganh phải là lớp tuyệt đối z-index:-1 (dưới chữ)');
ok(/isolation:isolate/.test(css), '.pg cần isolation:isolate để lớp ảnh nằm trên nền tờ, dưới chữ');
ok(/\.pganh-in/.test(css) && /opacity:0/.test(css), 'thiếu trạng thái chờ / hiện (.pganh-in)');
ok(/@media print\{[^}]*\.pganh\{display:none/.test(css), 'bản in phải ẩn .pganh');
ok(/prefers-reduced-motion:reduce/.test(css), 'thiếu nhánh reduced-motion');
ok(/IntersectionObserver/.test(js), 'khối pganh cần IntersectionObserver để hiện theo section');
ok(/aria-hidden/.test(js) && /deco/.test(js), 'lớp ảnh phải aria-hidden và mang class deco (khối sr bỏ qua)');

if (fails.length) { console.error('FAIL check-section-photos:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-section-photos: ${list.length} section, mỗi section 1 ảnh riêng, không icon cấm`);
