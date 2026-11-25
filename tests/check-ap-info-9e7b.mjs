// Task 9e7b: người dùng yêu cầu kết quả tìm hiểu ANDPAD (công ty, sản phẩm, hoạt động, event, dự báo việc của vị trí
// theo sản phẩm) phải được TRÌNH BÀY NGAY TRONG tab Andpad Info, không chỉ trỏ link ra ngoài. Test này đối chiếu nội dung
// tab (data-view="ap", do task m07v dựng) với các sự kiện tra cứu độc lập ngày 25/11/2026, kiểm đủ 3 ngôn ngữ và có nguồn.
// Cấu trúc tab (menu, sidebar, CSS, ảnh nền) do tests/check-ap-tab.mjs kiểm; ở đây chỉ kiểm NỘI DUNG.
// Chạy: node tests/check-ap-info-9e7b.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

ok(/<nav class="top-nav"[\s\S]*?>Andpad Info<\/a>[\s\S]*?<\/nav>/.test(html), 'menu trên thiếu tab "Andpad Info"');
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu trang Andpad Info (<main data-view="ap">)');
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
const lang = (s, l) => strip([...s.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' '));
const has = (s, words, what) => { for (const w of words) ok(s.includes(w), `${what} thiếu "${w}"`); };

// 1) Công ty: tên, CEO, số người dùng, nhân sự, sứ mệnh, ANDPAD Vietnam
const top = sec('ap-top');
has(strip(top), ['稲田', '1,072', '27.9万社', '幸せを築く人を、幸せに。'], '#ap-top (công ty)');
has(lang(top, 'vi'), ['Vertical SaaS', 'ANDPAD Vietnam', 'Hà Nội', 'Customer Success'], '#ap-top (vi)');

// 2) Sản phẩm: trình bày ngay trong trang, >= 15 sản phẩm có tên + mô tả 3 ngôn ngữ
const prod = sec('ap-products');
const items = [...prod.matchAll(/<li class="ap-pd"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
ok(items.length >= 15, `#ap-products cần >= 15 sản phẩm, thấy ${items.length}`);
for (const it of items) for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`data-l="${l}">[^<]{4,}<`).test(it), `sản phẩm thiếu mô tả ${l}: ${strip(it).slice(0, 40)}`);
has(strip(prod), ['施工管理', '図面', '黒板', '検査', '受発注', '引合粗利管理', 'おうちノート', 'API'], '#ap-products');

// 3) Hoạt động, event: dòng thời gian có ngày, có event riêng của ANDPAD, AI, Việt Nam
const news = sec('ap-news');
const evs = [...news.matchAll(/<li class="ap-ev"[^>]*><time>(\d{4}(?:\.\d{2})?)<\/time>/g)].map((m) => m[1]);
ok(evs.length >= 10, `#ap-news cần >= 10 mốc có ngày, thấy ${evs.length}`);
ok(evs.filter((d) => d >= '2025').length >= 5, `#ap-news cần >= 5 mốc từ 2025 trở đi: ${evs.join(',')}`);
has(strip(news), ['ANDPAD AWARD', 'Stellarc', 'JETRO', 'Tokyo Gas'], '#ap-news');

// 4) Dự báo công việc của vị trí: ghi rõ là dự báo, gắn với từng sản phẩm
const role = sec('ap-role');
ok(/dự báo/i.test(lang(role, 'vi')) && /forecast/i.test(lang(role, 'en')) && /予想/.test(lang(role, 'ja')), '#ap-role phải ghi rõ là dự báo (3 ngôn ngữ)');
const rows = [...role.matchAll(/<li class="ap-rw"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]));
ok(rows.length >= 5, `#ap-role cần >= 5 dòng sản phẩm × việc, thấy ${rows.length}`);
for (const w of ['施工管理', '図面', '受発注', 'Analytics']) ok(rows.some((r) => r.includes(w)), `#ap-role chưa gắn việc với sản phẩm ${w}`);
has(lang(role, 'vi'), ['đào tạo', 'follow-up', 'demo', 'tài liệu hướng dẫn'], '#ap-role (vi, việc theo JD)');

// 5) Mỗi trang có nguồn (link ngoài) và đủ khối ja/en/vi; nội dung chữ nằm trong trang (không chỉ link)
for (const id of ['ap-top', 'ap-products', 'ap-news', 'ap-role']) {
  const s = sec(id);
  ok(s, `thiếu trang #${id}`);
  ok((s.match(/<a href="https:\/\/[^"]+" target="_blank" rel="noopener">/g) || []).length >= 1, `#${id} thiếu link nguồn`);
  const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] > 0 && c[0] === c[1] && c[1] === c[2], `#${id} số khối ja/en/vi lệch: ${c.join('/')}`);
  ok(lang(s, 'vi').length >= 300, `#${id} nội dung tiếng Việt quá ít (${lang(s, 'vi').length} ký tự)`);
}
ok(!main.includes('—'), 'tab Andpad Info có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-ap-info-9e7b (${fails.length}):\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-info-9e7b: tab Andpad Info trình bày đủ công ty, sản phẩm, event, dự báo việc, có nguồn, 3 ngôn ngữ');
