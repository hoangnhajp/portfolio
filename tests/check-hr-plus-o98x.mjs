// Tab HR thêm 4 trang (04 nghiên cứu nghiệp vụ phòng ban, 05 kiểm tra và cải tiến chất lượng, 06 theo dõi, review định kỳ,
// 07 tính lương và C&B) kèm animation theo giai đoạn làm nhân sự tại Mayekawa. Người vận hành chốt (26/11/2026):
// "không cần để mốc" => 4 trang mới không ghi mốc ngày tháng; thước tháng giữ 53 vạch (giai đoạn theo CV Rirekisho) nhưng không nhãn.
// Kiểm tĩnh: đúng thứ tự 8 trang, sidebar, ảnh nền, đủ JA / EN / VI từng khối, dữ kiện, ranh giới trung thực, CSS chuyển động.
// Chạy: node tests/check-hr-plus-o98x.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const NEW = ['hr-dept', 'hr-qa', 'hr-care', 'hr-cb'];

// 1) Thứ tự trang trong tab HR + khối đánh dấu
const main = (html.match(/<main class="wrap" data-view="hr" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'hr-top,hr-hire,hr-people,hr-ops,' + NEW.join(','), `section tab HR: ${ids.join(',')}`);
const blk = (main.match(/<!-- hr-plus:start -->([\s\S]*?)<!-- hr-plus:end -->/) || [])[1] || '';
ok(blk, 'thiếu khối <!-- hr-plus:start/end --> trong tab HR');
const sec = (id) => (blk.match(new RegExp(`<section class="pg"[^>]*id="${id}">([\\s\\S]*?)<\\/section>`)) || [])[1] || '';

// 2) Sidebar, ảnh nền
const sb = (html.match(/<nav class="sb-nav" data-for="hr" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
NEW.forEach((id, k) => {
  const a = (sb.match(new RegExp(`<a href="#${id}" data-sec="${id}">([\\s\\S]*?)<\\/a>`)) || [])[1] || '';
  ok(a.includes(`<em>0${k + 4}</em>`), `sidebar thiếu mục 0${k + 4} #${id}`);
  for (const l of ['ja', 'en', 'vi']) ok(a.includes(`data-l="${l}"`), `sidebar #${id} thiếu nhãn ${l}`);
  ok(IDS.includes(`'${id}'`), `pganh IDS thiếu '${id}'`);
  ok(existsSync(fileURLToPath(new URL(`../assets/pg/${id}.webp`, import.meta.url))), `thiếu assets/pg/${id}.webp`);
  ok(sec(id), `thiếu section #${id}`);
});

// 3) Mỗi khối tự đủ 3 ngôn ngữ; EN / VI không lẫn chữ Nhật
const units = [...blk.matchAll(/<div class="hx-dp"[\s\S]*?<\/div>|<li style="--i:\d+">[\s\S]*?<\/li>|<div class="card">[\s\S]*?<\/div>\s*<\/div>|<h2[\s\S]*?<\/h2>|<div class="hx-yh">[\s\S]*?<\/div>|<div class="hx-tm">[\s\S]*?<\/div>/g)].map((m) => m[0]);
ok(units.length === 4 + 3 + 4 + 4 + 6 + 2 + 5 + 4 + 4 + 2, `số khối nội dung: ${units.length} (cần 38)`);
for (const u of units) { const c = ['ja', 'en', 'vi'].map((l) => (u.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
  ok(c[0] > 0 && c[0] === c[1] && c[1] === c[2], `khối thiếu ngôn ngữ (ja/en/vi ${c.join('/')}): ${strip(u).slice(0, 40)}`); }
const only = (src, l) => [...src.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' ');
const txt = { ja: strip(only(blk, 'ja')), en: strip(only(blk, 'en')), vi: strip(only(blk, 'vi')) };
const JP = /[ぁ-んァ-ヶ一-龥]/;
for (const l of ['en', 'vi']) { const m = txt[l].match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `hr-plus/${l}: còn chữ Nhật "${m && m[0]}"`); }

// 4) Dữ kiện (theo master-profile §4.1 mảng HR, H1-H5, §9.7, §9.10, §9.15)
const FACTS = {
  ja: ['営業', '技術', 'サービス', '経理', '人件費', '役割の定義', '手順書', '評価シート', '内定承諾率', '試用期間', '社員アンケート', '7日目', '3週目', '6週目', 'KPI', '昇給', '昇格', '個人所得税', '社会保険', '5名', '中秋節'],
  en: ['sales', 'engineering', 'service', 'accounting', 'labour cost', 'role definitions', 'SOP', 'scorecard', 'offer acceptance', 'probation', 'staff survey', 'day 7', 'week 3', 'week 6', 'KPI', 'pay rise', 'promotion', 'income tax', 'social insurance', 'five', 'Mid-Autumn'],
  vi: ['Kinh doanh', 'Kỹ thuật', 'Dịch vụ', 'Kế toán', 'chi phí nhân sự', 'định nghĩa vai trò', 'SOP', 'phiếu đánh giá', 'nhận offer', 'thử việc', 'khảo sát nhân viên', 'ngày 7', 'tuần 3', 'tuần 6', 'KPI', 'tăng lương', 'thăng chức', 'thuế TNCN', 'BHXH', '5 người', 'Trung thu'],
};
for (const [l, keys] of Object.entries(FACTS)) for (const k of keys) ok(txt[l].toLowerCase().includes(k.toLowerCase()), `hr-plus/${l}: thiếu dữ kiện "${k}"`);
ok(!/hx-ya/.test(blk), 'không còn nhãn năm dưới thước tháng (người vận hành: không cần để mốc)');

// 5) Hình động khớp dữ kiện: 4 phòng ban + 4 tia, 4 nút PDCA, 6 mốc theo dõi, 5 bước lương, 53 vạch tháng (không nhãn mốc), 5 chấm người
const n = (s, re) => (s.match(re) || []).length;
ok(n(sec('hr-dept'), /class="hx-dp"/g) === 4 && n(sec('hr-dept'), /class="hx-sp"/g) === 4, '#hr-dept cần 4 phòng ban + 4 tia');
ok(n(sec('hr-qa'), /class="hx-rn"/g) === 4 && n(sec('hr-qa'), /class="hx-orb"/g) === 1, '#hr-qa cần 4 nút PDCA + 1 chấm chạy vòng');
ok(n((sec('hr-care').match(/<div class="hx-tl[\s\S]*?<\/ol>/) || [''])[0], /class="hx-dot"/g) === 6, '#hr-care cần 6 mốc');
ok(n((sec('hr-cb').match(/<ol class="hx-pay[\s\S]*?<\/ol>/) || [''])[0], /<li /g) === 5, '#hr-cb cần 5 bước lương tháng');
const months = (2026 - 2022) * 12 + (6 - 2) + 1;
ok(n((sec('hr-cb').match(/<div class="hx-mo"[^>]*>([\s\S]*?)<\/div>/) || ['', ''])[1], /<i /g) === months, `#hr-cb cần ${months} vạch tháng`);
ok(n((sec('hr-cb').match(/<span class="hx-pp"[^>]*>([\s\S]*?)<\/span>/) || ['', ''])[1], /<i /g) === 5, '#hr-cb cần 5 chấm người (1 lên 5)');

// 6) Ranh giới trung thực + văn phong
for (const bad of ['予算', 'ngân sách', 'budget', 'VND', 'USD', '%', '23段階', 'マエカワ', '—', '2024年3月', '03/2024', '03.2024', 'Mar 2024', 'March 2024', 'を行い', 'head of HR alongside sales', 'Nhân sự kiêm Kinh doanh', 'monthly payroll</small>',
  '2022', '2023', '2024', '2025', '2026', 'February', 'June', '02/', '06/', '02.', '06.']) ok(!blk.includes(bad), `hr-plus có cụm không được dùng "${bad}"`);
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini/i.test(blk), 'hr-plus nêu tên công cụ AI');
const h2ja = [...blk.matchAll(/<h2 class="kw[^"]*"[^>]*><span data-l="ja">([\s\S]*?)<\/span><span data-l="en">/g)].map((m) => strip(m[1]).replace(/\s/g, ''));
ok(h2ja.length === 4, `cần 4 tiêu đề h2 JA, thấy ${h2ja.length}`);
for (const s of h2ja) ok(/。$/.test(s) && !/(です|ます)。$/.test(s), `h2 JA sai tầng giọng: "${s}"`);
const subja = [...blk.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="ja">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1]));
ok(subja.length === 4, `cần 4 câu dẫn kw-sub JA, thấy ${subja.length}`);
for (const s of subja) ok(/。$/.test(s) && !/(です|でした|ます|ました|ません)/.test(s), `kw-sub JA phải thể ngắn: "${s.slice(0, 40)}"`);

// 7) CSS riêng: trong <head>, keyframes chỉ transform / opacity, chuyển động chỉ chạy khi khối đã vào khung (.sr-in), có reduced-motion + print
const css = (html.match(/<!-- hr-plus-css:start -->([\s\S]*?)<!-- hr-plus-css:end -->/) || [])[1] || '';
ok(css && html.indexOf('<!-- hr-plus-css:end -->') < html.indexOf('</head>'), 'thiếu khối <!-- hr-plus-css:start/end --> trong <head>');
const kfs = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\}\s*\}/g)];
ok(kfs.length >= 8, `cần >= 8 keyframes, thấy ${kfs.length}`);
for (const kf of kfs) for (const p of kf[2].matchAll(/([a-z-]+)\s*:/g)) ok(['transform', 'opacity'].includes(p[1]), `keyframes ${kf[1]} animate "${p[1]}" (chỉ transform/opacity)`);
for (const r of css.matchAll(/([^{}]+)\{[^{}]*\banimation:(?!none)[^{}]*\}/g))
  for (const s of r[1].split(',')) ok(/html\.sr\b/.test(s) && /\.sr-in\b/.test(s), `chuyển động không chờ vào khung: "${s.trim().slice(0, 60)}"`);
ok(/prefers-reduced-motion/.test(css) && /@media print/.test(css), 'CSS hr-plus thiếu prefers-reduced-motion / print');

if (fails.length) { console.error(`FAIL check-hr-plus-o98x (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-hr-plus-o98x: tab HR 8 trang, 4 trang mới (${NEW.join(', ')}), ${units.length} khối đủ 3 ngôn ngữ, ${months} vạch tháng, không ghi mốc ngày, ${kfs.length} keyframes`);
