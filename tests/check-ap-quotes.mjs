// Tab Andpad Info: mỗi thông tin có số trích dẫn [n] phải có dẫn chứng NGUYÊN VĂN để rê chuột xem (tooltip) và đối chiếu.
// 1) Mọi nguồn được trích trên trang có >= 1 đoạn nguyên văn trong tools/ap/quotes.mjs; assets/ap/quotes.js khớp dữ liệu.
// 2) Cổng chống số bịa: mọi con số trong câu tiếng Anh có trích dẫn phải xuất hiện (sau quy đổi 万 / 億 / dấu phẩy)
//    trong đoạn nguyên văn của chính nguồn câu đó trích; ngoại lệ phải ghi lý do trong ALLOW.
// 3) index.html có khối tooltip (CSS + nạp quotes.js + script) trong khối ap.
// Chạy: node tests/check-ap-quotes.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REFS } from '../tools/ap/refs.mjs';
import { QUOTES } from '../tools/ap/quotes.mjs';
import { quotesJs, QUOTES_JS } from '../tools/ap/tip.mjs';

const p = (f) => fileURLToPath(new URL(`../${f}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const main = (html.match(/<!-- ap:start -->([\s\S]*?)<!-- ap:end -->/) || [])[1] || '';
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ---- số trong chữ: quy về giá trị (27.9万 = 279000, 100億 = 10000000000, ¥10 billion = 10000000000)
// vi = true: chữ tiếng Việt dùng '.' phân nghìn, ',' thập phân (279.000; 2,7 sao; 10 tỷ yên)
const nums = (s, vi = false) => {
  const out = new Set();
  if (vi) s = s.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (m) => m.replace(/\./g, '')).replace(/(\d),(\d)/g, '$1.$2').replace(/(\d)\s*tỷ/g, '$1 billion').replace(/(\d)\s*triệu/g, '$1 million');
  let t = s.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0)).replace(/．/g, '.').replace(/，/g, ',');
  t = t.replace(/(\d) , (\d{3})/g, '$1,$2') // số bị tách bởi thẻ: "1 , 700"
    .replace(/\b(\d{4})\.(\d{1,2})\.(\d{1,2})\b/g, '$1 $2 $3') // ngày 2026.4.08
    .replace(/令和(\d+)/g, (m, n) => `${2018 + +n}`) // 令和8年 = 2026
    .replace(/(\d+)割/g, (m, n) => `${n * 10}%`); // 8割 = 80%
  for (const m of t.matchAll(/(\d+(?:[.,]\d+)*)\s*(万|億|billion|bn|million|K\b)?/gi)) {
    let raw = m[1];
    // 1,072 / 279,000 = nhóm nghìn; 2,7 sao (VI) không có ở EN nên coi ',' là nghìn khi nhóm sau đủ 3 số
    raw = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(/,/g, '.');
    let v = parseFloat(raw);
    if (Number.isNaN(v)) continue;
    const u = (m[2] || '').toLowerCase();
    if (u === '万') v *= 1e4; else if (u === '億') v *= 1e8; else if (u === 'billion' || u === 'bn') v *= 1e9; else if (u === 'million') v *= 1e6; else if (u === 'k') v *= 1e3;
    out.add(Math.round(v * 100) / 100);
  }
  return out;
};

// ---- câu có trích dẫn (EN và VI) + khoá nguồn, đọc từ HTML đã sinh
const keyOf = Object.fromEntries(Object.entries(REFS).map(([k, [u]]) => [u, k]));
const claims = [];
for (const s of main.split('<section').slice(1)) {
  const id = (s.match(/id="([\w-]+)"/) || [])[1];
  const refs = Object.fromEntries([...s.matchAll(new RegExp(`<li id="${id}-r(\\d+)">(?:(?!</li>)[\\s\\S])*?<a href="([^"]+)"`, 'g'))].map((m) => [m[1], keyOf[m[2]]]));
  const body = s.replace(/<div class="ap-src ap-refs[\s\S]*$/, '');
  for (const m of body.matchAll(/<sup class="ap-c">\[([\d,]+)\]<\/sup>/g)) {
    const before = body.slice(0, m.index);
    const li = before.lastIndexOf('data-l="');
    const lang = li < 0 ? '' : before.slice(li + 8, li + 10);
    if (!['en', 'vi'].includes(lang) || before.slice(li + 10, li + 12) !== '">') continue;
    // số [n] không nằm trong phần tử theo ngôn ngữ (vd tiêu đề sứ mệnh JA chung 3 ngôn ngữ): bỏ qua, không lấy nhầm chữ phía trước
    if (/<\/(p|li|div|h\d)>|<(p|li|div|h\d)\b/.test(before.slice(li))) continue;
    const txt = before.slice(li + 12).replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const keys = m[1].split(',').map((n) => refs[n]);
    ok(keys.every(Boolean), `#${id}: số trích dẫn [${m[1]}] không trỏ tới nguồn trong REFS`);
    claims.push({ id, lang, txt, keys: keys.filter(Boolean) });
  }
}
ok(claims.length >= 440, `chỉ đọc được ${claims.length} câu EN + VI có trích dẫn (mong >= 440)`);

// 1) mỗi nguồn được trích có đoạn nguyên văn
const used = new Set(claims.flatMap((c) => c.keys));
for (const k of used) ok(Array.isArray(QUOTES[k]) && QUOTES[k].length >= 1, `nguồn "${k}" chưa có đoạn nguyên văn trong tools/ap/quotes.mjs`);
for (const [k, qs] of Object.entries(QUOTES)) {
  ok(REFS[k], `quotes.mjs có khoá "${k}" không nằm trong REFS`);
  for (const q of qs) ok(typeof q === 'string' && q.length >= 8 && q.length <= 320, `đoạn trích "${k}" dài bất thường (${q.length}): ${String(q).slice(0, 40)}`);
}
ok(existsSync(QUOTES_JS) && readFileSync(QUOTES_JS, 'utf8').replace(/\r\n/g, '\n') === quotesJs().replace(/\r\n/g, '\n'), 'assets/ap/quotes.js lệch tools/ap/quotes.mjs: chạy node tools/ap/build.mjs');

// 2) cổng chống số bịa
// Ngoại lệ: số là tên riêng / phiên bản / số đếm nội bộ trang, hoặc số do ứng viên tự tính (ghi phép tính)
const ALLOW = [
  [/^(1|2|3|4|5|6|7|8|9|10|20)$/, null, 'số đếm nhỏ của chính trang (bước, nhóm, số sản phẩm liệt kê); KHÔNG miễn khi đứng trước %, năm, ngôn ngữ, giờ, lần'],
  [/^3$/, /\b3D\b/, '3D là tên sản phẩm'],
  [/^2\.0$/, /i-Construction 2\.0/, 'tên chính sách'],
  [/^30$/, /NextGen Tech 30/, 'tên giải'],
  [/^2025$/, /36[.,]6% (of workers|lao động)/, 'tài liệu Nội các: cột R7 (令和7年 = 2025) của biểu đồ tuổi lao động'],
];
const UNIT = /\s*(%|years?|năm|languages?|ngôn ngữ|ngoại ngữ|times|lần|hours?|giờ|h\b|min|phút|x\b|倍)/.source;
const measured = (n, txt) => new RegExp(`(^|[^\\d.,])${String(n).replace('.', '\\.')}${UNIT}`, 'i').test(txt);
const allowed = (n, txt) => ALLOW.some(([re, ctx]) => re.test(String(n)) && (ctx ? ctx.test(txt) : n <= 20 && !measured(n, txt)));
const bad = [];
for (const { id, lang, txt, keys } of claims) {
  const src = new Set(keys.flatMap((k) => (QUOTES[k] || []).flatMap((q) => [...nums(q)])));
  // số lớn được làm tròn khi viết gọn (3,042億7,000万円 = ¥304.3bn): chấp nhận lệch <= 0,05%
  const near = (n) => src.has(n) || (n >= 1e6 && [...src].some((v) => Math.abs(v - n) / n <= 5e-4));
  for (const n of nums(txt, lang === 'vi')) {
    if (near(n) || allowed(n, txt)) continue;
    bad.push(`#${id} ${lang} số ${n} không có trong nguyên văn của [${keys.join(',')}]: "${txt.slice(0, 110)}"`);
  }
}
ok(!bad.length, `số không có dẫn chứng nguyên văn (${bad.length}):\n  - ${[...new Set(bad)].join('\n  - ')}`);

// 3) tooltip trong index.html
ok(/<script src="assets\/ap\/quotes\.js" defer><\/script>/.test(main), 'khối ap thiếu nạp assets/ap/quotes.js');
ok(/\.ap-tip\{/.test(main) && /ap-tip: tooltip/.test(main), 'khối ap thiếu CSS / script tooltip .ap-tip');
ok(/@media print\{\.ap-tip\{display:none/.test(main), 'tooltip phải ẩn khi in');

if (fails.length) { console.error(`FAIL check-ap-quotes (${fails.length}):\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-quotes: ${claims.length} câu EN + VI có trích dẫn, ${used.size} nguồn đều có đoạn nguyên văn; mọi con số khớp nguyên văn nguồn; tooltip nạp đủ`);
