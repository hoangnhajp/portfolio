// Task nu9w: slide JILNESTA (#w-jil) bỏ câu dẫn "Rà soát định kỳ, dẫn đến gia hạn hợp đồng" (cụt, không ý nghĩa),
// thay bằng "Quản lý đội ngũ kinh doanh outsourcing nhân sự và dự án IT cho khách hàng" và làm nổi bật bằng chữ + workflow động:
// 1) tiêu đề h2 đủ JA / EN / VI theo ý mới, không còn "rà soát định kỳ / gia hạn hợp đồng" trong tiêu đề, không lỗi "đội ngữ";
// 2) cảnh .gx của section là workflow (gx--flow) 6 bước: tự đi sales -> hiểu nhu cầu -> đặc tả (Excel + hình) -> đội dev -> app / web -> đội 1 -> 5~6 (bước cuối nổi bật);
// 3) thẻ Startup kể đủ ý (chưa có đội kinh doanh, tự đi sales, hiểu nhu cầu dự án IT, viết đặc tả cơ bản, trao đổi đội dev, app và web theo yêu cầu, đội 1 -> 5~6);
// 4) thẻ Kỹ năng đạt được: đúng 5 kỹ năng mỗi ngôn ngữ (hiểu ý khách, nắm nhu cầu đặc tả, kỹ thuật / thuật ngữ IT, đặc tả bằng Excel và hình, tuyển dụng + build team dev).
// Chạy: node tests/check-jil-startup.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (html.match(/<section [^>]*\bid="w-jil"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'không thấy section #w-jil');
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const lang = (s, l) => [...s.matchAll(new RegExp(`<(span|div|ol|p) [^>]*data-l="${l}"[^>]*>([\\s\\S]*?)</\\1>`, 'g'))].map((m) => text(m[2])).join(' | ');

// 1) Tiêu đề
const h2 = (sec.match(/<h2 class="kw[^"]*"[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '';
const hv = lang(h2, 'vi'), he = lang(h2, 'en'), hj = lang(h2, 'ja');
ok(/Quản lý đội ngũ kinh doanh/.test(hv) && /outsourcing nhân sự/.test(hv) && /dự án IT/.test(hv) && /khách hàng/.test(hv), `tiêu đề VI chưa đúng ý mới: "${hv}"`);
ok(/sales team/i.test(he) && /staffing/i.test(he) && /IT projects/.test(he), `tiêu đề EN chưa đúng ý mới: "${he}"`);
ok(/営業チーム/.test(hj) && /人材/.test(hj) && /IT案件/.test(hj), `tiêu đề JA chưa đúng ý mới: "${hj}"`);
ok(!/Rà soát định kỳ|gia hạn hợp đồng|Regular reviews|contract renewals|定期レビュー|契約の更新/i.test(h2), 'tiêu đề vẫn còn câu dẫn cũ "rà soát định kỳ / gia hạn hợp đồng"');
ok(!/đội ngữ/.test(sec), 'còn lỗi chính tả "đội ngữ" (đúng là "đội ngũ")');
ok(!/Rà soát định kỳ|gia hạn|Regular reviews|renew|定期レビュー|契約の?更新/i.test(sec), 'slide vẫn còn ý cũ "rà soát định kỳ / gia hạn hợp đồng" (kể cả thẻ số)');
ok(!/Selling myself/.test(sec), 'EN "Selling myself" sai nghĩa (tự quảng bá bản thân)');

// 2) Workflow động
const fig = (sec.match(/<figure class="gx [^"]*"[\s\S]*?<\/figure>/) || [''])[0];
ok(/^<figure class="gx gx--flow gx--long"/.test(fig), 'cảnh #w-jil phải là workflow 6 bước (gx--flow gx--long)');
const steps = fig.match(/<div class="gx-st[^"]*"[\s\S]*?<\/b>/g) || [];
ok(steps.length === 6, `workflow cần 6 bước, có ${steps.length}`);
ok((fig.match(/<i class="gx-ln"/g) || []).length === 5, 'workflow cần 5 đường nối');
ok(steps.length === 6 && /gx-st is-hot/.test(steps[5]) && !steps.slice(0, 5).some((s) => /is-hot/.test(s)), 'chỉ bước cuối (đội 1 -> 5~6) được nổi bật');
const fv = lang(fig, 'vi');
for (const k of ['Tự đi sales', 'nhu cầu', 'đặc tả', 'đội dev', 'App và web', '1 → 5~6']) ok(fv.includes(k), `workflow VI thiếu ý "${k}"`);
ok(/Excel/.test(fig), 'workflow thiếu chip Excel + hình ở bước đặc tả');

// 3) + 4) Chữ: thẻ Startup + thẻ Kỹ năng
const tv = lang(sec.replace(fig, '').replace(h2, ''), 'vi').toLowerCase();
for (const k of ['chưa thành lập', 'tự đi sales', 'thấu hiểu nhu cầu dự án it', 'viết đặc tả cơ bản', 'đội dev', 'app và web theo yêu cầu', 'từ 1 người lên 5~6 người', 'kỹ năng đạt được'])
  ok(tv.includes(k), `chữ VI thiếu ý "${k}"`);
const rest = sec.replace(fig, '').replace(h2, '');
for (const k of ['Before a sales team existed', 'IT project needs', 'basic specs', 'dev team', 'apps and websites', '1 person to 5~6']) ok(lang(rest, 'en').includes(k), `chữ EN thiếu ý "${k}"`);
for (const k of ['営業チームがない', '自ら営業', 'ニーズ', '基本仕様', '開発チーム', 'アプリとWeb', '1名から5〜6名']) ok(lang(rest, 'ja').includes(k), `chữ JA thiếu ý "${k}"`);
const lists = { ja: [], en: [], vi: [] };
for (const m of sec.matchAll(/<ol class="jil-sk"[^>]*data-l="(ja|en|vi)">([\s\S]*?)<\/ol>/g)) lists[m[1]] = m[2].match(/<li>[\s\S]*?<\/li>/g) || [];
for (const l of ['ja', 'en', 'vi']) ok(lists[l].length === 6, `danh sách kỹ năng ${l} cần đúng 6 mục (task 6vyj thêm báo giá, hợp đồng, HDSD), có ${lists[l].length}`);
const sv = lists.vi.map(text).join(' | ').toLowerCase();
for (const k of ['hiểu ý khách hàng', 'nhu cầu', 'thuật ngữ it', 'excel', 'hình', 'tuyển dụng', 'team dev']) ok(sv.includes(k), `kỹ năng VI thiếu "${k}"`);
const se = lists.en.map(text).join(' | ').replace('Recruit', 'recruit');
for (const k of ['Excel', 'terminology', 'recruit']) ok(se.includes(k), `kỹ năng EN thiếu "${k}"`);
ok(/<style[^>]*>[^]*?\.jil-sk\{/.test(html), 'thiếu CSS .jil-sk cho danh sách kỹ năng');

if (fails.length) { console.error(`FAIL check-jil-startup (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-jil-startup: tiêu đề mới 3 ngôn ngữ, workflow 6 bước (bước cuối nổi bật), thẻ Startup đủ ý, 6 kỹ năng x 3 ngôn ngữ');
