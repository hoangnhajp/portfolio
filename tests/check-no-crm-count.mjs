// Task lbbd: con số "khoảng 30 buổi họp CRM tuần" không có trong CV Rirekisho, người vận hành yêu cầu bỏ.
// Kiểm: (1) cảnh .gx của section sales-reports không còn vòng số (ring / gx-num), vẫn đủ 4 nhãn báo cáo, họp;
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
const fig = (sec.match(/<figure class="gx [^"]*"[\s\S]*?<\/figure>/) || [])[0] || '';
ok(fig, 'sales-reports mất cảnh .gx');
ok(!/gx--ring|gx-num|gx-unit/.test(fig), 'cảnh sales-reports vẫn còn vòng số / bộ đếm');
ok(!/\b30\b/.test(fig.replace(/<[^>]+>/g, ' ')), 'cảnh sales-reports vẫn hiện số 30');
for (const t of ['Kế hoạch, kết quả tuần', 'Báo cáo tháng', 'Báo cáo công tác', 'Họp sáng 3 chi nhánh'])
  ok(fig.includes(t), `cảnh sales-reports thiếu nhãn "${t}"`);

for (const t of ['約30回', '30 cuộc họp', 'about 30 online meetings', 'buổi họp CRM tuần', '回の週次CRM会議'])
  ok(!html.includes(t), `index.html vẫn còn "${t}"`);
const sr = (build.match(/'sales-reports':\s*\{[^\n]*/) || [])[0] || '';
ok(sr && !/v:\s*30/.test(sr) && !/k:\s*'ring'/.test(sr), 'tools/gx/build.mjs vẫn sinh vòng số 30 cho sales-reports');

if (fails.length) { console.error(`FAIL check-no-crm-count (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-crm-count: cảnh sales-reports không còn số 30, chữ JA/VI/EN không còn số lần họp CRM');
