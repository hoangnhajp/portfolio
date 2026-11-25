// Task wx0j: slide 02 MY WORKFLOW (#ai-approach, tab AI Skills) bỏ bước 03 "Giao cho AI".
// Còn 3 bước 01 Liệt kê, 02 Tìm việc lặp lại, 03 Con người kiểm tra, quyết định; 2 mũi tên; lưới 3 cột không chừa ô trống.
// Chạy: node tests/check-ai-workflow-3steps.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
const html = readFileSync(file, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';

const s = sec('ai-approach');
ok(s, 'không tìm thấy #ai-approach');
const cyc = (s.match(/<div class="cyc [^"]*"[\s\S]*?(?=\n  <div class="card rv"|$)/) || [''])[0]; // task zvhs: thẻ Example đã bỏ, chuỗi bước chạy tới hết section
ok(/<div class="cyc cyc--live cyc--3 rv"/.test(cyc), '#ai-approach: chuỗi workflow cần lớp cyc--3 (lưới 3 bước)');
const steps = cyc.match(/<div class="card cyc-c"/g) || [];
ok(steps.length === 3, `#ai-approach: cần 3 bước, thấy ${steps.length}`);
ok((cyc.match(/<span class="cyc-a"/g) || []).length === 2, '#ai-approach: cần 2 mũi tên nối bước');
const nums = [...cyc.matchAll(/<span class="cyc-n">(\d+)<\/span>/g)].map((m) => m[1]);
ok(nums.join(',') === '01,02,03', `#ai-approach: số bước phải là 01,02,03, thấy ${nums.join(',')}`);
for (const t of ['Giao cho AI', 'Hand it to AI', 'AIに任せる</h3>', 'Tôi chuẩn bị prompt và mẫu'])
  ok(!cyc.includes(t), `#ai-approach: bước "Giao cho AI" vẫn còn (${t})`);
for (const t of ['>Liệt kê<', '>Tìm việc lặp lại<', '>Con người kiểm tra, quyết định<'])
  ok(cyc.includes(t), `#ai-approach: thiếu bước ${t}`);
ok(/\.cyc--3\{grid-template-columns:1fr 18px 1fr 18px 1fr\}/.test(html), 'thiếu CSS .cyc--3 lưới 3 cột');
// Các slide khác không bị đụng: #team-daily vẫn 4 bước
ok((sec('team-daily').match(/<div class="card cyc-c"/g) || []).length === 4, '#team-daily phải giữ 4 bước');

if (fails.length) { console.error(`FAIL check-ai-workflow-3steps (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-ai-workflow-3steps: #ai-approach còn 3 bước 01 Liệt kê, 02 Tìm việc lặp lại, 03 Con người kiểm tra; lưới 3 cột; #team-daily giữ 4 bước');
