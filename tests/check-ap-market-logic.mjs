// Task xwk4 ("bài toán này tôi không hiểu lắm, hãy giải thích nó logic và có kết nối các ý"): trang #ap-market
// phải đọc thành một mạch: lời dẫn nêu chuỗi nhân quả (ít giờ + ít người, việc không giảm => phải số hoá quản lý thi công),
// 4 khối đánh số theo 4 câu hỏi nối tiếp (1 vì sao, 2 ai đang giải, 3 có hiệu quả không, 4 làm sao dùng được),
// 3 thẻ bối cảnh nối bằng dấu "+" và "=>" (giờ bị giới hạn + người ít đi => nhà nước đặt mục tiêu).
// Chạy: node tests/check-ap-market-logic.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const s = (html.match(/<section class="pg"[^>]*id="ap-market"[\s\S]*?<\/section>/) || [''])[0];
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (x) => x.replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok(s, 'không thấy section #ap-market');

// 1) lời dẫn: chuỗi nhân quả đủ 3 vế, 3 ngôn ngữ
const L = (l) => strip((s.match(new RegExp(`<p class="kw-sub ap-sub[^"]*"[^>]*data-l="${l}">([\\s\\S]*?)</p>`)) || [])[1] || '');
const vi = L('vi').toLowerCase(), en = L('en').toLowerCase(), ja = L('ja');
ok(/giờ/.test(vi) && /người/.test(vi) && /không giảm/.test(vi) && /số hóa|số hoá/.test(vi) && /4 câu hỏi/.test(vi),
  `lời dẫn (vi) chưa nêu chuỗi: giờ bị giới hạn + ít người, việc không giảm => số hoá, 4 câu hỏi: "${vi}"`);
ok(/hours/.test(en) && /workers/.test(en) && /digiti[sz]e/.test(en) && /four/.test(en), `lời dẫn (en) chưa nêu chuỗi: "${en}"`);
ok(/残業/.test(ja) && /働き手/.test(ja) && /デジタル化/.test(ja) && /4つの問い/.test(ja), `lời dẫn (ja) chưa nêu chuỗi: "${ja}"`);
ok(!/nhân lực/.test(vi), 'lời dẫn (vi) không viết "nhân lực" (thống nhất với task k8md: cần ít nhân công hơn)');

// 2) 4 nhãn câu hỏi đánh số 1..4, 3 ngôn ngữ, đúng thứ tự trước 4 khối
const qs = [...s.matchAll(/<span class="lbl ap-q" data-l="(ja|en|vi)"><i>(\d)<\/i>([^<]+)<\/span>/g)];
for (const l of ['ja', 'en', 'vi']) {
  const n = qs.filter((m) => m[1] === l).map((m) => m[2]).join('');
  ok(n === '1234', `nhãn câu hỏi (${l}) phải là 1,2,3,4 theo thứ tự, thấy "${n}"`);
}
const pos = (re) => s.search(re);
const q = (d) => s.indexOf(`<span class="lbl ap-q" data-l="ja"><i>${d}</i>`);
ok(q(1) > 0 && q(1) < pos(/<ul class="ap-ctx/), 'nhãn 1 phải đứng trước 3 thẻ bối cảnh');
ok(q(2) > pos(/<ul class="ap-ctx/) && q(2) < pos(/<h3 data-l="ja">製品：ANDPAD/), 'nhãn 2 phải nằm ở khối thị trường');
ok(q(3) > pos(/<div class="ap-css-cases/) && q(3) < pos(/<ul class="ap-cslist/), 'nhãn 3 phải nằm ở khối case');
ok(q(4) > pos(/<div class="card ap-sp/) && q(4) < pos(/<ol class="ap-sps/), 'nhãn 4 phải nằm ở khối hỗ trợ');
const viQ = qs.filter((m) => m[1] === 'vi').map((m) => m[3].toLowerCase());
ok(/vì sao/.test(viQ[0] || '') && /ai/.test(viQ[1] || '') && /hiệu quả/.test(viQ[2] || '') && /dùng/.test(viQ[3] || ''),
  `nội dung 4 câu hỏi (vi) chưa đúng mạch: ${viQ.join(' | ')}`);

// 3) 3 thẻ bối cảnh nối bằng phép cộng / suy ra
const ops = [...((s.match(/<ul class="ap-ctx[\s\S]*?<\/ul>/) || [''])[0]).matchAll(/<li\b([^>]*)>/g)].map((m) => (m[1].match(/data-op="([^"]*)"/) || [])[1] || '');
ok(ops.join('|') === '+|⇒|', `3 thẻ bối cảnh phải nối "+" rồi "⇒", thấy "${ops.join('|')}"`);
ok(/\.ap-ctx li\[data-op\]::after\{[^}]*content:attr\(data-op\)/.test(html), 'thiếu CSS hiện dấu nối giữa thẻ bối cảnh');
ok(/\.ap-q i\{/.test(html), 'thiếu CSS số thứ tự của nhãn câu hỏi');

ok(!/[—–―]/.test(strip(s)), 'có dấu gạch dài');
ok(!qs.filter((m) => m[1] === 'ja').some((m) => m[3].includes('・')), 'JA có dấu "・"');

if (fails.length) { console.error('FAIL check-ap-market-logic:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-market-logic: #ap-market đọc thành mạch (lời dẫn nhân quả, 4 câu hỏi đánh số, thẻ bối cảnh nối + / ⇒), 3 ngôn ngữ');
