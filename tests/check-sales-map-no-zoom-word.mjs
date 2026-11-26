// Bản đồ công tác Sales (figure.mv.smap): bỏ chữ "phóng to" trên nhãn (cả JA 拡大 / EN zoomed),
// vẫn giữ tên vùng ở khung miền Tây và tiêu đề bản đồ chi tiết. Chạy: node tests/check-sales-map-no-zoom-word.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.error('FAIL ' + m); } };
const i = html.indexOf('<figure class="mv smap');
ok(i >= 0, 'không thấy bản đồ công tác figure.mv.smap');
const fig = html.slice(i, html.indexOf('</figure>', i));
const text = fig.replace(/<[^>]+>/g, ' ');
for (const w of ['phóng to', '拡大', 'zoomed', 'Zoomed', 'zoom in']) ok(!text.includes(w), `bản đồ còn chữ "${w}"`);
const box = fig.match(/class="sm-tag sm-tag--box"[^>]*>(.*?)<\/span><\/span>/);
ok(box && /data-l="ja">メコンデルタ</.test(box[0]) && /data-l="en">Mekong Delta</.test(box[0]) && /data-l="vi">Miền Tây</.test(box[0]), 'nhãn khung miền Tây phải còn tên vùng đủ 3 ngôn ngữ');
const md = fig.match(/class="sm-pn sm-pn--md">(.*?)<\/b><\/b>|class="sm-pn sm-pn--md">((?:<b class="sm-ph"[^>]*>[^<]*<\/b>){3})/);
const heads = (md && (md[2] || md[1]) || '');
ok(/data-l="ja">メコンデルタ<\/b>/.test(heads) && /data-l="en">Mekong Delta<\/b>/.test(heads) && /data-l="vi">Đồng bằng sông Cửu Long<\/b>/.test(heads), 'tiêu đề bản đồ chi tiết phải là tên vùng, không kèm chữ phóng to');
if (fail) process.exit(1);
console.log('OK check-sales-map-no-zoom-word: bản đồ công tác không còn chữ phóng to (JA/EN/VI), giữ tên vùng');
