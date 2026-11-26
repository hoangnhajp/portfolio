// Phim 8 bước "kinh doanh IT outsourcing, offshore" của JILNESTA (#sales-jil-flow). Cùng khuôn với tools/film/films.mjs
// (render bằng figure() của tools/film/step-film.mjs) nhưng để file riêng: tools/jil/build.mjs chèn phim này.
// Cảnh salaryman 400x400 nền trong suốt: assets/sales/jil/ (cùng nhân vật với #sales-cycle).
const L = (ja, en, vi) => ({ ja, en, vi });
const D = 'assets/sales/jil/';

export const JIL_FILM = {
  key: 'jil', kick: 'OFFSHORE SALES', slot: 3, runner: 'assets/sales/cycle/man-consult.webp',
  title: L('ITオフショア営業の8つの段階', 'IT offshore sales in eight steps', '8 bước kinh doanh IT outsourcing, offshore'),
  steps: [
    { img: D + 'jil1-prepare.webp',
      t: L('営業資料の準備', 'Prepare sales materials', 'Chuẩn bị tài liệu bán hàng'),
      d: L('ITアウトソーシング、オフショアの営業に使う資料、ファイル、情報をそろえる', 'Build the documents, files and information for IT outsourcing and offshore sales', 'Tạo lập tài liệu, file, thông tin chuẩn bị cho kinh doanh IT outsourcing, offshore'),
      fx: [['Pop', 'jd-document', 12, 22, 28, 0], ['Glow', 'lightbulb', 88, 18, 26, .3], ['Tick', 'checklist', 88, 80, 24, .9]] },
    { img: D + 'jil2-call.webp',
      t: L('電話、メールで提案', 'Call and email', 'Gọi điện, email tư vấn'),
      d: L('電話とメールで、ソフトウェアや開発チームの需要を聞く', 'Telesales calls and emails to ask about software and dev team needs', 'Telesales, email tư vấn, hỏi nhu cầu phần mềm và đội lập trình viên'),
      fx: [['Ring', 'ring', 12, 30, 30, 0], ['Ring', 'ring', 12, 30, 30, .7], ['Fly', 'envelope', 88, 74, 26, .2], ['Bubble', 'chat-bubbles', 88, 18, 26, .5]] },
    { img: D + 'jil3-meet.webp',
      t: L('訪問と聞き取り', 'Meet the client', 'Hẹn gặp khách hàng'),
      d: L('アポイントを取って訪問し、ソフトウェア化したい業務や課題を聞く', 'Book a visit and hear which work the client wants turned into software', 'Hẹn lịch gặp khách, hỏi những vấn đề cần phần mềm hóa hoặc cần đội dev'),
      fx: [['Drop', 'calendar', 10, 20, 26, 0], ['Wobble', 'magnifier', 90, 80, 26, .4], ['Shake', 'handshake', 10, 80, 26, .9]] },
    { img: D + 'jil4-spec.webp',
      t: L('要件を仕様書に', 'Write the spec', 'Viết đặc tả'),
      d: L('業務を分析し、顧客の要望を技術仕様書にまとめる', 'Analyse the business and turn client requests into a technical spec', 'Phân tích nghiệp vụ, biến yêu cầu khách hàng thành tài liệu đặc tả kỹ thuật'),
      fx: [['Slide', 'jd-document', 10, 22, 28, 0], ['Spin', 'workflow-gears', 90, 20, 26, 0], ['Pop', 'puzzle-fit', 90, 80, 26, .8]] },
    { img: D + 'jil5-devteam.webp',
      t: L('開発チームに伝達', 'Brief the dev team', 'Giao đội dev'),
      d: L('仕様を開発チームに伝え、必要に応じてチームを採用、編成する', 'Hand the spec to the dev team, recruiting and building the team as needed', 'Truyền đạt cho đội dev xây dựng tính năng, tuyển dụng team dev khi cần'),
      fx: [['Pop', 'team-group', 88, 16, 28, 0], ['Drop', 'cv-resume', 10, 80, 26, .4], ['Glow', 'building-blocks', 90, 82, 26, .8]] },
    { img: D + 'jil6-customize.webp',
      t: L('顧客に合わせて調整', 'Customize with the client', 'Tùy chỉnh theo khách'),
      d: L('顧客と連絡を取り合い、製品を修正、カスタマイズする', 'Keep in touch with the client to revise and customize the product', 'Trao đổi với khách hàng để chỉnh sửa và customize sản phẩm'),
      fx: [['Bubble', 'chat-bubbles', 10, 20, 28, 0], ['Spin', 'workflow-gears', 90, 18, 24, 0], ['Tick', 'shield-check', 90, 82, 26, .9]] },
    { img: D + 'jil7-handover.webp',
      t: L('納品と検収', 'Handover and acceptance', 'Bàn giao, nghiệm thu'),
      d: L('製品を納品し、顧客の検収を受ける', 'Deliver the product and get client acceptance', 'Bàn giao sản phẩm và nghiệm thu cùng khách hàng'),
      fx: [['Burst', 'ring', 88, 18, 32, .2], ['Badge', 'shield-check', 88, 18, 26, 0], ['Tick', 'checklist', 10, 80, 24, .7]] },
    { img: D + 'jil8-invoice.webp',
      t: L('請求と入金管理', 'Invoice and collect', 'Hóa đơn, công nợ'),
      d: L('請求書を発行し、入金と売掛金を管理する', 'Issue invoices, then track payments and receivables', 'Xuất hóa đơn, thanh toán và quản lý công nợ'),
      fx: [['Pop', 'report-chart', 10, 22, 28, 0], ['Drop', 'calendar', 90, 20, 24, .4], ['Glow', 'milestone-report', 90, 82, 26, .9]] },
  ],
};
