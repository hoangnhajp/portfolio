// Phim workflow chuyển động (task 2fl9): tab Team Management và AI Skills có 1 đoạn chuyển động kiểu video,
// chu kỳ 4..5 giây, mô tả cách tôi xử lý 1 task qua 4 bước + kỹ năng dùng ở từng bước, rồi ra kết quả.
// Mượt: chỉ animate transform / opacity, cùng 1 chu kỳ; có nút dừng / phát; tắt khi giảm chuyển động; bản in tĩnh.
// Chạy: node tests/check-motion-film.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';
const symbols = new Set([...html.matchAll(/<symbol id="(ic-[\w-]+)"/g)].map((m) => m[1]));

// 1) Mỗi tab có 1 phim, đặt trước hình đầu trang; 4 bước + 1 kết quả, mỗi bước có icon, nhãn, kỹ năng, phụ đề JA/EN/VI
for (const id of ['team-top', 'ai-top']) {
  const s = sec(id);
  const film = (s.match(/<figure class="mv rv"[\s\S]*?<\/figure>/) || [])[0] || '';
  ok(film, `${id}: chưa có phim workflow (figure.mv)`);
  if (!film) continue;
  ok(!s.includes('<figure class="sv-hero') || s.indexOf('<figure class="mv') < s.indexOf('<figure class="sv-hero'), `${id}: phim phải đứng trước hình đầu trang`); // ai-top không còn hình đầu trang (task 3yar)
  ok(/<figcaption class="mv-head">/.test(film), `${id}: phim thiếu tiêu đề (figcaption.mv-head)`);
  const nodes = film.match(/<div class="mv-node mv-n[1-4]"/g) || [];
  ok(nodes.length === 4, `${id}: cần 4 bước (mv-node), thấy ${nodes.length}`);
  const icons = [...film.matchAll(/<use href="#(ic-[\w-]+)"/g)].map((m) => m[1]);
  ok(icons.length >= 5, `${id}: cần icon cho 4 bước + kết quả, thấy ${icons.length}`);
  for (const u of icons) ok(symbols.has(u), `${id}: icon #${u} không có symbol`);
  for (const l of ['ja', 'en', 'vi']) {
    ok((film.match(new RegExp(`<b class="mv-lb" data-l="${l}"`, 'g')) || []).length === 5, `${id}: nhãn ${l} phải đủ 5 (4 bước + kết quả)`);
    ok((film.match(new RegExp(`<span class="mv-chip" data-l="${l}"`, 'g')) || []).length === 4, `${id}: kỹ năng ${l} phải đủ 4`);
    ok((film.match(new RegExp(`<p class="mv-cap mv-c[1-5]" data-l="${l}"`, 'g')) || []).length === 5, `${id}: phụ đề ${l} phải đủ 5 (4 bước + kết quả)`);
  }
  ok(/<button class="mv-pp" type="button" aria-pressed="false"/.test(film), `${id}: thiếu nút dừng / phát (button.mv-pp aria-pressed)`);
  ok(/class="mv-bar"/.test(film) && /class="mv-run"/.test(film) && /class="mv-fill"/.test(film), `${id}: thiếu thanh tiến trình / điểm chạy / đường nối`);
}

// 2) Chu kỳ 4..5 giây, mọi lớp dùng chung 1 biến thời lượng
const t = (html.match(/--mv-t:\s*([\d.]+)s/) || [])[1];
ok(t && +t >= 4 && +t <= 5, `chu kỳ phim phải 4..5 giây, thấy ${t || 'không có'}`);
const css = (html.match(/<style id="mv-css">([\s\S]*?)<\/style>/) || [])[1] || '';
ok(css, 'thiếu <style id="mv-css">');
const anims = [...css.matchAll(/animation:\s*(mv\w+)\s+([^;}]+)/g)];
ok(anims.length >= 8, `quá ít lớp chuyển động (${anims.length})`);
for (const [, name, rest] of anims) ok(/var\(--mv-t\)/.test(rest), `animation ${name} không dùng chung var(--mv-t)`);

// 3) Mượt: keyframes mv* chỉ đổi transform / opacity (chạy trên GPU, không reflow)
const kfs = [...css.matchAll(/@keyframes (mv\w+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)];
ok(kfs.length >= 8, `quá ít keyframes mv* (${kfs.length})`);
for (const [, name, body] of kfs) {
  const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]).filter((p) => p !== 'animation-timing-function');
  const bad = props.filter((p) => p !== 'transform' && p !== 'opacity');
  ok(bad.length === 0, `@keyframes ${name} đổi thuộc tính gây reflow: ${[...new Set(bad)].join(', ')}`);
}
ok(/cubic-bezier\(/.test(css), 'chuyển động cần đường cong ease (cubic-bezier) cho mượt');

// 4) Chỉ chạy khi trang đã vào khung nhìn; dừng được; tắt khi giảm chuyển động; bản in tĩnh
ok(/html\.js \.pg\.in \.mv/.test(css), 'phim phải chỉ chạy khi trang đã hiện (.pg.in)');
ok(/\.mv\.is-paused[^{]*\{[^}]*animation-play-state:\s*paused/.test(css), 'thiếu trạng thái dừng (.mv.is-paused → paused)');
ok(/@media \(prefers-reduced-motion:\s*reduce\)\{[^}]*\.mv/.test(css), 'thiếu tắt phim khi prefers-reduced-motion');
ok(/@media print\{[^}]*\.mv/.test(css), 'thiếu bản in tĩnh cho phim');
ok(/<script>[^<]*\.mv-pp[^<]*is-paused[^<]*aria-pressed[^<]*<\/script>/.test(html), 'thiếu JS cho nút dừng / phát');
ok(/\.mv\.is-off \*[^{]*\{[^}]*animation-play-state:\s*paused/.test(css) && /<script>[^<]*IntersectionObserver[^<]*is-off[^<]*<\/script>/.test(html), 'phim phải tự dừng khi ra khỏi màn hình (.mv.is-off + IntersectionObserver)');

if (fails.length) { console.error(`FAIL check-motion-film (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-motion-film: 2 phim (Team, AI), mỗi phim 4 bước + kết quả, chu kỳ ${t}s, ${kfs.length} keyframes chỉ transform/opacity, có nút dừng, reduced-motion + bản in an toàn`);
