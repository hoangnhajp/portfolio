// Task 111x: trang Sales 04/06 (#sales-reports) 6 thẻ báo cáo / họp chỉ hiện tiêu đề, không có đoạn nội dung.
// Kiểm: đủ 6 thẻ, mỗi thẻ có .lbl + <h3> (tiêu đề còn bản dịch trong từ điển), không còn <p> trong thẻ.
// Chạy: node tests/check-sales-reports-title-only.mjs [index.html]   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (html.match(/<section [^>]*\bid="sales-reports"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'không thấy section #sales-reports');
// Lưới .g3 cũ đã thay bằng 6 thẻ salaryman động .srp-c (tests/check-sales-reports-anim.mjs), tiêu đề 3 ngôn ngữ bằng data-l
const cards = sec.match(/<div class="card srp-c"[\s\S]*?<\/h3><\/div>/g) || [];
ok(cards.length === 6, `cần 6 thẻ, thấy ${cards.length}`);
for (const c of cards) {
  const h = (c.match(/<h3><span data-l="ja">([^<]+)<\/span>/) || [])[1];
  ok(h, `thẻ thiếu tiêu đề: ${c.slice(0, 80)}`);
  ok(/<span class="lbl">/.test(c), `thẻ "${h}" thiếu nhãn .lbl`);
  ok(!/<p[\s>]/.test(c), `thẻ "${h}" vẫn còn đoạn nội dung <p>`);
  ok(/<span data-l="en">[^<]+<\/span><span data-l="vi">[^<]+<\/span><\/h3>/.test(c), `tiêu đề "${h}" thiếu bản dịch VI/EN`);
}

if (fails.length) { console.error(`FAIL check-sales-reports-title-only (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-sales-reports-title-only: ${cards.length} thẻ #sales-reports chỉ có nhãn + tiêu đề, không còn nội dung`);
