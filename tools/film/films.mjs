// Dữ liệu các phim "từng bước" (bộ sinh: tools/film/step-film.mjs). Mỗi phim:
//   key      : hậu tố class (.sf--<key>) và dấu <!-- sfilm:<key>:start/end -->
//   section  : id section chứa phim; before: chuỗi mốc trong section, phim chèn trước dòng chứa mốc (chỉ dùng lần đầu)
//   kick / title : kicker EN chữ hoa + tiêu đề 3 ngôn ngữ ở đầu phim
//   slot     : số giây mỗi bước (chu kỳ = số bước x slot)
//   runner   : ảnh tròn nhỏ chạy trên thanh bước
//   steps    : { img: cảnh 400x400 nền trong suốt, t: tên bước, d: 1 câu mô tả, fx: đạo cụ [hiệu ứng, icon, x%, y%, px, trễ s] }
// Hiệu ứng đạo cụ: Blink Speed Hand Pop Ring Bubble Fly Drop Tick Spin Glow Slide Shake Nudge Fade Wobble Burst Badge.
const L = (ja, en, vi) => ({ ja, en, vi });

export const FILMS = [
  {
    key: 'pr', section: 'sales-pr', before: '<div class="meta',
    kick: 'PRESENTATIONS', slot: 3, runner: 'assets/sales/cycle/man-consult.webp',
    title: L('英語での発表と各国との交流', 'Presenting in English and meeting colleagues abroad', 'Thuyết trình tiếng Anh và giao lưu các nước'),
    steps: [
      { img: 'assets/sales/pr/pr1-prepare.webp',
        t: L('英語の資料を準備', 'Prepare English documents', 'Chuẩn bị hồ sơ tài liệu tiếng Anh'),
        d: L('ベトナムでの代表的な納入事例を英語の資料とスライドにまとめる', 'Put key MAYEKAWA projects in Vietnam into English documents and slides', 'Soạn hồ sơ, slide tiếng Anh về các dự án tiêu biểu tại Việt Nam'),
        fx: [['Pop', 'report-chart', 88, 60, 30, 0], ['Glow', 'lightbulb', 12, 20, 26, .3], ['Tick', 'checklist', 12, 78, 24, .9]] },
      { img: 'assets/sales/pr/pr-data.webp',
        t: L('技術チームとデータ収集', 'Gather data with engineers', 'Thu thập dữ liệu cùng đội kỹ thuật'),
        d: L('技術チームと現場を回り、設備と案件の情報を把握する', 'Go on site with the technical team to collect equipment and project data', 'Cùng đội kỹ thuật xuống hiện trường thu thập dữ liệu, nắm thông tin thiết bị và dự án'),
        fx: [['Tick', 'survey-clipboard', 10, 22, 26, 0], ['Pop', 'report-chart', 90, 20, 28, .4], ['Wobble', 'magnifier', 90, 82, 26, .8]] },
      { img: 'assets/sales/pr/pr2-present.webp',
        t: L('ASEAN各国の代表に英語で発表', 'Present in English to ASEAN branches', 'Thuyết trình tiếng Anh trước ASEAN'),
        d: L('タイのMAYEKAWA ASEAN社員総会で、各国拠点の代表にベトナム市場を英語で発表', 'Present the Vietnam market in English to branch representatives at the MAYEKAWA ASEAN assembly in Thailand', 'Tại Hội nghị ASEAN của MAYEKAWA ở Thái Lan, thuyết trình tiếng Anh về thị trường Việt Nam cho đại diện chi nhánh các nước'),
        fx: [['Ring', 'ring', 88, 16, 30, 0], ['Ring', 'ring', 88, 16, 30, .7], ['Bubble', 'chat-bubbles', 10, 34, 28, .2], ['Pop', 'team-group', 88, 84, 28, .9]] },
      { img: 'assets/sales/pr/pr4-expo.webp',
        t: L('展示会の視察', 'Visit trade shows', 'Tham quan triển lãm'),
        d: L('バンコクの展示会「PROPAK ASIA」、「VIV ASIA」で新しい機械と動向を見る', 'See new machines and trends at PROPAK ASIA and VIV ASIA in Bangkok', 'Xem máy móc và xu hướng mới tại PROPAK ASIA, VIV ASIA ở Bangkok'),
        fx: [['Blink', 'ring', 90, 14, 40, 0], ['Wobble', 'magnifier', 90, 14, 28, 0], ['Drop', 'calendar', 90, 52, 26, .3], ['Tick', 'checklist', 88, 86, 24, 1]] },
      { img: 'assets/sales/pr/pr5-visit.webp',
        t: L('MYCOM KOREAを訪問', 'Visit MYCOM KOREA', 'Thăm MYCOM KOREA'),
        d: L('韓国のグループ拠点を訪ね、現地の同僚と交流', "Visit the group's base in Korea and meet colleagues there", 'Thăm chi nhánh tập đoàn tại Hàn Quốc, giao lưu với đồng nghiệp'),
        fx: [['Drop', 'office-building', 12, 18, 30, 0], ['Nudge', 'briefcase', 8, 58, 24, .2], ['Shake', 'handshake', 88, 84, 28, .8]] },
      { img: 'assets/sales/pr/pr6-client.webp',
        t: L('顧客訪問と倉庫の視察', 'Meet clients on site', 'Gặp khách, khảo sát kho'),
        d: L('ベトナムで顧客と打ち合わせ、ロンアン省の物流倉庫を視察', 'Meet clients in Vietnam and visit a logistics warehouse in Long An', 'Gặp khách hàng tại Việt Nam, khảo sát kho logistics ở Long An'),
        fx: [['Pop', 'assets/sales/map/cold-storage.webp', 12, 18, 28, 0], ['Tick', 'survey-clipboard', 88, 18, 26, .7], ['Burst', 'ring', 88, 84, 32, 1.1], ['Badge', 'shield-check', 88, 84, 26, .9]] },
    ],
  },
];
