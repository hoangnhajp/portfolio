// Văn phong JA tự nhiên, chuyên nghiệp kiểu trang công ty / tin tức Nhật (task 9yrc):
// chú thích ảnh viết 体言止め, không văn dịch, không lặp công thức, không dồn 3 câu liền cùng đuôi.
// Chạy: node tests/check-ja-natural-style.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const dropOther = (s) => s.replace(/<(\w+)\b[^>]*\bdata-l="(en|vi)"[^>]*>[\s\S]*?<\/\1>/g, ' ');
const body = dropOther(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' '));
const segs = [...body.matchAll(/>([^<>]*[ぁ-んァ-ヶ一-龥][^<>]*)</g)].map((m) => m[1].trim());
const text = segs.join('\n');
const cnt = (s) => text.split(s).length - 1;
const sec = (id) => (html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];

// 1. Chú thích ảnh công tác (#sales-pr, #sales-trips): kiểu chú thích tin tức, không kể "〜しました"
const caps = ['sales-pr', 'sales-trips'].flatMap((id) => [...dropOther(sec(id)).matchAll(/<(figcaption|p class="ev-t"|b)[^>]*>([^<]*[ぁ-んァ-ヶ一-龥][^<]*)<\/(figcaption|p|b)>/g)].map((m) => m[2].trim()));
ok(caps.length >= 10, `chỉ thấy ${caps.length} chú thích JA ở #sales-pr / #sales-trips`);
const diary = caps.filter((s) => /(ました|ます)。?$/.test(s));
ok(diary.length === 0, `chú thích ảnh còn kiểu nhật ký "〜しました": ${diary.slice(0, 4).join(' / ')}`);

// 2. Không văn dịch / khẩu ngữ
for (const p of ['ようにしました', 'を行いました', 'ことができました', 'とても', 'いろいろ', 'たくさん', 'という形で'])
  ok(cnt(p) === 0, `JA còn cụm văn dịch / khẩu ngữ "${p}" (${cnt(p)})`);
ok(cnt('私は') <= 1, `JA lạm dụng chủ ngữ "私は" (${cnt('私は')})`);

// 3. Không lặp công thức
ok(cnt('まとめました') <= 4, `JA lặp "まとめました" ${cnt('まとめました')} lần (tối đa 4)`);
let run = [];
for (const s of segs) {
  const sents = s.split(/(?<=。)/).map((x) => x.trim()).filter((x) => /。$/.test(x));
  for (let i = 0; i + 2 < sents.length; i++) {
    const e = sents.slice(i, i + 3).map((x) => x.slice(-5));
    if (e[0] === e[1] && e[1] === e[2]) run.push(sents[i].slice(0, 20));
  }
}
ok(run.length === 0, `đoạn có 3 câu liền cùng đuôi: ${run.slice(0, 3).join(' / ')}`);

// 4. Dấu câu của site: không gạch dài, không thêm chấm giữa (chỉ cặp tên riêng PROPAK ASIA・VIV ASIA)
ok(!html.includes('—'), 'có dấu gạch ngang dài');
ok(cnt('・') - cnt('PROPAK ASIA・VIV ASIA') === 0, `JA có thêm dấu chấm giữa "・" (${cnt('・')})`);

if (fails.length) { console.error(`FAIL check-ja-natural-style (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-ja-natural-style: ${caps.length} chú thích ảnh kiểu tin tức, 0 cụm văn dịch, "まとめました" ${cnt('まとめました')} lần, không 3 câu liền cùng đuôi, không "—" / "・" thừa`);
