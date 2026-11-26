// Thuật ngữ JA của tab Andpad Info khớp cách ANDPAD và ngành xây dựng Nhật dùng (đối chiếu andpad.jp/products ngày 26/11/2026):
// mô tả thẻ sản phẩm #ap-products bám catch-copy chính thức, khách hàng nhà ở gọi 「お施主様」 như ANDPAD,
// (tên chức năng chính thức 「資料の施主承認」 giữ nguyên), không dùng từ lệch sản phẩm (遠隔臨場 không phải 「立会検査」, チャット không phải 「グループチャット」, BM là 「保全」).
// Chạy: node tests/check-ap-ja-terms.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const ap = (html.match(/<!-- ap:start -->([\s\S]*?)<!-- ap:end -->/) || [])[1] || '';
const txt = (s) => s.replace(/<sup class="ap-c">[\s\S]*?<\/sup>/g, '').replace(/<br \/>/g, '').replace(/<[^>]+>/g, '').trim();
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
ok(ap.length > 1000, 'không thấy khối ap:start/ap:end');

// Chữ JA trong tab (bỏ trang đối thủ #ap-compete / #ap-vs-*: tên và lời của hãng khác).
const own = ap.replace(/<section class="pg"[^>]*id="ap-(compete|vs-[\w-]+)"[\s\S]*?<\/section>/g, ' ');
const ja = [...own.matchAll(/<(\w+)\b[^>]*\bdata-l="ja"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => txt(m[2])).join('\n');
ok(ja.length > 2000, `chữ JA quá ít (${ja.length})`);

// 1) Từ lệch thuật ngữ ANDPAD
const BAN = [
  [/(?<!お)施主(?!承認)/, 'gọi khách nhà ở là 「お施主様」 như ANDPAD, không 「施主」 trần'],
  [/立会検査/, '遠隔臨場 của ANDPAD là xác nhận, chỉ thị qua camera / video, không ghi 「立会検査」'],
  [/グループチャット/, 'ANDPAD チャット: 「一括連絡」, không 「グループチャット」'],
  [/(建物と設備|設備と建物)の維持管理/, 'ANDPAD BM là 「建物・設備保全」'],
];
for (const [re, m] of BAN) ok(!re.test(ja), `${m}: "${(ja.match(new RegExp(`.{0,15}${re.source}.{0,10}`)) || [''])[0]}"`);

// 2) Thẻ sản phẩm #ap-products: mô tả JA chứa từ khoá catch-copy chính thức của trang sản phẩm
const prod = (ap.match(/id="ap-products"[\s\S]*?<\/section>/) || [''])[0];
const cards = Object.fromEntries([...prod.matchAll(/<li class="ap-pd"[^>]*><b>ANDPAD ([^<]+)<\/b><i>[^<]*<\/i><span data-l="ja">([\s\S]*?)<\/span>/g)].map((m) => [m[1], txt(m[2])]));
ok(Object.keys(cards).length >= 20, `chỉ thấy ${Object.keys(cards).length} thẻ sản phẩm`);
const NEED = {
  施工管理: /情報を集約/, チャット: /一括連絡/, 図面: /図面上で一元管理/, 黒板: /黒板付き写真/, 検査: /抜け漏れ/,
  遠隔臨場: /現場カメラ/, 入退場管理: /安全衛生/, '3Dスキャン': /現調/, ボード: /現場カレンダー/, レポート: /帳票や報告書/,
  資料承認: /申請/, 電子納品: /黒板作成/, BIM: /BIMビュワー/, 引合粗利管理: /粗利.*原価|原価.*粗利/, 受発注: /ペーパーレス/,
  請求管理: /建設業界に特化/, 歩掛管理: /日報から.*原価/, おうちノート: /お施主様/, Analytics: /経営状態/, BM: /保全/,
  アプリマーケット: /外部/, 早受取: /早期/,
};
for (const [k, re] of Object.entries(NEED)) ok(re.test(cards[k] || ''), `thẻ ANDPAD ${k}: mô tả JA chưa theo catch-copy chính thức (${re}) "${cards[k] || '(không có thẻ)'}"`);

if (fails.length) { console.error(`FAIL check-ap-ja-terms (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-ja-terms: ${Object.keys(cards).length} thẻ sản phẩm theo catch-copy chính thức, thuật ngữ JA đúng cách ANDPAD dùng`);
