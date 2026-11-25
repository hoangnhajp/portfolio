// Task 22v8: toàn bộ portfolio không nêu tên riêng công cụ / hãng AI (ChatGPT, Claude, Sesame...).
// Quét index.html (cả chữ hiển thị, alt, title, script, từ điển dịch) và mọi file web trong assets/ + tools/.
// Chạy: node tests/check-no-ai-brand-names.mjs   (thoát 0 = đạt)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BRAND = /chat\s*-?gpt|\bgpt-?\d|\bclaude\b|クロード|se+same|セサミ|openai|anthropic|gemini|copilot|midjourney|perplexity|\bcodex\b|\bgrok\b|deepseek|\bqwen\b/i;
const files = [join(root, 'index.html')];
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(html?|svg|js|mjs|json|css|txt|vtt)$/i.test(n)) files.push(p);
  }
};
for (const d of ['assets', 'tools']) { try { walk(join(root, d)); } catch { /* thư mục không có */ } }

const fails = [];
for (const f of files) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    const m = line.match(BRAND);
    if (m) {
      const at = line.indexOf(m[0]);
      fails.push(`${relative(root, f)}:${i + 1}: "${line.slice(Math.max(0, at - 30), at + 40).trim()}"`);
    }
  });
}
if (fails.length) {
  console.error(`FAIL check-no-ai-brand-names: còn ${fails.length} chỗ nêu tên công cụ AI\n  ` + fails.join('\n  '));
  process.exit(1);
}
console.log(`PASS check-no-ai-brand-names: ${files.length} file web không nêu tên ChatGPT / Claude / Sesame / hãng AI nào`);
