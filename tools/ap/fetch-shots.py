# Task ls8q: tải ảnh minh hoạ CHÍNH THỨC của từng sản phẩm ANDPAD (ảnh đại diện trong menu sản phẩm của andpad.jp,
# đúng ảnh gắn với link /products/<key>), làm phẳng nền trắng, đổi cỡ rộng 540px, lưu assets/ap/<key>.webp.
# Chỉ tải + đổi cỡ + đổi định dạng, không sửa nội dung ảnh. Nguồn tra cứu 25/11/2026.
# Chạy (từ thư mục repo): python tools/ap/fetch-shots.py
import io, pathlib, urllib.request
from PIL import Image

U = 'https://andpad.jp/wp-content/uploads/'
THEME = 'https://andpad.jp/wp-content/themes/andpad-service-site-theme-20261118.143904-RbMRxhNQYgdaeWDf/assets/dist/images/common/'
SHOTS = {  # key (= đường dẫn andpad.jp/products/<key>) : file ảnh trên andpad.jp
    'construction_management': U + 'eyecatch-construction_management.png', 'chat': U + 'eyecatch-chat.png',
    'drawings': U + 'eyecatch-drawings26.png', 'blackboard': U + 'eyecatch-blackboard_3_2.png',
    'inspection': U + 'eyecatch-inspection-2.png', 'remote_presence': U + 'eyecatch_remote.jpg',
    'safety_management': U + 'eyecatch-nyutaijyo.png', '3d_scan': U + 'eyecatch-3Dscan.jpg',
    'board': U + 'eyecatch-board.png', 'report': U + 'eyecatch-report.png', 'approval': U + 'eyecatch-shonin.jpg',
    'electronic_delivery': U + 'eyecatch-denshinohin.png', 'bim': U + 'eyecatch-bim.jpg', 'erp': U + 'eyecatch-erp2.png',
    'edi': U + 'eyecatch-edi.png', 'billing_management': U + 'eyecatch-seikyukanri_2.png', 'report_cost': U + 'eyecatch-bugakari.png',
    'ouchi_note': U + 'eyecatch_ouchi3.jpg', 'analytics': U + 'eyecatch-analytics.png', 'bm': U + 'eyecatch-BM_2608.png',
    'api': U + 'eyecatch_api.jpg', 'app_market': THEME + 'eyecatch-app-market.png',
}
OUT = pathlib.Path(__file__).resolve().parents[2] / 'assets' / 'ap'
OUT.mkdir(parents=True, exist_ok=True)
for key, url in SHOTS.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read()))
    im = im.convert('RGBA')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    if bg.width > 540:
        bg = bg.resize((540, round(bg.height * 540 / bg.width)), Image.LANCZOS)
    bg.save(OUT / f'{key}.webp', 'WEBP', quality=82, method=6)
    print('OK', key, bg.size)
