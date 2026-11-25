// Task 78z7: thứ tự tab menu trên theo người vận hành chốt 25/11/2026:
// My Profile, Sales, (HR), Team Management, AI Skills, IT Knowledge, Languages, Work Philosophy, Software Products, JD ANDPAD, Andpad Info.
// Kiểm thêm tools/jd/build.mjs chèn lại link JD trước link Andpad Info (chạy lại build không đảo thứ tự).
import { readFileSync } from 'node:fs';
const ok = (c, m) => { if (!c) { console.error('FAIL check-tab-order: ' + m); process.exit(1); } };
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const nav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const got = [...nav.matchAll(/data-view="([a-z]+)"/g)].map((m) => m[1]);
const want = ['profile', 'sales', 'hr', 'team', 'ai', 'it', 'lang', 'wv', 'sw', 'jd', 'ap'];
ok(got.join(',') === want.join(','), `thứ tự menu sai: ${got.join(',')} (cần ${want.join(',')})`);
const views = [...html.matchAll(/<main class="wrap" data-view="([a-z]+)"/g)].map((m) => m[1]);
ok(views.join(',') === want.join(','), `thứ tự main sai: ${views.join(',')}`);
const build =readFileSync(new URL('../tools/jd/build.mjs', import.meta.url), 'utf8');
ok(build.includes(`h = ins(h, '<a href="#ap-top" data-view="ap">', nav);`), 'tools/jd/build.mjs phải chèn link JD ngay trước link Andpad Info');
ok(build.includes(`h = ins(h, '<!-- ap:start -->', main);`), 'tools/jd/build.mjs phải chèn main JD ngay trước khối Andpad Info');
console.log('PASS check-tab-order: menu trên đúng thứ tự ' + want.join(' > '));
