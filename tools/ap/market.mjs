// Task m07v (phần bổ sung y5cp): trang #ap-market của tab Andpad Info, ngay trước #ap-role.
// Nội dung tra cứu web 25/11/2026: bối cảnh ngành, vị thế thị trường + đối thủ, case khách hàng có số, cách ANDPAD hỗ trợ khách hàng.
// Số liệu case là số khách hàng công bố trên trang case của ANDPAD (ghi rõ trên trang). Module riêng: build.mjs chỉ 1 import + 1 dòng gọi.
const ico = (f, s = 30) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;

// b = bộ trích dẫn của trang (tools/ap/refs.mjs, task 4n9v). Đối chiếu nguồn 25/11/2026: KANNA không có gói miễn phí,
// thị phần MIC là "No.1 số doanh nghiệp sử dụng", sản phẩm trong case ghi đúng theo bài case.
export function pageMarket({ L3, T, head, b }) {
  const subC = b.c('mhlw', 'cao');
  const CTX = [
    ['stopwatch', T('残業の上限（2024年4月から）', 'Overtime cap (from April 2024)', 'Giới hạn làm thêm (từ 4/2024)'),
      T('原則は月45時間、年360時間。特別条項でも年720時間までです。',
        'Standard cap: 45 h a month, 360 h a year; 720 h a year at most by special agreement.',
        'Nguyên tắc 45 giờ/tháng, 360 giờ/năm; thỏa thuận đặc biệt tối đa 720 giờ/năm.'), ['mhlw']],
    ['team-group', T('人手不足と高齢化', 'Labour shortage, ageing workforce', 'Thiếu lao động, lao động già đi'),
      T('55歳以上が36.6％、29歳以下は11.9％です（2025年）。', '36.6% of workers are 55 or older; only 11.9% are 29 or under (2025).', '36,6% lao động ngành từ 55 tuổi trở lên, chỉ 11,9% từ 29 tuổi trở xuống (2025).'), ['cao']],
    ['roadmap', T('i-Construction 2.0（国交省）', 'i-Construction 2.0 (MLIT)', 'i-Construction 2.0 (Bộ MLIT)'),
      T('2040年度までに建設現場の省人化3割以上（生産性1.5倍）。',
        'By FY2040: at least 30% fewer workers on site (1.5x productivity).',
        'Năm tài khóa 2040: công trường bớt ít nhất 30% nhân công (năng suất x1,5).'), ['iCon']],
  ];
  const COMP = [
    ['SPIDERPLUS', T('図面と検査の記録', 'Drawings and inspection records', 'Bản vẽ và hồ sơ kiểm tra'), 'spider'],
    ['KANNA', T('初期費用0円、協力会社IDは無料', 'No setup fee, free partner IDs', 'Không phí ban đầu, ID thầu phụ miễn phí'), 'kanna'],
    ['Photoruction', T('写真と図面が中心', 'Built around photos and drawings', 'Tập trung vào ảnh và bản vẽ'), 'photoruction'],
    [T('ダンドリワーク', 'Dandori Work', 'Dandori Work'), T('工務店と協力会社向け', 'For home builders and their trades', 'Cho nhà thầu nhà ở và thầu phụ'), 'dandori'],
    ['Buildee', T('ゼネコン向け、安全書類と入退場', 'For general contractors, safety papers and site entry', 'Cho tổng thầu, hồ sơ an toàn và ra vào'), 'buildee'],
  ];
  // [công ty, loại, sản phẩm, kết quả, nguồn]
  const CASES = [
    ['ビーバーリフォーム', T('リフォーム', 'Renovation', 'Cải tạo nhà'), T('施工管理', 'Construction Mgmt', 'Quản lý thi công'),
      T('現場監督の残業が年250〜300時間から150時間に', 'Supervisor overtime: 250 to 300 h a year down to 150 h', 'Giờ làm thêm của giám sát: 250 đến 300 giờ/năm còn 150 giờ'), 'cBeaver'],
    ['カスケホーム', T('リフォーム', 'Renovation', 'Cải tạo nhà'), T('施工管理', 'Construction Mgmt', 'Quản lý thi công'),
      T('一人あたりの残業が月10時間以上減少', 'Overtime down 10+ h per person a month', 'Làm thêm giảm hơn 10 giờ/người/tháng'), 'cKasuke'],
    ['平松建築', T('工務店', 'Home builder', 'Nhà thầu nhà ở'), T('遠隔臨場', 'Remote Inspection', 'Nghiệm thu từ xa'),
      T('現場訪問が毎週から、工事全体で2〜3回に', 'Site visits: weekly down to 2 or 3 per build', 'Đi công trường: từ hằng tuần còn 2 đến 3 lần cho cả công trình'), 'cHiramatsu'],
    ['大勝', T('マンション施工', 'Condominiums', 'Thi công chung cư'), T('図面', 'Drawings', 'Bản vẽ'),
      T('是正指示台帳の作成が1〜2時間から約10分に', 'Correction log: 1 to 2 h down to about 10 min', 'Lập sổ chỉ thị sửa: 1 đến 2 giờ còn khoảng 10 phút'), 'cDaikatsu'],
    ['エイコーエナジオ', T('太陽光', 'Solar', 'Điện mặt trời'), T('施工管理', 'Construction Mgmt', 'Quản lý thi công'),
      T('図面と工程の確認、現地調査と検査の手間が約50％減少', 'Drawing and schedule checks, surveys and inspections: about 50% less effort', 'Công kiểm bản vẽ, tiến độ, khảo sát và kiểm tra giảm khoảng 50%'), 'cEnergio'],
    ['渡正配管工業', T('設備配管', 'Piping', 'Đường ống'), T('ボード', 'Board', 'Bảng tiến độ'),
      T('粗利率が約10％向上', 'Gross margin up about 10%', 'Tỷ suất lãi gộp tăng khoảng 10%'), 'cWatasho'],
  ];
  const SUP = [
    ['checklist', T('運用準備', 'Prepare', 'Chuẩn bị'), T('今の業務を確認し、設定を設計', 'Review current work, design the setup', 'Xem quy trình hiện tại, thiết kế cài đặt')],
    ['interview', T('社内展開', 'Roll out inside', 'Triển khai nội bộ'), T('社員向けの説明会', 'Briefings for the client\'s staff', 'Hướng dẫn cho nhân viên của khách')],
    ['handshake', T('社外展開', 'Roll out to partners', 'Triển khai đối tác'), T('職人、協力会社向けの説明会', 'Briefings for trades and subcontractors', 'Hướng dẫn cho thợ và thầu phụ')],
    ['shield-check', T('運用開始', 'Go live', 'Vận hành'), T('定着するまでCSとサポートが伴走', 'CS and Support stay until it sticks', 'CS và hỗ trợ đồng hành tới khi dùng ổn định')],
  ];
  // Task xwk4: trang đọc thành mạch 4 câu hỏi nối tiếp; 3 thẻ bối cảnh nối "+" (ít giờ + ít người) rồi "⇒" (nhà nước đặt mục tiêu).
  const QS = [T('なぜ変える必要があるか', 'Why things must change', 'Vì sao phải thay đổi'), T('誰がこの課題を解いているか', 'Who is solving it', 'Ai đang giải bài toán này'),
    T('本当に効果があるか', 'Does it really work', 'Có hiệu quả thật không'), T('現場で使われるには', 'How it gets used on site', 'Làm sao để công trường dùng được')];
  const Q = (n) => L3('span', Object.fromEntries(Object.entries(QS[n - 1]).map(([l, v]) => [l, `<i>${n}</i>${v}`])), ' class="lbl ap-q"');
  const OPS = ['+', '⇒'];
  return `<section class="pg" data-chap="IV" id="ap-market">
${head('03　<b>MARKET ／ CUSTOMERS</b>', T('業界の課題と、<br /><i>ANDPADの立ち位置。</i>', 'The industry\'s problems<br /><i>and where ANDPAD fits.</i>', 'Bài toán của ngành<br /><i>và vị thế của ANDPAD.</i>'),
    'Industry ／ Market ／ Cases ／ Support',
    T('残業は増やせず、働き手は減って高齢化し、それでも仕事量は減りません。一人がより多くをこなすには施工管理のデジタル化が必要です。このページは4つの問いを順に追います。',
      'Fewer hours allowed, fewer and older workers, yet no less work: each person must do more, so builders need to digitise site management. The page follows four linked questions.',
      'Giờ làm bị giới hạn, người làm ít đi và già đi, nhưng khối việc không giảm: mỗi người phải làm được nhiều hơn, nên công ty xây dựng cần số hóa quản lý thi công. Trang đi theo 4 câu hỏi nối tiếp nhau.'), subC)}
  ${Q(1)}
  <ul class="ap-ctx rv" style="--d:180ms">
${CTX.map(([ic, h, p, r], i) => `    <li style="--i:${i}"${OPS[i] ? ` data-op="${OPS[i]}"` : ''}>${ico(ic)}<div>${L3('b', h)}${L3('span', b.t(p, ...r))}</div></li>`).join('\n')}
  </ul>
  <div class="card ap-mk rv" style="--d:200ms">
    <div class="ap-mk-l">
      ${Q(2)}
      ${L3('h3', T('ミック経済研究所の調査で導入企業数1位（8年連続）', 'Ranked first by adopting companies in a MIC Research survey (8 years running)', 'Đứng đầu về số doanh nghiệp sử dụng theo khảo sát MIC (8 năm liền)'))}
      ${L3('p', b.t(T('建設業マネジメントクラウドサービス市場の調査（デロイト トーマツ ミック経済研究所、2025年12月）。強みは製品の幅と利用者の多さで、料金は公開せず個別見積もりです。',
        'Construction management cloud market survey by Deloitte Tohmatsu MIC Research (December 2025). Its edge is the breadth of products and the user base; pricing is quote-only.',
        'Khảo sát thị trường cloud quản lý ngành xây dựng của Deloitte Tohmatsu MIC (12/2025). Lợi thế là bộ sản phẩm rộng và số người dùng lớn; giá không công khai, báo giá theo từng khách.'), 'share', 'top', 'pricing'))}
    </div>
    <div class="ap-mk-r">
      ${L3('span', T('主な競合', 'Main competitors', 'Đối thủ chính'), ' class="ap-k"')}
      <ul>
${COMP.map(([n, d, r]) => `        <li class="ap-cp">${typeof n === 'string' ? `<b>${n}</b>` : L3('b', n)}${L3('span', b.t(d, r))}</li>`).join('\n')}
      </ul>
    </div>
  </div>
  <div class="ap-css-cases rv" style="--d:220ms">
    <div class="ap-gh">${ico('milestone-report', 22)}${Q(3)}${L3('h3', T('導入事例（事例記事に掲載された数字）', 'Client results (figures from ANDPAD case studies)', 'Kết quả khách hàng (số liệu trong bài case của ANDPAD)'))}</div>
    <ul class="ap-cslist">
${CASES.map(([n, t, pr, r, k], i) => `      <li class="ap-cs" style="--i:${i}"><b>${n}</b>${L3('i', t)}${L3('em', pr)}${L3('span', b.t(r, k))}</li>`).join('\n')}
    </ul>
  </div>
  <div class="card ap-sp rv" style="--d:240ms">
    ${Q(4)}
    ${L3('h3', T('導入支援の4ステップと、サポート体制', 'Four onboarding steps and the support desk', '4 bước triển khai và đội hỗ trợ khách hàng'))}
    <ol class="ap-sps">
${SUP.map(([ic, h, p], i) => `      <li style="--i:${i}">${ico(ic, 26)}<span class="ap-n" aria-hidden="true">0${i + 1}</span>${L3('b', h)}${L3('span', b.t(p, 'support'))}</li>`).join('\n')}
    </ol>
    ${((c) => L3('p', T('説明会は年間10,000回以上。電話（平日10〜19時）、チャット、フォームで受け付け、職人や協力会社も直接問い合わせできます。セミナー動画は「ANDPADセミナー放送局」で公開しています。' + c,
      'Over 10,000 briefings a year. Phone (weekdays 10:00 to 19:00), chat and web form; trades and subcontractors can contact support directly. Webinars run on ANDPAD Seminar TV.' + c,
      'Hơn 10.000 buổi hướng dẫn mỗi năm. Hỗ trợ qua điện thoại (T2 đến T6, 10h đến 19h), chat và form; thợ và thầu phụ được liên hệ trực tiếp. Webinar phát trên kênh ANDPAD Seminar TV.' + c), ' class="ap-sp-p"'))(b.c('support', 'asb'))}
  </div>
${b.list()}
</section>`;
}
