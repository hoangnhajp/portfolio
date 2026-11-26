// Hai trang phân tích SẢN PHẨM CHỦ LỰC của ANDPAD tại Việt Nam, ngay sau #ap-compete:
// - #ap-app: tên app chính thức (App Store, Google Play), app đi kèm bản tiếng Việt, chức năng theo trang sản phẩm 施工管理,
//   bài toán và cách hỗ trợ doanh nghiệp (kết quả thí điểm tại Việt Nam).
// - #ap-scope: thị trường và ngành sản phẩm cùng loại (Nhật, Việt Nam), thị phần (không có % công bố), khu vực tập trung
//   khách hàng, và nhận định của ứng viên (ghi rõ là nhận định).
// Đối chiếu nguồn ngày 26/11/2026; khoá nguồn ở tools/ap/refs.mjs. Kiểm bằng tests/check-ap-app.mjs.
const ico = (f, s = 26) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;

export function pageApp({ L3, T, head, b }) {
  const subC = b.c('appIos', 'newsVi');
  // [tên chức năng JA, VI ngắn, mô tả] theo thứ tự trên andpad.jp/products/construction_management
  const FT = [
    ['案件管理', T('案件ごとに工程表、資料、写真、報告をまとめる', 'Schedule, files, photos and reports kept per project', 'Gom tiến độ, tài liệu, ảnh, báo cáo theo từng công trình')],
    ['工程表', T('工程を変えると担当者へ自動で通知', 'Schedule changes notify the people in charge', 'Đổi tiến độ là tự báo cho người phụ trách')],
    ['チャット', T('案件ごとのチャットルーム', 'One chat room per project', 'Mỗi công trình một phòng chat')],
    ['写真', T('写真をクラウドに保存し、写真台帳を作成', 'Photos stored in the cloud, photo ledger built', 'Ảnh lưu trên cloud, lập sổ ảnh')],
    ['資料', T('Excelをダウンロードせずに閲覧、編集', 'View and edit Excel without downloading', 'Xem, sửa file Excel không cần tải về')],
    ['報告', T('日報、完了報告をスマホから', 'Daily and completion reports from a phone', 'Báo cáo ngày, báo cáo hoàn thành từ điện thoại')],
    ['出力', T('紙、PDF、Excelで出力', 'Output to paper, PDF or Excel', 'Xuất ra giấy, PDF, Excel')],
    ['多言語対応', T('英語、ベトナム語などに対応', 'English, Vietnamese and more', 'Tiếng Anh, tiếng Việt và ngôn ngữ khác')],
  ];
  // [icon, tiêu đề, nội dung, nguồn]
  const PB = [
    ['stopwatch', T('課題', 'Problem', 'Bài toán'),
      T('ベトナムと東南アジアでは、DXをまだ使えていない建設会社が多く、記録は紙が中心。建設労働者は450万人超。',
        'Many builders in Vietnam and Southeast Asia have not yet used DX; site records are mostly on paper. Over 4.5 million construction workers.',
        'Nhiều doanh nghiệp xây dựng ở Việt Nam và Đông Nam Á chưa dùng DX, hồ sơ công trường chủ yếu trên giấy. Hơn 4,5 triệu lao động xây dựng.'), ['newsJetro', 'newsPilot']],
    ['checklist', T('解き方', 'How the app solves it', 'Cách app giải quyết'),
      T('写真登録、電子黒板、帳票出力を現場で使用。独自の帳票レイアウトにも対応。',
        'Photo registration, a digital blackboard and form output on site, with support for custom form layouts.',
        'Dùng đăng ảnh, bảng đen điện tử, xuất biểu mẫu ngay tại công trường; hỗ trợ cả bố cục biểu mẫu riêng.'), ['newsPilot']],
    ['report-chart', T('効果（実証）', 'Result (pilot)', 'Hiệu quả (thí điểm)'),
      T('日系建設企業の現場で2024年2月〜2025年5月に実証。現場作業の時間が30〜50％減り、紙の記録が不要に。',
        'Piloted with Japanese builders in Vietnam, Feb 2024 to May 2025: on-site work time down 30 to 50%, no more paper records.',
        'Thí điểm cùng doanh nghiệp xây dựng Nhật tại Việt Nam (2/2024 đến 5/2025): giờ làm tại hiện trường giảm 30 đến 50%, bỏ ghi chép giấy.'), ['newsPilot']],
    ['handshake', T('企業への支援', 'Support for companies', 'Cách hỗ trợ doanh nghiệp'),
      T('現地スタッフが導入から運用までをベトナムで支援。既存ユーザーはベトナム語版を無料で利用。',
        'Local staff handle onboarding and ongoing support in Vietnam. Existing users get the Vietnamese version free.',
        'Nhân sự tại chỗ hỗ trợ từ triển khai tới vận hành ngay tại Việt Nam; người đang dùng được dùng bản tiếng Việt miễn phí.'), ['newsPilot', 'newsVi']],
  ];
  return `<section class="pg" data-chap="IV" id="ap-app">
${head('APP　<b>MAIN PRODUCT</b>', T('ベトナムでの主力製品：<br /><i>ANDPAD 施工管理アプリ。</i>', 'The main product in Vietnam:<br /><i>the ANDPAD construction management app.</i>', 'Sản phẩm chủ lực tại Việt Nam:<br /><i>app ANDPAD Quản lý thi công.</i>'),
    'Official name ／ Features ／ Problem ／ Support',
    T('正式なアプリ名、機能、解決する課題、企業への支援。ベトナム語版は施工管理、チャット、図面の3つ（2025年6月）。',
      'Official app name, features, the problem it solves and how it supports companies. The Vietnamese version covers three parts: Construction Management, Chat, Drawings (June 2025).',
      'Tên app chính thức, chức năng, bài toán giải quyết và cách hỗ trợ doanh nghiệp. Bản tiếng Việt gồm 3 phần: Quản lý thi công, Chat, Bản vẽ (6/2025).'), subC)}
  <div class="card ap-an rv" style="--d:180ms">
    <div>
      ${L3('span', T('正式名称', 'Official name', 'Tên chính thức'), ' class="lbl"')}
      <h3>ANDPAD - カンタン施工管理アプリ${b.c('appIos')}</h3>
      <ul>
        <li>${L3('span', b.t(T('App Store：「ANDPAD - カンタン施工管理アプリ」（ANDPAD Inc.）。サブタイトル「建築現場の業務をスマホで一元管理」。評価2.7（257件）',
          'App Store: "ANDPAD - カンタン施工管理アプリ" (ANDPAD Inc.), subtitle "manage all building-site work on a phone"; 2.7 stars from 257 ratings',
          'App Store: "ANDPAD - カンタン施工管理アプリ" (ANDPAD Inc.), phụ đề "quản lý mọi việc công trường trên điện thoại"; 2,7 sao, 257 đánh giá'), 'appIos'))}</li>
        <li>${L3('span', b.t(T('Google Play：「ANDPAD」（jp.andpad.android）、10万回以上ダウンロード',
          'Google Play: "ANDPAD" (jp.andpad.android), 100K+ downloads',
          'Google Play: "ANDPAD" (jp.andpad.android), hơn 100.000 lượt tải'), 'appPlay'))}</li>
        <li>${L3('span', b.t(T('会社の説明：クラウド型建設プロジェクト管理サービス。導入企業数1位の根拠はMICの調査',
          'How ANDPAD describes it: a cloud construction project management service; its first place by adopting companies comes from the MIC survey',
          'Doanh nghiệp tự giới thiệu: dịch vụ cloud quản lý dự án xây dựng; việc xếp thứ nhất về số doanh nghiệp sử dụng căn cứ theo khảo sát của MIC'), 'top', 'mic'))}</li>
      </ul>
    </div>
    <div>
      ${L3('span', T('ベトナム語対応の機能（アプリ5.85以降）', 'Features in Vietnamese (app 5.85+)', 'Chức năng có tiếng Việt (app 5.85 trở lên)'), ' class="lbl"')}
      <ul class="ap-an-vi">
        <li><b>施工管理</b>${L3('span', b.t(T('案件、工程、写真、報告', 'Projects, schedules, photos, reports', 'Công trình, tiến độ, ảnh, báo cáo'), 'newsVi'))}</li>
        <li><b>チャット</b>${L3('span', b.t(T('現場の連絡', 'Site messaging', 'Liên lạc công trường'), 'newsVi'))}</li>
        <li><b>図面</b>${L3('span', b.t(T('図面の閲覧と記録', 'View and mark up drawings', 'Xem và ghi chú bản vẽ'), 'newsVi'))}</li>
      </ul>
      ${L3('p', b.t(T('ストアの関連アプリ：ANDPAD CHAT、ANDPAD 図面、検査、ボード、受発注、3Dスキャン、BM、おうちノートなど。',
        'Related apps in the store: ANDPAD CHAT, ANDPAD 図面 (Drawings), Inspection, Board, Ordering, 3D Scan, BM, Ouchi Note and more.',
        'App liên quan trên store: ANDPAD CHAT, ANDPAD 図面 (Bản vẽ), Kiểm tra, ANDPAD ボード (Lịch điều phối thợ), Đặt hàng, Quét 3D, BM, Ouchi Note (app cho chủ nhà) và các app khác.'), 'appIos'), ' class="ap-an-p"')}
    </div>
  </div>
  <div class="ap-ftw rv" style="--d:200ms">
    <div class="ap-gh">${ico('building-blocks', 22)}${L3('span', T('機能', 'Features', 'Chức năng'), ' class="lbl"')}${L3('h3', T('ANDPAD施工管理：情報の集約と共有', 'ANDPAD Construction Management: gather and share site information', 'ANDPAD Quản lý thi công: gom và chia sẻ thông tin công trình'))}</div>
    <ul class="ap-fts">
${FT.map(([n, d], i) => `      <li class="ap-ft" style="--i:${i}"><b>${n}</b>${L3('span', b.t(d, 'p_construction_management'))}</li>`).join('\n')}
    </ul>
  </div>
  <ul class="ap-pb rv" style="--d:220ms">
${PB.map(([ic, h, p, r], i) => `    <li style="--i:${i}">${ico(ic)}<div>${L3('b', h)}${L3('span', b.t(p, ...r))}</div></li>`).join('\n')}
  </ul>
${b.list()}
</section>`;
}

export function pageScope({ L3, T, head, b }) {
  const subC = b.c('yano', 'mordorVn');
  const row = (k, v, r) => `        <li>${L3('b', k)}${L3('span', b.t(v, ...r))}</li>`;
  const JP = [
    [T('同種製品の市場', 'Same-category market', 'Ngành sản phẩm cùng loại'),
      T('建設テック（建築分野）：2023年度1,845億円（前年度比11.7％増）、2030年度予測3,043億円（年7.4％成長）',
        'Construction tech, building sector: ¥184.5bn in FY2023 (+11.7%), forecast ¥304.3bn in FY2030 (7.4% a year)',
        'Công nghệ xây dựng mảng kiến trúc: 184,5 tỷ yên năm tài khóa 2023 (+11,7%), dự báo 304,3 tỷ yên năm tài khóa 2030 (tăng 7,4%/năm)'), ['yano']],
    [T('シェア', 'Share', 'Thị phần'),
      T('建設業マネジメントクラウドサービス市場で導入企業数1位、8年連続（MIC、2025年12月）。％は非公開',
        'First by adopting companies in the construction management cloud service market, 8 years running (MIC, Dec 2025). No % published',
        'Xếp thứ nhất về số doanh nghiệp sử dụng trong thị trường dịch vụ cloud quản lý ngành xây dựng, 8 năm liên tiếp (MIC, 12/2025). Tỷ lệ % không công bố'), ['share', 'mic']],
    [T('利用規模', 'Scale', 'Quy mô dùng'),
      T('27.9万社、81.8万人', '279,000 companies, 818,000 users', '279.000 công ty, 818.000 người dùng'), ['top']],
  ];
  const VN = [
    [T('建設市場', 'Construction market', 'Thị trường xây dựng'),
      T('2026年806.1億ドル、2031年1,157.8億ドル（年7.51％成長）', 'USD 80.61bn in 2026, USD 115.78bn in 2031 (7.51% a year)', '80,61 tỷ USD năm 2026, 115,78 tỷ USD năm 2031 (tăng 7,51%/năm)'), ['mordorVn']],
    [T('同種製品', 'Same-category products', 'Sản phẩm cùng loại'),
      T('ベトナム国内の業務管理ソフト：MISA AMIS Công việc（プロジェクト、工事、工種、施工班ごとに管理）',
        'Local work-management software: MISA AMIS Công việc (work by project, site, work item, crew)',
        'Phần mềm quản lý công việc nội địa: MISA AMIS Công việc (quản lý theo dự án, công trình, hạng mục, đội thi công)'), ['misaAmis']],
    [T('シェア', 'Share', 'Thị phần'),
      T('施工管理ソフトの市場規模、シェアは公開データなし。ANDPADもベトナムの顧客数は非公開（実証は2025年5月に完了）',
        'No public size or share data for site-management software. ANDPAD does not publish a Vietnam customer count (pilot ended May 2025)',
        'Chưa có số liệu công khai về quy mô, thị phần phần mềm quản lý thi công; ANDPAD không công bố số khách tại Việt Nam (thí điểm xong 5/2025)'), ['newsPilot']],
  ];
  const RG = [
    ['office-building', T('日本', 'Japan', 'Nhật Bản'), [
      [T('拠点：東京、仙台、大阪、福岡', 'Offices: Tokyo, Sendai, Osaka, Fukuoka', 'Văn phòng: Tokyo, Sendai, Osaka, Fukuoka'), ['company']],
      [T('建設業者483,823社のうち、東京9.3％、大阪8.6％、神奈川6.1％（2026年3月末）', 'Of 483,823 licensed builders: Tokyo 9.3%, Osaka 8.6%, Kanagawa 6.1% (March 2026)', 'Trong 483.823 doanh nghiệp xây dựng: Tokyo 9,3%, Osaka 8,6%, Kanagawa 6,1% (3/2026)'), ['mlitKyoka']],
      [T('顧客の業種：住宅（注文、分譲、リフォーム）、専門工事、ゼネコン、土木など。地域別の顧客数は非公開', 'Customer types: housing (custom, spec, renovation), trades, general contractors, civil. No customer split by region is published', 'Ngành khách: nhà ở (đặt làm, phân lô, cải tạo), thầu chuyên ngành, tổng thầu, hạ tầng. Không công bố số khách theo vùng'), ['cases']],
    ]],
    ['roadmap', T('ベトナム', 'Vietnam', 'Việt Nam'), [
      [T('本社はホーチミン市、ハノイにも事務所（2026年4月移転）', 'Head office in Ho Chi Minh City, plus a Hanoi office (moved April 2026)', 'Trụ sở TP.HCM, thêm văn phòng Hà Nội (dời 4/2026)'), ['newsHanoi', 'vnHanoiPr']],
      [T('ホーチミン市が2025年の建設市場の36.88％', 'Ho Chi Minh City made up 36.88% of 2025 construction value', 'TP.HCM chiếm 36,88% giá trị thị trường xây dựng 2025'), ['mordorVn']],
      [T('JETRO事業（2023年12月採択）の現地パートナーはPENTA-OCEAN CONSTRUCTION VIETNAM。実証は日系建設企業の協力で実施', 'JETRO project (selected Dec 2023) with local partner PENTA-OCEAN CONSTRUCTION VIETNAM; the pilot ran with help from Japanese builders', 'Dự án JETRO (được chọn 12/2023) có đối tác tại chỗ PENTA-OCEAN CONSTRUCTION VIETNAM; thí điểm làm cùng doanh nghiệp xây dựng Nhật'), ['newsJetro', 'newsPilot']],
      [T('今後の計画：南北の主要都市で導入拠点を広げ、周辺国への展開も準備', 'Plan: more sites in major cities in the north and south, and preparing to expand to neighbouring countries', 'Kế hoạch: mở rộng ở các thành phố lớn miền Bắc, miền Nam và chuẩn bị mở rộng sang nước lân cận'), ['newsPilot']],
    ]],
  ];
  const SW = [
    ['ap-sw-s', T('強み', 'Strength', 'Điểm mạnh'), T('1つのアプリで写真、工程、チャット、報告。ベトナム語と実証の数字あり', 'One app for photos, schedules, chat and reports; Vietnamese UI and pilot numbers', 'Một app gom ảnh, tiến độ, chat, báo cáo; đã có tiếng Việt và số liệu thí điểm'), ['p_construction_management', 'newsPilot']],
    ['ap-sw-w', T('留意点', 'Limitations', 'Hạn chế'), T('App Storeの評価2.7。料金は非公開', 'App Store rating 2.7; pricing not public', 'App Store chỉ 2,7 sao; giá không công khai'), ['appIos', 'pricing']],
    ['ap-sw-o', T('機会', 'Opportunity', 'Cơ hội'), T('建設市場は年7.51％成長。ホーチミン市とハノイの日系企業から始めやすい', 'Market grows 7.51% a year; Japanese firms in HCMC and Hanoi are an easy first segment', 'Thị trường tăng 7,51%/năm; doanh nghiệp Nhật ở TP.HCM, Hà Nội là nhóm khách dễ bắt đầu'), ['mordorVn', 'newsPilot']],
    ['ap-sw-t', T('リスク', 'Risk', 'Rủi ro'), T('国内勢（MISA AMISなど）がなじみのある選択肢。ベトナムの顧客数はまだ非公開', 'Local tools such as MISA AMIS are familiar choices; no Vietnam customer count yet', 'Công cụ nội địa như MISA AMIS quen thuộc với doanh nghiệp Việt; chưa có số khách công bố tại Việt Nam'), ['misaAmis', 'newsPilot']],
  ];
  return `<section class="pg" data-chap="IV" id="ap-scope">
${head('MKT　<b>MARKET ／ REGIONS</b>', T('市場、シェア、<br /><i>顧客が集まる地域。</i>', 'Market, share<br /><i>and where customers are.</i>', 'Thị trường, thị phần<br /><i>và khu vực khách hàng.</i>'),
    'Market ／ Share ／ Regions ／ Analysis',
    T('同種製品の市場規模、シェア、顧客の地域を日本とベトナムで比較し、最後にベトナムでの主力製品を分析。',
      'Market size for the same product category, share and customer regions in Japan and Vietnam, then an analysis of the main product in Vietnam.',
      'So sánh quy mô ngành sản phẩm cùng loại, thị phần, khu vực khách hàng ở Nhật và Việt Nam, rồi phân tích sản phẩm chủ lực tại Việt Nam.'), subC)}
  <div class="ap-mkt rv" style="--d:180ms">
    <div class="card">
      <div class="ap-gh">${ico('report-chart', 22)}<span class="lbl">JAPAN</span>${L3('h3', T('日本の市場', 'Market in Japan', 'Thị trường Nhật Bản'))}</div>
      <ul>
${JP.map(([k, v, r]) => row(k, v, r)).join('\n')}
      </ul>
    </div>
    <div class="card">
      <div class="ap-gh">${ico('roadmap', 22)}<span class="lbl">VIETNAM</span>${L3('h3', T('ベトナムの市場', 'Market in Vietnam', 'Thị trường Việt Nam'))}</div>
      <ul>
${VN.map(([k, v, r]) => row(k, v, r)).join('\n')}
      </ul>
    </div>
  </div>
  <div class="ap-rgw rv" style="--d:200ms">
    ${L3('span', T('顧客が集まる地域', 'Where customers concentrate', 'Khu vực tập trung khách hàng'), ' class="lbl"')}
    <div class="ap-rgs">
${RG.map(([ic, h, items]) => `      <div class="card ap-rg">${ico(ic, 24)}${L3('b', h)}<ul>
${items.map(([t, r]) => `        <li>${L3('span', b.t(t, ...r))}</li>`).join('\n')}
      </ul></div>`).join('\n')}
    </div>
  </div>
  <div class="card ap-swc rv" style="--d:220ms">
    ${L3('span', T('ベトナムでの主力製品の分析（応募者の見解、出典に基づく）', 'Analysis of the main product in Vietnam (candidate\'s view, based on the sources)', 'Phân tích sản phẩm chủ lực tại Việt Nam (nhận định của ứng viên, dựa trên nguồn)'), ' class="lbl"')}
    <ul class="ap-sw">
${SW.map(([c, h, p, r], i) => `      <li class="${c}" style="--i:${i}">${L3('b', h)}${L3('span', b.t(p, ...r))}</li>`).join('\n')}
    </ul>
  </div>
${b.list()}
</section>`;
}
