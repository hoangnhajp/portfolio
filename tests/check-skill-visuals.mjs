// Tab "Task: Team Management" + "Task: AI Skills" (task z7gh): workflow có animation, icon cho từng bước,
// hình minh hoạ cho từng kỹ năng + hình đầu trang, tắt chuyển động khi người dùng chọn giảm chuyển động, bản in không vỡ.
// Chạy: node tests/check-skill-visuals.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
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

// 4) Minh hoạ: 6 kỹ năng mỗi tab + 1 hình đầu trang mỗi tab. Từ task v3c1 là cảnh động .gxs dựng từ icon video (data-k riêng, không trùng),
//    không còn ảnh tĩnh assets/skills (chi tiết icon / chuyển động ở check-video-icons)
const keys = [];
const checkSpot = (t, where) => {
  const k = (t.match(/ data-k="([\w-]+)"/) || [])[1];
  ok(k && / aria-hidden="true"/.test(t), `${where}: cảnh .gxs thiếu data-k / aria-hidden`);
  ok((t.match(/<img [^>]*src="assets\/gx\/[a-z-]+\.webp"[^>]*>/g) || []).length >= 3, `${where}: cảnh cần >= 3 icon video assets/gx`);
  keys.push(k);
};
for (const id of ['team-skills', 'ai-uses']) {
  const cards = sec(id).split('<div class="card sv-card">').slice(1);
  ok(cards.length === 6, `${id}: cần 6 thẻ kỹ năng có hình (sv-card), thấy ${cards.length}`);
  cards.forEach((c, i) => { const t = (c.match(/<div class="sv-spot gxs [\s\S]*?<!--\/gxs-->/) || [])[0]; ok(t, `${id}: thẻ ${i + 1} thiếu minh hoạ động`); if (t) checkSpot(t, `${id}#${i + 1}`); });
}
for (const id of ['team-top', 'ai-top']) ok(!/class="sv-hero/.test(sec(id)), `${id}: hình đầu tab đã bị xoá (task 3yar: AI, ixrw: Team), không được cấy lại`);
ok(new Set(keys).size === keys.length, 'có minh hoạ bị dùng trùng');
ok(keys.length === 12, `cần 12 minh hoạ (12 kỹ năng, không còn hình đầu tab), thấy ${keys.length}`);

// 5) CSS animation: có keyframes bước sáng lần lượt + chấm chạy trên mũi tên; tôn trọng giảm chuyển động; bản in ẩn hình, không animation
ok(/@keyframes svStep\b/.test(html) && /@keyframes svDot\b/.test(html), 'thiếu @keyframes svStep / svDot');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^}]*\.cyc--live/.test(html), 'thiếu tắt animation workflow khi prefers-reduced-motion');
ok(/@media print\{[^}]*\.sv-hero[^}]*\.sv-spot[^}]*display:none/.test(html), 'bản in chưa ẩn .sv-hero / .sv-spot');
ok(!/<img[^>]+src="https?:/i.test(sec('team-top') + sec('ai-top') + sec('team-skills') + sec('ai-uses')), 'không dùng hình ngoài (http)');

if (fails.length) { console.error(`FAIL check-skill-visuals (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-skill-visuals: workflow sống 2x4 bước có icon, ${symbols.size} icon, 12 minh hoạ động .gxs từ icon video (12 kỹ năng, không còn hình đầu tab), reduced-motion + bản in an toàn`);
