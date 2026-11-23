// Task zze2: thiết kế lại TOÀN BỘ icon + hình minh hoạ vẽ tay (tab Team / AI) theo phong cách kính mờ 3D cam-xanh
// (cùng chất liệu với bộ gprflexeye_intro). Ảnh chụp thật (assets/sales) và biểu đồ số liệu không thuộc phạm vi.
// Chạy: node tests/check-visual-redesign.mjs [index.html] (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const file = process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url));
const root = dirname(file);
const html = readFileSync(file, 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sha = (b) => createHash('sha1').update(b).digest('hex').slice(0, 16);

// Đọc kích thước + cờ alpha của WebP (VP8 / VP8L / VP8X)
function webpInfo(b) {
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10) };
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff), alpha: !!((v >> 28) & 1) }; }
  if (k === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false };
  return null;
}

// 1) Icon: mỗi symbol trong sprite là 1 icon 3D của bộ icon video GPRFLEXEYE (assets/gx/*.webp, task v3c1), không còn nét vẽ line cũ
const syms = [...html.matchAll(/<symbol id="(ic-[\w-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)];
ok(syms.length >= 13, `sprite chỉ có ${syms.length} symbol (cần >= 13)`);
const iconHashes = new Set();
for (const [, id, body] of syms) {
  ok(!/<(path|rect|circle|line|polyline)\b/.test(body), `#${id}: còn nét vẽ line SVG cũ`);
  const href = (body.match(/<image\b[^>]*\bhref="([^"]+)"/) || [])[1] || '';
  ok(/^assets\/gx\/[a-z-]+\.webp$/.test(href), `#${id}: cần <image href="assets/gx/<icon video>.webp">, thấy "${href}"`);
  const p = join(root, href);
  if (!href || !existsSync(p)) { ok(false, `#${id}: không có file ${href}`); continue; }
  const b = readFileSync(p), info = webpInfo(b), kb = b.length / 1024;
  ok(info && info.w === info.h && info.w >= 96 && info.w <= 256, `#${id}: cần webp vuông 96..256px, thấy ${info ? info.w + 'x' + info.h : 'không phải webp'}`);
  ok(info && info.alpha, `#${id}: icon phải có nền trong suốt (alpha)`);
  ok(kb > 1 && kb < 40, `#${id}: nặng ${kb.toFixed(1)} KB (cần 1..40 KB)`);
  iconHashes.add(sha(b));
}
ok(iconHashes.size === syms.length, 'có icon bị dùng trùng file');

// 2) 14 hình minh hoạ tĩnh cũ (assets/skills) đã thay bằng cảnh động .gxs từ icon video (task v3c1, kiểm chi tiết ở check-video-icons)
ok(!/assets\/skills\//.test(html), 'còn hình tĩnh assets/skills');
ok((html.match(/<div class="[^"]*\bgxs gxs--/g) || []).length === 12, 'cần 12 cảnh động .gxs (14 hình cũ, hình đầu tab AI / Team đã xoá theo task 3yar / ixrw)');

// 2b) Clip workflow 6 bước (tools/team-flow): icon là icon video assets/gx có file thật, 6 poster đã dựng lại
const eng = readFileSync(join(root, 'tools/team-flow/engine.html'), 'utf8');
const engIcons = JSON.parse(((eng.match(/const ICONS = (\[[^\]]*\])/) || [])[1] || '[]').replace(/'/g, '"'));
ok(engIcons.length === 6, `engine: cần 6 icon 3D (const ICONS), thấy ${engIcons.length}`);
for (const n of engIcons) ok(existsSync(join(root, `assets/gx/${n}.webp`)), `engine: thiếu assets/gx/${n}.webp`);
ok(!/el\('circle'|el\('path', \{ d: 'M4 6/.test(eng.slice(eng.indexOf('const NODES'))), 'engine: còn icon vẽ tay (circle/path) trong ô bước');
const OLD_POSTER = { ja: '7bfcd308ec9a48f9', 'ja-m': '1525bbb2844f3aa8', en: '5298e44412ac0635', 'en-m': 'ae2e638af37ca8b8', vi: '44740e2e9508357d', 'vi-m': '75dca92b464f8653' };
for (const [k, h] of Object.entries(OLD_POSTER)) {
  const p = join(root, `assets/workflow/team-flow-${k}.webp`);
  ok(existsSync(p) && sha(readFileSync(p)) !== h, `team-flow-${k}.webp: poster clip chưa dựng lại với icon mới`);
}

// 3) Khung icon: bỏ ô gradient tím đặc, dùng ô kính sáng để icon 3D nổi; trạng thái mờ / sáng của phim workflow vẫn phân biệt được
const css = (html.match(/\.sv-ib\{[^}]*\}/) || [''])[0];
ok(css && !/#3b2f86/.test(css), '.sv-ib vẫn là ô gradient tím cũ');
ok(/\.mv-dot>\.sv-ic\{[^}]*(opacity|filter)/.test(html), 'phim workflow: icon ở trạng thái chưa sáng phải mờ đi (.mv-dot>.sv-ic opacity/filter)');

if (fails.length) { console.error(`FAIL check-visual-redesign (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-visual-redesign: ${syms.length} icon 3D của video (webp alpha), 12 cảnh động .gxs thay hình tĩnh, ô icon sáng`);
