// Task jzye: câu lệnh người vận hành giao việc ("để 1 trang nguyên văn các thông tin trong JD") bị lọt vào chữ trên trang:
// tiêu đề #jd-top "Thông tin tuyển dụng ANDPAD Vietnam, giữ nguyên văn." (JA 原文のまま載せる / EN word for word),
// câu phụ "giữ nguyên văn bản gốc tiếng Việt", menu "JD nguyên văn" / 求人票（原文）.
// Kiểm trên CHỮ HIỂN THỊ (bỏ script, style, comment) của index.html và trên tools/jd/build.mjs (nguồn sinh tab JD):
// (1) không còn cụm lệnh / meta "giữ nguyên văn" ở JA / EN / VI; (2) tiêu đề, câu phụ, menu JD có chữ mới đủ 3 ngôn ngữ;
// (3) khối JD (.jd-doc) vẫn còn nguyên (không xoá nhầm nội dung JD).
// Chạy: node tests/check-jd-no-prompt-leak.mjs [index.html]   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8').normalize('NFC');
const build = readFileSync(fileURLToPath(new URL('../tools/jd/build.mjs', import.meta.url)), 'utf8').normalize('NFC');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const visible = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const text = visible(html);
// build.mjs: chỉ xét chuỗi nằm trong thẻ HTML sinh ra (bỏ comment // của code)
const buildText = visible(build.split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n'));

// (1) Cụm lệnh / meta cấm
const BANNED = ['giữ nguyên văn', 'JD nguyên văn', 'nguyên văn bản gốc', '原文のまま', '求人票（原文）', 'word for word', 'verbatim'];
for (const s of BANNED) {
  ok(!text.includes(s), `index.html còn cụm lọt prompt "${s}"`);
  ok(!buildText.includes(s), `tools/jd/build.mjs còn cụm lọt prompt "${s}" (chạy lại build sẽ sinh lại)`);
}

// (2) Chữ mới của #jd-top và menu
const sec = (html.match(/<section[^>]*id="jd-top"[\s\S]*?<\/section>/) || [''])[0];
ok(sec, 'không thấy section #jd-top');
const h2 = (sec.match(/<h2[\s\S]*?<\/h2>/) || [''])[0];
for (const [l, s] of [['ja', 'ANDPAD Vietnamの'], ['en', 'ANDPAD Vietnam'], ['vi', 'Thông tin tuyển dụng']])
  ok(new RegExp(`data-l="${l}">[^]*?${s}`).test(h2), `tiêu đề #jd-top thiếu bản ${l} ("${s}")`);
const subs = [...sec.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="(ja|en|vi)">([\s\S]*?)<\/p>/g)];
ok(subs.length === 3 && subs.every((m) => /Customer Success Staff/.test(m[2])), `#jd-top cần 3 câu phụ (ja/en/vi) nêu vị trí Customer Success Staff, thấy ${subs.length}`);
const ja = subs.find((m) => m[1] === 'ja');
ok(ja && /。$/.test(ja[2].trim()) && !/(です|ます|ました)/.test(ja[2]), 'câu phụ JA phải thể ngắn kết 「。」, không です・ます (task ykp6)');
const nav = [...html.matchAll(/<a href="#jd-top" data-sec="jd-top">([\s\S]*?)<\/a>/g)];
ok(nav.length >= 1, 'không thấy link menu #jd-top');
for (const m of nav) for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`data-l="${l}">[^<]+<`).test(m[1]), `menu #jd-top thiếu nhãn ${l}`);

// (3) Nội dung JD còn nguyên
ok(/<div class="jd-doc[^"]*"[^>]*lang="vi"[\s\S]*?Customer Success Staff[\s\S]*?<\/div><!-- \/jd-doc -->/.test(sec), '#jd-top mất khối nội dung JD (.jd-doc)');

if (fails.length) { console.error(`FAIL check-jd-no-prompt-leak (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-jd-no-prompt-leak: ${BANNED.length} cụm lọt prompt không còn (index.html + build.mjs), tiêu đề / câu phụ / menu JD đủ 3 ngôn ngữ, JD còn nguyên`);
