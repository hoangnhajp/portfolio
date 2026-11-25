// Task g6pn: tab menu "Software Products" (sản phẩm phần mềm làm theo yêu cầu khách hàng), cuối menu, 5 trang:
// #sw-top (tổng quan 3 sản phẩm), #sw-remote (quản lý nhân viên làm từ xa), #sw-talent (quản lý tuyển dụng),
// #sw-leads (quản lý khách hàng), #sw-leads2 (task 8uat: quản lý khách hàng phần 2, thiết lập + AI). KHÔNG nêu tên sản phẩm, ảnh chụp màn hình đã che thông tin cá nhân / đường link
// (sinh bằng tools/sw/build-shots.py, nguồn ảnh gốc không nằm trong repo).
// Chạy: node tests/check-sw-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// 1) Menu trên: tab cuối "Software Products"; thứ tự view khớp
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#sw-top" data-view="sw">Software Products<\/a>/.test(topNav), 'top-nav thiếu <a href="#sw-top" data-view="sw">Software Products</a>');
// Tab SW đứng cuối menu và cuối các main; các tab khác giữ nguyên (task song song có thể thêm tab, nên không ép chuỗi đủ)
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
// task 78z7: SW đứng ngay trước JD ANDPAD (menu và main)
ok(order.indexOf('sw') >= 0 && order[order.indexOf('sw') + 1] === 'jd', `tab SW phải đứng ngay trước jd: ${order}`);
ok(views.indexOf('sw') >= 0 && views[views.indexOf('sw') + 1] === 'jd', `main SW phải đứng ngay trước jd: ${views}`);
ok(order.join(',') === views.join(','), `menu trên và main lệch nhau: ${order} / ${views}`);
for (const v of ['profile', 'sales', 'hr', 'team', 'ai', 'lang']) ok(order.includes(v), `menu mất tab ${v}`);

// 2) Main + 4 trang
const main = (html.match(/<main class="wrap" data-view="sw" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="sw" hidden>');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'sw-top,sw-remote,sw-talent,sw-leads,sw-leads2', `section tab SW: ${ids.join(',')}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];

// 3) Sidebar
const sb = (html.match(/<nav class="sb-nav" data-for="sw" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="sw" hidden>');
const sbIds = [...sb.matchAll(/href="#([\w-]+)" data-sec="([\w-]+)"/g)].filter((m) => m[1] === m[2]).map((m) => m[1]).join(',');
ok(sbIds === ids.join(','), `sidebar SW trỏ: ${sbIds}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === ids.length, `sidebar SW thiếu nhãn ${l}`);

// 4) Ảnh nền pganh mỗi trang
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of ids) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(p(`assets/pg/${id}.webp`)), `thiếu assets/pg/${id}.webp`);
}

// 5) Ảnh chụp màn hình: chỉ từ assets/sw (bản đã che), file có thật, có trong danh sách che của build-shots.py
const build = existsSync(p('tools/sw/build-shots.py')) ? readFileSync(p('tools/sw/build-shots.py'), 'utf8') : '';
ok(build, 'thiếu tools/sw/build-shots.py (nguồn sinh ảnh đã che)');
const shotsOf = (s) => [...s.matchAll(/<img\b[^>]*src="(assets\/sw\/[\w-]+\.webp)"/g)].map((m) => m[1]);
// Task ve3p: ảnh minh hoạ app phải là giao diện tiếng Anh (kiểm ở tests/check-sw-english.mjs). Cả 3 sản phẩm có ảnh
// English: #sw-remote 5 ảnh, #sw-talent 5 ảnh, #sw-leads 5 ảnh; mỗi thẻ ở #sw-top dùng ảnh app của sản phẩm đó.
const MIN = { 'sw-remote': 5, 'sw-talent': 5, 'sw-leads': 5, 'sw-leads2': 6 };
const NEED = {
  'sw-talent': ['recruit-dashboard', 'recruit-cv', 'recruit-jd', 'recruit-process', 'recruit-matching'],
  'sw-leads': ['crm-dashboard', 'crm-list', 'crm-kanban', 'crm-calendar', 'crm-report'],
  // Task 8uat: trang con thêm 6 màn của app khách hàng (thêm khách, nhập bằng AI, phân loại, phân quyền, trợ lý AI, kết nối)
  'sw-leads2': ['crm-add-customer', 'crm-ai-import', 'crm-categories', 'crm-permissions', 'crm-ai-agent', 'crm-connectors'],
};
for (const [id, list] of Object.entries(NEED)) for (const s of list) ok(shotsOf(sec(id)).includes(`assets/sw/${s}.webp`), `#${id} thiếu ảnh assets/sw/${s}.webp`);
const card = (href) => (sec('sw-top').match(new RegExp(`<a class="card sw-p" href="#${href}"[\\s\\S]*?<\\/a>`)) || [''])[0];
for (const [href, pre] of [['sw-remote', 'staff'], ['sw-talent', 'recruit'], ['sw-leads', 'crm']])
  ok(new RegExp(`<img src="assets/sw/${pre}-[\\w-]+\\.webp"`).test(card(href)), `thẻ #${href} ở #sw-top phải dùng ảnh app assets/sw/${pre}-*.webp`);
for (const [id, n] of Object.entries(MIN)) ok(shotsOf(sec(id)).length >= n, `#${id} cần >= ${n} ảnh chụp màn hình, thấy ${shotsOf(sec(id)).length}`);
for (const src of shotsOf(main)) {
  ok(existsSync(p(src)), `thiếu file ${src}`);
  const name = src.split('/').pop().replace('.webp', '');
  ok(new RegExp(`['"]${name}['"]`).test(build), `${src} không có trong danh sách che của build-shots.py`);
}
for (const tag of main.match(/<img\b[^>]*>/g) || []) {
  ok(!/src="(https?:|[A-Za-z]:|\/)/.test(tag), `ảnh trỏ ra ngoài repo: ${tag.slice(0, 80)}`);
  ok(/\bwidth="\d+"/.test(tag) && /\bheight="\d+"/.test(tag), `ảnh thiếu width/height: ${tag.slice(0, 80)}`);
}
// mỗi ảnh chụp có chú thích đủ 3 ngôn ngữ
for (const fig of main.match(/<figure class="sw-shot[\s\S]*?<\/figure>/g) || []) {
  const c = ['ja', 'en', 'vi'].map((l) => (fig.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] === 1 && c[1] === 1 && c[2] === 1, `chú thích ảnh thiếu ngôn ngữ (${c.join('/')}): ${strip(fig).slice(0, 40)}`);
}
// Tên sản phẩm cấm lưu dạng base64 để chính file test (repo public) không nêu tên
const b64 = (s) => new RegExp(Buffer.from(s, 'base64').toString('utf8'), 'i');
const NAME_RE = b64('cGVyYW18bXVsdGlsb2dpbnxcYlBSTVxi');
const FILE_RE = b64('cGVyYW18bXVsdGlsb2dpbnx0YWxlbnR8bGVhZHN8cmVtb3Rl');
if (existsSync(p('assets/sw'))) for (const f of readdirSync(p('assets/sw'))) ok(!FILE_RE.test(f), `tên file ảnh lộ tên sản phẩm: ${f}`);
ok(!NAME_RE.test(build), 'tools/sw/build-shots.py còn tên sản phẩm (đường dẫn nguồn phải lấy từ biến môi trường)');

// 6) Không nêu tên sản phẩm / tên công ty phần mềm / đường link
const all = strip(main);
ok(!NAME_RE.test(main), 'tab SW còn tên sản phẩm');
ok(!/https?:\/\/|www\.|\.com\b|\.vn\b|@/.test(all), 'tab SW còn đường link / email trong chữ');
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini|openai/i.test(main), 'tab SW nêu tên công cụ AI');
ok(!main.includes('—'), 'tab SW có dấu gạch ngang dài');
for (const bad of ['đ/tháng', '円', 'VND', 'USD', 'Hotline']) ok(!all.includes(bad), `tab SW có giá / liên hệ bán hàng "${bad}"`);

// 7) Đủ 3 ngôn ngữ, cân nhau, EN / VI không lẫn chữ Nhật
const cnt = (l) => (main.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
ok(cnt('ja') >= 40 && cnt('ja') === cnt('en') && cnt('en') === cnt('vi'), `số khối ja/en/vi: ${cnt('ja')}/${cnt('en')}/${cnt('vi')}`);
const only = (src, l) => [...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' ');
const txt = (s, l) => strip(only(s, l));
const JP = /[ぁ-んァ-ヶ一-龥]/;
for (const l of ['en', 'vi']) { const m = txt(main, l).match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `sw/${l}: còn chữ Nhật "${m && m[0]}"`); }

// 8) Chức năng người vận hành yêu cầu, theo từng sản phẩm (VI + EN + JA)
const FUNCS = {
  'sw-remote': {
    vi: ['thời gian làm việc', 'tiến độ', 'planner', 'chấm công', 'tính điểm', 'lịch', 'email cảnh báo'],
    en: ['working time', 'progress', 'planner', 'timesheet', 'score', 'calendar', 'email alert'],
    ja: ['勤務時間', '進捗', 'プランナー', '勤怠', 'スコア', 'カレンダー', 'メール'],
  },
  'sw-talent': {
    vi: ['quản lý CV', 'quản lý JD', 'ticket', 'trạng thái ứng viên', 'AI', 'matching'],
    en: ['CV', 'JD', 'ticket', 'candidate status', 'AI', 'matching'],
    ja: ['CV', '求人票', 'チケット', '選考状況', 'AI', 'マッチング'],
  },
  'sw-leads': {
    vi: ['quản lý khách hàng', 'chống trùng', 'Kanban', 'lịch hẹn', 'email', 'báo cáo doanh thu'],
    en: ['customer', 'duplicate', 'Kanban', 'appointment', 'email', 'sales report'],
    ja: ['顧客管理', '重複', 'カンバン', '商談予定', 'メール', '売上レポート'],
  },
};
for (const [id, langs] of Object.entries(FUNCS)) for (const [l, keys] of Object.entries(langs)) {
  const t = txt(sec(id), l).toLowerCase();
  for (const k of keys) ok(t.includes(k.toLowerCase()), `#${id}/${l}: thiếu chức năng "${k}"`);
}
// Nói rõ: làm theo yêu cầu khách hàng
ok(/顧客の要望|お客様の要望/.test(txt(sec('sw-top'), 'ja')), 'sw-top/ja thiếu ý "theo yêu cầu khách hàng"');
ok(/client requirements|clients' requirements|client request/i.test(txt(sec('sw-top'), 'en')), 'sw-top/en thiếu ý "client requirements"');
ok(/yêu cầu khách hàng|yêu cầu của khách hàng/.test(txt(sec('sw-top'), 'vi')), 'sw-top/vi thiếu ý "yêu cầu khách hàng"');

// 9) Tầng giọng JA: h2 常体 kết 「。」, kw-sub thể ngắn (task ykp6: không です・ます)
const h2ja = [...main.matchAll(/<h2 class="kw[^"]*"[^>]*><span data-l="ja">([\s\S]*?)<\/span><span data-l="en">/g)].map((m) => strip(m[1]).replace(/\s/g, ''));
ok(h2ja.length === ids.length, `cần ${ids.length} tiêu đề h2 JA, thấy ${h2ja.length}`);
for (const s of h2ja) ok(/。$/.test(s) && !/(です|ます)。$/.test(s), `h2 JA sai tầng giọng: "${s}"`);
const subja = [...main.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="ja">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
ok(subja.length === ids.length, `cần ${ids.length} câu dẫn kw-sub JA, thấy ${subja.length}`);
for (const s of subja) ok(/。$/.test(s) && !/(です|でした|ます|ました|ません)/.test(s), `kw-sub JA phải thể ngắn, không です・ます: "${s.slice(0, 40)}"`);

// 10) CSS riêng trong khối đánh dấu; chuyển động chỉ transform / opacity; reduced-motion + in tĩnh
const css = (html.match(/<!-- sw-css:start -->([\s\S]*?)<!-- sw-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- sw-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- sw-css:start/end --> trong <head>');
for (const kf of css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\}\s*\}/g))
  for (const q of kf[1].matchAll(/([a-z-]+)\s*:/g)) ok(['transform', 'opacity'].includes(q[1]), `keyframes SW animate "${q[1]}" (chỉ transform/opacity)`);
ok(/prefers-reduced-motion:reduce/.test(css) && /@media print/.test(css), 'sw-css thiếu nhánh reduced-motion / print');

if (fails.length) { console.error(`FAIL check-sw-tab (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-sw-tab: tab Software Products ${ids.length} trang, ${shotsOf(main).length} ảnh đã che, đủ JA/EN/VI, không tên sản phẩm`);
