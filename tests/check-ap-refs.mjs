// Task 4n9v: mọi trang của tab Andpad Info có mục "Nguồn tham khảo" ở cuối trang; mọi thông tin, câu nói, hình ảnh
// đều có số trích dẫn [n] trỏ tới một nguồn trong danh sách đó; mỗi nguồn có tiêu đề nhỏ mô tả nội dung (JA / EN / VI) + link.
// Danh mục nguồn ở tools/ap/refs.mjs, trang sinh bằng node tools/ap/build.mjs.
// Chạy: node tests/check-ap-refs.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu main data-view="ap"');
const IDS = ['ap-top', 'ap-products', 'ap-shots', 'ap-vn', 'ap-news', 'ap-market', 'ap-role'];
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
// Phần tử mang thông tin phải có số trích dẫn: [selector lớp, mô tả]
const CLAIMS = {
  'ap-top': [/<li style="--i:\d+">[\s\S]*?<\/li>/g, /<div class="card ap-ms\b[\s\S]*?<\/div>\s*<\/div>/g, /<div class="card ap-vn\b[\s\S]*?<\/ul>/g],
  'ap-products': [/<li class="ap-pd"[\s\S]*?<\/li>/g],
  'ap-shots': [/<figure class="ap-sh"[\s\S]*?<\/figure>/g],
  'ap-vn': [/<figure class="ap-v[ps]"[\s\S]*?<\/figure>/g],
  'ap-news': [/<li class="ap-ev"[\s\S]*?<\/li>/g, /<div class="card ap-act">[\s\S]*?<\/div><\/div>/g],
  'ap-market': [/<ul class="ap-ctx[\s\S]*?<\/ul>/g, /<li class="ap-cp">[\s\S]*?<\/li>/g, /<li class="ap-cs"[\s\S]*?<\/li>/g, /<div class="ap-mk-l">[\s\S]*?<\/div>/g, /<ol class="ap-sps">[\s\S]*?<\/ol>/g, /<p class="ap-sp-p"[\s\S]*?<\/p>/g],
  'ap-role': [/<li class="ap-js"[\s\S]*?<\/li>/g, /<li class="ap-rw"[\s\S]*?<\/li>/g],
};
const cites = (s) => [...s.matchAll(/<sup class="ap-c">([\d,]+)<\/sup>/g)].flatMap((m) => m[1].split(',').map(Number));
let total = 0, refsTotal = 0;
for (const id of IDS) {
  const s = sec(id);
  ok(s, `thiếu #${id}`);
  const blk = (s.match(/<div class="ap-src ap-refs\b[^"]*"[^>]*>([\s\S]*?)<\/ol>\s*<\/div>/) || [])[1] || '';
  ok(blk, `#${id} thiếu khối nguồn tham khảo .ap-refs cuối trang`);
  ok(s.lastIndexOf('ap-refs') > s.lastIndexOf('</ul>') && s.lastIndexOf('ap-refs') > s.lastIndexOf('</figure>'), `#${id}: khối nguồn phải ở cuối trang`);
  for (const [l, t] of [['ja', '参考文献'], ['en', 'References'], ['vi', 'Nguồn tham khảo']]) ok(new RegExp(`data-l="${l}">${t}`).test(blk), `#${id} thiếu tiêu đề "${t}"`);
  const items = [...blk.matchAll(/<li id="([\w-]+)">([\s\S]*?)<\/li>/g)];
  ok(items.length >= 2, `#${id} cần >= 2 nguồn, thấy ${items.length}`);
  refsTotal += items.length;
  const urls = [];
  items.forEach(([, rid, x], i) => {
    ok(rid === `${id}-r${i + 1}`, `#${id} nguồn ${i + 1} sai id "${rid}"`);
    for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<span data-l="${l}">[^<]{4,}</span>`).test(x), `#${id} nguồn ${i + 1} thiếu tiêu đề mô tả ${l}`);
    const a = x.match(/<a href="(https:\/\/[^"]+)" target="_blank" rel="noopener">([^<]+)<\/a>/);
    ok(a, `#${id} nguồn ${i + 1} thiếu link https mở tab mới`);
    if (a) urls.push(a[1]);
  });
  ok(new Set(urls).size === urls.length, `#${id} trùng link nguồn`);
  const body = s.slice(0, s.indexOf('ap-refs'));
  const used = cites(body);
  total += used.length;
  for (const n of used) ok(n >= 1 && n <= items.length, `#${id} trích dẫn [${n}] không có trong danh sách`);
  for (let n = 1; n <= items.length; n++) ok(used.includes(n), `#${id} nguồn ${n} không được trích dẫn ở đâu`);
  // số trích dẫn đánh theo thứ tự xuất hiện lần đầu
  const first = [...new Set(used)];
  ok(first.every((n, i) => n === i + 1), `#${id} số trích dẫn không theo thứ tự xuất hiện: ${first.join(',')}`);
  // câu dẫn đầu trang có nguồn (3 ngôn ngữ)
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub[^>]*data-l="${l}">[^]*?<sup class="ap-c">`).test(s), `#${id} câu dẫn ${l} thiếu trích dẫn`);
  // mọi phần tử thông tin có trích dẫn
  for (const re of CLAIMS[id] || []) {
    const els = body.match(re) || [];
    ok(els.length > 0, `#${id}: không thấy phần tử ${re.source.slice(0, 30)}`);
    els.forEach((e) => ok(/<sup class="ap-c">/.test(e), `#${id}: phần tử thiếu trích dẫn: ${e.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)}`));
  }
  // mọi ảnh nội dung (assets/ap) nằm trong figure có trích dẫn
  for (const f of body.match(/<figure\b[\s\S]*?<\/figure>/g) || []) if (/assets\/ap\//.test(f)) ok(/<sup class="ap-c">/.test(f), `#${id}: ảnh thiếu nguồn: ${(f.match(/assets\/ap\/[\w-]+/) || [''])[0]}`);
}
ok(!main.includes('—'), 'có dấu gạch ngang dài');
// CSS khối nguồn
const css = (html.match(/<!-- ap-css:start -->([\s\S]*?)<!-- ap-css:end -->/) || [])[1] || '';
ok(/\.ap-refs\b/.test(css) && /\.ap-c\b/.test(css), 'thiếu CSS .ap-refs / .ap-c trong ap-css');

if (fails.length) { console.error(`FAIL check-ap-refs (${fails.length}):\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
console.log(`OK check-ap-refs: 7 trang, ${refsTotal} nguồn có tiêu đề JA/EN/VI + link, ${total} trích dẫn, mọi thông tin / ảnh có nguồn`);
