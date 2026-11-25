// Task f46s: chữ trên trang bị "lọt prompt" (câu meta nói quy tắc biên tập / nguồn nội bộ / việc giấu thông tin),
// ví dụ "Phần này không nêu tên công ty, chỉ ghi vai trò...". Người vận hành yêu cầu rà toàn bộ, không để lọt.
// Kiểm: (1) không còn cụm meta ở cả JA / EN / VI (HTML + từ điển dịch D);
// (2) câu JA đã viết lại có mục dịch trong D (vi/en không rơi về tiếng Nhật);
// (3) giữ dữ kiện chính (MAYEKAWA, giai đoạn 2022-2026, vai trò kiêm nhiệm).
// Chạy: node tests/check-no-prompt-leak.mjs [index.html]   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// (1) Cụm meta cấm (giấu / chỉ ghi / nguồn nội bộ / "dựa theo CV")
const BANNED = [
  // JA
  '伏せ', '掲載していません', 'に限って掲載', 'に絞って掲載', 'のみを記載', '出典：', '記録に残る業務', '記録が残る',
  '記録から見えた', '履歴書兼職務経歴書に沿って', '職務記述書（2023年7月）に', '出張規程）',
  // EN
  'omitted', 'I have drawn only on', 'drawn from these records', 'Drawing on my 2026', 'Sources:', 'documented tasks',
  'listing destinations by industry and region', 'set out analysis of the sales process', 'Under the January 2024 travel rules',
  // VI
  'không nêu tên', 'Không nêu tên', 'chỉ ghi', 'Tôi không đưa tên khách', 'Tôi chỉ trình bày công việc thể hiện',
  'Nguồn: lịch', 'rút ra từ các ghi nhận', 'dựa trên CV tiếng Nhật', 'công việc có ghi nhận', 'Bản mô tả công việc phòng Kinh doanh (07/2023) quy định',
  'Theo quy định công tác tháng 01/2024',
];
for (const s of BANNED) ok(!html.includes(s), `còn cụm meta "${s}"`);
ok(!/(company|client) names[^.<"]{0,40}(omitted|hidden|withheld)/i.test(html), 'EN còn câu kiểu "company/client names omitted"');
ok(!/(giấu|ẩn) tên (công ty|khách)/i.test(html), 'VI còn câu kiểu "giấu/ẩn tên công ty/khách"');

// (2) Câu JA viết lại phải có mục trong từ điển dịch (window.__D2 / D2 / D, khoá = câu JA)
const D = html.slice(html.indexOf('window.__D2='));
const NEW_JA = [
  'MAYEKAWA VIETNAM（MYCOM、産業用冷凍機）における営業活動の記録です。2022年2月から2026年6月まで、営業部のアシスタントマネージャー（人事部長を兼務）を務めました。見込み客の調査から営業提案、基本的な技術提案、エンジニアチームとの機種選定、交渉、納品まで、営業サイクル全体を担当。',
  '商談と顧客訪問を、時系列で紹介します。',
  'タイで開催されたMAYEKAWA ASEAN社員総会での発表、展示会「PROPAK ASIA」、「VIV ASIA」（バンコク）の視察、MYCOM KOREAへの訪問、ベトナムでの顧客訪問を写真で紹介します。',
  '担当した業務を、顧客対応の流れに沿って整理しました。',
  // Task 111x: thẻ #sales-reports chỉ còn tiêu đề, 2 câu nội dung (月次報告 / 出張) đã bỏ có chủ đích.
];
for (const s of NEW_JA) {
  ok(html.includes(`>${s}<`), `HTML thiếu câu JA mới "${s.slice(0, 30)}..."`);
  ok(D.includes(`"${s}":[`), `từ điển D thiếu bản dịch cho "${s.slice(0, 30)}..."`);
}

// (3) Giữ dữ kiện
for (const s of ['2022年2月から2026年6月まで', 'from February 2022 to June 2026', 'từ 02/2022 đến 06/2026', 'PDF'])
  ok(html.includes(s), `mất dữ kiện "${s}"`);
const team = (html.match(/<section[^>]*id="team-records"[\s\S]*?<\/section>/) || [''])[0];
ok(team && !/class="kw-sub[^"]*"[^>]*>[^<]*(会社名|company|công ty)/.test(team), '#team-records còn câu phụ nói về tên công ty');

if (fails.length) { console.error(`FAIL check-no-prompt-leak (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-no-prompt-leak: ${BANNED.length} cụm meta JA/EN/VI không còn, ${NEW_JA.length} câu viết lại có bản dịch, giữ dữ kiện`);
