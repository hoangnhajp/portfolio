// Task 3yar: người vận hành yêu cầu xoá toàn bộ hình minh hoạ lớn đầu tab AI (figure.sv-hero, cảnh hero-ai nằm giữa phim workflow
// và bảng Tools / Time / Output / Rule). Kiểm: tab ai-top không còn sv-hero / hero-ai; phim workflow và bảng meta vẫn còn;
// tools/gx/build.mjs không còn khai báo cảnh hero-ai (chạy lại build không cấy lại hình, không báo lỗi thiếu chỗ chèn).
// Chạy: node tests/check-ai-hero-removed.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const build = readFileSync(root + 'tools/gx/build.mjs', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const s = (html.match(/<section class="pg"[^>]*\bid="ai-top"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';

ok(s, 'không thấy section ai-top');
ok(!/class="sv-hero/.test(s), 'ai-top: còn figure.sv-hero (hình minh hoạ lớn đầu tab)');
ok(!/hero-ai/.test(html), 'index.html còn cảnh hero-ai');
ok(/<figure class="mv rv"/.test(s), 'ai-top: mất phim workflow (figure.mv), chỉ được xoá hình minh hoạ');
ok(/<div class="meta rv"[\s\S]*<span>Tools<\/span>[\s\S]*<span>Rule<\/span>/.test(s), 'ai-top: mất bảng Tools / Time / Output / Rule');
ok(!/'hero-ai'\s*:/.test(build), 'tools/gx/build.mjs còn khai báo cảnh hero-ai (chạy build sẽ lỗi / cấy lại)');

if (fails.length) { console.error('FAIL check-ai-hero-removed:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-ai-hero-removed: tab AI không còn hình minh hoạ lớn đầu tab, phim workflow và bảng meta giữ nguyên, build không cấy lại');
