// Trang Sales 05 (#sales-pr): phim "từng bước" kiểu Sales cycle (nhân vật salaryman 3D + đạo cụ icon), sinh bằng
// tools/film/step-film.mjs + tools/film/films.mjs, thay cảnh .gx tĩnh cũ. Kiểm tĩnh, không cần Chrome.
// Chạy: node tests/check-sales-pr-film.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { figure, css as filmCss } from '../tools/film/step-film.mjs';
import { FILMS } from '../tools/film/films.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (html.match(/<section class="pg" data-chap="\w+" id="sales-pr">([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'không thấy #sales-pr');

// 1. Thay cảnh .gx tĩnh bằng đúng 1 phim .sf, nằm giữa câu dẫn và khối .meta, có dấu sinh lại
ok(!/<figure class="gx /.test(sec), '#sales-pr còn cảnh .gx tĩnh cũ');
const figs = sec.match(/<figure class="mv sf [^"]*"[\s\S]*?<\/figure>/g) || [];
ok(figs.length === 1, `#sales-pr cần đúng 1 phim .sf, có ${figs.length}`);
const fig = figs[0] || '';
ok(/<!-- sfilm:pr:start -->[\s\S]*<figure class="mv sf [\s\S]*<!-- sfilm:pr:end -->/.test(sec), 'thiếu dấu <!-- sfilm:pr:start/end -->');
ok(sec.indexOf('class="kw-sub') < sec.indexOf('sfilm:pr:start') && sec.indexOf('sfilm:pr:end') < sec.indexOf('<div class="meta'), 'phim phải nằm sau câu dẫn, trước khối .meta');
ok(/\bsf--n6\b/.test(fig) && /--sf-n:6;--sf-t:18s;--sf-s:3s/.test(fig), 'phim cần 6 bước, chu kỳ 18s, khe 3s');
ok(/data-no-zoom/.test(fig), 'phim thiếu data-no-zoom (bấm hình không mở hộp phóng to)');
ok(/<span class="mv-time" aria-hidden="true">18s<\/span>/.test(fig) && /<button class="mv-pp"/.test(fig) && /<div class="mv-bar"/.test(fig), 'thiếu đầu phim (thời lượng, nút dừng) hoặc thanh tiến trình');

// 2. 6 cảnh nhân vật mới (assets/sales/pr), mỗi cảnh 1 chữ bước + 1 nút bước + đạo cụ
// Chuỗi ASEAN theo người vận hành: tài liệu tiếng Anh -> thu thập dữ liệu cùng đội kỹ thuật -> thuyết trình trước chi nhánh các nước
const IMGS = ['pr1-prepare', 'pr-data', 'pr2-present', 'pr4-expo', 'pr5-visit', 'pr6-client'];
for (const w of ['Chuẩn bị hồ sơ tài liệu tiếng Anh', 'Thu thập dữ liệu cùng đội kỹ thuật', 'Thuyết trình tiếng Anh trước ASEAN', 'Gather data with engineers', '技術チームとデータ収集'])
  ok(sec.includes(w), `phim chưa có bước ASEAN "${w}"`);
for (const [i, f] of IMGS.entries()) {
  const p = `assets/sales/pr/${f}.webp`;
  ok(existsSync(root + p), `thiếu ảnh ${p}`);
  if (existsSync(root + p)) { const s = statSync(root + p).size; ok(s > 8000 && s < 120000, `${p} dung lượng lạ ${s}`); }
  ok(new RegExp(`<span class="sf-sc sf-s${i}"><img src="${p}"`).test(fig), `bước ${i + 1}: thiếu cảnh ${p}`);
  ok(new RegExp(`<li class="sf-nd sf-s${i}[ "][^>]*><span class="sf-dt"><img src="${p}"`).test(fig), `bước ${i + 1}: thiếu nút bước`);
  const tx = (fig.match(new RegExp(`<div class="sf-tx sf-s${i}">([\\s\\S]*?)</div>`)) || [])[1] || '';
  ok(new RegExp(`STEP 0${i + 1}`).test(tx), `bước ${i + 1}: thiếu nhãn STEP 0${i + 1}`);
  for (const l of ['ja', 'en', 'vi']) {
    ok(new RegExp(`<b class="sf-tt" data-l="${l}">[^<]{2,}</b>`).test(tx), `bước ${i + 1}: thiếu tên bước ${l}`);
    ok(new RegExp(`<p class="sf-ds" data-l="${l}">[^<]{8,}</p>`).test(tx), `bước ${i + 1}: thiếu câu mô tả ${l}`);
  }
  const fx = (fig.match(new RegExp(`<span class="sf-fx sf-s${i}" aria-hidden="true">([\\s\\S]*?)</span>`)) || [])[1] || '';
  ok((fx.match(/<i class="sf-p sf\w+/g) || []).length >= 3, `bước ${i + 1}: cần >= 3 đạo cụ động`);
}
ok((fig.match(/class="sf-nd /g) || []).length === 6 && /sf-nd sf-s5 sf-last/.test(fig), 'thanh bước cần 6 nút, nút cuối .sf-last');
ok(/<li class="sf-run" aria-hidden="true"><span class="sf-me"><img src="assets\/sales\/cycle\/man-consult.webp"/.test(fig), 'thiếu người chạy trên thanh bước');
for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<span class="mv-tt" data-l="${l}">[^<]+</span>`).test(fig), `tiêu đề phim thiếu ${l}`);
// Nội dung đúng sự việc của trang (ảnh sự kiện bên dưới)
for (const w of ['ASEAN', 'PROPAK ASIA', 'VIV ASIA', 'MYCOM KOREA', 'Long An']) ok(fig.includes(w), `phim chưa nhắc ${w}`);
ok(!/—/.test(fig), 'phim có dấu gạch ngang dài');
// Ảnh dòng sự kiện giữ nguyên 10 mục
ok((sec.match(/<li><span class="ev-n">/g) || []).length === 10, 'dòng sự kiện ảnh phải giữ 10 mục');

// 3. CSS: khối sfilm-css, chỉ transform / opacity, chạy khi .pg.in, dùng chung chu kỳ, reduced-motion, màn hẹp
const css = (html.match(/<!-- sfilm-css:start -->([\s\S]*?)<!-- sfilm-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- sfilm-css:start -->') < html.indexOf('</head>'), 'thiếu khối <!-- sfilm-css --> trong <head>');
const kfs = [...css.matchAll(/@keyframes (\w+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)];
ok(kfs.length >= 6 * 3 + 1 + 18, `cần >= 37 keyframes (6 bước x 3 + người chạy + 18 đạo cụ), có ${kfs.length}`);
for (const [, name, body] of kfs) {
  const props = [...body.matchAll(/([a-z-]+):/g)].map((m) => m[1]).filter((p) => !['transform', 'opacity'].includes(p));
  ok(!props.length, `@keyframes ${name} đổi thuộc tính nặng: ${[...new Set(props)].join(',')}`);
}
for (let i = 0; i < 6; i++) ok(css.includes(`html.js .pg.in .sf--n6 .sf-sc.sf-s${i}`) && css.includes(`sfN6S${i} var(--sf-t)`), `bước ${i + 1}: thiếu animation theo khe dùng --sf-t`);
ok(/html\.js \.pg\.in \.sf--n6 \.sf-run\{animation:sfN6Me var\(--sf-t\)/.test(css), 'người chạy chưa dùng chung chu kỳ --sf-t');
ok(!/var\(--n\)|[;{(]--n:/.test(css) && /repeat\(var\(--sf-n\)/.test(css), 'dùng --sf-n (trang đã đăng ký @property --n inherits:false cho bộ đếm gx, --n không truyền xuống con)');
ok(/@media \(prefers-reduced-motion:reduce\)\{\.sf \*\{animation:none!important\}\}/.test(css), 'thiếu reduced-motion');
ok(/@media screen and \(max-width:700px\)\{[\s\S]*\.sf-stage\{grid-template-columns:1fr/.test(css), 'thiếu bố cục dọc màn hẹp');
ok(/\.sf-nd:not\(\.sf-last\)::after\{[^}]*left:calc\(50% \+ 27px\);width:calc\(100% - 54px\)/.test(css), 'đường nối phải là nét đứt từng cặp icon (không xuyên icon)');

// 3b. Trang khớp đúng đầu ra bộ sinh (sửa tay khối sfilm sẽ bị xoá ở lần chạy lại, nên chặn ở đây)
const norm = (t) => t.replace(/\r\n/g, '\n').trim();
ok(norm(css.replace(/^\s*<style id="sfilm-css">/, '').replace(/<\/style>\s*$/, '')) === norm(filmCss(FILMS)), 'khối sfilm-css khác đầu ra bộ sinh: chạy lại node tools/film/step-film.mjs, đừng sửa tay');
ok(norm(fig) === norm(figure(FILMS.find((f) => f.key === 'pr'))), 'phim #sales-pr khác đầu ra bộ sinh: chạy lại node tools/film/step-film.mjs, đừng sửa tay');

// 4. Bộ sinh + cảnh .gx cũ đã gỡ khỏi tools/gx/build.mjs (chạy lại gx không chèn lại)
ok(existsSync(root + 'tools/film/step-film.mjs') && existsSync(root + 'tools/film/films.mjs'), 'thiếu bộ sinh tools/film');
ok(!/'sales-pr':\s*\{/.test(readFileSync(root + 'tools/gx/build.mjs', 'utf8')), "tools/gx/build.mjs còn cảnh 'sales-pr'");

if (fails.length) { console.error(`FAIL check-sales-pr-film (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
console.log('PASS check-sales-pr-film: #sales-pr có phim 6 bước 18s (6 cảnh salaryman mới + đạo cụ, chữ 3 ngôn ngữ, người chạy), CSS chỉ transform/opacity, reduced-motion, màn hẹp, bộ sinh tools/film');
