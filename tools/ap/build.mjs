// Task m07v: sinh tab "Andpad Info" (main data-view="ap", 4 trang) vào index.html, giữa khối jd:end và main sw.
// Chạy lại được (idempotent): thay nội dung giữa <!-- ap:start --> và <!-- ap:end -->; lần đầu chèn ngay sau <!-- jd:end -->.
// Số liệu công ty, sản phẩm, mốc thời gian lấy từ nguồn công khai, tra cứu 25/11/2026 (link ghi trên từng trang).
// Trang #ap-role là DỰ BÁO của ứng viên (ghi rõ trên trang), dựa trên JD + tin tuyển dụng công khai.
// Menu trên, sidebar, CSS (khối ap-css) và mảng IDS của pganh sửa tay trong index.html (không do script này).
// Chạy (từ thư mục repo): node tools/ap/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../../index.html', import.meta.url));
const L3 = (tag, o, attrs = '') => ['ja', 'en', 'vi'].map((l) => `<${tag}${attrs} data-l="${l}">${o[l]}</${tag}>`).join('');
const T = (ja, en, vi) => ({ ja, en, vi });
const ico = (f, s = 34) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
const link = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const head = (eb, h2, en, sub) => [
  `  <span class="eb rv">${eb}</span>`,
  `  <h2 class="kw ap-kw rv" style="--d:60ms">${L3('span', h2)}</h2>`,
  `  <span class="kw-en rv" style="--d:100ms">${en}</span>`,
  `  <div class="kwbar rv" style="--d:120ms"><span></span></div>`,
  ...['ja', 'en', 'vi'].map((l) => `  <p class="kw-sub ap-sub rv" style="--d:140ms" data-l="${l}">${sub[l]}</p>`),
].join('\n');
const SRC_LBL = T('出典（2026年11月25日に確認）：', 'Sources (checked 25 Nov 2026): ', 'Nguồn (tra cứu 25/11/2026): ');
const src = (links) => `  <p class="ap-src rv" style="--d:260ms">${L3('span', SRC_LBL)}${links.map(([u, t]) => link(u, t)).join(' ／ ')}</p>`;

// ---------- Trang TOP: tổng quan công ty ----------
const FACTS = [
  ['office-building', T('設立', 'Founded', 'Thành lập'), T('2012年9月', 'September 2012', 'Tháng 9/2012')],
  ['manager', T('代表取締役CEO', 'CEO', 'CEO'), T('稲田 武夫（Takeo Inada）', 'Takeo Inada', 'Takeo Inada (稲田 武夫)')],
  ['key', T('本社', 'Head office', 'Trụ sở'), T('東京都港区三田', 'Mita, Minato-ku, Tokyo', 'Mita, Minato-ku, Tokyo')],
  ['team-group', T('社員数', 'Employees', 'Nhân viên'), T('1,072名（2026年11月1日）', '1,072 (1 Nov 2026)', '1.072 người (1/11/2026)')],
  ['building-blocks', T('利用', 'In use at', 'Đang dùng'), T('27.9万社、81.8万ユーザー', '279,000 companies, 818,000 users', '279.000 công ty, 818.000 người dùng')],
  ['report-chart', T('ARR', 'ARR', 'ARR'), T('100億円を突破（2026年）', 'Passed ¥10 billion (2026)', 'Vượt 10 tỷ yên (2026)')],
];
const VN = [
  ['office-building', T('本社はホーチミン市（90 Nguyen Dinh Chieu）。ハノイ事務所は2025年5月に開設し、2026年4月にTaisei Square Hanoiへ移転。',
    'Head office in Ho Chi Minh City (90 Nguyen Dinh Chieu). The Hanoi office opened in May 2025 and moved to Taisei Square Hanoi in April 2026.',
    'Trụ sở tại TP.HCM (90 Nguyễn Đình Chiểu). Văn phòng Hà Nội mở tháng 5/2025, dời về Taisei Square Hanoi tháng 4/2026.')],
  ['workflow-gears', T('開発部門：ANDPADを開発する拠点（Go、Ruby on Rails、React、Vue、Kotlin、Swift、AWS）。',
    'Development Division: builds the ANDPAD service (Go, Ruby on Rails, React, Vue, Kotlin, Swift, AWS).',
    'Khối Phát triển: phát triển dịch vụ ANDPAD (Go, Ruby on Rails, React, Vue, Kotlin, Swift, AWS).')],
  ['handshake', T('ビジネス部門：導入、研修、サポートを担うCustomer Successチーム。今回の募集はこのチームです。',
    'Business Division: the Customer Success team for onboarding, training and support. This opening is in this team.',
    'Khối Kinh doanh: đội Customer Success lo triển khai, đào tạo, hỗ trợ khách hàng. Vị trí đang tuyển thuộc đội này.')],
  ['chat-bubbles', T('2025年2月に英語版、6月にベトナム語版（施工管理、チャット、図面）を公開。',
    'English version in February 2025, Vietnamese in June 2025 (Construction Management, Chat, Drawings).',
    'Ra bản tiếng Anh tháng 2/2025, bản tiếng Việt tháng 6/2025 (Quản lý thi công, Chat, Bản vẽ).')],
];
function pageTop() {
  return `<section class="pg" data-chap="I" id="ap-top">
${head('COMPANY　<b>ANDPAD</b>', T('建設業界のための<br /><i>クラウド施工管理。</i>', 'Cloud project management<br /><i>for construction.</i>', 'Quản lý thi công trên đám mây<br /><i>cho ngành xây dựng.</i>'),
    'Vertical SaaS ／ Construction DX ／ Japan and Vietnam',
    T('株式会社アンドパッドは建設業界向けのVertical SaaS企業です。現場の写真、図面、工程、受発注までを一つのクラウドで管理できます。',
      'ANDPAD Inc. is a vertical SaaS company for construction. Its cloud keeps site photos, drawings, schedules and orders in one place.',
      'ANDPAD Inc. là công ty Vertical SaaS cho ngành xây dựng Nhật Bản. Nền tảng gom ảnh hiện trường, bản vẽ, tiến độ và đơn đặt hàng vào một chỗ trên đám mây.'))}
  <ul class="ap-kv rv" style="--d:180ms">
${FACTS.map(([ic, k, v], i) => `    <li style="--i:${i}">${ico(ic, 36)}<div>${L3('span', k, ' class="ap-k"')}${L3('b', v)}</div></li>`).join('\n')}
  </ul>
  <div class="card ap-ms rv" style="--d:200ms">
    <span class="lbl">MISSION ／ VALUES</span>
    <h3>「幸せを築く人を、幸せに。」</h3>
    ${L3('p', T('家を建てる人、街をつくる人の働き方を、テクノロジーで良くすることを目指しています。',
      'Make the people who build happiness, happy: better working lives for everyone who builds homes and towns.',
      'Mang hạnh phúc đến những người kiến tạo hạnh phúc: cải thiện cách làm việc của người xây nhà, xây phố bằng công nghệ.'))}
    <div class="chips"><span class="chip">Professional</span><span class="chip">Mission Driven</span><span class="chip">Reality</span><span class="chip">Customer Success</span><span class="chip">Technology First</span><span class="chip">Love ANDPAD</span></div>
  </div>
  <div class="card ap-vn rv" style="--d:220ms">
    <span class="lbl">ANDPAD VIETNAM</span>
    ${L3('h3', T('ANDPAD Vietnam（ホーチミン、ハノイ）', 'ANDPAD Vietnam (Ho Chi Minh City and Hanoi)', 'ANDPAD Vietnam (TP.HCM và Hà Nội)'))}
    <ul>
${VN.map(([ic, t]) => `      <li>${ico(ic, 30)}${L3('span', t)}</li>`).join('\n')}
    </ul>
  </div>
${src([['https://andpad.co.jp/company', 'andpad.co.jp/company'], ['https://andpad.co.jp/mission/', 'andpad.co.jp/mission'], ['https://andpad.jp/', 'andpad.jp'],
    ['https://careers.andpad.vn/jobs', 'careers.andpad.vn'], ['https://vietnamnews.vn/media-outreach/1778975/hanoi-office-at-andpad-vietnam-relocated.html', 'Vietnam News 2026'],
    ['https://thebridge.jp/2026/04/andpad-stellarc-ai-agent-construction-hot100', 'THE BRIDGE 2026']])}
</section>`;
}

// ---------- Trang 01: sản phẩm ----------
// [tên chính thức, tên tiếng Anh, mô tả, có bản tiếng Việt]
const GROUPS = [
  ['checklist', 'SITE', T('現場の管理', 'Site work', 'Quản lý hiện trường'), [
    ['施工管理', 'Construction Management', T('案件ごとに写真、工程、資料、連絡を一元管理', 'Photos, schedules, files and messages per project', 'Gom ảnh, tiến độ, tài liệu, liên lạc theo từng công trình'), 1],
    ['チャット', 'Chat', T('現場関係者とのグループチャット', 'Group chat with everyone on site', 'Chat nhóm với mọi người ở công trình'), 1],
    ['図面', 'Drawings', T('図面の上に指示と写真を記録', 'Notes and photos pinned on drawings', 'Ghi chỉ thị và ảnh ngay trên bản vẽ'), 1],
    ['黒板', 'Blackboard', T('電子黒板付きで工事写真を撮影', 'Site photos with a digital signboard', 'Chụp ảnh thi công kèm bảng đen điện tử')],
    ['検査', 'Inspection', T('紙を使わず、漏れのない検査', 'Paperless inspections, nothing missed', 'Kiểm tra không giấy, không sót hạng mục')],
    ['遠隔臨場', 'Remote Inspection', T('現場に行かずに立会検査', 'Witness inspections without travelling', 'Nghiệm thu từ xa, không cần tới công trình')],
    ['入退場管理', 'Site Entry', T('入退場と安全書類の管理', 'Entry, exit and safety records', 'Quản lý ra vào và hồ sơ an toàn')],
    ['3Dスキャン', '3D Scan', T('現場の3D計測データを共有', 'Share 3D scans of the site', 'Chia sẻ dữ liệu quét 3D hiện trường')],
  ]],
  ['calendar', 'DOCUMENTS', T('工程と書類', 'Schedules and documents', 'Tiến độ và hồ sơ'), [
    ['ボード', 'Board', T('工程表を関係者で共有', 'Shared site schedule', 'Bảng tiến độ dùng chung')],
    ['レポート', 'Report', T('今の帳票をそのまま電子化', 'Existing forms, digitised as they are', 'Số hoá biểu mẫu, giữ nguyên bố cục')],
    ['資料承認', 'Document Approval', T('書類の提出と承認', 'Submit and approve documents', 'Nộp và duyệt hồ sơ')],
    ['電子納品', 'e-Delivery', T('公共工事の電子納品', 'Electronic delivery for public works', 'Nộp hồ sơ điện tử công trình công')],
    ['BIM', 'BIM', T('BIMモデルをクラウドで閲覧', 'Cloud BIM viewer', 'Xem mô hình BIM trên đám mây')],
  ]],
  ['funnel', 'MONEY', T('営業とお金', 'Sales and back office', 'Kinh doanh và kế toán'), [
    ['引合粗利管理', 'Leads and Gross Profit', T('引合から粗利までを見える化', 'From lead to gross profit in one view', 'Theo dõi từ cơ hội bán tới lãi gộp')],
    ['受発注', 'Ordering', T('元請と協力会社の受発注を電子化', 'Paperless orders with subcontractors', 'Số hoá đặt hàng giữa tổng thầu và thầu phụ')],
    ['請求管理', 'Billing', T('建設業向けの請求管理', 'Billing built for construction', 'Quản lý hoá đơn cho ngành xây dựng')],
    ['歩掛管理', 'Labour Productivity', T('日報から工数と原価を集計', 'Hours and cost from daily reports', 'Tổng hợp công và chi phí từ báo cáo ngày')],
    ['早受取', 'Early Pay', T('売掛金を早く受け取る', 'Get paid for receivables early', 'Nhận tiền công nợ sớm')],
  ]],
  ['person-bust', 'OWNERS', T('施主と経営', 'Owners and management', 'Chủ nhà và quản trị'), [
    ['おうちノート', 'Ouchi Note', T('施主とのやり取りをアプリで', 'App for talking with homeowners', 'Trao đổi với chủ nhà qua app')],
    ['Analytics', 'Analytics', T('経営の数字をリアルタイムで可視化', 'Real-time business dashboard', 'Dashboard số liệu kinh doanh theo thời gian thực')],
    ['BM', 'Building Maintenance', T('建物と設備の維持管理', 'Building and facility maintenance', 'Bảo trì toà nhà và thiết bị')],
  ]],
  ['workflow-gears', 'CONNECT ／ AI', T('連携とAI', 'Integrations and AI', 'Kết nối và AI'), [
    ['API連携', 'API', T('自社システムとANDPADをつなぐ', 'Connect in-house systems to ANDPAD', 'Kết nối hệ thống nội bộ với ANDPAD')],
    ['アプリマーケット', 'App Market', T('他社サービスとの連携アプリ', 'Partner integrations marketplace', 'Chợ ứng dụng tích hợp của đối tác')],
    ['ナレッジAI', 'Knowledge AI', T('社内の知識から答えるAI', 'AI that answers from company know-how', 'AI trả lời từ kho tri thức công ty')],
    ['AI-BPO', 'AI-BPO', T('AIと専門スタッフが積算などを代行', 'AI plus experts handle work like estimating', 'AI cùng chuyên viên làm thay việc như dự toán')],
  ]],
];
const LEG = `<span class="ap-leg"><em class="ap-vi">VI</em>${L3('span', T('ベトナム語に対応（2025年6月）', 'Available in Vietnamese (June 2025)', 'Đã có bản tiếng Việt (6/2025)'))}</span>`;
function pageProducts() {
  let n = 0;
  const groups = GROUPS.map(([ic, en, name, items]) => `    <div class="ap-grp">
      <div class="ap-gh">${ico(ic, 22)}<span class="lbl">${en}</span>${L3('h3', name)}${en === 'SITE' ? LEG : ''}</div>
      <ul class="ap-pds">
${items.map(([nm, enm, d, vi]) => `        <li class="ap-pd" style="--i:${n++}"><b>ANDPAD ${nm}</b><i>${enm}</i>${L3('span', d)}${vi ? '<em class="ap-vi">VI</em>' : ''}</li>`).join('\n')}
      </ul>
    </div>`).join('\n');
  return `<section class="pg" data-chap="II" id="ap-products">
${head('01　<b>PRODUCTS</b>', T('現場から経営までを<br /><i>一つのクラウドで。</i>', 'From the site to management,<br /><i>in one cloud.</i>', 'Từ công trường tới quản trị,<br /><i>trên một nền tảng.</i>'),
    'Site ／ Documents ／ Money ／ Owners ／ AI',
    T('製品は20を超え、現場、書類、お金、施主、連携とAIの5つの分野に分かれます。',
      'More than 20 products in five areas: site work, documents, money, homeowners, and integrations with AI.',
      'Hơn 20 sản phẩm, chia thành 5 nhóm: hiện trường, hồ sơ, tài chính, chủ nhà, kết nối và AI.'))}
  <div class="ap-grps rv" style="--d:180ms">
${groups}
  </div>
${src([['https://andpad.jp/', 'andpad.jp'], ['https://appmarket.andpad.jp/', 'appmarket.andpad.jp'], ['https://andpad.co.jp/', 'andpad.co.jp'],
    ['https://vietnamnews.vn/media-outreach/1720265/andpad-launches-vietnamese-language-support-for-its-cloud-based-construction-project-management-service.html', 'Vietnam News 2025']])}
</section>`;
}

// ---------- Trang 02: hoạt động, event ----------
const TAGS = { co: T('会社', 'Company', 'Công ty'), ev: T('イベント', 'Event', 'Sự kiện'), ai: T('AI', 'AI', 'AI'), vn: T('ベトナム', 'Vietnam', 'Việt Nam') };
const EVENTS = [
  ['2012.09', 'co', T('株式会社オクトとして設立', 'Founded as Oct Inc.', 'Thành lập với tên Oct Inc.')],
  ['2016', 'co', T('施工管理サービスANDPADを開始', 'ANDPAD service launched', 'Ra mắt dịch vụ ANDPAD')],
  ['2019.12', 'ev', T('第1回 工務店支援EXPO（東京ビッグサイト）に出展', 'Booth at the 1st Builder Support EXPO, Tokyo Big Sight', 'Tham gia triển lãm Builder Support EXPO lần 1 (Tokyo Big Sight)')],
  ['2020.05', 'co', T('社名を株式会社アンドパッドに変更', 'Renamed ANDPAD Inc.', 'Đổi tên thành ANDPAD Inc.')],
  ['2022.09', 'co', T('Series Dで約122億円を調達（借入を含む）', 'Series D: about ¥12.2 billion, loans included', 'Gọi vốn Series D khoảng 12,2 tỷ yên (gồm vốn vay)')],
  ['2024.02', 'vn', T('JETROの事業として、ベトナムの建設現場で実証を開始', 'JETRO-backed pilot starts on Vietnamese construction sites', 'Bắt đầu thí điểm tại công trường Việt Nam trong chương trình của JETRO')],
  ['2025.06', 'vn', T('ベトナム語版を公開', 'Vietnamese version released', 'Ra mắt bản tiếng Việt')],
  ['2025.06', 'ev', T('ANDPAD AWARD 2025 授賞式', 'ANDPAD AWARD 2025 ceremony', 'Lễ trao giải ANDPAD AWARD 2025')],
  ['2025.10', 'vn', T('ベトナム実証の完了を発表。現場の作業時間は30〜50％減り、紙の記録が不要に', 'Pilot results: on-site work time down 30 to 50%, no more paper records', 'Công bố kết quả thí điểm: giờ làm tại hiện trường giảm 30 đến 50%, bỏ hồ sơ giấy')],
  ['2025.12', 'ai', T('建設に特化したAIプロジェクト「ANDPAD Stellarc」を開始', 'ANDPAD Stellarc, an AI project for construction, begins', 'Khởi động dự án AI chuyên ngành xây dựng ANDPAD Stellarc')],
  ['2026.04', 'vn', T('ハノイ事務所をTaisei Square Hanoiへ移転', 'Hanoi office moves to Taisei Square Hanoi', 'Dời văn phòng Hà Nội về Taisei Square Hanoi')],
  ['2026.04', 'co', T('ARRが100億円を突破', 'ARR passes ¥10 billion', 'ARR vượt 10 tỷ yên')],
  ['2026.05', 'ai', T('ANDPAD ナレッジAIと、図面の測定箇所を自動で拾うAIを公開', 'ANDPAD Knowledge AI, plus AI that finds measuring points on drawings', 'Ra mắt ANDPAD Knowledge AI và AI tự tìm điểm đo trên bản vẽ')],
  ['2026.06', 'ev', T('ANDPAD AWARD 2026。新部門「DX Project」を設置', 'ANDPAD AWARD 2026 adds a DX Project category', 'ANDPAD AWARD 2026 thêm hạng mục DX Project')],
  ['2026.08', 'co', T('東京ガス、ダイキン、カインズと資本業務提携', 'Capital and business tie-ups with Tokyo Gas, Daikin and Cainz', 'Hợp tác vốn và kinh doanh với Tokyo Gas, Daikin, Cainz')],
  ['2026.10', 'ev', T('「NextGen Tech 30 2026」に選出', 'Named to NextGen Tech 30 2026', 'Lọt danh sách NextGen Tech 30 2026')],
];
const ACTS = [
  ['milestone-report', 'ANDPAD AWARD', T('ANDPADでDXの成果を出した会社を毎年表彰しています。', 'Yearly awards for customers who got results with ANDPAD.', 'Giải thưởng hằng năm cho doanh nghiệp chuyển đổi số thành công với ANDPAD.')],
  ['team-group', 'ANDPAD ONE', T('建設業界の人と情報が集まるコミュニティとメディアです。', 'A community and media site for people in construction.', 'Cộng đồng và kênh tin tức cho người trong ngành xây dựng.')],
  ['interview', 'EXPO ／ SEMINAR', T('住宅と建設の展示会に出展し、利用者向けの説明会も開いています。', 'Booths at housing and construction shows, plus briefings for users.', 'Tham gia triển lãm nhà ở, xây dựng và mở buổi hướng dẫn cho người dùng.')],
  ['roadmap', 'NEXT', T('ベトナムの主要都市、その後は近隣国へ広げる計画です。', 'Plan: major Vietnamese cities first, then neighbouring countries.', 'Kế hoạch: mở rộng ra các thành phố lớn của Việt Nam, sau đó tới nước lân cận.')],
];
function pageNews() {
  return `<section class="pg" data-chap="III" id="ap-news">
${head('02　<b>ACTIVITIES ／ EVENTS</b>', T('資金調達、AI、<br /><i>そしてベトナムへ。</i>', 'Funding, AI,<br /><i>and Vietnam.</i>', 'Gọi vốn, AI<br /><i>và Việt Nam.</i>'),
    'Timeline ／ Award ／ AI ／ Vietnam',
    T('主な出来事を年ごとに並べました。2025年からはAIとベトナムの動きが増えています。',
      'Key moves by year. Since 2025 most news is about AI and Vietnam.',
      'Các mốc chính theo năm. Từ 2025, tin về AI và Việt Nam tăng rõ.'))}
  <ol class="ap-tl rv" style="--d:180ms">
${EVENTS.map(([d, t, x], i) => `    <li class="ap-ev" data-t="${t}" style="--i:${i}"><time>${d}</time><i aria-hidden="true"></i>${L3('em', TAGS[t])}${L3('span', x)}</li>`).join('\n')}
  </ol>
  <div class="ap-acts rv" style="--d:220ms">
${ACTS.map(([ic, t, x]) => `    <div class="card ap-act">${ico(ic, 34)}<div><span class="lbl">${t}</span>${L3('p', x)}</div></div>`).join('\n')}
  </div>
${src([['https://prtimes.jp/main/html/rd/p/000000198.000018154.html', 'PR TIMES（AWARD 2026）'], ['https://thebridge.jp/2022/09/andpad-series-d-round-funding/', 'THE BRIDGE 2022'],
    ['https://vietnamnews.vn/media-outreach/1726656/andpad-completes-the-vietnam-demonstration-project-under-jetro-s-japan-asean-asia-digital-transformation-promotion-program.html', 'JETRO pilot'],
    ['https://thebridge.jp/2026/05/andpad-launches-knowledge-ai-powered-by-stellarc', 'Knowledge AI'], ['https://sogyotecho.jp/news/20260820andpad/', 'Tie-ups 2026'],
    ['https://kyodonewsprwire.jp/release/202610238598', 'NextGen Tech 30'], ['https://andpad.co.jp/', 'andpad.co.jp']])}
</section>`;
}

// ---------- Trang 03: dự báo công việc của vị trí ----------
const STEPS = [
  ['interview', T('Salesとデモ', 'Demo with Sales', 'Demo cùng Sales'),
    T('顧客の現場に合わせてANDPADをデモし、導入の効果を説明します。', 'I demo ANDPAD on the client\'s own site cases and explain the benefits for their sites.', 'Tôi demo ANDPAD theo đúng tình huống công trình của khách và nói rõ hiệu quả.')],
  ['checklist', T('導入と研修', 'Onboarding and training', 'Triển khai và đào tạo'),
    T('案件、権限、黒板、検査表を設定し、現場監督と協力会社に研修をします。', 'I set up projects, permissions, photo boards and checklists, then train supervisors and subcontractors.', 'Tôi thiết lập dự án, phân quyền, bảng đen, checklist rồi đào tạo giám sát và thầu phụ.')],
  ['report-chart', T('定着の確認', 'Adoption check', 'Theo dõi mức dùng'),
    T('利用状況を数字で確認し、フォローアップ会議で課題を聞いて解決策を出します。', 'I track usage in numbers, hear problems in follow-up meetings and propose fixes.', 'Tôi theo dõi mức sử dụng bằng số liệu, họp follow-up để nghe khó khăn và đề xuất giải pháp.')],
  ['roadmap', T('活用の拡大', 'Expansion', 'Mở rộng'),
    T('成果を共有し、他の現場や受発注、Analyticsなどの製品へ広げます。', 'I share results and extend use to more sites and products such as Ordering or Analytics.', 'Tôi chia sẻ kết quả, mở rộng sang công trình khác và sản phẩm như Đặt hàng (受発注), Analytics.')],
];
const ROWS = [
  ['building-blocks', T('施工管理 ／ チャット', 'Construction Mgmt ／ Chat', 'Quản lý thi công ／ Chat'), T('案件のひな形と権限を設定し、現場監督と職人に使い方を研修。日本語とベトナム語の操作マニュアルも作ります。',
    'Set up project templates and permissions, train supervisors and trades, and write user guides in Japanese and Vietnamese.',
    'Thiết lập mẫu dự án, phân quyền; đào tạo giám sát và thợ; viết tài liệu hướng dẫn bằng tiếng Nhật và tiếng Việt.')],
  ['checklist', T('図面 ／ 黒板 ／ 検査', 'Drawings ／ Blackboard ／ Inspection', 'Bản vẽ ／ Bảng đen ／ Kiểm tra'), T('顧客の基準に合わせて黒板と検査表のテンプレートを作り、図面への記録を現場で一緒に練習します。',
    'Build photo-board and inspection templates to the client\'s standards, and practise recording on drawings together on site.',
    'Tạo mẫu bảng đen và checklist kiểm tra theo tiêu chuẩn của khách; cùng tập ghi nhận trên bản vẽ tại công trình.')],
  ['funnel', T('受発注 ／ 請求管理 ／ 引合粗利管理', 'Ordering ／ Billing ／ Leads and Profit', 'Đặt hàng ／ Hoá đơn ／ Cơ hội và lãi gộp'), T('今の業務（AsIs）を聞き取り、あるべき流れ（ToBe）を設計して、マスタデータの移行を管理します。',
    'Map the current flow (AsIs), design the target flow (ToBe) and manage the master-data migration.',
    'Khảo sát quy trình hiện tại (AsIs), thiết kế quy trình mới (ToBe), quản lý việc chuyển dữ liệu master.')],
  ['report-chart', T('Analytics ／ レポート', 'Analytics ／ Report', 'Analytics ／ Báo cáo'), T('利用状況と現場の数字を定例レポートにまとめ、改善を提案します。',
    'Turn usage and site numbers into a regular report and suggest improvements.',
    'Tổng hợp mức sử dụng và số liệu công trình thành báo cáo định kỳ, đề xuất cải tiến.')],
  ['workflow-gears', T('API連携 ／ アプリマーケット', 'API ／ App Market', 'API ／ Chợ ứng dụng'), T('基幹システムとの連携の要望を整理し、ソリューションエンジニアやベトナムの開発チームにつなぎます。',
    'Collect integration needs with core systems and pass them to solution engineers and the Vietnam dev team.',
    'Tổng hợp nhu cầu kết nối với hệ thống lõi, chuyển cho Solution Engineer và đội phát triển tại Việt Nam.')],
  ['lightbulb', T('ナレッジAI ／ AI-BPO', 'Knowledge AI ／ AI-BPO', 'Knowledge AI ／ AI-BPO'), T('新しいAI機能をデモし、顧客の声を製品チームに届けます。',
    'Demo new AI features and bring client feedback to the product team.',
    'Demo tính năng AI mới, gom phản hồi của khách gửi đội sản phẩm.')],
  ['briefcase', T('説明会 ／ 出張', 'Briefings ／ Site visits', 'Hướng dẫn ／ Công tác'), T('顧客の現場や事務所に出向き、利用説明会やセミナーを開きます。',
    'Visit client sites and offices to run user briefings and seminars.',
    'Đi công tác tới công trình, văn phòng khách để tổ chức buổi hướng dẫn và hội thảo.')],
];
function pageRole() {
  const nm = (x) => (typeof x === 'string' ? `<b>${x}</b>` : L3('b', x));
  return `<section class="pg" data-chap="IV" id="ap-role">
${head('03　<b>FORECAST</b>', T('このポジションで<br /><i>担うと予想する仕事。</i>', 'What I expect<br /><i>this role to do.</i>', 'Dự báo công việc<br /><i>của vị trí này.</i>'),
    'Customer Success ／ Onboarding ／ Product by product',
    T('求人票（Customer Success Staff、IT）と公開情報をもとにした予想です。顧客はANDPADを使う日系の建設会社と、そのベトナム法人が中心になると考えます。',
      'This is my forecast from the job description (Customer Success Staff, IT) and public information. I expect most clients to be Japanese construction companies using ANDPAD and their Vietnamese subsidiaries.',
      'Đây là dự báo của tôi dựa trên JD (Customer Success Staff, IT) và thông tin công khai. Tôi cho rằng khách hàng chính là các công ty xây dựng Nhật dùng ANDPAD và công ty con của họ tại Việt Nam.'))}
  <ol class="ap-jr rv" style="--d:180ms">
${STEPS.map(([ic, h, p], i) => `    <li class="ap-js" style="--i:${i}">${ico(ic, 34)}<span class="ap-n" aria-hidden="true">0${i + 1}</span>${L3('h3', h)}${L3('p', p)}</li>`).join('\n')}
  </ol>
  <div class="card ap-rws rv" style="--d:200ms">
    <span class="lbl">PRODUCT × TASK</span>
    ${L3('h3', T('製品ごとに予想する仕事', 'Expected tasks, product by product', 'Dự báo việc cần làm theo từng sản phẩm'))}
    <ul>
${ROWS.map(([ic, p, t], i) => `      <li class="ap-rw" style="--i:${i}">${ico(ic, 28)}<div class="ap-rp">${nm(p)}</div>${L3('span', t)}</li>`).join('\n')}
    </ul>
  </div>
  <p class="ap-go rv" style="--d:240ms"><a href="#jd-match">${L3('span', T('私のスキルとの照合は「スキルの照合」ページへ →', 'How my skills match: see the Skill match page →', 'Kỹ năng của tôi khớp thế nào: xem trang Đối chiếu kỹ năng →'))}</a></p>
${src([['https://careers.andpad.vn/jobs/8693932-customer-success-staff-hcm-it-n2-eng-leader-candidate', 'careers.andpad.vn（Customer Success Staff）'],
    ['https://hrmos.co/pages/andpad/jobs/biz0000411', 'ANDPAD Customer Success（Japan）'], ['https://andpad.jp/', 'andpad.jp']])}
</section>`;
}

const main = `<!-- ap:start -->
<!-- ═══════ Andpad Info (task m07v: công ty, sản phẩm, hoạt động, dự báo công việc; sinh bằng node tools/ap/build.mjs) ═══════ -->
<main class="wrap" data-view="ap" hidden>
${pageTop()}
${pageProducts()}
${pageNews()}
${pageRole()}
</main>
<!-- ap:end -->`;

let html = readFileSync(FILE, 'utf8');
const eol = html.includes('\r\n') ? '\r\n' : '\n';
const block = main.replace(/\n/g, eol);
if (/<!-- ap:start -->[\s\S]*?<!-- ap:end -->/.test(html)) html = html.replace(/<!-- ap:start -->[\s\S]*?<!-- ap:end -->/, () => block);
else {
  const at = html.indexOf('<!-- jd:end -->');
  if (at < 0) throw new Error('không thấy <!-- jd:end -->');
  const end = at + '<!-- jd:end -->'.length;
  html = html.slice(0, end) + eol + block + html.slice(end);
}
writeFileSync(FILE, html);
console.log('OK tools/ap/build.mjs: đã ghi tab Andpad Info (4 trang) vào index.html');
