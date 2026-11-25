// Task ve3p: mọi ảnh minh hoạ app (chụp màn hình phần mềm) trên portfolio phải là giao diện tiếng Anh.
// Danh sách EN_UI dưới đây là các ảnh đã xem từng pixel: giao diện tiếng Anh, chữ tiếng Việt trong dữ liệu đã che.
// Thêm ảnh app mới: xem ảnh, chắc chắn giao diện tiếng Anh rồi mới thêm tên vào EN_UI.
// Chạy: node tests/check-sw-english.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const EN_UI = ['staff-dashboard', 'staff-activity', 'staff-calendar', 'staff-calc', 'staff-alert',
  // app quản lý khách hàng: chụp lại ở giao diện English (task ve3p)
  'crm-dashboard', 'crm-list', 'crm-kanban', 'crm-calendar', 'crm-report',
  // app quản lý khách hàng, trang con #sw-leads2 (task 8uat): chụp ở giao diện English, dữ liệu cá nhân đã blur
  'crm-add-customer', 'crm-ai-import', 'crm-categories', 'crm-permissions', 'crm-ai-agent', 'crm-connectors',
  // app tuyển dụng: chụp lại ở giao diện English (task ve3p)
  'recruit-dashboard', 'recruit-cv', 'recruit-jd', 'recruit-process', 'recruit-matching'];
const html = readFileSync(p('index.html'), 'utf8');
const build = readFileSync(p('tools/sw/build-shots.py'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// 1) Ảnh app dùng trên trang (mọi tab) chỉ thuộc EN_UI
const used = [...new Set([...html.matchAll(/assets\/sw\/([\w-]+)\.webp/g)].map((m) => m[1]))];
for (const n of used) ok(EN_UI.includes(n), `trang dùng ảnh app chưa xác nhận tiếng Anh: assets/sw/${n}.webp`);
ok(used.length >= 21, `cần >= 21 ảnh app tiếng Anh trên trang, thấy ${used.length}`);

// 2) Thư mục assets/sw (được phát hành công khai) không còn ảnh ngoài EN_UI
for (const f of existsSync(p('assets/sw')) ? readdirSync(p('assets/sw')) : []) {
  ok(EN_UI.includes(f.replace(/\.webp$/, '')), `assets/sw còn ảnh không phải giao diện tiếng Anh: ${f}`);
}

// 3) Script sinh ảnh chỉ xuất ảnh / cắt nền từ ảnh trong EN_UI
const shots = [...(build.match(/SHOTS = \{([\s\S]*?)\n\}/) || ['', ''])[1].matchAll(/^\s{4}'([\w-]+)':/gm)].map((m) => m[1]);
ok(shots.length > 0, 'không đọc được SHOTS trong tools/sw/build-shots.py');
for (const n of shots) ok(EN_UI.includes(n), `build-shots.py còn xuất ảnh ngoài EN_UI: ${n}`);
const backs = [...((build.match(/^BACKS = \[(.*)\]$/m) || ['', ''])[1]).matchAll(/\('[\w-]+', '([\w-]+)'/g)].map((m) => m[1]);
ok(backs.length > 0, 'không đọc được BACKS trong tools/sw/build-shots.py');
for (const n of backs) ok(EN_UI.includes(n), `nền trang cắt từ ảnh ngoài EN_UI: ${n}`);

if (fails.length) { console.error(`FAIL check-sw-english (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-sw-english: ${used.length} ảnh app trên trang đều là giao diện tiếng Anh`);
