// Portfolio là sản phẩm công khai: KHÔNG được mang bất kỳ vết nào của quy trình làm việc nội bộ
// (lời giao việc, câu trả lời / báo cáo của trợ lý, mã việc, đường dẫn máy nội bộ, tên skill), kể cả trong mã nguồn
// (GitHub Pages phát nguyên văn index.html, ai bấm "Xem nguồn trang" cũng đọc được comment).
// Kiểm:
// (1) comment HTML / CSS của index.html: 0 comment mang vết nội bộ (mốc build <!-- ten:start/end --> được giữ);
// (2) phần còn lại của index.html (chữ hiển thị, thuộc tính, từ điển dịch trong script): 0 cụm hội thoại / báo cáo nội bộ;
// (3) các bộ sinh HTML (tools/*/build.mjs) không phát lại comment mang mã việc vào trang.
// Chạy: node tests/check-no-harness-leak.mjs [index.html]   (thoát 0 = đạt)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findHarness, outsideScripts, HARNESS_RX } from '../tools/clean-harness.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2] || `${root}index.html`, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// (1) comment trong mã nguồn
const hits = findHarness(html);
ok(hits.length === 0, `${hits.length} comment mang vết nội bộ, ví dụ: ${hits.slice(0, 3).map((h) => h.slice(0, 80).replace(/\s+/g, ' ')).join(' | ')}`);

// (2) phần không phải comment: chữ hiển thị + thuộc tính + chuỗi trong script
const body = outsideScripts(html, (seg) => seg.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' '));
const BANNED = [
  // vai và công cụ của quy trình giao việc
  /\bharness\b/i, /leader-flow|delegate\.mjs|c\x6caude-worker\d|PROGRESS\.md|HANDOFF\.md/i, /\bgoal-gate\b/i,
  /người vận hành|運用者|オペレーター/, /CẦN NGƯỜI VẬN HÀNH|Quyết định tự chọn|Kết luận: (?:ĐẠT|CHƯA ĐẠT)/,
  /Yêu cầu nguyên văn|PLAN task|BÁO CÁO THÀNH PHẨM/,
  // mã việc nội bộ (task + 4 ký tự có chữ số) hoặc mã ngày giờ của task
  /\b[Tt]ask\s+(?=[a-z]*\d)[0-9a-z]{4}\b/, /\b2026\d{4}-\d{6}-[0-9a-z]{4}\b/,
  // giọng trợ lý trả lời / báo cáo cho người giao việc
  /Mình đã (?:giao|so|tự chạy|gộp)|Bạn bấm Ctrl\+F5|Ctrl\+F5 để xem|khi task xong|câu trả lời của AI|prompt (?:người|ng) gửi/i,
  /\b(?:I|I've) (?:have )?(?:assigned|delegated) (?:this|the task)|As an AI (?:language )?model|Here is the (?:updated|revised) /,
  // đường dẫn máy nội bộ, tên skill nội bộ
  /[A-Z]:\\(?:Application|Users|Gprflexeye)/, /\.claude[\\/]/, /\bskill (?:nha-revised-cv-apply|media-business-video|media-director|personal-business-portfolio)\b/,
];
for (const rx of BANNED) {
  const m = body.match(rx);
  ok(!m, `còn cụm nội bộ ${rx} → "${m && body.slice(Math.max(0, m.index - 30), m.index + 50).replace(/\s+/g, ' ')}"`);
}

// (3) bộ sinh HTML không phát comment mang mã việc vào trang (dòng comment trong chuỗi mẫu, không phải comment JS của chính tool)
const toolsDir = `${root}tools`;
const gens = existsSync(toolsDir) ? readdirSync(toolsDir, { withFileTypes: true }).filter((d) => d.isDirectory())
  .flatMap((d) => readdirSync(`${toolsDir}/${d.name}`).filter((f) => f.endsWith('.mjs')).map((f) => `tools/${d.name}/${f}`)) : [];
for (const g of gens) {
  readFileSync(`${root}${g}`, 'utf8').split('\n').forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    const c = t.match(/(?:<!--|\/\*)[\s\S]*/);
    if (c && HARNESS_RX.test(c[0].replace(/\/\/.*$/, ''))) fails.push(`${g}:${i + 1} phát comment mang vết nội bộ vào trang`);
  });
}

if (fails.length) { console.error(`FAIL check-no-harness-leak (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-no-harness-leak: 0 comment nội bộ trong mã nguồn, ${BANNED.length} nhóm cụm hội thoại / báo cáo không lọt, ${gens.length} bộ sinh HTML sạch`);
