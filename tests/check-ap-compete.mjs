// Tab Andpad Info nói rõ: tên sản phẩm, thị phần, đối thủ cạnh tranh, ưu và nhược điểm, đối thủ đang có lợi thế gì,
// ANDPAD đang có lợi thế gì. Đối chiếu trang chính thức ngày 25/11/2026.
// - #ap-market mục 2: tên sản phẩm + thị phần (đúng thước đo MIC, không bịa %) + 5 đối thủ kèm công ty vận hành.
// - #ap-compete (ngay sau): ưu / nhược của ANDPAD, bảng 5 đối thủ (công ty, lợi thế, hạn chế), 2 ô "ai có lợi thế gì".
// Chống nhầm công ty: mỗi đối thủ phải ghi đúng công ty vận hành, và số trích dẫn của dòng đó phải trỏ về trang của
// chính công ty đó (không trỏ sang trang đối thủ khác). Buildee do 株式会社リバスタ vận hành (không phải MCデータプラス / グリーンサイト).
// Chạy: node tests/check-ap-compete.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
const strip = (x) => x.replace(/<sup[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const lang = (x, l) => strip([...x.matchAll(new RegExp(`<(\\w+)\\b[^>]*data-l="${l}"[^>]*>([\\s\\S]*?)<\\/\\1>`, 'g'))].map((m) => m[2]).join(' '));
const cites = (x) => [...x.matchAll(/<sup class="ap-c">\[([\d,]+)\]<\/sup>/g)].flatMap((m) => m[1].split(',').map(Number));
const refsOf = (s, id) => Object.fromEntries([...s.matchAll(new RegExp(`<li id="${id}-r(\\d+)">[\\s\\S]*?<a href="([^"]+)"`, 'g'))].map((m) => [Number(m[1]), m[2]]));

const COMP = [
  ['SPIDERPLUS', 'スパイダープラス株式会社', 'SpiderPlus', 'spider-plus.com', [/2\.3万社|23,000/, /80万人|800,000/]],
  ['KANNA', '株式会社アルダグラム', 'Aldagram', 'kanna4u.com', [/初期費用0円/, /無料/]],
  ['Photoruction', '株式会社フォトラクション', 'Photoruction Inc', 'photoruction.com', [/AI-BPO/]],
  ['ダンドリワーク', '株式会社ダンドリワーク', 'DANDORI WORK', 'dandori-work.com', [/1,700/, /20万円/]],
  ['Buildee', '株式会社リバスタ', 'RVSTA', 'buildee.jp', [/1,061/, /協力会社は無料/]],
];
const doms = COMP.map((c) => c[3]);
// mỗi dòng: đúng sản phẩm, đúng công ty (3 ngôn ngữ), nguồn chỉ là trang của chính công ty đó
const rowCheck = (rows, refs, where) => {
  ok(rows.length === COMP.length, `${where}: cần đúng ${COMP.length} đối thủ, thấy ${rows.length}`);
  COMP.forEach(([prod, coJa, coEn, dom], i) => {
    const r = rows[i] || '';
    ok(lang(r, 'ja').startsWith(prod) || strip(r).startsWith(prod), `${where} dòng ${i + 1} phải là ${prod}`);
    ok(lang(r, 'ja').includes(coJa), `${where} ${prod}: công ty JA phải là ${coJa}`);
    ok(lang(r, 'en').includes(coEn) && lang(r, 'vi').includes(coEn), `${where} ${prod}: công ty EN/VI phải có ${coEn}`);
    const used = [...new Set(cites(r))].map((n) => refs[n] || '');
    ok(used.length && used.every((u) => u.includes(dom)), `${where} ${prod}: mọi nguồn của dòng phải là trang ${dom}, đang: ${used.join(' ')}`);
    for (const d of doms) if (d !== dom) ok(!used.some((u) => u.includes(d)), `${where} ${prod}: dẫn nhầm nguồn của đối thủ khác ${d}`);
  });
};

// ---------- #ap-market mục 2 ----------
const m = sec('ap-market');
ok(m, 'thiếu #ap-market');
const left = (m.match(/<div class="ap-mk-l">[\s\S]*?<\/div>/) || [''])[0];
ok(/ANDPAD/.test(lang(left, 'ja')) && /クラウド型建設プロジェクト管理サービス/.test(lang(left, 'ja')), 'JA phải nêu tên sản phẩm ANDPAD + loại sản phẩm theo lời hãng');
ok(/^Sản phẩm: ANDPAD/.test(lang(left.match(/<h3 data-l="vi"[\s\S]*?<\/h3>/)?.[0] || '', 'vi')), 'VI: tiêu đề phải bắt đầu "Sản phẩm: ANDPAD"');
for (const [l, rx] of [['ja', /導入企業数[\s\S]*8年連続/], ['en', /adopting companies[\s\S]*8 years/i], ['vi', /số doanh nghiệp sử dụng[\s\S]*8 năm liền/]])
  ok(rx.test(lang(left, l)), `thị phần (${l}) phải ghi đúng thước đo số doanh nghiệp sử dụng, 8 năm liền`);
ok(/Thị phần/.test(lang(left, 'vi')) && /MIC/.test(lang(left, 'vi')) && /12\/2025/.test(lang(left, 'vi')), 'VI phải có nhãn "Thị phần", nguồn MIC, 12/2025');
ok(/không công bố/.test(lang(left, 'vi')) && !/\d+\s?%/.test(lang(left, 'vi')), 'VI: không bịa tỷ lệ %, phải ghi rõ % không được công bố');
ok(/27[.,]9|279/.test(lang(left, 'vi')) && /818/.test(lang(left, 'vi')), 'VI thiếu quy mô 279.000 công ty, 818.000 người dùng');
const mr = (m.match(/<div class="ap-mk-r">[\s\S]*?<\/ul>/) || [''])[0];
rowCheck([...mr.matchAll(/<li class="ap-cp">[\s\S]*?<\/li>/g)].map((x) => x[0]), refsOf(m, 'ap-market'), '#ap-market');
ok(/<a class="ap-more" href="#ap-compete">/.test(m), '#ap-market phải dẫn sang trang so sánh #ap-compete');

// ---------- #ap-compete ----------
const s = sec('ap-compete');
ok(s, 'thiếu #ap-compete');
const refs = refsOf(s, 'ap-compete');
ok(/株式会社アンドパッド/.test(lang(s.match(/<div class="card ap-me\b[\s\S]*?<\/h3>/)?.[0] || '', 'ja')), 'thẻ ANDPAD phải ghi công ty 株式会社アンドパッド');
for (const [cls, min, name] of [['ap-pros', 3, 'lợi thế'], ['ap-cons', 2, 'hạn chế']]) {
  const ul = (s.match(new RegExp(`<ul class="${cls}">[\\s\\S]*?<\\/ul>`)) || [''])[0];
  const lis = [...ul.matchAll(/<li>[\s\S]*?<\/li>/g)].map((x) => x[0]);
  ok(lis.length >= min, `ANDPAD cần >= ${min} ý ${name} (ul.${cls}), thấy ${lis.length}`);
  for (const li of lis) for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`data-l="${l}">[^<]{6,}<sup class="ap-c">`).test(li), `ý ${name} thiếu chữ ${l} hoặc thiếu nguồn: ${strip(li).slice(0, 60)}`);
}
ok(/BOXIL/.test(lang(s, 'vi')) && Object.values(refs).some((u) => u.includes('boxil.jp')), 'hạn chế từ đánh giá người dùng phải ghi rõ BOXIL và dẫn trang BOXIL');
const rows = [...s.matchAll(/<li class="ap-rv">[\s\S]*?<\/li>/g)].map((x) => x[0]);
rowCheck(rows, refs, '#ap-compete');
COMP.forEach(([prod, , , , facts], i) => {
  const r = rows[i] || '';
  for (const k of ['plus', 'minus']) {
    const cell = (r.match(new RegExp(`<span class="ap-${k}">[\\s\\S]*?<\\/span><\\/span>`)) || [''])[0];
    ok(cell, `${prod}: thiếu ô ${k === 'plus' ? 'lợi thế' : 'hạn chế'} (span.ap-${k})`);
    for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`data-l="${l}">[^<]{8,}<sup class="ap-c">`).test(cell), `${prod}: ô ${k} thiếu chữ ${l} hoặc nguồn`);
  }
  for (const f of facts) ok(f.test(lang(r, 'ja')), `${prod}: thiếu số liệu đã đối chiếu ${f}`);
});
for (const x of [m, s]) ok(!/MCデータプラス|MC Data Plus|グリーンサイト|Green Site/i.test(x), 'Buildee không thuộc MCデータプラス / グリーンサイト: không được ghi tên này');
// 2 ô: đối thủ đang có lợi thế gì, ANDPAD có lợi thế gì (có nguồn, 3 ngôn ngữ)
for (const [cls, vi] of [['ap-edge-r', 'Đối thủ đang có lợi thế'], ['ap-edge-a', 'ANDPAD có lợi thế']]) {
  const box = (s.match(new RegExp(`<div class="card ${cls}">[\\s\\S]*?<\\/div>`)) || [''])[0];
  ok(lang(box, 'vi').startsWith(vi), `ô ${cls} phải mở đầu bằng "${vi}"`);
  for (const l of ['ja', 'en', 'vi']) ok(new RegExp(`<p class="ap-edge-p" data-l="${l}">[^<]{20,}<sup class="ap-c">`).test(box), `ô ${cls} thiếu đoạn ${l} hoặc nguồn`);
}
// trang mới đủ khung của tab: sidebar, ảnh nền riêng, dấu câu
const sb = (html.match(/<nav class="sb-nav" data-for="ap" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/href="#ap-market"[\s\S]*?href="#ap-compete" data-sec="ap-compete"><em>VS<\/em>[\s\S]*?href="#ap-role"/.test(sb), 'sidebar: mục VS #ap-compete phải nằm giữa #ap-market và #ap-role');
ok(((html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '').includes("'ap-compete'") && existsSync(p('assets/pg/ap-compete.webp')), 'thiếu ảnh nền assets/pg/ap-compete.webp trong IDS');
for (const x of [m, s]) { ok(!/[—–―]/.test(strip(x)), 'có dấu gạch dài'); ok(!lang(x, 'ja').includes('・'), 'JA có dấu "・"'); ok(!/No\.?\s?1|ナンバーワン/.test(strip(x)), 'không tự khen kiểu No.1'); }

if (fails.length) { console.error('FAIL check-ap-compete:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-compete: sản phẩm ANDPAD, thị phần (MIC, 8 năm liền, không bịa %), ${rows.length} đối thủ đúng công ty và đúng nguồn ở 2 trang, ưu / nhược, lợi thế 2 phía`);
