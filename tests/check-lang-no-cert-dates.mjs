// Task bg9f: tab Languages (phần thuyết trình) bỏ ngày tháng kế bên bằng cấp ngoại ngữ, bỏ hẳn TOEIC 680.
//  - Không còn "JLPT N2 ／ 2016年8月", "JLPT N2 (08/2016)"...: chỉ còn "JLPT N2".
//  - Không còn TOEIC ở bất kỳ đâu trong tab Languages (chip, thẻ English, bảng meta, câu dẫn #lang-en).
//  - JLPT N2 vẫn giữ (chip, thẻ Japanese, meta), thẻ English vẫn có dòng chứng chỉ thay thế đủ JA/EN/VI.
// Chạy: node tests/check-lang-no-cert-dates.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = (html.match(/<main class="wrap" data-view="lang" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
ok(main, 'thiếu <main data-view="lang">');

ok(!/TOEIC/i.test(main), 'tab Languages còn "TOEIC"');
for (const d of ['2016年8月', 'Aug 2016', '08/2016', '2011年10月', 'Oct 2011', '10/2011', '2016', '2011'])
  ok(!main.includes(d), `tab Languages còn ngày tháng "${d}"`);
ok((main.match(/JLPT N2/g) || []).length >= 6, 'tab Languages phải còn JLPT N2 (chip, thẻ, meta, câu dẫn)');

// Thẻ English vẫn có dòng chứng chỉ đủ 3 ngôn ngữ, không rỗng
const cards = [...main.matchAll(/<p class="lg-cert">([\s\S]*?)<\/p>/g)].map((m) => m[1]);
ok(cards.length === 3, `cần 3 dòng lg-cert, đang ${cards.length}`);
for (const c of cards) for (const l of ['ja', 'en', 'vi'])
  ok(new RegExp(`<span data-l="${l}">[^<]+</span>`).test(c), `lg-cert thiếu chữ ${l}: ${c}`);
const meta = (main.match(/<div class="meta rv"[\s\S]*?<\/div>\s*<\/section>/) || [''])[0];
ok(/<span>English<\/span>/.test(meta), 'bảng meta thiếu dòng English');

if (fails.length) { console.error(`FAIL check-lang-no-cert-dates (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lang-no-cert-dates: tab Languages không còn ngày tháng cạnh bằng cấp, không còn TOEIC 680, JLPT N2 giữ nguyên');
