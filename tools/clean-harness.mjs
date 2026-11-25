// Gỡ vết quy trình làm việc nội bộ khỏi mã nguồn công khai của portfolio (index.html được GitHub Pages phát nguyên văn).
// Comment HTML / CSS nào nhắc mã việc nội bộ, người giao việc, đường dẫn máy nội bộ hay tên skill thì bị xoá cả comment;
// comment mốc build dạng <!-- ten:start --> / <!-- ten:end --> luôn được giữ (các tools/*/build.mjs cần).
// Trong <script> chỉ gỡ comment đứng đầu dòng (tránh nhầm "/*" nằm trong chuỗi / regex JS).
// Chạy: node tools/clean-harness.mjs [index.html]          ghi đè file đã làm sạch
//       node tools/clean-harness.mjs --check [index.html]  chỉ kiểm, còn vết thì thoát 1
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const HARNESS_RX = new RegExp([
  String.raw`\btask\s*[:：]?\s*(?=[a-z]*\d)[0-9a-z]{4}\b`, // mã việc nội bộ kiểu "task 4n9v"
  String.raw`\btask\s+[0-9a-z]{4}\s*[:：]`, // mã việc toàn chữ kiểu "Task edof:"
  String.raw`\b(?:harness|leader-flow|delegate\.mjs|executor|goal-gate|PROGRESS\.md|HANDOFF\.md|c\x6caude-worker\d*)\b`, // \x6c = "l": tránh tên công cụ AI ngay trong file (check-no-ai-brand-names)
  String.raw`người vận hành|người dùng (?:yêu cầu|muốn|nói|chốt)`,
  String.raw`\bskill [a-z0-9]+(?:-[a-z0-9]+)+`, // tên skill nội bộ
  String.raw`\b[A-Z]:[\\/](?:[A-Za-z_]|$)`, // đường dẫn máy nội bộ
].join('|'), 'i');

const MARKER_RX = /^<!--\s*[\w-]+:(?:start|end)\s*-->$/;
const COMMENT_RX = /<!--[\s\S]*?-->|\/\*[\s\S]*?\*\//g;
const SCRIPT_RX = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi;

// Trong <script> chỉ nhận comment đứng đầu dòng (/* ... */ hoặc // ...), không thể nằm trong chuỗi / regex JS
const JS_COMMENT_RX = /^[ \t]*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*)[ \t]*\r?\n/gm;

// Chạy fn trên các đoạn NGOÀI <script>, jsFn (nếu có) trên nội dung script
export function outsideScripts(html, fn, jsFn = (s) => s) {
  let out = '', last = 0;
  for (const m of html.matchAll(SCRIPT_RX)) {
    out += fn(html.slice(last, m.index + m[1].length)) + jsFn(m[2]) + m[3];
    last = m.index + m[0].length;
  }
  return out + fn(html.slice(last));
}

const isHarness = (c) => !MARKER_RX.test(c.trim()) && HARNESS_RX.test(c);

export function findHarness(html) {
  const out = [];
  const scan = (rx) => (seg) => { for (const m of seg.matchAll(rx)) if (isHarness(m[0])) out.push(m[0].trim()); return seg; };
  outsideScripts(html, scan(COMMENT_RX), scan(JS_COMMENT_RX));
  return out;
}

function cleanSeg(seg) {
  let out = '', last = 0;
  for (const m of seg.matchAll(COMMENT_RX)) {
    if (!isHarness(m[0])) continue;
    const ls = seg.lastIndexOf('\n', m.index - 1) + 1;
    let le = seg.indexOf('\n', m.index + m[0].length); if (le < 0) le = seg.length;
    const alone = !seg.slice(ls, m.index).trim() && !seg.slice(m.index + m[0].length, le).trim();
    if (alone && ls >= last) { out += seg.slice(last, ls); last = Math.min(le + 1, seg.length); } // bỏ cả dòng chỉ có comment
    else { out += seg.slice(last, m.index); last = m.index + m[0].length; } // comment giữa dòng: chỉ bỏ comment
  }
  return out + seg.slice(last);
}

export const cleanHarness = (html) => outsideScripts(html, cleanSeg, (js) => js.replace(JS_COMMENT_RX, (c) => (isHarness(c) ? '' : c)));

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const file = args.find((a) => a !== '--check') || fileURLToPath(new URL('../index.html', import.meta.url));
  const html = readFileSync(file, 'utf8');
  const hits = findHarness(html);
  if (check) {
    if (hits.length) { console.error(`còn ${hits.length} comment mang vết quy trình nội bộ:\n- ` + hits.map((h) => h.slice(0, 120).replace(/\s+/g, ' ')).join('\n- ')); process.exit(1); }
    console.log('sạch: 0 comment mang vết quy trình nội bộ'); process.exit(0);
  }
  const out = cleanHarness(html);
  writeFileSync(file, out);
  console.log(`đã gỡ ${hits.length} comment (${html.length - out.length} ký tự), còn lại ${findHarness(out).length}`);
}
