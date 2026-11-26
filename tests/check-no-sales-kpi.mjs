// Task t5wm: bỏ trang "07 KPI" (#sales-kpi, 見積と訪問回数を記録し、営業活動を数字で可視化する。) khỏi tab Sales theo yêu cầu người vận hành.
// 3 trang JILNESTA dồn lên 07-09, chip số trang cảnh gx tab Sales đếm 7 trang, link JD m4 trỏ sang #sales-reports. node tests/check-no-sales-kpi.mjs, thoát 0 = đạt
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8');
const html = read('index.html');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!html.includes('sales-kpi'), 'index.html còn id / mục lục / link / IDS sales-kpi');
ok(!html.includes('<b>KPI</b>'), 'còn nhãn eb "07 KPI"');
// Chữ chỉ có ở trang KPI (kể cả khoá dịch VI / EN của nó) phải hết
for (const s of ['KPIと評価項目', '見積と訪問回数を記録し', '営業担当として整備した記録の仕組みと、評価項目を紹介します。', '見積と訪問を集計する仕組み',
  '見積書の入力ファイルを設計し、運用', '訪問回数を細かく集計できる仕組みを構築', '営業担当の評価項目', '100点満点で、部門長と経営陣による2段階評価',
  'Built ／ 営業担当時代', 'Evaluation ／ 2023年', '新規顧客の開拓と顧客リスト', '入札書類、見積、契約の期限順守', '週次の予定と結果の報告'])
  ok(!html.includes(s), `còn chữ / khoá dịch của trang KPI: ${s}`);
// Số trang dồn lại
const nav = (html.match(/<nav class="sb-nav" data-for="sales"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const nums = [...nav.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
ok(nums === 'sales-top:TOP sales-map:01 sales-cycle:02 sales-after:03 sales-pain:04 sales-trips:05 sales-pr:06 sales-reports:07 sales-jil-hcm:08 sales-jil-offshore:09 sales-jil-flow:10 sales-jil-after:11', `mục lục Sales: ${nums}`); // + #sales-after (03) và #sales-jil-after (11): trang sau khi ký hợp đồng, tools/sales/after.mjs
for (const [id, n] of [['sales-jil-hcm', '08'], ['sales-jil-offshore', '09'], ['sales-jil-flow', '10']]) {
  const a = html.indexOf(`id="${id}"`);
  ok(a > 0 && html.slice(a, html.indexOf('</section>', a)).includes(`<span class="eb rv">${n}　<b>`), `#${id} phải có nhãn eb ${n}`);
}
const main = (html.match(/<main class="wrap" data-view="sales"[\s\S]*?<\/main>/) || [])[0] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([^"]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'sales-top,sales-map,sales-cycle,sales-after,sales-pain,sales-trips,sales-pr,sales-reports,sales-jil-hcm,sales-jil-offshore,sales-jil-flow,sales-jil-after', `thứ tự trang Sales: ${ids.join(',')}`);
const chips = [...main.matchAll(/<span class="gx-step"><i><\/i><b>(\d+)<\/b> \/ (\d+)<\/span>/g)].map((m) => m[1] + '/' + m[2]);
ok(chips.join(',') === '01/08,06/08', `chip số trang gx tab Sales phải 01/08, 06/08 (+ #sales-after): ${chips.join(',')}`);
// Link JD m4 (logic, giải quyết vấn đề) không còn trỏ trang đã bỏ
ok(/<a href="#w-mycom">Career<\/a><a href="#sales-reports">Sales<\/a>/.test(html), 'link JD m4 phải trỏ #sales-reports');
// Script build không sinh lại trang / link đã bỏ
for (const f of ['tools/gx/build.mjs', 'tools/jil/build.mjs', 'tools/jd/build.mjs'])
  ok(!/['"#]sales-kpi['"]/.test(read(f).replace(/\/\/[^\n]*/g, '')), `${f} còn sales-kpi ngoài chú thích`);

if (fails.length) { console.error(`FAIL check-no-sales-kpi (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-sales-kpi: đã bỏ trang 07 KPI, JILNESTA 08-10, chip gx Sales / 08, link JD m4 sang #sales-reports');
