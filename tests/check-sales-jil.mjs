// Gate tĩnh: logo MAYEKAWA nổi bật trên các trang Sales MAYEKAWA + 3 trang JILNESTA cuối tab Sales
// (#sales-jil-hcm bản đồ TP.HCM, #sales-jil-offshore bản đồ Việt Nam / Nhật Bản, #sales-jil-flow phim salaryman 8 bước).
// Sinh bằng tools/jil/build.mjs. Chạy: node tests/check-sales-jil.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };
const sec = (id) => { const a = html.indexOf(`id="${id}"`); if (a < 0) return ''; const s = html.lastIndexOf('<section', a); return html.slice(s, html.indexOf('</section>', a) + 10); };

// 1) Logo MAYEKAWA nổi bật trên mọi trang Sales của MAYEKAWA, logo JILNESTA trên 3 trang mới
const MYC = ['sales-top', 'sales-map', 'sales-cycle', 'sales-pain', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi', 'sales-flow'];
for (const id of MYC) {
  const s = sec(id);
  ok(/<p class="colg colg--co[^"]*"><img src="assets\/logos\/mayekawa\.svg" alt="MAYEKAWA \(MYCOM\)"/.test(s), `#${id} có badge logo MAYEKAWA`);
}
ok(/<p class="colg rv"><img src="assets\/logos\/mayekawa\.svg"/.test(sec('w-mycom')) && /#w-mycom>\.colg img\{height:40px/.test(html), '#w-mycom logo MAYEKAWA phóng to (40px)');
ok(/\.colg--co\{[^}]*\}/.test(html) && /\.colg--co img\{[^}]*height:3\dpx/.test(html), 'CSS badge logo cao >= 30px');

// 2) Ba trang JILNESTA: thứ tự, mục lục, số eb, 3 ngôn ngữ, logo
const JIL = [['sales-jil-hcm', '09'], ['sales-jil-offshore', '10'], ['sales-jil-flow', '11']];
const sm0 = html.indexOf('<main class="wrap" data-view="sales"');
const salesMain = html.slice(sm0, html.indexOf('</main>', sm0));
let last = salesMain.indexOf('id="sales-flow"');
for (const [id, n] of JIL) {
  const s = sec(id), at = salesMain.indexOf(`id="${id}"`);
  ok(at > last, `#${id} nằm trong tab Sales, sau trang trước`); last = at;
  ok(new RegExp(`<a href="#${id}" data-sec="${id}"><em>${n}</em>`).test(html), `mục lục Sales có ${n} -> #${id}`);
  ok(s.includes(`<span class="eb rv">${n}　<b>`), `#${id} nhãn eb ${n}`);
  ok(/<p class="colg colg--co[^"]*"><img src="assets\/logos\/jilnesta\.png" alt="JILNESTA"/.test(s), `#${id} có badge logo JILNESTA`);
  for (const l of ['ja', 'en', 'vi']) {
    const m = s.match(new RegExp(`<p class="kw-sub rv"[^>]*data-l="${l}">([^<]*)</p>`));
    ok(m && m[1].length <= 150, `#${id} câu dẫn ${l} có và <= 150 ký tự`);
    ok(s.includes(`<div class="chips" data-l="${l}">`), `#${id} chip ${l}`);
  }
  ok(!/[—]/.test(s), `#${id} không có dấu gạch ngang dài`);
  ok(existsSync(join(root, `assets/pg/${id}.webp`)), `ảnh nền assets/pg/${id}.webp`);
  ok(new RegExp(`'${id}'`).test(html.slice(html.indexOf('var IDS='), html.indexOf('];', html.indexOf('var IDS=')))), `IDS pganh có ${id}`);
}

// 3) Bản đồ TP.HCM: ranh giới thật, văn phòng ở giữa, 4 công ty IT + 4 cửa hàng, cung + mũi tên
const h = sec('sales-jil-hcm');
ok(/<figure class="mv jlmap rv"/.test(h), 'phim bản đồ .jlmap');
ok((h.match(/<path class="sm-vn" d="M/g) || []).length === 2, '2 khung bản đồ có ranh giới TP.HCM');
ok((h.match(/class="jl-off"/g) || []).length === 2, 'ghim văn phòng JILNESTA ở cả 2 khung');
ok((h.match(/class="sm-pt jl-it /g) || []).length === 4, '4 điểm công ty IT');
ok((h.match(/class="sm-pt jl-shop /g) || []).length === 4, '4 điểm cửa hàng');
ok((h.match(/<g class="sm-arc jl-k\d">/g) || []).length === 8, '8 cung tỏa ra từ văn phòng');
ok((h.match(/class="sm-ah"/g) || []).length === 8, '8 mũi tên');
ok((h.match(/class="mv-cap jl-c[123]"/g) || []).length === 9, '3 phụ đề x 3 ngôn ngữ');

// 4) Bản đồ offshore: Việt Nam | cầu nối remote | Nhật Bản
const o = sec('sales-jil-offshore');
ok(/<figure class="mv jloff rv"/.test(o), 'phim offshore .jloff');
ok(/<div class="sm-pn jl-pn--vn">/.test(o) && /<div class="jl-br"/.test(o) && /<div class="sm-pn jl-pn--jp">/.test(o), 'bố cục VN | cầu nối | Nhật');
ok(/<path class="sm-vn" d="M/.test(o) && /<path class="sm-vn jl-jp" d="M/.test(o), 'đường bờ Việt Nam và Nhật Bản');
ok(/class="sm-isl"/.test(o) && o.includes('Quần đảo Hoàng Sa') && o.includes('Quần đảo Trường Sa'), 'có Hoàng Sa, Trường Sa');
ok((o.match(/class="sm-pt jl-cl /g) || []).length === 3, '3 điểm khách hàng Nhật');
ok((o.match(/class="jl-dot"/g) || []).length >= 5, 'chấm chạy trên cầu nối');

// 5) Phim salaryman 8 bước
const f = sec('sales-jil-flow');
ok(/<figure class="mv sf sf--n8 sf--jil rv"/.test(f), 'phim từng bước 8 bước (.sf--n8)');
ok((f.match(/<span class="sf-sc sf-s\d"><img src="assets\/sales\/jil\/jil\d-[a-z]+\.webp"/g) || []).length === 8, '8 cảnh salaryman');
ok(/@keyframes sfN8S7\{/.test(html) && /\.sf--n8 \.sf-run\{animation:sfN8Me/.test(html), 'có keyframes cho phim 8 bước');
for (const k of ['ソフトウェア', 'phần mềm hóa', 'đặc tả kỹ thuật', 'customize', 'nghiệm thu', 'công nợ', 'Telesales']) ok(f.includes(k), `phim có nội dung "${k}"`);

// 6) Ảnh dùng trong 3 trang đều có thật
for (const [id] of JIL) for (const m of sec(id).matchAll(/src="(assets\/[^"]+)"/g)) if (!existsSync(join(root, m[1]))) ok(false, `#${id} thiếu ảnh ${m[1]}`);

// 7) CSS chuyển động: chỉ transform / opacity, chạy khi .pg.in, reduced-motion, print, màn hẹp
const cm = html.match(/<!-- sales-jil-css:start -->([\s\S]*?)<!-- sales-jil-css:end -->/);
ok(!!cm, 'có khối CSS sales-jil-css');
const css = cm ? cm[1] : '';
const kfs = [...css.matchAll(/@keyframes (jl\w+)\{((?:[^{}]*\{[^}]*\})*)\}/g)];
ok(kfs.length >= 10, `keyframes jl* (${kfs.length})`);
ok(kfs.every((k) => [...k[2].matchAll(/\{([^}]*)\}/g)].every((b) => b[1].split(';').filter(Boolean).every((p) => /^(opacity|transform)\s*:/.test(p.trim())))), 'keyframes chỉ opacity / transform');
ok(/html\.js \.pg\.in \.jlmap/.test(css) && /html\.js \.pg\.in \.jloff/.test(css), 'animation chỉ chạy khi trang hiện');
ok(/prefers-reduced-motion:reduce\)\{[^}]*\.jlmap \*/.test(css), 'reduced-motion tắt animation');
ok(/@media print/.test(css) && /max-width:600px/.test(css), 'có nhánh in và màn hẹp');

// Bản đồ JILNESTA cùng kiểu #sales-map: không có chữ "phóng to" (như check-sales-map-no-zoom-word); đủ cặp nhãn ja/en/vi
for (const id of ['sales-jil-hcm', 'sales-jil-offshore', 'sales-jil-flow']) {
  const t = sec(id).replace(/<[^>]+>/g, ' ');
  for (const w of ['phóng to', '拡大', 'zoomed']) ok(!t.includes(w), `#${id} không có chữ "${w}"`);
  const n = (l) => (sec(id).match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
  ok(n('ja') > 0 && n('ja') === n('en') && n('en') === n('vi'), `#${id} số nhãn ja/en/vi bằng nhau (${n('ja')}/${n('en')}/${n('vi')})`);
}

// Build chạy lại trên bản sao không đổi gì (không nhân đôi khối, badge, mục lục, IDS; index.html đã build mới nhất)
{
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const d = mkdtempSync(join(tmpdir(), 'sjb-')), f = join(d, 'index.html');
  writeFileSync(f, html);
  execFileSync(process.execPath, [join(root, 'tools/jil/build.mjs'), f], { stdio: 'ignore' });
  ok(readFileSync(f, 'utf8') === html, 'tools/jil/build.mjs chạy lại không đổi index.html');
  rmSync(d, { recursive: true, force: true });
}

console.log(fail ? `\n${fail} FAIL` : '\nALL PASS');
process.exit(fail ? 1 : 0);
