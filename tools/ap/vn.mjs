// Task 04fj: trang #ap-vn của tab Andpad Info, ngay sau #ap-shots: tách riêng SẢN PHẨM có tại Việt Nam và DỊCH VỤ ANDPAD
// làm tại Việt Nam, mỗi mục 1 ảnh chính thức (thông cáo của ANDPAD, careers.andpad.vn) tải bằng python tools/ap/fetch-vn.py
// vào assets/ap/<key>.webp. Ảnh không bọc trong <a> để bấm phóng to (khối zoom); link nguồn ở chú thích.
// Tra cứu 25/11/2026: ANDPAD không có sản phẩm riêng bán ở Việt Nam; đó là cùng nền tảng ANDPAD có thêm ngôn ngữ,
// còn ANDPAD Vietnam làm phát triển, thí điểm và triển khai / hỗ trợ. Trang ghi rõ ý này.
const ico = (f, s = 22) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
const lnk = (u, t) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const N = (n) => `https://andpad.jp/news/${n}`;

// [key, rộng, cao, mốc, tên, mô tả, alt, [link, nhãn link], [nguồn: khoá tools/ap/refs.mjs, task 4n9v]]
const PRODUCTS = [
  ['vn-vi-app', 540, 304, '2025.06',
    { ja: 'ベトナム語版：施工管理、チャット、図面', en: 'Vietnamese: Construction Management, Chat, Drawings', vi: 'Bản tiếng Việt: Quản lý thi công, Chat, Bản vẽ' },
    { ja: 'アプリの言語をベトナム語に切り替えられます。日本で働くベトナム人の職人とベトナムの現場向けで、既存ユーザーは無料です。',
      en: 'The apps can switch to Vietnamese, for Vietnamese workers in Japan and for sites in Vietnam. Free for existing users.',
      vi: 'App chuyển được sang tiếng Việt, dành cho thợ Việt tại Nhật và công trường ở Việt Nam. Miễn phí cho người đang dùng.' },
    'ANDPAD ベトナム語版の公式画像（タブレットとスマホのベトナム語画面）', [N('20250626'), 'andpad.jp/news/20250626'], ['newsVi', 'vnViPr']],
  ['vn-en-app', 540, 304, '2025.02',
    { ja: '英語版アプリ（施工管理、チャット、図面）', en: 'English app (Construction Management, Chat, Drawings)', vi: 'App tiếng Anh (Quản lý thi công, Chat, Bản vẽ)' },
    { ja: '多言語化の第1弾です。外国籍の職人と海外の現場で使えるようになりました。', en: 'Step one of the multilingual plan, for foreign workers and overseas sites.',
      vi: 'Bước đầu của kế hoạch đa ngôn ngữ, cho thợ nước ngoài và công trường ở nước ngoài.' },
    'ANDPAD 英語版アプリの公式画像', [N('20250226'), 'andpad.jp/news/20250226'], ['newsEn']],
  ['vn-en-web', 540, 304, '2025.10',
    { ja: 'ブラウザ版の英語化とタイムゾーン設定', en: 'English web version and time-zone setting', vi: 'Bản web tiếng Anh và cài đặt múi giờ' },
    { ja: '施工管理、チャット、図面をPCのブラウザでも英語で使え、現地時間で工程を管理できます。',
      en: 'Construction Management, Chat and Drawings in English in the browser, with schedules in local time.',
      vi: 'Quản lý thi công, Chat, Bản vẽ dùng được bằng tiếng Anh trên trình duyệt, tiến độ theo giờ địa phương.' },
    'ANDPAD ブラウザ版英語化の公式画像（ベトナム語の見出し付き）', [N('20251014'), 'andpad.jp/news/20251014'], ['newsEnWeb']],
];
const SERVICES = [
  ['vn-jetro', 540, 304, '2023.12',
    { ja: 'JETROの事業に採択', en: 'Selected for a JETRO programme', vi: 'Được JETRO chọn' },
    { ja: '「日ASEANにおけるアジアDX促進事業」に採択。協力会社はPENTA-OCEAN CONSTRUCTION VIETNAMです。',
      en: 'Chosen for the Japan-ASEAN Asia DX Promotion Program, with PENTA-OCEAN CONSTRUCTION VIETNAM as partner.',
      vi: 'Được chọn vào chương trình thúc đẩy DX Nhật Bản và ASEAN của JETRO, đối tác là PENTA-OCEAN CONSTRUCTION VIETNAM.' },
    'ベトナムの建設DXを加速するJETRO事業の公式画像', ['https://andpad.co.jp/news/4260/', 'andpad.co.jp/news/4260'], ['newsJetro']],
  ['vn-pilot', 540, 304, '2024.02',
    { ja: 'ベトナムの現場で実証（2024年2月〜2025年5月）', en: 'Pilot on Vietnamese sites (Feb 2024 to May 2025)', vi: 'Thí điểm tại công trường Việt Nam (2/2024 tới 5/2025)' },
    { ja: '写真管理、電子黒板、帳票出力を使い、作業時間は最大50％減、紙の記録は不要に。ベトナム式の帳票も追加しました。',
      en: 'Photo management, digital signboard and form output cut work time by up to 50% and ended paper records. A Vietnamese form layout was added.',
      vi: 'Dùng quản lý ảnh, bảng đen điện tử, xuất biểu mẫu: giảm tới 50% giờ làm, bỏ ghi chép giấy. Có thêm mẫu biểu kiểu Việt Nam.' },
    'JETRO実証事業の完了を伝える公式画像（ベトナムの現場写真と地図）', [N('20251006'), 'andpad.jp/news/20251006'], ['newsPilot', 'vnPilotPr']],
  ['vn-cs', 540, 360, '2025.10',
    { ja: '導入とサポート（Customer Success）', en: 'Onboarding and support (Customer Success)', vi: 'Triển khai và hỗ trợ (Customer Success)' },
    { ja: 'ベトナム人スタッフを採用、育成し、導入から定着までをベトナム国内で支援できる体制にしました。',
      en: 'Vietnamese staff were hired and trained so onboarding and ongoing support can be done inside Vietnam.',
      vi: 'Tuyển và đào tạo nhân sự người Việt để triển khai và hỗ trợ khách hàng ngay tại Việt Nam.' },
    'ANDPAD VIETNAMのオフィスのロゴウォール', [N('20251006'), 'andpad.jp/news/20251006'], ['newsPilot']],
  ['vn-dev', 540, 360, 'HCMC',
    { ja: '開発拠点（ホーチミン）', en: 'Development centre (Ho Chi Minh City)', vi: 'Trung tâm phát triển (TP.HCM)' },
    { ja: 'ANDPADの開発を行うエンジニアチーム（Go、Ruby on Rails、React、Vue、Kotlin、Swift、AWS）。オフィスは90 Nguyen Dinh Chieuです。',
      en: 'Engineering teams that build ANDPAD (Go, Ruby on Rails, React, Vue, Kotlin, Swift, AWS). Office at 90 Nguyen Dinh Chieu.',
      vi: 'Các đội kỹ sư phát triển ANDPAD (Go, Ruby on Rails, React, Vue, Kotlin, Swift, AWS). Trụ sở 90 Nguyễn Đình Chiểu, TP.HCM.' },
    'ANDPAD VIETNAMのエンジニアチーム', ['https://careers.andpad.vn/', 'careers.andpad.vn'], ['vnCareersTop', 'vnHanoiPr']],
  ['vn-hanoi', 540, 304, '2026.04',
    { ja: 'ハノイ事務所', en: 'Hanoi office', vi: 'Văn phòng Hà Nội' },
    { ja: '2025年5月に開設し、2026年4月にTaisei Square Hanoiへ移転。東南アジアの建設DXに向けて体制を広げています。',
      en: 'Opened May 2025, moved to Taisei Square Hanoi in April 2026 to grow construction DX work in Southeast Asia.',
      vi: 'Mở tháng 5/2025, dời về Taisei Square Hanoi tháng 4/2026 để mở rộng việc DX xây dựng ở Đông Nam Á.' },
    'ANDPAD VIETNAM ハノイ事務所の移転を伝える公式画像（ビル、オフィス、社員）', [N('20260408'), 'andpad.jp/news/20260408'], ['newsHanoi', 'vnHanoiPr']],
];

// b = bộ trích dẫn của trang (task 4n9v)
export function pageVn({ L3, T, head, b }) {
  let n = 0;
  const subC = b.c('newsLang6', 'newsVi');
  const fig = (cls) => ([k, w, h, d, name, desc, alt, [u, t], r]) =>
    `      <figure class="${cls}" style="--i:${n++}"><img src="assets/ap/${k}.webp" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"><figcaption>${/^\d/.test(d) ? `<time>${d}</time>` : `<em class="ap-vd">${d}</em>`}${L3('b', name)}${L3('span', b.t(desc, ...r))}${lnk(u, t)}</figcaption></figure>`;
  const grp = (k, icon, lbl, title, items, cls) => `  <div class="ap-vgrp rv" data-k="${k}" style="--d:${k === 'prod' ? 180 : 220}ms">
    <div class="ap-gh">${ico(icon)}<span class="lbl">${lbl}</span>${L3('h3', title)}</div>
    <div class="ap-vps ap-vps--${items.length}">
${items.map(fig(cls)).join('\n')}
    </div>
  </div>`;
  return `<section class="pg" data-chap="II" id="ap-vn">
${head('VN　<b>ANDPAD IN VIETNAM</b>', T('ベトナムでの<br /><i>製品とサービス。</i>', 'Products and services<br /><i>in Vietnam.</i>', 'Sản phẩm và dịch vụ<br /><i>tại Việt Nam.</i>'),
    'Products ／ Services ／ Official images',
    T('ベトナム専用の製品はなし。同じANDPADにベトナム語と英語を追加。ANDPAD Vietnamの役割は開発、実証、導入支援。',
      'There is no Vietnam-only product: the same ANDPAD now speaks Vietnamese and English. ANDPAD Vietnam handles development, the pilot and onboarding.',
      'ANDPAD không có sản phẩm riêng cho Việt Nam: vẫn là ANDPAD, có thêm tiếng Việt và tiếng Anh. ANDPAD Vietnam lo phát triển, thí điểm và triển khai.'), subC)}
${grp('prod', 'building-blocks', 'PRODUCTS', T('ベトナムで使える製品', 'Products available in Vietnam', 'Sản phẩm dùng được tại Việt Nam'), PRODUCTS, 'ap-vp')}
${grp('svc', 'handshake', 'SERVICES', T('ベトナムでの事業とサービス', 'Work and services in Vietnam', 'Hoạt động và dịch vụ tại Việt Nam'), SERVICES, 'ap-vs')}
${b.list()}
</section>`;
}
