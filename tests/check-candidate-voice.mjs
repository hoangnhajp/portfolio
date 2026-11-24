// Giọng ứng viên (task bybv): chữ portfolio đọc như ứng viên kể cho nhà tuyển dụng, không phải gạch đầu dòng CV cứng.
// Chạy: node tests/check-candidate-voice.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const bullets = (l) => [...prof.matchAll(new RegExp(`<div class="lines" data-l="${l}">([\\s\\S]*?)</div>`, 'g'))]
  .flatMap((m) => [...m[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].filter((p) => !/^\s*<b>/.test(p[1])).map((p) => strip(p[1]))); // bỏ bảng ngày tháng
const share = (arr, re) => (arr.length ? arr.filter((s) => re.test(s)).length / arr.length : 0);
const pct = (x) => `${Math.round(x * 100)}%`;

// 1. Gạch đầu dòng kinh nghiệm nói ở ngôi thứ nhất / câu hoàn chỉnh
const ja = bullets('ja'), en = bullets('en'), vi = bullets('vi');
// task f5po: mỗi khối kinh nghiệm chỉ còn keyword + 1 câu, nên đếm >= 7 thay vì >= 20
// task p0r6: thẻ Sales #w-mycom thành workflow zigzag (không còn câu), nên còn >= 6
// task pt2m: thẻ HR #w-mycom cũng thành workflow 4 bước có icon (không còn .lines), nên còn >= 5
ok(ja.length >= 5 && ja.length === en.length && en.length === vi.length, `số gạch đầu dòng lệch ja/en/vi: ${ja.length}/${en.length}/${vi.length}`);
const sJa = share(ja, /(ました|ます|でした)。?$/), sEn = share(en, /^(I|I'm|I’ve|I've|My|When|As|At|In|With|After|Before)\b/), sVi = share(vi, /(^|\s)(Tôi|tôi)\s/);
ok(sJa >= 0.6, `JA: chỉ ${pct(sJa)} gạch đầu dòng là câu です・ます (cần >= 60%)`);
ok(sEn >= 0.6, `EN: chỉ ${pct(sEn)} gạch đầu dòng nói ở ngôi thứ nhất (cần >= 60%)`);
ok(sVi >= 0.5, `VI: chỉ ${pct(sVi)} gạch đầu dòng có chủ ngữ "tôi" (cần >= 50%)`);

// 2. Không sáo rỗng, không lặp công thức, xưng hô nhất quán
const viText = [...html.matchAll(/data-l="vi">([\s\S]*?)<\/(span|p|div)>/g)].map((m) => strip(m[1])).join(' ');
ok(!/(^|[\s,.(])bạn(?! bè)([\s,.!?)]|$)/i.test(viText), 'VI: còn gọi người đọc là "bạn" (dùng "anh/chị")');
for (const c of ['passionate', 'results-driven', 'dynamic', 'leverage', 'synergy', 'spearheaded', 'proven track record', 'go-getter', 'I am excited to'])
  ok(!new RegExp(`\\b${c}\\b`, 'i').test(html), `EN: còn sáo ngữ "${c}"`);
const n = (s) => html.split(s).length - 1;
ok(n('ご紹介します') <= 1, `JA: "ご紹介します" lặp ${n('ご紹介します')} lần`);
ok(n('Here is') <= 1, `EN: "Here is" lặp ${n('Here is')} lần`);
ok(n('貢献できると確信') <= 1, 'JA: "貢献できると確信" lặp');
ok(!html.includes('—'), 'có dấu gạch ngang dài');

// 3. Viết lại không làm rơi dữ kiện (MYCOM: khiếu nại; HR: tuyển dụng từ chưa kinh nghiệm)
const mycom = (html.match(/<section[^>]*id="w-mycom"[\s\S]*?<\/section>/) || [''])[0];
for (const [l, s] of [['ja', 'クレーム'], ['en', 'complaint'], ['vi', 'khiếu nại'], ['ja', '未経験'], ['vi', 'chưa có kinh nghiệm']])
  ok(mycom.includes(s), `#w-mycom (${l}) mất dữ kiện "${s}"`);
ok(mycom.includes('提案書'), '#w-mycom (ja) mất dữ kiện "提案書"');
const career = (html.match(/<section[^>]*id="career"[\s\S]*?<\/section>/) || [''])[0];
const ch2 = (career.match(/<h2[\s\S]*?<\/h2>/) || [''])[0];
for (const s of ['約11年', 'about 11 years', 'khoảng 11 năm']) ok(ch2.toLowerCase().includes(s.toLowerCase()), `#career h2 thiếu "${s}"`);
ok(career.includes('一身上の都合により'), '#career (ja) mất "一身上の都合により"');

// 4. Từ điển dịch một nguồn: bản dịch mới không bị window.__D2 ghi đè, không chép lặp var D
ok((html.match(/var D=\{/g) || []).length === 1, `var D bị khai báo ${(html.match(/var D=\{/g) || []).length} lần`);
ok(!/Object\.assign\(D\s*,/.test(html), 'còn khối Object.assign(D, ...) (bị __D2 ghi đè khi gộp); sửa thẳng trong __D2 / D');

// 5. Tóm tắt đầu Hồ sơ + câu phụ bìa viết theo giọng ứng viên (task gex9), không còn câu CV cũ, giữ dữ kiện
const OLD = ['主に法人営業、営業マネージャー、ITコミュニケーターを経験してまいりました', 'mainly in B2B sales, as a sales manager and as an IT communicator', 'chủ yếu ở mảng kinh doanh B2B, quản lý kinh doanh và IT communicator'];
for (const s of OLD) ok(!html.includes(s), `còn câu tóm tắt cũ "${s}"`);
// Task f5po: tóm tắt = hàng keyword (giữ dữ kiện cốt lõi) + đúng 1 câu ngôi thứ nhất
const card = (prof.match(/<span class="lbl">Summary[\s\S]*?<p data-l="vi">[\s\S]*?<\/p>/) || [''])[0];
const sum = (l) => strip((card.match(new RegExp(`<p data-l="${l}">([\\s\\S]*?)</p>`)) || ['', ''])[1]);
const kws = (l) => strip((card.match(new RegExp(`<div class="chips" data-l="${l}">([\\s\\S]*?)</div>`)) || ['', ''])[1]);
const sv = sum('vi'), se = sum('en'), sj = sum('ja');
ok(/^Tôi\s/.test(sv), 'VI tóm tắt: cần mở đầu "Tôi" (ngôi thứ nhất)');
ok(/^I\s/.test(se), 'EN tóm tắt: cần mở đầu "I" (ngôi thứ nhất)');
ok(/ました。$/.test(sj) && (sj.match(/。/g) || []).length === 1, 'JA tóm tắt: đúng 1 câu です・ます kể việc đã làm');
for (const [l, keys] of [['ja', ['約11年', 'JILNESTA', 'MAYEKAWA', '1名から5名']],
  ['en', ['about 11 years', 'JILNESTA', 'MAYEKAWA', '1 to 5']],
  ['vi', ['khoảng 11 năm', 'JILNESTA', 'MAYEKAWA', '1 lên 5']]])
  for (const k of keys) ok(kws(l).includes(k), `${l} keyword tóm tắt thiếu dữ kiện "${k}"`);

if (fails.length) { console.error(`FAIL check-candidate-voice (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-candidate-voice: ${ja.length} gạch đầu dòng x3, JA です・ます ${pct(sJa)}, EN ngôi thứ nhất ${pct(sEn)}, VI "tôi" ${pct(sVi)}, không sáo ngữ / lặp / "bạn", giữ dữ kiện MYCOM`);
