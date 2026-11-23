// Bỏ ảnh chân dung (avatar) khỏi portfolio (task 2aef): không còn ở trang bìa #cover lẫn trang Profile #profile.
// Chạy: node tests/check-no-avatar.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!/cover-photo/.test(html), 'còn khung .cover-photo (avatar trang bìa) trong HTML / CSS');
ok(!/class="photo"/.test(html), 'còn khung .photo (avatar trang Profile)');
ok(!/\.photo\{/.test(html), 'còn CSS .photo');
const sec = (id) => (html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
for (const id of ['cover', 'profile']) {
  const s = sec(id);
  ok(s.length > 0, `không tìm thấy section #${id}`);
  // Cảnh minh hoạ .gx (task kzo4) chỉ dùng icon 3D trang trí, không phải ảnh chân dung: bỏ qua khi tìm <img>, nhưng cấm icon hình người
  const gx = (s.match(/<figure class="gx [\s\S]*?<\/figure>/g) || []).join('');
  ok(!/assets\/gx\/(person-bust|cand-man|cand-woman|manager)\.webp/.test(gx), `cảnh minh hoạ ở #${id} dùng icon hình người (giống avatar)`);
  ok(!/<img\b/.test(s.replace(/<figure class="gx [\s\S]*?<\/figure>/g, '')), `section #${id} còn thẻ <img>`);
}
// Trang Profile vẫn giữ khung tóm tắt, không còn cột 200px dành cho ảnh
const prof = sec('profile');
ok(/Career summary/.test(prof), 'trang Profile mất khung tóm tắt');
ok(!/grid-template-columns:200px 1fr/.test(prof), 'trang Profile còn cột 200px dành cho ảnh');

if (fails.length) { console.error(`FAIL check-no-avatar (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-avatar: không còn ảnh chân dung ở trang bìa và trang Profile');
