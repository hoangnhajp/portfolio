// Task a9f4: slide cuối My Profile (#pcai "語学、PC、AI") tách 2 ý.
//  - Ý AI (Excel/PowerPoint, ChatGPT/Claude, hệ thống AI CV/JD, Sesame) chuyển sang tab Task: AI Skills, trang #ai-tools (05).
//  - Ý ngoại ngữ thành tab mới "Languages" trên menu (2 lá cờ Nhật, Anh kế bên), 4 trang portfolio có chuyển động:
//    #lang-top (tổng quan 3 ngôn ngữ), #lang-ja (tiếng Nhật: hourensou, làm chủ tiến độ, task ila7), #lang-en (tiếng Anh: ASEAN, đàm phán),
//    #lang-bridge (task ila7: cầu nối giữa CEO và đội ngũ / phòng ban người Việt).
//  - Tab My Profile còn 9 slide (cover + 01..08, #toc ẩn), không còn #pcai.
// Chạy: node tests/check-lang-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const build = readFileSync(new URL('../tools/gx/build.mjs', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const JP = /[぀-ヿ一-龯]/;
const strip = (s) => s.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const only = (s, l) => s.replace(/<(\w+)\b[^>]*\bdata-l="(ja|en|vi)"[^>]*>[\s\S]*?<\/\1>/g, (m, t, x) => (x === l ? m : ' '));

// 1) Menu trên: tab Languages + 2 cờ Nhật, Anh
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const langA = (topNav.match(/<a href="#lang-top" data-view="lang">([\s\S]*?)<\/a>/) || [])[1] || '';
ok(langA, 'top-nav thiếu <a href="#lang-top" data-view="lang">');
ok(/Languages/.test(strip(langA)), 'tab phải tên "Languages"');
ok(/class="flg flg--jp"/.test(langA) && /class="flg flg--uk"/.test(langA), 'tab Languages thiếu 2 cờ Nhật (flg--jp) và Anh (flg--uk)');
ok(/<svg class="flg flg--jp"[^>]*aria-hidden="true"/.test(langA) && /<svg class="flg flg--uk"[^>]*aria-hidden="true"/.test(langA), 'cờ là hình trang trí: cần aria-hidden');
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]).filter((v) => v !== 'sw' && v !== 'it' && v !== 'jd' && v !== 'wv').join(','); // task g6pn: sw kiểm ở check-sw-tab; task g9d5: it ở check-it-tab
ok(order === 'profile,sales,hr,team,ai,lang', `thứ tự tab menu trên (task 4ubf thêm Task: HR sau Sales): ${order}`);

// 2) Main + sidebar
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]).filter((v) => v !== 'sw' && v !== 'it' && v !== 'jd' && v !== 'wv').join(',');
ok(views === 'profile,sales,hr,team,ai,lang', `view phải là profile,sales,hr,team,ai,lang; đang ${views}`);
const main = (html.match(/<main class="wrap" data-view="lang" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="lang" hidden>');
const SECS = ['lang-top', 'lang-ja', 'lang-en', 'lang-bridge'];
const ids = [...main.matchAll(/<section class="pg"[^>]*\bid="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === SECS.join(','), `tab Languages: thứ tự trang ${ids.join(',')}`);
const nav = (html.match(/<nav class="sb-nav" data-for="lang" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
const nums = [...nav.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
ok(nums === 'lang-top:TOP lang-ja:01 lang-en:02 lang-bridge:03', `mục lục Languages sai: ${nums}`);
for (const l of ['ja', 'en', 'vi']) ok((nav.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 4, `mục lục Languages thiếu nhãn ${l}`);

// 3) Nội dung: đủ JA/EN/VI, đúng dữ kiện hồ sơ, giọng ứng viên, không tên công ty, không gạch dài
const cnt = (l) => (main.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
ok(cnt('ja') >= 30 && cnt('ja') === cnt('en') && cnt('en') === cnt('vi'), `số khối data-l lệch ja/en/vi ${cnt('ja')}/${cnt('en')}/${cnt('vi')}`);
const txt = { ja: strip(only(main, 'ja')), en: strip(only(main, 'en')), vi: strip(only(main, 'vi')) };
for (const l of ['en', 'vi']) { const m = txt[l].match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `lang/${l}: còn chữ Nhật "${m && m[0]}"`); }
const FACTS = {
  // task bg9f: bỏ ngày tháng cạnh bằng cấp và bỏ TOEIC 680 (xem tests/check-lang-no-cert-dates.mjs)
  ja: ['JLPT N2', 'ビジネス英語', '母語', '日本人社長', '報告', '会議', '交渉', 'ASEAN', '英語で発表', '欧州企業のCEO', '通訳', '翻訳', '仕様書', 'メール'],
  en: ['JLPT N2', 'Business English', 'native', 'Japanese president', 'report', 'meeting', 'negotiat', 'ASEAN', 'presented in English', 'European company', 'interpret', 'translat', 'spec', 'email'],
  vi: ['JLPT N2', 'Tiếng Anh công việc', 'bản ngữ', 'Tổng giám đốc người Nhật', 'báo cáo', 'họp', 'đàm phán', 'ASEAN', 'thuyết trình bằng tiếng Anh', 'công ty châu Âu', 'thông dịch', 'dịch', 'đặc tả', 'email'],
};
// task ila7: so không phân biệt hoa thường (dữ kiện dịch / đặc tả nằm ở thẻ #lang-top); tab Languages không còn Sesame
for (const [l, keys] of Object.entries(FACTS)) for (const k of keys) ok(txt[l].toLowerCase().includes(k.toLowerCase()), `lang/${l}: thiếu dữ kiện "${k}"`);
ok(!/sesame/i.test(main), 'lang: còn "Sesame" (task ila7 bỏ)');
ok((txt.en.match(/\bI\b/g) || []).length >= 8, 'lang/en: ít câu ngôi thứ nhất "I"');
ok((txt.vi.match(/(^|\s)[Tt]ôi\s/g) || []).length >= 8, 'lang/vi: ít câu có chủ ngữ "tôi"');
ok((txt.ja.match(/(ました|ます|でした|です)。/g) || []).length >= 8, 'lang/ja: ít câu です・ます');
for (const bad of ['MAYEKAWA', 'MYCOM', 'JILNESTA', 'Isuzu', 'LienViet', '—', 'European CEOs', 'Japanese presidents'])
  ok(!main.includes(bad), `lang: còn "${bad}"`);
ok(!/(^|[\s,.(])bạn(?! bè)([\s,.!?)]|$)/i.test(txt.vi), 'lang/vi: còn gọi người đọc là "bạn"');
// Mỗi trang có tiêu đề kw + câu dẫn kw-sub đủ 3 ngôn ngữ
for (const id of SECS) {
  const sec = (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
  ok(/<h2 class="kw rv"/.test(sec), `#${id} thiếu tiêu đề h2.kw`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`class="kw-sub rv"[^>]*data-l="${l}"`).test(sec), `#${id} thiếu câu dẫn kw-sub ${l}`);
}

// 4) Chuyển động: khối CSS + JS riêng, chỉ transform/opacity, vào màn hình mới chạy, reduced-motion + in tĩnh
const css = (html.match(/<!-- lang-css:start -->([\s\S]*?)<!-- lang-css:end -->/) || [])[1] || '';
const js = (html.match(/<!-- lang:start -->([\s\S]*?)<!-- lang:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- lang-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- lang-css:start/end --> trong <head>');
ok(js, 'thiếu khối <!-- lang:start/end -->');
const kfs = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)];
ok(kfs.length >= 4, `cần >= 4 @keyframes cho tab Languages, đang ${kfs.length}`);
for (const [, name, body] of kfs) {
  const props = [...body.matchAll(/([\w-]+)\s*:/g)].map((m) => m[1]).filter((p) => !/^\d/.test(p));
  const bad = props.filter((p) => !['transform', 'opacity', 'offset-distance'].includes(p));
  ok(!bad.length, `@keyframes ${name} animate thuộc tính nặng: ${bad.join(',')}`);
}
ok(/prefers-reduced-motion:\s*reduce/.test(css), 'lang-css thiếu nhánh reduced-motion');
ok(/@media print/.test(css), 'lang-css thiếu nhánh in');
ok(/IntersectionObserver/.test(js) && /lg-on/.test(js), 'JS phải bật .lg-on khi khối vào khung nhìn (IntersectionObserver)');
ok(/animation-play-state:\s*paused/.test(css), 'chuyển động phải dừng khi ra khỏi khung nhìn (animation-play-state:paused)');
for (const id of SECS) ok(new RegExp(`id="${id}"[\\s\\S]*?class="[^"]*\\blg-(meter|chat|stage|bridge)\\b`).test(main), `#${id} thiếu khối động lg-*`);

// 5) Ảnh nền riêng cho trang mới
const IDS = ((html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').match(/'[^']+'/g)?.map((s) => s.slice(1, -1)) || [];
for (const id of [...SECS, 'ai-tools']) {
  ok(IDS.includes(id), `mảng IDS ảnh nền thiếu '${id}'`);
  ok(existsSync(new URL(`../assets/pg/${id}.webp`, import.meta.url)), `thiếu ảnh assets/pg/${id}.webp`);
}

// 6) Ý AI chuyển sang tab AI (#ai-tools, mục 05)
const ai = (html.match(/<main class="wrap" data-view="ai" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const tools = (ai.match(/<section class="pg"[^>]*id="ai-tools"[\s\S]*?<\/section>/) || [''])[0];
ok(tools, 'tab AI thiếu trang #ai-tools');
// task 22v8: không nêu tên công cụ AI (ChatGPT / Claude / Sesame), thay bằng mô tả chung
for (const k of ['Excel', 'PowerPoint', '生成AI', 'Generative AI', 'AI tạo sinh', 'AI conversation practice', '設計と開発を主導', 'led the design and development', 'chủ trì thiết kế'])
  ok(tools.includes(k), `#ai-tools thiếu "${k}"`);
ok(/href="#ai-tools" data-sec="ai-tools"><em>05<\/em>/.test(html), 'mục lục AI thiếu 05 #ai-tools');

// 7) Tab My Profile không còn #pcai, còn 9 slide
ok(!/pcai/.test(html), 'index.html còn tham chiếu pcai');
ok(!/pcai/.test(build), 'tools/gx/build.mjs còn cảnh / bước pcai');
ok(!existsSync(new URL('../assets/pg/pcai.webp', import.meta.url)), 'còn ảnh mồ côi assets/pg/pcai.webp');
const prof = (html.match(/<main class="wrap" data-view="profile">([\s\S]*?)<\/main>/) || [])[1] || '';
const pids = [...prof.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
ok(pids.join(',') === 'cover,toc,profile,projects,skillmap,career,w-mycom,w-jil,w-it,w-early', `tab Profile: ${pids.join(',')}`);

if (fails.length) { console.error(`FAIL check-lang-tab (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lang-tab: tab Languages (2 cờ Nhật, Anh) 4 trang động đủ JA/EN/VI, ý AI chuyển sang #ai-tools, Profile còn 9 slide không còn #pcai');
