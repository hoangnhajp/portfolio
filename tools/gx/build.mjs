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
const plate = (n, cls = '', s) => `<span class="gx-pl${cls ? ' ' + cls : ''}">${img(n, s)}</span>`;
const chip = (t, o) => t ? `<em class="gx-chip${o ? ' gx-chip--o' : ''}">${T(t)}</em>` : '';

// ── Dữ liệu cảnh (chỉ dùng dữ kiện đã có trong chữ của chính section) ──
const S = {
  // Tab Profile
  profile: { k: 'hub', core: { ic: 'briefcase', chip: L('日系企業で約11年', 'About 11 years at Japanese firms', 'Khoảng 11 năm ở công ty Nhật') },
    left: [['handshake', L('B2B営業', 'B2B sales', 'Bán hàng B2B')], ['team-group', L('営業管理', 'Sales management', 'Quản lý kinh doanh')]],
    right: [['chat-bubbles', L('ITコミュニケーター', 'IT communication', 'Cầu nối IT')], ['survey-clipboard', L('人事', 'HR', 'Nhân sự')]] },
  projects: { k: 'grid', c: 8, mc: 4, tiles: [['manager', L('管理', 'Management', 'Quản lý')], ['handshake', L('営業', 'Sales', 'Kinh doanh')], ['jd-document', L('マーケティング', 'Marketing', 'Marketing')],
    ['report-chart', L('分析', 'Analysis', 'Phân tích')], ['workflow-gears', L('業務調整', 'Operations', 'Điều phối')], ['team-group', L('人事', 'HR', 'Nhân sự')],
    ['chat-bubbles', L('語学', 'Languages', 'Ngoại ngữ')], ['lightbulb', L('AI活用', 'AI projects', 'Dự án AI')]] },
  skillmap: { k: 'ring', v: 10, p: 100, unit: L('のスキル', 'skills', 'kỹ năng'),
    left: [['handshake', L('法人顧客対応', 'B2B client work', 'Khách doanh nghiệp')], ['workflow-gears', L('ITプロジェクト', 'IT projects', 'Dự án IT')]],
    right: [['team-group', L('チーム管理', 'Team management', 'Quản lý đội')], ['lightbulb', L('AI活用', 'Using AI', 'Ứng dụng AI')]] },
  career: { k: 'flow', steps: [['office-building', L('銀行', 'Bank', 'Ngân hàng'), '2011'], ['briefcase', 'Isuzu', '2015'], ['chat-bubbles', 'JILNESTA', '2017'], ['workflow-gears', 'MAYEKAWA', '2022']] },
  'w-mycom': { k: 'hub', core: { ic: 'handshake', chip: 'MAYEKAWA' },
    left: [['jd-document', L('設備の提案', 'Equipment proposals', 'Đề xuất thiết bị')], ['workflow-gears', L('技術者と連携', 'With engineers', 'Cùng kỹ sư')]],
    right: [['shield-check', L('納品後のフォロー', 'After-sales follow-up', 'Theo sát sau bàn giao')], ['team-group', L('人事チーム 1→5名', 'HR team 1 → 5', 'Đội nhân sự 1 → 5')]] },
  'w-jil': { k: 'ring', v: 27, p: 100, top: L('約', 'about', 'khoảng'), unit: L('名の拠点', 'staff at the branch', 'người ở chi nhánh'),
    left: [['team-group', L('営業 4〜5名', '4 to 5 in sales', '4–5 kinh doanh')], ['workflow-gears', L('開発 約20名', 'About 20 developers', 'Khoảng 20 lập trình viên')]],
    right: [['calendar', L('定期レビュー', 'Regular reviews', 'Rà soát định kỳ')], ['handshake', L('契約更新', 'Contract renewals', 'Gia hạn hợp đồng')]] },
  'w-it': { k: 'flow', both: true, steps: [['office-building', L('日本の顧客', 'Japanese clients', 'Khách hàng Nhật')], ['chat-bubbles', L('通訳と翻訳', 'Interpreting', 'Phiên dịch'), 'JA · EN · VI', true], ['workflow-gears', L('ベトナム人技術者', 'Vietnamese engineers', 'Kỹ sư Việt Nam')]] },
  'w-early': { k: 'chart', bars: [[46], [70], [38], [62], [84, 1]], cap: L('数字で報告', 'Reports with numbers', 'Báo cáo bằng số liệu'),
    left: [['office-building', L('国際送金', 'International payments', 'Thanh toán quốc tế')], ['briefcase', L('部品の営業事務', 'Parts sales admin', 'Hành chính bán phụ tùng')]],
    right: [['manager', L('日本人上司へ報告', 'Reporting to Japanese managers', 'Báo cáo cấp trên người Nhật')]] },
  pcai: { k: 'hub', core: { ic: 'lightbulb', chip: 'AI' },
    left: [['chat-bubbles', L('日本語 N2', 'Japanese N2', 'Tiếng Nhật N2')], ['jd-document', L('英語 TOEIC 680', 'English TOEIC 680', 'Tiếng Anh TOEIC 680')]],
    right: [['person-bust', L('ベトナム語 母語', 'Vietnamese, native', 'Tiếng Việt bản ngữ')], ['team-group', L('1人で3〜4人分', 'One person, work of 3 to 4', '1 người, việc của 3–4 người')]] },
  aiops: { k: 'flow', steps: [['survey-clipboard', L('工程の標準化', 'Standard steps', 'Chuẩn hoá quy trình')], ['milestone-report', L('日次報告', 'Daily reports', 'Báo cáo hằng ngày')],
    ['lightbulb', L('Claudeで分析', 'Analysis with Claude', 'Phân tích bằng Claude')], ['checklist', L('毎日の確認', 'Daily checks', 'Kiểm tra hằng ngày'), null, true]] },
  aidash: { k: 'chart', bars: [[92, 0, 'A'], [85, 0, 'B'], [78, 0, 'C'], [64, 1, 'D'], [88, 0, 'E']], lens: true, cap: L('担当D：滞留3日', 'Owner D: stalled 3 days', 'Người D: tồn 3 ngày'),
    left: [['milestone-report', L('日次報告', 'Daily reports', 'Báo cáo hằng ngày')]],
    right: [['bottleneck', L('滞留を見つける', 'Spot stalled work', 'Tìm việc bị tồn')], ['checklist', L('朝のうちに対応', 'Act the same morning', 'Xử lý ngay buổi sáng')]] },
  pr: { k: 'grid', c: 3, mc: 3, big: true, tiles: [['chat-bubbles', L('日本とベトナムをつなぐ', 'Bridging Japan and Vietnam', 'Kết nối Nhật – Việt'), '01'],
    ['puzzle-fit', L('課題を聞き、解決まで進める', 'From client issue to solution', 'Từ vấn đề đến giải pháp'), '02'],
    ['jd-document', L('資料を作り、教えて定着させる', 'Clear materials, lasting training', 'Tài liệu rõ, đào tạo đến nơi'), '03']] },
  // Tab Sales
  'sales-top': { k: 'grid', c: 4, mc: 2, tiles: [['roadmap', L('出張', 'Trips', 'Công tác'), L('5省13社', '5 provinces, 13 firms', '5 tỉnh, 13 công ty')],
    ['calendar', L('週次CRM会議', 'Weekly CRM meetings', 'Họp CRM hằng tuần')], ['report-chart', L('見積と訪問の集計', 'Quote and visit KPIs', 'KPI báo giá, gặp khách')],
    ['milestone-report', L('週次報告と出張報告', 'Weekly and trip reports', 'Báo cáo tuần, công tác')]] },
  'sales-trips': { k: 'flow', steps: [['roadmap', L('訪問計画', 'Visit plan', 'Kế hoạch gặp khách')], ['checklist', L('出張の承認', 'Trip approval', 'Duyệt công tác')],
    ['interview', L('顧客訪問', 'Client visit', 'Gặp khách')], ['milestone-report', L('出張報告', 'Trip report', 'Báo cáo công tác'), L('3営業日以内', 'Within 3 days', 'Trong 3 ngày'), true]] },
  'sales-pr': { k: 'hub', core: { ic: 'chat-bubbles', chip: 'English' },
    left: [['cand-man', L('ASEAN社員総会', 'ASEAN staff meeting', 'Hội nghị ASEAN')], ['cand-woman', L('各国の同僚', 'Colleagues across ASEAN', 'Đồng nghiệp các nước')]],
    right: [['magnifier', 'PROPAK · VIV ASIA'], ['office-building', 'MYCOM KOREA']] },
  'sales-reports': { k: 'ring', v: 30, p: 100, top: L('約', 'about', 'khoảng'), unit: L('回の週次CRM会議', 'weekly CRM meetings', 'buổi họp CRM tuần'),
    left: [['calendar', L('週次の予定と結果', 'Weekly plans and results', 'Kế hoạch, kết quả tuần')], ['milestone-report', L('月次報告', 'Monthly reports', 'Báo cáo tháng')]],
    right: [['roadmap', L('出張報告', 'Trip reports', 'Báo cáo công tác')], ['team-group', L('3拠点合同の朝会', 'Three-site morning meeting', 'Họp sáng 3 chi nhánh')]] },
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
const STEP = { profile: ['profile', 'projects', 'skillmap', 'career', 'w-mycom', 'w-jil', 'w-it', 'w-early', 'pcai', 'aiops', 'aidash', 'pr'],
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
  const big = s.big ? ' gx--big' : '';
  const cols = s.c ? ` style="--c:${s.c};--mc:${s.mc}"` : '';
  return `<figure class="gx gx--${s.k}${long}${big}${s.both ? ' gx--both' : ''}" aria-hidden="true">${stepChip(id)}<div class="gx-in"${cols}>${body}</div></figure>`;
}

const CSS = `<style id="gx-css">
/* Cảnh minh hoạ động theo phong cách video GPRFLEXEYE: thẻ trắng viền gradient cam-xanh, bóng 3D, icon 3D kính, lưới chấm, pop back.out, vẽ nét, đếm số */
@property --n{syntax:'<integer>';inherits:false;initial-value:0}
.gx{--gx-blue:#25A1DB;--gx-or:#F47E2A;--gx-ort:#DD6417;--gx-ink:#1E293B;--gx-body:#475569;
  --gx-edge:linear-gradient(135deg,rgba(244,126,42,.55),rgba(255,255,255,.2) 45%,rgba(37,161,219,.6));
  --gx-card:linear-gradient(180deg,#FFFFFF 0%,#F6F9FC 100%);
  --gx-sh:inset 0 1px 0 rgba(255,255,255,.95),0 1px 2px rgba(15,23,42,.06),0 10px 20px -8px rgba(15,23,42,.14),0 28px 56px -22px rgba(27,127,176,.38),0 22px 44px -30px rgba(244,126,42,.40);
  --gx-back:cubic-bezier(.34,1.56,.64,1);--gx-out:cubic-bezier(.16,1,.3,1);--gx-o3:cubic-bezier(.165,.84,.44,1);--gx-io:cubic-bezier(.645,.045,.355,1);
  position:relative;isolation:isolate;overflow:hidden;margin:26px 0 8px;padding:52px 30px 30px;border-radius:28px;border:1.5px solid transparent;
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
  .gx-step{left:12px;top:12px}
}
@media (prefers-reduced-motion:reduce){.gx *,.gx *::before,.gx *::after{animation:none!important}.gx::after{animation:none!important}}
@media print{.gx{display:none!important}}
</style>`;
const JS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="gxRingG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FBA65A"/><stop offset=".55" stop-color="#F47E2A"/><stop offset="1" stop-color="#25A1DB"/></linearGradient></defs></svg>
<script id="gx-js">
(function(){
  var fs=[].slice.call(document.querySelectorAll('.gx'));if(!fs.length)return;
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
const HEAD = /^\s*(<(p|span|h2|div) class="(eb|kw|kw-en|kwbar|kw-sub|deco)[ "]|$)/;
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
const fix = (t) => t.replace(/\r?\n/g, EOL);
const head = html.indexOf('</head>');
if (head < 0) throw new Error('không thấy </head>');
html = html.slice(0, head) + '<!-- gx-css:start -->' + EOL + fix(CSS) + EOL + '<!-- gx-css:end -->' + EOL + html.slice(head);
const anchor = html.search(/<script>\r?\n\(function\(\)\{\r?\n  var pages=document\.querySelectorAll\('\.pg'\);/);
if (anchor < 0) throw new Error('không thấy chỗ chèn JS');
html = html.slice(0, anchor) + '<!-- gx:start -->' + EOL + fix(JS) + EOL + '<!-- gx:end -->' + EOL + html.slice(anchor);
writeFileSync(file, html);
console.log('gx: đã chèn', Object.keys(S).length, 'cảnh');
