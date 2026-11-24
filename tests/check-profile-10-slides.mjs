// Task ye4s: tab My Profile bỏ 3 slide thừa 11~13/13 (#aiops AI業務管理, #aidash AIダッシュボード, #pr 自己PR),
// còn 10 slide: cover + 01..09 (#toc ẩn không đếm). Không còn link / dữ liệu nào trỏ tới 3 trang đã bỏ.
import { readFileSync, existsSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const build = readFileSync(new URL('../tools/gx/build.mjs', import.meta.url), 'utf8');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.error('FAIL', m); } };
const GONE = ['aiops', 'aidash', 'pr'];

const main = (html.match(/<main class="wrap" data-view="profile">[\s\S]*?<\/main>/) || [''])[0];
ok(main, 'không thấy main data-view="profile"');
const ids = [...main.matchAll(/<section[^>]*\bclass="pg"[^>]*\bid="([^"]+)"|<section[^>]*\bid="([^"]+)"[^>]*\bclass="pg"/g)].map((m) => m[1] || m[2]);
const want = ['cover', 'toc', 'profile', 'projects', 'skillmap', 'career', 'w-mycom', 'w-jil', 'w-it', 'w-early', 'pcai'];
ok(ids.join(',') === want.join(','), `section tab Profile phải là ${want.join(',')}, đang ${ids.join(',')}`);
ok(ids.filter((i) => i !== 'toc').length === 10, 'tab Profile phải còn đúng 10 slide hiển thị');

for (const id of GONE) {
  ok(!new RegExp(`id="${id}"`).test(html), `còn section id="${id}"`);
  ok(!new RegExp(`href="#${id}"`).test(html), `còn link href="#${id}"`);
  ok(!new RegExp(`data-sec="${id}"`).test(html), `sidebar còn mục ${id}`);
  ok(!new RegExp(`'${id}'`).test((html.match(/var IDS=\[[^\]]*\]/) || [''])[0]), `mảng IDS ảnh nền còn '${id}'`);
  ok(!new RegExp(`#${id}\\b`).test(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/href="#[^"]*"/g, '')), `CSS còn quy tắc #${id}`);
  ok(!new RegExp(`'${id}'`).test((build.match(/const STEP = \{[\s\S]*?\};/) || [''])[0]), `build.mjs STEP còn '${id}'`);
  ok(!new RegExp(`^\\s*'?${id}'?: \\{`, 'm').test(build), `build.mjs còn dữ liệu cảnh ${id}`);
  ok(!existsSync(new URL(`../assets/pg/${id}.webp`, import.meta.url)), `còn ảnh nền mồ côi assets/pg/${id}.webp`);
}

const nums = [...main.matchAll(/data-num="(\d+)"/g)].map((m) => m[1]);
ok(nums.join(',') === '01,02,03,04,05,06,07,08,09,10', `data-num phải 01..10, đang ${nums.join(',')}`);
const ft = [...main.matchAll(/<p>(\d+) ／ (\d+)<\/p>/g)];
ok(ft.length === 10 && ft.every((m, i) => m[1] === nums[i] && m[2] === '10'), `footer phải 01..10 ／ 10, đang ${ft.map((m) => m[1] + '/' + m[2]).join(',')}`);
ok(!/／ 13<\/p>/.test(html), 'còn footer "／ 13"');
ok(/href="#pcai" data-sec="pcai"><em>10<\/em>/.test(html), 'sidebar: mục cuối phải là 10 #pcai');
ok(/#pcai>\.ft\{display:flex\}/.test(html), 'CSS desktop: trang cuối mới #pcai phải hiện chân trang (thay #pr>.ft)');
ok(/<a class="pj-c" href="#team-daily">/.test(html), '2 thẻ dự án AI phải trỏ sang #team-daily');
ok(!/More ／ My Profile/.test(html), '#team-daily còn thẻ "More ／ My Profile" trỏ trang đã bỏ');
const steps = [...main.matchAll(/gx-step"><i><\/i><b>(\d+)<\/b> \/ (\d+)/g)].map((m) => m[1] + '/' + m[2]);
ok(steps.length === 9 && steps.every((s, i) => s === String(i + 1).padStart(2, '0') + '/09'), `chip bước gx tab Profile phải 01..09 / 09, đang ${steps.join(',')}`);

if (fail) { console.error(`check-profile-10-slides: ${fail} lỗi`); process.exit(1); }
console.log('PASS check-profile-10-slides: tab My Profile còn 10 slide (bỏ #aiops, #aidash, #pr), đánh số 01..10, không còn link / ảnh / cảnh trỏ tới trang đã bỏ');
