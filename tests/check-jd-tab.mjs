// Task wp5x: tab menu "JD ANDPAD" (đứng trước Software Products), 2 trang:
// #jd-top = nguyên văn JD Customer Success Staff của ANDPAD Vietnam (nguồn: tests/fixtures/jd-andpad.txt, chép đúng PDF gốc),
// #jd-fit = biểu đồ chân dung ứng viên phù hợp, MỌI con số đếm lại từ chính JD (không số bịa):
//   radar 9 năng lực (thang điểm theo luật ghi trên trang), thanh cơ cấu yêu cầu (bắt buộc / ngoại ngữ / học vấn / ưu tiên),
//   tần suất từ khoá trong mục 3 + 4 của JD, 7 đầu việc chia 4 chặng đồng hành khách hàng, 3 vòng phỏng vấn.
// Chạy: node tests/check-jd-tab.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8').normalize('NFC');
const jd = readFileSync(p('tests/fixtures/jd-andpad.txt'), 'utf8').normalize('NFC').replace(/\r/g, '');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const ent = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const strip = (s) => ent(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const sq = (s) => s.replace(/\s+/g, '');

// 1) Menu trên + main: tab JD ngay sau Software Products (task 78z7), menu và main cùng thứ tự
const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#jd-top" data-view="jd">JD ANDPAD<\/a>/.test(topNav), 'top-nav thiếu <a href="#jd-top" data-view="jd">JD ANDPAD</a>');
const order = [...topNav.matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
const views = [...html.matchAll(/<main class="wrap" data-view="(\w+)"/g)].map((m) => m[1]);
ok(order.join(',') === views.join(','), `menu trên và main lệch nhau: ${order} / ${views}`);
// task 78z7: thứ tự ... Software Products, JD ANDPAD, Andpad Info
ok(order.indexOf('sw') === order.indexOf('jd') - 1 && order.indexOf('jd') === order.indexOf('ap') - 1, `tab Software Products phải đứng ngay trước JD, rồi tới Andpad Info: ${order}`);

const main = (html.match(/<main class="wrap" data-view="jd" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
ok(main, 'thiếu <main class="wrap" data-view="jd" hidden>');
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'jd-top,jd-fit,jd-match', `section tab JD: ${ids.join(',')}`); // task yt50 thêm #jd-match (tests/check-jd-match.mjs)
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];

// 2) Sidebar: TOP + 01, đủ 3 ngôn ngữ; nhãn eb khớp số
const sb = (html.match(/<nav class="sb-nav" data-for="jd" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(sb, 'thiếu <nav class="sb-nav" data-for="jd" hidden>');
const nums = [...sb.matchAll(/href="#([\w-]+)" data-sec="\1"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
ok(nums === 'jd-top:TOP jd-fit:01 jd-match:02', `sidebar JD: ${nums}`);
for (const l of ['ja', 'en', 'vi']) ok((sb.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 3, `sidebar JD thiếu nhãn ${l}`);
ok(/<span class="eb rv">01　<b>/.test(sec('jd-fit')), '#jd-fit: nhãn eb phải bắt đầu 01');

// 3) Ảnh nền pganh mỗi trang
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
for (const id of ids) {
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(p(`assets/pg/${id}.webp`)), `thiếu assets/pg/${id}.webp`);
}

// 4) #jd-top: nguyên văn từng dòng của JD, theo đúng thứ tự, trong khối .jd-doc lang="vi"
const top = sec('jd-top');
const doc = (top.match(/<div class="jd-doc[^"]*"[^>]*lang="vi"[^>]*>([\s\S]*?)<\/div>\s*<!-- \/jd-doc -->/) || [])[1] || '';
ok(doc, '#jd-top thiếu <div class="jd-doc" lang="vi"> ... </div><!-- /jd-doc -->');
ok(!/data-l=/.test(doc), 'nguyên văn JD không được tách theo ngôn ngữ (data-l)');
const lines = jd.split('\n').filter((s) => s.trim()).map((s) => s.replace(/^(#+|-) /, '').replace(/\*\*/g, '').trim());
ok(lines.length >= 60, `fixture JD chỉ có ${lines.length} dòng`);
const docText = sq(strip(doc));
let at = 0;
for (const ln of lines) {
  const i = docText.indexOf(sq(ln), at);
  if (i < 0) { fails.push(`#jd-top thiếu (hoặc sai thứ tự) dòng JD: "${ln.slice(0, 60)}"`); continue; }
  at = i + sq(ln).length;
}
ok(sq(lines.join('')).length === docText.replace(/[•]/g, '').length, `#jd-top có chữ ngoài nguyên văn (${docText.length} ký tự / JD ${sq(lines.join('')).length})`);
for (const u of ['https://andpad.vn/', 'https://andpad.co.jp/']) ok(doc.includes(`href="${u}" target="_blank" rel="noopener"`), `link ${u} cần target=_blank rel=noopener`);

// Số liệu đếm lại từ JD
const part = (from, to) => jd.slice(jd.indexOf(from), to ? jd.indexOf(to) : undefined);
const bullets = (head) => { const r = jd.slice(jd.indexOf(head) + head.length); return (r.slice(0, r.search(/\n(\*\*|##)/)).match(/^- /gm) || []).length; };
const scope = part('## 3.', '## 5.');
const fit = sec('jd-fit');

// 5) Radar 9 năng lực: điểm 3..5, toạ độ đa giác tính đúng từ điểm (tâm 160,150, bán kính 110, trục đầu ở đỉnh, đều 40°)
const radar = (fit.match(/<svg class="jd-radar"[\s\S]*?<\/svg>/) || [''])[0];
ok(radar, '#jd-fit thiếu svg.jd-radar');
const vals = [...radar.matchAll(/<circle class="jd-pt" data-v="(\d)"/g)].map((m) => +m[1]);
ok(vals.length === 9 && vals.every((v) => v >= 3 && v <= 5), `radar cần 9 điểm 3..5: ${vals}`);
const pts = ((radar.match(/<polygon class="jd-area" points="([^"]+)"/) || [])[1] || '').trim().split(/\s+/).map((s) => s.split(',').map(Number));
ok(pts.length === 9, `đa giác radar cần 9 đỉnh: ${pts.length}`);
vals.forEach((v, i) => {
  const a = (-90 + i * 40) * Math.PI / 180, r = 110 * v / 5;
  const [x, y] = pts[i] || [NaN, NaN];
  ok(Math.abs(x - (160 + r * Math.cos(a))) < 0.6 && Math.abs(y - (150 + r * Math.sin(a))) < 0.6, `đỉnh radar ${i} lệch: ${x},${y}`);
});
for (const l of ['ja', 'en', 'vi']) ok((radar.match(new RegExp(`<text[^>]*data-l="${l}"`, 'g')) || []).length === 9, `nhãn trục radar thiếu ${l}`);
ok((radar.match(/<title>/g) || []).length >= 9, 'radar: mỗi điểm cần <title> (tooltip khi rê chuột)');

// 6) Cơ cấu yêu cầu: đếm đúng gạch đầu dòng trong JD
const want = { must: bullets('**Yêu cầu bắt buộc (Must-have):**'), lang: bullets('**Ngoại ngữ:**'), edu: 1, nice: bullets('**Ưu tiên (Nice-to-have):**') };
ok(want.must === 7 && want.nice === 2 && want.lang === 2, `đếm fixture lạ: ${JSON.stringify(want)}`);
for (const [k, n] of Object.entries(want)) {
  ok(new RegExp(`class="jd-seg jd-seg--${k}"[^>]*data-n="${n}"[^>]*style="flex:${n}"`).test(fit), `thanh cơ cấu: ${k} phải data-n="${n}" style="flex:${n}"`);
}

// 7) Tần suất từ khoá (mục 3 + 4 của JD): data-n = số lần đếm thật, độ dài thanh = n / max
const KW = { kh: /khách hàng/gi, dt: /đào tạo|hướng dẫn|tài liệu/gi, it: /\bIT\b|công nghệ|ERP|CRM|Software|SaaS/gi, ht: /hệ thống/gi,
  gq: /giải quyết|xử lý|đề xuất giải pháp/gi, sl: /Sales|demo|thuyết trình/gi, tm: /nhóm|Leader|Supervisor/g, jp: /Nhật/g };
const cnt = Object.fromEntries(Object.entries(KW).map(([k, r]) => [k, (scope.match(r) || []).length]));
const max = Math.max(...Object.values(cnt));
const rows = [...fit.matchAll(/<li class="jd-kw" data-k="(\w+)" data-n="(\d+)" style="--w:(\d+)%[;"]/g)];
ok(rows.length === 8, `cần 8 thanh từ khoá, thấy ${rows.length}`);
let prev = Infinity;
for (const [, k, n, w] of rows) {
  ok(+n === cnt[k], `từ khoá ${k}: trang ghi ${n}, JD đếm được ${cnt[k]}`);
  ok(+w === Math.round(cnt[k] / max * 100), `từ khoá ${k}: độ dài ${w}% (đúng ${Math.round(cnt[k] / max * 100)}%)`);
  ok(+n <= prev, 'thanh từ khoá phải xếp giảm dần'); prev = +n;
}

// 8) 7 đầu việc chia 4 chặng, tổng = số gạch đầu dòng mục 3
const duties = (part('## 3.', '## 4.').match(/^- /gm) || []).length;
const stages = [...fit.matchAll(/<li class="jd-st" data-n="(\d)"/g)].map((m) => +m[1]);
ok(stages.length === 4, `cần 4 chặng, thấy ${stages.length}`);
ok(stages.reduce((a, b) => a + b, 0) === duties, `tổng đầu việc ${stages.join('+')} khác ${duties} của JD`);

// 9) 3 vòng phỏng vấn đúng người phỏng vấn
const rounds = [...fit.matchAll(/<li class="jd-rd"[\s\S]*?<\/li>/g)].map((m) => strip(m[0]));
ok(rounds.length === 3 && /COO/.test(rounds[0]) && /Manager/.test(rounds[1]) && /CEO/.test(rounds[2]), `3 vòng phỏng vấn sai: ${rounds.map((r) => r.slice(0, 30))}`);

// 10) Ba ngôn ngữ cân nhau ở trang biểu đồ; chữ không vi phạm luật chung
const c = ['ja', 'en', 'vi'].map((l) => (fit.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
ok(c[0] > 20 && c[0] === c[1] && c[1] === c[2], `#jd-fit số chữ 3 ngôn ngữ lệch: ${c.join('/')}`);
ok(/theo cách đọc của tôi|私の読み方|my reading/.test(fit), '#jd-fit cần ghi rõ thang điểm là cách đọc của ứng viên');
ok(!main.includes('—'), 'tab JD có dấu gạch ngang dài');
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini|openai/i.test(main), 'tab JD nêu tên công cụ AI');

// 11) CSS riêng: trong <head>, chỉ animate transform / opacity, có màn hẹp, reduced-motion, in
const css = (html.match(/<!-- jd-css:start -->([\s\S]*?)<!-- jd-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- jd-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- jd-css:start/end --> trong <head>');
for (const k of css.matchAll(/@keyframes\s+\w+\{([\s\S]*?\})\}/g)) {
  const props = [...k[1].matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]).filter((x) => !['transform', 'opacity'].includes(x));
  ok(!props.length, `keyframes animate thuộc tính ngoài transform/opacity: ${props}`);
}
ok(/html\.sr [^{]*\.sr-in/.test(css), 'chuyển động chỉ chạy khi khối đã hiện (.sr-in)');
ok(/@media screen and \(max-width:\s*700px\)/.test(css), 'thiếu nhánh màn hẹp <= 700px (chỉ screen, để bản in A4 giữ bố cục 2 cột)');
ok(/prefers-reduced-motion:reduce/.test(css) && /@media print/.test(css), 'thiếu reduced-motion / print');

if (fails.length) { console.error('FAIL check-jd-tab\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-jd-tab (JD ${lines.length} dòng nguyên văn; từ khoá ${JSON.stringify(cnt)})`);
