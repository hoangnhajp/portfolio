// Bảng "những công việc tôi đã làm" (#projects) gom theo mảng việc, không ghi tên công ty (task adn2).
// Chạy: node tests/check-work-areas-board.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const pj = (html.match(/<section[^>]*id="projects"[\s\S]*?<\/section>/) || [''])[0];
const cards = [...pj.matchAll(/<a class="pj-c"[^>]*href="#([\w-]+)"[\s\S]*?<\/a>/g)].map((m) => m[0]);
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// 1. Không còn tên công ty nào trên bảng
for (const co of ['MAYEKAWA', 'Mayekawa', 'JILNESTA', 'Isuzu', 'LienViet', 'MYCOM', '前川'])
  ok(!strip(pj).includes(co), `#projects còn tên công ty "${co}"`);

// 2. Đủ 10 mảng việc người dùng liệt kê (tiêu đề thẻ, tiếng Việt)
const AREAS = ['Quản lý kinh doanh', 'Quản lý nhân sự', 'Sales', 'Marketing', 'Phân tích kinh doanh', 'Nghiên cứu thị trường',
  'Báo cáo và điều phối đơn hàng', 'Tính toán chi phí và lợi nhuận', 'Tuyển dụng và marketing nội bộ', 'Thông dịch và báo cáo CEO, giám đốc người Nhật'];
const titles = cards.map((c) => strip((c.match(/<b class="pj-co">[\s\S]*?<\/b>/) || [''])[0].replace(/<span data-l="(ja|en)">[\s\S]*?<\/span>/g, '')).trim());
for (const a of AREAS) ok(titles.includes(a), `thiếu thẻ mảng việc "${a}" (đang: ${titles.join(' | ')})`);

// 3. Mỗi thẻ mảng việc có câu kể giọng ứng viên ở cả 3 ngôn ngữ
for (const c of cards.filter((c, i) => AREAS.includes(titles[i]))) {
  const pt = (l) => strip((c.match(new RegExp(`<span class="pj-pt">[\\s\\S]*?<span data-l="${l}">([\\s\\S]*?)</span>`)) || ['', ''])[1]).trim();
  const t = titles[cards.indexOf(c)];
  ok(/^Tôi\s/.test(pt('vi')), `thẻ "${t}": câu VI cần mở đầu "Tôi"`);
  ok(/^I\s/.test(pt('en')), `thẻ "${t}": câu EN cần mở đầu "I"`);
  ok(/(ました|ます|でした)。$/.test(pt('ja')), `thẻ "${t}": câu JA cần です・ます`);
}

// 4. Không bịa: không hạch toán / BCTC (master-profile §9.18), không ký tự cấm
for (const w of ['hạch toán', 'báo cáo tài chính', '仕訳', '財務諸表', 'bookkeeping', 'financial statements', 'P&L'])
  ok(!pj.includes(w), `#projects có từ vượt sự thật "${w}"`);
ok(!/[—·・•]/.test(strip(pj)), '#projects có dấu gạch dài / chấm giữa / ký hiệu đầu dòng');

if (fails.length) { console.error(`FAIL check-work-areas-board (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-work-areas-board: ${cards.length} thẻ, đủ ${AREAS.length} mảng việc, 0 tên công ty, câu kể giọng ứng viên JA/EN/VI`);
