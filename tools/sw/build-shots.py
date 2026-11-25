"""Task g6pn: sinh ảnh chụp màn hình đã che cho tab Software Products.

Nguồn: ảnh chụp cũ của các phần mềm (ngoài repo, chỉ đọc). Mỗi ảnh: che các vùng có tên người, email, tên công ty,
tên / logo sản phẩm, đường link (pixel hoá khối lớn rồi làm mờ, không đọc lại được), rồi thu về rộng tối đa 1280px,
lưu WebP vào assets/sw/<tên>.webp. Nền trang (assets/pg/sw-*.webp, 800x1200) là ảnh đã che cắt dọc (BACKS) hoặc ảnh nền có sẵn lật ngang (PHOTO_BACKS), không sinh ảnh mới.
Chạy lại (thêm tên ảnh ở cuối để chỉ dựng lại ảnh đó, vd `staff-calc`): SW_SRC_STAFF=<thư mục> SW_SRC_CRM=<thư mục> SW_SRC_RECRUIT=<thư mục> python tools/sw/build-shots.py (cần Pillow).
Thư mục ảnh gốc chỉ có trên máy người vận hành (không ghi trong repo). Thiếu ảnh nguồn thì bỏ qua và báo, ảnh đã có giữ nguyên;
mục chưa có vùng che thì KHÔNG xuất (tránh lộ ảnh chưa che).
Sửa vùng che: sửa SHOTS bên dưới rồi chạy lại; toạ độ theo pixel ảnh GỐC (x0, y0, x1, y1).
"""
import os
import sys

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'sw')
PG = os.path.join(ROOT, 'assets', 'pg')

RM = os.path.join(os.environ.get('SW_SRC_STAFF', ''), '')
LD = os.path.join(os.environ.get('SW_SRC_CRM', ''), '')
TL = os.path.join(os.environ.get('SW_SRC_RECRUIT', ''), '')

# Vùng che chung của từng bộ ảnh: logo + tên sản phẩm, ô tài khoản / email ở header
RM_COMMON = [(18, 18, 242, 72), (20, 152, 236, 202), (976, 30, 1172, 62)]
# App quản lý khách hàng (task ve3p, ảnh 1568x698 giao diện English, dữ liệu cá nhân + chữ Việt đã blur trên trình duyệt
# trước khi chụp): che lớp 2 ở logo, tên sản phẩm, breadcrumb + tiêu đề header, ô tài khoản; cắt đáy bỏ con trỏ chuột
LD_COMMON = [(4, 4, 48, 44), (60, 6, 250, 40), (280, 4, 430, 50), (1060, 8, 1390, 48)]
CROP_1568 = (0, 0, 1568, 684)
# App tuyển dụng (task ve3p, ảnh 1568x698 giao diện English, tên ứng viên / mã CV / lương / công ty khách / người tạo đã
# blur trên trình duyệt): che lớp 2 ở logo, tên sản phẩm, breadcrumb, ô tài khoản header, user ở góc dưới thanh bên
TL_COMMON = [(4, 4, 52, 44), (58, 4, 244, 46), (262, 2, 430, 26), (1240, 8, 1436, 54), (56, 640, 244, 698)]

SHOTS = {
    # Quản lý nhân viên làm từ xa
    'staff-dashboard': (RM + '03_admin-dashboard-activity.png', RM_COMMON + [(628, 204, 810, 240), (300, 430, 452, 508)]),
    'staff-activity': (RM + '05_admin-dashboard-activity-tab.png', RM_COMMON + [(628, 204, 810, 240), (928, 578, 1028, 602), (928, 722, 1028, 746), (928, 817, 1028, 841)]),
    'staff-calendar': (RM + '08_admin-timesheet-detailed-calendar.png', RM_COMMON + [(1072, 144, 1256, 176)]),
    # Task ve3p: che thêm chữ tiếng Việt trong dữ liệu (cột tên timesheet, mô tả + nhãn bảng lương) để ảnh chỉ còn tiếng Anh
    'staff-calc': (RM + '12_admin-salary-calculator.png', RM_COMMON + [(312, 228, 500, 260), (306, 474, 448, 752), (300, 824, 545, 848), (690, 860, 1126, 960), (1372, 474, 1440, 752)]),
    'staff-alert': (RM + '13_admin-staff-notify-setting.png', RM_COMMON + [(1072, 144, 1256, 176), (300, 342, 444, 390), (710, 342, 806, 368), (1062, 342, 1204, 368), (326, 579, 506, 613), (827, 579, 1001, 616)]),
    # Quản lý khách hàng (task ve3p): ảnh giao diện English, mục thứ 3 = vùng cắt (tuỳ chọn)
    'crm-dashboard': (LD + 'crm-dashboard.jpg', LD_COMMON, CROP_1568),
    'crm-list': (LD + 'crm-list.jpg', LD_COMMON, CROP_1568),
    'crm-kanban': (LD + 'crm-kanban.jpg', LD_COMMON, CROP_1568),
    'crm-calendar': (LD + 'crm-calendar.jpg', LD_COMMON, CROP_1568),
    'crm-report': (LD + 'crm-report.jpg', LD_COMMON, CROP_1568),
    # Quản lý tuyển dụng (task ve3p): chụp lại ở giao diện English thay bộ ảnh tiếng Việt cũ
    'recruit-dashboard': (TL + 'recruit-dashboard.jpg', TL_COMMON + [(262, 84, 400, 106)], CROP_1568),
    'recruit-cv': (TL + 'recruit-cv.jpg', TL_COMMON, CROP_1568),
    'recruit-jd': (TL + 'recruit-jd.jpg', TL_COMMON, CROP_1568),
    'recruit-process': (TL + 'recruit-process.jpg', TL_COMMON, CROP_1568),
    'recruit-matching': (TL + 'recruit-matching.jpg', TL_COMMON, CROP_1568),
}

# Nền trang: (id section, ảnh đã che, tâm cắt theo tỉ lệ ngang 0..1). Chỉ cắt từ ảnh giao diện tiếng Anh (task ve3p).
BACKS = [('sw-top', 'staff-dashboard', 0.62), ('sw-remote', 'staff-calendar', 0.55), ('sw-talent', 'recruit-matching', 0.6), ('sw-leads', 'crm-list', 0.6)]
# Trang chưa có ảnh app tiếng Anh: lấy ảnh nền có sẵn của trang khác (lật ngang, chỉ đổi định dạng). Hiện không còn trang nào.
PHOTO_BACKS = []


def redact(img, boxes):
    img = img.convert('RGB')
    for x0, y0, x1, y1 in boxes:
        x0, y0 = max(0, x0), max(0, y0)
        x1, y1 = min(img.width, x1), min(img.height, y1)
        if x1 <= x0 or y1 <= y0:
            continue
        reg = img.crop((x0, y0, x1, y1))
        k = 14
        small = reg.resize((max(1, reg.width // k), max(1, reg.height // k)), Image.BILINEAR)
        reg = small.resize(reg.size, Image.NEAREST).filter(ImageFilter.GaussianBlur(6))
        img.paste(reg, (x0, y0))
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    missing = []
    only = set(sys.argv[1:])  # tuỳ chọn: chỉ dựng lại ảnh có tên này / nền có id trang này
    for name, (src, boxes, *crop) in SHOTS.items():
        if only and name not in only:
            continue
        if not boxes:
            print('SKIP', name, '(chưa có vùng che)'.encode('ascii', 'replace').decode())
            continue
        if not os.path.exists(src):
            missing.append(src)
            continue
        img = redact(Image.open(src), boxes)
        if crop:
            img = img.crop(crop[0])
        if img.width > 1280:
            img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
        img.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        print('shot', name, img.size)
    for sid, name, cx in BACKS:
        if only and not only & {sid, name}:
            continue
        f = os.path.join(OUT, name + '.webp')
        if not os.path.exists(f):
            missing.append(f)
            continue
        img = Image.open(f).convert('RGB')
        w = round(img.height * 2 / 3)
        x = min(max(0, round(img.width * cx - w / 2)), img.width - w)
        img = img.crop((x, 0, x + w, img.height)).resize((800, 1200), Image.LANCZOS)
        img.save(os.path.join(PG, sid + '.webp'), 'WEBP', quality=72, method=6)
        print('back', sid, os.path.getsize(os.path.join(PG, sid + '.webp')) // 1024, 'KB')
    for sid, name in PHOTO_BACKS:
        if only and sid not in only:
            continue
        if not os.path.exists(os.path.join(PG, name + '.webp')):
            missing.append(os.path.join(PG, name + '.webp'))
            continue
        img = Image.open(os.path.join(PG, name + '.webp')).convert('RGB').transpose(Image.FLIP_LEFT_RIGHT).resize((800, 1200), Image.LANCZOS)
        img.save(os.path.join(PG, sid + '.webp'), 'WEBP', quality=70, method=6)
        print('back', sid, '(flip ' + name + ')')
    for m in missing:
        print('MISSING', m, file=sys.stderr)


if __name__ == '__main__':
    main()
