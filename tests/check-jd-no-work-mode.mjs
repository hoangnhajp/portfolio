// Task wkfo: người vận hành yêu cầu xoá dòng "Hình thức làm việc: Full-time, làm việc trực tiếp tại văn phòng (Onsite)."
// khỏi JD ANDPAD (cả trang index.html lẫn fixture nguồn tests/fixtures/jd-andpad.txt mà tools/jd/build.mjs đọc).
// Chạy: node tests/check-jd-no-work-mode.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const fails = [];
for (const f of ['index.html', 'tests/fixtures/jd-andpad.txt']) {
  const s = readFileSync(p(f), 'utf8').normalize('NFC');
  if (/Hình thức làm việc/.test(s)) fails.push(`${f}: còn "Hình thức làm việc"`);
  if (/\(Onsite\)/.test(s)) fails.push(`${f}: còn "(Onsite)"`);
}
const html = readFileSync(p('index.html'), 'utf8').normalize('NFC');
// Hai dòng kề bên phải còn nguyên
for (const keep of ['<b>Thời gian làm việc:</b> Thứ Hai', '<b>Ngày nghỉ:</b> Thứ Bảy và Chủ Nhật.']) {
  if (!html.includes(keep)) fails.push(`index.html mất dòng kề bên: ${keep}`);
}
if (fails.length) { console.error('FAIL\n' + fails.join('\n')); process.exit(1); }
console.log('OK check-jd-no-work-mode');
