// Cảnh minh hoạ động kiểu video GPRFLEXEYE cho từng section (task kzo4), kiểm tĩnh trên index.html:
// 1) đúng 20 section có đúng 1 cảnh <figure class="gx gx--<kiểu>" aria-hidden="true">, chèn sau phần tiêu đề, trước nội dung;
// 2) kiểu cảnh nằm trong flow / hub / ring / chart / grid và 2 cảnh liền kề trong cùng tab không trùng kiểu;
// 3) mỗi cảnh >= 3 icon 3D assets/gx/*.webp có thật, alt="", loading="lazy", width/height; mọi nhãn đủ ja / en / vi;
// 4) CSS #gx-css: bảng màu xanh #25A1DB / cam #F47E2A, bóng 3D, keyframes gx* chỉ đổi transform / opacity
//    (riêng vòng % được đổi stroke-dashoffset, bộ đếm được đổi --n); có reduced-motion tĩnh và ẩn khi in;
// 5) JS: IntersectionObserver thêm is-in (chạy 1 lần) và is-off (dừng vòng lặp khi ra khỏi màn hình).
// Chạy: node tests/check-gx-scenes.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const TABS = {
  profile: ['profile', 'projects', 'skillmap', 'career', 'w-mycom', 'w-jil', 'w-it', 'w-early', 'pcai', 'aiops', 'aidash', 'pr'],
  sales: ['sales-top', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi', 'sales-flow'],
  team: ['team-records'],
  ai: ['ai-people'],
};
const KINDS = ['flow', 'hub', 'ring', 'chart', 'grid'];
const sec = (id) => (html.match(new RegExp(`<section [^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';

let scenes = 0, icons = 0;
const usedIcons = new Set();
for (const [tab, ids] of Object.entries(TABS)) {
  let prev = '';
  for (const id of ids) {
    const s = sec(id);
    ok(s, `${tab}/${id}: không thấy section`);
    const figs = s.match(/<figure class="gx [^"]*"[\s\S]*?<\/figure>/g) || [];
    ok(figs.length === 1, `${id}: cần đúng 1 cảnh .gx, đang có ${figs.length}`);
    if (!figs.length) continue;
    scenes++;
    const f = figs[0];
    const kind = (f.match(/class="gx gx--([a-z]+)/) || [])[1];
    ok(KINDS.includes(kind), `${id}: kiểu cảnh lạ "${kind}"`);
    ok(kind !== prev, `${id}: trùng kiểu "${kind}" với section liền trước trong tab ${tab}`);
    prev = kind;
    ok(/^<figure class="gx [^"]*" aria-hidden="true"/.test(f), `${id}: cảnh phải aria-hidden="true" (nội dung đã có ở chữ của section)`);
    // Vị trí: sau tiêu đề (kwbar), trước khối nội dung đầu tiên
    const iBar = s.indexOf('class="kwbar'), iFig = s.indexOf('<figure class="gx ');
    ok(iBar >= 0 && iFig > iBar, `${id}: cảnh phải nằm sau phần tiêu đề`);
    const between = s.slice(s.indexOf('</div>', iBar) + 6, iFig);
    ok(!/<(div|nav|ol|ul|a|figure|video|img) /.test(between.replace(/<p class="kw-sub[^>]*>[\s\S]*?<\/p>/g, '')), `${id}: có khối nội dung chen giữa tiêu đề và cảnh`);
    // Icon 3D
    const imgs = f.match(/<img [^>]*>/g) || [];
    ok(imgs.length >= 3, `${id}: cần >= 3 icon 3D, có ${imgs.length}`);
    for (const im of imgs) {
      icons++;
      const src = (im.match(/src="([^"]+)"/) || [])[1] || '';
      ok(/^assets\/gx\/[a-z-]+\.webp$/.test(src), `${id}: icon sai thư mục ${src}`);
      ok(existsSync(root + src) && statSync(root + src).size < 20000, `${id}: thiếu file hoặc file quá nặng ${src}`);
      ok(/ alt=""/.test(im) && / loading="lazy"/.test(im) && / width="\d+"/.test(im) && / height="\d+"/.test(im), `${id}: icon thiếu alt="" / loading="lazy" / width / height: ${im}`);
      usedIcons.add(src);
    }
    // Nhãn đủ 3 ngôn ngữ, không rỗng
    const labels = f.match(/<(b|em|small) class="gx-(lb|chip|unit|pre)[^"]*">[\s\S]*?<\/\1>/g) || [];
    ok(labels.length >= 3, `${id}: cần >= 3 nhãn, có ${labels.length}`);
    for (const lb of labels) {
      // Nhãn trung tính (số, năm, tên riêng Latinh) được 1 dạng; chữ cần dịch (kana, kanji, dấu tiếng Việt) bắt buộc đủ 3 ngôn ngữ
      if (!/data-l=/.test(lb)) { const tx = lb.replace(/<[^>]+>/g, ''); ok(/^[A-Z0-9][A-Za-z0-9 ·.-]*$/.test(tx), `${id}: nhãn "${tx}" thiếu bản ja / en / vi`); continue; }
      for (const l of ['ja', 'en', 'vi']) {
        const m = lb.match(new RegExp(`<span data-l="${l}">([^<]+)</span>`));
        ok(m && m[1].trim(), `${id}: nhãn thiếu ${l}: ${lb.replace(/<[^>]+>/g, ' ').trim().slice(0, 40)}`);
      }
    }
    if (kind === 'ring') ok(/<svg [^>]*viewBox="0 0 120 120"[\s\S]*class="gx-rf"[^>]*pathLength="100"/.test(f) && /class="gx-num" style="--v:\d+/.test(f), `${id}: cảnh ring thiếu vòng pathLength=100 hoặc bộ đếm --v`);
    if (kind === 'chart') ok((f.match(/<i class="gx-bar[^"]*" style="--h:\d+/g) || []).length >= 4, `${id}: cảnh chart cần >= 4 cột --h`);
    const nSt = (f.match(/class="gx-st[" ]/g) || []).length, nLn = (f.match(/class="gx-ln[" ]/g) || []).length;
    if (kind === 'flow') ok(nSt >= 3 && nLn === nSt - 1, `${id}: cảnh flow cần >= 3 bước và số đường nối = số bước - 1 (${nSt} bước, ${nLn} nối)`);
  }
}
ok(scenes === 20, `cần 20 cảnh, có ${scenes}`);
ok(usedIcons.size >= 20, `icon phải đa dạng (>= 20 loại), đang dùng ${usedIcons.size}`);
ok((html.match(/<figure class="gx /g) || []).length === 20, 'có cảnh .gx nằm ngoài 20 section đã định');

// CSS
const css = (html.match(/<style id="gx-css">([\s\S]*?)<\/style>/) || [])[1] || '';
ok(css, 'thiếu <style id="gx-css">');
ok(html.indexOf('<style id="gx-css">') < html.indexOf('</head>'), 'CSS cảnh phải nằm trong <head> để cảnh không hiện trần rồi mới nhảy bố cục');
ok(!/backdrop-filter/.test(css), 'không dùng backdrop-filter trên nền đã đục (tốn GPU, không thấy hiệu quả)');
for (const t of ['#25A1DB', '#F47E2A', 'Space Grotesk', 'drop-shadow', 'cubic-bezier(.34,1.56,.64,1)', 'cubic-bezier(.16,1,.3,1)'])
  ok(css.includes(t), `gx-css thiếu token kiểu GPRFLEXEYE: ${t}`);
ok(/@property --n\{syntax:'<integer>'/.test(css), 'thiếu @property --n cho bộ đếm');
const kfs = [...css.matchAll(/@keyframes (gx[A-Za-z0-9]+)\{([\s\S]*?\})\}/g)];
ok(kfs.length >= 8, `cần >= 8 keyframes gx*, có ${kfs.length}`);
for (const [, name, body] of kfs) {
  const props = [...body.matchAll(/([a-z-]+):/g)].map((m) => m[1]);
  const allow = name === 'gxRing' ? ['stroke-dashoffset'] : name === 'gxCount' ? ['--n'] : ['transform', 'opacity'];
  const bad = props.filter((p) => !allow.includes(p) && !(name === 'gxCount' && p === 'n'));
  ok(!bad.length, `@keyframes ${name} đổi thuộc tính nặng: ${bad.join(',')}`);
}
ok(/@media \(prefers-reduced-motion:reduce\)\{\.gx \*,\.gx \*::before,\.gx \*::after\{animation:none!important/.test(css), 'thiếu reduced-motion tĩnh cho .gx');
ok(/@media print\{\.gx\{display:none!important\}\}/.test(css), 'bản in A4 phải ẩn cảnh .gx');
ok(/\.gx\.is-off \*[^{]*\{animation-play-state:paused!important\}/.test(css), 'thiếu dừng animation khi cảnh ra khỏi màn hình');
ok(/@media screen and \(max-width:600px\)\{[^]*?\.gx/.test(css), 'thiếu bố cục điện thoại cho .gx');

// JS
const js = (html.match(/<script id="gx-js">([\s\S]*?)<\/script>/) || [])[1] || '';
ok(/IntersectionObserver/.test(js) && /is-in/.test(js) && /is-off/.test(js), 'thiếu script gx-js (IntersectionObserver, is-in, is-off)');
ok(/classList\.add\('is-in'\)/.test(js) && /'IntersectionObserver' in window/.test(js), 'gx-js phải có đường lui khi không có IntersectionObserver');

if (fails.length) { console.error(`FAIL check-gx-scenes (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
console.log(`PASS check-gx-scenes: ${scenes} cảnh (${icons} icon, ${usedIcons.size} loại), không 2 cảnh liền kề trùng kiểu, nhãn đủ JA/EN/VI, keyframes chỉ transform/opacity, reduced-motion tĩnh, ẩn khi in`);
