// Đã bỏ trang "08 FLOW" (#sales-flow, 問い合わせから納期調整まで) khỏi tab Sales theo yêu cầu người vận hành.
// Task t5wm bỏ tiếp trang 07 KPI (tests/check-no-sales-kpi.mjs): JILNESTA dồn 07-09, chip số trang cảnh gx tab Sales đếm 7 trang. node tests/check-no-sales-flow.mjs, thoát 0 = đạt
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p) => readFileSync(fileURLToPath(new URL('../' + p, import.meta.url)), 'utf8');
const html = read('index.html');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!html.includes('sales-flow"'), 'index.html còn id / mục lục #sales-flow');
ok(!html.includes("'sales-flow'"), 'mảng IDS ảnh nền còn sales-flow');
ok(!html.includes('<b>FLOW</b>'), 'còn nhãn eb "08 FLOW"');
ok(!html.includes('問い合わせから納期調整まで'), 'còn tiêu đề trang FLOW hoặc khoá dịch của nó');
ok(!html.includes('担当した業務を、顧客対応の流れに沿って整理しました。'), 'còn câu dẫn trang FLOW');
// Số trang dồn lại
const nav = (html.match(/<nav class="sb-nav" data-for="sales"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const nums = [...nav.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
ok(nums === 'sales-top:TOP sales-map:01 sales-cycle:02 sales-after:03 sales-pain:04 sales-trips:05 sales-pr:06 sales-reports:07 sales-jil-hcm:08 sales-jil-offshore:09 sales-jil-flow:10 sales-jil-after:11', `mục lục Sales: ${nums}`); // + #sales-after (03) và #sales-jil-after (11): trang sau khi ký hợp đồng, tools/sales/after.mjs
for (const [id, n] of [['sales-jil-hcm', '08'], ['sales-jil-offshore', '09'], ['sales-jil-flow', '10']]) {
  const a = html.indexOf(`id="${id}"`);
  ok(a > 0 && html.slice(a, html.indexOf('</section>', a)).includes(`<span class="eb rv">${n}　<b>`), `#${id} phải có nhãn eb ${n}`);
}
const main = (html.match(/<main class="wrap" data-view="sales"[\s\S]*?<\/main>/) || [])[0] || '';
const chips = [...main.matchAll(/<span class="gx-step"><i><\/i><b>(\d+)<\/b> \/ (\d+)<\/span>/g)].map((m) => m[1] + '/' + m[2]);
ok(chips.length > 0 && chips.every((c) => c.endsWith('/08')), `chip số trang gx tab Sales phải "/ 08": ${chips.join(',')}`);
// Script build không sinh lại trang đã bỏ
ok(!read('tools/gx/build.mjs').includes("'sales-flow'"), 'tools/gx/build.mjs còn cảnh / STEP sales-flow');
ok(!read('tools/jil/build.mjs').includes('sales-flow"') && !read('tools/jil/build.mjs').includes("'sales-flow'"), 'tools/jil/build.mjs còn mốc sales-flow');

if (fails.length) { console.error(`FAIL check-no-sales-flow (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-sales-flow: đã bỏ trang 08 FLOW, JILNESTA 08-10, chip gx Sales / 08');
