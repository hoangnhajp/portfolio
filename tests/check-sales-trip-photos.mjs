// Sales: ảnh công tác trong #sales-trips và #sales-pr (node tests/check-sales-trip-photos.mjs, thoát 0 = đạt)
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const html = readFileSync(process.argv[2] || fileURLToPath(new URL('index.html', root)), 'utf8');
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
// Ảnh công tác phải nằm trong report của view Task: Sales, không ở view khác
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"[^>]*>([\s\S]*?)<\/main>/g)].map((m) => [m[1], m[2]]);
const sales = (views.find(([v]) => v === 'sales') || [])[1] || '';
const secOf = (id) => (sales.match(new RegExp(`<section class="pg" data-chap="\\w+" id="${id}">([\\s\\S]*?)<\\/section>`)) || [])[1] || '';
ok(sales, 'thiếu view Task: Sales');
for (const [v, body] of views) if (v !== 'sales') ok(!/assets\/sales\/trip-/.test(body), `ảnh công tác lọt sang view "${v}"`);

// Kích thước JPEG từ khung SOF
const jpegSize = (buf) => {
  let i = 2;
  while (i < buf.length) {
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return [0, 0];
};

// Mỗi section: danh sách ảnh bắt buộc (task to7p thêm trang 02 Thuyết trình & Họp)
const SECTIONS = {
  'sales-trips': ['assets/sales/trip-cold-storage-visit.jpg', 'assets/sales/trip-mycom-korea.jpg'],
  // task v4un: dòng sự kiện công tác 10 ảnh người vận hành gửi (6..15.jpg), mỗi ảnh 1 dòng, không năm
  'sales-pr': ['assets/sales/trip-asean-title.jpg', 'assets/sales/trip-asean-presenting.jpg', 'assets/sales/trip-asean-vietnam-projects.jpg',
    'assets/sales/trip-asean-presenting-hall.jpg', 'assets/sales/trip-asean-group.jpg', 'assets/sales/trip-asean-colleagues.jpg',
    'assets/sales/trip-propak-asia-2024.jpg', 'assets/sales/trip-viv-asia.jpg', 'assets/sales/trip-mycom-korea.jpg', 'assets/sales/trip-logistics-longan.jpg'],
};
// Dòng sự kiện: đúng 10 mục theo thứ tự trên, mỗi mục 1 ảnh + 1 dòng chú thích, chú thích và alt không có năm
{
  const sec = (sales.match(/<section class="pg" data-chap="\w+" id="sales-pr">([\s\S]*?)<\/section>/) || [])[1] || '';
  const row = (sec.match(/<ol class="evrow"[^>]*>([\s\S]*?)<\/ol>/) || [])[1] || '';
  ok(row, '#sales-pr chưa có dòng sự kiện <ol class="evrow">');
  const items = [...row.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  ok(items.length === 10, `dòng sự kiện có ${items.length} mục, cần 10`);
  const order = items.map((it) => (it.match(/src="([^"]+)"/) || [])[1]).join(',');
  ok(order === SECTIONS['sales-pr'].join(','), `thứ tự ảnh dòng sự kiện sai: ${order}`);
  for (const it of items) {
    ok((it.match(/<img\b/g) || []).length === 1, 'mỗi mục cần đúng 1 ảnh');
    const caps = [...it.matchAll(/<p class="ev-t">([^<]+)<\/p>/g)].map((m) => m[1]);
    ok(caps.length === 1, 'mỗi mục cần đúng 1 dòng chú thích <p class="ev-t">');
    const alts = [...it.matchAll(/(?:alt|data-alt-vi|data-alt-en)="([^"]*)"/g)].map((m) => m[1]);
    for (const t of [...caps, ...alts]) ok(!/(19|20)\d\d|年|\/20\d\d/.test(t), `dòng sự kiện còn năm: "${t}"`);
    for (const c of caps) ok(html.includes(`"${c}":[`), `chú thích "${c}" chưa có bản dịch vi/en`);
    // Bộ dịch thay innerHTML của phần tử ngoài cùng có chữ trùng khoá: chữ của <li> trùng chú thích => mất ảnh ở VI/EN
    const liText = it.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    ok(!caps.includes(liText), `mục "${liText}": chữ của <li> trùng khoá dịch, đổi ngôn ngữ sẽ xoá ảnh`);
  }
  // Task febm: hiện hết 10 ảnh dạng lưới như section landing page, không thanh cuộn ngang
  const evCss = (html.match(/^\.evrow\{([^}]*)\}/m) || [])[1] || '';
  ok(/display:grid/.test(evCss) && !/overflow-x:(auto|scroll)/.test(evCss), `.evrow phải là lưới hiện hết, không cuộn ngang: {${evCss}}`);
  ok(!/scroll-snap/.test(html.match(/^\.evrow[^\n]*$/gm)?.join('\n') || ''), '.evrow còn scroll-snap (kiểu băng chuyền cuộn)');
  ok(!/<img\b/.test(sec.replace(/<ol class="evrow"[\s\S]*?<\/ol>/, '').replace(/<figure class="gx [\s\S]*?<\/figure>/g, '').replace(/<figure class="mv sf [\s\S]*?<\/figure>/g, '').replace(/<p class="colg colg--co[^"]*">[\s\S]*?<\/p>/g, '')), '#sales-pr còn ảnh ngoài dòng sự kiện (lưới ảnh cũ; icon cảnh .gx và phim từng bước .sf không tính)');
}
const navSales = (html.match(/<nav class="sb-nav" data-for="sales"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const navNums = [...navSales.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
ok(navNums === 'sales-top:TOP sales-map:01 sales-cycle:02 sales-after:03 sales-pain:04 sales-trips:05 sales-pr:06 sales-reports:07 sales-jil-hcm:08 sales-jil-offshore:09 sales-jil-flow:10 sales-jil-after:11', `mục lục Sales sai thứ tự / số: ${navNums}`);
let total = 0;
for (const [id, WANT] of Object.entries(SECTIONS)) {
  const sec = secOf(id);
  const imgs = [...sec.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  ok(sec, `thiếu section #${id}`);
  for (const src of WANT) {
    const tag = imgs.find((t) => t.includes(`src="${src}"`));
    ok(tag, `#${id} chưa có ảnh ${src}`);
    if (!tag) continue;
    const attr = (n) => (tag.match(new RegExp(`\\s${n}="([^"]*)"`)) || [])[1];
    ok(attr('alt') && attr('data-alt-vi') && attr('data-alt-en'), `${src}: thiếu alt ja/vi/en`);
    ok(attr('loading') === 'lazy', `${src}: thiếu loading="lazy"`);
    let buf;
    try { buf = readFileSync(fileURLToPath(new URL(src, root))); } catch { ok(false, `không có file ${src}`); continue; }
    const kb = statSync(fileURLToPath(new URL(src, root))).size / 1024;
    ok(kb <= 300, `${src}: ${kb.toFixed(0)} KB > 300 KB, chưa tối ưu`);
    ok(!buf.includes(Buffer.from('Exif\0\0')), `${src}: còn EXIF (có thể lộ GPS / thiết bị)`);
    const [w, h] = jpegSize(buf);
    ok(w > 0 && w <= 1600 && h <= 1600, `${src}: kích thước ${w}x${h} vượt 1600px`);
    ok(+attr('width') === w && +attr('height') === h, `${src}: width/height ${attr('width')}x${attr('height')} khác file ${w}x${h}`);
  }
  // Chú thích ảnh có bản dịch vi/en trong từ điển (#sales-pr kiểm riêng ở dòng sự kiện phía trên)
  if (id !== 'sales-pr') {
    const caps = [...sec.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)].flatMap((m) => [...m[1].matchAll(/<span>([^<]+)<\/span>/g)].map((x) => x[1]));
    ok(caps.length >= WANT.length, `${id}: chú thích ảnh có ${caps.length}, cần >= ${WANT.length}`);
    for (const c of caps) ok(html.includes(`"${c}":[`), `chú thích "${c}" chưa có bản dịch vi/en`);
  }

  total += WANT.length;
}
if (fails.length) { console.error(`FAIL (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-sales-trip-photos: ${total} ảnh công tác trong #sales-trips + #sales-pr (dòng sự kiện 10 mục, 1 dòng, không năm), mục lục 01-11, đã tối ưu, đủ alt + dịch`);
