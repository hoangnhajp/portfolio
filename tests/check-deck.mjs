// Task nod3: 2 lưới 6 thẻ (#team-skills, #ai-uses) chạy như slide thuyết trình (từng thẻ một, tự chuyển, điều khiển được).
// Kiểm tĩnh trên index.html: thuộc tính data-deck, khối CSS/JS có marker, chỉ tăng cường khi có JS, in / reduced-motion.
// Chạy: node tests/check-deck.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (id) => {
  const a = html.indexOf(`id="${id}"`);
  const b = html.indexOf('</section>', a);
  return a < 0 ? '' : html.slice(a, b);
};
for (const id of ['team-skills', 'ai-uses']) {
  const s = sec(id);
  const m = s.match(/<div class="g3 rv"[^>]*>/);
  ok(m && /\sdata-deck[\s>=]/.test(m[0]), `${id}: lưới .g3 cần thuộc tính data-deck`);
  ok(s.split('<div class="card sv-card">').length - 1 === 6, `${id}: vẫn đủ 6 thẻ (không xoá nội dung)`);
}
ok((html.match(/\sdata-deck[\s>=]/g) || []).length === 2, 'đúng 2 lưới có data-deck');

const a = html.indexOf('<!-- deck:start -->'), b = html.indexOf('<!-- deck:end -->');
ok(a > 0 && b > a, 'thiếu khối <!-- deck:start --> ... <!-- deck:end -->');
ok(html.indexOf('<!-- deck:start -->', a + 1) < 0, 'khối deck bị nhân đôi');
const blk = a > 0 && b > a ? html.slice(a, b) : '';
ok(/<style id="deck-css">/.test(blk) && /<script id="deck-js">/.test(blk), 'khối deck cần <style id="deck-css"> và <script id="deck-js">');
// chỉ áp khi JS chạy (class deck-on do JS gắn), CSS bọc trong @media screen để bản in giữ lưới
ok(/@media screen\{[\s\S]*\.deck-on/.test(blk), 'CSS deck phải nằm trong @media screen (in ra vẫn là lưới)');
ok(/@media print\{[^}]*\.deck-bar\{display:none/.test(blk), 'thanh điều khiển ẩn khi in');
ok(/prefers-reduced-motion/.test(blk) && /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/.test(blk), 'tôn trọng reduced-motion (CSS + JS không tự chạy)');
ok(/classList\.add\('deck-on'\)/.test(blk), 'JS gắn class deck-on');
// điều khiển: trước / sau / chấm / dừng-chạy / thanh tiến trình / bộ đếm
for (const c of ['deck-prev', 'deck-next', 'deck-dots', 'deck-pp', 'deck-prog', 'deck-count']) ok(blk.includes(c), `thiếu điều khiển ${c}`);
ok(/ArrowRight/.test(blk) && /ArrowLeft/.test(blk), 'điều hướng bằng phím mũi tên');
ok(/pointerdown/.test(blk) && /pointerup/.test(blk), 'vuốt trên điện thoại');
ok(/IntersectionObserver/.test(blk), 'tự dừng khi ra khỏi màn hình');
ok(/inert/.test(blk) && /aria-hidden/.test(blk), 'slide ẩn phải inert + aria-hidden');
// nhãn nút đủ 3 ngôn ngữ theo cơ chế data-l của trang
for (const l of ['ja', 'en', 'vi']) ok(blk.includes(`data-l="${l}"`) || blk.includes(`${l}:`), `nhãn điều khiển thiếu ngôn ngữ ${l}`);
// chỉ transform / opacity trong keyframes chuyển slide (mượt, không reflow)
const kf = [...blk.matchAll(/@keyframes (deck\w+)\{([\s\S]*?\})\}/g)];
ok(kf.length >= 3, 'cần >= 3 keyframes deck*');
for (const [, n, body] of kf) {
  const props = [...body.matchAll(/([a-z-]+):/g)].map((x) => x[1]).filter((p) => !['transform', 'opacity'].includes(p));
  ok(props.length === 0 || (n === 'deckProg' && props.every((p) => p === 'transform')), `keyframes ${n} chỉ được dùng transform/opacity, thấy ${props.join(',')}`);
}

if (fails.length) { console.error('FAIL check-deck:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-deck: 2 lưới 6 thẻ chạy dạng slide (điều khiển, phím, vuốt, reduced-motion, in)');
