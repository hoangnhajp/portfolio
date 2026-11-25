// Task a94u: workflow HR (#w-mycom, thẻ 4 bước) bước 01 đổi "Báo cáo bằng ChatGPT"
// thành "Tổng hợp bằng số liệu và research bằng AI agent" (đủ JA/EN/VI).
// Chạy: node tests/check-hr-step1-label.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.env.HTML || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (html.match(/<section[^>]*id="w-mycom"[\s\S]*?<\/section>/) || [''])[0];
const hr = (sec.match(/<div class="zz zz--4" data-zz>[\s\S]*?<\/ol>/) || [''])[0];
ok(!!hr, 'không thấy workflow HR (.zz--4) trong #w-mycom');
const step1 = (hr.match(/<li class="zz-n" style="--i:0">[\s\S]*?<\/li>/) || [''])[0];
const want = {
  vi: 'Tổng hợp bằng số liệu và research bằng AI agent',
  en: 'Data summaries and research with AI agents',
  ja: 'データ集計とAIエージェントで調査',
};
for (const [l, t] of Object.entries(want)) {
  const got = (step1.match(new RegExp(`<span data-l="${l}">([^<]*)</span>`)) || ['', ''])[1];
  ok(got === t, `bước 01 ${l}: "${got}" (cần "${t}")`);
}
for (const old of ['Báo cáo bằng ChatGPT', 'Reports with ChatGPT', 'ChatGPTで報告書'])
  ok(!html.includes(old), `còn nhãn cũ "${old}"`);

if (fails.length) { console.error(`FAIL check-hr-step1-label (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-hr-step1-label: bước 01 workflow HR = tổng hợp bằng số liệu và research bằng AI agent (JA/EN/VI)');
