// Trang 04 kỹ năng: thêm phân tích kinh doanh / nghiên cứu thị trường, đề xuất cải tiến giải pháp kinh doanh,
// mentoring / coaching đội sales và nhân sự (task uvs9). 7 -> 10 thẻ, đủ ja/en/vi, tiêu đề + điều hướng + tóm tắt khớp.
// Chạy: node tests/check-skills-10.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (html.match(/<section[^>]*id="skillmap"[\s\S]*?<\/section>/) || [''])[0];
ok(sec, 'thiếu section #skillmap');

// 1. Đúng 10 thẻ, số 01..10, mỗi thẻ đủ 3 khối ja/en/vi có h3 + p
const cards = sec.split('<div class="card').slice(1);
ok(cards.length === 10, `cần 10 thẻ kỹ năng, đang ${cards.length}`);
cards.forEach((c, i) => {
  const n = String(i + 1).padStart(2, '0');
  ok(new RegExp(`<p class="num"[^>]*>${n}</p>`).test(c), `thẻ ${i + 1} thiếu số ${n}`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<div data-l="${l}"><h3>[^<]+</h3><p>[^<]+</p></div>`).test(c), `thẻ ${n} thiếu khối ${l}`);
});
ok(!/sk7-w/.test(sec), 'lưới 10 thẻ chẵn, không cần thẻ trải rộng sk7-w');

// 2. Ba kỹ năng mới (thẻ 08, 09, 10) có mặt đúng khối từng ngôn ngữ
const need = [
  ['市場調査', 'market research', 'nghiên cứu thị trường'],
  ['営業施策の提案', 'sales solutions', 'giải pháp kinh doanh'],
  ['コーチング', 'coaching', 'coaching'],
];
need.forEach((words, k) => {
  const c = cards[7 + k] || '';
  ['ja', 'en', 'vi'].forEach((l, j) => {
    const blk = (c.match(new RegExp(`<div data-l="${l}">([\\s\\S]*?)</div>`)) || ['', ''])[1];
    ok(blk.toLowerCase().includes(words[j].toLowerCase()), `thẻ ${String(8 + k).padStart(2, '0')} khối ${l} thiếu "${words[j]}"`);
  });
});

// 3. Tiêu đề, sidebar, tóm tắt cuối nói 10 kỹ năng; không còn "7 kỹ năng"
ok(/10のスキル/.test(sec) && /ten skills/.test(sec) && /10 kỹ năng/.test(sec), 'tiêu đề #skillmap chưa đổi sang 10 kỹ năng');
ok(!/7つのスキル|[Ss]even skills|7 kỹ năng/.test(html), 'còn chữ "7 kỹ năng" ở đâu đó');
ok(/data-sec="skillmap"><em>\d+<\/em><span data-l="ja">10のスキル<\/span><span data-l="en">Ten skills<\/span><span data-l="vi">10 kỹ năng<\/span>/.test(html), 'sidebar chưa đổi nhãn 10 kỹ năng');
for (const l of ['ja', 'en', 'vi']) {
  const chips = (html.match(new RegExp(`<div class="chips" style="margin-top:4px" data-l="${l}">[\\s\\S]*?</div>`)) || [''])[0];
  const nums = [...chips.matchAll(/<span class="chip">(\d\d) /g)].map((m) => m[1]);
  // Task y3km bỏ khung tóm tắt ở trang Contact; nếu khung còn thì phải đủ 01..10
  ok(!chips || nums.join(',') === '01,02,03,04,05,06,07,08,09,10', `tóm tắt chips ${l} cần 01..10, đang ${nums.join(',')}`);
}
ok(!/—/.test(sec), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-skills-10 (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-skills-10: 10 thẻ kỹ năng ja/en/vi (thêm phân tích kinh doanh, nghiên cứu thị trường; đề xuất cải tiến giải pháp kinh doanh; mentoring, coaching), tiêu đề, sidebar, tóm tắt khớp');
