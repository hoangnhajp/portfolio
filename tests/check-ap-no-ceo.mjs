// Người dùng yêu cầu bỏ thông tin CEO (thẻ "CEO / Takeo Inada (稲田 武夫)") khỏi tab Andpad Info.
// Kiểm: trong <main data-view="ap"> và tooltip nguyên văn (assets/ap/quotes.js) không còn CEO, 代表取締役, 代表者, tên CEO.
// Chạy: node tests/check-ap-no-ceo.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (f) => fileURLToPath(new URL(`../${f}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const fails = [];
if (!main) fails.push('thiếu tab Andpad Info (<main data-view="ap">)');
const BAD = /CEO|代表取締役|代表者|稲田|Inada/g;
for (const m of main.matchAll(BAD)) fails.push(`tab Andpad Info còn "${m[0]}": ...${main.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, ' ')}...`);
if (existsSync(p('assets/ap/quotes.js'))) {
  const q = readFileSync(p('assets/ap/quotes.js'), 'utf8');
  for (const m of q.matchAll(BAD)) fails.push(`assets/ap/quotes.js (tooltip) còn "${m[0]}"`);
}
if (fails.length) { console.error('FAIL check-ap-no-ceo:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-ap-no-ceo: tab Andpad Info không còn thông tin CEO');
