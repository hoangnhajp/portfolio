# Task 04fj: tải ảnh CHÍNH THỨC cho trang #ap-vn (ANDPAD tại Việt Nam): ảnh key visual trong thông cáo của ANDPAD
# (andpad.jp/news, andpad.co.jp/news, bản tiếng Anh của Media OutReach) và ảnh trên careers.andpad.vn.
# Chỉ tải + đổi cỡ (rộng 540px) + đổi định dạng WebP, không sửa nội dung ảnh. Ảnh nền trang (assets/pg/ap-vn.webp) chỉ cắt
# dọc giữa + đổi cỡ 800x1200 từ ảnh khai trương văn phòng Hà Nội. Nguồn tra cứu 25/11/2026.
# Chạy (từ thư mục repo): python tools/ap/fetch-vn.py
import io, pathlib, urllib.request
from PIL import Image

SHOTS = {  # key (= assets/ap/<key>.webp) : ảnh chính thức
    'vn-vi-app': 'https://andpad.jp/wp-content/uploads/ANDPAD20250626_KV-1200x675.jpg',  # bản tiếng Việt 6/2025
    'vn-en-app': 'https://andpad.jp/wp-content/uploads/ANDPAD_%E8%8B%B1%E8%AA%9E%E7%89%88-2048x1152.jpg',  # bản tiếng Anh 2/2025
    'vn-en-web': 'https://release.media-outreach.com/release.php/Images/683973/Picture1.png',  # bản web tiếng Anh 10/2025
    'vn-jetro': 'https://andpad.co.jp/wp-content/uploads/2023/12/231201_JETRO_KV-1026x577.png',  # được JETRO chọn 12/2023
    'vn-pilot': 'https://andpad.jp/wp-content/uploads/JETRO_japanese_KV-1200x675.jpg',  # thí điểm tại công trường VN
    'vn-dev': 'https://images.teamtailor-cdn.com/images/s3/teamtailor-production/user_picture_1200-v8/image_uploads/2c95de26-a2c9-4a06-aad0-8246fd6bf4b8/original.jpeg',
    'vn-hanoi': 'https://andpad.jp/wp-content/uploads/260406_%E3%83%8F%E3%83%8E%E3%82%A4%E3%82%AA%E3%83%95%E3%82%A3%E3%82%B9%E7%A7%BB%E8%BB%A2_KV_2_%E5%B7%AE%E3%81%97%E6%9B%BF%E3%81%88-1200x675.jpg',
    'vn-cs': 'https://images.teamtailor-cdn.com/images/s3/teamtailor-production/user_picture_1200-v8/image_uploads/67ccaca2-75cc-526a-4b50-b2d1bc22b42c/original.jpeg',
}
BG = 'https://andpad.jp/wp-content/uploads/260406_Hanoi_02.jpg'  # ảnh nền #ap-vn: khai trương văn phòng Hà Nội

ROOT = pathlib.Path(__file__).resolve().parents[2]


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read())).convert('RGBA')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[3])
    return bg


out = ROOT / 'assets' / 'ap'
out.mkdir(parents=True, exist_ok=True)
for key, url in SHOTS.items():
    im = get(url)
    if im.width > 540:
        im = im.resize((540, round(im.height * 540 / im.width)), Image.LANCZOS)
    im.save(out / f'{key}.webp', 'WEBP', quality=80, method=6)
    print('OK', key, im.size)

im = get(BG)
w = round(im.height * 2 / 3)  # cắt dọc giữa tỉ lệ 2:3
x = (im.width - w) // 2
im = im.crop((x, 0, x + w, im.height)).resize((800, 1200), Image.LANCZOS)
im.save(ROOT / 'assets' / 'pg' / 'ap-vn.webp', 'WEBP', quality=62, method=6)
print('OK bg ap-vn', im.size, (ROOT / 'assets' / 'pg' / 'ap-vn.webp').stat().st_size // 1024, 'KB')
