// Task wp5x: sinh tab "JD ANDPAD" vào index.html của repo (chạy lại được, idempotent).
// Chèn / thay 5 chỗ: khối CSS jd-css (ngay trước </head>, tức sau sw-css), link menu trên + sidebar (trước tab sw), main jd (trước main sw),
// id vào mảng IDS của pganh. Nguyên văn JD đọc từ tests/fixtures/jd-andpad.txt; số liệu biểu đồ đếm từ chính JD.
// Chạy (từ thư mục repo): node tools/jd/build.mjs
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const FILE = ROOT + 'index.html';
const jd = readFileSync(ROOT + 'tests/fixtures/jd-andpad.txt', 'utf8').normalize('NFC').replace(/\r/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const L3 = (tag, o, attrs = '') => ['ja', 'en', 'vi'].map((l) => `<${tag}${attrs} data-l="${l}">${o[l]}</${tag}>`).join('');

// ---------- Trang 1: nguyên văn JD ----------
function inline(s) {
  let h = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  return h.replace(/https:\/\/[\w./-]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
}
function jdHtml() {
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of jd.split('\n')) {
    const s = raw.trim(); if (!s) continue;
    let m;
    if ((m = s.match(/^# (.+)/))) { close(); out.push(`<h3 class="jd-h1">${inline(m[1])}</h3>`); }
    else if ((m = s.match(/^## (.+)/))) { close(); out.push(`<h4>${inline(m[1])}</h4>`); }
    else if ((m = s.match(/^- (.+)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = s.match(/^(\d+\.) (.+)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${m[1]} ${inline(m[2])}</li>`); }
    else { close(); out.push(`<p>${inline(s)}</p>`); }
  }
  close();
  return out.join('\n    ');
}

// ---------- Số liệu đếm từ JD ----------
const part = (a, b) => jd.slice(jd.indexOf(a), jd.indexOf(b));
const scope = part('## 3.', '## 5.');
const bullets = (head) => { const r = jd.slice(jd.indexOf(head) + head.length); return (r.slice(0, r.search(/\n(\*\*|##)/)).match(/^- /gm) || []).length; };

// Radar 9 năng lực. Luật điểm (cách đọc JD của ứng viên): 5 = bắt buộc và là việc chính trong mô tả công việc, 4 = bắt buộc, 3 = ưu tiên.
const AX = [
  { v: 5, ja: 'B2B顧客対応', en: 'B2B clients', vi: 'Khách hàng B2B', why: 'Bắt buộc + mọi đầu việc trong mục 3' },
  { v: 5, ja: '研修、資料作成', en: 'Training, manuals', vi: 'Đào tạo, tài liệu', why: 'Kỹ năng giao tiếp (bắt buộc) + đào tạo, tài liệu, demo (mục 3)' },
  { v: 5, ja: '課題解決', en: 'Problem|solving', vi: 'Giải quyết|vấn đề', why: 'Tư duy logic (bắt buộc) + chủ động giải quyết khó khăn (mục 3)' },
  { v: 5, ja: 'IT、システム導入', en: 'IT, system|rollout', vi: 'IT, triển khai|hệ thống', why: 'Quan tâm IT (bắt buộc) + đồng hành sau triển khai hệ thống (mục 3)' },
  { v: 4, ja: '日本語 N2以上', en: 'Japanese N2+', vi: 'Tiếng Nhật N2+', why: 'Ngoại ngữ: JLPT N2 trở lên' },
  { v: 4, ja: '英語4技能', en: 'English, 4 skills', vi: 'Tiếng Anh 4 kỹ năng', why: 'Ngoại ngữ: giao tiếp tốt cả 4 kỹ năng' },
  { v: 4, ja: '日系企業の経験', en: 'Japanese|company', vi: 'Công ty Nhật', why: 'Bắt buộc: từng làm tại công ty Nhật hoặc tại Nhật' },
  { v: 3, ja: 'チーム管理', en: 'Team lead', vi: 'Quản lý|đội nhóm', why: 'Ưu tiên: Team Leader / Supervisor' },
  { v: 3, ja: '交渉', en: 'Negotiation', vi: 'Đàm phán', why: 'Ưu tiên: đàm phán, thương lượng' },
];
const CX = 160, CY = 150, R = 110;
const pt = (i, r) => { const a = (-90 + i * 40) * Math.PI / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
const f1 = (n) => (Math.round(n * 10) / 10).toString();
function radarSvg() {
  const rings = [1, 2, 3, 4, 5].map((k) => `<polygon class="jd-ring" points="${AX.map((_, i) => pt(i, R * k / 5).map(f1).join(',')).join(' ')}"/>`).join('');
  const axes = AX.map((_, i) => { const [x, y] = pt(i, R); return `<line class="jd-ax" x1="${CX}" y1="${CY}" x2="${f1(x)}" y2="${f1(y)}"/>`; }).join('');
  const poly = AX.map((a, i) => pt(i, R * a.v / 5).map(f1).join(',')).join(' ');
  const dots = AX.map((a, i) => { const [x, y] = pt(i, R * a.v / 5); return `<circle class="jd-pt" data-v="${a.v}" cx="${f1(x)}" cy="${f1(y)}" r="4.5" style="--i:${i}"><title>${esc(a.vi.replace('|', ' '))}: ${a.v}/5 (${esc(a.why)})</title></circle>`; }).join('');
  const labels = AX.map((a, i) => {
    const ang = -90 + i * 40, c = Math.cos(ang * Math.PI / 180);
    const [x, y] = pt(i, R + 14);
    const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
    const dy = ang === -90 ? -4 : (ang > 20 && ang < 160 ? 10 : 4);
    return ['ja', 'en', 'vi'].map((l) => {
      const parts = a[l].split('|');
      const tsp = parts.map((t, k) => `<tspan x="${f1(x)}"${k ? ' dy="15"' : ''}>${esc(t)}${k === parts.length - 1 ? ` <tspan class="jd-v">${a.v}</tspan>` : ''}</tspan>`).join('');
      const shift = parts.length > 1 && dy < 6 ? dy - 6 : dy;
      return `<text data-l="${l}" x="${f1(x)}" y="${f1(y + shift)}" text-anchor="${anchor}">${tsp}</text>`;
    }).join('');
  }).join('');
  const scale = [1, 2, 3, 4, 5].map((k) => `<text class="jd-sc" x="${CX + 3}" y="${f1(CY - R * k / 5 + 3)}">${k}</text>`).join('');
  return `<svg class="jd-radar" viewBox="-70 -14 460 322" role="img" aria-labelledby="jd-radar-t"><title id="jd-radar-t">Radar 9 năng lực theo JD</title>`
    + `<g class="jd-grid">${rings}${axes}${scale}</g><g class="jd-shape"><polygon class="jd-area" points="${poly}"/>${dots}</g><g class="jd-lbs">${labels}</g></svg>`;
}

const COMP = [
  { k: 'must', n: bullets('**Yêu cầu bắt buộc (Must-have):**'), ja: '必須', en: 'Must-have', vi: 'Bắt buộc' },
  { k: 'lang', n: bullets('**Ngoại ngữ:**'), ja: '語学', en: 'Languages', vi: 'Ngoại ngữ' },
  { k: 'edu', n: 1, ja: '学歴', en: 'Education', vi: 'Học vấn' },
  { k: 'nice', n: bullets('**Ưu tiên (Nice-to-have):**'), ja: '歓迎', en: 'Nice-to-have', vi: 'Ưu tiên' },
];
const total = COMP.reduce((a, c) => a + c.n, 0);

const KW = [
  { k: 'kh', re: /khách hàng/gi, ja: '顧客', en: 'Customers', vi: 'khách hàng' },
  { k: 'dt', re: /đào tạo|hướng dẫn|tài liệu/gi, ja: '研修、案内、資料', en: 'Training, guides, manuals', vi: 'đào tạo, hướng dẫn, tài liệu' },
  { k: 'it', re: /\bIT\b|công nghệ|ERP|CRM|Software|SaaS/gi, ja: 'IT、技術、ERP/CRM', en: 'IT, tech, ERP/CRM', vi: 'IT, công nghệ, ERP/CRM' },
  { k: 'ht', re: /hệ thống/gi, ja: 'システム', en: 'System', vi: 'hệ thống' },
  { k: 'gq', re: /giải quyết|xử lý|đề xuất giải pháp/gi, ja: '解決、対応、提案', en: 'Solve, handle, propose', vi: 'giải quyết, xử lý, đề xuất' },
  { k: 'sl', re: /Sales|demo|thuyết trình/gi, ja: '営業、デモ、説明', en: 'Sales, demo, presenting', vi: 'Sales, demo, thuyết trình' },
  { k: 'tm', re: /nhóm|Leader|Supervisor/g, ja: 'チーム、リーダー', en: 'Team, leader', vi: 'nhóm, Leader' },
  { k: 'jp', re: /Nhật/g, ja: '日本', en: 'Japan', vi: 'Nhật' },
].map((o) => ({ ...o, n: (scope.match(o.re) || []).length })).sort((a, b) => b.n - a.n);
const KMAX = Math.max(...KW.map((o) => o.n));

const STAGES = [
  { n: 1, ic: 'chat-bubbles', ja: '営業支援', en: 'Sales support', vi: 'Hỗ trợ Sales', dja: '営業と一緒にデモと説明', den: 'Demos with the sales team', dvi: 'Demo, thuyết trình cùng Sales' },
  { n: 2, ic: 'checklist', ja: '導入', en: 'Rollout', vi: 'Triển khai', dja: '操作研修、マニュアル作成', den: 'User training, manuals', dvi: 'Đào tạo sử dụng, viết tài liệu' },
  { n: 2, ic: 'workflow-gears', ja: '定着支援', en: 'Follow-up', vi: 'Đồng hành', dja: 'フォロー会議、社内連携で解決', den: 'Follow-up meetings, fixes with teams', dvi: 'Họp follow-up, phối hợp nội bộ xử lý' },
  { n: 2, ic: 'handshake', ja: '関係維持', en: 'Long-term', vi: 'Gắn bó', dja: '満足度の維持、訪問セミナー', den: 'Satisfaction, on-site workshops', dvi: 'Giữ hài lòng, hội thảo tại khách hàng' },
];
const duties = (part('## 3.', '## 4.').match(/^- /gm) || []).length;
if (STAGES.reduce((a, s) => a + s.n, 0) !== duties) throw new Error('tổng đầu việc lệch JD');

const PERSONA = [
  { ja: '日系企業で法人顧客を担当してきた人', en: 'Has served B2B clients at a Japanese company', vi: 'Từng phụ trách khách hàng doanh nghiệp ở công ty Nhật', go: [['#sales-top', 'Sales'], ['#career', 'Career']] },
  { ja: '日本語N2以上と英語で仕事ができる人', en: 'Works in Japanese (N2+) and English', vi: 'Làm việc bằng tiếng Nhật (N2+) và tiếng Anh', go: [['#lang-top', 'Languages']] },
  { ja: 'システムを理解し、導入を経験した人', en: 'Understands systems and has seen rollouts', vi: 'Hiểu hệ thống, từng tham gia triển khai', go: [['#it-top', 'IT Knowledge'], ['#sw-top', 'Software Products']] },
  { ja: '研修、資料、デモで使い方を伝えられる人', en: 'Teaches through training, manuals and demos', vi: 'Truyền đạt bằng đào tạo, tài liệu, demo', go: [['#hr-top', 'HR'], ['#team-top', 'Team Management']] },
  { ja: '将来チームを率いる意欲がある人', en: 'Ready to lead a team later', vi: 'Sẵn sàng dẫn dắt đội nhóm sau này', go: [['#team-top', 'Team Management']] },
];
const ROUNDS = [
  { who: 'COO', ja: '1次：対面', en: 'Round 1: in person', vi: 'Vòng 1: trực tiếp' },
  { who: 'Manager', ja: '2次：オンライン（ハノイ営業部）', en: 'Round 2: online (Hanoi sales)', vi: 'Vòng 2: online (Kinh doanh Hà Nội)' },
  { who: 'CEO', ja: '3次：オンラインまたは対面', en: 'Round 3: online or in person', vi: 'Vòng 3: online hoặc trực tiếp' },
];

// ---------- Trang 3 (task yt50): đối chiếu kỹ năng trong portfolio với JD ----------
// Mức của tôi = tự đánh giá theo kinh nghiệm có trên các trang portfolio (cùng 9 trục, cùng thứ tự AX). why = bằng chứng (tooltip).
const ME = [
  { v: 5, why: 'Khách doanh nghiệp ở MAYEKAWA và JILNESTA' },
  { v: 5, why: 'Đào tạo đội kinh doanh, 2 nhân viên tuyển dụng; SOP tiếng Nhật, tiếng Anh' },
  { v: 5, why: 'Xử lý khiếu nại, sự cố giao hàng; phân tích nguyên nhân' },
  { v: 5, why: 'Đặc tả, UAT, bàn giao 3 phần mềm theo yêu cầu khách hàng' },
  { v: 4, why: 'JLPT N2, báo cáo lãnh đạo người Nhật' },
  { v: 4, why: 'Thuyết trình ở hội nghị ASEAN, đàm phán với CEO châu Âu' },
  { v: 5, why: 'Khoảng 11 năm ở công ty Nhật' },
  { v: 4, why: 'Quản lý 5 đến 6 người ở chi nhánh, đội Nhân sự từ 1 lên 5 người' },
  { v: 4, why: 'Đàm phán, xử lý khiếu nại với khách doanh nghiệp' },
];
if (ME.length !== AX.length) throw new Error('ME phải cùng số trục với AX');
const MEET = ME.filter((m, i) => m.v >= AX[i].v).length;
// Mỗi dòng phủ các mã yêu cầu của JD: m1..m7 bắt buộc (đúng thứ tự trong JD), l1 tiếng Nhật, l2 tiếng Anh, e1 học vấn, n1 quản lý đội, n2 đàm phán.
const REQ_N = COMP.reduce((a, c) => a + c.n, 0);
const ROWS = [
  { t: 'must', r: 'm1', go: [['#w-mycom', 'Career'], ['#sales-trips', 'Sales']],
    ja: '法人顧客（B2B）の経験', en: 'B2B client experience', vi: 'Khách hàng doanh nghiệp (B2B)',
    eja: '法人顧客に設備を提案し、5省13社の訪問を計画しました。', een: 'I proposed equipment to corporate clients and planned visits to 13 companies in 5 provinces.', evi: 'Tôi đề xuất thiết bị cho khách doanh nghiệp, lập kế hoạch thăm 13 công ty ở 5 tỉnh.' },
  { t: 'must', r: 'm2', go: [['#career', 'Career']],
    ja: '日系企業での勤務', en: 'Work at a Japanese company', vi: 'Làm việc tại công ty Nhật',
    eja: '日系企業で約11年、日本人上司に直接報告してきました。', een: 'About 11 years at Japanese companies, reporting directly to Japanese managers.', evi: 'Khoảng 11 năm ở công ty Nhật, báo cáo trực tiếp lãnh đạo người Nhật.' },
  { t: 'must', r: 'm3 m7', go: [['#sw-top', 'Software Products'], ['#it-top', 'IT Knowledge']],
    ja: 'IT、システム導入、コンサルへの関心', en: 'IT, system rollout, consulting', vi: 'Quan tâm IT, triển khai hệ thống, tư vấn',
    eja: '顧客の要望から仕様書を書き、UATを経て3つのソフトを納品しました。', een: 'I wrote specs, ran UAT and delivered 3 software products for clients.', evi: 'Tôi viết đặc tả, chạy UAT và bàn giao 3 phần mềm theo yêu cầu khách hàng.' },
  { t: 'must', r: 'm4', go: [['#w-mycom', 'Career'], ['#sales-kpi', 'Sales']],
    ja: '論理的思考、課題解決', en: 'Logic and problem solving', vi: 'Tư duy logic, giải quyết vấn đề',
    eja: 'クレームや納品トラブルを工場、日本本社と連携して解決し、数字で報告しました。', een: 'I resolved complaints and delivery issues with the factory and Japan HQ, reporting in numbers.', evi: 'Tôi xử lý khiếu nại, sự cố giao hàng cùng nhà máy và trụ sở Nhật, báo cáo bằng số liệu.' },
  { t: 'must', r: 'm5', go: [['#w-mycom', 'Career'], ['#hr-top', 'HR']],
    ja: 'コミュニケーション、向上心、顧客志向', en: 'Communication, growth mindset, customer focus', vi: 'Giao tiếp, cầu tiến, lấy khách hàng làm trọng tâm',
    eja: '初回訪問から納品後まで顧客に寄り添い、営業チームの育成と日英のSOP作成も行いました。', een: 'I stay with clients from the first meeting to after handover, and trained the sales team and wrote SOPs in Japanese and English.', evi: 'Tôi theo sát khách từ lần gặp đầu tới sau bàn giao, đào tạo đội kinh doanh và soạn SOP tiếng Nhật, tiếng Anh.' },
  { t: 'must', r: 'm6', go: [['#lang-ja', 'Languages'], ['#team-top', 'Team Management']],
    ja: '誠実さ、責任感、チームワーク', en: 'Sincerity, responsibility, teamwork', vi: 'Chân thành, trách nhiệm, làm việc nhóm',
    eja: '報連相を欠かさず、毎日のレビューでメンバーを支えてきました。', een: 'I keep up hourensou (report, contact, consult) with managers and review and coach the team every day.', evi: 'Tôi giữ hourensou với cấp trên, rà soát và kèm cặp đội mỗi ngày.' },
  { t: 'lang', r: 'l1 l2', go: [['#lang-ja', 'Japanese'], ['#lang-en', 'English']],
    ja: '日本語N2以上、英語4技能', en: 'Japanese N2+, English in 4 skills', vi: 'Tiếng Nhật N2+, tiếng Anh 4 kỹ năng',
    eja: 'JLPT N2。ASEAN会議で英語の発表をし、欧州企業のCEOと英語で交渉しました。', een: 'JLPT N2; I presented in English at an ASEAN meeting and negotiated with a European CEO.', evi: 'JLPT N2; tôi thuyết trình tiếng Anh ở hội nghị ASEAN và đàm phán với CEO châu Âu.' },
  { t: 'edu', r: 'e1', go: [['#profile', 'My Profile']],
    ja: '関連分野の大学卒業', en: 'Relevant university degree', vi: 'Tốt nghiệp đại học chuyên ngành phù hợp',
    eja: 'ホーチミン市経済大学で経営管理を学び、大学院（財務、管理）を修了しました。', een: 'I studied business administration and finished a master\'s course in finance and management at UEH.', evi: 'Cử nhân Quản trị kinh doanh, cao học Tài chính, Quản lý, Đại học Kinh tế TP.HCM.' },
  { t: 'nice', r: 'n1', go: [['#team-top', 'Team Management'], ['#w-jil', 'Career']],
    ja: 'チーム管理', en: 'Team management', vi: 'Quản lý đội nhóm',
    eja: '支店で5～6名を率い、人事チームを1名から5名に広げました。', een: 'I managed 5 to 6 people at a branch and grew the HR team from 1 to 5.', evi: 'Tôi quản lý 5 đến 6 người ở chi nhánh, mở rộng đội Nhân sự từ 1 lên 5 người.' },
  { t: 'nice', r: 'n2', go: [['#w-mycom', 'Career'], ['#lang-top', 'Languages']],
    ja: '顧客との交渉', en: 'Negotiating with clients', vi: 'Đàm phán với khách hàng',
    eja: '法人顧客との交渉とクレーム対応を、日本語でも行ってきました。', een: 'I negotiated and handled complaints with corporate clients, also in Japanese.', evi: 'Tôi đàm phán và xử lý khiếu nại với khách doanh nghiệp, cả bằng tiếng Nhật.' },
];
const covered = ROWS.flatMap((o) => o.r.split(' '));
if (covered.length !== REQ_N || new Set(covered).size !== REQ_N) throw new Error('bảng đối chiếu phải phủ đủ, không trùng ' + REQ_N + ' yêu cầu');

function matchRadar() {
  const rings = [1, 2, 3, 4, 5].map((k) => `<polygon class="jd-ring" points="${AX.map((_, i) => pt(i, R * k / 5).map(f1).join(',')).join(' ')}"/>`).join('');
  const axes = AX.map((_, i) => { const [x, y] = pt(i, R); return `<line class="jd-ax" x1="${CX}" y1="${CY}" x2="${f1(x)}" y2="${f1(y)}"/>`; }).join('');
  const layer = (k, vals, tip) => `<polygon class="jm-area jm-area--${k}" points="${vals.map((v, i) => pt(i, R * v / 5).map(f1).join(',')).join(' ')}"/>`
    + vals.map((v, i) => { const [x, y] = pt(i, R * v / 5); return `<circle class="jm-pt jm-pt--${k}" data-v="${v}" cx="${f1(x)}" cy="${f1(y)}" r="${k === 'me' ? 4.5 : 3.5}" style="--i:${i}"><title>${esc(AX[i].vi.replace('|', ' '))}: ${tip(i, v)}</title></circle>`; }).join('');
  const jd = layer('jd', AX.map((a) => a.v), (i, v) => `JD ${v}/5`);
  const me = layer('me', ME.map((m) => m.v), (i, v) => `tôi ${v}/5 (${esc(ME[i].why)})`);
  const labels = AX.map((a, i) => {
    const ang = -90 + i * 40, c = Math.cos(ang * Math.PI / 180);
    const [x, y] = pt(i, R + 14);
    const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
    const dy = ang === -90 ? -4 : (ang > 20 && ang < 160 ? 10 : 4);
    return ['ja', 'en', 'vi'].map((l) => {
      const parts = a[l].split('|');
      const tsp = parts.map((t, k) => `<tspan x="${f1(x)}"${k ? ' dy="15"' : ''}>${esc(t)}${k === parts.length - 1 ? ` <tspan class="jm-vj">${a.v}</tspan><tspan class="jm-vm" dx="5">${ME[i].v}</tspan>` : ''}</tspan>`).join('');
      const shift = parts.length > 1 && dy < 6 ? dy - 6 : dy;
      return `<text data-l="${l}" x="${f1(x)}" y="${f1(y + shift)}" text-anchor="${anchor}">${tsp}</text>`;
    }).join('');
  }).join('');
  return `<svg class="jd-radar jm-radar" viewBox="-74 -14 486 322" role="img" aria-labelledby="jm-radar-t"><title id="jm-radar-t">Radar 9 năng lực: mức JD cần và mức của tôi</title>`
    + `<g class="jd-grid">${rings}${axes}</g><g class="jm-shape">${jd}${me}</g><g class="jd-lbs">${labels}</g></svg>`;
}

function matchHtml() {
  const nums = [
    { k: 'axes', v: `${MEET}/${AX.length}`, ja: 'JDの水準以上の能力', en: 'skills at or above the JD level', vi: 'năng lực đạt hoặc vượt mức JD' },
    { k: 'req', v: `${REQ_N}/${REQ_N}`, ja: '経験で裏付けられる要件', en: 'requirements backed by experience', vi: 'yêu cầu có kinh nghiệm đối chiếu' },
    { k: 'yrs', v: '11', ja: '日系企業での年数（約）', en: 'years at Japanese companies (about)', vi: 'năm ở công ty Nhật (khoảng)' },
  ].map((o, i) => `<li style="--i:${i}"><b class="jm-num" data-k="${o.k}">${o.v}</b>${L3('span', o)}</li>`).join('');
  const tag = Object.fromEntries(COMP.map((c) => [c.k, c]));
  const rows = ROWS.map((o, i) => `<li class="jm-row" data-t="${o.t}" data-r="${o.r}" style="--i:${i}"><i class="jm-tag jd-seg--${o.t}" title="${tag[o.t].vi}"></i><div class="jm-txt">${L3('b', o, ' class="jm-req"')}${L3('span', { ja: o.eja, en: o.een, vi: o.evi }, ' class="jm-ev"')}</div><span class="jd-go">${o.go.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</span></li>`).join('');
  const leg = COMP.map((c) => `<li><i class="jd-sw jd-seg--${c.k}"></i>${L3('span', c)}</li>`).join('');
  return `<section class="pg" data-chap="III" id="jd-match">
  <span class="eb rv">02　<b>SKILL MATCH</b></span>
  <h2 class="kw jd-kw-s rv" style="--d:60ms"><span data-l="ja">求人票の要件と、<br /><i>私の経験を照らし合わせる。</i></span><span data-l="en">The job requirements,<br /><i>matched with my experience.</i></span><span data-l="vi">Yêu cầu của JD,<br /><i>đối chiếu với kinh nghiệm của tôi.</i></span></h2>
  <div class="kwbar rv" style="--d:120ms"><span></span></div>
  <div class="jm-g rv" style="--d:180ms">
    <div class="jd-col">
      <figure class="card jd-c jm-c--radar">
        <figcaption><span class="lbl">Skill match</span>${L3('h3', { ja: 'JDが求める水準と私の水準', en: 'Level the JD asks for, and mine', vi: 'Mức JD cần và mức của tôi' })}</figcaption>
        ${matchRadar()}
        <ul class="jm-key"><li><i class="jm-sw jm-sw--jd"></i>${L3('span', { ja: 'JDが求める水準', en: 'JD level', vi: 'Mức JD cần' })}</li><li><i class="jm-sw jm-sw--me"></i>${L3('span', { ja: '私の水準（自己評価）', en: 'My level (self-assessed)', vi: 'Mức của tôi (tự đánh giá)' })}</li></ul>
        <ul class="jm-nums">${nums}</ul>
      </figure>
    </div>
    <figure class="card jd-c jm-c--tbl">
      <figcaption><span class="lbl">Evidence</span>${L3('h3', { ja: `要件${REQ_N}項目と、裏付けのページ`, en: `The ${REQ_N} requirements and where to see them`, vi: `${REQ_N} yêu cầu và trang chứng minh` })}</figcaption>
      <ul class="jm-tbl">${rows}</ul>
      <ul class="jd-leg">${leg}</ul>
    </figure>
  </div>
  <div class="jm-end rv" style="--d:260ms">${L3('p', { ja: '日系企業で約11年、法人営業、ITの橋渡し、チーム管理を経験してきたので、Customer Success Staffとしてすぐに貢献し、将来はリーダーを目指します。', en: 'About 11 years of B2B sales, IT bridging and team management at Japanese companies let me start as Customer Success Staff right away and grow into the Leader role.', vi: 'Khoảng 11 năm làm kinh doanh B2B, cầu nối IT và quản lý đội ngũ ở công ty Nhật giúp tôi làm Customer Success Staff được ngay và sẵn sàng lên Leader.' })}</div>
</section>`;
}

function fitHtml() {
  const comp = COMP.map((c, i) => `<span class="jd-seg jd-seg--${c.k}" data-n="${c.n}" style="flex:${c.n}" title="${c.vi}: ${c.n}/${total}"><b>${c.n}</b></span>`).join('');
  const leg = COMP.map((c) => `<li><i class="jd-sw jd-seg--${c.k}"></i>${L3('span', c)} <b>${c.n}</b></li>`).join('');
  const kws = KW.map((o, i) => `<li class="jd-kw" data-k="${o.k}" data-n="${o.n}" style="--w:${Math.round(o.n / KMAX * 100)}%;--i:${i}" title="${esc(o.vi)}: ${o.n}">${L3('span', o, ' class="jd-kl"')}<span class="jd-bar"><i></i></span><b>${o.n}</b></li>`).join('');
  const st = STAGES.map((s, i) => `<li class="jd-st" data-n="${s.n}" style="--i:${i}"><img src="assets/gx/${s.ic}.webp" alt="" width="42" height="42" loading="lazy" decoding="async"><span class="jd-dots" aria-hidden="true">${'<i></i>'.repeat(s.n)}</span>${L3('h3', s)}${L3('p', { ja: s.dja, en: s.den, vi: s.dvi })}</li>`).join('');
  const per = PERSONA.map((o, i) => `<li style="--i:${i}">${L3('span', o, ' class="jd-pt-t"')}<span class="jd-go">${o.go.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}</span></li>`).join('');
  const rd = ROUNDS.map((o, i) => `<li class="jd-rd" style="--i:${i}"><b>${o.who}</b>${L3('span', o)}</li>`).join('');
  return `<section class="pg" data-chap="II" id="jd-fit">
  <span class="eb rv">01　<b>CANDIDATE PROFILE</b></span>
  <h2 class="kw jd-kw-s rv" style="--d:60ms"><span data-l="ja">求人票の要件から、<br /><i>合う人物像を描く。</i></span><span data-l="en">From the job requirements<br /><i>to the right candidate.</i></span><span data-l="vi">Từ yêu cầu công việc<br /><i>đến chân dung ứng viên phù hợp.</i></span></h2>
  <div class="kwbar rv" style="--d:120ms"><span></span></div>
  <p class="kw-sub rv" style="--d:140ms" data-l="ja">求人票の要件と業務を数え、能力ごとに求められる水準を図にしました（水準は私の読み方です）。</p>
  <p class="kw-sub rv" style="--d:140ms" data-l="en">I counted the requirements and duties in the JD and charted the level each skill calls for (levels are my reading).</p>
  <p class="kw-sub rv" style="--d:140ms" data-l="vi">Tôi đếm các yêu cầu và đầu việc trong JD rồi vẽ mức cần có của từng năng lực (mức điểm theo cách đọc của tôi).</p>
  <div class="kw1 rv" style="margin:6px 0 8px">
    <div class="chips" data-l="ja"><span class="chip">B2B</span><span class="chip">日系企業</span><span class="chip">日本語N2以上</span><span class="chip">システム導入</span><span class="chip">研修と資料</span></div>
    <div class="chips" data-l="en"><span class="chip">B2B</span><span class="chip">Japanese company</span><span class="chip">Japanese N2+</span><span class="chip">system rollout</span><span class="chip">training and manuals</span></div>
    <div class="chips" data-l="vi"><span class="chip">B2B</span><span class="chip">công ty Nhật</span><span class="chip">tiếng Nhật N2+</span><span class="chip">triển khai hệ thống</span><span class="chip">đào tạo và tài liệu</span></div>
  </div>
  <div class="jd-g rv" style="--d:180ms">
    <figure class="card jd-c jd-c--radar">
      <figcaption><span class="lbl">Skill radar</span>${L3('h3', { ja: '能力ごとに求められる水準', en: 'Level each skill calls for', vi: 'Mức cần có theo từng năng lực' })}</figcaption>
      ${radarSvg()}
      ${L3('p', { ja: '5＝必須かつ主な業務、4＝必須（語学を含む）、3＝歓迎（私の読み方）。', en: '5 = must-have and a core duty, 4 = must-have (incl. languages), 3 = nice-to-have (my reading).', vi: '5 = bắt buộc và là việc chính, 4 = bắt buộc (gồm ngoại ngữ), 3 = ưu tiên (theo cách đọc của tôi).' }, ' class="jd-note"')}
    </figure>
    <div class="jd-col">
      <figure class="card jd-c">
        <figcaption><span class="lbl">Requirements</span>${L3('h3', { ja: `応募要件 ${total}項目の内訳`, en: `The ${total} requirements by type`, vi: `${total} yêu cầu ứng viên theo nhóm` })}</figcaption>
        <div class="jd-comp" role="img" aria-label="${COMP.map((c) => `${c.en} ${c.n}`).join(', ')}">${comp}</div>
        <ul class="jd-leg">${leg}</ul>
      </figure>
      <figure class="card jd-c">
        <figcaption><span class="lbl">Keywords</span>${L3('h3', { ja: '業務内容と要件に出る言葉（回数）', en: 'Words in duties and requirements (count)', vi: 'Từ khoá trong mô tả và yêu cầu (số lần)' })}</figcaption>
        <ul class="jd-kws">${kws}</ul>
      </figure>
    </div>
  </div>
  <figure class="card jd-c jd-life rv" style="--d:220ms">
    <figcaption><span class="lbl">Customer journey</span>${L3('h3', { ja: `顧客対応の4段階で見る業務内容 ${duties}項目`, en: `The ${duties} duties across 4 stages with a customer`, vi: `${duties} đầu việc chia theo 4 chặng đồng hành khách hàng` })}</figcaption>
    <ol class="jd-sts">${st}</ol>
  </figure>
  <div class="jd-g2 rv" style="--d:260ms">
    <figure class="card jd-c">
      <figcaption><span class="lbl">Candidate profile</span>${L3('h3', { ja: '合う人物像と関連ページ', en: 'The right candidate, with related pages', vi: 'Chân dung phù hợp và trang liên quan' })}</figcaption>
      <ul class="jd-per">${per}</ul>
    </figure>
    <figure class="card jd-c">
      <figcaption><span class="lbl">Selection</span>${L3('h3', { ja: '選考は3回の面接', en: 'Three interview rounds', vi: 'Ba vòng phỏng vấn' })}</figcaption>
      <ol class="jd-rds">${rd}</ol>
    </figure>
  </div>
</section>`;
}

const main = `<!-- jd:start -->
<main class="wrap" data-view="jd" hidden>
<section class="pg" data-chap="I" id="jd-top">
  <span class="eb rv">JOB DESCRIPTION　<b>ANDPAD</b></span>
  <h2 class="kw jd-kw-s rv" style="--d:60ms"><span data-l="ja">ANDPAD Vietnamの<br /><i>求人情報。</i></span><span data-l="en">ANDPAD Vietnam<br /><i>job description.</i></span><span data-l="vi">Thông tin tuyển dụng<br /><i>ANDPAD Vietnam.</i></span></h2>
  <div class="kwbar rv" style="--d:120ms"><span></span></div>
  <p class="kw-sub rv" style="--d:140ms" data-l="ja">Customer Success Staff（IT／リーダー候補）の募集です。</p>
  <p class="kw-sub rv" style="--d:140ms" data-l="en">Position: Customer Success Staff (IT, with a path to Leader).</p>
  <p class="kw-sub rv" style="--d:140ms" data-l="vi">Vị trí Customer Success Staff (IT, ứng viên tiềm năng cho vị trí Leader).</p>
  <div class="jd-doc rv" lang="vi" style="--d:180ms">
    ${jdHtml()}
  </div><!-- /jd-doc -->
</section>
${fitHtml()}
${matchHtml()}
</main>
<!-- jd:end -->
`;

const css = `<!-- jd-css:start -->
<style id="jd-css">
/* Tab JD ANDPAD (task wp5x): #jd-top nguyên văn JD (2 cột chữ nhỏ cho vừa 1 trang A4), #jd-fit biểu đồ chân dung ứng viên:
   radar 9 năng lực (SVG), thanh cơ cấu yêu cầu, thanh tần suất từ khoá, 4 chặng đồng hành (nối nét đứt từng cặp icon, luật 3b),
   chân dung + 3 vòng phỏng vấn. Số liệu đếm từ JD (tests/fixtures/jd-andpad.txt, tests/check-jd-tab.mjs).
   Màu nhóm yêu cầu đã chạy validate_palette (light): #2a6fc0 / #1FB6A6 / #6d5bd0 / #F68209, kèm số và chú giải.
   Chuyển động chỉ khi khối đã hiện (.sr-in), chỉ transform / opacity; tắt JS, reduced-motion, bản in: tĩnh, hiện đủ. */
.kw.jd-kw-s{font-size:30px;line-height:1.3;margin-top:8px}
#jd-top .kwbar,#jd-fit .kwbar{margin:12px 0 12px}
#jd-top .kw-sub,#jd-fit .kw-sub{margin-top:0;font-size:12.5px;line-height:1.7}
.jd-doc{margin-top:12px;columns:2;column-gap:22px;column-rule:1px solid #ece8f3;font:400 9.6px/1.48 'Noto Sans JP',sans-serif;color:#2b2735;
  background:rgba(255,255,255,.86);border:1px solid #ece8f3;border-radius:12px;padding:12px 14px}
.jd-doc .jd-h1{column-span:all;margin:0 0 6px;font:800 12.5px/1.4 'Noto Sans JP',sans-serif;color:#14396b;text-align:center;letter-spacing:.02em}
.jd-doc h4{margin:6px 0 2px;font:800 10.2px/1.4 'Noto Sans JP',sans-serif;color:#6d5bd0;break-after:avoid}
.jd-doc p{margin:0 0 2px}
.jd-doc ul,.jd-doc ol{margin:0 0 3px;padding-left:14px}
.jd-doc li{margin:0;break-inside:avoid}
.jd-doc ol{list-style:none;padding-left:2px}
.jd-doc b{color:#16141d}
.jd-doc a{color:#0f5a8c;text-decoration:none;border-bottom:1px solid rgba(15,90,140,.3)}
.jd-g{display:grid;grid-template-columns:1.3fr 1fr;gap:10px}
.jd-col{display:grid;gap:10px;align-content:start}
.jd-g2{display:grid;grid-template-columns:1.25fr 1fr;gap:10px;margin-top:10px}
.card.jd-c{margin:0;padding:10px 12px}
.jd-c figcaption .lbl{margin-bottom:2px}
.jd-c h3{margin:0 0 6px;font:700 12.5px/1.4 'Noto Sans JP',sans-serif;color:#16141d}
.jd-radar{display:block;width:100%;height:auto;overflow:visible}
.jd-ring{fill:none;stroke:#e5e0f1;stroke-width:1}
.jd-ax{stroke:#e5e0f1;stroke-width:1}
.jd-sc{font:600 10px 'Space Grotesk',sans-serif;fill:#a49dba}
.jd-area{fill:rgba(109,91,208,.16);stroke:#6d5bd0;stroke-width:2;stroke-linejoin:round}
.jd-pt{fill:#6d5bd0;stroke:#fff;stroke-width:2}
.jd-lbs text{font:600 14px 'Noto Sans JP',sans-serif;fill:#2b2735}
.jd-lbs .jd-v{font:800 14px 'Space Grotesk',sans-serif;fill:#6d5bd0}
.jd-shape{transform-origin:160px 150px;transform-box:view-box}
.jd-c .jd-note{margin:2px 0 0;font:400 10.5px/1.5 'Noto Sans JP',sans-serif;color:#5b5568}
.jd-comp{display:flex;gap:2px;height:22px;border-radius:6px;overflow:hidden;transform-origin:left center}
.jd-seg{display:flex;align-items:center;justify-content:center;min-width:0}
.jd-seg b{font:800 11px 'Space Grotesk',sans-serif;color:#fff}
.jd-seg--must{background:#2a6fc0}.jd-seg--lang{background:#1FB6A6}.jd-seg--edu{background:#6d5bd0}.jd-seg--nice{background:#F68209}
.jd-leg{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 12px;font:500 10.5px/1.4 'Noto Sans JP',sans-serif;color:#2b2735}
.jd-leg li{display:flex;align-items:center;gap:4px}
.jd-leg b{font:800 10.5px 'Space Grotesk',sans-serif}
.jd-sw{display:inline-block;width:10px;height:10px;border-radius:3px}
.jd-kws{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.jd-kw{display:grid;grid-template-columns:96px 1fr 18px;align-items:center;gap:6px}
.jd-kl{font:500 10.3px/1.3 'Noto Sans JP',sans-serif;color:#2b2735}
.jd-bar{height:9px;border-radius:0 4px 4px 0;background:#f3f0fa;overflow:hidden}
.jd-bar i{display:block;height:100%;width:var(--w);border-radius:0 4px 4px 0;background:#2a6fc0;transform-origin:left center}
.jd-kw b{font:800 11px 'Space Grotesk',sans-serif;color:#16141d;text-align:right}
.jd-life{margin-top:10px}
.jd-sts{--g:10px;list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--g)}
.jd-st{position:relative;text-align:center}
.jd-st img{width:42px;height:42px;display:block;margin:0 auto 2px;position:relative;z-index:1}
/* nét đứt nối TỪNG CẶP icon: từ mép phải icon + hở 6px tới mép trái icon kế - hở 6px; mũi tên chạm cuối đoạn */
.jd-st:not(:last-child)::after{content:"";position:absolute;top:20px;left:calc(50% + 27px);width:calc(100% + var(--g) - 54px);height:2px;
  background:repeating-linear-gradient(90deg,#9a87f0 0 6px,transparent 6px 11px)}
.jd-st:not(:last-child)::before{content:"";position:absolute;top:16px;left:calc(150% + var(--g) - 33px);border:5px solid transparent;border-left:6px solid #9a87f0;border-right:0}
.jd-dots{display:flex;justify-content:center;gap:3px;height:6px;margin-bottom:2px}
.jd-dots i{width:6px;height:6px;border-radius:50%;background:#F68209}
.jd-st h3{margin:0;font:700 11.5px/1.35 'Noto Sans JP',sans-serif}
.jd-st p{margin:1px 0 0;font:400 10px/1.45 'Noto Sans JP',sans-serif;color:#3d3849;text-wrap:pretty}
.jd-per{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.jd-per li{display:flex;justify-content:space-between;align-items:center;gap:8px;border-left:3px solid #6d5bd0;padding:1px 0 1px 7px}
.jd-pt-t{font:500 10.5px/1.4 'Noto Sans JP',sans-serif;color:#2b2735;text-wrap:pretty}
.jd-go{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;flex:none;max-width:46%}
.jd-go a{font:700 8.8px/1 'Manrope',sans-serif;letter-spacing:.02em;color:#0f5a8c;background:#eef6fc;border:1px solid #cfe6f7;border-radius:999px;padding:3px 6px;text-decoration:none;white-space:nowrap}
.jd-rds{list-style:none;margin:0;padding:0;display:grid;gap:6px;position:relative}
.jd-rd{display:grid;grid-template-columns:66px 1fr;align-items:center;gap:8px}
.jd-rd b{font:800 11px 'Space Grotesk',sans-serif;color:#fff;background:#14396b;border-radius:8px;padding:6px 0;text-align:center}
.jd-rd span{font:500 10.5px/1.4 'Noto Sans JP',sans-serif;color:#2b2735}
/* #jd-match (task yt50): radar chồng JD (xanh nét đứt) và tôi (cam), số tóm tắt, bảng 12 yêu cầu + link bằng chứng, câu kết (task 6vya: bỏ câu dẫn + khối WHY ME) */
.jm-g{display:grid;grid-template-columns:1fr 1.22fr;gap:10px}
.jm-area--jd{fill:rgba(42,111,192,.07);stroke:#2a6fc0;stroke-width:1.6;stroke-dasharray:5 4;stroke-linejoin:round}
.jm-area--me{fill:rgba(246,130,9,.2);stroke:#F68209;stroke-width:2.2;stroke-linejoin:round}
.jm-pt--jd{fill:#2a6fc0;stroke:#fff;stroke-width:1.5}
.jm-pt--me{fill:#F68209;stroke:#fff;stroke-width:2}
.jm-shape{transform-origin:160px 150px;transform-box:view-box}
.jd-lbs .jm-vj{font:800 14px 'Space Grotesk',sans-serif;fill:#2a6fc0}
.jd-lbs .jm-vm{font:800 14px 'Space Grotesk',sans-serif;fill:#d96f00}
.jm-key{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px;font:500 10.5px/1.4 'Noto Sans JP',sans-serif;color:#2b2735}
.jm-key li{display:flex;align-items:center;gap:5px}
.jm-sw{display:inline-block;width:16px;height:0;border-top:2px dashed #2a6fc0}
.jm-sw--me{height:8px;border:2px solid #F68209;border-radius:2px;background:rgba(246,130,9,.2)}
.jm-nums{list-style:none;margin:8px 0 4px;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.jm-nums li{background:#f6f4fb;border-radius:10px;padding:6px 6px 5px;text-align:center}
.jm-num{display:block;font:800 22px/1.1 'Space Grotesk',sans-serif;color:#14396b}
.jm-nums span{display:block;font:500 9.8px/1.35 'Noto Sans JP',sans-serif;color:#3d3849;text-wrap:pretty}
.jm-tbl{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:3px}
.jm-row{display:grid;grid-template-columns:4px minmax(0,1fr) auto;gap:8px;align-items:center;padding:2px 0 3px;border-bottom:1px dashed #ece8f3}
.jm-tag{align-self:stretch;border-radius:2px}
.jm-txt{display:grid;gap:1px;min-width:0}
.jm-req{font:700 10.5px/1.35 'Noto Sans JP',sans-serif;color:#16141d}
.jm-ev{font:400 9.9px/1.45 'Noto Sans JP',sans-serif;color:#3d3849;text-wrap:pretty}
.jm-row .jd-go{flex-direction:column;align-items:flex-end;max-width:none}
.jm-end{margin:10px 0 0;padding:10px 16px;border-radius:12px;background:#14396b;color:#fff}
.jm-end p{margin:0;font:600 12.5px/1.6 'Noto Sans JP',sans-serif;text-wrap:pretty}
@keyframes jdGrow{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}
@keyframes jdBar{from{transform:scaleX(0)}to{transform:none}}
@keyframes jdRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes jdDash{from{opacity:.15}to{opacity:1}}
html.sr .jd-g.sr-in .jd-shape{animation:jdGrow .9s cubic-bezier(.2,.7,.2,1) .25s both}
html.sr .jd-g.sr-in .jd-comp{animation:jdBar .8s cubic-bezier(.2,.7,.2,1) .3s both}
html.sr .jd-g.sr-in .jd-bar i{animation:jdBar .7s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*70ms + 350ms)}
html.sr .jd-life.sr-in .jd-st,html.sr .jd-g2.sr-in .jd-per li,html.sr .jd-g2.sr-in .jd-rd{animation:jdRise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*110ms + 200ms)}
html.sr .jm-g.sr-in .jm-shape{animation:jdGrow .9s cubic-bezier(.2,.7,.2,1) .25s both}
html.sr .jm-g.sr-in .jm-row,html.sr .jm-g.sr-in .jm-nums li{animation:jdRise .6s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0)*70ms + 200ms)}
html.sr .jd-life.sr-in .jd-st::after,html.sr .jd-life.sr-in .jd-st::before{animation:jdDash .5s ease both;animation-delay:calc(var(--i,0)*110ms + 420ms)}
@media screen and (max-width:900px){.jd-g,.jd-g2,.jm-g{grid-template-columns:1fr}}
@media screen and (max-width:700px){
  .jd-doc{columns:1;font-size:11.5px}
  .jd-sts{grid-template-columns:1fr;--g:24px}
  .jd-st{display:grid;grid-template-columns:42px 1fr;column-gap:10px;text-align:left}
  .jd-st img{grid-row:1/span 4;margin:0}
  .jd-dots{justify-content:flex-start}
  /* dọc: nét đứt từ đáy icon + hở tới đỉnh icon kế - hở, mũi tên chỉ xuống */
  .jd-st:not(:last-child)::after{top:48px;left:20px;width:2px;height:calc(100% + var(--g) - 54px);background:repeating-linear-gradient(180deg,#9a87f0 0 6px,transparent 6px 11px)}
  .jd-st:not(:last-child)::before{top:auto;bottom:calc(0px - var(--g) + 6px);left:16px;border:5px solid transparent;border-top:6px solid #9a87f0;border-bottom:0}
  .jd-per li{flex-direction:column;align-items:flex-start}
  .jd-go{justify-content:flex-start;max-width:none}
  .jm-row{grid-template-columns:4px minmax(0,1fr)}
  .jm-row .jd-go{grid-column:2;flex-direction:row;align-items:center;justify-content:flex-start}
}
@media (prefers-reduced-motion:reduce){.jm-shape,.jm-row,.jm-nums li,.jd-shape,.jd-comp,.jd-bar i,.jd-st,.jd-st::after,.jd-st::before,.jd-per li,.jd-rd{animation:none!important}}
@media print{.jm-shape,.jm-row,.jm-nums li,.jd-shape,.jd-comp,.jd-bar i,.jd-st,.jd-st::after,.jd-st::before,.jd-per li,.jd-rd{animation:none!important}.jd-doc{font-size:9.2px}}
</style>
<!-- jd-css:end -->
`;

const nav = `<a href="#jd-top" data-view="jd">JD ANDPAD</a>\n      `;
const sbnav = `<nav class="sb-nav" data-for="jd" hidden>
      <a href="#jd-top" data-sec="jd-top"><em>TOP</em><span data-l="ja">求人票</span><span data-l="en">Job description</span><span data-l="vi">Thông tin tuyển dụng</span></a>
      <a href="#jd-fit" data-sec="jd-fit"><em>01</em><span data-l="ja">求められる人物像</span><span data-l="en">Candidate profile</span><span data-l="vi">Chân dung ứng viên</span></a>
      <a href="#jd-match" data-sec="jd-match"><em>02</em><span data-l="ja">スキルの照合</span><span data-l="en">Skill match</span><span data-l="vi">Đối chiếu kỹ năng</span></a>
    </nav>
    `;

// ---------- Chèn idempotent ----------
const t0 = statSync(FILE).mtimeMs;
// Task khác có thể ghi file kiểu CRLF: làm việc trên bản LF rồi trả lại đúng kiểu xuống dòng gốc.
const raw = readFileSync(FILE, 'utf8');
const CRLF = raw.includes('\r\n');
let h = raw.replace(/\r\n/g, '\n');
// Thiếu mốc cuối thì DỪNG (không bao giờ cắt mù): tránh nhân bản file như lần chạy lỗi 25/11 15:08.
const cut = (s, a, b) => { const i = s.indexOf(a); if (i < 0) return s; const j = s.indexOf(b, i); if (j < 0) throw new Error('thiếu mốc cuối: ' + JSON.stringify(b)); return s.slice(0, i) + s.slice(j + b.length); };
const n0 = (h.match(/<main class="wrap"/g) || []).length;
h = cut(h, '<!-- jd-css:start -->', '<!-- jd-css:end -->\n');
h = cut(h, '<!-- jd:start -->', '<!-- jd:end -->\n');
h = cut(h, '<a href="#jd-top" data-view="jd">', '\n      ');
h = cut(h, '<nav class="sb-nav" data-for="jd" hidden>', '</nav>\n    ');
h = h.replace(/'jd-top','jd-fit',('jd-match',)?/, '');
const ins = (s, before, add) => { const i = s.indexOf(before); if (i < 0) throw new Error('không thấy mốc: ' + before.slice(0, 50)); return s.slice(0, i) + add + s.slice(i); };
h = ins(h, '</head>', css);
h = ins(h, '<a href="#sw-top" data-view="sw">', nav);
h = ins(h, '<nav class="sb-nav" data-for="sw" hidden>', sbnav);
h = ins(h, '<main class="wrap" data-view="sw" hidden>', main);
h = ins(h, "'sw-top','sw-remote'", "'jd-top','jd-fit','jd-match',");
// Kiểm an toàn trước khi ghi: đúng 1 <html>, 1 </head>, số main chỉ tăng đúng 1 (tab jd) so với lúc đọc (trừ main jd cũ).
const cnt = (re) => (h.match(re) || []).length;
const nJd = (raw.match(/<main class="wrap" data-view="jd"/g) || []).length;
if (cnt(/^<html /gm) !== 1 || cnt(/<\/head>/g) !== 1 || cnt(/<main class="wrap"/g) !== n0 - nJd + 1 || cnt(/data-view="jd"/g) !== 2)
  throw new Error('kết quả bất thường, không ghi file');
for (const m of ['<!-- jd-css:start -->', '<!-- jd-css:end -->', '<!-- jd:start -->', '<!-- jd:end -->', '<nav class="sb-nav" data-for="jd"', "'jd-top','jd-fit','jd-match',"])
  if (h.split(m).length !== 2) throw new Error('mốc phải có đúng 1 lần: ' + m);
if (statSync(FILE).mtimeMs !== t0) throw new Error('index.html vừa bị lượt khác sửa, chạy lại');
writeFileSync(FILE, CRLF ? h.replace(/\n/g, '\r\n') : h);
console.log('ok', { total, duties, kw: KW.map((o) => `${o.k}:${o.n}`).join(' ') });
