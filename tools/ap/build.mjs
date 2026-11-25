// Task m07v: sinh tab "Andpad Info" (main data-view="ap", 4 trang) vào index.html, giữa khối jd:end và main sw.
// Chạy lại được (idempotent): thay nội dung giữa <!-- ap:start --> và <!-- ap:end -->; lần đầu chèn ngay sau <!-- jd:end -->.
// Số liệu công ty, sản phẩm, mốc thời gian lấy từ nguồn công khai, tra cứu 25/11/2026 (link ghi trên từng trang).
// Trang #ap-role là DỰ BÁO của ứng viên (ghi rõ trên trang), dựa trên JD + tin tuyển dụng công khai.
// Menu trên, sidebar, CSS (khối ap-css) và mảng IDS của pganh sửa tay trong index.html (không do script này).
// Chạy (từ thư mục repo): node tools/ap/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pageShots, SHOTS } from './shots.mjs'; // task ls8q: trang #ap-shots (ảnh sản phẩm chính thức)
import { pageMarket } from './market.mjs'; // task m07v bổ sung: trang #ap-market (ngành, thị trường, case, hỗ trợ)
import { pageVn } from './vn.mjs'; // task 04fj: trang #ap-vn (sản phẩm và dịch vụ ANDPAD tại Việt Nam, ảnh chính thức)
import { pageRole } from './role.mjs'; // task 97rs: trang #ap-role (dự báo việc, chỉ sản phẩm và dịch vụ tại Việt Nam)
import { book } from './refs.mjs'; // task 4n9v: nguồn tham khảo cuối trang + số trích dẫn

const FILE = fileURLToPath(new URL('../../index.html', import.meta.url));
const L3 = (tag, o, attrs = '') => ['ja', 'en', 'vi'].map((l) => `<${tag}${attrs} data-l="${l}">${o[l]}</${tag}>`).join('');
const T = (ja, en, vi) => ({ ja, en, vi });
const ico = (f, s = 34) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
// cite = số trích dẫn (task 4n9v) gắn cuối câu dẫn
const head = (eb, h2, en, sub, cite = '') => [
  `  <span class="eb rv">${eb}</span>`,
  `  <h2 class="kw ap-kw rv" style="--d:60ms">${L3('span', h2)}</h2>`,
  `  <span class="kw-en rv" style="--d:100ms">${en}</span>`,
  `  <div class="kwbar rv" style="--d:120ms"><span></span></div>`,
  ...['ja', 'en', 'vi'].map((l) => `  <p class="kw-sub ap-sub rv" style="--d:140ms" data-l="${l}">${sub[l]}${cite}</p>`),
].join('\n');
// Task 4n9v: mỗi trang có bộ trích dẫn riêng (số [n] sau mỗi thông tin) và mục "Nguồn tham khảo" cuối trang (tools/ap/refs.mjs)
const bk = (page) => book(page, L3);

// ---------- Trang TOP: tổng quan công ty ----------
// [icon, nhãn, giá trị, nguồn (khoá trong tools/ap/refs.mjs)]
const FACTS = [
  ['office-building', T('設立', 'Founded', 'Thành lập'), T('2012年9月', 'September 2012', 'Tháng 9/2012'), ['profile']],
  ['manager', T('代表取締役CEO', 'CEO', 'CEO'), T('稲田 武夫（Takeo Inada）', 'Takeo Inada', 'Takeo Inada (稲田 武夫)'), ['company']],
  ['key', T('本社', 'Head office', 'Trụ sở'), T('東京都港区三田', 'Mita, Minato-ku, Tokyo', 'Mita, Minato-ku, Tokyo'), ['company']],
  ['team-group', T('社員数', 'Employees', 'Nhân viên'), T('1,072名（2026年11月1日）', '1,072 (1 Nov 2026)', '1.072 người (1/11/2026)'), ['company']],
  ['building-blocks', T('利用', 'In use at', 'Đang dùng'), T('27.9万社、81.8万人', '279,000 companies, 818,000 users', '279.000 công ty, 818.000 người dùng'), ['top']],
  // task 4n9v: đối chiếu nguồn, ARR vượt 100 億円 là năm 2025 (trước ghi nhầm 2026)
  ['report-chart', T('ARR', 'ARR', 'ARR'), T('100億円を突破（2025年）', 'Passed ¥10 billion (2025)', 'Vượt 10 tỷ yên (2025)'), ['arr', 'hot100']],
];
const VN_REF = [['vnHanoiPr', 'newsHanoi'], ['vnCareers'], ['vnCareers', 'jdVn'], ['newsEn', 'newsVi']]; // nguồn từng dòng của VN (cùng thứ tự)
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
  const b = bk('ap-top');
  return `<section class="pg" data-chap="I" id="ap-top">
${head('COMPANY　<b>ANDPAD</b>', T('建設業界のための<br /><i>クラウド施工管理。</i>', 'Cloud project management<br /><i>for construction.</i>', 'Quản lý thi công trên đám mây<br /><i>cho ngành xây dựng.</i>'),
    'Vertical SaaS ／ Construction DX ／ Japan and Vietnam',
    T('株式会社アンドパッドは建設業界向けのVertical SaaS企業です。現場の写真、図面、工程、受発注までを一つのクラウドで管理できます。',
      'ANDPAD Inc. is a vertical SaaS company for construction. Its cloud keeps site photos, drawings, schedules and orders in one place.',
      'ANDPAD Inc. là công ty Vertical SaaS cho ngành xây dựng Nhật Bản. Nền tảng gom ảnh hiện trường, bản vẽ, tiến độ và đơn đặt hàng vào một chỗ trên đám mây.'), b.c('top'))}
  <ul class="ap-kv rv" style="--d:180ms">
${FACTS.map(([ic, k, v, r], i) => `    <li style="--i:${i}">${ico(ic, 36)}<div>${L3('span', k, ' class="ap-k"')}${L3('b', b.t(v, ...r))}</div></li>`).join('\n')}
  </ul>
  <div class="card ap-ms rv" style="--d:200ms">
    <span class="lbl">MISSION ／ VALUES</span>
    <h3>「幸せを築く人を、幸せに。」${b.c('mission')}</h3>
    ${L3('p', b.t(T('家を建てる人、街をつくる人の働き方を、テクノロジーで良くすることを目指しています。',
      'Make the people who build happiness, happy: better working lives for everyone who builds homes and towns.',
      'Mang hạnh phúc đến những người kiến tạo hạnh phúc: cải thiện cách làm việc của người xây nhà, xây phố bằng công nghệ.'), 'mission'))}
    <div class="chips"><span class="chip">Professional</span><span class="chip">Mission Driven</span><span class="chip">Reality</span><span class="chip">Customer Success</span><span class="chip">Technology First</span><span class="chip">Love ANDPAD</span>${b.c('mission')}</div>
  </div>
  <div class="card ap-vn rv" style="--d:220ms">
    <span class="lbl">ANDPAD VIETNAM</span>
    ${L3('h3', T('ANDPAD Vietnam（ホーチミン、ハノイ）', 'ANDPAD Vietnam (Ho Chi Minh City and Hanoi)', 'ANDPAD Vietnam (TP.HCM và Hà Nội)'))}
    <ul>
${VN.map(([ic, t], i) => `      <li>${ico(ic, 30)}${L3('span', b.t(t, ...VN_REF[i]))}</li>`).join('\n')}
    </ul>
  </div>
${b.list()}
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
    ['電子納品', 'e-Delivery', T('写真を整理して電子納品データを作成', 'Sort photos into e-delivery data', 'Sắp xếp ảnh thành dữ liệu nộp hồ sơ điện tử')], // task 4n9v: trang sản phẩm không ghi 'công trình công'
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
const LEG = (t) => `<span class="ap-leg"><em class="ap-vi">VI</em>${L3('span', t(T('ベトナム語に対応（2025年6月）', 'Available in Vietnamese (June 2025)', 'Đã có bản tiếng Việt (6/2025)')))}</span>`;
// task 4n9v: nguồn của từng sản phẩm = trang sản phẩm chính thức (khoá p_<key> trong refs.mjs); không có trang sản phẩm thì dùng thông cáo
const PREF = Object.fromEntries(SHOTS.map(([k, ja]) => [ja, k === 'app_market' ? 'appmarket' : `p_${k}`]));
Object.assign(PREF, { '早受取': 'earlypay', 'ナレッジAI': 'knowledgeAi', 'AI-BPO': 'aiBpo' });
function pageProducts() {
  const b = bk('ap-products');
  const subC = b.c('top'); // đánh số theo thứ tự hiện trên trang: câu dẫn trước
  let n = 0;
  const groups = GROUPS.map(([ic, en, name, items]) => `    <div class="ap-grp">
      <div class="ap-gh">${ico(ic, 22)}<span class="lbl">${en}</span>${L3('h3', name)}${en === 'SITE' ? LEG((o) => b.t(o, 'newsVi')) : ''}</div>
      <ul class="ap-pds">
${items.map(([nm, enm, d, vi]) => `        <li class="ap-pd" style="--i:${n++}"><b>ANDPAD ${nm}</b><i>${enm}</i>${L3('span', b.t(d, PREF[nm]))}${vi ? '<em class="ap-vi">VI</em>' : ''}</li>`).join('\n')}
      </ul>
    </div>`).join('\n');
  return `<section class="pg" data-chap="II" id="ap-products">
${head('01　<b>PRODUCTS</b>', T('現場から経営までを<br /><i>一つのクラウドで。</i>', 'From the site to management,<br /><i>in one cloud.</i>', 'Từ công trường tới quản trị,<br /><i>trên một nền tảng.</i>'),
    'Site ／ Documents ／ Money ／ Owners ／ AI',
    T('製品は20を超え、現場、書類、お金、施主、連携とAIの5つの分野に分かれます。',
      'More than 20 products in five areas: site work, documents, money, homeowners, and integrations with AI.',
      'Hơn 20 sản phẩm, chia thành 5 nhóm: hiện trường, hồ sơ, tài chính, chủ nhà, kết nối và AI.'), subC)}
  <div class="ap-grps rv" style="--d:180ms">
${groups}
  </div>
${b.list()}
</section>`;
}

// ---------- Trang 02: hoạt động, event ----------
const TAGS = { co: T('会社', 'Company', 'Công ty'), ev: T('イベント', 'Event', 'Sự kiện'), ai: T('AI', 'AI', 'AI'), vn: T('ベトナム', 'Vietnam', 'Việt Nam') };
// [mốc, loại, nội dung, nguồn (khoá refs.mjs)]. Task 4n9v: đối chiếu từng mốc với nguồn 25/11/2026 và sửa mốc lệch
// (bỏ tên "Oct" lúc thành lập vì chưa có nguồn; ARR là 2025; AWARD 2025 là công bố 3/2025; NextGen Tech 30 công bố 9/2026;
// dự án MLIT là AI số hoá 建築計画概要書, không phải ANDPAD BM).
const EVENTS = [
  ['2012.09', 'co', T('会社を設立', 'Company founded', 'Thành lập công ty'), ['prBm']],
  ['2016', 'co', T('施工管理サービスANDPADを開始', 'ANDPAD service launched', 'Ra mắt dịch vụ ANDPAD'), ['prBm']],
  ['2019.12', 'ev', T('第1回 工務店支援EXPO（東京ビッグサイト）に出展', 'Booth at the 1st Builder Support EXPO, Tokyo Big Sight', 'Tham gia triển lãm Builder Support EXPO lần 1 (Tokyo Big Sight)'), ['mynavi']],
  ['2020.05', 'co', T('社名を株式会社アンドパッドに変更', 'Renamed ANDPAD Inc.', 'Đổi tên thành ANDPAD Inc.'), ['registry']],
  ['2024.02', 'co', T('Comvex社（Digima）を完全子会社化', 'Acquired Comvex (Digima)', 'Mua lại toàn bộ Comvex (Digima)'), ['comvex']],
  ['2022.09', 'co', T('Series Dで約122億円を調達（借入を含む）', 'Series D: about ¥12.2 billion, loans included', 'Gọi vốn Series D khoảng 12,2 tỷ yên (gồm vốn vay)'), ['seriesD']],
  ['2024.02', 'vn', T('JETROの事業として、ベトナムの建設現場で実証を開始', 'JETRO-backed pilot starts on Vietnamese construction sites', 'Bắt đầu thí điểm tại công trường Việt Nam trong chương trình của JETRO'), ['vnPilotPr']],
  ['2025.06', 'vn', T('ベトナム語版を公開', 'Vietnamese version released', 'Ra mắt bản tiếng Việt'), ['newsVi']],
  ['2025.03', 'ev', T('ANDPAD AWARD 2025 DXカンパニー部門を発表（授賞式は6月13日予定）', 'ANDPAD AWARD 2025 DX Company honourees announced (ceremony set for 13 June)', 'Công bố hạng mục DX Company của ANDPAD AWARD 2025 (lễ trao giải dự kiến 13/6)'), ['award25']],
  ['2025.10', 'vn', T('ベトナム実証の完了を発表。現場の作業時間は30〜50％減り、紙の記録が不要に', 'Pilot results: on-site work time down 30 to 50%, no more paper records', 'Công bố kết quả thí điểm: giờ làm tại hiện trường giảm 30 đến 50%, bỏ hồ sơ giấy'), ['vnPilotPr']],
  ['2025.12', 'ai', T('建設に特化したAIプロジェクト「ANDPAD Stellarc」を開始', 'ANDPAD Stellarc, an AI project for construction, begins', 'Khởi động dự án AI chuyên ngành xây dựng ANDPAD Stellarc'), ['hot100']],
  ['2026.04', 'vn', T('ハノイ事務所をTaisei Square Hanoiへ移転', 'Hanoi office moves to Taisei Square Hanoi', 'Dời văn phòng Hà Nội về Taisei Square Hanoi'), ['newsHanoi']],
  ['2025.12', 'co', T('インドネシア語、タイ語、繁体字中国語、スペイン語に対応', 'Adds Indonesian, Thai, Traditional Chinese and Spanish', 'Thêm tiếng Indonesia, Thái, Hoa phồn thể, Tây Ban Nha'), ['newsLang6']],
  ['2025', 'co', T('ARRが100億円を突破', 'ARR passes ¥10 billion', 'ARR vượt 10 tỷ yên'), ['arr']],
  ['2026.05', 'ai', T('ANDPAD ナレッジAIと、図面の測定箇所を自動で拾うAIを公開', 'ANDPAD Knowledge AI, plus AI that finds measuring points on drawings', 'Ra mắt ANDPAD Knowledge AI và AI tự tìm điểm đo trên bản vẽ'), ['profile', 'drawAi']],
  ['2026.06', 'ev', T('ANDPAD AWARD 2026。新部門「DX Project」を設置', 'ANDPAD AWARD 2026 adds a DX Project category', 'ANDPAD AWARD 2026 thêm hạng mục DX Project'), ['award26']],
  ['2026.08', 'co', T('東京ガス、ダイキン、カインズと資本業務提携', 'Capital and business tie-ups with Tokyo Gas, Daikin and Cainz', 'Hợp tác vốn và kinh doanh với Tokyo Gas, Daikin, Cainz'), ['tieups']],
  ['2026.05', 'co', T('設備と建物の維持管理「ANDPAD BM」を公開。国交省の建築行政DX事業に採択', 'Launched ANDPAD BM; selected for an MLIT building-admin DX project', 'Ra mắt ANDPAD BM; được Bộ MLIT chọn vào dự án DX hành chính xây dựng'), ['prBm', 'mlit']],
  ['2026.09', 'co', T('ANDPAD レポートを公開、AWARD 2027の募集を開始', 'ANDPAD Report launched; AWARD 2027 entries open', 'Ra mắt ANDPAD Report; mở nhận hồ sơ AWARD 2027'), ['prReport', 'award27']],
  ['2026.10', 'ai', T('ANDPAD AI-BPOを開始（電気工事の積算から）', 'ANDPAD AI-BPO starts, first with estimating for electrical work', 'Ra mắt ANDPAD AI-BPO, bắt đầu với dự toán cho thầu điện'), ['prAiBpo']],
  ['2026.09', 'ev', T('「NextGen Tech 30 2026」に選出', 'Named to NextGen Tech 30 2026', 'Lọt danh sách NextGen Tech 30 2026'), ['nextgen']],
];
EVENTS.sort((a, b) => a[0].localeCompare(b[0])); // task m07v bổ sung: mốc mới chen giữa, luôn hiện theo thời gian
const ACTS = [
  ['milestone-report', 'ANDPAD AWARD', T('ANDPADでDXの成果を出した会社を毎年表彰しています。', 'Yearly awards for customers who got results with ANDPAD.', 'Giải thưởng hằng năm cho doanh nghiệp chuyển đổi số thành công với ANDPAD.'), ['award25', 'awardSite']],
  ['team-group', 'ANDPAD ONE', T('ユーザーの活用事例とノウハウが集まるコミュニティサイトです。', 'A community site of user cases and know-how.', 'Trang cộng đồng chia sẻ case và kinh nghiệm dùng ANDPAD.'), ['one']],
  ['interview', 'EXPO ／ SEMINAR', T('住宅と建設の展示会に出展し、利用者向けのセミナーも配信しています。', 'Booths at housing and construction shows, plus webinars for users.', 'Tham gia triển lãm nhà ở, xây dựng và phát hội thảo trực tuyến cho người dùng.'), ['mynavi', 'asb']],
  ['roadmap', 'NEXT', T('ベトナムの主要都市、その後は近隣国へ広げる計画です。', 'Plan: major Vietnamese cities first, then neighbouring countries.', 'Kế hoạch: mở rộng ra các thành phố lớn của Việt Nam, sau đó tới nước lân cận.'), ['vnPilotPr']],
];
function pageNews() {
  const b = bk('ap-news');
  const subC = b.c('newsLang6', 'hot100'); // câu dẫn: tin AI và Việt Nam tăng từ 2025
  const tl = EVENTS.map(([d, t, x, r], i) => `    <li class="ap-ev" data-t="${t}" style="--i:${i}"><time>${d}</time><i aria-hidden="true"></i>${L3('em', TAGS[t])}${L3('span', b.t(x, ...r))}</li>`).join('\n');
  const acts = ACTS.map(([ic, t, x, r]) => `    <div class="card ap-act">${ico(ic, 34)}<div><span class="lbl">${t}</span>${L3('p', b.t(x, ...r))}</div></div>`).join('\n');
  return `<section class="pg" data-chap="III" id="ap-news">
${head('02　<b>ACTIVITIES ／ EVENTS</b>', T('資金調達、AI、<br /><i>そしてベトナムへ。</i>', 'Funding, AI,<br /><i>and Vietnam.</i>', 'Gọi vốn, AI<br /><i>và Việt Nam.</i>'),
    'Timeline ／ Award ／ AI ／ Vietnam',
    T('主な出来事を年ごとに並べました。2025年からはAIとベトナムの動きが増えています。',
      'Key moves by year. Since 2025 most news is about AI and Vietnam.',
      'Các mốc chính theo năm. Từ 2025, tin về AI và Việt Nam tăng rõ.'), subC)}
  <ol class="ap-tl rv" style="--d:180ms">
${tl}
  </ol>
  <div class="ap-acts rv" style="--d:220ms">
${acts}
  </div>
${b.list()}
</section>`;
}

const main = `<!-- ap:start -->
<!-- ═══════ Andpad Info: công ty, sản phẩm, hoạt động, dự báo công việc; sinh bằng node tools/ap/build.mjs ═══════ -->
<main class="wrap" data-view="ap" hidden>
${pageTop()}
${pageProducts()}
${pageShots({ L3, T, head, b: bk('ap-shots') })}
${pageVn({ L3, T, head, b: bk('ap-vn') })}
${pageNews()}
${pageMarket({ L3, T, head, b: bk('ap-market') })}
${pageRole({ L3, head, b: bk('ap-role') })}
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
console.log('OK tools/ap/build.mjs: đã ghi tab Andpad Info (7 trang) vào index.html');
