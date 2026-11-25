// Task kfh1: khu "những công việc đã làm" (#projects) thành workflow animation, mỗi bước CHỈ ghi tên (không câu kể, không nhãn, không "Xem chi tiết").
// Chạy: node tests/check-work-flow-names.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2] || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const pj = (html.match(/<section[^>]*id="projects"[\s\S]*?<\/section>/) || [''])[0];
const flow = (pj.match(/<div class="pjf[ "][\s\S]*?<!-- \/pjf -->/) || [''])[0];
ok(flow, '#projects thiếu khối workflow .pjf (kết thúc bằng <!-- /pjf -->)');

// 1. Làn workflow: >= 3 làn, mỗi làn có tên làn 3 ngôn ngữ và >= 2 bước
const lanes = [...flow.matchAll(/<div class="pjf-ln"[\s\S]*?<\/ol>/g)].map((m) => m[0]);
ok(lanes.length >= 3, `workflow cần >= 3 làn, đang ${lanes.length}`);
for (const [i, ln] of lanes.entries()) {
  const lb = (ln.match(/<b class="pjf-lb">[\s\S]*?<\/b>/) || [''])[0];
  ok(['ja', 'en', 'vi'].every((l) => lb.includes(`data-l="${l}"`)), `làn ${i + 1}: tên làn thiếu ja/en/vi`);
  ok((ln.match(/<a class="pj-c"/g) || []).length >= 2, `làn ${i + 1}: cần >= 2 bước`);
}

// 2. 12 bước, bước nào cũng: icon có sẵn, tên 3 ngôn ngữ, link tới trang chi tiết có thật, KHÔNG có chi tiết
const ids = new Set([...html.matchAll(/<section[^>]*id="([\w-]+)"/g)].map((m) => m[1]));
const steps = [...flow.matchAll(/<a class="pj-c"[^>]*href="#([\w-]+)"[\s\S]*?<\/a>/g)];
ok(steps.length === 12, `cần 12 bước, đang ${steps.length}`);
for (const [a, id] of steps) {
  const name = (a.match(/<b class="pj-co">[\s\S]*?<\/b>/) || [''])[0];
  ok(ids.has(id), `bước trỏ tới #${id} không tồn tại`);
  ok(['ja', 'en', 'vi'].every((l) => (name.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 1), `bước #${id}: tên cần đúng 1 khối ja/en/vi`);
  const img = (a.match(/<img src="(assets\/gx\/[\w-]+\.webp)"/) || [])[1];
  ok(img, `bước "${name.replace(/<[^>]+>/g, '|')}": thiếu icon assets/gx`);
  if (img) { try { readFileSync(root + img); } catch { fails.push(`icon ${img} không có file`); } }
  ok(!/pj-pt|pj-tags|pj-go|pj-role/.test(a), `bước #${id} còn chi tiết (câu kể / nhãn / Xem chi tiết)`);
}
ok(!/pj-pt|pj-tags|pj-go|詳しく見る|View details|Xem chi tiết/.test(pj), '#projects còn câu kể / nhãn / "Xem chi tiết"');

// 3. Có animation (chạy dọc làn + nhấn sáng lần lượt) và tắt được khi giảm chuyển động
ok(/@keyframes pjfRun/.test(html) && /@keyframes pjfHi/.test(html), 'thiếu @keyframes pjfRun / pjfHi');
// task fvwa: người vận hành chốt về bản đầu tiên (kfh1), KHÔNG có đường ống nối giữa các làn (bản mwuc / cogy đã bỏ)
ok(!/pjf-pipe|pjf-orb|id="pjf-js"|pjf:start/.test(html), 'còn đường ống nối giữa các làn (.pjf-pipe / .pjf-orb / script pjf-js)');
ok(!/\.pjf-ln:nth-child\(even\) \.pjf-row>li/.test(html), 'làn chẵn còn bị đảo chiều ziczac (bản mwuc)');
ok(/prefers-reduced-motion:reduce\)\{\.pjf/.test(html), 'thiếu tắt animation .pjf khi prefers-reduced-motion');
ok(!/<div class="pj[ "]/.test(pj), 'còn lưới thẻ .pj cũ');
ok(!/[—]/.test(pj), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-work-flow-names (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-work-flow-names: workflow ${lanes.length} làn, ${steps.length} bước chỉ ghi tên + icon, link chi tiết hợp lệ, có animation + reduced-motion`);
