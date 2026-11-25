// Văn phong JA của ứng viên (task jme4): học cách viết của trang tuyển dụng PORTERS nhưng bỏ chất quảng cáo.
// Chặn trong chữ JA: tự khen / so sánh nhất, hứa / mời gọi, khẩu hiệu cảm xúc, khẩu ngữ phỏng vấn, dấu 「！」.
// Hướng dẫn đầy đủ: D:\Application\_staging\jme4\ja-copy-style.md (đề xuất chép vào skill personal-business-portfolio/references/).
// Giới hạn: chỉ đọc chữ giữa các thẻ, không đọc thuộc tính alt / title / aria-label.
// Chạy: node tests/check-ja-copy-style.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const dropOther = (s) => s.replace(/<(\w+)\b[^>]*\bdata-l="(en|vi)"[^>]*>[\s\S]*?<\/\1>/g, ' ');
const body = dropOther(html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' '));
const segs = [...body.matchAll(/>([^<>]*[ぁ-んァ-ヶ一-龥][^<>]*)</g)].map((m) => m[1].trim());

const BAN = {
  'tự khen / so sánh nhất': ['No.1', 'No. 1', 'ナンバーワン', '唯一無二', '圧倒的', '世界一', '業界トップ', '誇る', '誇り', '最高の', '完璧', '抜群', '誰よりも', '間違いなく', '絶対'],
  'hứa / mời gọi': ['お約束します', '貢献します', '確信して', 'ぜひ', '是非', 'お気軽に', 'ご連絡ください', 'お待ちしております', 'しませんか'],
  'khẩu hiệu cảm xúc': ['であれ。', 'ワクワク', 'わくわく', 'ジブンゴト', '全力で', '！'],
  'khẩu ngữ phỏng vấn': ['（笑）', '(笑)', 'すごい', 'バンバン', 'どんどん', 'おもいっきり', 'ちゃんと', 'かな。', 'よね。', 'っす。', 'っすね'],
};
const fails = [];
for (const [kind, words] of Object.entries(BAN))
  for (const w of words) {
    const hit = segs.filter((s) => s.includes(w));
    if (hit.length) fails.push(`${kind}: "${w}" x${hit.length} (vd: ${hit[0].slice(0, 40)})`);
  }
const kanarazu = segs.filter((s) => /必ず(?!しも)/.test(s));
if (kanarazu.length) fails.push(`tự khen / so sánh nhất: "必ず" x${kanarazu.length} (vd: ${kanarazu[0].slice(0, 40)})`);
const bang = segs.filter((s) => /[ぁ-んァ-ヶ一-龥][^!]{0,3}!/.test(s));
if (bang.length) fails.push(`dấu "!" sau chữ JA x${bang.length} (vd: ${bang[0].slice(0, 40)})`);
if (segs.length < 50) fails.push(`chỉ thấy ${segs.length} đoạn chữ JA (trang trống hoặc sai file?)`);

if (fails.length) { console.error(`FAIL check-ja-copy-style (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-ja-copy-style: ${segs.length} đoạn chữ JA, 0 cụm quảng cáo quá đà / hứa hẹn / khẩu ngữ phỏng vấn / "！"`);
