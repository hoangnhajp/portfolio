// Task v3c1: bỏ hết icon / hình TĨNH vẽ riêng (assets/icons/ic-*, assets/skills/*), chỉ dùng bộ icon 3D của video GPRFLEXEYE
// (assets/gx = icons_v4 của gprflexeye_intro) và cho chúng chuyển động theo cách làm của video (pop back.out, trôi nổi, vẽ nét, sao chổi chạy).
// 1) index.html + engine clip workflow không còn tham chiếu assets/icons / assets/skills; mọi icon (sprite, ảnh) nằm trong assets/gx;
// 2) 12 thẻ kỹ năng + 2 hình đầu tab là cảnh động .gxs dựng từ icon video (>= 3 icon mỗi cảnh), aria-hidden, không còn <img> tĩnh;
// 3) CSS: keyframes gxs* chỉ transform / opacity, vòng lặp trôi nổi cho icon sprite .sv-ic, dừng khi chưa vào / ra khỏi màn hình,
//    reduced-motion tĩnh, ẩn khi in; JS gx-js gắn is-in / is-off cho cả .gxs;
// 4) nếu có thư mục video gốc trên máy: mỗi file assets/gx/<tên>.webp có icon cùng tên trong icons_v4 (đúng nguồn video).
// Chạy: node tests/check-video-icons.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const eng = readFileSync(root + 'tools/team-flow/engine.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section [^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';

// 1) Không còn icon / hình tĩnh cũ
ok(!/assets\/(icons|skills)\//.test(html), 'index.html còn tham chiếu assets/icons hoặc assets/skills (icon / hình tĩnh cũ)');
ok(!/assets\/(icons|skills)\//.test(eng), 'engine.html (clip workflow) còn dùng assets/icons hoặc assets/skills');
const syms = [...html.matchAll(/<symbol id="(ic-[\w-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)];
ok(syms.length >= 13, `sprite chỉ có ${syms.length} symbol`);
const symSrc = syms.map(([, id, b]) => [id, (b.match(/<image\b[^>]*\bhref="([^"]+)"/) || [])[1] || '']);
for (const [id, s] of symSrc) ok(/^assets\/gx\/[a-z-]+\.webp$/.test(s) && existsSync(root + s), `#${id}: icon phải là file icon video assets/gx/*.webp, thấy "${s}"`);
ok(new Set(symSrc.map((x) => x[1])).size === symSrc.length, 'sprite: 2 symbol dùng chung 1 icon');
const engIcons = JSON.parse(((eng.match(/const ICONS = (\[[^\]]*\])/) || [])[1] || '[]').replace(/'/g, '"'));
ok(engIcons.length === 6, `engine: cần 6 icon, thấy ${engIcons.length}`);
ok(/const ICON_SRC = \(n\) => `\.\.\/\.\.\/assets\/gx\/\$\{n\}\.webp`/.test(eng), 'engine: ICON_SRC phải trỏ assets/gx');
for (const n of engIcons) ok(existsSync(root + `assets/gx/${n}.webp`), `engine: thiếu assets/gx/${n}.webp`);
// task p0r6: thêm assets/logos = logo thật của 4 công ty đã làm (người vận hành yêu cầu), không phải icon
// task g6pn: thêm assets/sw = ảnh chụp màn hình thật (đã che) của phần mềm làm theo yêu cầu khách hàng
// task ls8q: thêm assets/ap = ảnh sản phẩm chính thức tải từ andpad.jp (tools/ap/fetch-shots.py)
// task 2nov: icon kho lạnh / cá / tôm của bản đồ công tác ở assets/sales/map, cảnh người que ở assets/sales/cycle
for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) ok(/^assets\/(gx|sales|workflow|logos|sw|ap)\//.test(m[1]), `ảnh lạ ngoài bộ icon video / ảnh thật: ${m[1]}`);

// 2) Cảnh động .gxs thay cho hình tĩnh
const spots = [];
for (const id of ['team-skills', 'ai-uses']) {
  const cards = sec(id).split('<div class="card sv-card">').slice(1);
  ok(cards.length === 6, `${id}: cần 6 thẻ, thấy ${cards.length}`);
  cards.forEach((c, i) => {
    ok(!/<img class="sv-spot"/.test(c), `${id}#${i + 1}: còn hình tĩnh sv-spot`);
    const sp = (c.match(/<div class="sv-spot gxs [^"]*"[\s\S]*?<!--\/gxs-->/) || [])[0];
    ok(sp, `${id}#${i + 1}: thiếu cảnh động .gxs`);
    if (sp) spots.push([`${id}#${i + 1}`, sp]);
  });
}
for (const id of ['team-top', 'ai-top']) ok(!/class="sv-hero/.test(sec(id)), `${id}: hình đầu tab đã xoá (task 3yar: AI, ixrw: Team), không được cấy lại`);
ok(spots.length === 12, `cần 12 cảnh .gxs, có ${spots.length}`);
const kinds = new Set();
for (const [w, sp] of spots) {
  ok(/^<div class="[^"]*" data-k="[\w-]+" aria-hidden="true">/.test(sp), `${w}: cảnh phải có data-k và aria-hidden="true"`);
  kinds.add((sp.match(/gxs--(\w+)/) || [])[1]);
  const imgs = sp.match(/<img [^>]*>/g) || [];
  ok(imgs.length >= 3, `${w}: cần >= 3 icon video, có ${imgs.length}`);
  for (const im of imgs) {
    const s = (im.match(/src="([^"]+)"/) || [])[1] || '';
    ok(/^assets\/gx\/[a-z-]+\.webp$/.test(s) && existsSync(root + s) && statSync(root + s).size < 20000, `${w}: icon sai / thiếu ${s}`);
    ok(/ alt=""/.test(im) && / loading="lazy"/.test(im) && / width="\d+"/.test(im), `${w}: icon thiếu alt / lazy / width`);
  }
}
ok(kinds.size >= 3, `cảnh nên đa dạng (>= 3 kiểu), có ${[...kinds].join(',')}`);

// 3) CSS + JS chuyển động
const css = (html.match(/<style id="gx-css">([\s\S]*?)<\/style>/) || [])[1] || '';
const kfs = [...css.matchAll(/@keyframes (gxs[A-Za-z0-9]*)\{([\s\S]*?\})\}/g)];
ok(kfs.length >= 2, `cần keyframes gxs* riêng, có ${kfs.length}`);
for (const [, n, b] of kfs) { const bad = [...b.matchAll(/([a-z-]+):/g)].map((m) => m[1]).filter((p) => !['transform', 'opacity'].includes(p)); ok(!bad.length, `@keyframes ${n} đổi ${bad}`); }
ok(/html\.js \.gxs [^{]*\.gx-pl[^{]*\{animation:gxPop/.test(css), 'icon trong cảnh .gxs phải bật vào kiểu pop (gxPop)');
ok(/html\.js [^{]*\.gxs [^{]*img[^{]*\{animation:gxFloat [^}]*infinite/.test(css), 'icon trong cảnh .gxs phải trôi nổi liên tục (gxFloat)');
ok(/html\.js [^{]*\.sv-ic[^{]*\{animation:gxsIc [^}]*infinite/.test(css), 'icon sprite .sv-ic phải có vòng lặp chuyển động (gxsIc), không còn tĩnh');
ok(/\.gxs:not\(\.is-in\)[^{]*\{animation-play-state:paused!important\}/.test(css), 'cảnh .gxs chưa vào màn hình phải dừng');
ok(/\.gxs\.is-off[^{]*\{animation-play-state:paused!important\}/.test(css), 'cảnh .gxs ra khỏi màn hình phải dừng');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^@]*\.gxs \*[^@]*\.sv-ic[^{]*\{animation:none!important/.test(css), 'reduced-motion phải tắt chuyển động .gxs và .sv-ic');
ok(/@media print\{[^}]*\.gxs[^}]*display:none!important/.test(css), 'bản in phải ẩn cảnh .gxs');
const js = (html.match(/<script id="gx-js">([\s\S]*?)<\/script>/) || [])[1] || '';
ok(/querySelectorAll\('\.gx,\.gxs'\)/.test(js), 'gx-js phải theo dõi cả .gxs');

// 4) Nguồn icon = video
const V4 = 'D:/MCP/output/gprflexeye_intro/hf/assets/img/icons_v4/';
if (existsSync(V4)) {
  const v4 = new Set(readdirSync(V4).filter((f) => f.endsWith('.png')).map((f) => f.replace(/_/g, '-').replace(/\.png$/, '')));
  const used = new Set([...html.matchAll(/assets\/gx\/([a-z-]+)\.webp/g), ...eng.matchAll(/'([a-z-]+)'/g)].map((m) => m[1]).filter((n) => existsSync(root + `assets/gx/${n}.webp`)));
  for (const n of used) ok(v4.has(n), `assets/gx/${n}.webp không có trong bộ icon video icons_v4`);
} else console.log(`SKIP nguồn video: không có ${V4} trên máy này`);

if (fails.length) { console.error(`FAIL check-video-icons (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
console.log(`PASS check-video-icons: ${syms.length} icon sprite + 6 icon clip lấy từ bộ icon video, 12 cảnh động .gxs (${[...kinds].join('/')}) thay hình tĩnh, icon nhỏ có vòng lặp, cảnh dừng khi ngoài màn hình, reduced-motion, in ẩn`);
