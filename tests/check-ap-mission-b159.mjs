// Task b159: câu tóm tắt MISSION ở trang #ap-top (tab Andpad Info) phải bám nguyên văn nguồn [6]
// (andpad.co.jp/mission/, đoạn trích ở tools/ap/quotes.mjs): 住まい / ビルや施設 / 街をつくる人, テクノロジーの力で後押し.
// Không được thêm ý không có trong nguồn ("家を建てる人", "働き方").
// Chạy: node tests/check-ap-mission-b159.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.error('FAIL', m); } };

const card = (html.match(/<div class="card ap-ms[\s\S]*?<\/div>\s*<\/div>/) || [''])[0];
ok(card, 'không thấy thẻ .ap-ms trong index.html');
const lang = (l) => ((card.match(new RegExp(`<p data-l="${l}">([\\s\\S]*?)</p>`)) || [, ''])[1]);
const ja = lang('ja'), en = lang('en'), vi = lang('vi');

for (const k of ['住まい', 'ビルや施設', '街をつくる', 'テクノロジーの力で後押し']) ok(ja.includes(k), `JA thiếu "${k}" của nguồn [6]`);
for (const k of ['家を建てる', '働き方']) ok(!ja.includes(k), `JA còn "${k}" (không có trong nguồn [6])`);
for (const k of ['homes', 'buildings', 'facilities', 'towns', 'technology']) ok(en.toLowerCase().includes(k), `EN thiếu "${k}"`);
ok(!/working lives/i.test(en), 'EN còn "working lives" (không có trong nguồn [6])');
for (const k of ['nhà ở', 'tòa nhà', 'công trình', 'phố', 'công nghệ']) ok(vi.includes(k), `VI thiếu "${k}"`);
ok(!vi.includes('cách làm việc'), 'VI còn "cách làm việc" (không có trong nguồn [6])');
for (const t of [ja, en, vi]) ok(t.includes('[6]'), 'mỗi bản phải giữ chú thích nguồn [6]');

if (fail) { console.error(`check-ap-mission-b159: ${fail} lỗi`); process.exit(1); }
console.log('OK check-ap-mission-b159: câu MISSION bám nguyên văn nguồn [6] ở cả JA / EN / VI');
