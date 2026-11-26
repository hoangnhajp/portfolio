// Task 6vyj: JILNESTA (bán phần mềm / IT offshore) có thêm việc làm tài liệu cho khách:
// báo giá, hợp đồng, tài liệu hướng dẫn sử dụng phần mềm. Kiểm 2 chỗ, đủ 3 ngôn ngữ:
//   #sales-jil-flow  bước 04 (đặc tả + báo giá + hợp đồng), bước 07 (bàn giao + hướng dẫn sử dụng), câu dẫn, chip
//   #w-jil           danh sách kỹ năng ol.jil-sk có mục báo giá / hợp đồng / hướng dẫn sử dụng
// Chạy: node tests/check-jil-docs-6vyj.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => { const a = html.indexOf(`id="${id}"`); return a < 0 ? '' : html.slice(a, html.indexOf('</section>', a)); };
const text = (s) => s.replace(/<[^>]+>/g, '').trim();
const pick = (s, re) => [...s.matchAll(re)].map((m) => text(m[1]));

// 1) #sales-jil-flow
const f = sec('sales-jil-flow');
ok(f, 'không thấy #sales-jil-flow');
const items = (f.match(/<ol class="sc-list[^>]*>([\s\S]*?)<\/ol>/) || [])[1] || '';
const steps = items.match(/<li>[\s\S]*?<\/li>/g) || [];
ok(steps.length === 8, `vẫn đúng 8 bước, có ${steps.length}`);
const want = {
  3: { ja: ['仕様書', '見積', '契約'], en: ['spec', 'quote', 'contract'], vi: ['đặc tả', 'báo giá', 'hợp đồng'] },
  6: { ja: ['納品', '検収', '操作マニュアル'], en: ['Deliver', 'user guide', 'acceptance'], vi: ['bàn giao', 'hướng dẫn sử dụng', 'nghiệm thu'] },
};
for (const [i, w] of Object.entries(want)) {
  const s = steps[i] || '';
  for (const l of ['ja', 'en', 'vi']) {
    const t = pick(s, new RegExp(`<(?:b|p) data-l="${l}">([\\s\\S]*?)<\\/(?:b|p)>`, 'g')).join(' | ');
    for (const k of w[l]) ok(t.toLowerCase().includes(k.toLowerCase()), `bước ${String(+i + 1).padStart(2, '0')} ${l} thiếu "${k}": ${t}`);
  }
}
const sub = (l) => pick(f, new RegExp(`<p class="kw-sub rv"[^>]*data-l="${l}">([\\s\\S]*?)<\\/p>`, 'g'))[0] || '';
for (const [l, ks] of Object.entries({ ja: ['見積', '契約', '操作マニュアル'], en: ['quotes', 'contracts', 'user guides'], vi: ['báo giá', 'hợp đồng', 'hướng dẫn sử dụng'] })) {
  const s = sub(l);
  for (const k of ks) ok(s.includes(k), `câu dẫn ${l} thiếu "${k}": ${s}`);
  ok(s.length <= 150, `câu dẫn ${l} dài ${s.length} > 150`);
}
const chips = (l) => pick(f, new RegExp(`<div class="chips" data-l="${l}">([\\s\\S]*?)<\\/div>`, 'g'))[0] || '';
for (const [l, k] of [['ja', '見積と契約'], ['ja', '操作マニュアル'], ['en', 'quotes and contracts'], ['en', 'user guides'], ['vi', 'báo giá, hợp đồng'], ['vi', 'hướng dẫn sử dụng']])
  ok(chips(l).includes(k), `chip ${l} thiếu "${k}"`);

// 2) #w-jil kỹ năng
const w = sec('w-jil');
const sk = {};
for (const m of w.matchAll(/<ol class="jil-sk"[^>]*data-l="(ja|en|vi)">([\s\S]*?)<\/ol>/g)) sk[m[1]] = (m[2].match(/<li>([\s\S]*?)<\/li>/g) || []).map(text);
const has = (l, ks) => (sk[l] || []).some((t) => ks.every((k) => t.toLowerCase().includes(k.toLowerCase())));
ok(has('ja', ['見積書', '契約書', '操作マニュアル']), 'kỹ năng JA thiếu mục 見積書 / 契約書 / 操作マニュアル');
ok((sk.ja || []).every((t) => /力$/.test(t)), 'kỹ năng JA phải cùng kết 「力」');
ok(has('en', ['quotes', 'contracts', 'user guides']), 'kỹ năng EN thiếu mục quotes / contracts / user guides');
ok(has('vi', ['báo giá', 'hợp đồng', 'hướng dẫn sử dụng']), 'kỹ năng VI thiếu mục báo giá / hợp đồng / hướng dẫn sử dụng');
ok(['ja', 'en', 'vi'].every((l) => (sk[l] || []).length === (sk.ja || []).length), 'số mục kỹ năng 3 ngôn ngữ phải bằng nhau');

if (fails.length) { console.error(`FAIL check-jil-docs-6vyj (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-jil-docs-6vyj: JILNESTA có báo giá, hợp đồng, tài liệu hướng dẫn sử dụng (bước 04, 07, câu dẫn, chip, kỹ năng) đủ JA/EN/VI');
