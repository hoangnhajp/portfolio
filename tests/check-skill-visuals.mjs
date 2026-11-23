// Tab "Task: Team Management" + "Task: AI Skills" (task z7gh): workflow có animation, icon cho từng bước,
// hình minh hoạ cho từng kỹ năng + hình đầu trang, tắt chuyển động khi người dùng chọn giảm chuyển động, bản in không vỡ.
// Chạy: node tests/check-skill-visuals.mjs [index.html] (thoát 0 = đạt)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
const root = dirname(file);
const html = readFileSync(file, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';

// 1) Sprite icon: mọi <use href="#ic-..."> phải trỏ tới symbol có thật
const symbols = new Set([...html.matchAll(/<symbol id="(ic-[\w-]+)"/g)].map((m) => m[1]));
const used = [...html.matchAll(/<use href="#(ic-[\w-]+)"/g)].map((m) => m[1]);
ok(symbols.size >= 12, `sprite icon quá ít: ${symbols.size} symbol (cần >= 12)`);
for (const u of used) ok(symbols.has(u), `icon #${u} không có symbol`);

// 2) Workflow sống: 2 chuỗi 4 bước, mỗi bước 1 icon, mũi tên có lớp animation
for (const id of ['team-daily', 'ai-approach']) {
  const s = sec(id);
  ok(/<div class="cyc cyc--live rv"/.test(s), `${id}: chuỗi workflow chưa có lớp cyc--live`);
  const steps = s.match(/<div class="card cyc-c"[\s\S]*?<\/div>\s*(?=<span class="cyc-a"|<\/div>)/g) || [];
  ok(steps.length === 4, `${id}: cần 4 bước, thấy ${steps.length}`);
  steps.forEach((st, i) => ok(/<span class="sv-ib"[^>]*><svg class="sv-ic"[^>]*><use href="#ic-[\w-]+"/.test(st), `${id}: bước ${i + 1} thiếu icon`));
  ok((s.match(/<span class="cyc-a"/g) || []).length === 3, `${id}: cần 3 mũi tên nối bước`);
}

// 3) Icon cho 4 thẻ vai trò (team-records) và 2 thẻ AI / People (ai-people)
ok((sec('team-records').match(/<svg class="sv-ic"/g) || []).length === 4, 'team-records: cần 4 icon vai trò');
ok((sec('ai-people').match(/<svg class="sv-ic"/g) || []).length >= 2, 'ai-people: cần icon cho thẻ AI và People');

// 4) Hình minh hoạ: 6 kỹ năng mỗi tab + 1 hình đầu trang mỗi tab, file có thật, nhẹ, khai báo kích thước, không trùng
const imgs = [];
const checkImg = (tag, where) => {
  const src = (tag.match(/\bsrc="([^"]+)"/) || [])[1] || '';
  ok(/^assets\/skills\/[\w-]+\.webp$/.test(src), `${where}: src không đúng assets/skills/*.webp: "${src}"`);
  ok(/\balt=""/.test(tag) && /\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag), `${where}: thiếu alt="" / width / height`);
  ok(/\bloading="lazy"/.test(tag) && /\bdecoding="async"/.test(tag), `${where}: thiếu loading="lazy" decoding="async"`);
  const p = join(root, src);
  ok(existsSync(p), `${where}: không có file ${src}`);
  if (existsSync(p)) { const kb = statSync(p).size / 1024; ok(kb > 4 && kb < 160, `${where}: ${src} nặng ${kb.toFixed(0)} KB (cần 4..160 KB)`); }
  imgs.push(src);
};
for (const id of ['team-skills', 'ai-uses']) {
  const cards = sec(id).split('<div class="card sv-card">').slice(1);
  ok(cards.length === 6, `${id}: cần 6 thẻ kỹ năng có hình (sv-card), thấy ${cards.length}`);
  cards.forEach((c, i) => { const t = (c.match(/<img class="sv-spot"[^>]*>/) || [])[0]; ok(t, `${id}: thẻ ${i + 1} thiếu hình minh hoạ`); if (t) checkImg(t, `${id}#${i + 1}`); });
}
for (const id of ['team-top', 'ai-top']) {
  const t = (sec(id).match(/<figure class="sv-hero[^"]*"[^>]*>\s*<img[^>]*>/) || [])[0];
  ok(t, `${id}: thiếu hình đầu trang (figure.sv-hero)`);
  if (t) checkImg(t.match(/<img[^>]*>/)[0], id);
}
ok(new Set(imgs).size === imgs.length, 'có hình minh hoạ bị dùng trùng');
ok(imgs.length === 14, `cần 14 hình (12 kỹ năng + 2 đầu trang), thấy ${imgs.length}`);

// 5) CSS animation: có keyframes bước sáng lần lượt + chấm chạy trên mũi tên; tôn trọng giảm chuyển động; bản in ẩn hình, không animation
ok(/@keyframes svStep\b/.test(html) && /@keyframes svDot\b/.test(html), 'thiếu @keyframes svStep / svDot');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^}]*\.cyc--live/.test(html), 'thiếu tắt animation workflow khi prefers-reduced-motion');
ok(/@media print\{[^}]*\.sv-hero[^}]*\.sv-spot[^}]*display:none/.test(html), 'bản in chưa ẩn .sv-hero / .sv-spot');
ok(!/<img[^>]+src="https?:/i.test(sec('team-top') + sec('ai-top') + sec('team-skills') + sec('ai-uses')), 'không dùng hình ngoài (http)');

if (fails.length) { console.error(`FAIL check-skill-visuals (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-skill-visuals: workflow sống 2x4 bước có icon, ${symbols.size} icon, 14 hình minh hoạ webp nhẹ (12 kỹ năng + 2 đầu trang), reduced-motion + bản in an toàn`);
