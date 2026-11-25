// Task xkp6: bỏ TOEIC trên TOÀN BỘ trang (meta description, chip hero, chứng chỉ My Profile, Thông tin cơ bản, ô Ngoại ngữ),
// cả JA / EN / VI. JLPT N2 giữ nguyên; tiếng Anh ghi "ビジネス英語 / Business English / tiếng Anh công việc" như tab Languages (task bg9f).
// Chạy: node tests/check-no-toeic.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const hits = [...html.matchAll(/TOEIC/gi)].map((m) => html.slice(0, m.index).split('\n').length);
ok(hits.length === 0, `index.html còn TOEIC ở dòng ${hits.join(', ')}`);
ok(!/680\s*(点|điểm)/.test(html), 'còn điểm 680');

const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
ok(desc && desc.includes('JLPT N2'), 'meta description phải còn JLPT N2');

ok(html.includes('日本語能力試験 N2 合格'), 'mục chứng chỉ phải còn JLPT N2 (JA)');
ok(html.includes('英語（ビジネス英語）'), 'Thông tin cơ bản JA thiếu 英語（ビジネス英語）');
ok(html.includes('English (business)'), 'Thông tin cơ bản EN thiếu English (business)');
ok(html.includes('tiếng Anh (công việc)'), 'Thông tin cơ bản VI thiếu tiếng Anh (công việc)');

if (fails.length) { console.error(`FAIL check-no-toeic (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-toeic: index.html không còn TOEIC ở đâu, JLPT N2 giữ nguyên, tiếng Anh ghi trình độ công việc (JA/EN/VI)');
