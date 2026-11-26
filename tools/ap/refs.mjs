// Task 4n9v: danh mục nguồn tham khảo của tab Andpad Info + bộ đánh số trích dẫn theo trang.
// Mỗi nguồn: [link, tiêu đề nhỏ mô tả nội dung nguồn (JA / EN / VI)]. Đã mở và đối chiếu từng nguồn ngày 25/11/2026.
// Trang dùng: const b = book('ap-top'); ... `${b.c('company')}` sau mỗi thông tin; cuối trang `${b.list()}`.
// Số đánh theo thứ tự xuất hiện lần đầu trên trang; danh sách ở cuối trang chỉ gồm nguồn được trích dẫn.
const T = (ja, en, vi) => ({ ja, en, vi });
const N = (d) => `https://andpad.jp/news/${d}`;
const P = (k) => `https://andpad.jp/products/${k}`;
const VNN = 'https://vietnamnews.vn/media-outreach/';
const PRT = (n) => `https://prtimes.jp/main/html/rd/p/${n}.000018154.html`;

const PROD = {
  construction_management: ['施工管理', 'Construction Management', 'Quản lý thi công'],
  chat: ['チャット', 'Chat', 'Chat'],
  drawings: ['図面', 'Drawings', 'Bản vẽ'],
  blackboard: ['黒板', 'Blackboard', 'Bảng đen điện tử'],
  inspection: ['検査', 'Inspection', 'Kiểm tra'],
  remote_presence: ['遠隔臨場', 'Remote Inspection', 'Nghiệm thu từ xa'],
  safety_management: ['入退場管理', 'Site Entry', 'Quản lý ra vào'],
  '3d_scan': ['3Dスキャン', '3D Scan', 'Quét 3D'],
  board: ['ボード', 'Board', 'Bảng tiến độ'],
  report: ['レポート', 'Report', 'Báo cáo'],
  approval: ['資料承認', 'Document Approval', 'Duyệt hồ sơ'],
  electronic_delivery: ['電子納品', 'e-Delivery', 'Nộp hồ sơ điện tử'],
  bim: ['BIM', 'BIM', 'BIM'],
  erp: ['引合粗利管理', 'Leads and Gross Profit', 'Cơ hội và lãi gộp'],
  edi: ['受発注', 'Ordering', 'Đặt hàng'],
  billing_management: ['請求管理', 'Billing', 'Quản lý hoá đơn'],
  report_cost: ['歩掛管理', 'Labour Productivity', 'Quản lý công'],
  ouchi_note: ['おうちノート', 'Ouchi Note', 'App chủ nhà'],
  analytics: ['Analytics', 'Analytics', 'Analytics'],
  bm: ['BM', 'Building Maintenance', 'Bảo trì toà nhà'],
  api: ['API連携', 'API', 'Kết nối API'],
};

export const REFS = {
  // ---- công ty ----
  company: ['https://andpad.co.jp/company', T('ANDPAD 会社概要（所在地、社員数）', 'ANDPAD company profile (address, headcount)', 'Hồ sơ công ty ANDPAD (địa chỉ, số nhân viên)')],
  mission: ['https://andpad.co.jp/mission/', T('ANDPAD ミッションとバリュー', 'ANDPAD mission and values', 'Sứ mệnh và giá trị của ANDPAD')],
  top: ['https://andpad.jp/', T('ANDPAD 製品サイト（利用社数、ユーザー数、製品一覧）', 'ANDPAD product site (companies, users, product list)', 'Trang ANDPAD (số công ty, người dùng, sản phẩm)')],
  profile: [PRT('000000193'), T('PR TIMES：ナレッジAI公開の発表（会社概要に設立2012年9月）', 'PR TIMES: Knowledge AI release, with company profile (founded Sep 2012)', 'PR TIMES: thông cáo Knowledge AI, kèm hồ sơ công ty (thành lập 9/2012)')],
  arr: ['https://hrmos.co/pages/andpad/jobs/biz0000217', T('ANDPAD 求人票（2025年にARR100億円突破と記載）', 'ANDPAD job post (states ARR passed ¥10 billion in 2025)', 'Tin tuyển dụng ANDPAD (ghi ARR vượt 10 tỷ yên năm 2025)')],
  hot100: ['https://thebridge.jp/2026/04/andpad-stellarc-ai-agent-construction-hot100', T('THE BRIDGE：ANDPADのAI戦略とARRの記事（2026年4月）', 'THE BRIDGE: ANDPAD AI strategy and ARR (Apr 2026)', 'THE BRIDGE: chiến lược AI và ARR của ANDPAD (4/2026)')],
  // ---- Việt Nam ----
  vnCareers: ['https://careers.andpad.vn/jobs', T('ANDPAD Vietnam 採用ページ（開発部門とビジネス部門の求人）', 'ANDPAD Vietnam careers (Development and Business division jobs)', 'Trang tuyển dụng ANDPAD Vietnam (việc khối Phát triển và Kinh doanh)')],
  vnCareersTop: ['https://careers.andpad.vn/', T('ANDPAD Vietnam 採用サイト（ホーチミンの開発チーム）', 'ANDPAD Vietnam careers site (HCMC engineering teams)', 'Trang tuyển dụng ANDPAD Vietnam (đội kỹ sư TP.HCM)')],
  vnHanoiPr: [`${VNN}1778975/hanoi-office-at-andpad-vietnam-relocated.html`, T('Vietnam News：ハノイ事務所の移転（2026年4月、ホーチミン本社の住所も記載）', 'Vietnam News: Hanoi office relocation (Apr 2026, with HCMC head office address)', 'Vietnam News: dời văn phòng Hà Nội (4/2026, kèm địa chỉ trụ sở TP.HCM)')],
  vnViPr: [`${VNN}1720265/andpad-launches-vietnamese-language-support-for-its-cloud-based-construction-project-management-service.html`, T('Vietnam News：ベトナム語版の公開（2025年6月、英語版は2月）', 'Vietnam News: Vietnamese version launched (Jun 2025; English in Feb)', 'Vietnam News: ra mắt bản tiếng Việt (6/2025; bản tiếng Anh 2/2025)')],
  vnPilotPr: [`${VNN}1726656/andpad-completes-the-vietnam-demonstration-project-under-jetro-s-japan-asean-asia-digital-transformation-promotion-program.html`, T('Vietnam News：JETRO事業のベトナム実証の完了（2025年10月）', 'Vietnam News: JETRO Vietnam pilot completed (Oct 2025)', 'Vietnam News: hoàn tất thí điểm JETRO tại Việt Nam (10/2025)')],
  newsVi: [N('20250626'), T('ANDPAD ニュース：ベトナム語版の提供開始（2025年6月26日）', 'ANDPAD news: Vietnamese version released (26 Jun 2025)', 'Tin ANDPAD: phát hành bản tiếng Việt (26/6/2025)')],
  newsEn: [N('20250226'), T('ANDPAD ニュース：英語版アプリ、多言語化の第1弾（2025年2月26日）', 'ANDPAD news: English app, first step of multilingual support (26 Feb 2025)', 'Tin ANDPAD: app tiếng Anh, bước đầu đa ngôn ngữ (26/2/2025)')],
  newsEnWeb: [N('20251014'), T('ANDPAD ニュース：ブラウザ版の英語化とタイムゾーン設定（2025年10月14日）', 'ANDPAD news: English browser version and time zones (14 Oct 2025)', 'Tin ANDPAD: bản web tiếng Anh và múi giờ (14/10/2025)')],
  newsJetro: ['https://andpad.co.jp/news/4260/', T('ANDPAD ニュース：JETRO「日ASEANにおけるアジアDX促進事業」に採択（2023年12月）', 'ANDPAD news: selected for JETRO Japan-ASEAN Asia DX programme (Dec 2023)', 'Tin ANDPAD: được chọn vào chương trình DX Nhật Bản và ASEAN của JETRO (12/2023)')],
  newsPilot: [N('20251006'), T('ANDPAD ニュース：ベトナム実証の完了と結果（2025年10月6日）', 'ANDPAD news: Vietnam pilot completed, results (6 Oct 2025)', 'Tin ANDPAD: hoàn tất thí điểm tại Việt Nam và kết quả (6/10/2025)')],
  newsHanoi: [N('20260408'), T('ANDPAD ニュース：ハノイ事務所の移転と拡大（2026年4月8日）', 'ANDPAD news: Hanoi office moved and expanded (8 Apr 2026)', 'Tin ANDPAD: dời và mở rộng văn phòng Hà Nội (8/4/2026)')],
  newsLang6: [N('20251216'), T('ANDPAD ニュース：4言語を追加し海外の言語は計6言語に（2025年12月16日）', 'ANDPAD news: 4 more languages, 6 foreign languages in total (16 Dec 2025)', 'Tin ANDPAD: thêm 4 ngôn ngữ, tổng 6 ngoại ngữ (16/12/2025)')],
  // ---- sản phẩm ----
  products: ['https://andpad.jp/products', T('ANDPAD 製品一覧（各製品の公式画像とページ）', 'ANDPAD product list (official image and page for each product)', 'Danh sách sản phẩm ANDPAD (ảnh chính thức và trang của từng sản phẩm)')],
  appmarket: ['https://appmarket.andpad.jp/', T('ANDPAD アプリマーケット（外部サービス連携）', 'ANDPAD App Market (partner integrations)', 'Chợ ứng dụng ANDPAD (kết nối dịch vụ đối tác)')],
  earlypay: ['https://page.andpad.jp/earlypay/', T('ANDPAD 早受取：請求書を出すと売掛金を早く受け取れるサービス', 'ANDPAD Early Pay: get paid early for outstanding invoices', 'ANDPAD Early Pay: nhận sớm tiền công nợ từ hoá đơn')],
  knowledgeAi: [N('20260508'), T('ANDPAD ニュース：ナレッジAIの提供開始（2026年5月8日）', 'ANDPAD news: Knowledge AI launched (8 May 2026)', 'Tin ANDPAD: ra mắt Knowledge AI (8/5/2026)')],
  aiBpo: [N('20261005'), T('ANDPAD ニュース：AI-BPOの開始、電気工事の積算から（2026年10月5日）', 'ANDPAD news: AI-BPO starts with electrical estimating (5 Oct 2026)', 'Tin ANDPAD: ra mắt AI-BPO, bắt đầu với dự toán thầu điện (5/10/2026)')],
  // ---- hoạt động, mốc thời gian ----
  prBm: [PRT('000000194'), T('PR TIMES：ANDPAD BM公開の発表（会社概要：設立2012年9月、2016年にサービス開始）', 'PR TIMES: ANDPAD BM launch (profile: founded Sep 2012, service since 2016)', 'PR TIMES: ra mắt ANDPAD BM (hồ sơ: thành lập 9/2012, dịch vụ từ 2016)')],
  mynavi: ['https://news.mynavi.jp/article/20191216-octandpad', T('マイナビニュース：第1回 工務店支援EXPOのANDPADブース（2019年12月）', 'Mynavi News: ANDPAD booth at the 1st Builder Support EXPO (Dec 2019)', 'Mynavi News: gian hàng ANDPAD tại Builder Support EXPO lần 1 (12/2019)')],
  registry: ['https://data-max.co.jp/corpo_database/corpo/detail/4010403009022/', T('法人データベース：商号変更の履歴（2020年5月 株式会社アンドパッド）', 'Company database: name change history (ANDPAD Inc., May 2020)', 'Cơ sở dữ liệu doanh nghiệp: lịch sử đổi tên (ANDPAD Inc., 5/2020)')],
  seriesD: ['https://thebridge.jp/2022/09/andpad-series-d-round-funding/', T('THE BRIDGE：Series Dで約122億円を調達（2022年9月）', 'THE BRIDGE: Series D, about ¥12.2 billion (Sep 2022)', 'THE BRIDGE: gọi vốn Series D khoảng 12,2 tỷ yên (9/2022)')],
  comvex: ['https://thebridge.jp/2024/02/andpad-acquires-comvex', T('THE BRIDGE：Comvex社の買収（2024年2月）', 'THE BRIDGE: Comvex acquisition (Feb 2024)', 'THE BRIDGE: mua lại Comvex (2/2024)')],
  award25: ['https://koubo.jp/press-release/prtimes/c18154_r143', T('PR TIMES転載：ANDPAD AWARD 2025 DXカンパニー部門の発表、年1回の表彰（2025年3月）', 'PR TIMES repost: ANDPAD AWARD 2025 DX Company honourees, a yearly award (Mar 2025)', 'Bản đăng lại PR TIMES: công bố hạng mục DX Company ANDPAD AWARD 2025, giải thưởng mỗi năm (3/2025)')],
  award26: [PRT('000000198'), T('PR TIMES：ANDPAD AWARD 2026 授賞式、新部門DX Project（2026年6月）', 'PR TIMES: ANDPAD AWARD 2026 ceremony, new DX Project category (Jun 2026)', 'PR TIMES: lễ trao giải ANDPAD AWARD 2026, hạng mục mới DX Project (6/2026)')],
  drawAi: [PRT('000000195'), T('PR TIMES：ANDPAD図面の検査でAIが測定箇所を抽出（2026年5月）', 'PR TIMES: AI finds measuring points in ANDPAD Drawings inspections (May 2026)', 'PR TIMES: AI tìm điểm đo trong kiểm tra ANDPAD Bản vẽ (5/2026)')],
  mlit: [PRT('000000196'), T('PR TIMES：国交省「建築行政DX総合推進事業」に採択（2026年5月）', 'PR TIMES: selected for MLIT building-admin DX project (May 2026)', 'PR TIMES: được Bộ MLIT chọn vào dự án DX hành chính xây dựng (5/2026)')],
  tieups: ['https://sogyotecho.jp/news/20260820andpad/', T('創業手帳：東京ガス、ダイキン、カインズとの資本業務提携（2026年8月）', 'Sogyo Techo: tie-ups with Tokyo Gas, Daikin, Cainz (Aug 2026)', 'Sogyo Techo: hợp tác vốn với Tokyo Gas, Daikin, Cainz (8/2026)')],
  prReport: [PRT('000000203'), T('PR TIMES：ANDPAD レポート公開（2026年9月）', 'PR TIMES: ANDPAD Report launched (Sep 2026)', 'PR TIMES: ra mắt ANDPAD Report (9/2026)')],
  award27: [PRT('000000204'), T('PR TIMES：ANDPAD AWARD 2027の募集開始（2026年9月）', 'PR TIMES: ANDPAD AWARD 2027 entries open (Sep 2026)', 'PR TIMES: mở nhận hồ sơ ANDPAD AWARD 2027 (9/2026)')],
  prAiBpo: [PRT('000000205'), T('PR TIMES：ANDPAD AI-BPOの開始（2026年10月）', 'PR TIMES: ANDPAD AI-BPO launched (Oct 2026)', 'PR TIMES: ra mắt ANDPAD AI-BPO (10/2026)')],
  nextgen: ['https://kyodonewsprwire.jp/release/202610238598', T('共同通信PRワイヤー：NextGen Tech 30 2026に選出', 'Kyodo PR Wire: named to NextGen Tech 30 2026', 'Kyodo PR Wire: lọt danh sách NextGen Tech 30 2026')],
  awardSite: ['https://page.andpad.jp/andpad_award/latest/', T('ANDPAD AWARD 公式サイト', 'ANDPAD AWARD official site', 'Trang chính thức ANDPAD AWARD')],
  one: ['https://one.andpad.jp/', T('ANDPAD ONE：ユーザーの活用事例とノウハウのコミュニティサイト', 'ANDPAD ONE: community site of user cases and know-how', 'ANDPAD ONE: trang cộng đồng chia sẻ case và kinh nghiệm của người dùng')],
  asb: ['https://one.andpad.jp/events/', T('ANDPAD ONE イベントとセミナーの案内（オンライン、無料）', 'ANDPAD ONE events and seminars (online, free)', 'ANDPAD ONE: sự kiện và hội thảo (trực tuyến, miễn phí)')],
  // ---- thị trường, khách hàng ----
  mhlw: ['https://kensetsu-roudou-jikan.mhlw.go.jp/kensetsu_overtime.html', T('厚生労働省：建設業の時間外労働の上限規制（2024年4月から）', 'MHLW: overtime cap for construction (from Apr 2024)', 'Bộ MHLW: trần giờ làm thêm ngành xây dựng')],
  cao: ['https://www5.cao.go.jp/keizai-shimon/kaigi/special/reform/wg6/2026/0422shiryou1-1.pdf', T('内閣府WG資料（国交省、2026年4月）：建設業の就業者の年齢構成', 'Cabinet Office WG deck (MLIT, Apr 2026): age of construction workers', 'Tài liệu WG Nội các (MLIT, 4/2026): tuổi lao động xây dựng')],
  iCon: ['https://www.mlit.go.jp/report/press/kanbo08_hh_001085.html', T('国交省：i-Construction 2.0の策定（2040年度までに省人化3割）', 'MLIT: i-Construction 2.0 (30% fewer labour hours by FY2040)', 'Bộ MLIT: công bố i-Construction 2.0')],
  share: [N('20251218'), T('ANDPAD ニュース：ミック経済研究所の調査で導入企業数1位、8年連続（2025年12月）', 'ANDPAD news: first by adopting companies in MIC survey, 8 years running (Dec 2025)', 'Tin ANDPAD: xếp thứ nhất theo khảo sát MIC 8 năm liên tiếp (12/2025)')],
  pricing: ['https://andpad.jp/help/pricing/', T('ANDPAD 料金について（個別見積もり）', 'ANDPAD pricing (quote only)', 'Giá ANDPAD (báo giá riêng)')],
  mic: ['https://mic-r.co.jp/micit/2025/', T('ミック経済研究所：ミックITリポート2025（建設業マネジメントクラウド市場、導入企業数シェア2022〜2025年度見込）', 'MIC Research: MIC IT Report 2025 (construction management cloud, share by adopting companies FY2022 to FY2025 est.)', 'MIC Research: báo cáo MIC IT 2025 (thị trường cloud quản lý xây dựng, thị phần theo số doanh nghiệp sử dụng năm tài khóa 2022 đến 2025 ước tính)')],
  boxil: ['https://boxil.jp/service/4916/reviews/', T('BOXIL：ANDPADの利用者の口コミ', 'BOXIL: ANDPAD user reviews', 'BOXIL: đánh giá của người dùng ANDPAD')],
  // Đối thủ: mỗi nguồn là trang chính thức của CHÍNH công ty vận hành sản phẩm đó (đối chiếu 25/11/2026)
  spider: ['https://spider-plus.com/', T('SPIDERPLUS 公式サイト（スパイダープラス株式会社、導入社数、機能）', 'SPIDERPLUS official site (SpiderPlus & Co., adoption, features)', 'Trang chính thức SPIDERPLUS (SpiderPlus & Co., số công ty dùng, chức năng)')],
  kanna: ['https://lp.kanna4u.com/pricing/', T('KANNA 料金プラン（初期費用0円、料金は見積もり）', 'KANNA pricing plans (no setup fee, quote-based)', 'Bảng giá KANNA (phí ban đầu 0 yên, giá theo báo giá)')],
  kannaFree: ['https://lp.kanna4u.com/news/iak83pyr8pz1/', T('KANNA ニュース：協力会社IDの無料無制限発行、無料プラン、6言語（2026年11月）', 'KANNA news: free unlimited partner IDs, free plan, 6 languages (Nov 2026)', 'Tin KANNA: ID đối tác miễn phí không giới hạn, gói miễn phí, 6 ngôn ngữ (11/2026)')],
  kannaScale: ['https://lp.kanna4u.com/news/c3rgh_zk-6j/', T('KANNA ニュース：株式会社アルダグラム、利用10万社突破（無料の協力会社を含む、2026年8月）', 'KANNA news: Aldagram Inc. passes 100,000 companies (incl. free partners, Aug 2026)', 'Tin KANNA: Aldagram Inc. vượt 100.000 công ty (gồm đối tác dùng miễn phí, 8/2026)')],
  photoruction: ['https://www.photoruction.com/', T('Photoruction 公式サイト（株式会社フォトラクション、SaaSとAI-BPO）', 'Photoruction official site (Photoruction Inc., SaaS and AI-BPO)', 'Trang chính thức Photoruction (Photoruction Inc., SaaS và AI-BPO)')],
  dandori: ['https://dandori-work.com/', T('ダンドリワーク 公式サイト（対象、導入支援、サポート）', 'Dandori Work official site (target users, onboarding, support)', 'Trang chính thức Dandori Work (đối tượng, hỗ trợ triển khai)')],
  dandoriPlan: ['https://dandori-work.com/plan/', T('ダンドリワーク 料金プラン（初期費用、月額）', 'Dandori Work pricing (setup fee, monthly fee)', 'Bảng giá Dandori Work (phí ban đầu, phí tháng)')],
  buildee: ['https://service.buildee.jp/', T('Buildee 公式サイト（運営：株式会社リバスタ、料金、導入数）', 'Buildee official site (run by RVSTA, Inc.; pricing, adoption)', 'Trang chính thức Buildee (RVSTA, Inc. vận hành; giá, số lượng dùng)')],
  cBeaver: ['https://andpad.jp/cases/beaver-reform', T('導入事例：ビーバーリフォーム', 'Case study: Beaver Reform', 'Case Beaver Reform')],
  cKasuke: ['https://andpad.jp/cases/kasuke', T('導入事例：カスケホーム', 'Case study: Kasuke Home', 'Case Kasuke Home')],
  cHiramatsu: ['https://andpad.jp/cases/hiramatsu-kenchiku02', T('導入事例：平松建築', 'Case study: Hiramatsu Kenchiku', 'Case Hiramatsu Kenchiku')],
  cDaikatsu: ['https://andpad.jp/cases/daikatsu', T('導入事例：大勝', 'Case study: Daikatsu', 'Case Daikatsu')],
  cEnergio: ['https://andpad.jp/cases/energio', T('導入事例：エイコーエナジオ', 'Case study: Eiko Energio', 'Case Eiko Energio')],
  cWatasho: ['https://andpad.jp/cases/watasyou', T('導入事例：渡正配管工業', 'Case study: Watasho Haikan', 'Case Watasho Haikan')],
  support: ['https://andpad.jp/help/support/', T('ANDPAD サポート（導入4ステップ、窓口）', 'ANDPAD support (4 steps, contact desk)', 'Hỗ trợ ANDPAD (4 bước, kênh liên hệ)')],
  // ---- vị trí ----
  jdVn: ['https://careers.andpad.vn/jobs/8693932-customer-success-staff-hcm-it-n2-eng-leader-candidate', T('ANDPAD Vietnam 求人票：Customer Success Staff（研修、サポート、フォロー会議、デモ、マニュアル、出張）', 'ANDPAD Vietnam JD: Customer Success Staff (training, support, follow-up meetings, demos, manuals, site visits)', 'JD ANDPAD Vietnam: Customer Success Staff (đào tạo, hỗ trợ, họp follow-up, demo, tài liệu, công tác)')],
  jdJp: ['https://hrmos.co/pages/andpad/jobs/biz0000411', T('ANDPAD 求人票：カスタマーサクセス（日本、導入計画、説明会、継続支援）', 'ANDPAD JD: Customer Success in Japan (onboarding plans, briefings, renewal follow-up)', 'JD ANDPAD: Customer Success tại Nhật (kế hoạch triển khai, buổi hướng dẫn, theo dõi gia hạn)')],
};
for (const [k, [ja, en, vi]] of Object.entries(PROD))
  REFS[`p_${k}`] = [P(k), T(`${ja} 製品ページ`, `${en} product page`, `Sản phẩm ${vi}`)];
// Trang #ap-app, #ap-scope (tools/ap/app.mjs): app chính thức, thị trường, khu vực. Đã mở và đối chiếu ngày 26/11/2026.
Object.assign(REFS, {
  appIos: ['https://apps.apple.com/jp/app/id1067643333', T('App Store：ANDPAD - カンタン施工管理アプリ（ANDPAD Inc.、評価2.7、257件）', 'App Store: ANDPAD - カンタン施工管理アプリ (ANDPAD Inc., 2.7 stars, 257 ratings)', 'App Store: ANDPAD - カンタン施工管理アプリ (ANDPAD Inc., 2,7 sao, 257 đánh giá)')],
  appPlay: ['https://play.google.com/store/apps/details?id=jp.andpad.android', T('Google Play：ANDPAD（jp.andpad.android、10万回以上ダウンロード）', 'Google Play: ANDPAD (jp.andpad.android, 100K+ downloads)', 'Google Play: ANDPAD (jp.andpad.android, hơn 100.000 lượt tải)')],
  cases: ['https://andpad.jp/cases', T('ANDPAD 導入事例（業界から選ぶ：住宅、専門工事、ゼネコン、土木など）', 'ANDPAD case studies (by industry: housing, trades, general contractors, civil)', 'Case ANDPAD (lọc theo ngành: nhà ở, thầu chuyên ngành, tổng thầu, hạ tầng)')],
  yano: ['https://www.yano.co.jp/press-release/show/press_id/3789', T('矢野経済研究所：建築分野の建設テック市場（2023年度1,845億円、2030年度予測3,043億円）', 'Yano Research: construction tech market, building sector (FY2023 ¥184.5bn, FY2030 forecast ¥304.3bn)', 'Yano Research: thị trường công nghệ xây dựng, mảng kiến trúc (FY2023 184,5 tỷ yên, dự báo FY2030 304,3 tỷ yên)')],
  mlitKyoka: ['https://www.mlit.go.jp/report/press/content/002000768.pdf', T('国交省：建設業許可業者数調査（2026年3月末、483,823業者、都道府県別）', 'MLIT: licensed construction companies (end of March 2026, 483,823, by prefecture)', 'Bộ MLIT: số doanh nghiệp xây dựng có giấy phép (cuối 3/2026, 483.823, theo tỉnh)')],
  mordorVn: ['https://www.mordorintelligence.com/industry-reports/vietnam-construction-market', T('Mordor Intelligence：ベトナム建設市場（2026年806.1億ドル、ホーチミン市が2025年の36.88％）', 'Mordor Intelligence: Vietnam construction market (USD 80.61bn in 2026; HCMC 36.88% of 2025 value)', 'Mordor Intelligence: thị trường xây dựng Việt Nam (80,61 tỷ USD năm 2026; TP.HCM chiếm 36,88% giá trị 2025)')],
  misaAmis: ['https://amis.misa.vn/285355/phan-mem-quan-ly-cong-viec-cho-doanh-nghiep-xay-dung/', T('MISA：AMIS Công việc（建設会社向け、プロジェクト、工事、工種、施工班ごとの管理）', 'MISA: AMIS Công việc for construction firms (work by project, site, work item, crew)', 'MISA: AMIS Công việc cho doanh nghiệp xây dựng (quản lý theo dự án, công trình, hạng mục, đội thi công)')],
});

export const REF_HEAD = T('参考文献', 'References', 'Nguồn tham khảo');
const NOTE = T('（2026年11月25日に確認）', ' (checked 25 Nov 2026)', ' (tra cứu 25/11/2026)');

// Bộ trích dẫn cho 1 trang. L3 = hàm in 3 ngôn ngữ của build.mjs.
export function book(page, L3) {
  const order = [];
  const c = (...keys) => {
    const nums = keys.map((k) => {
      if (!REFS[k]) throw new Error(`refs.mjs: không có nguồn "${k}" (trang ${page})`);
      if (!order.includes(k)) order.push(k);
      return order.indexOf(k) + 1;
    });
    return `<sup class="ap-c">[${nums.join(',')}]</sup>`;
  };
  // t(): gắn số trích dẫn vào CUỐI chữ của cả 3 ngôn ngữ (nằm trong dòng chữ, không thành ô riêng trong flex / grid)
  const t = (o, ...keys) => { const s = c(...keys); return { ja: o.ja + s, en: o.en + s, vi: o.vi + s }; };
  // Nhãn link: bỏ https:// và www., cắt gọn đường dẫn dài
  // dài thì giữ tên miền + đuôi đường dẫn (các link cùng trang báo vẫn phân biệt được)
  const show = (u) => { const s = u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''); if (s.length <= 31) return s; const h = s.split('/')[0]; return `${h}/…${s.slice(-Math.max(14, 30 - h.length))}`; };
  const list = () => `  <div class="ap-src ap-refs rv" style="--d:260ms">
    <p class="ap-rh">${L3('b', REF_HEAD)}${L3('span', NOTE)}</p>
    <ol>
${order.map((k, i) => `      <li id="${page}-r${i + 1}">${L3('span', REFS[k][1])}<a href="${REFS[k][0]}" target="_blank" rel="noopener">${show(REFS[k][0])}</a></li>`).join('\n')}
    </ol>
  </div>`;
  return { c, t, list };
}
