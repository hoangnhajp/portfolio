// Lượt soát cuối trước khi đẩy (task umv5): câu chữ JA/EN/VI còn gượng sau 9yrc + z7gh, soát từ ảnh chụp 4 tab x 3 ngôn ngữ.
// Chạy: node tests/check-copy-final-pass.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// 1. JA: mô tả thẻ công tác dùng です・ます như thân bài, không dừng ở thể từ điển
for (const p of ['技術打ち合わせに招待される', '社長から直接案内を受ける<', '社長から直接案内を受ける"']) ok(!html.includes(p), `JA còn câu dừng ở thể từ điển: ${p}`);
// Khoá bảng dịch phải khớp đúng chữ JA trên trang (không làm hỏng bảng dịch)
for (const k of ['その後の技術打ち合わせに招かれました', '社長から直接案内を受けました']) {
  ok(html.split(k).length - 1 === 2, `JA "${k}" phải có đúng 2 lần (trang + khoá bảng dịch)`);
}

// 2. EN: câu gượng / không song song
for (const p of ['a workload that used to take', 'people make the judgement and the final call', 'on analysing the root causes of problems, solving them, and']) ok(!html.includes(p), `EN còn câu gượng "${p}"`);

// 3. VI: văn dịch, trộn "mình" với "tôi", tên kỳ thi
for (const p of ['hỏi máy nén NH3', 'Tôi rà lịch', '"Được mời dự họp sáng nối', 'các cuộc họp mình tham gia', 'Đỗ Năng lực tiếng Nhật', 'Con người kiểm tra kết quả AI trước khi dùng, rồi']) ok(!html.includes(p), `VI còn cụm gượng "${p}"`);
ok(!html.includes('—'), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-copy-final-pass (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-copy-final-pass: JA thẻ công tác dùng ます, khoá bảng dịch khớp, EN/VI không còn cụm gượng đã soát');
