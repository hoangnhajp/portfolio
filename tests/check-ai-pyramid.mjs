// Task edof: phân tích AI skill bằng 2 kim tự tháp động ở tab AI (#ai-pyramid).
// Trái: 3 tầng công việc của người đi làm (70% thu thập, xử lý thông tin / 20% phân tích, lập kế hoạch /
// 10% quan hệ và trách nhiệm giữa người với người). Phải: ví dụ công việc Sales cùng 3 tầng.
// Kiểm tĩnh (không cần Chrome): section nằm trong tab AI ngay sau #ai-top, có mục lục + ảnh nền riêng,
// phim .mv.pyr có 2 tháp x 3 tầng, chú giải đủ JA/EN/VI, phụ đề 4 cảnh, nút dừng, chỉ animate transform/opacity,
// chạy khi trang đã hiện, dừng khi ra khỏi màn hình, reduced-motion và bản in hiện tĩnh đủ 3 tầng.
// Chạy: node tests/check-ai-pyramid.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const LANGS = ['ja', 'en', 'vi'];
const count = (s, re) => (s.match(re) || []).length;

// 1) Vị trí: trong <main data-view="ai">, ngay sau #ai-top, trước #ai-approach
const aiMain = (html.match(/<main class="wrap" data-view="ai"[\s\S]*?<\/main>/) || [])[0] || '';
ok(aiMain, 'không thấy <main data-view="ai">');
const order = [...aiMain.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
ok(order[0] === 'ai-top' && order[1] === 'ai-pyramid' && order[2] === 'ai-approach',
  `#ai-pyramid phải đứng ngay sau #ai-top (thứ tự đang là ${order.join(', ')})`);
const sec = (aiMain.match(/<section\b[^>]*id="ai-pyramid"[\s\S]*?<\/section>/) || [])[0] || '';
ok(sec, 'thiếu <section id="ai-pyramid">');
ok(/<section class="pg"[^>]*id="ai-pyramid"/.test(sec), '#ai-pyramid phải là section.pg');

// 2) Mục lục tab AI + đánh số lại 01..04, ảnh nền riêng
const nav = (html.match(/<nav class="sb-nav" data-for="ai"[\s\S]*?<\/nav>/) || [])[0] || '';
const navIds = [...nav.matchAll(/data-sec="([^"]+)"/g)].map((m) => m[1]);
ok(navIds.join(',') === 'ai-top,ai-pyramid,ai-approach,ai-uses,ai-people,ai-tools', // task a9f4 thêm 05 #ai-tools
   `mục lục tab AI sai thứ tự: ${navIds.join(',')}`);
const navNums = [...nav.matchAll(/<em>([^<]+)<\/em>/g)].map((m) => m[1]);
ok(navNums.join(',') === 'TOP,01,02,03,04,05', `số mục lục tab AI phải TOP,01..05 (đang ${navNums.join(',')})`);
const ebs = ['ai-pyramid', 'ai-approach', 'ai-uses', 'ai-people', 'ai-tools'].map((id) => {
  const s = (html.match(new RegExp(`id="${id}"[\\s\\S]*?<span class="eb rv">(\\d\\d)`)) || [])[1]; return s; });
ok(ebs.join(',') === '01,02,03,04,05', `nhãn số đầu section tab AI phải 01..05 (đang ${ebs.join(',')})`);
ok(/var IDS=\[[^\]]*'ai-pyramid'/.test(html), 'khối pganh chưa có ảnh nền cho ai-pyramid');
ok(existsSync(join(root, 'assets', 'pg', 'ai-pyramid.webp')), 'thiếu assets/pg/ai-pyramid.webp');

// 3) Tiêu đề, câu dẫn, chip keyword đủ 3 ngôn ngữ
for (const l of LANGS) {
  ok(new RegExp(`<h2 class="kw rv"[^>]*>[\\s\\S]*?<span data-l="${l}">`).test(sec), `thiếu tiêu đề ${l}`);
  ok(count(sec, new RegExp(`<p class="kw-sub rv"[^>]*data-l="${l}"`, 'g')) === 1, `câu dẫn ${l} phải đúng 1`);
  ok(new RegExp(`<div class="chips" data-l="${l}">`).test(sec), `thiếu chip keyword ${l}`);
}

// 4) Phim kim tự tháp
const fig = (sec.match(/<figure class="mv pyr rv"[\s\S]*?<\/figure>/) || [])[0] || '';
ok(fig, 'thiếu <figure class="mv pyr rv">');
ok(/<figcaption class="mv-head">/.test(fig), 'phim thiếu tiêu đề mv-head');
ok(/<button class="mv-pp" type="button" aria-pressed="false"/.test(fig), 'thiếu nút dừng / phát');
ok(/class="mv-bar"/.test(fig), 'thiếu thanh tiến trình');
const cols = fig.match(/<div class="py-col py-col--(?:gen|sales)">/g) || [];
ok(cols.length === 2, `cần 2 tháp (gen + sales), thấy ${cols.length}`);
ok(count(fig, /<svg class="py-svg"/g) === 2, 'mỗi tháp cần 1 svg.py-svg');
for (const t of [1, 2, 3]) {
  ok(count(fig, new RegExp(`<g class="py-t py-t${t}"`, 'g')) === 2, `tầng ${t} phải có ở cả 2 tháp`);
  ok(count(fig, new RegExp(`<li class="py-r py-r${t}"`, 'g')) === 2, `chú giải tầng ${t} phải có ở cả 2 tháp`);
}
for (const [p, t] of [['70%', 1], ['20%', 2], ['10%', 3]]) ok(count(fig, new RegExp(`class="py-pc[^"]*"[^>]*>${p}<`, 'g')) >= 2, `thiếu nhãn ${p} cho tầng ${t}`);
ok(/class="py-scan"/.test(fig) && /clipPath/.test(fig), 'tầng đáy cần vệt quét AI (py-scan) cắt theo hình tầng');
ok(count(fig, /class="py-fly"/g) >= 6, 'cần các hạt thời gian bay từ đáy lên đỉnh (py-fly)');
ok(/class="py-ai"/.test(fig), 'tầng đáy cần nhãn AI (py-ai)');
for (const l of LANGS) {
  ok(count(fig, new RegExp(`<b class="py-nm" data-l="${l}"`, 'g')) === 6, `tên tầng ${l} phải đủ 6 (2 tháp x 3)`);
  ok(count(fig, new RegExp(`<span class="py-tk" data-l="${l}"`, 'g')) === 6, `việc cụ thể ${l} phải đủ 6`);
  ok(count(fig, new RegExp(`<p class="mv-cap py-c[1-4]" data-l="${l}"`, 'g')) === 4, `phụ đề ${l} phải đủ 4 cảnh`);
  ok(count(fig, new RegExp(`<b class="py-hd" data-l="${l}"`, 'g')) === 2, `tiêu đề cột ${l} phải đủ 2`);
}
// Nội dung đúng yêu cầu người vận hành (bản VI)
const vi = [...fig.matchAll(/data-l="vi">([^<]*)</g)].map((m) => m[1]).join(' | ');
for (const w of ['Tìm kiếm', 'kiểm tra', 'tóm tắt', 'nhập liệu', 'báo cáo', 'Phân tích', 'lập kế hoạch', 'quan hệ', 'chịu trách nhiệm',
  'Tìm thông tin khách', 'lưu hồ sơ', 'chỉ số', 'PDCA', 'kinh nghiệm', 'khách hàng'])
  ok(vi.toLowerCase().includes(w.toLowerCase()), `bản VI thiếu ý "${w}"`);
for (const [l, words] of [['ja', ['調査', '確認', '要約', '入力', '報告', '分析', '計画', '関係', '責任', 'PDCA', '記録']],
  ['en', ['Research', 'checking', 'summaries', 'data entry', 'reports', 'Analys', 'plan', 'relationships', 'PDCA', 'filing']]]) {
  const txt = [...fig.matchAll(new RegExp(`data-l="${l}">([^<]*)<`, 'g'))].map((m) => m[1]).join(' | ');
  for (const w of words) ok(txt.includes(w), `bản ${l.toUpperCase()} thiếu ý "${w}"`);
}
// Giữ luật "AI ra kết quả, người kiểm tra" như #ai-top; 70% là cách nhìn của ứng viên, không phải số liệu chung
ok(/結果は人が確認/.test(fig) && /I check the results/.test(fig) && /kết quả do người kiểm tra/.test(fig), 'phụ đề tầng đáy phải nói người kiểm tra kết quả AI');
ok(/私の見方/.test(sec) && /in my view/i.test(sec) && /theo tôi/i.test(sec), '70% phải ghi là cách nhìn của ứng viên (JA/EN/VI)');

// 5) CSS: khối riêng, dùng 1 chu kỳ, chỉ transform/opacity, chạy khi .pg.in, reduced-motion + in tĩnh
const css = (html.match(/<!-- pyr-css:start -->([\s\S]*?)<!-- pyr-css:end -->/) || [])[1] || '';
ok(css, 'thiếu khối <!-- pyr-css:start/end -->');
ok(html.indexOf('<!-- pyr-css:end -->') > -1 && html.indexOf('<!-- pyr-css:end -->') < html.indexOf('</head>'), 'pyr-css phải nằm trong <head>');
ok(/--py-t:\s*1[0-4](\.\d)?s/.test(css), 'chu kỳ --py-t phải 10..14s');
const anims = [...css.matchAll(/animation:\s*(py\w+)\s+([^;}]+)/g)];
ok(anims.length >= 10, `quá ít animation py* (${anims.length})`);
for (const [, n, rest] of anims) ok(/var\(--py-t\)/.test(rest), `animation ${n} không dùng chung var(--py-t)`);
const kfs = [...css.matchAll(/@keyframes (py\w+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)];
ok(kfs.length >= 10, `quá ít keyframes py* (${kfs.length})`);
for (const [, n, body] of kfs) {
  const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  ok(props.every((p) => p === 'transform' || p === 'opacity'), `keyframes ${n} đổi thuộc tính khác transform/opacity: ${[...new Set(props)].join(',')}`);
}
ok(/html\.js \.pg\.in \.pyr/.test(css), 'phim chỉ chạy khi trang đã hiện (.pg.in)');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^@]*\.pyr/.test(css), 'thiếu nhánh reduced-motion cho .pyr');
ok(/@media print\{[^@]*\.mv\.pyr\{display:block!important/.test(css), 'bản in phải hiện kim tự tháp tĩnh (đè .mv display:none)');
ok(/@media screen and \(max-width:600px\)\{[^@]*\.py-cols\{/.test(css), 'màn hẹp cần xếp 2 tháp thành 1 cột');

if (fails.length) { console.error('FAIL check-ai-pyramid:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-ai-pyramid: #ai-pyramid sau #ai-top, 2 tháp x 3 tầng (70/20/10), JA/EN/VI, 4 phụ đề, chỉ transform/opacity, reduced-motion + in tĩnh');
