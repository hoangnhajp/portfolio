// Trang Sales 06 (#sales-reports): 6 thẻ salaryman động riêng lẻ (.srp, khối <!-- srep -->) liệt kê việc báo cáo / họp,
// thẻ họp CRM với nhà máy Nhật có popup chat tiếng Nhật; đã bỏ thẻ Trip (出張の申請と出張報告) và Internal (3拠点合同の朝会).
// Kiểm tĩnh, không cần Chrome. Chạy: node tests/check-sales-reports-anim.mjs [index.html]   (thoát 0 = đạt)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2] || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (html.match(/<section [^>]*\bid="sales-reports"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'không thấy #sales-reports');
ok(!/<figure class="gx /.test(sec), '#sales-reports còn cảnh .gx tĩnh cũ');
ok(!/<div class="g3/.test(sec), '#sales-reports còn lưới thẻ .g3 cũ');
ok(/<!-- srep:start -->[\s\S]*<div class="srp rv"[^>]*data-no-zoom[\s\S]*<!-- srep:end -->/.test(sec), 'thiếu khối <!-- srep --> .srp (có data-no-zoom)');

// 6 thẻ đúng nội dung người vận hành chốt, đủ 3 ngôn ngữ
const WANT = [
  ['rp1-crm-jp', 'Cuộc họp CRM hằng tuần với nhà máy Nhật', '日本の工場との週次CRM会議', 'Weekly ／ Tiếng Nhật'],
  ['rp2-crm-review', 'Họp rà soát nhập liệu CRM', 'CRM入力状況の確認会議', 'CRM'],
  ['rp3-email', 'Báo cáo lịch làm việc và kết quả hằng tuần qua email', '週次の予定と結果をメールで報告', 'Weekly'],
  ['rp4-monthly', 'Báo cáo tháng, báo cáo xúc tiến bán hàng', '月次報告と販促施策の報告', 'Monthly'],
  ['rp5-follow', 'Tổng hợp các cuộc họp, theo dõi tiến độ kế hoạch tuần và tháng', '会議の取りまとめと週次、月次計画の進捗フォロー', 'Follow-up'],
  ['rp6-pdca', 'Rà soát nghiệp vụ của nhóm theo PDCA', 'チーム業務をPDCAで見直し', 'PDCA'],
];
const cards = sec.match(/<div class="card srp-c"[\s\S]*?<\/h3><\/div>/g) || [];
ok(cards.length === 6, `cần 6 thẻ .srp-c, có ${cards.length}`);
for (const [i, [img, vi, ja, lbl]] of WANT.entries()) {
  const c = cards[i] || '';
  const p = `assets/sales/reports/${img}.webp`;
  ok(existsSync(root + p), `thiếu ảnh ${p}`);
  if (existsSync(root + p)) { const s = statSync(root + p).size; ok(s > 8000 && s < 120000, `${p} dung lượng lạ ${s}`); }
  ok(c.includes(`<img src="${p}" alt=""`), `thẻ ${i + 1}: thiếu cảnh salaryman ${p}`);
  ok(c.includes(`<span data-l="vi">${vi}</span>`), `thẻ ${i + 1}: thiếu tiêu đề VI "${vi}"`);
  ok(c.includes(`<span data-l="ja">${ja}</span>`), `thẻ ${i + 1}: thiếu tiêu đề JA "${ja}"`);
  ok(/<h3><span data-l="ja">[^<]+<\/span><span data-l="en">[^<]{6,}<\/span><span data-l="vi">/.test(c), `thẻ ${i + 1}: tiêu đề thiếu EN`);
  ok(c.includes(lbl), `thẻ ${i + 1}: thiếu nhãn "${lbl}"`);
  ok((c.match(/<i class="srp-p"/g) || []).length >= 1, `thẻ ${i + 1}: cần >= 1 đạo cụ icon động`);
  ok(new RegExp(`style="--i:${i}"`).test(c), `thẻ ${i + 1}: thiếu --i:${i} (vào lần lượt)`);
}
// Popup chat tiếng Nhật chỉ ở thẻ CRM với nhà máy Nhật
const chat = (cards[0] || '').match(/<span class="srp-chat" aria-hidden="true" lang="ja">([\s\S]*?)<\/span><span class="lbl">/);
ok(chat, 'thẻ 1 thiếu popup chat tiếng Nhật .srp-chat lang="ja"');
const bub = chat ? chat[1].match(/<span class="srp-b[^"]*" style="--j:\d">[^<]*[\u3040-\u30ff][^<]*<\/span>/g) || [] : [];
ok(bub.length >= 3, `popup chat cần >= 3 câu tiếng Nhật, có ${bub.length}`);
ok(cards.slice(1).every((c) => !c.includes('srp-chat')), 'popup chat chỉ đặt ở thẻ họp CRM với nhà máy Nhật');

// Đã bỏ Trip / Internal (cả chữ trong section)
for (const t of ['出張の申請と出張報告', '3拠点合同の朝会', '>Trip<', '>Internal<', 'Xin duyệt và báo cáo công tác', 'Họp sáng tại 3 địa điểm'])
  ok(!sec.includes(t), `#sales-reports vẫn còn "${t}"`);

// CSS: khối srep-css trong <head>, keyframes chỉ transform / opacity, reduced-motion, chạy khi .pg.in
const css = (html.match(/<!-- srep-css:start -->([\s\S]*?)<!-- srep-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- srep-css:start -->') < html.indexOf('</head>'), 'thiếu khối <!-- srep-css --> trong <head>');
const kfs = [...css.matchAll(/@keyframes (\w+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)];
ok(kfs.length >= 4, `cần >= 4 keyframes, có ${kfs.length}`);
for (const [, name, body] of kfs) {
  const bad = [...body.matchAll(/([a-z-]+):/g)].map((m) => m[1]).filter((p) => !['transform', 'opacity'].includes(p));
  ok(!bad.length, `@keyframes ${name} đổi thuộc tính nặng: ${[...new Set(bad)].join(',')}`);
}
ok(/html\.js \.pg\.in \.srp/.test(css), 'chuyển động phải chỉ chạy khi trang đã hiện (html.js .pg.in)');
ok(/prefers-reduced-motion:reduce\)\{\.srp \*\{animation:none!important\}/.test(css), 'thiếu reduced-motion');
ok(!/—/.test(sec + css), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-sales-reports-anim (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-sales-reports-anim: ${cards.length} thẻ salaryman động, ${bub.length} popup chat tiếng Nhật, đã bỏ Trip / Internal`);
