# portfolio

Portfolio (JP / EN / VI): Thai Tran Hoang Nha | B2B Sales, IT Communication, HR & Training

Nội dung theo CV mới `Rirekisho_ThaiTranHoangNha.pdf` (履歴書兼職務経歴書, 2026), mở từ link "Mở CV (PDF)" ở sidebar.

https://hoangnhajp.github.io/portfolio/

Kiểm tra: `node tests/check-cv-rirekisho.mjs`, `node tests/check-no-cv-section.mjs`, `node tests/check-sales-trip-photos.mjs`, `node tests/check-candidate-voice.mjs` (giọng ứng viên), `node tests/check-no-avatar.mjs` (không còn ảnh chân dung), `node tests/check-ja-natural-style.mjs` (văn phong JA kiểu trang công ty / tin tức Nhật), `node tests/check-copy-natural-all.mjs` (JA/EN/VI toàn site không văn dịch), `node tests/check-copy-final-pass.mjs` (soát câu chữ cuối JA/EN/VI), `node tests/browser-cv.mjs` (cần Chrome), `node tests/browser-layout-polish.mjs` (cần Chrome: thẻ kỹ năng thẳng hàng, không ngắt 「ベトナム語」, tiêu đề lớn không mồ côi chữ cuối, đầu tab không lặp tên), `node tests/check-motion-film.mjs` (phim workflow 4.8s ở đầu tab Team / AI: 4 bước + kết quả, chỉ transform/opacity, nút dừng, reduced-motion), `node tests/browser-motion-film.mjs` (cần Chrome: điểm chạy khớp tâm từng bước, 1 phụ đề mỗi lúc, không tràn, tự dừng khi ra khỏi màn hình)., `node tests/check-visual-redesign.mjs` (icon + 14 hình minh hoạ vẽ lại theo phong cách kính mờ 3D cam-xanh: icon `assets/icons/ic-*.webp` nền trong suốt trong sprite, hình `assets/skills` là bản mới).

Cảnh minh hoạ động cho từng section (phong cách video GPRFLEXEYE: thẻ trắng viền cam-xanh, icon 3D `assets/gx/*.webp`, pop / vẽ nét / đếm số / lật thẻ): 20 cảnh `<figure class="gx">` sinh bằng `node tools/gx/build.mjs` (sửa dữ liệu cảnh trong file này rồi chạy lại, không nhân đôi). Kiểm tra: `node tests/check-gx-scenes.mjs`, `node tests/browser-gx-scenes.mjs` (cần Chrome, khoảng 3 phút: vào cảnh khi cuộn tới, không tràn / đè nhãn, đúng ngôn ngữ, dừng khi ra khỏi màn hình, reduced-motion tĩnh, ẩn khi in).
