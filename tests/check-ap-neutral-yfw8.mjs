// Task yfw8: tab Andpad Info chỉ SO SÁNH thế mạnh / hạn chế, không dùng từ khẳng định thắng thua
// (勝ち負け, 独走, 首位, 追われる / wins, rivals lead, No.1 / thắng, thua, bị đuổi, dẫn đầu, đối thủ...).
// Bản tiếng Việt dùng thuật ngữ trang trọng kiểu báo cáo doanh nghiệp (thế mạnh, hạn chế, sản phẩm cạnh tranh, chi phí khởi đầu).
// Phạm vi: chữ hiển thị trong <!-- ap:start/end --> + menu sidebar data-for="ap" (gồm title / aria-label). Trích dẫn nguyên văn nguồn (assets/ap/quotes.js) không kiểm.
// Chạy: node tests/check-ap-neutral-yfw8.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const main = (html.match(/<!-- ap:start -->([\s\S]*?)<!-- ap:end -->/) || [])[1] || '';
const nav = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
ok(main && nav, 'không tìm thấy khối ap:start/end hoặc menu data-for="ap"');

const src = main + nav;
const lang = (l) => [...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2].replace(/<[^>]+>/g, ' ')).join(' \n ');
const attrs = [...src.matchAll(/\b(?:title|aria-label)="([^"]*)"/g)].map((m) => m[1]).join(' \n ');
const kick = [...src.matchAll(/<span class="(?:eb|kw-en)\b[^"]*"[^>]*>([\s\S]*?)<\/span>(?!<\/b>)/g)].map((m) => m[1].replace(/<[^>]+>/g, ' ')).join(' \n ');
const svgText = [...src.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).join(' \n ');
const hit = (txt, re) => [...txt.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'))].map((m) => txt.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25).replace(/\s+/g, ' '));

const RULES = {
  // 大勝 là tên công ty (Daikatsu), không phải "thắng"
  ja: /(?<!大)勝|負け|独走|首位|追われ|ナンバーワン|No\.\s?1/,
  en: /\bwins?\b|\bwinning\b|\blos(e|es|ing)\b|\brivals?\b|ANDPAD leads|\bleads on\b|where it does not|press on|alone covers|No\.\s?1/i,
  vi: /\bthắng\b|\bthua\b|bị đuổi|dẫn đầu|đứng đầu|đánh bại|áp đảo|độc tôn|một mình|đối thủ|Số 1|No\.\s?1|Giá dễ vào|Sâu một khâu|lâu quen|khó học/i,
};
for (const [l, re] of Object.entries(RULES)) {
  const h = hit(lang(l), re);
  ok(!h.length, `${l}: còn từ thắng thua / thiếu trang trọng (${h.length}): ${h.slice(0, 6).join(' | ')}`);
}
// Nhãn không theo ngôn ngữ: kicker tiếng Anh, chữ SVG, title / aria-label
const shared = [kick, svgText, attrs].join(' \n ');
const hs = hit(shared, /WINS|\bwins?\b|\brivals?\b|No\.\s?1|ANDPAD leads|only ANDPAD/i);
ok(!hs.length, `kicker / SVG / title còn từ thắng thua: ${hs.slice(0, 6).join(' | ')}`);
// Thanh "No.1" kiểu huy hiệu tự khen phải bỏ
ok(!/<b>No\.1<\/b>/.test(main), 'còn huy hiệu <b>No.1</b> ở #ap-vs-scale');

// Vẫn là trang SO SÁNH thế mạnh / hạn chế (không xoá nội dung so sánh)
const vi = lang('vi');
for (const k of ['Thế mạnh', 'Hạn chế', 'sản phẩm cạnh tranh', 'Chi phí khởi đầu']) ok(new RegExp(k, 'i').test(vi), `VI cần thuật ngữ so sánh "${k}"`);
const ja = lang('ja');
for (const k of ['強み', '留意点']) ok(ja.includes(k), `JA cần "${k}"`);
const en = lang('en');
for (const k of ['Strengths', 'competitors']) ok(new RegExp(k, 'i').test(en), `EN cần "${k}"`);

if (fails.length) { console.error(`FAIL check-ap-neutral-yfw8 (${fails.length}):\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-neutral-yfw8: tab Andpad Info chỉ so sánh thế mạnh / hạn chế, không từ thắng thua; VI dùng thuật ngữ trang trọng');
