// Người vận hành chốt 26/11/2026: xoá hẳn tab "IT Knowledge" khỏi portfolio.
// Không còn link menu, mục lục sidebar, <main data-view="it">, 4 trang #it-top / #it-stack / #it-arch / #it-change,
// khối CSS it-css, id trong mảng IDS của pganh, và link "IT Knowledge" ở tab JD ANDPAD (kể cả nguồn tools/jd/build.mjs).
// Trang #w-it (kinh nghiệm IT trong Career) KHÔNG thuộc tab này nên vẫn giữ.
// Chạy: node tests/check-no-it-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const build = readFileSync(new URL('../tools/jd/build.mjs', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

ok(!/data-view="it"/.test(html), 'còn data-view="it" (link menu hoặc <main>)');
ok(!/data-for="it"/.test(html), 'còn mục lục sidebar data-for="it"');
ok(!/id="it-(top|stack|arch|change)"/.test(html), 'còn section #it-top / #it-stack / #it-arch / #it-change');
ok(!/href="#it-(top|stack|arch|change)"/.test(html), 'còn link trỏ tới trang IT Knowledge');
ok(!/it-css/.test(html), 'còn khối CSS it-css');
ok(!/'it-(top|stack|arch|change)'/.test(html), 'còn id trang IT trong mảng IDS của pganh');
ok(!/IT Knowledge/.test(html), 'còn chữ "IT Knowledge" trong index.html');
ok(!/class="it-(lg|sys|ly|k)\b/.test(html), 'còn markup it-lg / it-sys / it-ly');
ok(!/#it-top|IT Knowledge/.test(build), 'tools/jd/build.mjs còn sinh link IT Knowledge');
ok(/id="w-it"/.test(html), 'mất trang #w-it của Career (không được xoá)');
for (const f of ['assets/it', 'assets/pg/it-top.webp', 'assets/pg/it-stack.webp', 'assets/pg/it-arch.webp', 'assets/pg/it-change.webp'])
  ok(!existsSync(new URL('../' + f, import.meta.url)), `còn ảnh mồ côi của tab IT: ${f}`);

if (fails.length) { console.error('FAIL check-no-it-tab:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-no-it-tab: tab IT Knowledge đã gỡ hết, #w-it còn nguyên');
