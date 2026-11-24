// Mỗi section chỉ còn keyword + 1 câu, không viết dài dòng (task f5po, chữ do ChatGPT viết lại).
// Chạy: node tests/check-profile-keywords.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const view = (v) => (html.match(new RegExp(`<main class="wrap" data-view="${v}"[^>]*>([\\s\\S]*?)</main>`)) || [])[1] || '';
const views = ['profile', 'team', 'ai'].map(view).map((s) => s.replace(/<figure class="gx[\s\S]*?<\/figure>/g, '').replace(/<(script|style)[\s\S]*?<\/\1>/g, ''));
const body = views.join('\n');
const LIM = { ja: 70, en: 140, vi: 150 };

// 1. Không còn đoạn chữ dài: mọi khối chữ một ngôn ngữ ở Profile / Team / AI nằm trong giới hạn 1 câu
for (const l of ['ja', 'en', 'vi']) {
  const blocks = [...body.matchAll(new RegExp(`<(p|span|li|h3)[^>]*data-l="${l}"[^>]*>((?:(?!<\\/\\1>)[\\s\\S])*?)</\\1>`, 'g'))].map((m) => strip(m[2]));
  const items = [...body.matchAll(new RegExp(`<div class="(?:lines|aitab)" data-l="${l}">([\\s\\S]*?)</div>\\s*(?=<div class="(?:lines|aitab|kw1)|</div>|<span|<h3|<div class="g|$)`, 'g'))]
    .flatMap((m) => [...m[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => strip(p[1])));
  // thẻ kỹ năng (#skillmap) và điểm mạnh (#pr): <div data-l><h3>tiêu đề</h3>[chip]<p>câu</p></div>
  const cards = [...body.matchAll(new RegExp(`<div data-l="${l}"><h3>[^<]*</h3>(?:<div class="chips"[^>]*>[\\s\\S]*?</div>)?<p>([\\s\\S]*?)</p></div>`, 'g'))].map((m) => strip(m[1]));
  ok(cards.length >= 13, `${l}: chỉ thấy ${cards.length} thẻ kỹ năng / điểm mạnh`);
  const long = [...blocks, ...items, ...cards].filter((t) => t.length > LIM[l]);
  ok(long.length === 0, `${l}: ${long.length} khối dài hơn ${LIM[l]} ký tự: ${long.slice(0, 2).map((t) => t.slice(0, 50)).join(' / ')}`);
}

// 2. Danh sách kinh nghiệm (.lines không phải bảng ngày tháng): đúng 1 câu mỗi ngôn ngữ, có hàng keyword ngay trước
const trios = [...body.matchAll(/(<div class="kw1"[\s\S]*?<\/div>\s*<\/div>\s*)?<div class="lines" data-l="ja">([\s\S]*?)<\/div>\s*<div class="lines" data-l="en">([\s\S]*?)<\/div>\s*<div class="lines" data-l="vi">([\s\S]*?)<\/div>/g)]
  .filter((m) => !/<p><b>/.test(m[2]));
// task p0r6: thẻ Sales #w-mycom thành workflow zigzag 7 bước (không còn keyword + câu), nên ngưỡng 11 / 16
ok(trios.length >= 11,`chỉ thấy ${trios.length} danh sách kinh nghiệm`);
for (const m of trios) {
  const n = [m[2], m[3], m[4]].map((s) => (s.match(/<p>/g) || []).length);
  ok(n.every((x) => x === 1), `danh sách "${strip(m[3]).slice(0, 40)}" phải còn 1 câu mỗi ngôn ngữ, đang ${n.join('/')}`);
  ok(!!m[1], `danh sách "${strip(m[3]).slice(0, 40)}" thiếu hàng keyword .kw1 ngay trước`);
}

// 3. Hàng keyword: 3 đến 5 chip mỗi ngôn ngữ, số chip ja/en/vi bằng nhau, chip ngắn, không 「・」
const rows = [...body.matchAll(/<div class="kw1[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g)];
ok(rows.length >= 16,`chỉ thấy ${rows.length} hàng keyword`);
for (const [, r] of rows) {
  const n = ['ja', 'en', 'vi'].map((l) => ((r.match(new RegExp(`<div class="chips" data-l="${l}">([\\s\\S]*?)(?:</div>|$)`)) || ['', ''])[1].match(/class="chip"/g) || []).length);
  ok(n[0] >= 3 && n[0] <= 5 && n[0] === n[1] && n[1] === n[2], `hàng keyword lệch / sai số chip: ${n.join('/')} (${strip(r).slice(0, 40)})`);
  for (const c of r.matchAll(/<span class="chip">([^<]*)<\/span>/g)) ok(c[1].length <= 34 && !/[・。.]$|・/.test(c[1]), `chip quá dài hoặc có 「・」/dấu câu: "${c[1]}"`);
}

// 4. Tóm tắt đầu Hồ sơ: keyword giữ dữ kiện cốt lõi + đúng 1 câu
const card = (body.match(/<span class="lbl">Summary[\s\S]*?<p data-l="vi">[\s\S]*?<\/p>/) || [''])[0];
for (const k of ['約11年', 'JILNESTA', 'MAYEKAWA', 'about 11 years', 'khoảng 11 năm']) ok(card.includes(k), `tóm tắt Hồ sơ thiếu keyword "${k}"`);
const sj = strip((card.match(/<p data-l="ja">([\s\S]*?)<\/p>/) || ['', ''])[1]);
ok(sj && (sj.match(/。/g) || []).length === 1, `tóm tắt Hồ sơ JA phải đúng 1 câu: "${sj.slice(0, 60)}"`);

// 5. Câu dẫn của các tab Team / AI: 1 câu + hàng keyword
for (const id of ['team-top', 'team-daily', 'ai-top', 'ai-people']) {
  const s = (html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
  ok(/<p class="kw-sub[^"]*"[^>]*data-l="vi">[\s\S]*?<\/p>\s*(<figure class="gx[\s\S]*?<\/figure>\s*)?<div class="kw1/.test(s), `#${id}: câu dẫn thiếu hàng keyword ngay sau (hoặc ngay sau cảnh gx)`);
}
// 6. 3 điểm mạnh (#pr): mỗi thẻ có 3 đến 5 keyword ở cả 3 ngôn ngữ
const pr = (html.match(/<section[^>]*id="pr"[\s\S]*?<\/section>/) || [''])[0];
const prKw = [...pr.matchAll(/<div data-l="(ja|en|vi)"><h3>[^<]*<\/h3><div class="chips"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => (m[2].match(/class="chip"/g) || []).length);
ok(prKw.length === 9 && prKw.every((n) => n >= 3 && n <= 5), `#pr: cần 3 thẻ x 3 ngôn ngữ có 3 đến 5 keyword, đang ${prKw.join(',') || 'không có'}`);
const daily =(html.match(/<section[^>]*id="team-daily"[\s\S]*?<\/section>/) || [''])[0];
ok((daily.match(/href="#aiops"/g) || []).length >= 3 && (daily.match(/href="#aidash"/g) || []).length >= 3, '#team-daily mất link chéo #aiops / #aidash khi rút gọn');
ok(!/[—]/.test(body), 'có dấu gạch ngang dài');

if (fails.length) { console.error('FAIL\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK profile-keywords: keyword + 1 câu cho mọi khối kinh nghiệm');
