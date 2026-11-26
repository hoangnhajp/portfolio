// Gate tĩnh: tab Sales có slide "sau khi ký hợp đồng" cho MAYEKAWA (#sales-after, máy móc) và JILNESTA (#sales-jil-after, phần mềm),
// slide quy trình bán hàng (#sales-cycle, #sales-jil-flow) mang nhãn "trước khi ký hợp đồng"; mục lục và nhãn eb đánh số 01-12.
// Sinh bằng tools/sales/after.mjs (+ tools/jil/build.mjs). Chạy: node tests/check-sales-after-45aq.mjs, thoát 0 = đạt
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => { const a = html.indexOf(`id="${id}"`); if (a < 0) return ''; const s = html.lastIndexOf('<section', a); return html.slice(s, html.indexOf('</section>', a) + 10); };
const text = (s) => s.replace(/<[^>]+>/g, ' ');

// 1) Thứ tự trong tab Sales
const sm0 = html.indexOf('<main class="wrap" data-view="sales"');
const main = sm0 < 0 ? '' : html.slice(sm0, html.indexOf('</main>', sm0));
const ORDER = ['sales-map', 'sales-cycle', 'sales-after', 'sales-pain', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi',
  'sales-jil-hcm', 'sales-jil-offshore', 'sales-jil-flow', 'sales-jil-after']
  .filter((id) => id !== 'sales-kpi' || html.includes('id="sales-kpi"')); // trang KPI có thể đã được bỏ: số trang dồn theo mục lục
const pos = ORDER.map((id) => main.indexOf(`id="${id}"`));
ok(pos.every((p) => p > 0), 'đủ trang Sales trong tab: ' + ORDER.filter((_, i) => pos[i] <= 0).join(','));
ok(pos.every((p, i) => i === 0 || p > pos[i - 1]), 'thứ tự trang Sales đúng (after nằm ngay sau cycle / jil-flow)');

// 2) Mục lục + nhãn eb 01-12
const nav = (html.match(/<nav class="sb-nav" data-for="sales"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const nums = [...nav.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
const want = ['sales-top:TOP', ...ORDER.map((id, i) => `${id}:${String(i + 1).padStart(2, '0')}`)].join(' ');
ok(nums === want, `mục lục Sales: ${nums}`);
ORDER.forEach((id, i) => ok(sec(id).includes(`<span class="eb rv">${String(i + 1).padStart(2, '0')}　<b>`), `#${id} nhãn eb ${String(i + 1).padStart(2, '0')}`));

// 3) Nhãn giai đoạn hợp đồng
const PH = { 'sales-cycle': 'pre', 'sales-jil-flow': 'pre', 'sales-after': 'post', 'sales-jil-after': 'post' };
for (const [id, p] of Object.entries(PH)) {
  const s = sec(id);
  ok((s.match(/<span class="sph sph--(pre|post) rv"/g) || []).length === 1 && s.includes(`<span class="sph sph--${p} rv"`), `#${id} có đúng 1 nhãn giai đoạn ${p}`);
  ok(s.includes('Trước khi ký hợp đồng') && s.includes('Sau khi ký hợp đồng') && s.includes('契約前') && s.includes('契約後'), `#${id} nhãn giai đoạn đủ chữ ja / vi`);
}
ok(!/class="sph /.test(html.replace(/<section[\s\S]*?<\/section>/g, (s) => Object.keys(PH).some((id) => s.includes(`id="${id}"`)) ? '' : s)), 'nhãn giai đoạn chỉ có ở 4 trang trên');

// 4) Nội dung slide sau ký hợp đồng
const A = sec('sales-after'), J = sec('sales-jil-after');
const has = (s, ws, m) => { const t = text(s); const miss = ws.filter((w) => !t.includes(w)); ok(!miss.length, `${m} thiếu: ${miss.join(', ')}`); };
has(A, ['取扱説明書', '技術チーム', '質問', '定期', '稼働状況', '検収', '四半期',
  'user manuals', 'engineers', 'questions', 'acceptance', 'quarterly',
  'phối hợp', 'đội kỹ thuật', 'tài liệu hướng dẫn', 'giải đáp thắc mắc', 'định kỳ', 'tình hình vận hành của máy', 'nghiệm thu', 'theo quý'], '#sales-after');
has(J, ['使い方', 'バグ', 'サーバー', '開発チーム', '報告',
  'how to use', 'bug', 'server', 'dev team',
  'hướng dẫn', 'sử dụng phần mềm', 'bug', 'server', 'báo cáo đội dev', 'giải đáp thắc mắc'], '#sales-jil-after');
ok(/<p class="colg colg--co[^"]*"><img src="assets\/logos\/mayekawa\.svg"/.test(A), '#sales-after badge MAYEKAWA');
ok(/<p class="colg colg--co colg--jil[^"]*"><img src="assets\/logos\/jilnesta\.png"/.test(J), '#sales-jil-after badge JILNESTA');
for (const [id, s] of [['sales-after', A], ['sales-jil-after', J]]) {
  ok(/<figure class="sa-flow gx gx--flow" aria-hidden="true">/.test(s) && (s.match(/class="gx-st/g) || []).length === 4, `#${id} cảnh động 4 bước`);
  ok((s.match(/<li><img src="assets\/gx\/[\w-]+\.webp"/g) || []).length === 4, `#${id} danh sách 4 việc có icon`);
  for (const l of ['ja', 'en', 'vi']) {
    const m = s.match(new RegExp(`<p class="kw-sub rv"[^>]*data-l="${l}">([^<]*)</p>`));
    ok(m && m[1].length <= 150, `#${id} câu dẫn ${l} có và <= 150 ký tự`);
    ok(s.includes(`<div class="chips" data-l="${l}">`), `#${id} chip ${l}`);
  }
  const n = (l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
  ok(n('ja') > 0 && n('ja') === n('en') && n('en') === n('vi'), `#${id} số nhãn ja/en/vi bằng nhau (${n('ja')}/${n('en')}/${n('vi')})`);
  ok(!/[—–]/.test(s), `#${id} không có gạch ngang dài`);
  // Không lọt chữ của lệnh / ghi chú nội bộ vào portfolio
  for (const w of ['neh1', 'nhé', 'prompt', 'After service', 'Claude', 'task ', 'Task ', 'TODO', 'kiểu như', 'bạn thêm']) ok(!s.includes(w), `#${id} lọt chữ "${w}"`);
  ok(existsSync(join(root, `assets/pg/${id}.webp`)), `ảnh nền assets/pg/${id}.webp`);
  ok(new RegExp(`'${id}'`).test(html.slice(html.indexOf('var IDS='), html.indexOf('];', html.indexOf('var IDS=')))), `IDS pganh có ${id}`);
}
ok((html.match(/id="sales-after"/g) || []).length === 1 && (html.match(/id="sales-jil-after"/g) || []).length === 1, 'mỗi trang mới đúng 1 lần');
ok(/<!-- sales-after-css:start -->[\s\S]*\.sph\{[\s\S]*<!-- sales-after-css:end -->/.test(html), 'khối CSS sales-after-css');

// 5) Build chạy lại không đổi gì (after.mjs và jil/build.mjs, theo cả 2 thứ tự)
{
  const d = mkdtempSync(join(tmpdir(), 'sa45-')), f = join(d, 'index.html');
  for (const seq of [['tools/sales/after.mjs'], ['tools/jil/build.mjs', 'tools/sales/after.mjs'], ['tools/sales/after.mjs', 'tools/jil/build.mjs']]) {
    writeFileSync(f, html);
    try { for (const t of seq) execFileSync(process.execPath, [join(root, t), f], { stdio: 'ignore' }); ok(readFileSync(f, 'utf8') === html, `chạy lại ${seq.join(' + ')} không đổi index.html`); }
    catch (e) { ok(false, `chạy ${seq.join(' + ')} lỗi: ${e.message.split('\n')[0]}`); }
  }
  rmSync(d, { recursive: true, force: true });
}

if (fails.length) { console.error(`FAIL check-sales-after-45aq (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-sales-after-45aq: 2 trang sau ký hợp đồng (MAYEKAWA, JILNESTA), nhãn trước / sau, Sales 01-12');
