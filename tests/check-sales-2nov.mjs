// Tab Sales thêm 3 trang (bản đồ công tác, chu trình 7 bước, nỗi lo khách hàng) + câu dẫn trang 1 nói trọn chu trình kinh doanh.
// Kiểm tĩnh: thứ tự 11 trang (8 MAYEKAWA + 3 JILNESTA), mục lục / số eb khớp, câu dẫn #sales-top (JA + từ điển VI / EN), bản đồ Việt Nam vẽ từ dữ liệu
// ranh giới thật (đúng vị trí tương đối các điểm GPS), cung mũi tên từ TP.HCM tới Đà Nẵng và 6 tỉnh miền Tây, kho lạnh + thủy
// hải sản ở mỗi điểm, workflow 7 bước có hình người que, trang nỗi lo khách hàng; CSS chỉ animate transform / opacity,
// có reduced-motion, in, màn hẹp; ảnh tồn tại.
// Chạy: node tests/check-sales-2nov.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const main = (html.match(/<main class="wrap" data-view="sales"[\s\S]*?<\/main>/) || [])[0] || '';
ok(main, 'thiếu tab Sales');
const want = ['sales-top', 'sales-map', 'sales-cycle', 'sales-pain', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi',
  'sales-jil-hcm', 'sales-jil-offshore', 'sales-jil-flow']; // 3 trang JILNESTA cuối tab (tools/jil/build.mjs, tests/check-sales-jil.mjs)
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([^"]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === want.join(','), `thứ tự trang Sales: ${ids.join(',')}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?</section>`)) || [])[0] || '';

// 1) Mục lục tab Sales và số eb khớp (TOP, 01..08)
const nav = (html.match(/<nav class="sb-nav" data-for="sales"[\s\S]*?<\/nav>/) || [])[0] || '';
const navs = [...nav.matchAll(/href="#([^"]+)" data-sec="[^"]+"><em>([^<]+)<\/em>/g)].map((m) => [m[1], m[2]]);
ok(navs.map((x) => x[0]).join(',') === want.join(','), `mục lục Sales: ${navs.map((x) => x[0]).join(',')}`);
navs.forEach(([id, n], i) => {
  ok(n === (i ? String(i).padStart(2, '0') : 'TOP'), `mục lục #${id} số ${n}`);
  const eb = (sec(id).match(/<span class="eb rv">([^　<]+)/) || [])[1];
  ok(eb === (i ? String(i).padStart(2, '0') : 'TASK'), `eb của #${id} là "${eb}", cần khớp mục lục ${n}`);
});
for (const id of want.slice(1, 4)) ok(/<a href="#[^"]+" data-sec="[^"]+"><em>\d\d<\/em><span data-l="ja">[^<]+<\/span><span data-l="en">[^<]+<\/span><span data-l="vi">[^<]+<\/span><\/a>/.test(nav.split(`#${id}"`)[1] ? `<a href="#${id}"` + nav.split(`#${id}"`)[1].split('</a>')[0] + '</a>' : ''), `mục lục #${id} cần đủ 3 ngôn ngữ`);

// 2) Câu dẫn trang 1: trọn chu trình kinh doanh, tư vấn kinh doanh + kỹ thuật cơ bản, đàm phán, đội kỹ sư (JA trong trang + VI / EN trong từ điển)
const subJa = strip((sec('sales-top').match(/<p class="kw-sub[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '');
ok(/営業サイクル全体/.test(subJa) && /技術/.test(subJa) && /交渉/.test(subJa) && /エンジニア/.test(subJa), `câu dẫn #sales-top (JA) chưa nói trọn chu trình / kỹ thuật / đàm phán / kỹ sư: ${subJa}`);
const dict = html.match(new RegExp(`"${subJa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\[\\s*"([^"]+)",\\s*"([^"]+)"`));
ok(dict, 'từ điển JA->VI/EN thiếu mục cho câu dẫn mới của #sales-top');
if (dict) {
  ok(/toàn bộ chu trình kinh doanh/.test(dict[1]) && /tư vấn kinh doanh/.test(dict[1]) && /tư vấn kỹ thuật cơ bản/.test(dict[1]) && /đàm phán/.test(dict[1]) && /kỹ sư/.test(dict[1]), `câu dẫn VI thiếu ý: ${dict[1]}`);
  ok(/^Đây là ghi chép công việc kinh doanh của tôi tại MAYEKAWA VIETNAM/.test(dict[1]), 'câu dẫn VI phải giữ câu gốc ở đầu');
  ok(/full sales cycle/.test(dict[2]) && /technical/.test(dict[2]) && /negotiat/.test(dict[2]) && /engineer/.test(dict[2]), `câu dẫn EN thiếu ý: ${dict[2]}`);
}

// 3) Bản đồ: dữ liệu ranh giới thật, điểm GPS đúng vị trí tương đối, cung mũi tên, kho lạnh, thủy hải sản
const mp = sec('sales-map');
ok(/<figure class="mv smap/.test(mp), '#sales-map thiếu khung phim .mv.smap');
const vn = [...mp.matchAll(/<path class="sm-vn" d="([^"]+)"/g)].map((m) => m[1]);
ok(vn.length === 2 && vn[0].length > 3000 && vn[1].length > 1500, 'bản đồ cần 2 path đất liền VN chi tiết (toàn quốc + phóng to miền Tây)');
ok((mp.match(/<path class="sm-nb"/g) || []).length === 2, 'bản đồ thiếu nước lân cận làm nền');
ok(/Quần đảo Hoàng Sa/.test(mp) && /Quần đảo Trường Sa/.test(mp) && /ホアンサ諸島/.test(mp) && /Truong Sa Islands/.test(mp), 'bản đồ thiếu Hoàng Sa / Trường Sa');
const pos = {};
for (const m of mp.matchAll(/<div class="sm-(?:pt|hcm)[^"]*" style="left:([\d.]+)%;top:([\d.]+)%">[\s\S]*?<span data-l="vi">([^<]+)<\/span>/g)) (pos[m[3]] ||= []).push([+m[1], +m[2]]);
const P = (n, i = 0) => (pos[n] || [])[i] || [NaN, NaN];
for (const n of ['TP.HCM', 'Đà Nẵng', 'Long An', 'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau']) ok(pos[n], `bản đồ thiếu điểm ${n}`);
ok((pos['TP.HCM'] || []).length === 2, 'TP.HCM phải có trên cả bản đồ toàn quốc và bản phóng to');
ok(P('Đà Nẵng')[1] < P('TP.HCM', 0)[1] - 25 && P('Đà Nẵng')[0] > P('TP.HCM', 0)[0], 'Đà Nẵng phải ở phía bắc, lệch đông so với TP.HCM');
const hcm2 = P('TP.HCM', 1);
for (const n of ['Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau']) ok(P(n)[0] < hcm2[0] && P(n)[1] > hcm2[1], `${n} phải ở tây nam TP.HCM`);
ok(P('Cà Mau')[0] < P('Bạc Liêu')[0] && P('Bạc Liêu')[1] > P('Sóc Trăng')[1] && P('Sóc Trăng')[0] > P('Cần Thơ')[0] && P('Cần Thơ')[1] < P('Hậu Giang')[1], 'vị trí tương đối các tỉnh miền Tây sai');
ok(P('Long An')[0] < hcm2[0] && P('Long An')[1] > hcm2[1] && P('Long An')[1] < P('Cần Thơ')[1], 'Long An phải ở giữa TP.HCM và Cần Thơ');
const arcs = [...mp.matchAll(/<g class="sm-arc sm-k(\d)"><path class="sm-ap" d="M([\d.]+),([\d.]+)Q([\d.]+),([\d.]+) ([\d.]+),([\d.]+)"/g)];
ok(arcs.length === 7, `cần 7 cung mũi tên từ TP.HCM (Đà Nẵng + 6 tỉnh), thấy ${arcs.length}`);
for (const a of arcs) {
  const [x0, y0, cx, cy, x1, y1] = a.slice(2).map(Number);
  ok(cy < Math.min(y0, y1) || (a[1] === '0' && cx > Math.max(x0, x1)), `cung sm-k${a[1]} phải cong lên trên rồi vòng xuống (điểm điều khiển cao hơn 2 đầu)`);
}
// đầu mũi tên dừng trước điểm đến 7..12 đơn vị (ngoài chấm đánh dấu, không đè, không hở xa)
for (const g of mp.matchAll(/<g class="sm-arc sm-k(\d)"><path class="sm-ap" d="M[\d.]+,[\d.]+Q[\d.]+,[\d.]+ ([\d.]+),([\d.]+)"[\s\S]*?<g transform="translate\(([\d.]+) ([\d.]+)\)/g)) {
  const d = Math.hypot(g[2] - g[4], g[3] - g[5]);
  ok(d >= 7 && d <= 12, `đầu mũi tên sm-k${g[1]} cách điểm đến ${d.toFixed(1)} (cần 7..12)`);
}
const arcDots = (mp.match(/class="sm-d"/g) || []).length;
ok(arcDots >= 50, `cung mũi tên cần chuỗi chấm chạy (${arcDots})`);
ok((mp.match(/class="sm-ah"/g) || []).length === 7, 'mỗi cung cần 1 đầu mũi tên');
ok((mp.match(/assets\/sales\/map\/cold-storage\.webp/g) || []).length === 7, 'mỗi điểm đến cần 1 kho lạnh nổi lên');
ok((mp.match(/assets\/sales\/map\/(fish|shrimp)\.webp/g) || []).length === 7 && /fish\.webp/.test(mp) && /shrimp\.webp/.test(mp), 'mỗi kho lạnh cần cá / tôm nổi lên trên');

// 4) Workflow 7 bước có người que
const cy = sec('sales-cycle');
ok(/<figure class="mv scyc/.test(cy), '#sales-cycle thiếu khung phim .mv.scyc');
const tts = [...cy.matchAll(/<div class="sc-tx sc-s\d">[\s\S]*?<\/div>/g)].map((m) => strip((m[0].match(/<b class="sc-tt" data-l="vi">([^<]+)/) || [])[1] || '') + ' | ' + strip((m[0].match(/<p class="sc-ds" data-l="vi">([^<]+)/) || [])[1] || ''));
ok(tts.length === 7, `cần 7 bước, thấy ${tts.length}`);
const need = [/nhu cầu mở kho lạnh/, /telesales.*Zalo.*email/, /Hẹn lịch.*thu thập đặc điểm kỹ thuật/, /đội kỹ sư.*chọn máy/, /báo giá.*đàm phán.*chốt hợp đồng/, /tiến độ/, /tận tay khách hàng/];
need.forEach((re, i) => ok(re.test(tts[i] || ''), `bước ${i + 1} sai ý: ${tts[i]}`));
const steps = ['step1-research', 'step2-call', 'step3-visit', 'step4-engineers', 'step5-quote', 'step6-delivery', 'step7-handover', 'man-consult'];
for (const f of steps) ok(existsSync(join(root, 'assets/sales/cycle', `${f}.webp`)), `thiếu ảnh assets/sales/cycle/${f}.webp`);
for (const f of steps.slice(0, 7)) ok(cy.includes(`assets/sales/cycle/${f}.webp`), `#sales-cycle chưa dùng ${f}.webp`);
ok((cy.match(/<li class="sc-nd/g) || []).length === 7 && (cy.match(/<ol class="sc-list[\s\S]*?<\/ol>/) || [''])[0].split('<li>').length - 1 === 7, 'cần 7 nút tiến trình + 7 dòng danh sách tĩnh');

// 4b) Mỗi bước có animation riêng mô tả đúng việc (lớp .sc-fx: đạo cụ chuyển động khác nhau theo bước) + người que chạy dọc dải bước
const fx = [...cy.matchAll(/<span class="sc-fx sc-s(\d)"[^>]*>([\s\S]*?)<\/span><!-- \/fx -->/g)];
ok(fx.length === 7, `cần 7 lớp hiệu ứng .sc-fx (mỗi bước 1), thấy ${fx.length}`);
const FX_IC = [/cold-storage[\s\S]*cold-storage/, /chat-bubbles[\s\S]*envelope/, /calendar[\s\S]*checklist/, /workflow-gears[\s\S]*lightbulb/, /jd-document[\s\S]*handshake/, /roadmap[\s\S]*sc-bar/, /shield-check/];
fx.forEach((m, i) => { ok(FX_IC[i].test(m[2]), `bước ${i + 1}: đạo cụ động chưa đúng việc`); ok((m[2].match(/class="sc-p /g) || []).length >= 2, `bước ${i + 1}: cần >= 2 đạo cụ động`); });
const fxNames = fx.map((m) => [...m[2].matchAll(/sc-p (scFx\w+)/g)].map((x) => x[1]).sort().join('+'));
ok(new Set(fxNames).size === 7, `7 bước phải có bộ chuyển động khác nhau: ${fxNames.join(' | ')}`);
ok(/<span class="sc-me"/.test(cy) && /@keyframes scMe\{/.test(html), 'thiếu người que chạy dọc dải 7 bước (.sc-me + scMe)');
// 5) Nỗi lo khách hàng -> tôi thu thập thông tin và giúp khách chọn
const sp = sec('sales-pain');
ok(/<figure class="mv spain/.test(sp), '#sales-pain thiếu khung phim .mv.spain');
const pv = [...sp.matchAll(/<div class="sp-cd sp-p[\s\S]*?<b data-l="vi">([^<]+)/g)].map((m) => m[1]).join(' | ');
ok(/kinh phí/.test(pv) && /kỹ thuật máy/.test(pv) && /sản phẩm nào tối ưu cho nhà máy/.test(pv), `nỗi lo khách hàng thiếu ý: ${pv}`);
ok((sp.match(/<div class="sp-cd sp-s/g) || []).length === (sp.match(/<div class="sp-cd sp-p/g) || []).length, 'mỗi nỗi lo cần 1 cách hỗ trợ');
ok(/assets\/sales\/cycle\/man-consult\.webp/.test(sp) && /thu thập thông tin/i.test(strip(sp)) && /giúp khách chọn/.test(strip(sp)), 'trang nỗi lo cần người que ở giữa + ý "thu thập thông tin, giúp khách chọn"');

// 6) CSS: khối riêng trong head, chỉ transform / opacity, chạy khi trang hiện, có reduced-motion / in / màn hẹp
const css = (html.match(/<!-- sales-css:start -->([\s\S]*?)<!-- sales-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- sales-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- sales-css:start/end --> trong <head>');
const kfs = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)];
ok(kfs.length >= 30, `keyframes quá ít (${kfs.length})`);
for (const k of kfs) for (const p of k[2].matchAll(/([a-z-]+)\s*:/g)) ok(['transform', 'opacity'].includes(p[1]), `keyframes ${k[1]} animate "${p[1]}" (chỉ transform/opacity)`);
for (const k of kfs) for (const st of k[2].matchAll(/([\d.]+)%/g)) ok(+st[1] <= 100, `keyframes ${k[1]} có mốc ${st[1]}% > 100`);
// mốc % trong mỗi keyframes phải tăng dần, bỏ qua 0% / 100% gộp kiểu 0%,100%{...} (mốc lùi thì trình duyệt tự sắp lại và chuyển động sai nhịp, vd người que mờ cả bước cuối)
for (const k of kfs) { const st = [...k[2].matchAll(/([\d.]+)%(?=[,{])/g)].map((m) => +m[1]).filter((v) => v !== 0 && v !== 100); ok(st.every((v, i) => !i || v >= st[i - 1]), `keyframes ${k[1]} có mốc lùi: ${st.join(',')}`); }
ok(/\.sc-p\{[^}]*animation-fill-mode:backwards/.test(css), 'đạo cụ động cần fill-mode backwards (không nháy lúc trễ)');
ok(/@keyframes spG0\{(?:(?!@keyframes)[\s\S])*?translateX\(24px\)/.test(css) && /\.sp-go\{[^}]*width:24px/.test(css), 'chấm sáng trang nỗi lo phải chạy hết đường nối 24px');
ok(/\.sm-d\{animation:smA\d [^}]*backwards/.test(css), 'chuỗi chấm cung cần fill-mode backwards (không nháy trong lúc trễ)');
ok(/html\.js \.pg\.in \.scyc \.scFx/.test(css), 'hiệu ứng từng bước chỉ chạy khi trang hiện (.pg.in)');
ok(/html\.js \.pg\.in \.smap/.test(css) && /html\.js \.pg\.in \.scyc/.test(css) && /html\.js \.pg\.in \.spain/.test(css), 'chuyển động chỉ chạy khi trang đã hiện (.pg.in)');
ok(/prefers-reduced-motion:reduce\)\{\.smap \*,\.scyc \*,\.spain \*\{animation:none/.test(css), 'thiếu reduced-motion cho 3 phim');
ok(/@media print\{[\s\S]*\.mv\.smap,\.mv\.spain\{display:block!important\}/.test(css), 'bản in phải hiện bản đồ + trang nỗi lo');
ok(/max-width:700px/.test(css), 'thiếu nhánh màn hẹp');
for (const f of ['cold-storage', 'fish', 'shrimp']) ok(existsSync(join(root, 'assets/sales/map', `${f}.webp`)), `thiếu icon assets/sales/map/${f}.webp`);
ok((main.match(/<figure class="mv (smap|scyc|spain) rv"[^>]*data-no-zoom>/g) || []).length === 3, 'hình động Sales mới phải có data-no-zoom (bấm icon không mở hộp phóng to)');
for (const id of want.slice(1, 4)) ok(existsSync(join(root, 'assets/pg', `${id}.webp`)), `thiếu ảnh nền assets/pg/${id}.webp`);

// 7) Cảnh gx: chip số trang tab Sales đếm 8 trang (đã bỏ trang 08 FLOW #sales-flow)
ok((sec('sales-top').match(/<span class="gx-step"><i><\/i><b>01<\/b> \/ 08<\/span>/) || []).length === 1, 'chip số trang của #sales-top phải là 01 / 08');
ok(/<b>08<\/b> \/ 08<\/span>/.test(sec('sales-kpi')), 'chip số trang của #sales-kpi phải là 08 / 08');

if (fails.length) { console.error(`FAIL check-sales-2nov (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-sales-2nov: Sales 11 trang (thêm bản đồ công tác, chu trình 7 bước, nỗi lo khách hàng), câu dẫn trọn chu trình, bản đồ đúng vị trí GPS, chỉ transform/opacity');
