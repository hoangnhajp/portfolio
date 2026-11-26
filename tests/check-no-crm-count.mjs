// Task lbbd: con số "khoảng 30 buổi họp CRM tuần" không có trong CV Rirekisho, người vận hành yêu cầu bỏ.
// Kiểm: (1) section sales-reports (6 thẻ salaryman động .srp, thay cảnh .gx cũ) không còn vòng số / số 30, vẫn có nhãn báo cáo, họp;
// (2) không còn số lần họp CRM ở chữ JA / VI / EN (約30回, khoảng 30 cuộc, about 30 online meetings);
// (3) nguồn sinh cảnh tools/gx/build.mjs cũng không còn v:30 cho sales-reports (chạy lại build không mọc lại số).
// Chạy: node tests/check-no-crm-count.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const build = readFileSync(root + 'tools/gx/build.mjs', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (html.match(/<section [^>]*\bid="sales-reports"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'không thấy section sales-reports');
// Cảnh .gx đã thay bằng 6 thẻ salaryman động .srp (tests/check-sales-reports-anim.mjs): kiểm cả section
const fig = (sec.match(/<div class="srp[\s\S]*<!-- srep:end -->/) || [])[0] || '';
ok(fig, 'sales-reports mất 6 thẻ salaryman động .srp');
ok(!/gx--ring|gx-num|gx-unit/.test(sec), 'sales-reports vẫn còn vòng số / bộ đếm');
ok(!/\b30\b/.test(sec.replace(/<[^>]+>/g, ' ')), 'sales-reports vẫn hiện số 30');
for (const t of ['kết quả hằng tuần', 'Báo cáo tháng', 'Cuộc họp CRM hằng tuần'])
  ok(fig.includes(t), `sales-reports thiếu nhãn "${t}"`);

for (const t of ['約30回', '30 cuộc họp', 'about 30 online meetings', 'buổi họp CRM tuần', '回の週次CRM会議'])
  ok(!html.includes(t), `index.html vẫn còn "${t}"`);
const sr = (build.match(/'sales-reports':\s*\{[^\n]*/) || [])[0] || '';
ok(!sr, 'tools/gx/build.mjs sinh lại cảnh .gx cho sales-reports (trang này dùng thẻ salaryman .srp)');
ok(!/v:\s*30/.test(sr) && !/k:\s*'ring'/.test(sr), 'tools/gx/build.mjs vẫn sinh vòng số 30 cho sales-reports');

if (fails.length) { console.error(`FAIL check-no-crm-count (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-crm-count: cảnh sales-reports không còn số 30, chữ JA/VI/EN không còn số lần họp CRM');
