// Task 97rs: trang 04 FORECAST (#ap-role) của tab Andpad Info, tách khỏi build.mjs. Chỉ dự báo việc cho các sản phẩm
// và dịch vụ ANDPAD đang có tại Việt Nam (cùng dữ liệu với trang #ap-vn, tools/ap/vn.mjs); mọi bước, mọi dòng gắn số nguồn
// từ tools/ap/refs.mjs (task 4n9v). Sản phẩm chưa có tại Việt Nam (受発注, 請求, Analytics, API, AI...) không đưa vào.
const ico = (f, s = 34) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
const T = (ja, en, vi) => ({ ja, en, vi });

// [icon, tiêu đề, mô tả, [khoá nguồn]]
const STEPS = [
  ['interview', T('Salesとデモ', 'Demo with Sales', 'Demo cùng Sales'),
    T('ベトナム語版のANDPADを顧客の現場に合わせてデモし、ベトナムでの実証結果（作業時間最大50％減）で効果を説明します。',
      'I demo the Vietnamese ANDPAD on the client\'s own site cases and show the benefit with the Vietnam pilot result (up to 50% less work time).',
      'Tôi demo ANDPAD bản tiếng Việt theo tình huống công trình của khách, dùng kết quả thí điểm tại Việt Nam (giảm tới 50% giờ làm) để nói rõ hiệu quả.'),
    ['jdVn', 'newsPilot']],
  ['checklist', T('導入と研修', 'Onboarding and training', 'Triển khai và đào tạo'),
    T('案件、権限、電子黒板、ベトナム式の帳票を設定し、現場監督と職人にベトナム語で研修をします。',
      'I set up projects, permissions, the digital signboard and Vietnamese form layouts, then train supervisors and workers in Vietnamese.',
      'Tôi thiết lập dự án, phân quyền, bảng đen điện tử, mẫu biểu kiểu Việt Nam rồi đào tạo giám sát và thợ bằng tiếng Việt.'),
    ['jdVn', 'newsPilot', 'newsVi']],
  ['report-chart', T('定着の確認', 'Adoption check', 'Theo dõi mức dùng'),
    T('利用状況を数字で確認し、フォローアップ会議で課題を聞いて解決策を出します。',
      'I track usage in numbers, hear problems in follow-up meetings and propose fixes.',
      'Tôi theo dõi mức sử dụng bằng số liệu, họp follow-up để nghe khó khăn và đề xuất giải pháp.'),
    ['jdVn']],
  ['roadmap', T('活用の拡大', 'Expansion', 'Mở rộng'),
    T('成果を共有し、ベトナムの他の現場へ広げ、日本人や外国籍のスタッフには英語版も案内します。',
      'I share results, extend use to the client\'s other sites in Vietnam, and offer the English version to Japanese and other foreign staff.',
      'Tôi chia sẻ kết quả, mở rộng sang công trình khác của khách tại Việt Nam, hướng dẫn thêm bản tiếng Anh cho nhân sự người Nhật và người nước ngoài.'),
    ['jdJp', 'newsEn', 'newsEnWeb']],
];
// [icon, sản phẩm / dịch vụ tại Việt Nam, việc dự báo, [khoá nguồn]]
const ROWS = [
  ['building-blocks', T('施工管理 ／ チャット（ベトナム語、英語）', 'Construction Mgmt ／ Chat (Vietnamese, English)', 'Quản lý thi công ／ Chat (tiếng Việt, tiếng Anh)'),
    T('案件のひな形と権限を設定し、現場監督と職人に使い方を研修。ベトナム語と日本語の操作マニュアルも作ります。',
      'Set up project templates and permissions, train supervisors and workers, and write user guides in Vietnamese and Japanese.',
      'Thiết lập mẫu dự án, phân quyền; đào tạo giám sát và thợ; viết tài liệu hướng dẫn bằng tiếng Việt và tiếng Nhật.'),
    ['newsVi', 'vnViPr', 'jdVn']],
  ['report-chart', T('図面（ベトナム語、英語）', 'Drawings (Vietnamese, English)', 'Bản vẽ (tiếng Việt, tiếng Anh)'),
    T('図面への記録と共有を、現場で一緒に練習します。',
      'Practise recording and sharing on drawings together on site.',
      'Cùng tập ghi nhận và chia sẻ trên bản vẽ ngay tại công trình.'),
    ['newsVi', 'newsEn']],
  ['checklist', T('写真管理 ／ 電子黒板 ／ 帳票出力', 'Photos ／ Digital signboard ／ Form output', 'Quản lý ảnh ／ Bảng đen điện tử ／ Xuất biểu mẫu'),
    T('ベトナムでの実証で使われた機能です。顧客の基準に合わせて黒板とベトナム式の帳票を作り、紙の記録から切り替えます。',
      'The features used in the Vietnam pilot. Build signboards and Vietnamese form layouts to the client\'s standards and move them off paper records.',
      'Các tính năng đã dùng trong thí điểm tại Việt Nam. Tạo bảng đen và mẫu biểu kiểu Việt Nam theo tiêu chuẩn của khách, chuyển khách khỏi ghi chép giấy.'),
    ['newsPilot', 'vnPilotPr']],
  ['workflow-gears', T('ブラウザ版（英語、タイムゾーン）', 'Web version (English, time zone)', 'Bản web (tiếng Anh, múi giờ)'),
    T('ベトナム時間で工程を管理できるよう設定し、事務所のスタッフにPCでの使い方を案内します。',
      'Set schedules to Vietnam time and show office staff how to use it on PC.',
      'Cài để quản lý tiến độ theo giờ Việt Nam, hướng dẫn nhân viên văn phòng dùng trên máy tính.'),
    ['newsEnWeb']],
  ['handshake', T('導入とサポート（ベトナム国内）', 'Onboarding and support (in Vietnam)', 'Triển khai và hỗ trợ (tại Việt Nam)'),
    T('導入から定着まで、ベトナム語、日本語、英語で顧客を支援し、フォローアップ会議を続けます。',
      'Support clients from onboarding to steady use in Vietnamese, Japanese and English, with regular follow-up meetings.',
      'Hỗ trợ khách từ lúc triển khai tới khi dùng ổn định bằng tiếng Việt, tiếng Nhật, tiếng Anh; họp follow-up định kỳ.'),
    ['newsPilot', 'jdVn']],
  ['lightbulb', T('開発拠点（ホーチミン）', 'Development centre (Ho Chi Minh City)', 'Đội phát triển (TP.HCM)'),
    T('ベトナムの顧客の要望と現場の声をまとめ、ホーチミンの開発チームに届けます。',
      'Collect requests and site feedback from clients in Vietnam and bring them to the HCMC engineering teams.',
      'Gom yêu cầu và phản hồi từ công trình của khách tại Việt Nam, chuyển cho các đội kỹ sư tại TP.HCM.'),
    ['vnCareersTop']],
  ['briefcase', T('ハノイ事務所 ／ 出張', 'Hanoi office ／ Site visits', 'Văn phòng Hà Nội ／ Công tác'),
    T('北部と南部の顧客の現場や事務所に出向き、利用説明会やセミナーを開きます。',
      'Visit client sites and offices in the north and south to run user briefings and seminars.',
      'Đi công tác tới công trình, văn phòng khách ở miền Bắc và miền Nam để tổ chức buổi hướng dẫn và hội thảo.'),
    ['newsHanoi', 'vnHanoiPr', 'jdVn']],
];

// b = bộ trích dẫn của trang (tools/ap/refs.mjs)
export function pageRole({ L3, head, b }) {
  const subC = b.c('jdVn', 'newsVi', 'newsPilot');
  const steps = STEPS.map(([ic, h, p, r], i) => `    <li class="ap-js" style="--i:${i}">${ico(ic)}<span class="ap-n" aria-hidden="true">0${i + 1}</span>${L3('h3', h)}${L3('p', b.t(p, ...r))}</li>`).join('\n');
  const rows = ROWS.map(([ic, p, t, r], i) => `      <li class="ap-rw" style="--i:${i}">${ico(ic, 28)}<div class="ap-rp">${L3('b', p)}</div>${L3('span', b.t(t, ...r))}</li>`).join('\n');
  return `<section class="pg" data-chap="V" id="ap-role">
${head('04　<b>FORECAST</b>', T('このポジションで<br /><i>担うと予想する仕事。</i>', 'What I expect<br /><i>this role to do.</i>', 'Dự báo công việc<br /><i>của vị trí này.</i>'),
    'Customer Success ／ Vietnam ／ Products and services',
    T('求人票（Customer Success Staff、IT）と公開情報をもとにした予想。対象はベトナムで提供中の製品とサービスのみ。顧客の中心はベトナムに現場を持つ日系の建設会社と想定。',
      'This is my forecast from the job description (Customer Success Staff, IT) and public information, covering only the products and services ANDPAD offers in Vietnam. I expect most clients to be Japanese construction companies with sites in Vietnam.',
      'Đây là dự báo của tôi dựa trên JD (Customer Success Staff, IT) và thông tin công khai, chỉ tính các sản phẩm và dịch vụ ANDPAD đang có tại Việt Nam. Tôi cho rằng khách hàng chính là các công ty xây dựng Nhật có công trình tại Việt Nam.'), subC)}
  <ol class="ap-jr rv" style="--d:180ms">
${steps}
  </ol>
  <div class="card ap-rws rv" style="--d:200ms">
    <span class="lbl">VIETNAM × TASK</span>
    ${L3('h3', T('ベトナムの製品とサービスごとに予想する仕事', 'Expected tasks for each product and service in Vietnam', 'Dự báo việc cần làm theo từng sản phẩm, dịch vụ tại Việt Nam'))}
    <ul>
${rows}
    </ul>
  </div>
  <p class="ap-go rv" style="--d:240ms"><a href="#jd-match">${L3('span', T('私のスキルとの照合は「スキルの照合」ページへ →', 'How my skills match: see the Skill match page →', 'Kỹ năng của tôi khớp thế nào: xem trang Đối chiếu kỹ năng →'))}</a></p>
${b.list()}
</section>`;
}
