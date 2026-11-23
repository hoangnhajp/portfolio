// Bỏ hẳn mục "Con số / In numbers / 数字で見るキャリア" (task pusw).
// Chạy: node tests/check-no-numbers-section.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!/id="numbers"/.test(html), 'còn section #numbers');
ok(!/href="#numbers"/.test(html), 'còn link tới #numbers (sidebar / mục lục)');
for (const t of ['Một vài con số để anh/chị hình dung', 'My experience,<br /><i>in numbers</i>', '数字で振り返ります', 'In Numbers <b>']) {
  ok(!html.includes(t), `còn chữ của mục Con số: "${t}"`);
}

if (fails.length) { console.error(`FAIL check-no-numbers-section (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-numbers-section: không còn mục Con số, link sidebar / mục lục đã gỡ');
