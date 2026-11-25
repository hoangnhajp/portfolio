// Task m07v (phần bổ sung y5cp): trang #ap-market của tab Andpad Info, ngay trước #ap-role.
// Nội dung tra cứu web 25/11/2026: bối cảnh ngành, vị thế thị trường + đối thủ, case khách hàng có số, cách ANDPAD hỗ trợ khách hàng.
// Số liệu case là số khách hàng công bố trên trang case của ANDPAD (ghi rõ trên trang). Module riêng: build.mjs chỉ 1 import + 1 dòng gọi.
const ico = (f, s = 30) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;

export function pageMarket({ L3, T, head, src }) {
  const CTX = [
    ['stopwatch', T('残業の上限（2024年4月から）', 'Overtime cap (from April 2024)', 'Giới hạn làm thêm (từ 4/2024)'),
      T('建設業にも月45時間、年360時間の上限が適用されました。', 'Construction now has the 45 h a month, 360 h a year cap.', 'Ngành xây dựng phải áp trần 45 giờ/tháng, 360 giờ/năm.')],
    ['team-group', T('人手不足と高齢化', 'Labour shortage, ageing workforce', 'Thiếu lao động, lao động già đi'),
      T('就業者の36.6％が55歳以上、29歳以下は11.9％です。', '36.6% of workers are 55 or older; only 11.9% are 29 or under.', '36,6% lao động ngành từ 55 tuổi trở lên, chỉ 11,9% từ 29 tuổi trở xuống.')],
    ['roadmap', T('i-Construction 2.0（国交省）', 'i-Construction 2.0 (MLIT)', 'i-Construction 2.0 (Bộ MLIT)'),
      T('2040年度までに省人化3割以上を目標にしています。', 'Target: at least 30% fewer labour hours by FY2040.', 'Mục tiêu giảm ít nhất 30% nhân lực tới năm 2040.')],
  ];
  const COMP = [
    ['SPIDERPLUS', T('図面と検査、大型の建物向け', 'Drawings and inspections, large buildings', 'Bản vẽ và kiểm tra, công trình lớn')],
    ['KANNA', T('基本機能は無料で使える', 'Free basic tier', 'Gói cơ bản miễn phí')],
    ['Photoruction', T('写真と図面が中心', 'Built around photos and drawings', 'Tập trung vào ảnh và bản vẽ')],
    [T('ダンドリワーク', 'Dandori Work', 'Dandori Work'), T('工務店と協力会社向け', 'For home builders and their trades', 'Cho nhà thầu nhà ở và thầu phụ')],
    ['Buildee', T('ゼネコン向け、安全書類と入退場', 'For general contractors, safety papers and site entry', 'Cho tổng thầu, hồ sơ an toàn và ra vào')],
  ];
  // [công ty, loại, sản phẩm, kết quả]
  const CASES = [
    ['ビーバーリフォーム', T('リフォーム', 'Renovation', 'Cải tạo nhà'), T('施工管理', 'Construction Mgmt', 'Quản lý thi công'),
      T('現場監督の残業が年250〜300時間から150時間に', 'Supervisor overtime: 250 to 300 h a year down to 150 h', 'Giờ làm thêm của giám sát: 250 đến 300 giờ/năm còn 150 giờ')],
    ['カスケホーム', T('リフォーム', 'Renovation', 'Cải tạo nhà'), T('施工管理、受発注', 'Construction Mgmt, Ordering', 'Quản lý thi công, Đặt hàng'),
      T('一人あたりの残業が月10時間以上減少', 'Overtime down 10+ h per person a month', 'Làm thêm giảm hơn 10 giờ/người/tháng')],
    ['平松建築', T('工務店', 'Home builder', 'Nhà thầu nhà ở'), T('遠隔臨場', 'Remote Inspection', 'Nghiệm thu từ xa'),
      T('現場訪問が毎週から、工事全体で2〜3回に', 'Site visits: weekly down to 2 or 3 per build', 'Đi công trường: từ hằng tuần còn 2 đến 3 lần cho cả công trình')],
    ['大勝', T('マンション施工', 'Condominiums', 'Thi công chung cư'), T('図面、黒板', 'Drawings, Blackboard', 'Bản vẽ, Bảng đen'),
      T('是正指示書の作成が1〜2時間から約10分に', 'Correction log: 1 to 2 h down to about 10 min', 'Lập sổ chỉ thị sửa: 1 đến 2 giờ còn khoảng 10 phút')],
    ['エイコーエナジオ', T('太陽光', 'Solar', 'Điện mặt trời'), T('施工管理', 'Construction Mgmt', 'Quản lý thi công'),
      T('図面確認と現場調査の手間が約50％減少', 'Drawing checks and surveys: about 50% less effort', 'Công kiểm bản vẽ, khảo sát giảm khoảng 50%')],
    ['渡正配管工業', T('設備配管', 'Piping', 'Đường ống'), T('ボード、歩掛管理', 'Board, Labour Productivity', 'Bảng tiến độ, Quản lý công'),
      T('粗利率が約10％向上', 'Gross margin up about 10%', 'Tỷ suất lãi gộp tăng khoảng 10%')],
  ];
  const SUP = [
    ['checklist', T('運用準備', 'Prepare', 'Chuẩn bị'), T('今の業務を確認し、設定を設計', 'Review current work, design the setup', 'Xem quy trình hiện tại, thiết kế cài đặt')],
    ['interview', T('社内展開', 'Roll out inside', 'Triển khai nội bộ'), T('社員向けの説明会', 'Briefings for the client\'s staff', 'Hướng dẫn cho nhân viên của khách')],
    ['handshake', T('社外展開', 'Roll out to partners', 'Triển khai đối tác'), T('職人、協力会社向けの説明会', 'Briefings for trades and subcontractors', 'Hướng dẫn cho thợ và thầu phụ')],
    ['shield-check', T('運用開始', 'Go live', 'Vận hành'), T('定着するまでCSとサポートが伴走', 'CS and Support stay until it sticks', 'CS và hỗ trợ đồng hành tới khi dùng ổn định')],
  ];
  return `<section class="pg" data-chap="IV" id="ap-market">
${head('03　<b>MARKET ／ CUSTOMERS</b>', T('業界の課題と、<br /><i>ANDPADの立ち位置。</i>', 'The industry\'s problems<br /><i>and where ANDPAD fits.</i>', 'Bài toán của ngành<br /><i>và vị thế của ANDPAD.</i>'),
    'Industry ／ Market ／ Cases ／ Support',
    T('残業規制と人手不足で、建設業は少ない人数で現場を回す必要があります。市場、競合、導入事例、サポートの体制を調べました。',
      'With overtime caps and a shrinking workforce, builders must run sites with fewer people. Here is the market, the competition, client results and how ANDPAD supports clients.',
      'Do trần giờ làm thêm và thiếu lao động, doanh nghiệp xây dựng phải vận hành công trường với ít người hơn. Dưới đây là thị trường, đối thủ, kết quả của khách hàng và cách ANDPAD hỗ trợ khách hàng.'))}
  <ul class="ap-ctx rv" style="--d:180ms">
${CTX.map(([ic, h, p], i) => `    <li style="--i:${i}">${ico(ic)}<div>${L3('b', h)}${L3('span', p)}</div></li>`).join('\n')}
  </ul>
  <div class="card ap-mk rv" style="--d:200ms">
    <div class="ap-mk-l">
      <span class="lbl">MARKET SHARE</span>
      ${L3('h3', T('建設プロジェクト管理クラウドの調査で最大のシェア', 'Largest share in a survey of cloud construction project management', 'Thị phần lớn nhất trong khảo sát về quản lý dự án xây dựng trên đám mây'))}
      ${L3('p', T('デロイト トーマツ ミック経済研究所の調査（2025年12月）。強みは製品の幅と利用者の多さで、料金は公開せず個別見積もりです。',
        'Per Deloitte Tohmatsu MIC Research (December 2025). Its edge is the breadth of products and the user base; pricing is quote-only.',
        'Theo khảo sát của Deloitte Tohmatsu MIC (12/2025). Lợi thế là bộ sản phẩm rộng và số người dùng lớn; giá không công khai, báo giá theo từng khách.'))}
    </div>
    <div class="ap-mk-r">
      ${L3('span', T('主な競合', 'Main competitors', 'Đối thủ chính'), ' class="ap-k"')}
      <ul>
${COMP.map(([n, d]) => `        <li class="ap-cp">${typeof n === 'string' ? `<b>${n}</b>` : L3('b', n)}${L3('span', d)}</li>`).join('\n')}
      </ul>
    </div>
  </div>
  <div class="ap-css-cases rv" style="--d:220ms">
    <div class="ap-gh">${ico('milestone-report', 22)}<span class="lbl">CASES</span>${L3('h3', T('導入事例（事例記事に掲載された数字）', 'Client results (figures from ANDPAD case studies)', 'Kết quả khách hàng (số liệu trong bài case của ANDPAD)'))}</div>
    <ul class="ap-cslist">
${CASES.map(([n, t, pr, r], i) => `      <li class="ap-cs" style="--i:${i}"><b>${n}</b>${L3('i', t)}${L3('em', pr)}${L3('span', r)}</li>`).join('\n')}
    </ul>
  </div>
  <div class="card ap-sp rv" style="--d:240ms">
    <span class="lbl">SUPPORT</span>
    ${L3('h3', T('導入支援の4ステップと、サポート体制', 'Four onboarding steps and the support desk', '4 bước triển khai và đội hỗ trợ khách hàng'))}
    <ol class="ap-sps">
${SUP.map(([ic, h, p], i) => `      <li style="--i:${i}">${ico(ic, 26)}<span class="ap-n" aria-hidden="true">0${i + 1}</span>${L3('b', h)}${L3('span', p)}</li>`).join('\n')}
    </ol>
    ${L3('p', T('説明会は年間10,000回以上。電話（平日10〜19時）、チャット、フォームで受け付け、職人や協力会社も直接問い合わせできます。セミナー動画は「ANDPADセミナー放送局」で公開しています。',
      'Over 10,000 briefings a year. Phone (weekdays 10:00 to 19:00), chat and web form; trades and subcontractors can contact support directly. Webinars run on ANDPAD Seminar TV.',
      'Hơn 10.000 buổi hướng dẫn mỗi năm. Hỗ trợ qua điện thoại (T2 đến T6, 10h đến 19h), chat và form; thợ và thầu phụ được liên hệ trực tiếp. Webinar phát trên kênh ANDPAD Seminar TV.'), ' class="ap-sp-p"')}
  </div>
${src([['https://andpad.jp/', 'andpad.jp'], ['https://andpad.jp/cases', 'andpad.jp/cases'], ['https://andpad.jp/help/support/', 'andpad.jp/help/support'],
    ['https://www.mlit.go.jp/report/press/kanbo08_hh_001085.html', 'MLIT i-Construction 2.0'],
    ['https://www5.cao.go.jp/keizai-shimon/kaigi/special/reform/wg6/2026/0422shiryou1-1.pdf', 'Cabinet Office 2026'], ['https://asb.andpad.jp/', 'asb.andpad.jp']])}
</section>`;
}
