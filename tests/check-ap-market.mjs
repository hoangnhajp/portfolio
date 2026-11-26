// Task m07v (phần bổ sung y5cp: "bổ sung và tìm kiếm thêm thông tin trên internet"): tab Andpad Info thêm trang #ap-market,
// từng đặt trước #ap-role (task orn3 đã bỏ trang dự báo công việc). Nội dung tra cứu web 25/11/2026: bối cảnh ngành (thiếu lao động,
// luật giới hạn làm thêm 4/2024), vị thế thị trường + đối thủ, case khách hàng có kết quả, cách ANDPAD hỗ trợ khách hàng.
// Đủ JA / EN / VI, có nguồn, ảnh nền riêng, icon 3D, chuyển động chỉ transform/opacity (dùng chung khối ap-css).
// Chạy: node tests/check-ap-market.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.includes('ap-market'), `thiếu section #ap-market (đang: ${ids})`);
// #ap-app, #ap-scope (sản phẩm chủ lực tại VN, thị trường, khu vực; tests/check-ap-app.mjs) đứng sau #ap-compete (sau 3 slide chart #ap-vs-*); task orn3 bỏ #ap-role nên #ap-scope là trang cuối
ok(ids.indexOf('ap-compete') === ids.indexOf('ap-market') + 1 && ids.slice(ids.indexOf('ap-compete') + 1).every((x) => ['ap-vs-scale', 'ap-vs-map', 'ap-vs-win', 'ap-app', 'ap-scope'].includes(x)), `#ap-market rồi #ap-compete (so sánh đối thủ) rồi tới cuối tab chỉ có #ap-vs-*, #ap-app, #ap-scope: ${ids}`);
const s = (main.match(/<section class="pg"[^>]*id="ap-market"[\s\S]*?<\/section>/) || [''])[0];

// sidebar + ảnh nền + đánh số mục: market 03 (task orn3: bỏ #ap-role 04 FORECAST)
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/href="#ap-market" data-sec="ap-market"><em>03<\/em>/.test(sb), 'sidebar thiếu mục 03 #ap-market');
ok(((html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').includes("'ap-market'"), "pganh IDS thiếu 'ap-market'");
ok(existsSync(p('assets/pg/ap-market.webp')), 'thiếu assets/pg/ap-market.webp');

// cấu trúc: 3 ngôn ngữ, icon, nguồn
ok(/<h2 class="kw\b[^"]*\brv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), '#ap-market thiếu h2 3 ngôn ngữ');
const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
ok(c[0] > 10 && c[0] === c[1] && c[1] === c[2], `#ap-market số khối ja/en/vi lệch hoặc quá ít: ${c.join('/')}`);
const icons = [...s.matchAll(/<img src="(assets\/gx\/[\w-]+\.webp)"/g)].map((m) => m[1]);
ok(icons.length >= 4, `#ap-market cần >= 4 icon 3D, thấy ${icons.length}`);
for (const f of icons) ok(existsSync(p(f)), `thiếu ${f}`);
ok(/class="ap-src\b/.test(s), '#ap-market thiếu dòng nguồn');
for (const a of s.match(/<a\b[^>]*href="https?:[^>]*>/g) || []) ok(/target="_blank"/.test(a) && /rel="noopener"/.test(a), `link ngoài thiếu target/rel: ${a.slice(0, 80)}`);
ok((s.match(/<a\b[^>]*href="https?:/g) || []).length >= 4, '#ap-market cần >= 4 link nguồn');

// nội dung: bối cảnh ngành, đối thủ, case khách hàng, hỗ trợ khách hàng
const vi = strip([...s.matchAll(/<(\w+)\b[^>]*data-l="vi"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => m[2]).join(' '));
for (const k of ['thiếu lao động', '2024', 'đối thủ', 'khách hàng', 'hỗ trợ']) ok(vi.toLowerCase().includes(k), `#ap-market (vi) thiếu ý "${k}"`);
ok((s.match(/class="ap-cs"/g) || []).length >= 3, '#ap-market cần >= 3 thẻ case khách hàng .ap-cs');
ok((s.match(/class="ap-cp"/g) || []).length >= 3, '#ap-market cần >= 3 đối thủ .ap-cp');
const ja = strip([...s.matchAll(/<(\w+)[^>]*data-l="ja"[^>]*>([\s\S]*?)<\/>/g)].map((m) => m[2]).join(' '));
ok(!/[—–―]/.test(strip(s)), 'có dấu gạch dài');
ok(!ja.includes('・'), 'JA có dấu "・"');
ok(!/No\.?\s?1|ナンバーワン/.test(strip(s)), 'không tự khen kiểu No.1 (dẫn theo khảo sát)');
ok(!s.includes('class="ap-css"'), 'không dùng class .ap-css (trùng tên khối CSS ap-css)');
// view EN/VI không hiện tên sản phẩm chỉ bằng tiếng Nhật trong thẻ case
for (const m of s.matchAll(/<li class="ap-cs"[^>]*>([\s\S]*?)<\/li>/g)) ok(/<em data-l="en">/.test(m[1]), 'thẻ case thiếu tên sản phẩm 3 ngôn ngữ');

if (fails.length) { console.error('FAIL check-ap-market:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-market: trang #ap-market (ngành, thị trường, đối thủ, case, hỗ trợ khách hàng), 3 ngôn ngữ, nguồn, ảnh nền');
