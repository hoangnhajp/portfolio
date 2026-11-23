// Task ixrw: người vận hành yêu cầu bỏ kiểu hình minh hoạ lớn icon kính trong suốt (figure.sv-hero, cảnh hero-team) ở đầu tab Team,
// thay bằng workflow. Kiểm: team-top không còn sv-hero / hero-team; phim workflow (figure.mv) vẫn đứng ngay trước bảng meta
// Teams / Size / Numbers / People; clip workflow ở team-skills vẫn còn; tools/gx/build.mjs không còn khai báo cảnh hero-team.
// Chạy: node tests/check-team-hero-removed.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(root + 'index.html', 'utf8');
const build = readFileSync(root + 'tools/gx/build.mjs', 'utf8');
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const s = sec('team-top');

ok(s, 'không thấy section team-top');
ok(!/class="sv-hero/.test(s), 'team-top: còn figure.sv-hero (hình minh hoạ lớn đầu tab)');
ok(!/hero-team/.test(html), 'index.html còn cảnh hero-team');
ok(/<\/figure>\s*<div class="meta rv"[\s\S]*<span>Teams<\/span>[\s\S]*<span>People<\/span>/.test(s), 'team-top: phim workflow phải đứng ngay trước bảng Teams / Size / Numbers / People');
ok(/<figure class="mv rv"/.test(s), 'team-top: mất phim workflow (figure.mv)');
ok(/<figure class="tf-vid rv"/.test(sec('team-skills')), 'team-skills: mất clip workflow (figure.tf-vid)');
ok(!/'hero-team'\s*:/.test(build), 'tools/gx/build.mjs còn khai báo cảnh hero-team (chạy build sẽ lỗi / cấy lại)');

if (fails.length) { console.error('FAIL check-team-hero-removed:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-team-hero-removed: tab Team không còn hình minh hoạ lớn đầu tab, phim workflow đứng ngay trên bảng meta, build không cấy lại');
