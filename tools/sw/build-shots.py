"""Task g6pn: sinh ảnh chụp màn hình đã che cho tab Software Products.

Nguồn: ảnh chụp cũ của các phần mềm (ngoài repo, chỉ đọc). Mỗi ảnh: che các vùng có tên người, email, tên công ty,
tên / logo sản phẩm, đường link (pixel hoá khối lớn rồi làm mờ, không đọc lại được), rồi thu về rộng tối đa 1280px,
lưu WebP vào assets/sw/<tên>.webp. Nền trang (assets/pg/sw-*.webp, 800x1200) là ảnh đã che cắt dọc, không sinh ảnh mới.
Chạy lại: SW_SRC_STAFF=<thư mục> SW_SRC_RECRUIT=<thư mục> SW_SRC_CRM=<thư mục> python tools/sw/build-shots.py (cần Pillow).
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
TL = os.path.join(os.environ.get('SW_SRC_RECRUIT', ''), '')
LD = os.path.join(os.environ.get('SW_SRC_CRM', ''), '')

# Vùng che chung của từng bộ ảnh: logo + tên sản phẩm, ô tài khoản / email ở header
RM_COMMON = [(18, 18, 242, 72), (20, 152, 236, 202), (976, 30, 1172, 62)]
TL_COMMON = [(6, 6, 58, 56), (74, 12, 244, 46), (344, 6, 512, 32)]

SHOTS = {
    # Quản lý nhân viên làm từ xa
    'staff-dashboard': (RM + '03_admin-dashboard-activity.png', RM_COMMON + [(628, 204, 810, 240), (300, 430, 452, 508)]),
    'staff-activity': (RM + '05_admin-dashboard-activity-tab.png', RM_COMMON + [(628, 204, 810, 240), (928, 578, 1028, 602), (928, 722, 1028, 746), (928, 817, 1028, 841)]),
    'staff-calendar': (RM + '08_admin-timesheet-detailed-calendar.png', RM_COMMON + [(1072, 144, 1256, 176)]),
    'staff-calc': (RM + '12_admin-salary-calculator.png', RM_COMMON + [(312, 228, 500, 260)]),
    'staff-alert': (RM + '13_admin-staff-notify-setting.png', RM_COMMON + [(1072, 144, 1256, 176), (300, 342, 444, 390), (710, 342, 806, 368), (1062, 342, 1204, 368), (326, 579, 506, 613), (827, 579, 1001, 616)]),
    # Quản lý tuyển dụng
    'recruit-dashboard': (TL + '02-dashboard-tongquan.png', TL_COMMON + [(1212, 10, 1436, 66), (344, 104, 492, 126)]),
    'recruit-cv': (TL + '05-danhsach-cv.png', TL_COMMON + [(892, 10, 1116, 66), (456, 446, 512, 720), (690, 446, 794, 720), (956, 446, 1078, 720)]),
    'recruit-jd': (TL + '20-danhsach-jd.png', TL_COMMON + [(892, 10, 1116, 66), (446, 400, 502, 720), (896, 400, 1004, 720)]),
    'recruit-process': (TL + '16-tientrinh-mocphongvan-offer.png', TL_COMMON + [(892, 10, 1116, 66)]),
    'recruit-matching': (TL + '14-matching-diemtong-nhandinh.png', TL_COMMON + [(892, 10, 1116, 66), (782, 322, 1072, 347)]),
    # Quản lý khách hàng: chưa có ảnh; khi có, điền vùng che (danh sách rỗng = không xuất)
    'crm-list': (LD + 'list.png', []),
    'crm-kanban': (LD + 'kanban.png', []),
    'crm-calendar': (LD + 'calendar.png', []),
    'crm-report': (LD + 'report.png', []),
}

# Nền trang: (id section, ảnh đã che, tâm cắt theo tỉ lệ ngang 0..1)
BACKS = [('sw-top', 'recruit-dashboard', 0.62), ('sw-remote', 'staff-calendar', 0.55), ('sw-talent', 'recruit-matching', 0.6), ('sw-leads', 'crm-list', 0.6)]
# Chưa có ảnh app quản lý khách hàng: nền #sw-leads tạm lấy ảnh nền công việc Sales có sẵn (lật ngang + nén lại, chỉ đổi
# định dạng, không sinh ảnh mới). Có ảnh ld-list thì BACKS ở trên tự thay.
LEADS_FALLBACK = os.path.join(PG, 'sales-kpi.webp')


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
    for name, (src, boxes) in SHOTS.items():
        if not boxes:
            print('SKIP', name, '(chưa có vùng che)'.encode('ascii', 'replace').decode())
            continue
        if not os.path.exists(src):
            missing.append(src)
            continue
        img = redact(Image.open(src), boxes)
        if img.width > 1280:
            img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
        img.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        print('shot', name, img.size)
    for sid, name, cx in BACKS:
        f = os.path.join(OUT, name + '.webp')
        if not os.path.exists(f):
            missing.append(f)
            if sid == 'sw-leads' and os.path.exists(LEADS_FALLBACK):
                img = Image.open(LEADS_FALLBACK).convert('RGB').transpose(Image.FLIP_LEFT_RIGHT).resize((800, 1200), Image.LANCZOS)
                img.save(os.path.join(PG, sid + '.webp'), 'WEBP', quality=70, method=6)
                print('back', sid, '(fallback sales-kpi)')
            continue
        img = Image.open(f).convert('RGB')
        w = round(img.height * 2 / 3)
        x = min(max(0, round(img.width * cx - w / 2)), img.width - w)
        img = img.crop((x, 0, x + w, img.height)).resize((800, 1200), Image.LANCZOS)
        img.save(os.path.join(PG, sid + '.webp'), 'WEBP', quality=72, method=6)
        print('back', sid, os.path.getsize(os.path.join(PG, sid + '.webp')) // 1024, 'KB')
    for m in missing:
        print('MISSING', m, file=sys.stderr)


if __name__ == '__main__':
    main()
