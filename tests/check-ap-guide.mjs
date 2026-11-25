// Tab Andpad Info: bộ slide "Hướng dẫn chức năng" (sinh bằng tools/ap/guide.mjs qua node tools/ap/build.mjs).
// #ap-guide = luồng một công trình 5 bước, gắn sản phẩm dùng ở từng bước;
// #ap-guide-site / #ap-guide-docs / #ap-guide-money = mỗi sản phẩm một thẻ: ảnh chính thức assets/ap/<key>.webp,
// công dụng, 3 chức năng chính (tên chức năng tiếng Nhật như trang sản phẩm), lợi ích, người dùng; số trích dẫn tới trang sản phẩm.
// Đủ JA / EN / VI, nằm ngay sau #ap-vn, có mục sidebar.
// Chạy: node tests/check-ap-guide.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const GUIDE = ['ap-guide', 'ap-guide-site', 'ap-guide-docs', 'ap-guide-money'];
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
const at = ids.indexOf('ap-vn');
ok(at >= 0 && ids.slice(at + 1, at + 1 + GUIDE.length).join(',') === GUIDE.join(','), `4 slide hướng dẫn phải nằm ngay sau #ap-vn: ${ids.join(',')}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];

// Sidebar
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
for (const id of GUIDE) ok(new RegExp(`href="#${id}" data-sec="${id}"><em>[^<]+</em><span data-l="ja">[^<]+</span><span data-l="en">[^<]+</span><span data-l="vi">[^<]+</span>`).test(sb), `sidebar ap thiếu mục #${id} đủ 3 ngôn ngữ`);

// Mỗi slide: tiêu đề + câu dẫn 3 ngôn ngữ, khối ja/en/vi cân, mục nguồn tham khảo
for (const id of GUIDE) {
  const s = sec(id);
  ok(s, `thiếu section #${id}`);
  ok(/<h2 class="kw\b[^"]*\brv"[^>]*><span data-l="ja">[\s\S]+<span data-l="en">[\s\S]+<span data-l="vi">/.test(s), `#${id} thiếu h2 3 ngôn ngữ`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub\\b[^"]*\\brv"[^>]*data-l="${l}"`).test(s), `#${id} thiếu câu dẫn ${l}`);
  const c = ['ja', 'en', 'vi'].map((l) => (s.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] === c[1] && c[1] === c[2], `#${id} số khối ja/en/vi lệch: ${c.join('/')}`);
  ok(/class="ap-src ap-refs\b/.test(s), `#${id} thiếu mục nguồn tham khảo`);
  for (const tag of s.match(/<img src="assets\/ap\/[^>]*>/g) || []) ok(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag) && /\balt="[^"]+"/.test(tag), `ảnh sản phẩm thiếu width/height/alt: ${tag.slice(0, 80)}`);
  // mỗi số trích dẫn [n] trỏ tới một dòng có thật trong mục nguồn của chính trang
  const refs = (s.match(new RegExp(`<li id="${id}-r\\d+"`, 'g')) || []).length;
  for (const m of s.matchAll(/<sup class="ap-c">\[([\d,]+)\]<\/sup>/g)) for (const n of m[1].split(',')) ok(+n >= 1 && +n <= refs, `#${id} trích dẫn [${n}] không có trong mục nguồn (${refs})`);
}

// Slide luồng: 5 bước, mỗi bước có sản phẩm
const flow = sec('ap-guide');
const steps = flow.match(/<li class="ap-gf"[\s\S]*?<\/li>\s*(?=<li class="ap-gf"|<\/ol>)/g) || [];
ok(steps.length === 5, `#ap-guide cần 5 bước .ap-gf, thấy ${steps.length}`);
for (const [i, st] of steps.entries()) ok((st.match(/class="ap-gchip"/g) || []).length >= 2, `bước ${i + 1} cần >= 2 sản phẩm .ap-gchip`);

// Thẻ sản phẩm
const cards = GUIDE.slice(1).flatMap((id) => sec(id).match(/<article class="ap-gc"[\s\S]*?<\/article>/g) || []);
ok(cards.length === 21, `cần 21 thẻ sản phẩm .ap-gc, thấy ${cards.length}`);
const keys = new Set();
for (const c of cards) {
  const k = (c.match(/data-k="([\w-]+)"/) || [])[1] || '?';
  keys.add(k);
  const img = (c.match(/<img src="(assets\/ap\/[\w-]+\.webp)"/) || [])[1];
  ok(img === `assets/ap/${k}.webp` && existsSync(p(img)), `thẻ ${k}: ảnh assets/ap/${k}.webp thiếu hoặc sai`);
  ok((c.match(/<li class="ap-gfn"/g) || []).length === 3, `thẻ ${k}: cần đúng 3 chức năng`);
  for (const f of c.match(/<li class="ap-gfn"[\s\S]*?<\/li>/g) || []) ok(/<b lang="ja">[^<]+<\/b>/.test(f), `thẻ ${k}: chức năng thiếu tên tiếng Nhật <b lang="ja">`);
  for (const cls of ['ap-guse', 'ap-ggain']) for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`class="${cls}"[^>]*data-l="${l}"`).test(c), `thẻ ${k}: thiếu .${cls} ${l}`);
  ok(/<sup class="ap-c">/.test(c), `thẻ ${k}: thiếu số trích dẫn`);
}
ok(keys.size === 21, `21 thẻ phải là 21 sản phẩm khác nhau, thấy ${keys.size}`);
for (const k of ['construction_management', 'chat', 'drawings', 'blackboard', 'inspection', 'remote_presence', 'safety_management', '3d_scan', 'board', 'report', 'approval', 'electronic_delivery', 'bim', 'erp', 'edi', 'billing_management', 'report_cost', 'analytics', 'ouchi_note', 'bm', 'api']) ok(keys.has(k), `thiếu thẻ sản phẩm ${k}`);
// Lợi ích có số liệu case phải ghi rõ là case của khách hàng (tên công ty giữ tiếng Nhật)
const caseCards = cards.filter((c) => /data-l="vi">(?:<em>[^<]*<\/em>)?Case /.test(c));
ok(caseCards.length >= 8, `cần >= 8 thẻ có số liệu case khách hàng, thấy ${caseCards.length}`);
// Số liệu then chốt đúng nguồn (đối chiếu trang sản phẩm 25/11/2026)
const txt = cards.join(' ');
for (const k of ['80%', '20 giờ', '約50％', '3分の1', '約8割', '約5％']) ok(txt.includes(k), `thiếu số liệu "${k}"`);

if (fails.length) { console.error(`FAIL check-ap-guide (${fails.length}):\n- ${fails.join('\n- ')}`); process.exit(1); }
console.log(`OK check-ap-guide: 4 slide, 5 bước, ${cards.length} thẻ, ${caseCards.length} thẻ có case`);
