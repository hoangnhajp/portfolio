// Task 8vs2: tab IT Knowledge gọn lại, chỉ nói hiểu biết (cơ cấu dự án, ngôn ngữ, nhân sự ngành IT), không kể chuyện từng phát triển dự án.
// #it-top: bỏ 4 thẻ hr-c, bỏ dòng "Nơi tôi đã dùng kiến thức này" và 3 thẻ .it-pf; câu dẫn nêu cơ cấu dự án / ngôn ngữ / nhân sự ngành IT.
// #it-change: bỏ thẻ "BA ／ QA" (Khác nhau giữa BA, QA Manual, QA Auto), chữ VI ngắn hơn bản cũ (1109 ký tự) ít nhất 30%.
// Chạy: node tests/check-it-knowledge-8vs2.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sec = (id) => (html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';
const only = (src, l) => strip([...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' '));

const top = sec('it-top'), chg = sec('it-change');
ok(top && chg, 'thiếu #it-top hoặc #it-change');

// 1) #it-top: không còn 4 thẻ, không còn dòng "Nơi tôi đã dùng..." và khối thẻ kể dự án
ok(!/hr-ar|card hr-c/.test(top), '#it-top còn 4 thẻ .hr-c');
ok(!/Nơi tôi đã dùng kiến thức này|Where I have used this knowledge|この知識を使った仕事/.test(top), '#it-top còn dòng "Nơi tôi đã dùng kiến thức này"');
ok(!/it-pf|it-p\b/.test(top), '#it-top còn khối thẻ .it-pf');
ok((top.match(/class="card/g) || []).length === 0, '#it-top còn thẻ .card');
// 2) Không kể chi tiết từng phát triển dự án
const topAll = only(top, 'ja') + ' ' + only(top, 'en') + ' ' + only(top, 'vi');
ok(!/chủ trì|thiết kế và phát triển|cùng đội phát triển hoàn thiện|led the design|built the systems|設計と開発を主導/i.test(topAll), '#it-top còn kể chi tiết từng phát triển dự án');
// 3) Câu dẫn nói hiểu biết: cơ cấu dự án, ngôn ngữ, nhân sự ngành IT (đủ 3 ngôn ngữ)
const sub = (l) => strip((top.match(new RegExp(`<p class="kw-sub[^"]*"[^>]*data-l="${l}">([\\s\\S]*?)</p>`)) || [])[1] || '');
ok(/cơ cấu dự án/.test(sub('vi')) && /ngôn ngữ/.test(sub('vi')) && /nhân sự ngành IT/.test(sub('vi')), 'VI câu dẫn thiếu cơ cấu dự án / ngôn ngữ / nhân sự ngành IT');
ok(/project/i.test(sub('en')) && /language/i.test(sub('en')) && /IT (staff|talent|people)/i.test(sub('en')), 'EN câu dẫn thiếu project / language / IT staff');
ok(/体制/.test(sub('ja')) && /言語/.test(sub('ja')) && /IT人材/.test(sub('ja')), 'JA câu dẫn thiếu 体制 / 言語 / IT人材');
// Chips tóm tắt đủ 3 ngôn ngữ, cùng số chip
const chips = ['ja', 'en', 'vi'].map((l) => ((top.match(new RegExp(`<div class="chips" data-l="${l}">([\\s\\S]*?)</div>`)) || [])[1] || '').match(/class="chip"/g)?.length || 0);
ok(chips[0] >= 3 && chips[0] === chips[1] && chips[1] === chips[2], `chips #it-top ja/en/vi: ${chips.join('/')}`);
ok(/cơ cấu dự án/.test(top) && /nhân sự ngành IT/.test(top.replace(/<p class="kw-sub[\s\S]*?<\/p>/g, '')), 'chips VI thiếu cơ cấu dự án / nhân sự ngành IT');

// 4) #it-change: bỏ thẻ BA / QA, giữ thẻ ví dụ, chữ gọn hơn
ok(!/BA ／ QA|Khác nhau giữa BA|BA、QA Manual、QA Autoの違い|BA, manual QA and automated QA/.test(chg), '#it-change còn thẻ BA ／ QA');
ok(!/Selenium|Playwright/.test(chg), '#it-change còn đoạn Selenium / Playwright của thẻ BA ／ QA');
ok((chg.match(/class="card/g) || []).length === 1, '#it-change cần đúng 1 thẻ ví dụ');
const viLen = only(chg, 'vi').length;
ok(viLen > 0 && viLen <= 1109 * 0.7, `#it-change chữ VI ${viLen} ký tự, cần <= ${Math.floor(1109 * 0.7)} (giảm >= 30% so với 1109)`);

if (fails.length) { console.error(`FAIL check-it-knowledge-8vs2 (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-it-knowledge-8vs2: #it-top 0 thẻ, #it-change 1 thẻ, chữ VI #it-change ${viLen} ký tự`);
