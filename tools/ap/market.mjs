// Task m07v (phần bổ sung y5cp): trang #ap-market của tab Andpad Info, ngay trước #ap-role.
// Nội dung tra cứu web 25/11/2026: bối cảnh ngành, vị thế thị trường + đối thủ, case khách hàng có số, cách ANDPAD hỗ trợ khách hàng.
// Số liệu case là số khách hàng công bố trên trang case của ANDPAD (ghi rõ trên trang). Module riêng: build.mjs chỉ 1 import + 1 dòng gọi.
const ico = (f, s = 30) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;

// b = bộ trích dẫn của trang (tools/ap/refs.mjs, task 4n9v). Đối chiếu nguồn 25/11/2026: thị phần MIC là "1 về số doanh nghiệp
// sử dụng, 8 năm liền", MIC không công bố %; KANNA có gói miễn phí và ID đối tác miễn phí; Buildee do 株式会社リバスタ vận hành
// (không phải MCデータプラス); sản phẩm trong case ghi đúng theo bài case.
export function pageMarket({ L3, T, head, b }) {
  const subC = b.c('mhlw', 'cao');
  const { COMP } = rivals(T);
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
    T('増やせない残業、減少と高齢化が進む働き手、減らない仕事量。一人がより多くをこなすには施工管理のデジタル化が不可欠。本ページでは4つの問いを順に検討。',
      'Fewer hours allowed, fewer and older workers, yet no less work: each person must do more, so builders need to digitise site management. The page follows four linked questions.',
      'Giờ làm bị giới hạn, người làm ít đi và già đi, nhưng khối việc không giảm: mỗi người phải làm được nhiều hơn, nên công ty xây dựng cần số hóa quản lý thi công. Trang đi theo 4 câu hỏi nối tiếp nhau.'), subC)}
  ${Q(1)}
  <ul class="ap-ctx rv" style="--d:180ms">
${CTX.map(([ic, h, p, r], i) => `    <li style="--i:${i}"${OPS[i] ? ` data-op="${OPS[i]}"` : ''}>${ico(ic)}<div>${L3('b', h)}${L3('span', b.t(p, ...r))}</div></li>`).join('\n')}
  </ul>
  <div class="card ap-mk rv" style="--d:200ms">
    <div class="ap-mk-l">
      ${Q(2)}
      ${L3('h3', b.t(T('製品：ANDPAD（クラウド型建設プロジェクト管理サービス）', 'Product: ANDPAD, a cloud construction project management service', 'Sản phẩm: ANDPAD, dịch vụ cloud quản lý dự án xây dựng'), 'top'))}
      ${L3('p', b.t(T('シェア：建設業マネジメントクラウド市場で導入企業数1位、8年連続（デロイト トーマツ ミック経済研究所、2025年12月、2022〜2025年度見込）。％は非公開。利用27.9万社、81.8万人。',
        'Share: first by number of adopting companies in the construction management cloud market, 8 years running (Deloitte Tohmatsu MIC Research, Dec 2025, FY2022 to FY2025 est.). The % share is not published. In use at 279,000 companies by 818,000 people.',
        'Thị phần: đứng đầu về số doanh nghiệp sử dụng trong thị trường cloud quản lý ngành xây dựng, 8 năm liền (Deloitte Tohmatsu MIC, 12/2025, năm tài khóa 2022 đến 2025 ước tính). Tỷ lệ % không công bố. Đang dùng: 279.000 công ty, 818.000 người.'), 'share', 'mic', 'top'))}
    </div>
    <div class="ap-mk-r">
      ${L3('span', T('主な競合（製品と運営会社）', 'Main competitors (product, company)', 'Đối thủ chính (sản phẩm, công ty)'), ' class="ap-k"')}
      <ul>
${COMP.map(([n, co, , rp]) => `        <li class="ap-cp">${typeof n === 'string' ? `<b>${n}</b>` : L3('b', n)}${L3('span', b.t(co, rp[0]))}</li>`).join('\n')}
      </ul>
      <a class="ap-more" href="#ap-compete">${L3('span', T('強みと弱みの比較は次のページ', 'Strengths and weak points compared on the next page', 'So sánh ưu, nhược điểm và lợi thế: trang kế tiếp'))}</a>
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

// Trang #ap-compete ngay sau #ap-market: ANDPAD và 5 đối thủ, công ty vận hành, ưu / nhược, ai đang có lợi thế gì.
// Mỗi dòng đối thủ chỉ dẫn nguồn là trang chính thức của chính công ty đó (tests/check-ap-compete.mjs kiểm).
export function pageCompete({ L3, T, head, b }) {
  const { PROS, CONS, COMP } = rivals(T);
  const sub = b.c('share', 'mic');
  const li = ([p, r]) => `        <li>${L3('span', b.t(p, ...r))}</li>`;
  return `<section class="pg" data-chap="IV" id="ap-compete">
${head('VS　<b>COMPETITION</b>', T('競合と比べた<br /><i>ANDPADの強みと弱み。</i>', 'Against its rivals:<br /><i>ANDPAD\'s strengths and weak points.</i>', 'So với đối thủ:<br /><i>ưu và nhược điểm của ANDPAD.</i>'),
    'Product ／ Competitors ／ Pros and cons ／ Edge',
    T('ANDPADと主な競合5製品を、運営会社、強み、弱みで比較。各行の出典は、その製品を運営する会社の公式ページ。',
      'ANDPAD and its five main rivals, compared by operating company, strengths and weak points. Each row cites the official site of the company that runs that product.',
      'So sánh ANDPAD với 5 sản phẩm cạnh tranh chính theo công ty vận hành, ưu điểm và hạn chế. Mỗi dòng dẫn nguồn từ trang chính thức của chính công ty vận hành sản phẩm đó.'), sub)}
  <div class="card ap-me rv" style="--d:180ms">
    ${L3('h3', b.t(T('ANDPAD（株式会社アンドパッド）', 'ANDPAD (ANDPAD Inc.)', 'ANDPAD (ANDPAD Inc., 株式会社アンドパッド)'), 'company'))}
    <div>
      ${L3('span', T('強み', 'Strengths', 'Lợi thế của ANDPAD'), ' class="ap-k"')}
      <ul class="ap-pros">
${PROS.map(li).join('\n')}
      </ul>
    </div>
    <div>
      ${L3('span', T('弱み', 'Weak points', 'Hạn chế của ANDPAD'), ' class="ap-k"')}
      <ul class="ap-cons">
${CONS.map(li).join('\n')}
      </ul>
    </div>
  </div>
  <div class="card ap-rival rv" style="--d:200ms">
    <p class="ap-rival-h">${L3('span', T('競合（製品と運営会社）', 'Rival (product, company)', 'Đối thủ (sản phẩm, công ty)'))}${L3('span', T('競合の強み', 'Their strengths', 'Lợi thế của đối thủ'))}${L3('span', T('弱み', 'Weak points', 'Hạn chế'))}</p>
    <ul>
${COMP.map(([n, co, plus, rp, minus, rm]) => `      <li class="ap-rv"><span class="ap-cn">${typeof n === 'string' ? `<b>${n}</b>` : L3('b', n)}${L3('small', co)}</span><span class="ap-plus">${L3('span', b.t(plus, ...rp))}</span><span class="ap-minus">${L3('span', b.t(minus, ...rm))}</span></li>`).join('\n')}
    </ul>
  </div>
  <div class="ap-edge rv" style="--d:220ms">
    <div class="card ap-edge-r">
      ${L3('span', T('競合が有利な点', 'Where rivals lead', 'Đối thủ đang có lợi thế'), ' class="ap-k"')}
      ${L3('p', b.t(T('始めやすい料金：KANNAは初期費用0円で協力会社IDも無料、BuildeeとダンドリワークはWebで料金を公開。1つの工程に絞った深さ：SPIDERPLUSは検査、Buildeeは安全書類、Photoructionは検査などの業務代行。',
        'Easier entry pricing: KANNA has no setup fee and free partner IDs; Buildee and Dandori Work publish their prices. Depth in one task: SPIDERPLUS in inspections, Buildee in safety papers, Photoruction in outsourced work such as inspections.',
        'Giá dễ bắt đầu: KANNA phí ban đầu 0 yên, ID đối tác miễn phí; Buildee và Dandori Work công khai giá trên web. Chuyên sâu một khâu: SPIDERPLUS về kiểm tra, Buildee về hồ sơ an toàn, Photoruction nhận làm thay các phần việc như kiểm tra.'),
        'kanna', 'kannaFree', 'buildee', 'dandoriPlan', 'spider', 'photoruction'), ' class="ap-edge-p"')}
    </div>
    <div class="card ap-edge-a">
      ${L3('span', T('ANDPADが有利な点', 'Where ANDPAD leads', 'ANDPAD có lợi thế'), ' class="ap-k"')}
      ${L3('p', b.t(T('規模：導入企業数1位が8年連続、27.9万社が利用。幅：現場の施工管理から図面、検査、受発注、請求までを1つの基盤でつなぎ、6言語に対応。',
        'Scale: first by adopting companies for 8 years, used by 279,000 companies. Breadth: one platform links site management, drawings and inspections to ordering and billing, in six languages.',
        'Quy mô: đứng đầu về số doanh nghiệp sử dụng 8 năm liền, 279.000 công ty đang dùng. Độ rộng: một nền tảng nối quản lý thi công, bản vẽ, kiểm tra với đặt hàng, hóa đơn, dùng được 6 ngôn ngữ.'),
        'share', 'top', 'products', 'newsLang6'), ' class="ap-edge-p"')}
    </div>
  </div>
${b.list()}
</section>`;
}

// Dữ liệu so sánh ANDPAD với đối thủ (dùng chung cho #ap-market và #ap-compete). Đối chiếu trang chính thức 25/11/2026.
function rivals(T) {
  // ANDPAD: ưu / nhược [chữ, nguồn]
  const PROS = [
    [T('施工管理から図面、検査、受発注、請求、BIMまで20以上の製品を1つの基盤で', '20+ products on one platform, from site management and drawings to ordering, billing and BIM', 'Hơn 20 sản phẩm trên một nền tảng: từ quản lý thi công, bản vẽ, kiểm tra tới đặt hàng, hóa đơn, BIM'), ['products']],
    [T('アプリマーケットで外部サービスと連携', 'App Market links partner services', 'Chợ ứng dụng kết nối dịch vụ đối tác'), ['appmarket']],
    [T('6言語に対応（2025年12月から）', 'Six languages (since December 2025)', 'Dùng được 6 ngôn ngữ (từ 12/2025)'), ['newsLang6']],
    [T('導入4ステップをCSとサポートが伴走', 'CS and Support guide a four-step rollout', 'CS và đội hỗ trợ đi cùng 4 bước triển khai'), ['support']],
  ];
  const CONS = [
    [T('料金は非公開で個別見積もり', 'Pricing is not public; quote only', 'Giá không công khai, báo giá riêng từng khách'), ['pricing']],
    [T('BOXILの一部の口コミ：初期費用が少し高い、機能が多く慣れるまで時間がかかる、高齢の職人には覚えにくい', 'Some BOXIL reviews: setup cost a bit high, many features take time to learn, hard for older trades', 'Một số ý kiến người dùng trên BOXIL: phí ban đầu hơi cao, nhiều chức năng nên lâu quen, thợ lớn tuổi khó học'), ['boxil']],
  ];
  // Đối thủ: [sản phẩm, công ty vận hành, lợi thế, nguồn lợi thế, hạn chế, nguồn hạn chế]; nguồn luôn là trang của chính công ty đó
  const COMP = [
    ['SPIDERPLUS', T('スパイダープラス株式会社', 'SpiderPlus & Co.', 'SpiderPlus & Co.'),
      T('建築、設備、電気工事向けに図面と検査が強い。配筋検査の準備の8割をAIで。2.3万社超、80万人超（2026年9月末）',
        'Strong in drawings and inspections for building, MEP and electrical trades; AI does 80% of rebar-inspection prep. 23,000+ companies, 800,000+ users (Sep 2026)',
        'Mạnh về bản vẽ và kiểm tra cho xây dựng, cơ điện, điện; AI làm 80% khâu chuẩn bị kiểm tra cốt thép. Hơn 23.000 công ty, 800.000 người dùng (9/2026)'), ['spider'],
      T('現場の記録と検査が中心。料金は非公開', 'Centred on site records and inspections; pricing not public', 'Xoay quanh hồ sơ và kiểm tra tại công trường; giá không công khai'), ['spider']],
    ['KANNA', T('株式会社アルダグラム', 'Aldagram Inc.', 'Aldagram Inc.'),
      T('初期費用0円、協力会社IDは無料で無制限、無料プランあり。6言語。10万社超（無料の協力会社を含む）',
        'No setup fee, free unlimited partner IDs, a free plan; 6 languages. 100,000+ companies (incl. free partners)',
        'Phí ban đầu 0 yên, ID đối tác miễn phí không giới hạn, có gói miễn phí; 6 ngôn ngữ. Hơn 100.000 công ty (gồm cả đối tác dùng miễn phí)'), ['kanna', 'kannaFree', 'kannaScale'],
      T('建設、不動産、製造など多業種向けで建設専業ではない。有料プランの料金は非公開', 'Built for many industries (construction, real estate, manufacturing), not construction only; paid-plan prices not public', 'Làm cho nhiều ngành (xây dựng, bất động sản, sản xuất), không chuyên riêng xây dựng; giá gói trả phí không công khai'), ['kannaScale', 'kanna']],
    ['Photoruction', T('株式会社フォトラクション', 'Photoruction Inc.', 'Photoruction Inc.'),
      T('写真、図面、工程、検査のSaaSに、検査や施工計画書づくりなどを代行するAI-BPOを組み合わせる。ゼネコンなど向け',
        'SaaS for photos, drawings, schedules and inspections, plus AI-BPO that takes over work such as inspections and construction plans; for general contractors and others',
        'SaaS cho ảnh, bản vẽ, tiến độ, kiểm tra, kèm AI-BPO nhận làm thay việc như kiểm tra, soạn kế hoạch thi công; cho tổng thầu và các nhóm khác'), ['photoruction'],
      T('利用社数を公開していない。料金は非公開', 'No public user count; pricing not public', 'Không công bố số công ty dùng; giá không công khai'), ['photoruction']],
    [T('ダンドリワーク', 'Dandori Work', 'Dandori Work'), T('株式会社ダンドリワーク', 'DANDORI WORK', 'DANDORI WORK'),
      T('工務店、リフォーム店、専門工事向け。説明会とアフターフォローが年1,700回以上、チャットは24時間受付',
        'For home builders, renovators and specialist trades. 1,700+ briefings and follow-ups a year; chat open 24 hours',
        'Cho nhà thầu nhà ở, cải tạo, thầu chuyên ngành. Hơn 1.700 buổi hướng dẫn và chăm sóc mỗi năm; chat nhận 24 giờ'), ['dandori'],
      T('有料で、初期費用20万円から、月額1.5万円から', 'Paid: setup fee from ¥200,000, from ¥15,000 a month', 'Có phí: phí ban đầu từ 200.000 yên, từ 15.000 yên/tháng'), ['dandoriPlan']],
    ['Buildee', T('株式会社リバスタ', 'RVSTA, Inc.', 'RVSTA, Inc.'),
      T('ゼネコン向けの調整会議、労務安全、入退場（CCUS連携）。協力会社は無料。元請1,061社、42,190現場（2026年10月末）',
        'For general contractors: coordination meetings, labour safety papers, site entry (CCUS link). Free for subcontractors. 1,061 prime contractors, 42,190 sites (Oct 2026)',
        'Cho tổng thầu: họp điều phối, hồ sơ an toàn lao động, ra vào công trường (nối CCUS). Thầu phụ dùng miễn phí. 1.061 tổng thầu, 42.190 công trường (10/2026)'), ['buildee'],
      T('元請の調整と安全管理が中心。料金は支店ごと（月3万円、初回登録5万円）と現場ごと', 'Centred on prime contractors\' coordination and safety; billed per branch (¥30,000 a month, ¥50,000 sign-up) and per site', 'Xoay quanh điều phối và an toàn của tổng thầu; tính phí theo chi nhánh (30.000 yên/tháng, đăng ký lần đầu 50.000 yên) và từng công trường'), ['buildee']],
  ];
  return { PROS, CONS, COMP };
}
