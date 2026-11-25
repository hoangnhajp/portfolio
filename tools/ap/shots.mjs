// Task ls8q: trang #ap-shots của tab Andpad Info, ngay sau #ap-products: lưới ảnh minh hoạ CHÍNH THỨC của từng sản phẩm.
// Ảnh = ảnh đại diện sản phẩm trên andpad.jp (menu sản phẩm, đúng link /products/<key>), tải + đổi cỡ bằng
// python tools/ap/fetch-shots.py vào assets/ap/<key>.webp (không sửa nội dung). Ảnh không bọc trong <a> để bấm phóng to được
// (khối zoom); link trang sản phẩm nằm ở chú thích. Module tách riêng để build.mjs chỉ cần 1 import + 1 dòng gọi.
// [key, tên chính thức, tên tiếng Anh, tên tiếng Việt, rộng, cao]
export const SHOTS = [
  ['construction_management', '施工管理', 'Construction Management', 'Quản lý thi công', 540, 368],
  ['chat', 'チャット', 'Chat', 'Chat', 540, 370],
  ['drawings', '図面', 'Drawings', 'Bản vẽ', 540, 363],
  ['blackboard', '黒板', 'Blackboard', 'Bảng đen điện tử', 540, 368],
  ['inspection', '検査', 'Inspection', 'Kiểm tra', 540, 348],
  ['remote_presence', '遠隔臨場', 'Remote Inspection', 'Nghiệm thu từ xa', 540, 414],
  ['safety_management', '入退場管理', 'Site Entry', 'Quản lý ra vào', 540, 368],
  ['3d_scan', '3Dスキャン', '3D Scan', 'Quét 3D', 540, 368],
  ['board', 'ボード', 'Board', 'Bảng tiến độ', 540, 368],
  ['report', 'レポート', 'Report', 'Báo cáo', 540, 372],
  ['approval', '資料承認', 'Document Approval', 'Duyệt hồ sơ', 540, 372],
  ['electronic_delivery', '電子納品', 'e-Delivery', 'Nộp hồ sơ điện tử', 540, 368],
  ['bim', 'BIM', 'BIM', 'BIM', 540, 368],
  ['erp', '引合粗利管理', 'Leads and Gross Profit', 'Cơ hội và lãi gộp', 540, 368],
  ['edi', '受発注', 'Ordering', 'Đặt hàng', 540, 372],
  ['billing_management', '請求管理', 'Billing', 'Quản lý hoá đơn', 540, 368],
  ['report_cost', '歩掛管理', 'Labour Productivity', 'Quản lý công', 540, 368],
  ['ouchi_note', 'おうちノート', 'Ouchi Note', 'App chủ nhà', 540, 372],
  ['analytics', 'Analytics', 'Analytics', 'Dashboard', 540, 368],
  ['bm', 'BM', 'Building Maintenance', 'Bảo trì toà nhà', 540, 368],
  ['api', 'API連携', 'API', 'Kết nối API', 540, 372],
  ['app_market', 'アプリマーケット', 'App Market', 'Chợ ứng dụng', 538, 368],
];
const url = (k) => (k === 'app_market' ? 'https://appmarket.andpad.jp/' : `https://andpad.jp/products/${k}`);

// b = bộ trích dẫn của trang (tools/ap/refs.mjs, task 4n9v): mỗi ảnh ghi số nguồn = trang sản phẩm có ảnh đó
export function pageShots({ L3, T, head, b }) {
  const subC = b.c('products');
  const tiles = SHOTS.map(([k, ja, en, vi, w, h], i) => `    <figure class="ap-sh" style="--i:${i}"><img src="assets/ap/${k}.webp" alt="ANDPAD ${ja}（${en}）" width="${w}" height="${h}" loading="lazy" decoding="async"><figcaption><a href="${url(k)}" target="_blank" rel="noopener">ANDPAD ${ja}</a>${L3('span', T(en, en, vi))}${b.c(k === 'app_market' ? 'appmarket' : `p_${k}`)}</figcaption></figure>`).join('\n');
  return `<section class="pg" data-chap="II" id="ap-shots">
${head('IMG　<b>PRODUCT VISUALS</b>', T('実際の画面で<br /><i>製品を見る。</i>', 'See each product<br /><i>on its real screens.</i>', 'Xem từng sản phẩm<br /><i>qua màn hình thật.</i>'),
    'Official images ／ andpad.jp ／ Click to zoom',
    T('andpad.jpの製品ページに載っている公式の画像です。画像を押すと拡大し、製品名から公式ページを開けます。',
      'Official images from the product pages on andpad.jp. Click an image to zoom in, or a product name to open its page.',
      'Ảnh chính thức trên trang sản phẩm của andpad.jp. Bấm vào ảnh để phóng to, bấm tên sản phẩm để mở trang gốc.'), subC)}
  <div class="ap-shs rv" style="--d:180ms">
${tiles}
  </div>
${b.list()}
</section>`;
}
