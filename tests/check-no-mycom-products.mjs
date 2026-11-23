// Task xq1t: đã xoá khối "Products / MYCOMの主な製品" (6 ảnh sản phẩm) khỏi trang Sales
// node tests/check-no-mycom-products.mjs, thoát 0 = đạt
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const html = readFileSync(fileURLToPath(new URL('index.html', root)), 'utf8');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
const PRODUCTS = ['mycom-mc1200', 'mycom-newton', 'mycom-screw-compressor', 'mycom-iqf-freezer', 'mycom-spiral-freezer', 'mycom-unimo-heatpump'];

ok(!html.includes('MYCOMの主な製品'), 'còn tiêu đề khối "MYCOMの主な製品"');
ok(!/<span class="lbl">Products<\/span>/.test(html), 'còn nhãn "Products"');
ok(!html.includes('MAYEKAWAの製品資料'), 'còn dòng nguồn ảnh "MAYEKAWAの製品資料"');
for (const p of PRODUCTS) {
  ok(!html.includes(`assets/sales/${p}.jpg`), `index.html còn ảnh ${p}.jpg`);
  ok(!existsSync(fileURLToPath(new URL(`assets/sales/${p}.jpg`, root))), `còn file assets/sales/${p}.jpg`);
}
for (const k of ['NH3/CO2冷凍パッケージ', '自然冷媒の冷凍ユニット', '圧縮機ユニット', 'IQFフリーザー', 'スパイラルフリーザー', 'ヒートポンプ'])
  ok(!html.includes(`"${k}":[`), `còn khoá dịch thừa "${k}"`);
// Phần còn lại của Sales vẫn giữ: section #sales-flow, câu nguồn, ảnh MYCOM KOREA (ảnh công tác, không phải sản phẩm)
ok(/id="sales-flow"/.test(html), 'mất section #sales-flow');
// Task f46s: câu "出典：社内メール..." là chữ meta lộ nguồn nội bộ, đã bỏ theo yêu cầu; giữ thẻ quy trình cuối
ok(html.includes('<h3>定例報告</h3>'), 'mất thẻ quy trình cuối "定例報告" của #sales-flow');
ok(html.includes('assets/sales/trip-mycom-korea.jpg'), 'mất ảnh công tác MYCOM KOREA (không thuộc phạm vi xoá)');

if (fails.length) { console.error(`FAIL (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-no-mycom-products: đã xoá khối sản phẩm MYCOM (${PRODUCTS.length} ảnh + khoá dịch), phần Sales khác còn nguyên`);
