// Portfolio khớp CV mới (Rirekisho 履歴書兼職務経歴書, 3 trang): không còn CV cũ, không còn nội dung trái CV mới,
// CV mới nằm trong source và được liên kết, đủ 3 ngôn ngữ. Chạy: node tests/check-cv-rirekisho.mjs (thoát 0 = đạt)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const CV = 'Rirekisho_ThaiTranHoangNha.pdf';

// 1. Không còn CV / PDF cũ trong source, chỉ còn đúng 1 PDF là CV mới
const pdfs = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === 'node_modules' || f === '.git') continue;
  if (statSync(p).isDirectory()) walk(p); else if (/\.pdf$/i.test(f)) pdfs.push(p.slice(root.length).replace(/\\/g, '/')); } };
walk(root);
ok(pdfs.length === 1 && pdfs[0] === CV, `PDF trong source phải chỉ là ${CV}, đang: ${pdfs.join(', ') || '(không có)'}`);
ok(!html.includes('Portfolio_ThaiTranHoangNha_JP.pdf'), 'còn liên kết tới PDF portfolio cũ');
if (existsSync(join(root, CV))) {
  const b = readFileSync(join(root, CV));
  ok(b.subarray(0, 5).toString() === '%PDF-' && b.length > 100 * 1024, `${CV} không phải PDF hợp lệ`);
}

// 2. CV mới liên kết qua link sidebar (trang nhúng PDF #cv đã bỏ ở task 4pxr, xem check-no-cv-section.mjs)
ok(new RegExp(`class="sb-pdf" href="${CV}"`).test(html), 'link sidebar chưa trỏ tới CV mới');

// 3. Chỉ còn view Profile + Sales (bỏ Finance / HR / JD / Matching / Management vì không có trong CV mới)
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
ok(views.join(',') === 'profile,sales', `view phải là profile,sales; đang ${views.join(',')}`);
const tops = [...html.matchAll(/<a href="#[\w-]+" data-view="(\w+)"/g)].map((m) => m[1]);
ok(tops.every((v) => views.includes(v)), `menu trên trỏ tới view không tồn tại: ${tops.join(',')}`);

// 4. Không còn nội dung trái CV mới (chức danh, giai đoạn, phạm vi việc cũ)
const STALE = ['支店長', 'Branch manager', 'Branch Manager', 'Giám đốc chi nhánh', '2024年3月', '03/2024', 'Mar 2024',
  '人事、採用担当', '23段階', '労働法', '代表代行', '2022年2月 ～ 現在', '2024 ～ 現在', 'BRANCH OPERATIONS',
  '予算', 'S&amp;A Expense', '修士（財務、管理）',
  '約5名のチーム', '5名分の日次報告', 'European CEOs', 'Japanese presidents'];
for (const s of STALE) ok(!html.includes(s), `còn nội dung cũ trái CV mới: "${s}"`);

// 5. Sự thật cốt lõi của CV mới có mặt (JA)
const FACTS = ['MAYEKAWA VIETNAM CO., LTD.（MYCOM）', '営業部 アシスタントマネージャー 兼 人事部長', '2022年2月 ～ 2026年6月',
  'ベトナム支店 営業マネージャー', '2019年2月 ～ 2022年2月', 'ITコミュニケーター', '2017年8月 ～ 2019年2月',
  '部品部 売上管理担当', '2015年6月 ～ 2017年8月', '国際決済部 国際決済担当', '2011年9月 ～ 2015年6月',
  '日本語能力試験 N2', 'TOEIC 680点', '1989年7月31日', 'nhatth3107@gmail.com', '+84 903 191 364',
  '日本の仕事の進め方を理解し、日本人とベトナム人をつなぐ力', '顧客の課題を聞き取り、社内と連携して解決まで進める力',
  '分かりやすい資料を作り、人に教えて定着させる力', 'AIを使ったCV解析、JDマッチングシステムの設計と開発を主導'];
for (const s of FACTS) ok(html.includes(s), `thiếu nội dung CV mới: "${s}"`);

// 6. Mỗi section của view Profile viết mới đủ 3 ngôn ngữ (khối data-l ja / en / vi cân nhau)
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const secs = [...prof.matchAll(/<section[^>]*id="([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)];
ok(secs.length >= 14, `view Profile phải >= 14 section, đang ${secs.length}`);
for (const [, id, body] of secs) {
  if (id === 'aiops' || id === 'aidash') continue; // 2 trang mẫu giữ nguyên, dịch qua từ điển D
  const n = (l) => (body.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
  ok(n('ja') > 0 && n('ja') === n('en') && n('ja') === n('vi'), `#${id}: khối ngôn ngữ lệch ja/en/vi = ${n('ja')}/${n('en')}/${n('vi')}`);
}

// 7. Mọi link mục lục / sidebar trỏ tới id có thật
const ids = new Set([...html.matchAll(/\sid="([\w-]+)"/g)].map((m) => m[1]));
for (const [, h] of html.matchAll(/href="#([\w-]+)"/g)) ok(ids.has(h), `link #${h} không có đích`);

if (fails.length) { console.error(`FAIL check-cv-rirekisho (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-cv-rirekisho: chỉ còn ${CV}, đã link sidebar, view profile/sales, 0 nội dung cũ trái CV, ${FACTS.length} sự thật CV có mặt, ${secs.length} section đủ 3 ngôn ngữ`);
