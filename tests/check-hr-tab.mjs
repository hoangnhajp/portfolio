// Task 4ubf: tab menu "Task: HR" (việc nhân sự) 4 trang, nội dung lấy từ năng lực nhân sự trong skill nha-revised-cv-apply
// (master-profile §4.1 mảng HR + H1..H5) và CV mới, đủ JA / EN / VI.
// Kiểm tĩnh: vị trí tab, sidebar, đúng 4 section, đủ 3 ngôn ngữ cân nhau, dữ kiện chính, không bịa số / không tên AI.
// Chạy: node tests/check-hr-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// 1) Menu trên: "HR" ngay sau "Sales" (task g9d5 bỏ chữ "Task:" trên menu)
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#hr-top" data-view="hr">HR<\/a>/.test(topNav), 'top-nav thiếu <a href="#hr-top" data-view="hr">HR</a>');
// task g6pn: tab Software Products (sw) đứng cuối, kiểm riêng ở check-sw-tab.mjs; task g9d5: tab IT Knowledge (it) ở check-it-tab.mjs
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]).filter((v) => v !== 'sw' && v !== 'it' && v !== 'jd').join(',');
ok(order === 'profile,sales,hr,team,ai,lang', `thứ tự tab menu trên: ${order}`);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]).filter((v) => v !== 'sw' && v !== 'it' && v !== 'jd').join(',');
ok(views === 'profile,sales,hr,team,ai,lang', `thứ tự main view: ${views}`);

// 2) Main + 4 trang (3~4 trang theo yêu cầu)
const main = (html.match(/<main class="wrap" data-view="hr" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="hr" hidden>');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'hr-top,hr-hire,hr-people,hr-ops', `section tab HR: ${ids.join(',')}`);

// 3) Sidebar: đủ 4 mục trỏ đúng section, có 3 ngôn ngữ
const sb = (html.match(/<nav class="sb-nav" data-for="hr" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="hr" hidden>');
const sbIds = [...sb.matchAll(/href="#([\w-]+)" data-sec="([\w-]+)"/g)].filter((m) => m[1] === m[2]).map((m) => m[1]).join(',');
ok(sbIds === ids.join(','), `sidebar HR trỏ: ${sbIds}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 4, `sidebar HR thiếu nhãn ${l}`);

// 4) Ảnh nền mỗi trang (pganh) + file có thật
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of ids) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(fileURLToPath(new URL(`../assets/pg/${id}.webp`, import.meta.url))), `thiếu assets/pg/${id}.webp`);
}

// 5) Đủ 3 ngôn ngữ, số khối bằng nhau, EN / VI không lẫn chữ Nhật
const cnt = (l) => (main.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
ok(cnt('ja') >= 40 && cnt('ja') === cnt('en') && cnt('en') === cnt('vi'), `số khối ja/en/vi: ${cnt('ja')}/${cnt('en')}/${cnt('vi')}`);
// mỗi thẻ / bước / ô số liệu tự đủ 3 ngôn ngữ (không bù lệch giữa các khối)
const units = [...main.matchAll(/<div class="card hr-c"[\s\S]*?<\/div><\/div>|<li class="hr-st"[\s\S]*?<\/li>|<div><span>[^<]*<\/span>[\s\S]*?<\/div>/g)].map((m) => m[0]);
ok(units.length === 4 + 6 + 8, `số thẻ / bước / ô số liệu: ${units.length} (cần 18)`);
for (const u of units) { const c = ['ja', 'en', 'vi'].map((l) => (u.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] > 0 && c[0] === c[1] && c[1] === c[2], `khối thiếu ngôn ngữ (ja/en/vi ${c.join('/')}): ${strip(u).slice(0, 40)}`); }
const only = (src, l) => [...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' ');
const txt = { ja: strip(only(main, 'ja')), en: strip(only(main, 'en')), vi: strip(only(main, 'vi')) };
const JP = /[ぁ-んァ-ヶ一-龥]/;
for (const l of ['en', 'vi']) { const m = txt[l].match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `hr/${l}: còn chữ Nhật "${m && m[0]}"`); }

// 6) Dữ kiện nhân sự chính (theo master-profile, đã xác nhận)
const FACTS = {
  ja: ['人事部長', '5名', '採用担当2名', '20～40名', '1～2名', '7日目', '3週目', '6週目', '評価シート', 'KPI', '社員アンケート', '報連相', '給与', '個人所得税', '社会保険', '労働契約', '監査', '相見積', '韓国'],
  en: ['head of HR', 'five', 'two recruiters', '20 to 40', 'one or two', 'day 7', 'week 3', 'week 6', 'scorecard', 'KPI', 'staff survey', 'hourensou', 'payroll', 'income tax', 'social insurance', 'contract', 'audit', 'quotes', 'Korea'],
  vi: ['trưởng phòng Nhân sự', '5 người', '2 nhân viên tuyển dụng', '20 đến 40', '1 đến 2', 'ngày 7', 'tuần 3', 'tuần 6', 'phiếu đánh giá', 'KPI', 'khảo sát nhân viên', 'hourensou', 'lương', 'thuế TNCN', 'BHXH', 'hợp đồng lao động', 'kiểm toán', 'báo giá', 'Hàn Quốc'],
};
for (const [l, keys] of Object.entries(FACTS)) for (const k of keys) ok(txt[l].toLowerCase().includes(k.toLowerCase()), `hr/${l}: thiếu dữ kiện "${k}"`);

// 7) Ranh giới trung thực (cố ý chặt hơn nguồn: H1 có lập ngân sách nhưng chưa có số, và STALE của check-cv-rirekisho cấm 「予算」):không số ngân sách / số tiền / số người tính lương tự bịa, không tên AI, không "23段階"
const all = strip(main);
for (const bad of ['予算', '23段階', '労働法', 'VND', 'USD', '%', 'budget of', 'ngân sách']) ok(!all.includes(bad), `tab HR có cụm không được dùng "${bad}"`);
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini/i.test(main), 'tab HR nêu tên công cụ AI');
ok(!main.includes('—'), 'tab HR có dấu gạch ngang dài');

// 8) Tầng giọng JA: h2 常体 kết 「。」, kw-sub です・ます
const h2ja = [...main.matchAll(/<h2 class="kw[^"]*"[^>]*><span data-l="ja">([\s\S]*?)<\/span><span data-l="en">/g)].map((m) => strip(m[1]).replace(/\s/g, ''));
ok(h2ja.length === 4, `cần 4 tiêu đề h2 JA, thấy ${h2ja.length}`);
for (const s of h2ja) ok(/。$/.test(s) && !/(です|ます)。$/.test(s), `h2 JA sai tầng giọng: "${s}"`);
const subja = [...main.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="ja">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
ok(subja.length === 4, `cần 4 câu dẫn kw-sub JA, thấy ${subja.length}`);
for (const s of subja) ok(/(ます|ました|です)。$/.test(s), `kw-sub JA không kết です・ます: "${s.slice(0, 40)}"`);

// 9) CSS riêng của tab trong khối đánh dấu; chuyển động chỉ transform / opacity, có reduced-motion
const css = (html.match(/<!-- hr-css:start -->([\s\S]*?)<!-- hr-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- hr-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- hr-css:start/end --> trong <head>');
for (const kf of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\}\s*\}/g))
  for (const p of kf[1].matchAll(/([a-z-]+)\s*:/g)) ok(['transform', 'opacity'].includes(p[1]), `keyframes HR animate "${p[1]}" (chỉ transform/opacity)`);
ok(/prefers-reduced-motion/.test(css), 'CSS HR thiếu prefers-reduced-motion');

if (fails.length) { console.error(`FAIL check-hr-tab (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-hr-tab: tab "HR" 4 trang (${ids.join(', ')}), ja/en/vi ${cnt('ja')} khối mỗi thứ tiếng, đủ dữ kiện`);
