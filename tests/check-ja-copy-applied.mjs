// Văn phong JA đã ÁP vào trang (task l9cx, theo references/ja-copy-style.md của skill personal-business-portfolio).
// check-ja-copy-style chặn cụm cấm; test này kiểm phần "nên làm": tầng giọng, số tự ước tính có 「自己試算」,
// bộ ba 「〜こと。」 đúng 1 lần, danh sách đồng dạng, không 「〜を行い」 chung chung, đơn vị 「名分」 nhất quán.
// Chạy: node tests/check-ja-copy-applied.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8')
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ');
// Chuẩn hoá dấu khoảng 〜 (U+301C) và ~ về ～ để không lọt số viết khác dấu.
const txt = (s) => s.replace(/[〜~]/g, '～').replace(/<br \/>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// Chữ JA: phần tử mang data-l="ja" (thẻ con không lồng cùng tên).
const ja = [...html.matchAll(/<(\w+)\b([^>]*)\bdata-l="ja"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ attrs: m[2], t: txt(m[3]) }));
ok(ja.length > 150, `chỉ thấy ${ja.length} khối JA`);

// 1) Tầng giọng: câu dẫn p.kw-sub kết です・ます; tiêu đề h2.kw kết 「。」.
// Lấy chữ JA của từng phần tử: cả phần tử mang data-l="ja", hoặc <span data-l="ja"> con trực tiếp.
const jaOf = (open, inner) => /data-l="ja"/.test(open) ? txt(inner)
  : /data-l="(en|vi)"/.test(open) ? '' : txt((inner.match(/<span data-l="ja">([\s\S]*?)<\/span>(?=<span data-l=|$)/) || [])[1] || '');
// task 4n9v: bỏ số trích dẫn nguồn <sup class="ap-c">n</sup> (không phải chữ của câu) trước khi xét đuôi câu
const subs = [...html.matchAll(/(<p class="kw-sub[^"]*"[^>]*>)([\s\S]*?)<\/p>/g)].map((m) => jaOf(m[1], m[2].replace(/<sup class="ap-c">[^<]*<\/sup>/g, ''))).filter(Boolean);
ok(subs.length >= 12, `chỉ thấy ${subs.length} câu dẫn kw-sub JA`);
for (const s of subs) ok(/(ます|ました|です)(（[^）]*）)?。$/.test(s), `kw-sub JA không kết です・ます: "${s.slice(0, 40)}"`);
// Tiêu đề h2.kw (trừ tên riêng ở trang hồ sơ).
const h2s = [...html.matchAll(/(<h2 class="kw[^"]*"[^>]*>)([\s\S]*?)<\/h2>/g)].map((m) => jaOf(m[1], m[2]))
  .filter((s) => s && s !== 'タイ チャン ホアン ニャ');
ok(h2s.length >= 15, `chỉ thấy ${h2s.length} tiêu đề h2.kw JA`);
for (const s of h2s) {
  ok(/[。]$/.test(s), `h2 JA không kết 「。」: "${s}"`);
  ok(!/(です|ます)。$/.test(s), `h2 JA dùng です・ます (tiêu đề phải 常体): "${s}"`);
}

// 2) Số tự ước tính (3～4倍, 3～4名分, 80～90%) trong câu / nhãn JA phải kèm 「自己試算」 hoặc 「私の見方」,
//    Không xét cảnh minh hoạ gx (chip sinh từ tools/gx/build.mjs) và tiêu đề h2 (mẫu 2: số đã có ở thẻ ngay dưới).
// Hàng chip keyword (.chips) là tóm tắt câu dẫn ngay trên (câu đó đã kèm 「自己試算」) nên cũng bỏ qua.
const noGx = html.replace(/<figure class="gx[\s\S]*?<\/figure>/g, ' ').replace(/<div class="chips"[^>]*>[\s\S]*?<\/div>/g, ' ').replace(/<h2\b[\s\S]*?<\/h2>/g, ' ');
const jaBody = [...noGx.matchAll(/<(\w+)\b[^>]*\bdata-l="ja"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => txt(m[2]));
let est = 0;
for (const t of jaBody) {
  if (!/\d+～\d+(倍|名分|%)/.test(t)) continue;
  est++;
  ok(/自己試算|私の見方/.test(t), `số tự ước tính thiếu 「自己試算」: "${t.slice(0, 50)}"`);
}
ok(est >= 4, `chỉ thấy ${est} chỗ nêu số tự ước tính (sai cấu trúc?)`);

// 3) Bộ ba 「〜こと。」 đúng 1 lần toàn trang (mẫu 7), ba vế khác đuôi.
const all = ja.map((x) => x.t).join('\n');
// Đếm từng chuỗi câu liền nhau cùng kết 「こと。」 trong 1 khối; cần đúng 1 chuỗi, dài đúng 3 vế.
const runs = ja.flatMap((x) => x.t.match(/(?:[^。]+?こと。){2,}/g) || []).map((r) => r.match(/こと。/g).length);
ok(runs.length === 1 && runs[0] === 3, `bộ ba 「〜こと。」 cần đúng 1 chuỗi 3 vế, thấy [${runs.join(', ')}]`);

// 4) Danh sách đồng dạng: kỹ năng #jil (ol.jil-sk ja) cùng kết 「力」.
const sk = (html.match(/<ol class="jil-sk"[^>]*data-l="ja">([\s\S]*?)<\/ol>/) || [])[1] || '';
const items = [...sk.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => txt(m[1]));
ok(items.length >= 4, `ol.jil-sk ja chỉ có ${items.length} mục`);
for (const i of items) ok(/力$/.test(i), `ol.jil-sk ja mục không đồng dạng 「〜力」: "${i}"`);

// 5) Động từ cụ thể, không 「〜を行い」 chung chung; đơn vị người 「名」 không lẫn 「人分 / 人で」 (kể cả tiêu đề).
ok(!/を行い/.test(all), `còn 「〜を行い」 chung chung: "${(all.match(/[^。\n]{0,20}を行い[^。\n]{0,10}/) || [''])[0]}"`);
const allH2 = all + '\n' + h2s.join('\n');
ok(!/\d人(分|で)/.test(allH2), 'đơn vị lẫn 「人分 / 人で」 (dùng 「名」 như phần còn lại)');

if (fails.length) { console.error(`FAIL check-ja-copy-applied (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-ja-copy-applied: ${h2s.length} tiêu đề, ${subs.length} câu dẫn, ${ja.length} khối JA đúng văn phong`);
