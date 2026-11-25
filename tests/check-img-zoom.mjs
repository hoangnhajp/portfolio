// Task oj95: bấm vào hình nào trên portfolio thì phóng to hình đó (lightbox). Chạy: node tests/check-img-zoom.mjs (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const block = (name) => (html.match(new RegExp(`<!-- ${name}:start -->([\\s\\S]*?)<!-- ${name}:end -->`)) || [])[1] || '';

const css = block('zoom-css');
const js = block('zoom');
ok(css, 'thiếu khối <!-- zoom-css:start/end -->');
ok(js, 'thiếu khối <!-- zoom:start/end -->');

// Hình được phóng to: mọi <img> trong main.wrap trừ icon 3D (assets/gx) và logo (assets/logos)
ok(/main\.wrap img/.test(css) && /cursor:zoom-in/.test(css), 'hình chưa có con trỏ zoom-in');
ok(/assets\/gx\//.test(css) && /assets\/logos\//.test(css), 'CSS chưa loại icon gx / logo');
ok(/assets\\?\/\(gx\|logos\)\\?\//.test(js) || (/assets\\\/gx/.test(js) && /logos/.test(js)), 'JS chưa loại icon gx / logo');
const photos = [...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/assets\/(gx|logos)\//.test(s));
ok(photos.length >= 12, `chỉ thấy ${photos.length} hình phóng to được (cần >= 12 ảnh công tác Sales)`);

// Hộp xem ảnh: dialog, nút đóng / trước / sau, chú thích theo alt, phím Esc ← →, khoá cuộn, ảnh nét nhất (currentSrc)
ok(/role['"]?,\s*['"]dialog|role="dialog"/.test(js) && /aria-modal/.test(js), 'hộp xem ảnh chưa là role=dialog aria-modal');
ok(/Escape/.test(js) && /ArrowLeft/.test(js) && /ArrowRight/.test(js), 'thiếu phím Esc / ← / →');
ok(/currentSrc/.test(js), 'chưa mở ảnh theo currentSrc');
ok(/\.alt\b/.test(js), 'chưa lấy chú thích từ alt (đổi theo ngôn ngữ)');
ok(/閉じる/.test(js) && /Close/.test(js) && /Đóng/.test(js), 'nút đóng chưa đủ JA / EN / VI');
ok(/stopImmediatePropagation/.test(js), 'chưa chặn phím / bấm lọt sang Slide view khi đang xem ảnh');
ok(/addEventListener\('click'[\s\S]*?,\s*true\)/.test(js), 'bấm hình phải bắt ở pha capture (trước Slide view)');
ok(/tabindex/i.test(js) && /Enter/.test(js), 'chưa mở được bằng bàn phím (tabindex + Enter)');

// Khối zoom nạp trước Slide view để chặn phím trước sv (window keydown capture)
const iZoom = html.indexOf('<!-- zoom:start -->'), iSv = html.indexOf('<!-- sv:start -->');
ok(iZoom > 0 && iSv > 0 && iZoom < iSv, 'khối zoom phải đứng trước khối sv');

// In: ẩn hộp xem; reduced-motion: không hiệu ứng
ok(/@media print[^{]*\{[^}]*#zm/.test(css), 'bản in chưa ẩn hộp xem ảnh');
ok(/prefers-reduced-motion/.test(css), 'chưa tắt hiệu ứng khi reduced-motion');
// Chỉ animate transform / opacity
for (const m of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?\})\s*\}/g)) {
  const props = [...m[1].matchAll(/([a-z-]+)\s*:/g)].map((p) => p[1]);
  ok(props.every((p) => p === 'transform' || p === 'opacity'), `keyframes chỉ được dùng transform / opacity: ${props.join(',')}`);
}

if (fails.length) { console.error('FAIL check-img-zoom:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-img-zoom: ${photos.length} hình phóng to được, hộp xem ảnh đủ phím / nút / 3 ngôn ngữ`);
