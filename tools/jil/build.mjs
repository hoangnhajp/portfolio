// Sinh 3 trang JILNESTA cuối tab Sales + badge logo công ty trên các trang Sales MAYEKAWA.
//   #sales-jil-hcm      bản đồ TP.HCM: văn phòng JILNESTA ở giữa, cung tỏa ra 4 khu công ty IT + 4 khu cửa hàng
//   #sales-jil-offshore bản đồ Việt Nam | cầu nối online qua JILNESTA | Nhật Bản (đội dev VN làm cho khách Nhật)
//   #sales-jil-flow     phim salaryman 8 bước (tools/jil/film.mjs, render bằng figure() của tools/film/step-film.mjs)
// Cùng kiểu với bản đồ #sales-map (dùng lại class sm-* của khối sales-css) nhưng dòng thời gian riêng (tiền tố jl).
// Dữ liệu bản đồ: tools/jil/map.json (sinh bằng tools/jil/mapdata.py từ GADM + Natural Earth).
// Chạy: node tools/jil/build.mjs [index.html]   (chạy lại không nhân đôi: thay giữa các dấu sales-jil / sales-jil-css)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { figure, frames } from '../film/step-film.mjs';
import { JIL_FILM } from './film.mjs';
import { phase } from '../sales/phase.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const file = process.argv[2] || here('../../index.html');
const M = JSON.parse(readFileSync(here('./map.json'), 'utf8'));
let html = readFileSync(file, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const fix = (t) => t.replace(/\r?\n/g, EOL);
// Số trang JILNESTA nối tiếp các trang MAYEKAWA trong mục lục tab Sales (bỏ TOP và các trang sales-jil-*), tự dồn khi thêm / bỏ trang
const NAV0 = (html.match(/<nav class="sb-nav" data-for="sales"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
const BASE = [...NAV0.matchAll(/data-sec="(sales-[\w-]+)"/g)].filter((m) => m[1] !== 'sales-top' && !m[1].startsWith('sales-jil-')).length;
const NO = (k) => String(BASE + k).padStart(2, '0');

const L = (ja, en, vi, tag = 'span', cls = '') => [['ja', ja], ['en', en], ['vi', vi]]
  .map(([l, t]) => `<${tag}${cls ? ` class="${cls}"` : ''} data-l="${l}">${t}</${tag}>`).join('');
const img = (src, w, alt = '') => `<img src="${src}" alt="${alt}" width="${w}" height="${w}" loading="lazy" decoding="async">`;
const pc = ([x, y]) => `left:${x}%;top:${y}%`;
const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
const head = (kick, tt, secs) => '<figcaption class="mv-head"><span class="mv-rec"></span><span class="mv-kick">' + kick + '</span>'
  + L(...tt, 'span', 'mv-tt') + `<span class="mv-time" aria-hidden="true">${secs}s</span>`
  + '<button class="mv-pp" type="button" aria-pressed="false"><i aria-hidden="true"></i>'
  + L('一時停止', 'Pause animation', 'Tạm dừng hình động', 'span', 'mv-sr') + '</button></figcaption>';
const chips = (ja, en, vi) => '<div class="kw1 rv" style="margin:8px 0 10px">'
  + [['ja', ja], ['en', en], ['vi', vi]].map(([l, cs]) => `<div class="chips" data-l="${l}">` + cs.map((c) => `<span class="chip">${c}</span>`).join('') + '</div>').join('') + '</div>';
const top = (n, eb, h2, sub, ph = '') => `  <span class="eb rv">${n}　<b>${eb}</b></span>${ph}\n`
  + `  <h2 class="kw rv" style="--d:60ms">${L(...h2)}</h2>\n  <div class="kwbar rv" style="--d:120ms"><span></span></div>\n`
  + ['ja', 'en', 'vi'].map((l, i) => `  <p class="kw-sub rv" style="--d:140ms" data-l="${l}">${sub[i]}</p>\n`).join('');
const meta = (rows) => '  <div class="meta rv" style="--d:200ms;margin-top:14px">' + rows.map(([k, ...t]) => `<div><span>${k}</span>${L(...t, 'b')}</div>`).join('') + '</div>\n';
const caps = (rows) => '    <div class="mv-caps">' + rows.map((t, i) => L(...t, 'p', `mv-cap jl-c${i + 1}`)).join('') + '</div>\n';
const BAR = '    <div class="mv-bar" aria-hidden="true"><span></span></div>\n';
const LOGO = {
  myc: '<p class="colg colg--co rv"><img src="assets/logos/mayekawa.svg" alt="MAYEKAWA (MYCOM)" width="181" height="25" decoding="async"><span class="co-nm">MAYEKAWA VIETNAM<em>2022.02 ～ 2026.06</em></span></p>',
  jil: '<p class="colg colg--co colg--jil rv"><img src="assets/logos/jilnesta.png" alt="JILNESTA" width="138" height="38" decoding="async"><span class="co-nm">JILNESTA, Inc.<em>2017.08 ～ 2022.02</em></span></p>',
};

function arcsvg(a, k) {
  const dots = a.dots.map(([x, y], j) => `<circle class="sm-d" cx="${x}" cy="${y}" r="2.1" style="--j:${j}"/>`).join('');
  const [hx, hy, ang] = a.head;
  return `<g class="sm-arc jl-k${k}"><path class="sm-ap" d="${a.d}"/>${dots}`
    + `<g transform="translate(${hx} ${hy}) rotate(${ang})"><polygon class="sm-ah" points="5,0 -4,-4.2 -2,0 -4,4.2"/></g></g>`;
}
const svg = (W, H, body) => `<svg class="sm-svg" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>`;
const panel = (cls, ph, W, H, inner) => `<div class="sm-pn ${cls}">${L(...ph, 'b', 'sm-ph')}<div class="sm-map" style="aspect-ratio:${W}/${H}">${inner}</div></div>`;

// ───────────────────────── 1) Bản đồ TP.HCM
const DIST = {
  tb: ['タンビン区', 'Tan Binh', 'Tân Bình', 'l'], q12: ['12区', 'District 12', 'Quận 12', 'l'], q9: ['9区', 'District 9', 'Quận 9', 'l'],
  q7: ['7区', 'District 7', 'Quận 7', 'r'], q5: ['5区', 'District 5', 'Quận 5', 'l'], gv: ['ゴーバップ区', 'Go Vap', 'Gò Vấp', 'r'],
  bt: ['ビンタン区', 'Binh Thanh', 'Bình Thạnh', 'r'], q2: ['2区', 'District 2', 'Quận 2', 'r'],
};
const ORDER = ['tb', 'q12', 'q9', 'q7', 'q5', 'gv', 'bt', 'q2'];
const ICON = { it: 'assets/sales/jil/it-company.webp', shop: 'assets/sales/jil/shop.webp' };
const c = M.city, z = M.core;
const [bx0, by0, bx1, by1] = c.box;
const office = (pos, big) => `<div class="jl-off" style="${pc(pos)}"><i class="sm-pulse"></i><i class="sm-pin"></i>`
  + (big ? `<span class="jl-lg">${img('assets/logos/jilnesta.png', 76, 'JILNESTA').replace('height="76"', 'height="21"')}</span>` : '<b class="sm-nm jl-onm">JILNESTA</b>') + '</div>';
const cityMap = svg(c.W, c.H, `<path class="sm-nb" d="${c.nb}"/><path class="sm-vn" d="${c.hcm}"/>`
  + `<rect class="sm-box" x="${f1(bx0)}" y="${f1(by0)}" width="${f1(bx1 - bx0)}" height="${f1(by1 - by0)}" rx="4"/>`)
  + office(c.office, false)
  + `<span class="sm-tag sm-tag--box" style="left:${(bx0 / c.W * 100).toFixed(2)}%;top:${(by1 / c.H * 100 + 1.4).toFixed(2)}%">` + L('中心部', 'City centre', 'Nội thành') + '</span>';
const corePts = ORDER.map((k, i) => {
  const p = z.pts[k], d = DIST[k];
  return `<div class="sm-pt jl-${p.kind} jl-k${i} sm-pt--${d[3]}" style="${pc(p.pos)}"><span class="sm-wh">${img(ICON[p.kind], 34)}</span>`
    + `<i class="sm-mk"></i><b class="sm-nm">${L(d[0], d[1], d[2])}</b></div>`;
}).join('');
const coreMap = svg(z.W, z.H, `<path class="sm-nb" d="${z.nb}"/><path class="sm-vn" d="${z.hcm}"/>` + ORDER.map((k, i) => arcsvg(z.pts[k].arc, i)).join(''))
  + office(z.office, true) + corePts;
const legend = '<div class="jl-leg">'
  + `<span>${img(ICON.it, 22)}${L('IT企業', 'IT companies', 'Công ty IT')}</span>`
  + `<span>${img(ICON.shop, 22)}${L('店舗', 'Shops', 'Cửa hàng')}</span>`
  + `<span><i class="jl-lgd"></i>${L('JILNESTAの拠点', 'JILNESTA office', 'Văn phòng JILNESTA')}</span></div>`;

const SEC_HCM = '<section class="pg" data-chap="III" id="sales-jil-hcm">\n  ' + LOGO.jil + '\n'
  + top(NO(1), 'JILNESTA CLIENT MAP',
    ['ホーチミン市の拠点から、<br /><i>IT企業と店舗を訪ねる。</i>', 'From the Ho Chi Minh City office<br /><i>to IT companies and shops.</i>', 'Từ văn phòng tại TP.HCM,<br /><i>tỏa đi gặp công ty IT và cửa hàng.</i>'],
    ['JILNESTAのホーチミン市の拠点から市内のIT企業や店舗を訪ね、ソフトウェアと開発チームの需要を聞き取る。',
      'From the JILNESTA office in Ho Chi Minh City I visited IT companies and shops across the city to hear their software and dev team needs.',
      'Từ văn phòng JILNESTA tại TP.HCM, tôi đi gặp các công ty IT và cửa hàng quanh thành phố để hỏi nhu cầu phần mềm và đội lập trình viên.'])
  + '  ' + chips(['拠点 ホーチミン市', 'IT企業', '店舗', 'アプリとWebの需要'], ['base: Ho Chi Minh City', 'IT companies', 'shops', 'app and web needs'], ['văn phòng tại TP.HCM', 'công ty IT', 'cửa hàng', 'nhu cầu app và web']) + '\n'
  + '  <figure class="mv jlmap rv" style="--d:150ms" data-no-zoom>\n    '
  + head('CLIENT MAP', ['拠点から広がる顧客訪問', 'Client visits from the office', 'Gặp khách hàng tỏa ra từ văn phòng'], 16) + '\n'
  + '    <div class="sm-stage jl-stage">'
  + panel('sm-pn--vn jl-pn--city', ['ホーチミン市', 'Ho Chi Minh City', 'TP. Hồ Chí Minh'], c.W, c.H, cityMap)
  + panel('sm-pn--md jl-pn--core', ['中心部', 'City centre', 'Nội thành'], z.W, z.H, coreMap).replace(/<\/div><\/div>$/, '</div>' + legend + '</div>')
  + '</div>\n'
  + caps([
    ['ホーチミン市の中心にあるJILNESTAの拠点から出発。', 'Starting from the JILNESTA office in central Ho Chi Minh City.', 'Xuất phát từ văn phòng JILNESTA ở trung tâm TP.HCM.'],
    ['タンビン区、12区、9区、7区のIT企業を訪ね、開発チームの需要を聞く。', 'IT companies in Tan Binh and Districts 12, 9 and 7: asking about their dev team needs.', 'Gặp công ty IT ở Tân Bình, Quận 12, Quận 9, Quận 7, hỏi nhu cầu đội lập trình viên.'],
    ['5区、ゴーバップ区、ビンタン区、2区の店舗には、アプリとWebを提案。', 'Shops in District 5, Go Vap, Binh Thanh and District 2: proposing apps and websites.', 'Gặp cửa hàng ở Quận 5, Gò Vấp, Bình Thạnh, Quận 2, tư vấn làm app và web.']])
  + BAR + '  </figure>\n'
  + meta([['Base', 'ホーチミン市の拠点', 'Ho Chi Minh City office', 'Văn phòng TP.HCM'], ['IT', 'IT企業', 'IT companies', 'Công ty IT'],
    ['Shops', '店舗、小売', 'Shops and retail', 'Cửa hàng, bán lẻ'], ['Needs', 'アプリ、Web、開発チーム', 'Apps, websites, dev teams', 'App, web, đội dev']])
  + '</section>\n';

// ───────────────────────── 2) Bản đồ offshore Việt Nam | JILNESTA | Nhật Bản
const v = M.vn, j = M.jp;
const isl = [...v.hs, ...v.ts].map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.7"/>`).join('');
const vnMap = svg(v.W, v.H, `<path class="sm-nb" d="${v.nb}"/><path class="sm-vn" d="${v.vn}"/><g class="sm-isl">${isl}</g>` + arcsvg(v.arc, 0))
  + `<div class="sm-pt jl-dev jl-k4 sm-pt--b" style="${pc(v.hcm)}"><span class="sm-wh">${img('assets/sales/jil/dev-team.webp', 40)}</span><i class="sm-mk"></i>`
  + `<b class="sm-nm">${L('ホーチミン市の開発チーム', 'Dev team, Ho Chi Minh City', 'Đội dev tại TP.HCM')}</b></div>`
  + `<span class="sm-tag" style="${pc(v.hsl)}">` + L('ホアンサ諸島', 'Hoang Sa Islands', 'Quần đảo Hoàng Sa') + '</span>'
  + `<span class="sm-tag" style="${pc(v.tsl)}">` + L('チュオンサ諸島', 'Truong Sa Islands', 'Quần đảo Trường Sa') + '</span>';
const JK = { osaka: 1, nagoya: 2, tokyo: 3 };
const jpMap = svg(j.W, j.H, `<path class="sm-nb" d="${j.nb}"/><path class="sm-vn jl-jp" d="${j.jp}"/>` + Object.entries(JK).map(([k, n]) => arcsvg(j.arcs[k], n)).join(''))
  + Object.entries(JK).map(([k, n]) => `<div class="sm-pt jl-cl jl-k${n} sm-pt--b" style="${pc(j.pts[k])}"><span class="sm-wh">${img('assets/gx/office-building.webp', 34)}</span><i class="sm-mk"></i>`
    + (k === 'tokyo' ? `<b class="sm-nm">${L('日本の顧客', 'Japanese clients', 'Khách hàng Nhật Bản')}</b>` : '') + '</div>').join('');
const bridge = '<div class="jl-br" aria-hidden="true"><span class="jl-bi">' + img('assets/sales/jil/remote.webp', 56)
  + '</span><span class="jl-blg">' + img('assets/logos/jilnesta.png', 76).replace('height="76"', 'height="21"') + '</span>'
  + L('オンラインで<br />リモート開発', 'Online,<br />remote', 'Online<br />từ xa', 'b', 'jl-bt')
  + '<span class="jl-line">' + Array.from({ length: 6 }, (_, i) => `<i class="jl-dot" style="--j:${i}"></i>`).join('') + '</span></div>';

const SEC_OFF = '<section class="pg" data-chap="IV" id="sales-jil-offshore">\n  ' + LOGO.jil + '\n'
  + top(NO(2), 'OFFSHORE',
    ['ベトナムの開発チームと、<br /><i>日本の顧客をつなぐ。</i>', 'A dev team in Vietnam,<br /><i>clients in Japan.</i>', 'Đội dev tại Việt Nam,<br /><i>khách hàng tại Nhật Bản.</i>'],
    ['ベトナムの開発チームがJILNESTAを通じてオンラインで日本の顧客とつながり、オフショアで製品を開発。',
      'Our dev team in Vietnam worked online with Japanese clients through JILNESTA, building their products offshore.',
      'Đội lập trình viên tại Việt Nam làm việc online với khách hàng Nhật qua JILNESTA, phát triển sản phẩm theo mô hình offshore.'])
  + '  ' + chips(['オフショア開発', 'ベトナムの開発チーム', 'オンラインでリモート', '日本の顧客'], ['offshore development', 'dev team in Vietnam', 'online and remote', 'clients in Japan'], ['phát triển offshore', 'đội dev tại Việt Nam', 'online từ xa', 'khách hàng Nhật Bản']) + '\n'
  + '  <figure class="mv jloff rv" style="--d:150ms" data-no-zoom>\n    '
  + head('OFFSHORE', ['ベトナムと日本をつなぐオフショア開発', 'Offshore development, Vietnam to Japan', 'Phát triển offshore, Việt Nam và Nhật Bản'], 14) + '\n'
  + '    <div class="jl-ostage">'
  + panel('jl-pn--vn', ['ベトナム（開発）', 'Vietnam (development)', 'Việt Nam (phát triển)'], v.W, v.H, vnMap)
  + bridge
  + panel('jl-pn--jp', ['日本（顧客）', 'Japan (clients)', 'Nhật Bản (khách hàng)'], j.W, j.H, jpMap)
  + '</div>\n'
  + caps([
    ['ホーチミン市の開発チームが、設計と開発を担当。', 'The dev team in Ho Chi Minh City designs and builds.', 'Đội dev tại TP.HCM thiết kế và lập trình.'],
    ['JILNESTAを通じて、仕様と進捗をオンラインで共有。', 'Through JILNESTA, specs and progress are shared online.', 'Qua JILNESTA, trao đổi đặc tả và tiến độ online.'],
    ['日本の顧客へ、要望に合わせて作った製品を届ける。', 'Products built to each Japanese client\'s needs.', 'Sản phẩm làm theo yêu cầu của khách hàng Nhật Bản.']])
  + BAR + '  </figure>\n'
  + meta([['Dev', 'ベトナムの開発チーム', 'Dev team in Vietnam', 'Đội dev tại Việt Nam'], ['Bridge', 'JILNESTA、オンライン', 'JILNESTA, online', 'JILNESTA, online'],
    ['Clients', '日本の顧客', 'Clients in Japan', 'Khách hàng Nhật Bản'], ['Model', 'オフショア開発', 'Offshore development', 'Offshore']])
  + '</section>\n';

// ───────────────────────── 3) Phim salaryman 8 bước
const list = '  <ol class="sc-list rv" style="--d:200ms" data-no-zoom>' + JIL_FILM.steps.map((s, i) => `<li>${img(s.img, 44)}<div><em>${String(i + 1).padStart(2, '0')}</em>`
  + L(s.t.ja, s.t.en, s.t.vi, 'b') + L(s.d.ja, s.d.en, s.d.vi, 'p') + '</div></li>').join('') + '</ol>\n';
const SEC_FLOW = '<section class="pg" data-chap="V" id="sales-jil-flow">\n  ' + LOGO.jil + '\n'
  + top(NO(3), 'OFFSHORE SALES FLOW',
    ['要望を聞き、仕様にして、<br /><i>顧客に合わせて作り込む。</i>', 'Hear the needs, write the spec,<br /><i>customize for each client.</i>', 'Lắng nghe, viết đặc tả,<br /><i>tùy chỉnh theo từng khách hàng.</i>'],
    ['ITオフショアの営業として、資料準備から提案、仕様書、見積と契約、開発、調整、操作マニュアルを添えた納品、請求までの8段階を担当。',
      'In IT offshore sales I handled eight steps, from calls and specs to quotes, contracts, development, handover with user guides and billing.',
      'Kinh doanh IT offshore: tôi đi trọn 8 bước, từ tư vấn, đặc tả, báo giá, hợp đồng, giao đội dev, bàn giao kèm hướng dẫn sử dụng đến thanh toán.'], phase('pre'))
  + '  ' + chips(['8つの段階', '要望の聞き取り', '仕様書', '見積と契約', '開発チームへの伝達', 'カスタマイズ', '操作マニュアル'], ['eight steps', 'hearing needs', 'specs', 'quotes and contracts', 'briefing the dev team', 'customization', 'user guides'], ['8 bước', 'lắng nghe nhu cầu', 'đặc tả', 'báo giá, hợp đồng', 'giao đội dev', 'customize', 'hướng dẫn sử dụng']) + '\n'
  + '  ' + figure(JIL_FILM) + '\n' + list
  + '</section>\n';

// ───────────────────────── CSS
const KF = [], AN = [];
const T_END = 93, T_HIDE = 97, r = (x) => String(Math.round(Math.min(x, 100) * 100) / 100);
// items: [k, mốc cung (null = không có cung), mốc điểm (null = không có điểm)]
function timeline(fig, P, items) {
  for (const [k, a, p] of items) {
    if (a != null) {
      KF.push(`@keyframes ${P}A${k}{0%,${r(a)}%{opacity:0}${r(a + 1)}%,${T_END}%{opacity:1}${T_HIDE}%,100%{opacity:0}}`);
      KF.push(`@keyframes ${P}H${k}{0%,${r(a + 4)}%{opacity:0;transform:scale(.3)}${r(a + 5)}%{opacity:1;transform:scale(1.3)}${r(a + 6)}%,${T_END}%{opacity:1;transform:none}${T_HIDE}%,100%{opacity:0;transform:none}}`);
      AN.push(`html.js .pg.in .${fig} .jl-k${k} .sm-d{animation:${P}A${k} var(--jl-t) linear infinite backwards;animation-delay:calc(var(--j)*45ms)}`
        + `html.js .pg.in .${fig} .jl-k${k} .sm-ap{animation:${P}A${k} var(--jl-t) linear infinite}`
        + `html.js .pg.in .${fig} .jl-k${k} .sm-ah{animation:${P}H${k} var(--jl-t) var(--mv-p) infinite}`);
    }
    if (p == null) continue;
    KF.push(`@keyframes ${P}W${k}{0%,${r(p)}%{opacity:0;transform:translateY(12px) scale(.4)}${r(p + 2)}%{opacity:1;transform:translateY(-3px) scale(1.14)}${r(p + 3.5)}%,${T_END}%{opacity:1;transform:none}${T_HIDE}%,100%{opacity:0;transform:none}}`);
    KF.push(`@keyframes ${P}N${k}{0%,${r(p + 1)}%{opacity:0}${r(p + 3)}%,${T_END}%{opacity:1}${T_HIDE}%,100%{opacity:0}}`);
    AN.push(`html.js .pg.in .${fig} .sm-pt.jl-k${k} .sm-wh{animation:${P}W${k} var(--jl-t) var(--mv-p) infinite}`
      + `html.js .pg.in .${fig} .sm-pt.jl-k${k} .sm-mk,html.js .pg.in .${fig} .sm-pt.jl-k${k} .sm-nm{animation:${P}N${k} var(--jl-t) linear infinite}`);
  }
}
function capt(fig, P, spans) {
  spans.forEach(([a, b], i) => {
    const last = i === spans.length - 1;
    KF.push(`@keyframes ${P}C${i + 1}{0%,${r(a ? a + 1 : 1)}%{opacity:0;transform:translateY(8px)}${r(a + 3)}%,${r(b)}%{opacity:1;transform:none}${r(b + (last ? 3 : 2))}%,100%{opacity:0;transform:translateY(-6px)}}`);
    AN.push(`html.js .pg.in .${fig} .jl-c${i + 1}{animation:${P}C${i + 1} var(--jl-t) var(--mv-p) infinite}`);
  });
}
const S = [10, 17, 24, 31, 48, 55, 62, 69];
timeline('jlmap', 'jlm', S.map((s, k) => [k, s, s + 5]));
capt('jlmap', 'jlm', [[0, 10], [10, 46], [46, 93]]);
timeline('jloff', 'jlo', [[4, null, 2], [0, 10, null], [1, 60, 65], [2, 66, 71], [3, 72, 77]]);
capt('jloff', 'jlo', [[0, 26], [26, 56], [56, 93]]);
KF.push('@keyframes jlBr{0%,26%{opacity:.45;transform:scale(.92)}30%{opacity:1;transform:scale(1.08)}33%,93%{opacity:1;transform:none}97%,100%{opacity:.45;transform:scale(.92)}}');
KF.push('@keyframes jlFlow{0%{opacity:0;transform:translateX(0)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translateX(var(--jl-run))}}');
KF.push('@keyframes jlFlowV{0%{opacity:0;transform:translateY(0)}15%{opacity:1}85%{opacity:1}100%{opacity:0;transform:translateY(var(--jl-run))}}');
KF.push('@keyframes jlPulse{0%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(1.8)}}');
const sf = frames(JIL_FILM.steps.length);

const CSS = `<!-- sales-jil-css:start -->
<style id="sales-jil-css">
/* Badge logo cong ty tren trang Sales (tools/jil/build.mjs): MAYEKAWA cho trang MAYEKAWA, JILNESTA cho 3 trang JILNESTA */
.colg--co{display:flex;align-items:center;gap:16px;margin:0 0 14px;padding:12px 20px 12px 16px;border-left:5px solid #F68209;box-shadow:0 1px 2px rgba(15,23,42,.06),0 14px 30px -16px rgba(246,130,9,.55)}
.colg--co img{height:34px;max-width:250px}
.colg--co.colg--jil{border-left-color:#1FB6A6;box-shadow:0 1px 2px rgba(15,23,42,.06),0 14px 30px -16px rgba(31,182,166,.6)}
.colg--co.colg--jil img{height:40px}
.co-nm{display:grid;gap:2px;padding-left:16px;border-left:1px solid #ece8f3;font:800 12px/1.25 'Space Grotesk','Manrope',sans-serif;letter-spacing:.08em;color:#14396b}
.co-nm em{font:600 11px/1.2 'Space Grotesk',sans-serif;font-style:normal;letter-spacing:.04em;color:#6b6780}
#w-mycom>.colg{padding:14px 22px 14px 18px;border-left:5px solid #F68209;box-shadow:0 1px 2px rgba(15,23,42,.06),0 14px 30px -16px rgba(246,130,9,.55)}
#w-mycom>.colg img{height:40px;max-width:300px}
/* Ban do JILNESTA: dung lai class sm-* cua #sales-map, dong thoi gian rieng --jl-t */
.jlmap{--jl-t:16s}.jloff{--jl-t:14s}
.jl-stage{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
.jlmap .sm-vn{stroke-width:.6;fill:rgba(143,216,255,.16)}
.jl-off{position:absolute;width:0;height:0;translate:-50% -50%;z-index:3}
.jl-onm{left:9px;top:-14px;color:#FBA65A}
.jl-lg{position:absolute;left:0;top:12px;translate:-35% 0;display:block;padding:4px 8px;border-radius:9px;background:#fff;box-shadow:0 0 0 2px #1FB6A6,0 8px 18px -6px rgba(31,182,166,.9)}
.jl-lg img,.jl-blg img{display:block;width:auto;max-width:none;height:18px}.jl-lg img{height:15px}
.jl-pn--core .jl-k7 .sm-wh{top:6px}
.jl-pn--core .sm-wh{left:-14px;top:-32px;width:28px;height:28px}
.jl-leg{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 4px 0;font:700 10px/1.2 'Manrope','Noto Sans JP',sans-serif;color:rgba(255,255,255,.85)}
.jl-leg>span{display:inline-flex;align-items:center;gap:5px}.jl-leg img{display:block;width:20px;height:20px}
.jl-lgd{display:block;width:10px;height:10px;border-radius:50%;background:#F68209;box-shadow:0 0 0 2px #fff}
.jl-ostage{display:grid;grid-template-columns:minmax(0,1fr) 96px minmax(0,1fr);gap:10px;padding:12px 16px 0;align-items:stretch}
.jl-ostage>.jl-br{align-self:center}
.jl-cl.jl-k1 .sm-wh{left:-42px;top:-16px}
.jl-pn--vn .sm-map{max-width:300px;margin:0 auto}
.sm-vn.jl-jp{fill:rgba(251,166,90,.16);stroke:#FBA65A}
.jl-dev .sm-wh{left:-20px;top:-46px;width:40px;height:40px}
.jl-br{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;--jl-run:84px}
.jl-bi{display:block;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fff,#dff0ff);box-shadow:0 0 0 4px rgba(143,216,255,.18),0 10px 22px -8px rgba(38,179,244,.9)}
.jl-bi img{display:block;width:100%;height:100%;padding:6px;box-sizing:border-box}
.jl-blg{display:block;padding:4px 7px;border-radius:8px;background:#fff;box-shadow:0 0 0 2px #1FB6A6}
.jl-bt{font:700 10px/1.3 'Manrope','Noto Sans JP',sans-serif;color:#8fd8ff}
.jl-line{position:relative;display:block;width:88px;height:8px;border-radius:8px;background:repeating-linear-gradient(90deg,rgba(143,216,255,.45) 0 5px,transparent 5px 9px) center/100% 2px no-repeat}
.jl-dot{position:absolute;left:0;top:1px;width:6px;height:6px;border-radius:50%;background:#FBA65A;box-shadow:0 0 8px 2px rgba(246,130,9,.7);transform:translateX(calc(var(--j) * 16px))}
.mv.jlmap .jl-c3,.mv.jloff .jl-c3{opacity:1;font-weight:700;color:#fff}
html.js .pg.in .jlmap .sm-pulse,html.js .pg.in .jloff .sm-pulse{animation:jlPulse 2s ease-out infinite}
html.js .pg.in .jlmap .mv-bar span,html.js .pg.in .jloff .mv-bar span{animation:mvBar var(--jl-t) linear infinite}
html.js .pg.in .jloff .jl-br{animation:jlBr var(--jl-t) var(--mv-p) infinite}
html.js .pg.in .jloff .jl-dot{animation:jlFlow 1.8s linear infinite;animation-delay:calc(var(--j) * -.3s)}
${AN.join('\n')}
${sf.an}
${KF.join('\n')}
${sf.kf}
@media screen and (max-width:600px){
  .colg--co{gap:12px;padding:10px 14px 10px 12px}.colg--co img{height:28px}.colg--co.colg--jil img{height:32px}.co-nm{padding-left:12px;font-size:10.5px}.co-nm em{font-size:10px}
  #w-mycom>.colg img{height:32px}
  .jl-stage{grid-template-columns:1fr}.jl-pn--city .sm-map{max-width:260px;margin:0 auto}
  .jl-ostage{grid-template-columns:1fr;padding:10px 10px 0}.jl-pn--vn .sm-map{max-width:240px}.jl-pn--jp .sm-map{max-width:300px;margin:0 auto}
  .jl-br{flex-direction:row;justify-content:center;flex-wrap:wrap}.jl-line{width:8px;height:44px;background:repeating-linear-gradient(180deg,rgba(143,216,255,.45) 0 5px,transparent 5px 9px) center/2px 100% no-repeat}
  .jl-dot{left:1px;top:0;transform:translateY(calc(var(--j) * 7px))}
  html.js .pg.in .jloff .jl-dot{animation-name:jlFlowV}.jl-br{--jl-run:38px}
  .jl-pn--core .sm-wh{left:-11px;top:-25px;width:22px;height:22px}.jl-lg{top:9px;padding:3px 6px}.jl-lg img{height:12px}.jl-pn--core .jl-k7 .sm-wh{top:5px}
}
@media (prefers-reduced-motion:reduce){.jlmap *,.jloff *{animation:none!important}}
@media print{
  .mv.jlmap,.mv.jloff{display:block!important}.jlmap *,.jloff *{animation:none!important}
  .jlmap .mv-pp,.jlmap .mv-bar,.jlmap .mv-time,.jloff .mv-pp,.jloff .mv-bar,.jloff .mv-time{display:none}
  .jl-c1,.jl-c2{display:none}
}
</style>
<!-- sales-jil-css:end -->
`;

// ───────────────────────── Chèn vào index.html
const put = (re, block, anchor, after) => {
  if (re.test(html)) { html = html.replace(re, () => fix(block)); return; }
  const at = html.indexOf(anchor);
  if (at < 0) throw new Error('không thấy mốc ' + anchor);
  const pos = after ? at + anchor.length : at;
  html = html.slice(0, pos) + fix(block) + html.slice(pos);
};
put(/<!-- sales-jil-css:start -->[\s\S]*?<!-- sales-jil-css:end -->\r?\n/, CSS, '<!-- srep-css:end -->' + EOL, true);

const BLOCK = `<!-- sales-jil:start -->\n${SEC_HCM}${SEC_OFF}${SEC_FLOW}<!-- sales-jil:end -->\n`;
const reBlock = /<!-- sales-jil:start -->[\s\S]*?<!-- sales-jil:end -->\r?\n/;
if (reBlock.test(html)) html = html.replace(reBlock, () => fix(BLOCK));
else {
  const s = html.indexOf('id="sales-reports"'); if (s < 0) throw new Error('không thấy #sales-reports');
  const e = html.indexOf('</section>', s) + '</section>'.length;
  const ls = html.indexOf('\n', e) + 1;
  html = html.slice(0, ls) + fix(BLOCK) + html.slice(ls);
}

// Mục lục tab Sales 07-09 (trang 08 FLOW #sales-flow và 07 KPI #sales-kpi đã bỏ, task t5wm: JILNESTA nối ngay sau #sales-reports)
const NAV = [['sales-jil-hcm', NO(1), 'JILNESTA 顧客マップ', 'JILNESTA client map', 'JILNESTA bản đồ khách hàng'],
  ['sales-jil-offshore', NO(2), 'オフショア開発', 'Offshore', 'Offshore Việt Nam - Nhật Bản'],
  ['sales-jil-flow', NO(3), 'ITオフショア営業', 'IT offshore sales', 'Kinh doanh IT offshore']]
  .map(([id, n, ja, en, vi]) => `      <a href="#${id}" data-sec="${id}"><em>${n}</em>${L(ja, en, vi)}</a>\n`).join('');
html = html.replace(/[ \t]*<a href="#sales-jil-(?:hcm|offshore|flow)"[^\n]*\n/g, ''); // giữ dòng #sales-jil-after (tools/sales/after.mjs)
const nf = html.indexOf('<a href="#sales-reports" data-sec="sales-reports">'); if (nf < 0) throw new Error('không thấy mục lục sales-reports');
const nl = html.indexOf('\n', nf) + 1;
html = html.slice(0, nl) + fix(NAV) + html.slice(nl);

// Ảnh nền section (khối pganh): thêm id vào mảng IDS
if (!html.includes("'sales-jil-hcm'")) html = html.replace(/(var IDS=\[[^\]]*?)'sales-reports',/, "$1'sales-reports','sales-jil-hcm','sales-jil-offshore','sales-jil-flow',");
if (!html.includes("'sales-jil-hcm'")) throw new Error('không thêm được id vào mảng IDS');

// Badge logo MAYEKAWA ở đầu mỗi trang Sales của MAYEKAWA (chèn 1 dòng sau thẻ mở section, không đụng nội dung khác)
for (const id of ['sales-top', 'sales-map', 'sales-cycle', 'sales-pain', 'sales-trips', 'sales-pr', 'sales-reports']) {
  const a = html.indexOf(`id="${id}"`); if (a < 0) throw new Error('không thấy #' + id);
  const ls = html.indexOf('\n', a) + 1, le = html.indexOf('\n', ls);
  if (html.slice(ls, le).includes('colg--co')) continue;
  html = html.slice(0, ls) + '  ' + LOGO.myc + EOL + html.slice(ls);
}
// Trang hồ sơ #w-mycom: logo MAYEKAWA to hơn bằng CSS #w-mycom>.colg (giữ nguyên markup <p class="colg rv"> mà check-career-logos-zigzag kiểm)
html = html.replace('<p class="colg colg--hero rv"><img src="assets/logos/mayekawa.svg"', '<p class="colg rv"><img src="assets/logos/mayekawa.svg"');

writeFileSync(file, html);
console.log('sales-jil: 3 trang (#sales-jil-hcm, #sales-jil-offshore, #sales-jil-flow), badge logo 7 trang Sales MAYEKAWA, logo #w-mycom lớn hơn');
