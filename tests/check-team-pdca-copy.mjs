// Task j2u3: chữ tab Team Management theo yêu cầu người vận hành.
// 1) #team-top: tiêu đề "Tôi quản lý đội ngũ bằng số liệu action mỗi ngày / và tập trung vào đào tạo kỹ năng, nghiệp vụ, phát triển con người..."
//    (giữ câu phụ "Tôi đã dẫn dắt đội kinh doanh, IT và nhân sự bằng mục tiêu, vai trò rõ ràng và kèm cặp.").
// 2) #team-skills: tiêu đề "Cách tôi vận hành đội ngũ, qua nguyên tắc PDCA" (bỏ "6 nguyên tắc"), 6 thẻ = 6 bước PDCA:
//    kế hoạch bằng số hành động, quản lý thực hiện + phân tích báo cáo, điểm nghẽn, thảo luận giải quyết, đề xuất kaizen, đo lường kaizen.
// 3) tools/gx/build.mjs (nguồn mini nhãn 6 thẻ) khớp index.html, đủ JA/EN/VI.
// Chạy: node tests/check-team-pdca-copy.mjs [đường dẫn index.html khác]   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2] || root + 'index.html', 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section [^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1] || '';
const txt = (s) => s.replace(/<br \/>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const h2 = (s, l) => txt((s.match(new RegExp(`<h2 [^>]*>[\\s\\S]*?<span data-l="${l}">([\\s\\S]*?)</span>(?=<span data-l=|</h2>)`)) || [])[1] || '');

// 1) #team-top
const top = sec('team-top');
ok(top, 'thiếu section #team-top');
ok(h2(top, 'vi') === 'Tôi quản lý đội ngũ bằng số liệu action mỗi ngày và tập trung vào đào tạo kỹ năng, nghiệp vụ, phát triển con người để tạo ra kết quả.',
  `#team-top h2 vi chưa đúng yêu cầu: "${h2(top, 'vi')}"`);
ok(/行動/.test(h2(top, 'ja')) && /育成/.test(h2(top, 'ja')), `#team-top h2 ja chưa theo ý mới: "${h2(top, 'ja')}"`);
ok(/daily action/i.test(h2(top, 'en')) && /skills/i.test(h2(top, 'en')), `#team-top h2 en chưa theo ý mới: "${h2(top, 'en')}"`);
ok(top.includes('data-l="vi">Tôi đã dẫn dắt đội kinh doanh, IT và nhân sự bằng mục tiêu, vai trò rõ ràng và kèm cặp.</p>'), '#team-top mất câu phụ "Tôi đã dẫn dắt đội..."');

// 2) #team-skills
const sk = sec('team-skills');
ok(sk, 'thiếu section #team-skills');
ok(h2(sk, 'vi') === 'Cách tôi vận hành đội ngũ, qua nguyên tắc PDCA.', `#team-skills h2 vi chưa đúng: "${h2(sk, 'vi')}"`);
for (const l of ['ja', 'en']) ok(/PDCA/.test(h2(sk, l)), `#team-skills h2 ${l} thiếu PDCA: "${h2(sk, l)}"`);
ok(!/6 nguyên tắc|six principles|6つの軸|sáu việc/.test(sk), '#team-skills còn chữ cũ "6 nguyên tắc / six principles / 6つの軸 / sáu việc"');
for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="kw-sub[^"]*"[^>]*data-l="${l}">[^<]*(PDCA|Plan, Do, Check, Act|計画、実行、確認、改善)`).test(sk), `#team-skills câu phụ ${l} chưa nói PDCA`);

const cards = sk.split('<div class="card sv-card">').slice(1);
ok(cards.length === 6, `#team-skills cần 6 thẻ, thấy ${cards.length}`);
const h3 = (c, l) => (c.match(new RegExp(`<h3 data-l="${l}">([^<]*)</h3>`)) || [])[1] || '';
const WANT_VI = ['Thiết lập kế hoạch bằng số hành động', 'Quản lý thực hiện và phân tích báo cáo', 'Tìm ra điểm nghẽn (bottleneck)',
  'Thảo luận, bàn bạc giải quyết điểm nghẽn', 'Đề xuất kaizen', 'Thực hiện, kiểm tra, đo lường kaizen'];
const WANT_EN = [/plan/i, /track|analyse/i, /bottleneck/i, /discuss/i, /kaizen/i, /measure/i];
const WANT_JA = [/計画/, /実行/, /ボトルネック/, /話し合/, /改善|カイゼン/, /測定/];
cards.forEach((c, i) => {
  ok(h3(c, 'vi') === WANT_VI[i], `thẻ ${i + 1} h3 vi "${h3(c, 'vi')}", cần "${WANT_VI[i]}"`);
  ok(WANT_EN[i].test(h3(c, 'en')), `thẻ ${i + 1} h3 en chưa đúng ý: "${h3(c, 'en')}"`);
  ok(WANT_JA[i].test(h3(c, 'ja')), `thẻ ${i + 1} h3 ja chưa đúng ý: "${h3(c, 'ja')}"`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p data-l="${l}">[^<]{12,}</p>`).test(c), `thẻ ${i + 1} thiếu đoạn mô tả ${l}`);
  ok(!/SOP|KPI|日本語で|tiếng Nhật|in Japanese/.test(c.replace(/<div class="sv-spot[\s\S]*?<!--\/gxs-->/, '')), `thẻ ${i + 1} còn ý cũ (SOP / KPI / báo cáo tiếng Nhật)`);
});

// 3) nguồn mini nhãn tools/gx/build.mjs khớp index.html
const b = readFileSync(root + 'tools/gx/build.mjs', 'utf8');
const lab = (key) => [...((b.match(new RegExp(`'${key}': \\{[^\\n]*`)) || [''])[0]).matchAll(/L\('([^']+)', '([^']+)', '([^']+)'\)/g)].map((m) => m.slice(1));
['t1-targets', 't2-steps', 't3-numbers', 't4-cause', 't5-people', 't6-connect'].forEach((key, i) => {
  const L = lab(key);
  ok(L.length === 3, `build.mjs ${key}: cần 3 nhãn, thấy ${L.length}`);
  const spot = (cards[i] || '').match(/<div class="sv-spot[\s\S]*?<!--\/gxs-->/)?.[0] || '';
  ok(spot.includes(`data-k="${key}"`), `thẻ ${i + 1} phải giữ data-k="${key}"`);
  for (const [ja, en, vi] of L) ok(spot.includes(`<span data-l="ja">${ja}</span><span data-l="en">${en}</span><span data-l="vi">${vi}</span>`), `thẻ ${i + 1}: nhãn "${vi}" của build.mjs chưa có trong index.html (chạy lại node tools/gx/build.mjs)`);
});
ok(/'t3-numbers'[^\n]*bottleneck/.test(b) && /'t5-people'[^\n]*kaizen|'t5-people'[^\n]*改善案/.test(b), 'build.mjs: mini nhãn chưa theo PDCA (điểm nghẽn ở thẻ 3, kaizen ở thẻ 5)');

if (fails.length) { console.error(`FAIL check-team-pdca-copy (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-team-pdca-copy: ${checks} điểm kiểm, #team-top tiêu đề mới, #team-skills PDCA + 6 thẻ JA/EN/VI, build.mjs khớp index.html`);
