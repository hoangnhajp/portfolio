// Tab Andpad Info, 2 trang phân tích sản phẩm chủ lực của ANDPAD tại Việt Nam (đối chiếu nguồn ngày 26/11/2026):
// - #ap-app: tên app chính thức trên App Store / Google Play, app nào là chủ lực, bản tiếng Việt gồm gì, công dụng và
//   chức năng theo trang sản phẩm, bài toán giải quyết và cách hỗ trợ doanh nghiệp (kết quả thí điểm tại Việt Nam).
// - #ap-scope: thị trường và ngành sản phẩm cùng loại (quy mô Nhật, Việt Nam), thị phần (không bịa %), khu vực tập trung
//   khách hàng (Nhật: văn phòng + phân bố doanh nghiệp xây dựng; Việt Nam: TP.HCM, Hà Nội), nhận định của ứng viên.
// Hai trang đứng sau #ap-compete, cuối tab (task orn3 bỏ #ap-role); mỗi số liệu có số trích dẫn trỏ về nguồn ở cuối trang.
// Chạy: node tests/check-ap-app.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
const strip = (x) => x.replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const lang = (x, l) => strip([...x.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' '));
const refsOf = (s, id) => Object.fromEntries([...s.matchAll(new RegExp(`<li id="${id}-r(\\d+)">[\\s\\S]*?<a href="([^"]+)"`, 'g'))].map((m) => [Number(m[1]), m[2]]));
const cites = (x) => [...x.matchAll(/<sup class="ap-c">\[([\d,]+)\]<\/sup>/g)].flatMap((m) => m[1].split(',').map(Number));
// đoạn chứa chữ `needle` (theo khối <li>/<p>/<h3>/<div> nhỏ nhất) phải có trích dẫn trỏ về link chứa `dom`
const citedTo = (s, id, needle, dom) => {
  const refs = refsOf(s, id);
  const blocks = [...s.matchAll(/<(li|p|h3|b|span)\b[^>]*>(?:(?!<\/?\1\b)[\s\S])*?<\/\1>/g)].map((m) => m[0]).filter((b) => b.includes(needle));
  return blocks.some((b) => cites(b).some((n) => (refs[n] || '').includes(dom)));
};

// ---------- vị trí, sidebar, ảnh nền ----------
const main = (html.match(/<main class="wrap" data-view="ap" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
const at = ids.indexOf('ap-compete') + 3; // 3 slide chart đối thủ #ap-vs-* (tests/check-ap-vs.mjs) đứng ngay sau #ap-compete
ok(at >= 3 && ids[at - 3] === 'ap-compete' && ids[at] === 'ap-vs-win' && ids[at + 1] === 'ap-app' && ids[at + 2] === 'ap-scope' && at + 3 === ids.length, `cần thứ tự ap-compete, ap-app, ap-scope (trang cuối, task orn3 bỏ ap-role): ${ids}`);
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
const sbIds = [...sb.matchAll(/data-sec="([\w-]+)"/g)].map((m) => m[1]);
ok(sbIds.join(',') === ids.join(','), `sidebar lệch thứ tự trang: ${sbIds}`);
for (const id of ['ap-app', 'ap-scope']) {
  const a = (sb.match(new RegExp(`<a href="#${id}"[\\s\\S]*?<\\/a>`)) || [''])[0];
  ok(['ja', 'en', 'vi'].every((l) => a.includes(`data-l="${l}"`)), `sidebar #${id} thiếu 3 ngôn ngữ`);
  ok(((html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').includes(`'${id}'`) && existsSync(p(`assets/pg/${id}.webp`)), `thiếu ảnh nền assets/pg/${id}.webp trong IDS`);
}

// ---------- #ap-app ----------
const a = sec('ap-app');
ok(a, 'thiếu #ap-app');
ok(lang(a, 'ja').includes('ANDPAD - カンタン施工管理アプリ'), 'phải nêu đúng tên app chính thức trên App Store: ANDPAD - カンタン施工管理アプリ');
ok(/Tên chính thức/.test(lang(a, 'vi')) && /App Store/.test(lang(a, 'vi')) && /Google Play/.test(lang(a, 'vi')), 'VI phải có nhãn "Tên chính thức" + App Store + Google Play');
ok(citedTo(a, 'ap-app', 'ANDPAD - カンタン施工管理アプリ', 'apps.apple.com'), 'tên app phải trích dẫn trang App Store');
ok(citedTo(a, 'ap-app', 'jp.andpad.android', 'play.google.com'), 'Google Play (jp.andpad.android) phải trích dẫn trang Google Play');
for (const n of ['ANDPAD CHAT', 'ANDPAD 図面']) ok(a.includes(n), `thiếu app đi kèm ${n}`);
ok(citedTo(a, 'ap-app', 'クラウド型建設プロジェクト管理サービス', 'mic-r.co.jp'), 'thiếu cách hãng tự giới thiệu (クラウド型建設プロジェクト管理サービス) kèm nguồn MIC cho vị trí số 1');
ok(!/No\.1/.test(lang(a, 'ja')), 'JA không dùng "No.1" (văn phong tự khen, xem check-ja-copy-style)');
const feats = [...a.matchAll(/<li class="ap-ft"/g)].length;
ok(feats >= 7, `cần >= 7 chức năng của app Quản lý thi công, thấy ${feats}`);
for (const f of ['案件管理', '工程表', '写真', '報告', '多言語']) ok(a.includes(f), `thiếu chức năng ${f}`);
ok(citedTo(a, 'ap-app', '案件管理', 'andpad.jp/products/construction_management'), 'chức năng phải trích dẫn trang sản phẩm 施工管理');
ok(/30[\s\S]{0,12}50/.test(lang(a, 'vi')) && citedTo(a, 'ap-app', '30〜50％', 'andpad.jp/news/20251006'), 'thiếu kết quả thí điểm VN 30 đến 50% (nguồn andpad.jp/news/20251006)');
ok(/Bài toán/.test(lang(a, 'vi')) && /hỗ trợ/i.test(lang(a, 'vi')), 'VI phải có mục Bài toán và cách hỗ trợ doanh nghiệp');
ok(/Tiếng Việt|tiếng Việt/.test(lang(a, 'vi')) && /Chat/.test(lang(a, 'vi')) && /Bản vẽ/.test(lang(a, 'vi')), 'phải nêu bản tiếng Việt gồm Quản lý thi công, Chat, Bản vẽ');

// ---------- #ap-scope ----------
const s = sec('ap-scope');
ok(s, 'thiếu #ap-scope');
const vi = lang(s, 'vi');
ok(/184[.,]5/.test(vi) && /304[.,]3/.test(vi) && citedTo(s, 'ap-scope', '1,845億円', 'yano.co.jp'), 'quy mô 建設テック Nhật (Yano: 184,5 tỷ yên FY2023, 304,3 tỷ yên FY2030) + nguồn Yano');
ok(/80[.,]61/.test(vi) && citedTo(s, 'ap-scope', '806.1億ドル', 'mordorintelligence.com') && citedTo(s, 'ap-scope', '36.88％', 'mordorintelligence.com'), 'quy mô xây dựng VN 80,61 tỷ USD (Mordor) + nguồn');
ok(/Thị phần/.test(vi) && /không công bố/.test(vi), 'VI phải có "Thị phần" và ghi rõ % không công bố');
ok(!/(ANDPAD|thị phần)[^.]{0,40}\d+[.,]?\d*\s?%/i.test(vi.replace(/36[.,]88\s?%|9[.,]3\s?%|8[.,]6\s?%|6[.,]1\s?%|39[.,]6\s?%|7[.,]4\s?%|7[.,]51\s?%|30 đến 50\s?%/g, '')), 'không được bịa % thị phần của ANDPAD');
ok(citedTo(s, 'ap-scope', 'MIC', 'andpad.jp/news/20251218') || citedTo(s, 'ap-scope', 'MIC', 'mic-r.co.jp'), 'thị phần Nhật phải trích MIC / tin ANDPAD 12/2025');
for (const c of ['Tokyo', 'Sendai', 'Osaka', 'Fukuoka']) ok(vi.includes(c), `khu vực Nhật thiếu văn phòng ${c}`);
ok(/9[.,]3/.test(vi) && /8[.,]6/.test(vi) && citedTo(s, 'ap-scope', '483,823', 'mlit.go.jp'), 'phân bố doanh nghiệp xây dựng (Tokyo 9,3%, Osaka 8,6%) + nguồn MLIT');
ok(/TP\.HCM/.test(vi) && /Hà Nội/.test(vi) && /36[.,]88/.test(vi), 'khu vực VN: TP.HCM (36,88% giá trị xây dựng), Hà Nội');
ok(citedTo(s, 'ap-scope', '南北の主要都市', 'andpad.jp/news/20251006'), 'kế hoạch mở rộng ở các thành phố lớn Bắc Nam phải trích andpad.jp/news/20251006');
ok(/nhận định/i.test(vi) && /ứng viên|của tôi/.test(vi), 'phần phân tích phải ghi rõ là nhận định của ứng viên');
ok(/MISA AMIS/.test(s) && citedTo(s, 'ap-scope', 'MISA AMIS', 'amis.misa.vn'), 'đối thủ có mặt tại VN (MISA AMIS) phải trích trang của chính MISA');

// cùng con số ở cả 3 ngôn ngữ
for (const [ja, en, vi] of [[/1,845億/, /184\.5bn/, /184,5 tỷ/], [/3,043億/, /304\.3bn/, /304,3 tỷ/], [/806\.1億ドル/, /80\.61bn/, /80,61 tỷ USD/], [/36\.88％/, /36\.88%/, /36,88%/], [/483,823/, /483,823/, /483\.823/], [/9\.3％/, /9\.3%/, /9,3%/]])
  ok(ja.test(lang(s, 'ja')) && en.test(lang(s, 'en')) && vi.test(lang(s, 'vi')), `#ap-scope: số liệu lệch giữa JA/EN/VI: ${ja}`);
for (const [ja, en, vi] of [[/30〜50％/, /30 to 50%/, /30 đến 50%/], [/2\.7/, /2\.7/, /2,7/], [/10万回/, /100K\+/, /100\.000/]])
  ok(ja.test(lang(a, 'ja')) && en.test(lang(a, 'en')) && vi.test(lang(a, 'vi')), `#ap-app: số liệu lệch giữa JA/EN/VI: ${ja}`);

// mọi trích dẫn của 2 trang trỏ được về một dòng nguồn
for (const [id, x] of [['ap-app', a], ['ap-scope', s]]) {
  const refs = refsOf(x, id);
  const used = [...new Set(cites(x))];
  ok(used.length >= 6 && used.every((n) => refs[n]), `#${id}: số trích dẫn không có dòng nguồn: ${used.filter((n) => !refs[n])}`);
  ok(!/—/.test(x), `#${id}: không dùng dấu gạch ngang dài`);
}

if (fails.length) { console.error('FAIL check-ap-app:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-app: 2 trang #ap-app, #ap-scope đủ tên app, chức năng, bài toán, thị trường, thị phần, khu vực, nhận định, có nguồn');
