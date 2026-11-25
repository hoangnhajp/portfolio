// Task k8md ("các thông tin này chính xác không? double check luật mới nhất"): 3 thẻ bối cảnh ngành của #ap-market
// đối chiếu nguồn chính thức ngày 25/11/2026:
// - MHLW kensetsu_overtime: nguyên tắc 月45時間、年360時間; 特別条項 vẫn tối đa 年720時間 (+ 単月100時間未満, 平均80時間).
// - Nội các / MLIT (4/2026, 労働力調査 R7 = năm 2025): 55歳以上 36.6％, 29歳以下 11.9％.
// - MLIT i-Construction 2.0 (16/4/2024): 2040年度までに建設現場の省人化を少なくとも3割、すなわち生産性を1.5倍.
// Chạy: node tests/check-ap-market-facts.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const s = (html.match(/<section class="pg"[^>]*id="ap-market"[\s\S]*?<\/section>/) || [''])[0];
const ctx = (s.match(/<ul class="ap-ctx[\s\S]*?<\/ul>/) || [''])[0];
const items = [...ctx.matchAll(/<li\b[\s\S]*?<\/li>/g)].map((m) => m[0]);
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (x) => x.replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const lang = (li, l) => strip([...li.matchAll(new RegExp(`<span data-l="${l}">([\\s\\S]*?)</span>`, 'g'))].map((m) => m[1]).join(' '));

ok(items.length === 3, `#ap-market cần đúng 3 thẻ bối cảnh, thấy ${items.length}`);
const [ot, age, icon] = items;
if (items.length === 3) {
  // 1. trần làm thêm: nguyên tắc 45/360 + trần tuyệt đối 720 giờ/năm khi có thoả thuận đặc biệt
  for (const l of ['ja', 'en', 'vi']) {
    const t = lang(ot, l);
    ok(/45/.test(t) && /360/.test(t), `trần làm thêm (${l}) thiếu 45 / 360: ${t}`);
    ok(/720/.test(t), `trần làm thêm (${l}) thiếu mức tối đa 720 giờ/năm của thoả thuận đặc biệt: ${t}`);
  }
  ok(/原則/.test(lang(ot, 'ja')) && /特別条項/.test(lang(ot, 'ja')), 'JA phải ghi 原則 và 特別条項');
  ok(/nguyên tắc/i.test(lang(ot, 'vi')), 'VI phải ghi rõ 45/360 là mức nguyên tắc');
  // 2. tuổi lao động: đúng số và ghi năm dữ liệu 2025
  for (const l of ['ja', 'en', 'vi']) {
    const t = lang(age, l);
    ok(/36[.,]6/.test(t) && /11[.,]9/.test(t), `tuổi lao động (${l}) sai số: ${t}`);
    ok(/2025/.test(t), `tuổi lao động (${l}) thiếu năm dữ liệu 2025: ${t}`);
  }
  // 3. i-Construction 2.0: 省人化 (cần ít người hơn), năm tài khoá 2040, năng suất 1,5 lần; không viết "giảm nhân lực"
  for (const l of ['ja', 'en', 'vi']) {
    const t = lang(icon, l);
    ok(/2040/.test(t) && /30|3割/.test(t) && /1[.,]5/.test(t), `i-Construction (${l}) thiếu 2040 / 30% / 1,5 lần: ${t}`);
  }
  ok(/省人化/.test(lang(icon, 'ja')) && /建設現場/.test(lang(icon, 'ja')), 'JA phải giữ 建設現場の省人化');
  ok(!/nhân lực/.test(lang(icon, 'vi')), 'VI không viết "giảm nhân lực" (dễ hiểu thành cắt người; 省人化 = cần ít nhân công hơn)');
  ok(/tài khóa|tài khoá/.test(lang(icon, 'vi')), 'VI phải ghi năm tài khóa 2040');
}
for (const li of items) ok(!/[—–―]/.test(strip(li)), 'có dấu gạch dài');
ok(!items.some((li) => lang(li, 'ja').includes('・')), 'JA có dấu "・"');

if (fails.length) { console.error('FAIL check-ap-market-facts:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-ap-market-facts: 3 thẻ bối cảnh ngành khớp nguồn chính thức (MHLW 45/360 + 720, tuổi lao động 2025, i-Construction 2.0)');
