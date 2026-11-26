// Task orn3: người vận hành bỏ trang 04 FORECAST "Dự báo công việc của vị trí này" (#ap-role) khỏi tab Andpad Info.
// Kiểm: không còn section, link sidebar, id trong mảng IDS, chữ FORECAST; build.mjs không còn gọi pageRole; #ap-scope là trang cuối tab.
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const build = readFileSync(new URL('../tools/ap/build.mjs', import.meta.url), 'utf8');
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.error('FAIL:', m); } };
ok(!/id="ap-role"/.test(html), 'index.html còn section id="ap-role"');
ok(!/href="#ap-role"|data-sec="ap-role"/.test(html), 'index.html còn link #ap-role');
ok(!/'ap-role'/.test(html), "index.html còn 'ap-role' trong mảng IDS");
ok(!/FORECAST/.test(html), 'index.html còn nhãn FORECAST');
ok(!/Dự báo công việc/.test(html), 'index.html còn chữ "Dự báo công việc"');
ok(!/pageRole|from '\.\/role\.mjs'/.test(build), 'tools/ap/build.mjs còn gọi pageRole / role.mjs');
const ap = (html.match(/<main class="wrap" data-view="ap"[\s\S]*?<\/main>/) || [''])[0];
const ids = [...ap.matchAll(/<section class="pg"[^>]*id="([^"]+)"/g)].map((m) => m[1]);
ok(ids.length > 0 && ids[ids.length - 1] === 'ap-scope', `trang cuối tab Andpad Info phải là ap-scope: ${ids}`);
console.log(bad ? `check-ap-no-role: ${bad} lỗi` : `check-ap-no-role: OK (${ids.length} trang, cuối = ${ids[ids.length - 1]})`);
process.exit(bad ? 1 : 0);
