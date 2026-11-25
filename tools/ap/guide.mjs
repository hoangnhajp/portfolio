// Bộ slide "Hướng dẫn chức năng" của tab Andpad Info, đặt ngay sau #ap-vn:
// #ap-guide = luồng một công trình 5 bước và sản phẩm dùng ở từng bước;
// #ap-guide-site / #ap-guide-docs / #ap-guide-money = mỗi sản phẩm một thẻ: ảnh chính thức (assets/ap/<key>.webp, đã có),
// công dụng, 3 chức năng chính (tên chức năng giữ tiếng Nhật như trang sản phẩm), lợi ích, người dùng.
// Nội dung đối chiếu từng trang andpad.jp/products/<key> ngày 25/11/2026; số liệu "Case" là số trong bài case khách hàng
// đăng trên chính trang sản phẩm đó (tên công ty giữ tiếng Nhật). App Market không có trong bộ này: trang chỉ chạy bằng JS,
// không đọc được mô tả chức năng để đối chiếu.
// Module tách riêng để build.mjs chỉ cần 1 import + 1 dòng gọi.
import { SHOTS } from './shots.mjs';

const T = (ja, en, vi) => ({ ja, en, vi });
const SIZE = Object.fromEntries(SHOTS.map(([k, ja, en, vi, w, h]) => [k, { ja, en, vi, w, h }]));
const LBL = { use: T('用途', 'Use', 'Dùng để'), gain: T('効果', 'Result', 'Hiệu quả'), who: T('利用者', 'Users', 'Ai dùng') };
const F = (ja, o) => [ja, o];

// [key, công dụng, [3 chức năng], lợi ích, người dùng]
const SITE = [
  ['construction_management',
    T('案件ごとに工程、写真、図面、報告をクラウドで共有します。', 'Keeps schedules, photos, drawings and reports for each project in the cloud.', 'Gom tiến độ, ảnh, bản vẽ, báo cáo của từng công trình lên đám mây.'),
    [F('工程表', T('変更すると担当者に自動で通知', 'Changes notify the people assigned', 'Đổi lịch là người phụ trách nhận thông báo')),
      F('写真', T('スマホで撮影して写真台帳に', 'Shoot on a phone, build the photo ledger', 'Chụp bằng điện thoại, ra sổ ảnh')),
      F('多言語対応', T('英語、ベトナム語など6言語に翻訳', 'Translates into six languages, incl. English and Vietnamese', 'Dịch sang 6 ngôn ngữ, có tiếng Anh, tiếng Việt'))],
    T('事例：松田組は写真整理の時間が半減', 'Case 松田組: photo-sorting time cut in half', 'Case 松田組: thời gian sắp xếp ảnh giảm một nửa'),
    T('営業、現場監督、職人', 'Sales, site supervisors, crews', 'Sales, giám sát, thợ')],
  ['chat',
    T('社内外の関係者が案件ごとに話せるチャット。「言った言わない」を防ぎます。', 'Project chat for in-house and outside members, so no instruction gets lost.', 'Chat theo công trình cho cả người trong và ngoài công ty, tránh cảnh "đã dặn mà không nhận".'),
    [F('案件チャット', T('案件ごとにルームを自動で作成', 'A room is created for each project', 'Tự tạo phòng chat cho mỗi công trình')),
      F('お知らせ、確認', T('相手を指定してOK確認、既読も分かる', 'Tag people, get an OK, see who has read it', 'Gửi cho đúng người, nhận xác nhận OK, thấy ai đã đọc')),
      F('報告連動', T('日報や完了報告がチャットに届く', 'Daily and completion reports post to the chat', 'Báo cáo ngày, báo cáo hoàn thành tự vào chat'))],
    T('事例：しばた工芸は現場への移動が月20時間減、残業は約15％減', 'Case しばた工芸: 20 hours less site travel a month, about 15% less overtime', 'Case しばた工芸: bớt 20 giờ đi lại mỗi tháng, giờ làm thêm giảm khoảng 15%'),
    T('営業、監督、職人、協力会社', 'Sales, supervisors, crews, subcontractors', 'Sales, giám sát, thợ, thầu phụ')],
  ['drawings',
    T('最新の図面を一か所にまとめ、指示と写真を図面の上で管理します。', 'The latest drawings in one place, with instructions and photos on the drawing itself.', 'Luôn có bản vẽ mới nhất ở một chỗ, ghi chỉ thị và gắn ảnh ngay trên bản vẽ.'),
    [F('ペン、スタンプ', T('書き込みと7種類のスタンプ', 'Pen markup and seven stamp types', 'Vẽ ghi chú và 7 loại dấu')),
      F('ピン', T('写真とつなぎ、撮った場所が一目で分かる', 'Pins link photos, so shot spots are clear', 'Ghim gắn ảnh, nhìn là biết chỗ nào đã chụp')),
      F('仕上検査', T('検査結果を最短1タップで入力', 'Enter finish-inspection results in as little as one tap', 'Nhập kết quả kiểm tra hoàn thiện chỉ từ 1 chạm'))],
    T('事例：白石建設は検査後のダメ帳作成の時間を80％削減', 'Case 白石建設: punch-list writing after inspection cut by 80%', 'Case 白石建設: giảm 80% thời gian lập danh sách lỗi sau kiểm tra'),
    T('現場、協力会社、検査担当', 'Site staff, subcontractors, inspectors', 'Người ở công trường, thầu phụ, người kiểm tra')],
  ['blackboard',
    T('電子黒板で工事写真を撮り、写真台帳まで作ります。改ざん検知つきです。', 'Shoot site photos with a digital signboard, right through to the photo ledger, with tamper detection.', 'Chụp ảnh thi công kèm bảng đen điện tử tới khi ra sổ ảnh, có phát hiện chỉnh sửa ảnh.'),
    [F('黒板一括作成', T('CSVで数千種類の黒板を一度に作成', 'Thousands of boards at once from a CSV file', 'Tạo hàng nghìn bảng một lần từ file CSV')),
      F('オフラインモード', T('電波のない現場でも撮影できる', 'Shoot even where there is no signal', 'Chụp được cả nơi không có sóng')),
      F('写真台帳作成', T('黒板ごとに自動で整理、ワンクリックで台帳', 'Auto-sorted by board, one-click ledger', 'Ảnh tự xếp theo bảng, 1 cú bấm ra sổ ảnh'))],
    T('事例：三浦組は作業時間が半減', 'Case 三浦組: work time cut in half', 'Case 三浦組: thời gian làm việc giảm một nửa'),
    T('現場の担当、写真台帳を作る事務', 'Site staff, office staff who build the ledger', 'Người ở công trường, văn phòng làm sổ ảnh')],
  ['inspection',
    T('紙を使わずに検査し、結果をすぐ共有して漏れを防ぎます。', 'Paperless inspections; results are shared at once so nothing is missed.', 'Kiểm tra không giấy, chia sẻ kết quả ngay, không sót hạng mục.'),
    [F('検査報告書', T('テンプレートに写真とコメント', 'Report templates with photos and comments', 'Mẫu biên bản có ảnh, nhận xét')),
      F('是正指摘管理', T('担当者に是正を依頼し、承認まで追う', 'Send fixes to the assignee and track them to approval', 'Giao việc sửa lỗi cho người phụ trách, theo dõi tới lúc được duyệt')),
      F('出力', T('ワンクリックでPDFにして施主へ', 'One-click PDF for the client', '1 cú bấm ra PDF gửi chủ nhà'))],
    T('事例：西鉄建設は移動と残業の時間を約50％削減', 'Case 西鉄建設: travel and overtime cut by about 50%', 'Case 西鉄建設: giảm khoảng 50% thời gian đi lại và làm thêm'),
    T('検査担当、現場監督、職人', 'Inspectors, supervisors, crews', 'Người kiểm tra, giám sát, thợ')],
  ['remote_presence',
    T('現場に行かずに状況を確かめ、離れた場所から指示します。', 'See the site and give instructions without travelling there.', 'Xem hiện trường và chỉ đạo từ xa, không cần tới tận nơi.'),
    [F('カメラ連携', T('Safieなど固定カメラの映像を全員で確認', 'Fixed cameras such as Safie, viewed by everyone', 'Nối camera cố định (như Safie), mọi người cùng xem')),
      F('ビデオ通話', T('スマホ、タブレット、PCでポインター付き', 'Video calls on phone, tablet or PC, with a pointer', 'Gọi video trên điện thoại, máy tính bảng, PC, có con trỏ chỉ')),
      F('360度画像', T('図面の上に置いて現場を確認', '360° photos placed on the drawing', 'Ảnh 360 độ đặt trên bản vẽ để xem hiện trường'))],
    T('移動の工数が減り、監督1人がより多くの現場を担当できる', 'Less travel, so each supervisor can cover more sites', 'Bớt công đi lại, mỗi giám sát quản lý được nhiều công trình hơn'),
    T('現場監督、職人、施主', 'Site supervisors, crews, owners', 'Giám sát, thợ, chủ nhà')],
];
const DOCS = [
  ['safety_management',
    T('安全指示、KY活動、入退場をスマホで管理します。', 'Safety instructions, hazard-prediction (KY) talks and site entry, all on a phone.', 'Quản lý chỉ thị an toàn, họp KY (dự đoán nguy hiểm) và ra vào công trường bằng điện thoại.'),
    [F('作業安全指示の作成', T('協力会社ごとに作り、作業員の確認も記録', 'Made per subcontractor, with each worker\'s sign-off', 'Tạo theo từng thầu phụ, ghi nhận từng công nhân đã xác nhận')),
      F('入退場、出面の集計', T('入退場の記録から出面を自動で集計', 'Entry records roll up into attendance', 'Dữ liệu ra vào tự cộng thành bảng công')),
      F('CCUS連携', T('入退場の履歴を就業履歴として送る', 'Sends entry history to CCUS as work history', 'Gửi lịch sử ra vào sang CCUS làm hồ sơ công việc'))],
    T('KYシートの回収、整理、保管がなくなり、出面がリアルタイムで分かる', 'No more collecting and filing KY sheets; attendance in real time', 'Bỏ việc thu, xếp, lưu phiếu KY; biết số công theo thời gian thực'),
    T('元請、協力会社（2次以降も）', 'Prime contractors, subcontractors (all tiers)', 'Tổng thầu, thầu phụ (cả các cấp dưới)')],
  ['3d_scan',
    T('iPhone ProやiPad Proで現場を3Dで記録し、共有します。', 'Record the site in 3D with an iPhone Pro or iPad Pro and share it.', 'Quét hiện trường thành 3D bằng iPhone Pro hoặc iPad Pro rồi chia sẻ.'),
    [F('3Dスキャン', T('LiDARで撮るだけ、モデリングは不要', 'LiDAR scan, no modelling skills needed', 'Quét LiDAR, không cần biết dựng mô hình')),
      F('寸法計測', T('3Dデータから寸法を測る（誤差は数％）', 'Measure from the 3D data (error of a few %)', 'Đo kích thước trên dữ liệu 3D (sai số vài %)')),
      F('3D上でメモ', T('コメントのピンを置いてクラウドで共有', 'Pin comments in 3D and share in the cloud', 'Ghim ghi chú trên 3D, chia sẻ qua đám mây'))],
    T('測り忘れを補い、現地調査の整理が短くなる', 'Covers forgotten measurements and shortens survey clean-up', 'Bù chỗ quên đo, rút ngắn khâu xử lý số liệu khảo sát'),
    T('誰でも撮影できる（調査、埋設部の記録）', 'Anyone can scan (surveys, records of buried work)', 'Ai cũng quét được (khảo sát, ghi lại phần sẽ bị lấp)')],
  ['board',
    T('多くの現場の予定と職人の手配をカレンダーで管理します。', 'A calendar for scheduling crews across many sites.', 'Lịch phân công thợ cho nhiều công trình cùng lúc.'),
    [F('予定一覧', T('PC、アプリ、タブレットで同じ予定', 'The same calendar on PC, app and tablet', 'Cùng một lịch trên PC, app, máy tính bảng')),
      F('日程変更', T('ドラッグ＆ドロップで変更', 'Drag and drop to reschedule', 'Kéo thả để đổi lịch')),
      F('報告', T('アプリから写真つきの作業報告', 'Photo work reports from the app', 'Báo cáo công việc có ảnh từ app'))],
    T('事例：サンティーは人工調整の電話が約3分の1に減り、粗利率は4％上昇', 'Case サンティー: crew-scheduling calls down to about a third, gross margin up 4%', 'Case サンティー: điện thoại điều phối thợ còn khoảng 1/3, biên lãi gộp tăng 4%'),
    T('多くの現場を抱える会社', 'Firms with many sites', 'Công ty có nhiều công trình')],
  ['report',
    T('今の紙やExcelの帳票をそのまま電子化し、どの端末でも入力できます。', 'Turns existing paper or Excel forms into digital ones that can be filled in on any device.', 'Số hoá biểu mẫu giấy, Excel đang dùng, điền được trên mọi thiết bị.'),
    [F('テンプレート作成', T('Excelを上げると同じレイアウト。電子印鑑、手書きサイン', 'Upload Excel for the same layout; e-stamps, handwritten signatures', 'Tải Excel lên là có mẫu y hệt; có con dấu điện tử, chữ ký tay')),
      F('レポート作成', T('オフライン入力、同時編集、編集履歴', 'Offline input, co-editing, edit history', 'Nhập offline, nhiều người sửa cùng lúc, có lịch sử sửa')),
      F('レポート出力', T('元の形で出力、項目を横断して抽出', 'Export in the original layout, pull fields across reports', 'Xuất đúng mẫu gốc, trích dữ liệu từ nhiều báo cáo'))],
    T('集計と分析が効率化し、ためたデータをAIで分析できる', 'Faster roll-ups; stored data can be analysed with AI', 'Tổng hợp nhanh hơn, dữ liệu tích lũy phân tích được bằng AI'),
    T('現場で入力する人、集計する管理者', 'People filling in on site, admins who roll up', 'Người nhập ở công trường, quản lý tổng hợp')],
  ['approval',
    T('施工計画書や完了報告書などの提出、承認、閲覧を一か所で行います。', 'Submit, approve and view documents such as work plans and completion reports in one place.', 'Nộp, duyệt và xem hồ sơ (biện pháp thi công, báo cáo hoàn thành...) ở một chỗ.'),
    [F('申請', T('Excel、PDF、写真のファイルから申請', 'Submit from Excel, PDF or photo files', 'Nộp từ file Excel, PDF, ảnh')),
      F('承認一覧確認', T('状況を絞り込み、承認漏れを防ぐ', 'A filterable status list prevents missed approvals', 'Danh sách lọc được, không sót hồ sơ chờ duyệt')),
      F('承認フローテンプレート', T('書類、部署、役割ごとの承認ルート', 'Approval routes by document, department or role', 'Tuyến duyệt theo loại hồ sơ, phòng ban, vai trò'))],
    T('紙の回覧がなくなり、件数が多くても承認漏れがない', 'No paper circulation; nothing missed even at high volume', 'Bỏ chuyền giấy, hồ sơ nhiều vẫn không sót'),
    T('申請者（協力会社も可）、承認者', 'Applicants (subcontractors too), approvers', 'Người nộp (cả thầu phụ), người duyệt')],
  ['electronic_delivery',
    T('電子納品に必要な黒板、写真の整理、データ出力をまとめて行います。', 'Boards, photo sorting and data output needed for electronic delivery, in one tool.', 'Gom việc tạo bảng đen, xếp ảnh, xuất dữ liệu cho nộp hồ sơ điện tử.'),
    [F('電子納品ツリー', T('発注者のルールでフォルダを自動作成', 'Folder tree auto-built to the client\'s rules', 'Tự dựng cây thư mục theo quy định của bên giao thầu')),
      F('写真の振り分け', T('写真の情報から自動でツリーへ', 'Photos sorted into the tree from their data', 'Ảnh tự vào đúng thư mục theo thông tin ảnh')),
      F('データ出力', T('改ざん検知と自動チェックつき', 'Output with tamper detection and an automatic check', 'Xuất dữ liệu kèm phát hiện chỉnh sửa và tự kiểm tra'))],
    T('写真整理の時間が大きく減り、データの不備を防ぐ', 'Much less photo-sorting time, fewer data errors', 'Giảm mạnh thời gian xếp ảnh, tránh thiếu sót dữ liệu'),
    T('電子納品を担当する人', 'Staff who handle e-delivery', 'Người phụ trách nộp hồ sơ điện tử')],
  ['bim',
    T('専用ソフトなしで、ブラウザやスマホでBIMモデルを見られます。', 'View BIM models in a browser or on a phone without dedicated software.', 'Xem mô hình BIM trên trình duyệt, điện thoại, không cần phần mềm riêng.'),
    [F('BIMデータを登録', T('軽くして表示、点群も登録（IFC対応）', 'Models made lighter; point clouds too (IFC supported)', 'Mô hình được làm nhẹ, nạp cả đám mây điểm (hỗ trợ IFC)')),
      F('ビューを共有', T('断面の状態ごとリンクで共有、ペンで書き込み', 'Share a view with its section cut by link, mark it up', 'Chia sẻ góc nhìn kèm mặt cắt bằng link, vẽ ghi chú')),
      F('図面BIM連携', T('図面にない断面をBIMで確認', 'Check sections the drawing does not show', 'Từ bản vẽ mở BIM xem mặt cắt bản vẽ không có'))],
    T('作業指示と施工計画が速く、正確になる', 'Faster, more accurate work instructions and planning', 'Chỉ thị công việc và kế hoạch thi công nhanh, chính xác hơn'),
    T('住宅会社からゼネコンまで', 'From home builders to general contractors', 'Từ công ty nhà ở tới tổng thầu')],
];
const MONEY = [
  ['erp',
    T('顧客、引合、見積、原価、入金を一つにまとめる建設業向けERPです。', 'Construction ERP: customers, deals, estimates, budgets and receipts in one place.', 'ERP cho ngành xây dựng: khách hàng, cơ hội, báo giá, ngân sách, thu tiền ở một chỗ.'),
    [F('ダッシュボード', T('実績だけでなく今月の見込みも', 'Forecasts and this month\'s expected closes, not just results', 'Thấy cả dự báo, doanh số dự kiến tháng này')),
      F('見積作成', T('テンプレートと外部ファイルの取込', 'Templates and file import', 'Mẫu báo giá, nhập file ngoài')),
      F('原価、入金管理', T('発注、請求、入金まで追う', 'Budget through to orders, billing and receipts', 'Theo ngân sách tới đặt hàng, hoá đơn, thu tiền'))],
    T('事例：建築工房小越は利益率が約5％改善', 'Case 建築工房小越: profit margin up about 5%', 'Case 建築工房小越: biên lợi nhuận tăng khoảng 5%'),
    null],
  ['edi',
    T('元請と協力会社の見積、発注、納品、請求をすべてオンラインで行います。', 'Estimates, orders, delivery and billing between prime and subcontractors, all online.', 'Báo giá, đặt hàng, giao nhận, hoá đơn giữa tổng thầu và thầu phụ, làm hết trực tuyến.'),
    [F('カンタン見積、発注', T('テンプレートとExcelの取込', 'Templates and Excel import', 'Mẫu có sẵn, nhập từ Excel')),
      F('状況確認表示', T('見積から請求までの状況が分かる', 'Status from estimate to invoice', 'Thấy trạng thái từ báo giá tới hoá đơn')),
      F('ペーパーレス', T('タイムスタンプと電子署名で建設業法、電子帳簿保存法に対応', 'Timestamps and e-signatures support Japan\'s construction and e-records laws', 'Dấu thời gian, chữ ký điện tử, đáp ứng luật xây dựng và luật lưu sổ sách điện tử của Nhật'))],
    T('事例：北洲は1件あたりの受発注書類が約8割減', 'Case 北洲: order paperwork per job down about 80%', 'Case 北洲: giấy tờ đặt hàng mỗi công trình giảm khoảng 80%'),
    T('元請、協力会社、現場、経理', 'Prime contractors, subcontractors, site, accounting', 'Tổng thầu, thầu phụ, công trường, kế toán')],
  ['billing_management',
    T('協力会社の請求書を集めて案件ごとに振り分け、査定と承認まで行います。', 'Collects subcontractor invoices, sorts them by project, and handles assessment and approval.', 'Thu hoá đơn của thầu phụ, chia theo công trình, thẩm định và duyệt.'),
    [F('請求書の回収、振り分け', T('協力会社がPDFを上げると現場ごとに自動で', 'Subcontractors upload PDFs; sorted by site automatically', 'Thầu phụ tải PDF lên, hệ thống tự chia theo công trình')),
      F('出来高査定', T('査定額と立替経費の相殺を現場でも', 'Assessed amounts and expense offsets, even on site', 'Nhập giá trị nghiệm thu, cấn trừ chi phí ứng trước, làm được tại công trường')),
      F('電子帳簿保存法への対応', T('電子で保存、CSVで会計へ', 'Stored electronically, exported to accounting by CSV', 'Lưu điện tử, xuất CSV sang kế toán'))],
    T('仕分けと郵送の作業がなくなり、紙の保管場所もいらない', 'No sorting or mailing, and no paper storage', 'Bỏ việc phân loại, gửi bưu điện, không cần chỗ lưu giấy'),
    T('協力会社（請求）、元請（査定、承認）', 'Subcontractors (invoicing), prime contractors (assessment, approval)', 'Thầu phụ (gửi hoá đơn), tổng thầu (thẩm định, duyệt)')],
  ['report_cost',
    T('日報をアプリで送り、人工と経費を自動で集計します。', 'Daily reports are sent from the app; labour and expenses are totalled automatically.', 'Gửi báo cáo ngày qua app, công và chi phí tự cộng.'),
    [F('原価日報の送信', T('どこからでも送れ、前日分をコピー', 'Send from anywhere, copy yesterday\'s report', 'Gửi ở đâu cũng được, chép báo cáo hôm trước')),
      F('日報情報の即時集計', T('現場別、作業員別。未提出も分かる', 'By site and by worker; see who has not sent', 'Theo công trình, theo người; biết ai chưa nộp')),
      F('データの取り込み', T('原価管理システムへ一括で', 'Batch import into cost management', 'Nạp một lần vào hệ thống quản lý chi phí'))],
    T('工事中に原価が見え、赤字のリスクを避けられる', 'Costs are visible during the work, so losses can be avoided', 'Thấy chi phí ngay khi đang thi công, tránh lỗ'),
    T('工事会社、日報を出す作業員', 'Contractors, workers who file daily reports', 'Công ty thi công, công nhân gửi báo cáo ngày')],
  ['analytics',
    T('ANDPADのデータを自動で集計し、経営の今をダッシュボードで見せます。', 'Aggregates ANDPAD data into dashboards that show the business right now.', 'Tự tổng hợp dữ liệu ANDPAD thành dashboard tình hình kinh doanh hiện tại.'),
    [F('商談パイプライン', T('引合から契約までの件数', 'Counts from inquiry to contract', 'Số cơ hội từ hỏi giá tới ký hợp đồng')),
      F('反響推移、契約率', T('施策別、店舗別、担当者別に見る', 'By campaign, store and rep', 'Theo chiến dịch, cửa hàng, nhân viên')),
      F('失注推移', T('失注の件数と理由', 'Lost deals and the reasons', 'Số đơn mất và lý do'))],
    T('課題を早く見つけ、どこを改善するかが分かる', 'Spot problems early and see where to improve', 'Phát hiện vấn đề sớm, biết cần cải thiện ở khâu nào'),
    T('経営と営業の管理者', 'Management and sales leads', 'Ban lãnh đạo, quản lý kinh doanh')],
  ['ouchi_note',
    T('契約前から引き渡しまで、施主とのやり取りを一つにまとめます。', 'All talks with the homeowner, from before the contract to handover, in one place.', 'Gom mọi trao đổi với chủ nhà từ trước hợp đồng tới bàn giao.'),
    [F('メッセージ', T('工事ごとに施主と担当者のルーム', 'A room per job with the owner and staff', 'Mỗi công trình một phòng chat với chủ nhà')),
      F('報告、資料共有', T('写真つきの進捗、図面や契約書のフォルダ', 'Photo progress reports; folders for drawings and contracts', 'Báo cáo tiến độ có ảnh; thư mục bản vẽ, hợp đồng')),
      F('資料の施主承認', T('追加見積などを施主が承認', 'The owner approves documents such as extra estimates', 'Chủ nhà duyệt tài liệu như báo giá phát sinh'))],
    T('「言った言わない」を防ぎ、顧客満足と紹介受注につながる', 'Prevents disputes, raises satisfaction and brings referrals', 'Tránh tranh cãi "đã nói hay chưa", tăng hài lòng và đơn giới thiệu'),
    T('工務店の営業、設計、工事、施主', 'Builders\' sales, design and site staff, and owners', 'Sales, thiết kế, thi công của nhà thầu và chủ nhà')],
  ['bm',
    T('工場や店舗の建物と設備の維持管理。事後保全から予防保全へ。', 'Upkeep of buildings and equipment in factories and stores, from reactive to preventive.', 'Bảo trì toà nhà, thiết bị ở nhà máy, cửa hàng; chuyển từ hỏng mới sửa sang bảo trì phòng ngừa.'),
    [F('施設、設備情報のカルテ化', T('図面、仕様、台帳と修繕履歴を一か所に', 'Drawings, specs, registers and repair history in one record', 'Bản vẽ, thông số, sổ thiết bị và lịch sử sửa ở một chỗ')),
      F('写真による不具合報告', T('設備と緊急度をつけて報告', 'Defect reports tied to equipment and urgency', 'Báo lỗi bằng ảnh, gắn thiết bị và mức khẩn')),
      F('点検報告はスマホで完結', T('チェックリストを自動で集計', 'Checklists roll up automatically', 'Danh sách kiểm tra tự tổng hợp'))],
    T('転記がなくなり、修繕と点検の漏れを防ぐ', 'No re-keying; no missed repairs or inspections', 'Bỏ chép tay, không sót việc sửa chữa và kiểm tra'),
    T('点検担当、施設の管理者、協力会社', 'Inspectors, facility managers, subcontractors', 'Người kiểm tra, quản lý cơ sở, thầu phụ')],
  ['api',
    T('自社のシステムとANDPADをつなぎ、二重入力をなくします。', 'Links in-house systems with ANDPAD to remove double entry.', 'Nối hệ thống nội bộ với ANDPAD để bỏ nhập liệu hai lần.'),
    [F('顧客/物件/案件連携', T('自社の引合からANDPADの案件を自動作成', 'ANDPAD projects created from in-house inquiries', 'Tự tạo công trình trên ANDPAD từ dữ liệu khách nội bộ')),
      F('工程、マイルストーン連携', T('双方向で同期', 'Two-way sync', 'Đồng bộ hai chiều')),
      F('受発注連携', T('見積、発注を作り、納品と請求を取り込む', 'Create estimates and orders; import delivery and billing', 'Tạo báo giá, đơn hàng; nhận dữ liệu giao hàng, hoá đơn'))],
    T('入力ミスと作業時間、資料の送り漏れが減る', 'Fewer input errors, less work time, fewer missed documents', 'Giảm lỗi nhập, giờ làm và hồ sơ gửi sót'),
    T('自社システムを持つ会社', 'Companies with their own systems', 'Công ty có hệ thống riêng')],
];

// Luồng 5 bước: [icon, tiêu đề, việc ở bước này, sản phẩm]
const FLOW = [
  ['funnel', T('営業と契約', 'Sales and contract', 'Bán hàng, ký hợp đồng'), T('引合から見積、契約まで。施主との連絡もここから。', 'From inquiry to estimate and contract; owner contact starts here.', 'Từ hỏi giá tới báo giá, ký hợp đồng; bắt đầu trao đổi với chủ nhà.'), ['引合粗利管理', 'Analytics', 'おうちノート']],
  ['calendar', T('着工準備', 'Planning', 'Chuẩn bị khởi công'), T('図面、工程、職人の手配、発注をそろえる。', 'Line up drawings, schedules, crews and orders.', 'Chuẩn bị bản vẽ, lịch, phân công thợ, đặt hàng.'), ['図面', 'BIM', '3Dスキャン', 'ボード', '受発注']],
  ['checklist', T('施工', 'Building', 'Thi công'), T('写真、連絡、安全、日報を現場で記録。', 'Photos, messages, safety and daily reports, recorded on site.', 'Ghi ảnh, trao đổi, an toàn, báo cáo ngày ngay tại công trường.'), ['施工管理', 'チャット', '黒板', '入退場管理', '歩掛管理']],
  ['shield-check', T('検査と書類', 'Inspection and documents', 'Kiểm tra, hồ sơ'), T('検査、是正、承認、納品データ。', 'Inspections, fixes, approvals and delivery data.', 'Kiểm tra, sửa lỗi, phê duyệt, dữ liệu nộp.'), ['検査', '遠隔臨場', 'レポート', '資料承認', '電子納品']],
  ['report-chart', T('請求と引き渡し後', 'Billing and after handover', 'Thanh toán, sau bàn giao'), T('請求の査定、自社システムとの連携、建物の維持管理。', 'Invoice assessment, links to in-house systems, building upkeep.', 'Thẩm định hoá đơn, nối hệ thống nội bộ, bảo trì toà nhà.'), ['請求管理', 'API連携', 'BM']],
];
// Gợi ý bắt đầu: [nội dung, nguồn]
const TIPS = [
  [T('ベトナム語版があるのは施工管理、チャット、図面（2025年6月）。ベトナムの現場はこの3つから始めやすい。', 'Construction Management, Chat and Drawings have a Vietnamese version (June 2025), an easy starting set for sites in Vietnam.', 'Quản lý thi công, Chat, Bản vẽ đã có bản tiếng Việt (6/2025): bộ dễ bắt đầu nhất cho công trường ở Việt Nam.'), ['newsVi']],
  [T('導入は4つのステップで進み、サポート窓口が支援します。', 'Onboarding runs in four steps, backed by a support desk.', 'Triển khai theo 4 bước, có bộ phận hỗ trợ đi cùng.'), ['support']],
];

// Số liệu nổi bật (cùng số với các thẻ ở 3 slide sau): [số, nội dung, sản phẩm có case]
const KPI = [
  [T('80％', '80%', '80%'), T('検査後のダメ帳作成の時間を削減（白石建設）', 'less time writing punch lists after inspection (白石建設)', 'giảm thời gian lập danh sách lỗi sau kiểm tra (白石建設)'), 'drawings'],
  [T('約50％', '~50%', '~50%'), T('移動と残業の時間を削減（西鉄建設）', 'less travel and overtime (西鉄建設)', 'giảm thời gian đi lại và làm thêm (西鉄建設)'), 'inspection'],
  [T('月20時間', '20 h/month', '20 giờ/tháng'), T('現場への移動時間を削減（しばた工芸）', 'less travel to sites (しばた工芸)', 'bớt thời gian đi lại tới công trường (しばた工芸)'), 'chat'],
  [T('約5％', '~5%', '~5%'), T('利益率が改善（建築工房小越）', 'better profit margin (建築工房小越)', 'biên lợi nhuận tăng (建築工房小越)'), 'erp'],
];

export function pageGuide({ L3, head, b, ico }) {
  const subC = b.c('top'); // đánh số theo thứ tự hiện trên trang: câu dẫn trước
  const steps = FLOW.map(([ic, t, d, ps], i) => `    <li class="ap-gf" style="--i:${i}"><span class="ap-gn">${i + 1}</span>${ico(ic, 30)}${L3('h3', t)}${L3('p', d)}<div class="ap-gchips">${ps.map((x) => `<span class="ap-gchip">${x}</span>`).join('')}</div></li>`).join('\n');
  const tips = TIPS.map(([t, r]) => `      <li>${L3('span', b.t(t, ...r))}</li>`).join('\n');
  const kpis = KPI.map(([n, t, k], i) => `    <li style="--i:${i}">${L3('b', n)}${L3('span', b.t(t, `p_${k}`))}</li>`).join('\n');
  const legend = ['use', 'gain', 'who'].map((k) => `<span>${L3('em', LBL[k])}</span>`).join('');
  return `<section class="pg" data-chap="II" id="ap-guide">
${head('GUIDE　<b>HOW ANDPAD WORKS</b>', T('一つの工事を<br /><i>ANDPADで回す。</i>', 'One project,<br /><i>run on ANDPAD.</i>', 'Một công trình<br /><i>chạy trên ANDPAD.</i>'),
    'Sales ／ Planning ／ Building ／ Inspection ／ Billing',
    T('営業から引き渡し後まで、工事の5つの段階で使う製品をまとめた。次の3枚で、製品ごとの用途、主な機能、効果を説明する。',
      'Which product helps at each of the five stages of a project, from sales to after handover. The next three slides explain what each one does, its main functions and what it saves.',
      'Sản phẩm nào dùng ở bước nào trong 5 bước của một công trình, từ bán hàng tới sau bàn giao. Ba slide tiếp theo giải thích từng sản phẩm dùng để làm gì, chức năng chính và hữu ích ra sao.'), subC)}
  <ol class="ap-gfl rv" style="--d:180ms">
${steps}
  </ol>
  <div class="ap-gtips rv" style="--d:220ms">
    <div class="card ap-gtip">
      <span class="lbl">START</span>
      <ul>
${tips}
      </ul>
    </div>
    <div class="card ap-gtip ap-gleg">
      <span class="lbl">HOW TO READ</span>
      ${L3('p', T('次の3枚のカードは、どれも同じ順で読めます。', 'Every card on the next three slides reads in the same order.', 'Mỗi thẻ ở ba slide sau đọc theo cùng một thứ tự.'))}
      <div class="ap-glegs">${legend}<span><b lang="ja">機能</b>${L3('em', T('主な機能', 'Main functions', 'Chức năng chính'))}</span></div>
      ${L3('p', T('「事例」の数字は、各製品ページに載っている導入企業の事例です。', 'Figures marked "Case" come from customer stories on each product page.', 'Số liệu ghi "Case" lấy từ bài case khách hàng đăng trên trang của từng sản phẩm.'), ' class="ap-gnote"')}
    </div>
  </div>
  <div class="card ap-gkpi rv" style="--d:240ms">
    <span class="lbl">RESULTS ／ CUSTOMER CASES</span>
    <ul>
${kpis}
    </ul>
  </div>
${b.list()}
</section>`;
}

function cards(list, L3, b, start) {
  return list.map(([k, use, fns, gain, who], i) => {
    const s = SIZE[k];
    const r = `p_${k}`;
    const lab = (key, o) => ({ ja: `<em>${LBL[key].ja}</em>${o.ja}`, en: `<em>${LBL[key].en}</em>${o.en}`, vi: `<em>${LBL[key].vi}</em>${o.vi}` });
    return `    <article class="ap-gc" data-k="${k}" style="--i:${start + i}">
      <img src="assets/ap/${k}.webp" alt="ANDPAD ${s.ja}（${s.en}）" width="${s.w}" height="${s.h}" loading="lazy" decoding="async">
      <div class="ap-gb">
        <h3><b>ANDPAD ${s.ja}</b>${L3('i', T(s.en, s.en, s.vi))}</h3>
        ${L3('p', lab('use', b.t(use, r)), ' class="ap-guse"')}
        <ul class="ap-gfns">
${fns.map(([ja, o]) => `          <li class="ap-gfn"><b lang="ja">${ja}</b>${L3('span', o)}</li>`).join('\n')}
        </ul>
        ${L3('p', lab('gain', b.t(gain, r)), ' class="ap-ggain"')}
        ${who ? L3('p', lab('who', who), ' class="ap-gwho"') : ''}
      </div>
    </article>`;
  }).join('\n');
}

const PAGES = [
  ['ap-guide-site', SITE, 'GUIDE 1　<b>SITE</b>', T('現場の仕事を<br /><i>スマホ一つで。</i>', 'Site work<br /><i>from one phone.</i>', 'Việc ở công trường<br /><i>gói trong điện thoại.</i>'),
    'Construction Management ／ Chat ／ Drawings ／ Blackboard ／ Inspection ／ Remote',
    T('写真、連絡、図面、検査を現場で記録し、事務所や協力会社とすぐに共有する。', 'Photos, messages, drawings and inspections are recorded on site and shared at once with the office and subcontractors.', 'Ảnh, trao đổi, bản vẽ, kiểm tra được ghi ngay tại công trường và chia sẻ tức thì với văn phòng, thầu phụ.')],
  ['ap-guide-docs', DOCS, 'GUIDE 2　<b>PLANNING ／ DOCUMENTS</b>', T('段取りと書類を<br /><i>紙なしで。</i>', 'Planning and paperwork,<br /><i>without paper.</i>', 'Kế hoạch và hồ sơ<br /><i>không cần giấy.</i>'),
    'Site Entry ／ 3D Scan ／ Board ／ Report ／ Approval ／ e-Delivery ／ BIM',
    T('安全の記録、予定、帳票、承認、納品データをクラウドで作り、回し、残す。', 'Safety records, schedules, forms, approvals and delivery data are made, routed and kept in the cloud.', 'Hồ sơ an toàn, lịch, biểu mẫu, phê duyệt và dữ liệu nộp được tạo, chuyển và lưu trên đám mây.')],
  ['ap-guide-money', MONEY, 'GUIDE 3　<b>MONEY ／ OWNERS ／ CONNECT</b>', T('お金、施主、経営を<br /><i>同じデータで。</i>', 'Money, owners and management,<br /><i>on the same data.</i>', 'Tiền, chủ nhà và quản trị<br /><i>trên cùng một dữ liệu.</i>'),
    'Gross Profit ／ Ordering ／ Billing ／ Labour ／ Analytics ／ Ouchi Note ／ BM ／ API',
    T('見積から入金、施主とのやり取り、建物の維持管理まで、同じ案件のデータでつながる。', 'From estimates to receipts, homeowner talks and building upkeep, everything links through the same project data.', 'Từ báo giá tới thu tiền, trao đổi với chủ nhà và bảo trì toà nhà, mọi thứ nối với nhau qua cùng dữ liệu công trình.')],
];

// bk = hàm tạo bộ trích dẫn theo trang (build.mjs); mỗi slide có mục nguồn riêng
export function pagesGuideCards({ L3, head, bk }) {
  let n = 0;
  return PAGES.map(([id, list, eb, h2, en, sub]) => {
    const b = bk(id);
    const subC = b.c('top');
    const html = `<section class="pg" data-chap="II" id="${id}">
${head(eb, h2, en, sub, subC)}
  <div class="ap-gcs rv" style="--d:180ms">
${cards(list, L3, b, n)}
  </div>
${b.list()}
</section>`;
    n += list.length;
    return html;
  }).join('\n');
}
