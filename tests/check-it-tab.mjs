// Task g9d5: menu header bỏ chữ "Task:" trước tên từng mảng; thêm tab "IT Knowledge" (kiến thức ngành IT) 4 trang:
// #it-top (tổng quan 4 mảng kiến thức), #it-stack (ngôn ngữ / loại dự án: Python, .NET, Java, PHP, ReactJS, Angular,
// AI/ML, Data engineering: dùng làm sản phẩm gì, đặc điểm), #it-arch (frontend, API, backend, database + MVC, sơ đồ
// có điểm request chạy), #it-change (khách thêm đặc tả mới thì đổi gì ở từng tầng + vai trò BA, QA manual / auto).
// Kiểm tĩnh: nhãn menu, vị trí tab, sidebar, ảnh nền, 3 ngôn ngữ cân nhau, đủ từ khoá, tầng giọng JA, CSS chuyển động.
// Chạy: node tests/check-it-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// 1) Menu trên: không còn chữ "Task" ở nhãn nào; tab IT ngay sau AI Skills, trước Languages
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(topNav, 'thiếu <nav class="top-nav">');
const labels = [...topNav.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)].map((m) => strip(m[1]));
for (const t of labels) ok(!/task/i.test(t), `nhãn menu còn chữ Task: "${t}"`);
for (const [v, t] of [['sales', 'Sales'], ['hr', 'HR'], ['team', 'Team Management'], ['ai', 'AI Skills'], ['it', 'IT Knowledge']])
  ok(new RegExp(`data-view="${v}">${t}</a>`).test(topNav), `menu thiếu nhãn "${t}" (data-view="${v}")`);
const known = 'profile,sales,hr,team,ai,it,lang'.split(',');
const rel = (s) => s.filter((v) => known.includes(v)).join(',');
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
ok(rel(order) === known.join(','), `thứ tự tab menu trên: ${order.join(',')}`);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
ok(rel(views) === known.join(','), `thứ tự main view: ${views.join(',')}`);
// Câu dẫn sang ảnh ASEAN ở tab Languages gọi đúng tên tab mới
ok(!/Task: Sales/.test(strip(html.replace(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ''))), 'chữ hiển thị còn "Task: Sales"');

// 2) Main + 4 trang
const main = (html.match(/<main class="wrap" data-view="it" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="it" hidden>');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'it-top,it-stack,it-arch,it-change', `section tab IT: ${ids.join(',')}`);

// 3) Sidebar: 4 mục trỏ đúng section, đủ 3 ngôn ngữ
const sb = (html.match(/<nav class="sb-nav" data-for="it" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="it" hidden>');
const sbIds = [...sb.matchAll(/href="#([\w-]+)" data-sec="([\w-]+)"/g)].filter((m) => m[1] === m[2]).map((m) => m[1]).join(',');
ok(sbIds === ids.join(','), `sidebar IT trỏ: ${sbIds}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 4, `sidebar IT thiếu nhãn ${l}`);

// 4) Ảnh nền mỗi trang (pganh) + file có thật
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of ids) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(fileURLToPath(new URL(`../assets/pg/${id}.webp`, import.meta.url))), `thiếu assets/pg/${id}.webp`);
}

// 5) Đủ 3 ngôn ngữ, số khối bằng nhau, mỗi đơn vị tự đủ 3 ngôn ngữ, EN / VI không lẫn chữ Nhật
const cnt = (l) => (main.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
ok(cnt('ja') >= 60 && cnt('ja') === cnt('en') && cnt('en') === cnt('vi'), `số khối ja/en/vi: ${cnt('ja')}/${cnt('en')}/${cnt('vi')}`);
const units = [...main.matchAll(/<div class="card hr-c"[\s\S]*?<\/div><\/div>|<li class="hr-st"[\s\S]*?<\/li>|<div class="it-ly"[\s\S]*?<\/div>|<div class="card it-k"[\s\S]*?<\/div>/g)].map((m) => m[0]);
ok(units.length === 4 + 8 + 4 + 6, `số thẻ / tầng / bước: ${units.length} (cần 22: 4 mảng, 8 ngôn ngữ, 4 tầng, 6 bước)`);
for (const u of units) { const c = ['ja', 'en', 'vi'].map((l) => (u.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] > 0 && c[0] === c[1] && c[1] === c[2], `khối thiếu ngôn ngữ (ja/en/vi ${c.join('/')}): ${strip(u).slice(0, 40)}`); }
const only = (src, l) => [...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' ');
const txt = { ja: strip(only(main, 'ja')), en: strip(only(main, 'en')), vi: strip(only(main, 'vi')) };
const JP = /[ぁ-んァ-ヶ一-龥]/;
for (const l of ['en', 'vi']) { const m = txt[l].match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `it/${l}: còn chữ Nhật "${m && m[0]}"`); }

// 6) Đủ chủ đề người vận hành yêu cầu (tên công nghệ viết như nhau ở mọi ngôn ngữ)
const all = strip(main);
for (const k of ['Python', '.NET', 'Java', 'PHP', 'React', 'Angular', 'AI/ML', 'Data', 'Frontend', 'Backend', 'Database', 'API', 'MVC', 'Model', 'View', 'Controller', 'BA', 'QA', 'Manual', 'Auto'])
  ok(all.includes(k), `tab IT thiếu từ khoá "${k}"`);
const TOPIC = {
  ja: ['仕様', '影響', 'テスト', '画面', 'データ', '回帰'],
  en: ['spec', 'impact', 'test', 'screen', 'data', 'regression'],
  vi: ['đặc tả', 'ảnh hưởng', 'kiểm thử', 'màn hình', 'dữ liệu', 'hồi quy'],
};
for (const [l, keys] of Object.entries(TOPIC)) for (const k of keys) ok(txt[l].toLowerCase().includes(k.toLowerCase()), `it/${l}: thiếu ý "${k}"`);

// 6b) Task kudj (nhập vào g9d5): "làm sao mô tả được kiến thức của tôi": #it-top gắn kiến thức với bằng chứng thật,
//     3 thẻ link sang trải nghiệm có trong portfolio (JILNESTA IT, 3 phần mềm làm theo yêu cầu, hệ thống AI CV/JD)
const top = (main.match(/<section class="pg"[^>]*id="it-top">([\s\S]*?)<\/section>/) || [])[1] || '';
const pf = (top.match(/<div class="it-pf[^"]*"[\s\S]*?<!-- \/it-pf -->/) || [])[0] || '';
ok(pf, '#it-top thiếu khối bằng chứng .it-pf (kiến thức đã dùng ở đâu)');
const pfLinks = [...pf.matchAll(/<a class="card it-p"[^>]*href="#([\w-]+)"[\s\S]*?<\/a>/g)];
ok(pfLinks.map((m) => m[1]).join(',') === 'w-it,sw-top,ai-tools', `khối bằng chứng cần 3 link w-it,sw-top,ai-tools; đang ${pfLinks.map((m) => m[1]).join(',')}`);
for (const m of pfLinks) {
  ok(new RegExp(`id="${m[1]}"`).test(html), `link bằng chứng trỏ #${m[1]} không có trên trang`);
  const c = ['ja', 'en', 'vi'].map((l) => (m[0].match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] >= 2 && c[0] === c[1] && c[1] === c[2], `thẻ bằng chứng #${m[1]} thiếu ngôn ngữ (${c.join('/')})`);
}
const pfTxt = { ja: strip(only(pf, 'ja')), en: strip(only(pf, 'en')), vi: strip(only(pf, 'vi')) };
const PF = {
  ja: ['JILNESTA', '2017', '2019', '翻訳', 'UAT', '3つ', '仕様書', 'CV', 'JD'],
  en: ['JILNESTA', '2017', '2019', 'translat', 'UAT', 'Three', 'spec', 'CV', 'JD'],
  vi: ['JILNESTA', '2017', '2019', 'dịch', 'UAT', '3 phần mềm', 'đặc tả', 'CV', 'JD'],
};
for (const [l, keys] of Object.entries(PF)) for (const k of keys) ok(pfTxt[l].includes(k), `bằng chứng/${l}: thiếu "${k}"`);

// 7) Ranh giới trung thực: không tự nhận số năm code / dự án tự bịa, không tên công cụ AI, không gạch ngang dài
for (const bad of ['年の開発経験', 'years of coding', 'năm lập trình', '%']) ok(!all.includes(bad), `tab IT có cụm không được dùng "${bad}"`);
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini/i.test(main), 'tab IT nêu tên công cụ AI');
ok(!main.includes('—'), 'tab IT có dấu gạch ngang dài');

// 8) Tầng giọng JA: h2 常体 kết 「。」, kw-sub です・ます
const h2ja = [...main.matchAll(/<h2 class="kw[^"]*"[^>]*><span data-l="ja">([\s\S]*?)<\/span><span data-l="en">/g)].map((m) => strip(m[1]).replace(/\s/g, ''));
ok(h2ja.length === 4, `cần 4 tiêu đề h2 JA, thấy ${h2ja.length}`);
for (const s of h2ja) ok(/。$/.test(s) && !/(です|ます)。$/.test(s), `h2 JA sai tầng giọng: "${s}"`);
const subja = [...main.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="ja">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
ok(subja.length === 4, `cần 4 câu dẫn kw-sub JA, thấy ${subja.length}`);
for (const s of subja) ok(/(ます|ました|です)。$/.test(s), `kw-sub JA không kết です・ます: "${s.slice(0, 40)}"`);

// 9) Sơ đồ hệ thống: 4 tầng theo thứ tự + điểm request chạy; CSS riêng chỉ animate transform / opacity, có reduced-motion, in tĩnh
const sys = (main.match(/<div class="it-sys[^"]*"[\s\S]*?<!-- \/it-sys -->/) || [])[0] || '';
ok(sys, 'thiếu sơ đồ .it-sys trong #it-arch');
ok([...sys.matchAll(/data-ly="(\w+)"/g)].map((m) => m[1]).join(',') === 'fe,api,be,db', 'sơ đồ cần 4 tầng fe,api,be,db theo thứ tự');
ok(/class="it-dot"/.test(sys), 'sơ đồ thiếu điểm request .it-dot');
const css = (html.match(/<!-- it-css:start -->([\s\S]*?)<!-- it-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- it-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- it-css:start/end --> trong <head>');
const kfs = [...css.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\}\s*\}/g)];
ok(kfs.length >= 2, 'CSS IT cần keyframes cho điểm request và tầng sáng');
for (const kf of kfs) for (const p of kf[1].matchAll(/([a-z-]+)\s*:/g)) ok(['transform', 'opacity'].includes(p[1]), `keyframes IT animate "${p[1]}" (chỉ transform/opacity)`);
ok(/prefers-reduced-motion/.test(css) && /@media print/.test(css), 'CSS IT thiếu nhánh reduced-motion / print');
ok(/\.sr-in/.test(css), 'chuyển động sơ đồ chỉ chạy khi khối đã hiện (.sr-in)');

if (fails.length) { console.error(`FAIL check-it-tab (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-it-tab: menu bỏ "Task:", tab "IT Knowledge" 4 trang (${ids.join(', ')}), ja/en/vi ${cnt('ja')} khối mỗi thứ tiếng`);
