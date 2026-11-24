// Task p0r6: chữ bìa / #projects / #career / #w-mycom theo yêu cầu người vận hành, logo thật của 4 công ty,
// thẻ Sales #w-mycom thành workflow zigzag 7 bước có cục sáng chạy.
// Chạy: node tests/check-career-logos-zigzag.mjs [index.html] (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(process.argv[2] || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sec = (id) => (html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
const h2 = (s, l) => strip((s.match(new RegExp(`<h2[\\s\\S]*?<span data-l="${l}">([\\s\\S]*?)</span>(?=<span data-l|</h2>)`)) || ['', ''])[1]);

// 1. Trang bìa: câu chính mới, không còn câu cũ
const cover = sec('cover');
ok(cover.includes('Vận dụng tư duy và cách làm việc<br />của <span class="gr">người Nhật</span>'), 'bìa VI: chưa có "Vận dụng tư duy và cách làm việc của người Nhật"');
ok(!html.includes('Kết nối khách hàng Nhật và đội ngũ tại chỗ<br />'), 'bìa VI: còn câu cũ "Kết nối khách hàng Nhật và đội ngũ tại chỗ"');
ok(!cover.includes('Connecting Japanese clients and local teams') && !cover.includes('提案と仕組み'), 'bìa EN/JA: còn câu chính cũ');

// 2. #projects: bỏ câu "Mời anh/chị xem qua những công việc tôi đã làm"
const pj = sec('projects');
ok(!html.includes('Mời anh/chị xem qua'), '#projects: còn câu "Mời anh/chị xem qua"');
ok(!/<h2/.test(pj), '#projects: còn tiêu đề h2 (cả 3 ngôn ngữ phải bỏ cùng nhau)');

// 3. #career: "tại công ty Nhật", không còn đếm "3 công ty"; bỏ câu nghỉ việc ở VI / EN
const career = sec('career');
ok(h2(career, 'vi') === 'Tôi có khoảng 11 năm làm việc tại công ty Nhật, trong mảng kinh doanh, IT và nhân sự.', `#career h2 VI sai: "${h2(career, 'vi')}"`);
ok(!h2(career, 'en').includes('three') && !h2(career, 'ja').includes('3社'), '#career h2 EN/JA còn đếm 3 công ty');
ok(!/3 công ty Nhật|three Japanese companies|日系企業3社/.test(html), 'còn đếm "3 công ty Nhật" (bìa / chip / meta phải đồng bộ với #career)');
ok(!/vì lý do cá nhân/.test(html), 'VI: còn câu nghỉ việc 06/2026 vì lý do cá nhân');
ok(!/for personal reasons/.test(career), 'EN: còn "left ... for personal reasons" ở #career');

// 4. Cảnh #career dùng logo thật 4 công ty (đúng thứ tự năm), file tồn tại
const LOGOS = ['lienviet.png', 'isuzu.svg', 'jilnesta.png', 'mayekawa.svg'];
for (const f of LOGOS) ok(existsSync(root + 'assets/logos/' + f), `thiếu file assets/logos/${f}`);
const cfig = (career.match(/<figure class="gx[\s\S]*?<\/figure>/) || [''])[0];
const used = [...cfig.matchAll(/src="assets\/logos\/([^"]+)"/g)].map((m) => m[1]);
ok(used.join() === LOGOS.join(), `cảnh #career cần 4 logo ${LOGOS.join(',')}, đang ${used.join(',') || 'không có'}`);
ok(!/assets\/gx\//.test(cfig), 'cảnh #career còn icon 3D thay vì logo');

// 5. Logo công ty ở góc trái trên mỗi trang Career, ngay trước dòng eyebrow
for (const [id, files] of [['w-mycom', ['mayekawa.svg']], ['w-jil', ['jilnesta.png']], ['w-it', ['jilnesta.png']], ['w-early', ['isuzu.svg', 'lienviet.png']]]) {
  const s = sec(id);
  const m = s.match(/<p class="colg rv">([\s\S]*?)<\/p>\s*<p class="eb rv">/);
  ok(!!m, `#${id}: thiếu logo .colg ngay trước dòng Career`);
  if (m) {
    const srcs = [...m[1].matchAll(/<img src="assets\/logos\/([^"]+)" alt="([^"]+)"/g)];
    ok(srcs.map((x) => x[1]).join() === files.join(), `#${id}: logo cần ${files.join(',')}, đang ${srcs.map((x) => x[1]).join(',')}`);
  }
  ok(s.indexOf('class="colg') < s.indexOf('<figure class="gx'), `#${id}: cảnh gx chen trước logo (build.mjs HEAD thiếu colg)`);
}

// 6. #w-mycom: tiêu đề mới + workflow zigzag 7 bước thay chữ
const my = sec('w-mycom');
ok(h2(my, 'vi') === 'Tôi lắng nghe từng nhu cầu kỹ thuật của khách, và tiếp tục hỗ trợ sau khi bàn giao sản phẩm.', `#w-mycom h2 VI sai: "${h2(my, 'vi')}"`);
ok(!my.includes('Tôi cùng khách chọn thiết bị'), '#w-mycom: còn tiêu đề cũ');
const sales = (my.match(/<span class="lbl">Sales[\s\S]*?(?=<div class="card rv"|<div class="ft")/) || [''])[0];
ok(/<div class="zz" data-zz>/.test(sales), 'thẻ Sales #w-mycom chưa có workflow .zz');
ok(!/<div class="lines"|<div class="kw1"/.test(sales), 'thẻ Sales #w-mycom còn khối chữ (.lines / .kw1)');
const nodes = [...sales.matchAll(/<li class="zz-n" style="--i:(\d)"><b class="zz-d" aria-hidden="true">(\d\d)<\/b><span class="zz-t">([\s\S]*?)<\/span><\/li>/g)];
ok(nodes.length === 7, `workflow cần 7 bước, đang ${nodes.length}`);
nodes.forEach((n, i) => {
  ok(+n[1] === i && +n[2] === i + 1, `bước ${i + 1}: --i / số thứ tự lệch`);
  for (const l of ['ja', 'en', 'vi']) {
    const t = strip((n[3].match(new RegExp(`<span data-l="${l}">([^<]*)</span>`)) || ['', ''])[1]);
    ok(!!t, `bước ${i + 1}: thiếu nhãn ${l}`);
    if (l === 'vi') { const w = t.split(' ').length; ok(w >= 3 && w <= 5, `bước ${i + 1} VI "${t}": ${w} chữ (cần 3 đến 5)`); }
    if (l === 'en') { const w = t.split(' ').length; ok(w >= 2 && w <= 5, `bước ${i + 1} EN "${t}": ${w} từ (cần 2 đến 5)`); }
    if (l === 'ja') ok(t.length <= 13, `bước ${i + 1} JA "${t}" dài quá 13 ký tự`);
  }
});
for (const s of ['クレーム', 'complaint', 'khiếu nại', '提案書', 'ASEAN']) ok(sales.includes(s), `workflow Sales mất dữ kiện "${s}"`);

// 7. Khối CSS / JS: đúng 1 lần, chạy theo khung nhìn, có reduced-motion, cục sáng đi dọc đường
const css = (html.match(/<!-- zz-css:start -->([\s\S]*?)<!-- zz-css:end -->/g) || []);
const js = (html.match(/<!-- zz:start -->([\s\S]*?)<!-- zz:end -->/g) || []);
ok(css.length === 1 && js.length === 1, `khối zz-css / zz phải có đúng 1 lần (đang ${css.length}/${js.length})`);
const J = js[0] || '';
for (const k of ['IntersectionObserver', 'prefers-reduced-motion', 'getPointAtLength', 'requestAnimationFrame', 'cancelAnimationFrame', 'ResizeObserver', "classList.toggle('on'"])
  ok(J.includes(k), `JS workflow thiếu ${k}`);
ok(/@container \(max-width:560px\)/.test(css[0] || ''), 'CSS workflow thiếu bố cục dọc cho khung hẹp');
ok(!html.includes('—'), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-career-logos-zigzag (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-career-logos-zigzag: bìa / #projects / #career / #w-mycom đúng chữ mới, 4 logo thật (cảnh năm + góc trái 4 trang Career), workflow Sales zigzag 7 bước JA/EN/VI có cục sáng');
