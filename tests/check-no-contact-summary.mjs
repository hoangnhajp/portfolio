// Trang 15 Contact: bỏ khung "Summary / Tóm tắt" (dãy chip 01..10) theo yêu cầu người vận hành (task y3km).
// Giữ tiêu đề cảm ơn, thanh kwbar, 3 thẻ Email / Phone / Location và chân trang trang cuối.
// Chạy: node tests/check-no-contact-summary.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (html.match(/<section[^>]*id="contact"[\s\S]*?<\/section>/) || [''])[0];
ok(sec, 'thiếu section #contact');

ok(!/class="chips"/.test(sec), 'trang Contact còn dãy chip tóm tắt');
ok(!/Summary|まとめ|Tóm tắt/.test(sec), 'trang Contact còn nhãn Summary / まとめ / Tóm tắt');
ok(!/class="chips"[^>]*data-l=/.test(html), 'còn khối chips tóm tắt ở đâu đó trong trang');

ok(/Cảm ơn anh\/chị đã dành thời gian/.test(sec), 'mất tiêu đề cảm ơn');
ok(/class="kwbar/.test(sec), 'mất thanh kwbar');
ok(/href="mailto:/.test(sec) && /href="tel:/.test(sec) && /Location/.test(sec), 'mất thẻ Email / Phone / Location');
ok(/<div class="ft"[^>]*><p>Thai Tran Hoang Nha ／ Portfolio<\/p><p>(\d\d) ／ \1<\/p><\/div>/.test(sec), 'mất chân trang trang cuối (NN ／ NN)');

if (fails.length) { console.error(`FAIL check-no-contact-summary (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-contact-summary: trang Contact không còn khung Summary / Tóm tắt, giữ tiêu đề, liên hệ, chân trang');
