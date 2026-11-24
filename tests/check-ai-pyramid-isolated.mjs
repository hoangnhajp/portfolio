// Task edof: chạy bộ test chữ toàn site trên cây CÔ LẬP = HEAD + đúng phần edof (khối pyr-css, section #ai-pyramid,
// mục lục / số eb / IDS tab AI), để kết quả không bị hunk dở dang của task khác đang sửa cùng index.html làm đỏ.
// Lấy phần edof từ index.html hiện tại theo dấu khối / id, ghép vào HEAD:index.html trong thư mục tạm, chép tests + assets.
// Chạy: node tests/check-ai-pyramid-isolated.mjs   (thoát 0 = đạt). Cần git.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lf = (s) => s.split('\r\n').join('\n'); // lượt khác có thể ghi lại file với CRLF
const cur = lf(readFileSync(join(root, 'index.html'), 'utf8'));
let h = lf(execFileSync('git', ['show', 'HEAD:index.html'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 }));
const take = (re, what) => { const m = cur.match(re); if (!m) throw new Error('index.html hiện tại thiếu ' + what); return m[0]; };
const css = take(/<!-- pyr-css:start -->[\s\S]*?<!-- pyr-css:end -->\n/, 'khối pyr-css');
const sec = take(/<section class="pg" data-chap="V" id="ai-pyramid">[\s\S]*?<\/section>\n/, 'section #ai-pyramid');
const navNew = take(/<nav class="sb-nav" data-for="ai"[\s\S]*?<\/nav>/, 'mục lục tab AI');
const put = (from, to, what) => { if (!h.includes(from)) throw new Error('HEAD thiếu ' + what); h = h.replace(from, to); };
// edof đã commit (6beaf4f) thì HEAD đã chứa đủ phần kim tự tháp: không ghép lại, chỉ chạy bộ test trên HEAD
const inHead = h.includes('id="ai-pyramid"');
if (!inHead) {
put('<!-- zz-css:end -->\n', '<!-- zz-css:end -->\n' + css, 'zz-css:end');
const ai = h.match(/<section class="pg" data-chap="II" id="ai-top">[\s\S]*?<\/section>\n/);
if (!ai) throw new Error('HEAD thiếu #ai-top');
h = h.replace(ai[0], () => ai[0] + sec);
h = h.replace(/<nav class="sb-nav" data-for="ai"[\s\S]*?<\/nav>/, () => navNew);
put('<span class="eb rv">01　<b>MY WORKFLOW</b>', '<span class="eb rv">02　<b>MY WORKFLOW</b>', 'eb ai-approach');
put('<span class="eb rv">02　<b>WHERE I USE AI</b>', '<span class="eb rv">03　<b>WHERE I USE AI</b>', 'eb ai-uses');
put('<span class="eb rv">03　<b>TIME FOR PEOPLE</b>', '<span class="eb rv">04　<b>TIME FOR PEOPLE</b>', 'eb ai-people');
put("'ai-top','ai-approach',", "'ai-top','ai-pyramid','ai-approach',", 'IDS pganh');
}

const dir = mkdtempSync(join(tmpdir(), 'edof-'));
let fails = 0; const out = [];
try {
  execFileSync('git', ['archive', '--format=tar', '-o', join(dir, 'head.tar'), 'HEAD'], { cwd: root });
  execFileSync('tar', ['-xf', 'head.tar'], { cwd: dir });
  writeFileSync(join(dir, 'index.html'), h);
  // test + ảnh của edof (bản hiện tại); test cũ giữ bản HEAD trừ 2 file edof đã sửa
  for (const f of ['check-ai-pyramid.mjs', 'check-team-ai-tabs.mjs']) cpSync(join(root, 'tests', f), join(dir, 'tests', f));
  cpSync(join(root, 'assets', 'pg', 'ai-pyramid.webp'), join(dir, 'assets', 'pg', 'ai-pyramid.webp'));
  const tests = readdirSync(join(dir, 'tests')).filter((f) => /^check-.*\.mjs$/.test(f) && f !== 'check-ai-pyramid-isolated.mjs');
  for (const f of tests) {
    try { execFileSync(process.execPath, [join(dir, 'tests', f)], { cwd: dir, stdio: 'pipe' }); }
    catch (e) { fails++; out.push(`FAIL ${f}: ${String(e.stderr || e.stdout).trim().split('\n').slice(0, 4).join(' | ')}`); }
  }
  if (fails) { console.error(`FAIL check-ai-pyramid-isolated: ${fails}/${tests.length} test đỏ trên HEAD + edof\n` + out.join('\n')); process.exitCode = 1; }
  else console.log(`PASS check-ai-pyramid-isolated: ${tests.length}/${tests.length} test check-*.mjs xanh trên HEAD + phần edof (không lẫn hunk task khác)`);
} finally { rmSync(dir, { recursive: true, force: true }); }
