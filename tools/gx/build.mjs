// Sinh cảnh minh hoạ động kiểu video GPRFLEXEYE (task kzo4) rồi chèn vào index.html (chạy lại được, không nhân đôi).
// Mỗi cảnh = 1 <figure class="gx gx--<kiểu>"> đặt ngay sau phần tiêu đề của section. Kiểu: flow / hub / ring / chart / grid.
// Icon 3D lấy từ bộ icon có sẵn của video (assets/gx/*.webp), không sinh hình mới.
// Chạy: node tools/gx/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../../index.html', import.meta.url));
const L = (ja, en, vi) => ({ ja, en, vi: vi ?? en });
const T = (t) => typeof t === 'string' ? t : `<span data-l="ja">${t.ja}</span><span data-l="en">${t.en}</span><span data-l="vi">${t.vi}</span>`;
const img = (n, s = 88) => `<img src="assets/gx/${n}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
// 'logo:<file>' = logo thật của công ty (assets/logos, task p0r6), đặt trên đế ngang thay icon 3D
const plate = (n, cls = '', s) => n.startsWith('logo:')
  ? `<span class="gx-pl gx-pl--logo"><img src="assets/logos/${n.slice(5)}" alt="" width="96" height="48" loading="lazy" decoding="async"></span>`
  :`<span class="gx-pl${cls ? ' ' + cls : ''}">${img(n, s)}</span>`;
const chip = (t, o) => t ? `<em class="gx-chip${o ? ' gx-chip--o' : ''}">${T(t)}</em>` : '';

// ── Dữ liệu cảnh (chỉ dùng dữ kiện đã có trong chữ của chính section) ──
const S = {
  // Tab Profile
  profile: { k: 'hub', core: { ic: 'briefcase', chip: L('日系企業で約11年', 'About 11 years at Japanese firms', 'Khoảng 11 năm ở công ty Nhật') },
    left: [['handshake', L('B2B営業', 'B2B sales', 'Bán hàng B2B')], ['team-group', L('営業管理', 'Sales management', 'Quản lý kinh doanh')]],
    right: [['chat-bubbles', L('ITコミュニケーター', 'IT communication', 'Cầu nối IT')], ['survey-clipboard', L('人事', 'HR', 'Nhân sự')]] },
  // task d704: 8 ô dạng chip 4 x 2 (icon trái, nhãn phải 1 dòng) thay 8 cột hẹp làm nhãn gãy "Marketin g"
  projects: { k: 'grid', chips: true, c: 4, mc: 2, tiles: [['manager', L('管理', 'Management', 'Quản lý')], ['handshake', L('営業', 'Sales', 'Kinh doanh')], ['jd-document', L('マーケティング', 'Marketing', 'Marketing')],
    ['report-chart', L('分析', 'Analysis', 'Phân tích')], ['workflow-gears', L('業務調整', 'Operations', 'Điều phối')], ['team-group', L('人事', 'HR', 'Nhân sự')],
    ['chat-bubbles', L('語学', 'Languages', 'Ngoại ngữ')], ['lightbulb', L('AI活用', 'AI projects', 'Dự án AI')]] },
  skillmap: { k: 'ring', v: 10, p: 100, unit: L('のスキル', 'skills', 'kỹ năng'),
    left: [['handshake', L('法人顧客対応', 'B2B client work', 'Khách doanh nghiệp')], ['workflow-gears', L('ITプロジェクト', 'IT projects', 'Dự án IT')]],
    right: [['team-group', L('チーム管理', 'Team management', 'Quản lý đội')], ['lightbulb', L('AI活用', 'Using AI', 'Ứng dụng AI')]] },
  // task p0r6: 4 mốc dùng logo thật của từng công ty thay icon 3D
  career: { k: 'flow', steps: [['logo:lienviet.png', L('銀行', 'Bank', 'Ngân hàng'), '2011'], ['logo:isuzu.svg', 'Isuzu', '2015'], ['logo:jilnesta.png', 'JILNESTA', '2017'], ['logo:mayekawa.svg', 'MAYEKAWA', '2022']] },
  'w-mycom': { k: 'hub', core: { ic: 'handshake', chip: 'MAYEKAWA' },
    left: [['jd-document', L('設備の提案', 'Equipment proposals', 'Đề xuất thiết bị')], ['workflow-gears', L('技術者と連携', 'With engineers', 'Cùng kỹ sư')]],
    right: [['shield-check', L('納品後のフォロー', 'After-sales follow-up', 'Theo sát sau bàn giao')], ['team-group', L('人事チーム 1→5名', 'HR team 1 → 5', 'Đội nhân sự 1 → 5')]] },
  // task nu9w: workflow 6 bước "từ 0 lên đội bán hàng" thay vòng số 27 người + "rà soát định kỳ / gia hạn hợp đồng"
  'w-jil': { k: 'flow', steps: [['person-bust', L('自ら営業', 'Hands-on sales', 'Tự đi sales'), L('チーム未設立', 'No team yet', 'Chưa có đội')],
    ['interview', L('ニーズ把握', 'Client needs', 'Thấu hiểu nhu cầu')], ['jd-document', L('基本仕様', 'Basic specs', 'Viết đặc tả'), L('Excelと図', 'Excel + visuals', 'Excel + hình')],
    ['chat-bubbles', L('開発と調整', 'Dev team', 'Trao đổi đội dev')], ['workflow-gears', L('アプリとWeb', 'Apps, websites', 'App và web')],
    ['team-group', L('1→5〜6名', 'Sales 1 → 5~6', 'Đội 1 → 5~6'), 'Startup', true]] },
  'w-it': { k: 'flow', both: true, steps: [['office-building', L('日本の顧客', 'Japanese clients', 'Khách hàng Nhật')], ['chat-bubbles', L('通訳と翻訳', 'Interpreting', 'Phiên dịch'), 'JA · EN · VI', true], ['workflow-gears', L('ベトナム人技術者', 'Vietnamese engineers', 'Kỹ sư Việt Nam')]] },
  'w-early': { k: 'chart', bars: [[46], [70], [38], [62], [84, 1]], cap: L('数字で報告', 'Reports with numbers', 'Báo cáo bằng số liệu'),
    left: [['office-building', L('国際送金', 'International payments', 'Thanh toán quốc tế')], ['briefcase', L('部品の営業事務', 'Parts sales admin', 'Hành chính bán phụ tùng')]],
    right: [['manager', L('日本人上司へ報告', 'Reporting to Japanese managers', 'Báo cáo cấp trên người Nhật')]] },
  pcai: { k: 'hub', core: { ic: 'lightbulb', chip: 'AI' },
    left: [['chat-bubbles', L('日本語 N2', 'Japanese N2', 'Tiếng Nhật N2')], ['jd-document', L('英語 TOEIC 680', 'English TOEIC 680', 'Tiếng Anh TOEIC 680')]],
    right: [['person-bust', L('ベトナム語 母語', 'Vietnamese, native', 'Tiếng Việt bản ngữ')], ['team-group', L('1人で3〜4人分', 'One person, work of 3 to 4', '1 người, việc của 3–4 người')]] },
  // task ye4s: bỏ 3 trang cuối tab Profile (aiops, aidash, pr) nên không còn cảnh của chúng
  // Tab Sales
  'sales-top': { k: 'grid', c: 4, mc: 2, tiles: [['roadmap', L('出張', 'Trips', 'Công tác'), L('5省13社', '5 provinces, 13 firms', '5 tỉnh, 13 công ty')],
    ['calendar', L('週次CRM会議', 'Weekly CRM meetings', 'Họp CRM hằng tuần')], ['report-chart', L('見積と訪問の集計', 'Quote and visit KPIs', 'KPI báo giá, gặp khách')],
    ['milestone-report', L('週次報告と出張報告', 'Weekly and trip reports', 'Báo cáo tuần, công tác')]] },
  'sales-trips': { k: 'flow', steps: [['roadmap', L('訪問計画', 'Visit plan', 'Kế hoạch gặp khách')], ['checklist', L('出張の承認', 'Trip approval', 'Duyệt công tác')],
    ['interview', L('顧客訪問', 'Client visit', 'Gặp khách')], ['milestone-report', L('出張報告', 'Trip report', 'Báo cáo công tác'), L('3営業日以内', 'Within 3 days', 'Trong 3 ngày'), true]] },
  'sales-pr': { k: 'hub', core: { ic: 'chat-bubbles', chip: 'English' },
    left: [['cand-man', L('ASEAN社員総会', 'ASEAN staff meeting', 'Hội nghị ASEAN')], ['cand-woman', L('各国の同僚', 'Colleagues across ASEAN', 'Đồng nghiệp các nước')]],
    right: [['magnifier', 'PROPAK · VIV ASIA'], ['office-building', 'MYCOM KOREA']] },
  // task lbbd: bỏ vòng số "khoảng 30 buổi họp CRM" (không có trong CV), chỉ còn 4 loại báo cáo / họp
  'sales-reports': { k: 'grid', c: 4, mc: 2, tiles: [['calendar', L('週次の予定と結果', 'Weekly plans and results', 'Kế hoạch, kết quả tuần')], ['milestone-report', L('月次報告', 'Monthly reports', 'Báo cáo tháng')],
    ['roadmap', L('出張報告', 'Trip reports', 'Báo cáo công tác')], ['team-group', L('3拠点合同の朝会', 'Three-site morning meeting', 'Họp sáng 3 chi nhánh')]] },
  'sales-kpi': { k: 'chart', bars: [[52], [38], [66], [48], [80, 1]], cap: L('見積と訪問を記録', 'Quotes and visits logged', 'Ghi báo giá, lượt gặp'),
    left: [['jd-document', L('見積件数', 'Quotations', 'Số báo giá')]],
    right: [['interview', L('訪問回数', 'Client visits', 'Lượt gặp khách')], ['survey-clipboard', L('評価シート', 'Evaluation sheet', 'Phiếu đánh giá')]] },
  'sales-flow': { k: 'flow', steps: [['envelope', L('引き合い受付', 'Enquiry', 'Tiếp nhận yêu cầu')], ['roadmap', L('訪問計画', 'Visit plan', 'Lên lịch gặp')], ['checklist', L('出張申請', 'Trip request', 'Xin công tác')],
    ['jd-document', L('見積の記録', 'Log quotes', 'Ghi báo giá')], ['chat-bubbles', L('見込みの共有', 'Share forecasts', 'Chia sẻ dự báo')], ['milestone-report', L('定例報告', 'Regular reports', 'Báo cáo định kỳ'), null, true]] },
  // Tab Team / AI
  'team-records': { k: 'hub', core: { ic: 'manager', chip: L('役職ごとの記録', 'Role by role', 'Theo từng vai trò') },
    left: [['team-group', L('営業チーム', 'Sales teams', 'Đội kinh doanh')], ['survey-clipboard', L('人事チーム 1→5名', 'HR team 1 → 5', 'Đội nhân sự 1 → 5')]],
    right: [['report-chart', L('KPIとレビュー', 'KPIs and reviews', 'KPI và rà soát')], ['office-building', L('約27名の拠点', 'Branch of about 27', 'Chi nhánh khoảng 27 người')]] },
  'ai-people': { k: 'ring', v: 90, from: 80, p: 90, pre: '80–', suf: '%', small: true, unit: L('情報整理の時間を削減', 'less time organising information', 'thời gian xử lý thông tin giảm'),
    left: [['workflow-gears', L('AIで要約、集計', 'AI: summaries, totals', 'AI: tóm tắt, tổng hợp')], ['jd-document', L('AIで報告書の下書き', 'AI: report drafts', 'AI: nháp báo cáo')]],
    right: [['magnifier', L('原因の分析と判断', 'Root cause, judgement', 'Phân tích, nhận định')], ['interview', L('対話とコーチ', 'Coaching members', 'Kèm cặp thành viên')]] },
};
const STEP = { profile: ['profile', 'projects', 'skillmap', 'career', 'w-mycom', 'w-jil', 'w-it', 'w-early', 'pcai'],
  sales: ['sales-top', 'sales-trips', 'sales-pr', 'sales-reports', 'sales-kpi', 'sales-flow'] };
const stepChip = (id) => { for (const ids of Object.values(STEP)) { const n = ids.indexOf(id); if (n >= 0) return `<span class="gx-step"><i></i><b>${String(n + 1).padStart(2, '0')}</b> / ${String(ids.length).padStart(2, '0')}</span>`; } return ''; };

const tag = ([ic, t], i) => `<span class="gx-tag" style="--i:${i}">${plate(ic, '', 64)}<b class="gx-lb">${T(t)}</b></span>`;
const sides = (s, core) => {
  let i = 1;
  const left = s.left.map((x) => tag(x, i++)).join('');
  const right = (s.right || []).map((x) => tag(x, i++)).join('');
  return `<div class="gx-side gx-side--l">${left}</div>${core}<div class="gx-side gx-side--r">${right}</div>`;
};
function scene(id, s) {
  let body = '';
  if (s.k === 'flow') {
    body = s.steps.map(([ic, t, c, hot], i) => {
      const st = `<div class="gx-st${hot ? ' is-hot' : ''}" style="--i:${i}">${plate(ic)}<b class="gx-lb">${T(t)}</b>${chip(c, hot)}</div>`;
      const ln = i < s.steps.length - 1 ? `<i class="gx-ln" style="--i:${i}"><i class="gx-cm"></i>${s.both ? '<i class="gx-cm gx-cm--r"></i>' : ''}</i>` : '';
      return st + ln;
    }).join('');
  } else if (s.k === 'hub') {
    body = sides(s, `<div class="gx-core"><span class="gx-orb">${plate(s.core.ic, 'gx-pl--l', 132)}</span>${chip(s.core.chip, true)}</div>`);
  } else if (s.k === 'ring') {
    const num = `<b class="gx-num" style="--v:${s.v}${s.from ? `;--n0:${s.from}` : ''}">${s.pre ? `<span class="gx-pfx">${T(s.pre)}</span>` : ''}</b>${s.suf ? `<small class="gx-suf">${s.suf}</small>` : ''}`;
    body = sides(s, `<div class="gx-core"><span class="gx-orb gx-orb--ring"><svg viewBox="0 0 120 120"><circle class="gx-rt" cx="60" cy="60" r="52"/><circle class="gx-rf" pathLength="100" cx="60" cy="60" r="52" style="stroke-dashoffset:${100 - s.p}"/></svg><span class="gx-val${s.small ? ' gx-val--s' : ''}">${s.top ? `<small class="gx-pre">${T(s.top)}</small>` : ''}<span class="gx-vn">${num}</span></span></span><b class="gx-unit">${T(s.unit)}</b></div>`);
  } else if (s.k === 'chart') {
    const lens = `<span class="gx-lens">${img('magnifier', 64)}</span>`;
    const bars = s.bars.map(([h, hot, lb], i) => `<span class="gx-col" style="--h:${h}"><i class="gx-bar${hot ? ' is-hot' : ''}" style="--h:${h};--i:${i}"></i>${lb ? `<b class="gx-lb gx-ax">${lb}</b>` : ''}${hot && s.lens ? lens : ''}</span>`).join('');
    body = sides(s, `<div class="gx-core"><span class="gx-chartc${s.bars.some((b) => b[2]) ? ' has-ax' : ''}">${bars}<i class="gx-sheen"></i></span>${chip(s.cap, true)}</div>`);
  } else if (s.k === 'grid') {
    body = s.tiles.map(([ic, t, c], i) => `<div class="gx-tile" style="--i:${i}">${plate(ic, s.big ? 'gx-pl--m' : '', s.big ? 112 : 88)}${c && typeof c === 'string' ? `<em class="gx-chip gx-no">${c}</em>` : ''}<b class="gx-lb">${T(t)}</b>${c && typeof c !== 'string' ? chip(c) : ''}</div>`).join('');
  }
  const long = s.k === 'flow' && s.steps.length > 4 ? ' gx--long' : '';
  const big = (s.big ? ' gx--big' : '') + (s.chips ? ' gx--chips' : '');
  const cols = s.c ? ` style="--c:${s.c};--mc:${s.mc}"` : '';
  return `<figure class="gx gx--${s.k}${long}${big}${s.both ? ' gx--both' : ''}" aria-hidden="true">${stepChip(id)}<div class="gx-in"${cols}>${body}</div></figure>`;
}

// ── Cảnh nhỏ .gxs (task v3c1) thay 12 hình tĩnh của thẻ kỹ năng + 2 hình đầu tab Team / AI: chỉ dùng icon video assets/gx,
// chuyển động theo cách làm của video (icon bật vào back.out, trôi nổi, nét đứt tự vẽ, sao chổi chạy, vòng quỹ đạo quay, cột mọc).
// k: orbit (lõi + vệ tinh nối nét), flow (3 bước nối nét), wf (workflow 3 bước có nhãn, task m3tn), chart (biểu đồ cột + kính lúp + icon bên). Chip chỉ chữ trung tính (KPI, SOP...).
const SP = {
  // Task m3tn: 6 thẻ kỹ năng tab Team là workflow 3 bước có nhãn (wf), không còn icon to ở giữa / biểu đồ
  't1-targets': { k: 'wf', steps: [['roadmap', L('目標', 'Goals', 'Mục tiêu')], ['team-group', L('役割', 'Roles', 'Vai trò')], ['report-chart', L('KPIと評価', 'KPI review', 'KPI, đánh giá')]] },
  't2-steps': { k: 'wf', steps: [['jd-document', L('書き出す', 'Write out', 'Viết ra')], ['workflow-gears', L('標準化', 'Standardise', 'Chuẩn hóa')], ['checklist', L('完了の定義', 'Define done', 'Định nghĩa xong')]] },
  't3-numbers': { k: 'wf', steps: [['calendar', L('毎日', 'Daily', 'Hằng ngày')], ['stopwatch', L('集計', 'Collect', 'Thu thập')], ['report-chart', L('数字で判断', 'Judge by data', 'Xét bằng số')]] },
  't4-cause': { k: 'wf', steps: [['bottleneck', L('数字が低下', 'Numbers drop', 'Số liệu giảm')], ['magnifier', L('原因分析', 'Find the cause', 'Tìm nguyên nhân')], ['puzzle-fit', L('次の打ち手', 'Next action', 'Bước tiếp')]] },
  't5-people': { k: 'wf', steps: [['survey-clipboard', L('SOPと型', 'SOP, templates', 'SOP, mẫu')], ['interview', L('コーチ', 'Coaching', 'Kèm cặp')], ['checklist', L('振り返り', 'Review', 'Rà soát')]] },
  't6-connect': { k: 'wf', both: true, steps: [['office-building', L('各部門', 'Departments', 'Phòng ban')], ['chat-bubbles', L('調整', 'Coordinate', 'Phối hợp')], ['manager', L('日本語で報告', 'Report in JA', 'Báo cáo tiếng Nhật')]] },
  'a1-read': { k: 'flow', steps: ['jd-document', 'lightbulb', 'milestone-report'], chip: 'AI' },
  'a2-numbers': { k: 'chart', bars: [70, 52, 84, 36, 62], hot: 3, side: ['report-chart', 'shield-check'] },
  'a3-meetings': { k: 'orbit', core: 'calendar', sats: ['chat-bubbles', 'checklist', 'stopwatch'] },
  'a4-hr': { k: 'orbit', core: 'building-blocks', sats: ['survey-clipboard', 'envelope', 'profile-stack'] },
  'a5-recruit': { k: 'flow', steps: ['cv-resume', 'funnel', 'shield-check'], chip: 'JD ✓' },
  'a6-learning': { k: 'orbit', core: 'lightbulb', sats: ['chat-bubbles', 'key', 'puzzle-fit'] },
  // hero-ai: đã xoá theo yêu cầu người vận hành (task 3yar), tab AI không còn hình minh hoạ lớn đầu tab
  // hero-team: đã xoá (task ixrw), đầu tab Team chỉ còn phim workflow, không cấy lại hình kính lớn
};
const r1 = (n) => Math.round(n * 10) / 10;
function spot(key, s) {
  const R = s.hero ? 0.45 : 0.5625;                        // cao / rộng của khung (16:9 thẻ, 20:9 đầu tab)
  const CORE = s.hero ? 17 : 26, SAT = s.hero ? 10.5 : 15;  // cỡ icon theo % bề rộng khung (cqw)
  const at = (x, y, i, inner, cls = '') => `<span class="gxs-at${cls}" style="--x:${r1(x)};--y:${r1(y * R)};--i:${i}">${inner}</span>`;
  const line = (x0, y0, x1, y1, o0, o1, i, both) => {
    const dx = x1 - x0, dy = (y1 - y0) * R, len = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
    return `<i class="gxs-ln" style="--x:${r1(x0)};--y:${r1(y0 * R)};--a:${r1(a)}deg;--o:${r1(o0)}cqw;--l:${r1(len - o0 - o1)}cqw;--i:${i}"><i class="gx-cm"></i>${both ? '<i class="gx-cm gx-cm--r"></i>' : ''}</i>`;
  };
  const chipAt = (x, y, i) => s.chip ? at(x, y, i, `<em class="gx-chip gx-chip--o gxs-chip">${s.chip}</em>`, ' gxs-tx') : '';
  let body = '';
  if (s.k === 'orbit') {
    const P = s.sats.length === 4 ? [[15, 27], [15, 73], [85, 27], [85, 73]] : [[16, 50], [84, 27], [84, 73]];
    body += `<i class="gxs-ring" style="--x:50;--y:${r1(50 * R)};--d:${CORE + 16}"></i>`;
    body += P.map(([x, y], i) => line(x, y, 50, 50, SAT / 2 + 1, CORE / 2 + 3, i + 1)).join('');
    body += at(50, 50, 0, `<span class="gx-orb">${plate(s.core, 'gx-pl--l', 132)}</span>`, ' gxs-core');
    body += s.sats.map((ic, i) => at(P[i][0], P[i][1], i + 1, plate(ic, '', 88))).join('');
    body += chipAt(50, 50 + (CORE / 2 + 7) / (100 * R) * 100, s.sats.length + 1);
  } else if (s.k === 'flow') {
    const X = [18, 50, 82], Y = s.chip ? 44 : 50;
    body += X.slice(0, -1).map((x, i) => line(x, Y, X[i + 1], Y, SAT * 0.7, SAT * 0.7, i, s.both)).join('');
    body += s.steps.map((ic, i) => at(X[i], Y, i, plate(ic, '', 88), i === s.steps.length - 1 ? ' is-hot' : '')).join('');
    body += chipAt(X[1], Y + (SAT / 2 + 6) / (100 * R) * 100, s.steps.length); // chip dưới bước giữa: không bị cắt mép phải ở thẻ hẹp
  } else if (s.k === 'wf') {
    // workflow (task m3tn): 3 bước cỡ thường nối mũi tên, nhãn đánh số dưới mỗi bước, quầng sáng chạy lần lượt qua từng bước
    const X = [17, 50, 83], Y = 36;
    body += X.slice(0, -1).map((x, i) => line(x, Y, X[i + 1], Y, SAT * 0.7, SAT * 0.7, i, s.both)).join('');
    body += s.steps.map(([ic], i) => at(X[i], Y, i, `<i class="gxs-hl"></i>${plate(ic, '', 88)}`, i === s.steps.length - 1 ? ' is-hot' : '')).join('');
    body += s.steps.map(([, t], i) => at(X[i], 79, i, `<b class="gxs-lb"><i>${String(i + 1).padStart(2, '0')}</i>${T(t)}</b>`, ' gxs-lbw')).join('');
  } else if (s.k === 'chart') {
    const bars = s.bars.map((h, i) => `<span class="gx-col" style="--h:${h}"><i class="gx-bar${i === s.hot ? ' is-hot' : ''}" style="--h:${h};--i:${i}"></i>${i === s.hot ? `<span class="gx-lens">${img('magnifier', 64)}</span>` : ''}</span>`).join('');
    body += at(38, 54, 0, `<span class="gx-chartc">${bars}<i class="gx-sheen"></i></span>`, ' gxs-chart');
    body += s.side.map((ic, i) => at(84, i ? 73 : 30, i + 2, plate(ic, '', 88))).join('');
  }
  return `<div class="${s.hero ? '' : 'sv-spot '}gxs gxs--${s.k}${s.hero ? ' gxs--hero' : ''}" data-k="${key}" aria-hidden="true"><div class="gxs-in">${body}</div></div><!--/gxs-->`;
}
const SPOT_CSS = `
/* ── Cảnh nhỏ .gxs (task v3c1): thay hình tĩnh ở thẻ kỹ năng / đầu tab, cùng chất liệu và nhịp chuyển động với video ── */
.gx,.gxs{--gx-blue:#25A1DB;--gx-or:#F47E2A;--gx-ort:#DD6417;--gx-ink:#1E293B;--gx-body:#475569;
  --gx-edge:linear-gradient(135deg,rgba(244,126,42,.55),rgba(255,255,255,.2) 45%,rgba(37,161,219,.6));--gx-card:linear-gradient(180deg,#FFFFFF 0%,#F6F9FC 100%);
  --gx-sh:inset 0 1px 0 rgba(255,255,255,.95),0 1px 2px rgba(15,23,42,.06),0 10px 20px -8px rgba(15,23,42,.14),0 28px 56px -22px rgba(27,127,176,.38),0 22px 44px -30px rgba(244,126,42,.40);
  --gx-back:cubic-bezier(.34,1.56,.64,1);--gx-out:cubic-bezier(.16,1,.3,1);--gx-o3:cubic-bezier(.165,.84,.44,1);--gx-io:cubic-bezier(.645,.045,.355,1)}
.gxs{position:relative;isolation:isolate;overflow:hidden;container-type:inline-size;aspect-ratio:16/9;border:1.5px solid transparent}
.gxs,.sv-spot.gxs{background:radial-gradient(55% 80% at 10% 8%,rgba(37,161,219,.12),transparent 70%) padding-box,radial-gradient(50% 75% at 94% 96%,rgba(244,126,42,.11),transparent 70%) padding-box,var(--gx-card) padding-box,var(--gx-edge) border-box}
.gxs--hero{aspect-ratio:20/9;border-radius:22px;box-shadow:var(--gx-sh)}
.sv-hero:has(>.gxs){background:none;border:0;overflow:visible;box-shadow:none}
.gxs::before{content:'';position:absolute;inset:0;z-index:-1;opacity:.55;background-image:radial-gradient(rgba(100,116,139,.30) 1.2px,transparent 1.3px);background-size:18px 18px;
  -webkit-mask-image:radial-gradient(70% 75% at 50% 50%,#000 30%,transparent 80%);mask-image:radial-gradient(70% 75% at 50% 50%,#000 30%,transparent 80%)}
.gxs-in{position:absolute;inset:0}
.gxs-at{position:absolute;left:calc(var(--x)*1cqw);top:calc(var(--y)*1cqw);transform:translate(-50%,-50%);display:grid;place-items:center}
.gxs .gx-pl{--s:15cqw;border-radius:calc(var(--s)*.28)}
.gxs .gx-pl--l{--s:26cqw}
.gxs--hero .gx-pl{--s:10.5cqw}.gxs--hero .gx-pl--l{--s:17cqw}
.gxs .is-hot>.gx-pl{--s:17cqw;box-shadow:inset 0 2px 1px rgba(255,255,255,.98),inset 0 -10px 16px -8px rgba(244,126,42,.18),0 5px 0 -1px #FBCBA6,0 0 0 5px rgba(244,126,42,.12),var(--gx-sh)}
.gxs .gx-orb::before,.gxs .gx-orb::after{inset:-2cqw}
.gxs-ln{position:absolute;left:calc(var(--x)*1cqw);top:calc(var(--y)*1cqw);width:var(--l);height:2px;margin-top:-1px;transform-origin:0 50%;transform:rotate(var(--a)) translateX(var(--o));
  background:repeating-linear-gradient(90deg,rgba(37,161,219,.6) 0 5px,transparent 5px 11px)}
.gxs-ring{position:absolute;left:calc(var(--x)*1cqw);top:calc(var(--y)*1cqw);width:calc(var(--d)*1cqw);height:calc(var(--d)*1cqw);border-radius:50%;border:1.5px dashed rgba(37,161,219,.45);transform:translate(-50%,-50%)}
.gxs-ring::after{content:'';position:absolute;left:50%;top:-5px;width:9px;height:9px;margin-left:-4.5px;border-radius:50%;background:radial-gradient(circle,#fff 0 22%,#F47E2A 50%,rgba(244,126,42,0) 75%);box-shadow:0 0 10px 3px rgba(244,126,42,.35)}
.gxs-chip{margin:0;font-size:clamp(9px,2.6cqw,12px);white-space:nowrap}
.gxs .gx-chartc{width:50cqw;height:32cqw;gap:2cqw;padding:3cqw 3.4cqw 2.6cqw;border-radius:18px}
.gxs .gx-lens{width:9cqw;height:9cqw;margin-left:-2cqw}
html.js .gxs .gxs-at>.gx-pl,html.js .gxs .gxs-at>.gx-orb,html.js .gxs .gxs-tx>.gx-chip{animation:gxPop .62s var(--gx-back) both;animation-delay:calc(var(--i,0)*.22s + .15s)}
html.js .gxs .gx-pl img{animation:gxFloat 3.4s ease-in-out infinite;animation-delay:calc(var(--i,0)*-.7s)}
html.js .gxs .gxs-ln{animation:gxsDraw .5s var(--gx-io) both;animation-delay:calc(var(--i,0)*.22s + .35s)}
html.js .gxs .gx-cm{animation:gxRun 2.4s cubic-bezier(.45,0,.55,1) infinite;animation-delay:calc(var(--i,0)*.3s + 1s)}
html.js .gxs .gx-cm--r{animation-direction:reverse;animation-delay:calc(var(--i,0)*.3s + 2.2s)}
html.js .gxs .gxs-ring{animation:gxsSpin 18s linear infinite}
html.js .pg.in .sv-ib .sv-ic,html.js .pg.in .lbl .sv-ic{animation:gxsIc 3.6s ease-in-out infinite}
html.js .pg.in .cyc-c:nth-child(3) .sv-ic,html.js .pg.in .card:nth-child(2n) .sv-ic{animation-delay:-1.2s}
html.js .pg.in .cyc-c:nth-child(5) .sv-ic,html.js .pg.in .card:nth-child(3n) .sv-ic{animation-delay:-2.4s}
html.js .gxs:not(.is-in),html.js .gxs:not(.is-in) *,html.js .gxs:not(.is-in) *::before,html.js .gxs:not(.is-in) *::after{animation-play-state:paused!important}
.gxs.is-off *,.gxs.is-off *::before,.gxs.is-off *::after{animation-play-state:paused!important}
@keyframes gxsDraw{0%{opacity:0;transform:rotate(var(--a)) translateX(var(--o)) scaleX(0)}100%{opacity:1;transform:rotate(var(--a)) translateX(var(--o)) scaleX(1)}}
@keyframes gxsSpin{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes gxsIc{0%,100%{transform:translateY(0) rotate(0deg) scale(1)}50%{transform:translateY(-3px) rotate(-4deg) scale(1.06)}}
/* workflow 3 bước (task m3tn): mũi tên ở đầu nét, nhãn đánh số, quầng sáng + nhãn sáng lần lượt bước 1 > 2 > 3 */
.sv-spot.gxs--wf{flex:none} /* thẻ flex cột: không cho khung co theo độ dài chữ (co thì cắt nhãn) */
.gxs--wf .gxs-ln::after{content:'';position:absolute;right:0;top:50%;width:7px;height:7px;margin-top:-4.5px;border:solid rgba(37,161,219,.85);border-width:2px 2px 0 0;transform:rotate(45deg)}
.gxs-hl{position:absolute;left:50%;top:50%;z-index:-1;width:24cqw;height:24cqw;margin:-12cqw 0 0 -12cqw;border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(circle,rgba(244,126,42,0) 40%,rgba(244,126,42,.45) 50%,rgba(244,126,42,.16) 60%,rgba(244,126,42,0) 70%)}
.gxs-lb{position:relative;isolation:isolate;display:block;width:31cqw;box-sizing:border-box;padding:.5em .15em .55em;border-radius:10px;text-align:center;font-weight:700;
  font-size:clamp(9px,3cqw,13px);line-height:1.25;color:var(--gx-ink);background:rgba(255,255,255,.86);box-shadow:0 0 0 1px rgba(37,161,219,.22),0 6px 14px -10px rgba(15,23,42,.35)}
.gxs-lb>i{display:block;font-style:normal;font-size:.78em;letter-spacing:.06em;color:var(--gx-ort);margin-bottom:.1em}
.gxs-lb::before{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;opacity:0;background:linear-gradient(180deg,#FFF4EA,#FFE2CB);box-shadow:0 0 0 1.5px rgba(244,126,42,.55)}
html.js .gxs .gxs-lbw>.gxs-lb{animation:gxPop .62s var(--gx-back) both;animation-delay:calc(var(--i,0)*.22s + .45s)}
html.js .gxs .gxs-hl,html.js .gxs .gxs-lb::before{animation:gxsStep 3.6s ease-in-out infinite;animation-delay:calc(var(--i,0)*1.2s + 1.2s)}
@keyframes gxsStep{0%{opacity:0;transform:scale(.8)}12%{opacity:1;transform:scale(1)}30%{opacity:1;transform:scale(1)}42%{opacity:0;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.gxs *,.gxs *::before,.gxs *::after,.sv-ic{animation:none!important}}
@media print{.gxs{display:none!important}}`;

const CSS = `<style id="gx-css">
/* Cảnh minh hoạ động theo phong cách video GPRFLEXEYE: thẻ trắng viền gradient cam-xanh, bóng 3D, icon 3D kính, lưới chấm, pop back.out, vẽ nét, đếm số */
@property --n{syntax:'<integer>';inherits:false;initial-value:0}
.gx{position:relative;isolation:isolate;overflow:hidden;margin:26px 0 8px;padding:52px 30px 30px;border-radius:28px;border:1.5px solid transparent;
  background:radial-gradient(55% 80% at 10% 8%,rgba(37,161,219,.11),transparent 70%) padding-box,radial-gradient(50% 75% at 94% 96%,rgba(244,126,42,.10),transparent 70%) padding-box,var(--gx-card) padding-box,var(--gx-edge) border-box;
  box-shadow:var(--gx-sh);color:var(--gx-ink);font-family:'Manrope','Noto Sans JP',sans-serif}
.gx::before{content:'';position:absolute;inset:0;z-index:-1;opacity:.55;background-image:radial-gradient(rgba(100,116,139,.30) 1.2px,transparent 1.3px);background-size:22px 22px;
  -webkit-mask-image:radial-gradient(70% 75% at 50% 50%,#000 30%,transparent 80%);mask-image:radial-gradient(70% 75% at 50% 50%,#000 30%,transparent 80%)}
.gx::after{content:'';position:absolute;z-index:-1;left:58%;top:-45%;width:320px;height:320px;border-radius:50%;background:radial-gradient(closest-side,rgba(92,196,240,.16),transparent);pointer-events:none}
.gx-step{position:absolute;left:18px;top:14px;display:inline-flex;align-items:center;gap:8px;height:26px;padding:0 12px 0 10px;border-radius:13px;border:1px solid transparent;
  background:linear-gradient(#fff,#F6F9FC) padding-box,var(--gx-edge) border-box;box-shadow:0 6px 14px -8px rgba(27,127,176,.35);font:600 11px/1 'Space Grotesk',sans-serif;letter-spacing:.14em;color:#64748B}
.gx-step i{width:7px;height:7px;border-radius:50%;background:var(--gx-blue);box-shadow:0 0 0 3px rgba(37,161,219,.15)}
.gx-step b{color:var(--gx-ort);font-weight:700}
.gx-in{position:relative}
/* Đế icon 3D: mặt kính trắng, mép xanh, vệt bóng trên, bóng xanh + cam */
.gx-pl{--s:76px;position:relative;flex:none;display:grid;place-items:center;width:var(--s);height:var(--s);border-radius:calc(var(--s)*.28);border:1.5px solid transparent;
  background:radial-gradient(120% 55% at 50% 0%,rgba(255,255,255,.9),transparent 62%) padding-box,linear-gradient(165deg,#EEF7FD 0%,#FFF 56%,#F6F9FC) padding-box,var(--gx-edge) border-box;
  box-shadow:inset 0 2px 1px rgba(255,255,255,.98),inset 0 -10px 16px -8px rgba(27,127,176,.16),0 5px 0 -1px #CBE5F6,var(--gx-sh)}
.gx-pl img{display:block;width:84%;height:84%;object-fit:contain;filter:drop-shadow(0 10px 12px rgba(27,127,176,.24)) drop-shadow(0 4px 5px rgba(244,126,42,.16))}
.gx-pl--l{--s:112px}
.gx-pl.gx-pl--logo{width:calc(var(--s)*1.55);background:#fff padding-box,var(--gx-edge) border-box}
.gx-pl--logo img{width:80%;height:62%;filter:none}
.gx-pl--m{--s:84px}
.is-hot>.gx-pl{box-shadow:inset 0 2px 1px rgba(255,255,255,.98),inset 0 -10px 16px -8px rgba(244,126,42,.18),0 5px 0 -1px #FBCBA6,0 0 0 5px rgba(244,126,42,.12),var(--gx-sh)}
.gx-lb{display:block;margin-top:10px;font:700 12.5px/1.4 'Manrope','Noto Sans JP',sans-serif;color:var(--gx-ink);text-align:center;word-break:keep-all;overflow-wrap:anywhere}
.gx-chip{display:inline-flex;align-items:center;margin-top:7px;padding:3px 10px;border-radius:999px;border:1px solid transparent;font:700 10.5px/1.35 'Space Grotesk','Noto Sans JP',sans-serif;letter-spacing:.04em;font-style:normal;
  color:var(--gx-ort);background:linear-gradient(#fff,#fff) padding-box,var(--gx-edge) border-box;white-space:nowrap}
.gx-chip--o{color:#fff;border:0;padding:4px 11px;background:linear-gradient(135deg,#EE7A2C 0%,#D9631A 52%,#C2520F 100%);text-shadow:0 1px 1px rgba(110,40,0,.35);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 16px -8px rgba(217,99,26,.6)}
/* flow: các bước nối bằng nét đứt, sao chổi cam chạy dọc */
.gx--flow .gx-in{display:flex;align-items:flex-start;justify-content:center}
.gx-st{flex:0 1 132px;min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center}
.gx-ln{position:relative;flex:1 1 40px;min-width:16px;max-width:130px;height:2px;margin-top:37px;border-radius:2px;transform-origin:0 50%;
  background:repeating-linear-gradient(90deg,rgba(37,161,219,.6) 0 6px,transparent 6px 13px)}
.gx-cm{position:absolute;inset:0;opacity:0}
.gx-cm::before{content:'';position:absolute;left:0;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:radial-gradient(circle,#fff 0 22%,#F47E2A 46%,rgba(244,126,42,0) 72%);box-shadow:0 0 14px 4px rgba(244,126,42,.4)}
.gx-cm--r::before{background:radial-gradient(circle,#fff 0 22%,#25A1DB 46%,rgba(37,161,219,0) 72%);box-shadow:0 0 14px 4px rgba(37,161,219,.4)}
/* hub / ring / chart: lõi ở giữa, thẻ nhãn hai bên nối bằng nét đứt */
.gx--hub .gx-in,.gx--ring .gx-in,.gx--chart .gx-in{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;column-gap:64px}
.gx-side{display:flex;flex-direction:column;gap:16px;min-width:0}
.gx-side--l{align-items:flex-end}
.gx-side--r{align-items:flex-start}
.gx-tag{position:relative;display:flex;align-items:center;gap:10px;max-width:260px;padding:7px 14px 7px 7px;border-radius:18px;border:1.5px solid transparent;
  background:var(--gx-card) padding-box,var(--gx-edge) border-box;box-shadow:var(--gx-sh)}
.gx-tag .gx-pl{--s:46px;border-radius:14px}
.gx-tag .gx-lb{margin:0;text-align:left;font-size:12.5px}
.gx-tag::after{content:'';position:absolute;top:50%;width:52px;height:2px;margin-top:-1px;background:repeating-linear-gradient(90deg,rgba(37,161,219,.55) 0 5px,transparent 5px 11px)}
.gx-side--l .gx-tag::after{left:100%;margin-left:6px;transform-origin:100% 50%}
.gx-side--r .gx-tag::after{right:100%;margin-right:6px;transform-origin:0 50%}
.gx-core{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center}
.gx-orb{position:relative;display:grid;place-items:center}
.gx-orb::before,.gx-orb::after{content:'';position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(244,126,42,.45);box-shadow:0 0 22px rgba(244,126,42,.25),inset 0 0 18px rgba(244,126,42,.2);opacity:0;pointer-events:none}
.gx-core>.gx-chip{margin-top:14px}
.gx-orb--ring{width:136px;height:136px}
.gx-orb--ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);overflow:visible}
.gx-rt{fill:#fff;stroke:#E2E8F0;stroke-width:9;filter:drop-shadow(0 10px 14px rgba(27,127,176,.18))}
.gx-rf{fill:none;stroke:url(#gxRingG);stroke-width:9;stroke-linecap:round;stroke-dasharray:100 100}
.gx-val{position:relative;display:flex;flex-direction:column;align-items:center;max-width:112px}
.gx-vn{display:flex;align-items:baseline;justify-content:center}
.gx-pre{margin-bottom:2px;font:700 11px/1.2 'Manrope','Noto Sans JP',sans-serif;color:var(--gx-ort)}
.gx-val--s .gx-num{font-size:31px}.gx-val--s .gx-suf{font-size:15px}
.gx-num{counter-reset:n var(--n);--n:var(--v);font:700 44px/1 'Space Grotesk',sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.02em;white-space:nowrap;
  background:linear-gradient(180deg,#FBA65A 0%,#F47E2A 55%,#E0661A 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 10px rgba(244,126,42,.25))}
.gx-num::after{content:counter(n)}
.gx-pfx{font-size:.62em}
.gx-suf{font:700 20px/1 'Space Grotesk',sans-serif;color:var(--gx-or)}
.gx-unit{display:block;max-width:190px;margin-top:12px;font:700 12.5px/1.4 'Manrope','Noto Sans JP',sans-serif;color:var(--gx-body)}
.gx-chartc{position:relative;display:flex;align-items:flex-end;gap:12px;width:230px;height:140px;padding:18px 20px 16px;border-radius:22px;border:1.5px solid transparent;
  background:repeating-linear-gradient(180deg,transparent 0 26px,rgba(226,232,240,.8) 26px 27px) padding-box,var(--gx-card) padding-box,var(--gx-edge) border-box;box-shadow:var(--gx-sh)}
.gx-chartc.has-ax{padding-bottom:30px}
.gx-col{position:relative;flex:1;height:100%;display:flex;align-items:flex-end}
.gx-bar{display:block;width:100%;height:calc(var(--h)*1%);border-radius:8px 8px 3px 3px;transform-origin:50% 100%;
  background:linear-gradient(180deg,#5CC4F0 0%,#25A1DB 55%,#1B7FB0 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 8px 14px -8px rgba(27,127,176,.6)}
.gx-bar.is-hot{background:linear-gradient(180deg,#FBA65A 0%,#F47E2A 55%,#E0661A 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 10px 18px -8px rgba(221,100,23,.7)}
.gx-ax{position:absolute;left:0;right:0;top:100%;margin-top:6px;font:700 11px/1 'Space Grotesk',sans-serif;color:#64748B}
.gx-sheen{position:absolute;inset:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.gx-sheen::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.75) 50%,transparent 65%);transform:translateX(-130%)}
.gx-lens{position:absolute;left:50%;bottom:calc(var(--h)*1% + 2px);width:46px;height:46px;margin-left:-12px}
.gx-lens img{width:100%;height:100%;filter:drop-shadow(0 10px 12px rgba(27,127,176,.3))}
/* grid: thẻ lật vào lần lượt, vệt sáng lướt qua */
.gx--grid .gx-in{display:grid;grid-template-columns:repeat(var(--c,4),minmax(0,1fr));gap:14px;perspective:1200px}
.gx--big .gx-in{gap:18px}
.gx-tile{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0;padding:14px 10px 14px;border-radius:22px;border:1.5px solid transparent;
  background:var(--gx-card) padding-box,var(--gx-edge) border-box;box-shadow:var(--gx-sh);transform-origin:50% 100%}
.gx-tile .gx-pl{--s:60px}
.gx--grid:not(.gx--big) .gx-tile{padding:14px 4px}
.gx-tile .gx-pl--m{--s:84px}
.gx-tile::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.8) 50%,transparent 65%);transform:translateX(-130%)}
.gx-no{margin-top:10px}
.gx--big .gx-lb{font-size:13.5px}
/* chips (task d704): ô ngang icon trái + nhãn phải, nhãn 1 dòng không ngắt giữa từ, cùng nhịp với thẻ nhãn .gx-tag */
.gx.gx--chips{padding-left:22px;padding-right:22px;container-type:inline-size}
.gx--chips .gx-in{gap:10px}
.gx--grid.gx--chips:not(.gx--big) .gx-tile{flex-direction:row;align-items:center;gap:8px;padding:8px 10px 8px 8px;border-radius:16px;text-align:left}
.gx--chips .gx-tile .gx-pl{--s:38px;border-radius:12px}
.gx--chips .gx-lb{min-width:0;margin:0;text-align:left;font-size:12px;line-height:1.3;white-space:nowrap;overflow-wrap:normal}
/* khung hẹp (theo bề rộng chính cảnh, không theo màn hình): 4 cột không đủ chỗ cho nhãn ⇒ 2 cột; rất hẹp ⇒ icon trên, nhãn dưới */
@container (max-width:600px){.gx--chips .gx-in{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container (max-width:380px){.gx.gx--grid.gx--chips:not(.gx--big) .gx-tile{flex-direction:column;gap:4px;padding:8px 6px}.gx.gx--chips .gx-tile .gx-pl{--s:34px;border-radius:11px}.gx.gx--chips .gx-lb{text-align:center;font-size:11px}}
/* ── Chuyển động (chỉ khi có JS; chờ is-in mới chạy, ra khỏi màn hình thì dừng) ── */
html.js .gx::after{animation:gxDrift 16s ease-in-out infinite alternate}
html.js .gx .gx-step{animation:gxSlide .5s var(--gx-o3) both}
html.js .gx-st .gx-pl,html.js .gx-orb,html.js .gx-tag .gx-pl{animation:gxPop .62s var(--gx-back) both;animation-delay:calc(var(--i,0)*.26s + .1s)}
html.js .gx-orb .gx-pl img,html.js .gx-st .gx-pl img{animation:gxFloat 3.4s ease-in-out infinite;animation-delay:calc(var(--i,0)*-.7s)}
html.js .gx-st .gx-lb,html.js .gx-st .gx-chip,html.js .gx-core>.gx-chip,html.js .gx-unit{animation:gxRise .5s var(--gx-o3) both;animation-delay:calc(var(--i,0)*.26s + .32s)}
html.js .gx-ln{animation:gxDraw .5s var(--gx-io) both;animation-delay:calc(var(--i)*.26s + .3s)}
html.js .gx-cm{animation:gxRun 2.6s cubic-bezier(.45,0,.55,1) infinite;animation-delay:calc(var(--i)*.26s + .9s)}
html.js .gx-cm--r{animation-direction:reverse;animation-delay:calc(var(--i)*.26s + 2.2s)}
html.js .gx-tag{animation:gxRise .55s var(--gx-o3) both;animation-delay:calc(var(--i)*.16s + .35s)}
html.js .gx-tag::after{animation:gxDraw .45s var(--gx-io) both;animation-delay:calc(var(--i)*.16s + .55s)}
html.js .gx-orb::before{animation:gxPulse 2.8s var(--gx-o3) infinite;animation-delay:1s}
html.js .gx-orb::after{animation:gxPulse 2.8s var(--gx-o3) infinite;animation-delay:2.4s}
html.js .gx-orb--ring::before,html.js .gx-orb--ring::after{inset:-8px}
html.js .gx-rf{animation:gxRing 1.6s var(--gx-o3) .35s both}
html.js .gx-num{animation:gxCount 1.6s var(--gx-o3) .35s both}
html.js .gx-chartc{animation:gxPop .6s var(--gx-back) .1s both}
html.js .gx-bar{animation:gxGrow .7s var(--gx-back) both;animation-delay:calc(var(--i)*.12s + .4s)}
html.js .gx-sheen::after{animation:gxGloss 5.5s var(--gx-io) 1.6s infinite}
html.js .gx-lens{animation:gxPop .6s var(--gx-back) 1.2s both}
html.js .gx-lens img{animation:gxBob 3s ease-in-out 1.8s infinite}
html.js .gx-tile{animation:gxFlip .8s var(--gx-out) both;animation-delay:calc(var(--i)*.12s + .1s)}
html.js .gx-tile::after{animation:gxGloss 6s var(--gx-io) infinite;animation-delay:calc(var(--i)*.35s + 1.4s)}
html.js .gx:not(.is-in),html.js .gx:not(.is-in) *,html.js .gx:not(.is-in)::after,html.js .gx:not(.is-in) *::before,html.js .gx:not(.is-in) *::after{animation-play-state:paused!important}
.gx.is-off *,.gx.is-off::after,.gx.is-off *::before,.gx.is-off *::after{animation-play-state:paused!important}
@keyframes gxPop{0%{opacity:0;transform:scale(.4) rotate(-8deg)}35%{opacity:1}100%{opacity:1;transform:none}}
@keyframes gxRise{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:none}}
@keyframes gxSlide{0%{opacity:0;transform:translateX(-24px)}100%{opacity:1;transform:none}}
@keyframes gxDraw{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}
@keyframes gxGrow{0%{transform:scaleY(0)}100%{transform:scaleY(1)}}
@keyframes gxFlip{0%{opacity:0;transform:rotateX(-65deg) translateY(30px)}30%{opacity:1}100%{opacity:1;transform:none}}
@keyframes gxRing{0%{stroke-dashoffset:100}}
@keyframes gxCount{0%{--n:var(--n0,0)}}
@keyframes gxFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-4px) rotate(1deg)}}
@keyframes gxBob{0%,100%{transform:translate(0,0) rotate(-6deg)}50%{transform:translate(-4px,-5px) rotate(4deg)}}
@keyframes gxRun{0%{opacity:0;transform:translateX(0)}12%{opacity:1}88%{opacity:1}100%{opacity:0;transform:translateX(100%)}}
@keyframes gxPulse{0%{opacity:.9;transform:scale(.72)}100%{opacity:0;transform:scale(1.35)}}
@keyframes gxGloss{0%{transform:translateX(-130%)}22%,100%{transform:translateX(130%)}}
@keyframes gxDrift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(-90px,50px) scale(1.14)}}
@media screen and (max-width:900px){.gx--hub .gx-in,.gx--ring .gx-in,.gx--chart .gx-in{column-gap:40px}.gx-tag::after{width:30px}}
@media screen and (max-width:600px){
  .gx{margin-top:20px;padding:46px 12px 18px;border-radius:20px}
  .gx-pl{--s:52px}.gx-pl--l{--s:84px}.gx-tile .gx-pl--m{--s:64px}
  .gx-lb{margin-top:7px;font-size:10.5px}.gx-chip{padding:2px 7px;font-size:9.5px;white-space:normal}
  .gx--flow .gx-in{align-items:flex-start}.gx-ln{min-width:6px;margin-top:25px}
  .gx--long .gx-in{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 8px}.gx--long .gx-ln{display:none}
  .gx--hub .gx-in,.gx--ring .gx-in,.gx--chart .gx-in{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px 10px}
  .gx-core{grid-column:1/-1;order:-1}.gx-side{gap:10px}.gx-side--l,.gx-side--r{align-items:stretch}
  .gx-tag{max-width:none;padding:6px 8px 6px 6px;gap:7px;border-radius:14px}.gx-tag .gx-pl{--s:38px;border-radius:11px}.gx-tag .gx-lb{font-size:10.5px}.gx-tag::after{display:none}
  .gx-orb--ring{width:116px;height:116px}.gx-num{font-size:36px}.gx-val--s .gx-num{font-size:26px}.gx-val--s .gx-suf{font-size:13px}.gx-unit{margin-top:8px;font-size:11px}
  .gx-chartc{width:210px;height:120px}.gx--grid .gx-in{grid-template-columns:repeat(var(--mc,3),minmax(0,1fr));gap:8px}
  .gx-tile{padding:10px 4px;border-radius:16px}.gx-tile .gx-pl{--s:46px}.gx--big .gx-lb{font-size:10.5px}
  .gx.gx--chips{padding-left:12px;padding-right:12px}.gx--grid.gx--chips:not(.gx--big) .gx-tile{gap:7px;padding:6px 8px 6px 6px;border-radius:14px}.gx--chips .gx-tile .gx-pl{--s:32px;border-radius:10px}.gx--chips .gx-lb{font-size:11.5px}
  .gx-step{left:12px;top:12px}
}
@media (prefers-reduced-motion:reduce){.gx *,.gx *::before,.gx *::after{animation:none!important}.gx::after{animation:none!important}}
@media print{.gx{display:none!important}}${SPOT_CSS}
</style>`;
const JS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="gxRingG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBA65A"/><stop offset=".55" stop-color="#F47E2A"/><stop offset="1" stop-color="#25A1DB"/></linearGradient></defs></svg>
<script id="gx-js">
(function(){
  var fs=[].slice.call(document.querySelectorAll('.gx,.gxs'));if(!fs.length)return;
  if(!('IntersectionObserver' in window)){fs.forEach(function(f){f.classList.add('is-in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var f=e.target;
    if(e.isIntersecting&&e.intersectionRatio>=.2)f.classList.add('is-in');
    f.classList.toggle('is-off',!e.isIntersecting)})},{threshold:[0,.2]});
  fs.forEach(function(f){io.observe(f)});
})();
</script>`;

// ── Chèn vào index.html (gỡ bản cũ trước, nên chạy lại không nhân đôi; giữ kiểu xuống dòng của file) ──
let html = readFileSync(file, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
html = html.replace(/\r?\n[ \t]*<figure class="gx [\s\S]*?<\/figure>/g, '');
html = html.replace(/<!-- gx-css:start -->[\s\S]*?<!-- gx-css:end -->\r?\n/, '').replace(/<!-- gx:start -->[\s\S]*?<!-- gx:end -->\r?\n/, '');
const HEAD = /^\s*(<(p|span|h2|div) class="(colg|eb|kw|kw-en|kwbar|kw-sub|deco)[ "]|$)/;
for (const [id, s] of Object.entries(S)) {
  const lines = html.split(/\r?\n/);
  const at = lines.findIndex((l) => l.startsWith('<section ') && l.includes(` id="${id}"`));
  if (at < 0) throw new Error('không thấy section ' + id);
  let j = at + 1;
  while (j < lines.length && HEAD.test(lines[j])) j++;
  let k = j; while (k > at + 1 && lines[k - 1].trim() === '') k--; // cảnh dính ngay dưới tiêu đề
  lines.splice(k, 0, '  ' + scene(id, s));
  html = lines.join(EOL);
}
// Cảnh nhỏ .gxs: lần đầu thay <img> tĩnh assets/skills/<key>.webp, các lần sau thay chính cảnh cũ (đánh dấu data-k ... <!--/gxs-->)
for (const [key, s] of Object.entries(SP)) {
  const re = new RegExp(`<img (?:class="sv-spot" )?src="assets/skills/${key}\\.webp"[^>]*>|<div class="[^"]*\\bgxs\\b[^"]*" data-k="${key}"[\\s\\S]*?<!--/gxs-->`, 'g');
  const n = (html.match(re) || []).length;
  if (n !== 1) throw new Error(`gxs ${key}: cần đúng 1 chỗ, thấy ${n}`);
  html = html.replace(re, () => spot(key, s));
}
const fix = (t) => t.replace(/\r?\n/g, EOL);
const head = html.indexOf('</head>');
if (head < 0) throw new Error('không thấy </head>');
html = html.slice(0, head) + '<!-- gx-css:start -->' + EOL + fix(CSS) + EOL + '<!-- gx-css:end -->' + EOL + html.slice(head);
const anchor = html.search(/<script>\r?\n\(function\(\)\{\r?\n  var pages=document\.querySelectorAll\('\.pg'\);/);
if (anchor < 0) throw new Error('không thấy chỗ chèn JS');
html = html.slice(0, anchor) + '<!-- gx:start -->' + EOL + fix(JS) + EOL + '<!-- gx:end -->' + EOL + html.slice(anchor);
writeFileSync(file, html);
console.log("gx: đã chèn", Object.keys(S).length, "cảnh +", Object.keys(SP).length, "cảnh nhỏ .gxs");
