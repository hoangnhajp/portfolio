// Task 97rs: trang 04 FORECAST (#ap-role) của tab Andpad Info chỉ dự báo việc cho các sản phẩm và dịch vụ ANDPAD
// đang có tại Việt Nam (bản tiếng Việt / tiếng Anh của Quản lý thi công, Chat, Bản vẽ; bảng đen và biểu mẫu dùng trong
// thí điểm tại Việt Nam; triển khai, hỗ trợ, đội phát triển TP.HCM, văn phòng Hà Nội). Mọi bước, mọi dòng có số nguồn.
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const m = html.match(/<section class="pg" data-chap="V" id="ap-role">([\s\S]*?)<\/section>/);
ok(m, 'không thấy #ap-role');
const role = m ? m[1] : '';
const strip = (s) => s.replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const lang = (s, l) => [...s.matchAll(new RegExp(`<([a-z0-9]+)[^>]* data-l="${l}"[^>]*>([\\s\\S]*?)</\\1>`, 'g'))].map((x) => strip(x[2])).join(' ');
const body = role.split('class="ap-src ap-refs')[0]; // phần nội dung, không tính danh sách nguồn cuối trang

// 1. Không còn sản phẩm chưa có tại Việt Nam
for (const w of ['受発注', '請求管理', '引合粗利', 'Analytics', 'API', 'アプリマーケット', 'App Market', 'AI-BPO', 'ナレッジAI', 'Knowledge AI', 'Ordering', 'Đặt hàng'])
  ok(!strip(body).includes(w), `#ap-role còn sản phẩm chưa có tại Việt Nam: "${w}"`);
// 2. Có đủ sản phẩm và dịch vụ tại Việt Nam
const rows = [...role.matchAll(/<li class="ap-rw"[^>]*>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
ok(rows.length >= 6, `#ap-role cần >= 6 dòng sản phẩm / dịch vụ × việc, thấy ${rows.length}`);
const R = rows.map(strip).join(' | ');
for (const w of ['施工管理', 'チャット', '図面', '黒板', 'ブラウザ', 'ホーチミン', 'ハノイ']) ok(R.includes(w), `#ap-role thiếu sản phẩm / dịch vụ tại Việt Nam "${w}"`);
const vi = lang(role, 'vi');
ok(/chỉ[^.]*Việt Nam/.test(vi),'#ap-role (vi) phải nói rõ chỉ tính sản phẩm và dịch vụ tại Việt Nam');
ok(/ベトナム/.test(lang(role, 'ja')) && /Vietnam/.test(lang(role, 'en')), '#ap-role phải nhắc Việt Nam ở cả JA / EN');
// 3. Mọi bước và mọi dòng có số nguồn, nguồn VN có trong danh sách cuối trang
const steps = [...role.matchAll(/<li class="ap-js"[^>]*>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
ok(steps.length === 4, `#ap-role cần 4 bước, thấy ${steps.length}`);
[...steps, ...rows].forEach((s, i) => ok((s.match(/<sup class="ap-c">/g) || []).length >= 3, `bước / dòng ${i + 1} của #ap-role thiếu số nguồn ở đủ 3 ngôn ngữ`));
for (const u of ['andpad.jp/news/20250626', 'andpad.jp/news/20251006', 'andpad.jp/news/20251014', 'andpad.jp/news/20260408', 'careers.andpad.vn/'])
  ok(role.includes(`href="https://${u}`), `danh sách nguồn #ap-role thiếu ${u}`);
const nums = new Set([...body.matchAll(/<sup class="ap-c">([\d,]+)<\/sup>/g)].flatMap((x) => x[1].split(',').map(Number)));
const listed = (role.match(/<li id="ap-role-r\d+"/g) || []).length;
ok(listed > 0 && [...nums].every((n) => n >= 1 && n <= listed), `số trích dẫn ${[...nums]} phải nằm trong danh sách nguồn (${listed} mục)`);
console.log(bad ? `check-ap-role-vn: ${bad} lỗi` : `check-ap-role-vn: OK (${rows.length} dòng, ${steps.length} bước, ${listed} nguồn)`);
process.exit(bad ? 1 : 0);
