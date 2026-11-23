// motion-all (task bye2): phần còn tĩnh bên trong khối chuyển động như video. Kiểm tĩnh trên index.html (hoặc file truyền vào):
// khối <!-- motion-all:start/end --> có đủ CSS + JS cho biểu đồ tự vẽ, chấm sáng chạy, ảnh Ken Burns, dòng sự kiện, icon gx trôi, số đếm lên;
// có dừng khi ra khỏi màn hình, reduced-motion và bản in tĩnh; chỉ có 1 khối; không đụng ảnh kỹ năng / icon ic-* (task v3c1).
// Chạy: node tests/check-motion-all.mjs [đường dẫn html]   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
const html = readFileSync(file, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const starts = html.split('<!-- motion-all:start -->').length - 1;
ok(starts === 1, `cần đúng 1 khối <!-- motion-all:start --> (đang có ${starts})`);
const block = (html.match(/<!-- motion-all:start -->([\s\S]*?)<!-- motion-all:end -->/) || [])[1] || '';
ok(block, 'thiếu khối motion-all');
const css = (block.match(/<style id="mo-css">([\s\S]*?)<\/style>/) || [])[1] || '';
const js = (block.match(/<script id="mo-js">([\s\S]*?)<\/script>/) || [])[1] || '';
ok(css && js, 'khối motion-all phải có <style id="mo-css"> và <script id="mo-js">');

// Mỗi loại chuyển động: bộ chọn JS + keyframes CSS
const KINDS = [
  ['biểu đồ: cột mọc', /\.ch svg/, /@keyframes moG[xy]/],
  ['biểu đồ: đường tự vẽ', /pathLength/, /@keyframes moDraw/],
  ['biểu đồ: chấm sáng chạy dọc đường (lặp)', /mo-run/, /\.mo-run\{[^}]*animation:moRun[^}]*infinite/],
  ['ảnh công tác: Ken Burns (lặp)', /\.evrow img,#sales-trips figure>img/, /moKb 16s[^;}]*infinite/],
  ['dòng sự kiện: chấm mốc sáng lần lượt (lặp)', /Q\('\.evrow'\)/, /moTick 6s[^;}]*infinite/],
  ['icon cảnh gx: trôi nhẹ (lặp)', /./, /\.gx-tag \.gx-pl img,html\.js \.gx-tile \.gx-pl img\{animation:gxFloat[^}]*infinite/],
  ['số liệu: đếm lên', /data-mo-n/, /mo-cnt/],
];
for (const [name, jre, cre] of KINDS) ok(jre.test(js) && cre.test(css), `thiếu chuyển động "${name}"`);
ok(/closest\('[^']*\.sk7/.test(js), 'số thứ tự 01..10 của lưới .sk7 không được đếm lên (số "10" lọt regex)');
ok(/@keyframes gxFloat/.test(html), 'gxFloat (của gx-css) phải còn để icon gx trôi');

// Chỉ chạy khi vào màn hình, ra khỏi thì dừng
ok(/IntersectionObserver/.test(js) && /mo-off/.test(js), 'JS phải dùng IntersectionObserver và gắn mo-off khi ra khỏi màn hình');
ok(/\.mo-off,\.mo-off \*[^{]*\{animation-play-state:paused!important\}/.test(css), 'thiếu luật dừng animation khi .mo-off');
// Reduced-motion: JS không gắn gì, CSS tắt hết; bản in: số cuối + tĩnh
ok(/prefers-reduced-motion: reduce\)'\)\.matches\)return/.test(js), 'JS phải thoát sớm khi prefers-reduced-motion');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^\n]*animation:none!important/.test(css), 'CSS thiếu tắt animation khi reduced-motion');
ok(/@media print\{[^\n]*animation:none!important/.test(css), 'CSS thiếu tắt animation khi in');
ok(/beforeprint/.test(js), 'JS phải hiện trạng thái cuối (số cuối) trước khi in');
ok(/@media screen\{[\s\S]*?:not\(\.mo-on\)/.test(css), 'luật ẩn chờ vào cảnh phải nằm trong @media screen (bản in luôn hiện)');

// Không chồng phạm vi task khác: không đụng ảnh kỹ năng .sv-* / icon ic-*, không tự làm hiện dần cả khối (.rv / .card)
ok(!/sv-spot|sv-hero|assets\/skills|ic-/.test(js), 'motion-all không được đụng ảnh kỹ năng / icon ic-* (task v3c1)');
ok(!/\.card|\.rv\b/.test(js), 'motion-all không được tự làm hiện dần thẻ / khối (task zcd9 lo)');
// Chuyển động lặp chỉ dùng transform / opacity / stroke-dashoffset (nhẹ, không reflow)
const kf = [...css.matchAll(/@keyframes (mo\w+)\{([\s\S]*?\})\}/g)];
ok(kf.length >= 10, `thiếu keyframes mo* (${kf.length})`);
for (const [, n, body] of kf) {
  const props = [...body.matchAll(/([a-z-]+):/g)].map((m) => m[1]);
  const bad = props.filter((p) => !['transform', 'opacity', 'stroke-dashoffset', 'box-shadow', 'border-color'].includes(p));
  ok(!bad.length, `@keyframes ${n} dùng thuộc tính gây reflow: ${bad.join(',')}`);
}

if (fails.length) { console.error(`FAIL check-motion-all (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-motion-all: 1 khối motion-all, ${KINDS.length} loại chuyển động (biểu đồ tự vẽ + chấm chạy, Ken Burns, dòng sự kiện, icon gx trôi, số đếm lên), dừng khi ra khỏi màn hình, reduced-motion / in tĩnh, không chồng v3c1 / zcd9`);
