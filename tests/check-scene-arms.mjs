// Cảnh nhân vật 3D bị vẽ sai tay (2 tay cùng một bên người, thiếu tay kia) đã vẽ lại:
//   jil7-handover (phim JILNESTA STEP 07, ông vest bên trái), jil6-customize (cậu bé trong khung gọi video),
//   pr5-visit (phim Sales 05, ông vest bên trái). Chặn bản lỗi quay lại bằng mã băm, kiểm bản thay thế là WebP
//   400x400 có kênh trong suốt. Chạy: node tests/check-scene-arms.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BAD = {
  'assets/sales/jil/jil7-handover.webp': 'd80c68991094156fc70f48ce2777388cfe90f1e9ed553e35203964342dff0073',
  'assets/sales/jil/jil6-customize.webp': '3164c0170fdb17bcdb60ee619c7036234c9470f5d50b84328e9872d3a1bee094',
  'assets/sales/pr/pr5-visit.webp': '991c6a52f69ae22cc99afcaf0c0547e6ac29d5fdcda76af4dfbb6314785915f8',
};
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

for (const [p, bad] of Object.entries(BAD)) {
  const buf = readFileSync(root + p);
  ok(createHash('sha256').update(buf).digest('hex') !== bad, `${p} vẫn là bản lỗi (2 tay cùng một bên)`);
  ok(buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP', `${p} không phải WebP`);
  ok(buf.toString('ascii', 12, 16) === 'VP8X' && (buf[20] & 0x10) !== 0, `${p} thiếu kênh trong suốt`);
  const w = 1 + buf.readUIntLE(24, 3), h = 1 + buf.readUIntLE(27, 3);
  ok(w === 400 && h === 400, `${p} cần 400x400, đang ${w}x${h}`);
  ok(buf.length > 8000 && buf.length < 120000, `${p} dung lượng lạ ${buf.length}`);
}

if (fails.length) { console.error('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`OK ${Object.keys(BAD).length} cảnh đã vẽ lại tay: bản mới, WebP 400x400 có alpha`);
