// 3 slide hình tóm gọn đối thủ ANDPAD, ngay sau #ap-compete: ít chữ, chủ yếu chart, mỗi slide 1 câu kết.
// #ap-vs-scale = quy mô (thanh số công ty, số người dùng); #ap-vs-map = bản đồ định vị 6 sản phẩm (phạm vi x cách bắt đầu);
// #ap-vs-win = phí ban đầu công khai + thế mạnh theo từng tiêu chí (task yfw8: chỉ so sánh thế mạnh / hạn chế, không dùng từ thắng thua).
// Số liệu CHỈ lấy từ dữ liệu đã dẫn nguồn ở #ap-compete (tools/ap/market.mjs, refs.mjs); không thêm số mới.
// build.mjs gọi; kiểm tra: node tests/check-ap-vs.mjs, node tests/browser-ap-vs.mjs
const T = (ja, en, vi) => ({ ja, en, vi });
const ico = (f, s = 30) => `<img src="assets/gx/${f}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
const endLine = (L3, o) => `  <p class="ap-vs-end rv" style="--d:240ms">${ico('lightbulb', 28)}${L3('span', o)}</p>`;

// ---------- Slide 1: quy mô ----------
// [tên, giá trị, nhãn 3 ngôn ngữ, mốc, nguồn, ANDPAD?]
const CO = [
  ['ANDPAD', 279000, T('27.9万社', '279,000', '279.000'), '', ['top'], 1],
  ['KANNA', 100000, T('10万社超*', '100,000+*', 'Hơn 100.000*'), '2026.08', ['kannaScale']],
  ['Dandori Work', 100000, T('10万社', '100,000', '100.000'), '', ['dandori']],
  ['SPIDERPLUS', 2300, T('2,300社以上', '2,300+', 'Hơn 2.300'), '2026.09', ['spider']],
];
const US = [
  ['ANDPAD', 818000, T('81.8万人', '818,000', '818.000'), '', ['top'], 1],
  ['Dandori Work', 170000, T('17万人', '170,000', '170.000'), '', ['dandori']],
  ['SPIDERPLUS', 80000, T('8万人以上', '80,000+', 'Hơn 80.000'), '2026.09', ['spider']],
];
const bars = (L3, b, rows, max, aria) => `<div class="ap-vs-chart ap-vb" role="img" aria-label="${aria}">
${rows.map(([n, v, lab, d, r, me]) => `      <div class="ap-vb-r${me ? ' is-me' : ''}" title="${n}: ${lab.en}${d ? ` (${d})` : ''}"><b>${n}</b><span class="ap-vb-t"><i data-v="${v}" style="--w:${(v / max * 100).toFixed(1)}%"></i></span>${L3('em', b.t(lab, ...r))}${d ? `<small>${d}</small>` : '<small></small>'}</div>`).join('\n')}
    </div>`;
export function pageVsScale({ L3, head, b }) {
  const sub = b.c('share', 'mic');
  return `<section class="pg" data-chap="IV" id="ap-vs-scale">
${head('VS 1　<b>SCALE</b>', T('利用規模の<br /><i>比較。</i>', 'Scale of use,<br /><i>compared.</i>', 'So sánh<br /><i>quy mô sử dụng.</i>'),
    'Companies ／ Users ／ MIC survey', T('導入企業数は8年連続1位（ミック経済研究所調べ）。', 'Ranked first by adopting companies for 8 years (MIC Research).', 'Xếp thứ nhất về số doanh nghiệp sử dụng 8 năm liên tiếp (khảo sát của MIC).'), sub)}
  <div class="ap-vs-hero rv" style="--d:160ms">
    <div class="card ap-vs-no1">${ico('milestone-report', 54)}<b>8</b>${L3('span', T('年連続 導入企業数1位', 'years ranked first by companies', 'năm liên tiếp xếp thứ nhất'))}</div>
    <div class="card ap-vs-c">
      <div class="ap-vs-ch">${ico('office-building', 26)}${L3('h3', T('利用企業数', 'Companies using it', 'Số công ty đang dùng'))}</div>
    ${bars(L3, b, CO, 279000, 'Companies using it: ANDPAD 279,000; KANNA 100,000+ incl. free partners; Dandori Work 100,000; SPIDERPLUS 2,300+')}
      ${L3('p', T('各社の公表値（数え方は各社で異なる場合あり）。＊無料の協力会社を含む', 'Figures as published by each company; counting may differ. * incl. free partners', 'Số do từng hãng tự công bố, cách đếm có thể khác. * gồm cả đối tác dùng miễn phí'), ' class="ap-vs-note"')}
    </div>
  </div>
  <div class="card ap-vs-c rv" style="--d:200ms">
    <div class="ap-vs-ch">${ico('team-group', 26)}${L3('h3', T('ユーザー数', 'Users', 'Số người dùng'))}</div>
    ${bars(L3, b, US, 818000, 'Users: ANDPAD 818,000; Dandori Work 170,000; SPIDERPLUS 80,000+')}
  </div>
  <ul class="ap-vs-na rv" style="--d:220ms">
    <li>${ico('magnifier', 22)}<b>Buildee</b>${L3('span', b.t(T('元請1,061社（単位が異なる）', '1,061 prime contractors (other unit)', '1.061 tổng thầu (khác đơn vị)'), 'buildee'))}</li>
    <li>${ico('magnifier', 22)}<b>Photoruction</b>${L3('span', b.t(T('40万超の建設プロジェクト（単位が異なる）', '400,000+ projects (other unit)', 'Hơn 400.000 dự án (khác đơn vị)'), 'photoruction'))}</li>
  </ul>
${endLine(L3, T('利用企業数とユーザー数の厚さは、ANDPADの強みの一つ。', 'A large base of companies and users is one of ANDPAD\'s strengths.', 'Quy mô doanh nghiệp và người dùng lớn là một thế mạnh của ANDPAD.'))}
${b.list()}
</section>`;
}

// ---------- Slide 2: bản đồ định vị ----------
// [tên, x (0 = một khâu, 100 = trọn quy trình), y (0 = giá công khai / miễn phí, 100 = báo giá riêng), nhãn điểm mạnh, ANDPAD?]
// Vị trí là ƯỚC LƯỢNG từ dữ liệu #ap-compete (ghi rõ trên trang), không phải số đo.
const PTS = [
  ['ANDPAD', 90, 84, T('20以上の製品', '20+ products', '20+ sản phẩm'), 1],
  ['Photoruction', 42, 70, T('SaaS + AI-BPO', 'SaaS + AI-BPO', 'SaaS + AI-BPO')],
  ['SPIDERPLUS', 30, 86, T('図面、検査', 'Drawings, inspections', 'Bản vẽ, kiểm tra')],
  ['KANNA', 40, 10, T('初期0円、無料プラン', 'No setup fee, free plan', '0 yên, gói miễn phí')],
  ['Dandori Work', 36, 24, T('住宅、リフォーム', 'Homes, renovation', 'Nhà ở, cải tạo')],
  ['Buildee', 12, 44, T('安全書類、元請', 'Safety papers, primes', 'Hồ sơ an toàn, tổng thầu')],
];
export function pageVsMap({ L3, head, b }) {
  const sub = b.c('products', 'pricing');
  const W = 640, H = 600, P = 40, PB = 64; // khung vẽ (PB = chừa đáy cho nhãn trục)
  const X = (x) => P + (x / 100) * (W - 2 * P), Y = (y) => H - PB - (y / 100) * (H - P - PB);
  const txt = (x, y, o, cls, anchor = 'middle') => ['ja', 'en', 'vi'].map((l) => `<text data-l="${l}" x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${o[l]}</text>`).join('');
  const dots = PTS.map(([n, x, y, tag, me]) => {
    const cx = X(x), cy = Y(y), r = me ? 17 : 11, left = x > 80;
    const tx = left ? cx - r - 8 : cx + r + 8, an = left ? 'end' : 'start';
    return `      <g class="ap-vm-p${me ? ' is-me' : ''}"><title>${n}: ${tag.en}</title><circle cx="${cx}" cy="${cy}" r="${r + 10}" class="ap-vm-hit"/><circle cx="${cx}" cy="${cy}" r="${r}"/><text x="${tx}" y="${cy - (me ? 6 : 4)}" class="ap-vm-n" text-anchor="${an}">${n}</text>${txt(tx, cy + 15, tag, 'ap-vm-t', an)}</g>`;
  }).join('\n');
  return `<section class="pg" data-chap="IV" id="ap-vs-map">
${head('VS 2　<b>POSITIONING</b>', T('特化型か、<br /><i>統合型か。</i>', 'Specialised<br /><i>or integrated?</i>', 'Chuyên sâu<br /><i>hay tích hợp?</i>'),
    'Scope ／ Entry cost ／ Map', T('対応範囲と導入のしやすさで6製品を配置。', 'Six products by scope and ease of adoption.', 'Định vị 6 sản phẩm theo phạm vi chức năng và chi phí khởi đầu.'), sub)}
  <div class="card ap-vs-c ap-vm rv" style="--d:160ms">
    <svg class="ap-vs-chart ap-vm-svg" role="img" aria-label="Positioning map: ANDPAD is an integrated platform for the whole workflow (quote-based pricing); SPIDERPLUS and Photoruction are quote-based and more specialised; KANNA, Dandori Work and Buildee have lower entry costs" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect x="${X(50)}" y="${P}" width="${X(100) - X(50)}" height="${Y(50) - P}" class="ap-vm-q is-me"/>
      <line x1="${P}" y1="${Y(50)}" x2="${W - P}" y2="${Y(50)}" class="ap-vm-ax"/><line x1="${X(50)}" y1="${P}" x2="${X(50)}" y2="${Y(0)}" class="ap-vm-ax"/>
      ${txt(P, H - 12, T('← 特定工程に特化', '← Specialised', '← Chuyên sâu'), 'ap-vm-al', 'start')}${txt(W - P, H - 12, T('工程全体を統合 →', 'Integrated →', 'Tích hợp toàn quy trình →'), 'ap-vm-al', 'end')}
      ${txt(P + 4, P - 14, T('↑ 個別見積もりのみ', '↑ Quote only', '↑ Báo giá theo từng khách hàng'), 'ap-vm-al', 'start')}${txt(P + 4, Y(0) + 22, T('↓ 導入しやすい（料金公開、初期0円）', '↓ Low entry cost (public price, no setup fee)', '↓ Chi phí khởi đầu thấp (giá công khai, 0 yên)'), 'ap-vm-al', 'start')}
${dots}
    </svg>
    ${L3('p', b.t(T('位置は前ページの比較データからの推定', 'Positions estimated from the comparison page', 'Vị trí ước lượng từ trang so sánh'), 'spider', 'photoruction', 'kanna', 'kannaFree', 'dandori', 'dandoriPlan', 'buildee'), ' class="ap-vs-note"')}
  </div>
${endLine(L3, T('ANDPADは工程全体を一つの基盤で扱う統合型。他社製品は導入しやすい料金や特定工程の専門性に強みを持つ。', 'ANDPAD is an integrated platform for the whole workflow; other products focus on low entry cost or depth in a specific process.', 'ANDPAD theo hướng tích hợp toàn quy trình; các sản phẩm khác tập trung vào chi phí khởi đầu thấp hoặc chuyên sâu nghiệp vụ.'))}
${b.list()}
</section>`;
}

// ---------- Slide 3: giá bắt đầu + thế mạnh theo tiêu chí ----------
// [tên, phí ban đầu (yên) hoặc null = báo giá riêng, nhãn, phí tháng, nguồn]
const FEE = [
  ['KANNA', 0, T('0円', '¥0', '0 yên'), T('無料プランあり', 'free plan', 'có gói miễn phí'), ['kanna', 'kannaFree']],
  ['Buildee', 50000, T('5万円', '¥50,000', '50.000 yên'), T('月3万円／支店', '¥30,000/mo per branch', '30.000 yên/tháng/chi nhánh'), ['buildee']],
  ['Dandori Work', 200000, T('20万円〜', 'from ¥200,000', 'từ 200.000 yên'), T('月1.5万円〜', 'from ¥15,000/mo', 'từ 15.000 yên/tháng'), ['dandoriPlan']],
  ['ANDPAD', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['pricing'], 1],
  ['SPIDERPLUS', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['spider']],
  ['Photoruction', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['photoruction']],
];
// [icon, tiêu chí, ANDPAD có thế mạnh?, sản phẩm khác có thế mạnh (tên) hoặc '', nguồn]
const STR = [
  ['team-group', T('規模', 'Scale', 'Quy mô'), 1, '', ['share']],
  ['building-blocks', T('製品の幅', 'Product breadth', 'Phạm vi sản phẩm'), 1, '', ['products']],
  ['chat-bubbles', T('言語（日本語＋6言語、KANNAは計6言語）', 'Languages (JA + 6; KANNA 6 in all)', 'Ngôn ngữ (Nhật + 6; KANNA tổng 6)'), 1, '', ['newsLang6', 'kannaScale']],
  ['key', T('導入しやすい料金', 'Low entry cost', 'Chi phí khởi đầu'), 0, 'KANNA · Buildee · Dandori Work', ['kanna', 'buildee', 'dandoriPlan']],
  ['checklist', T('特定工程の専門性', 'Depth in a specific process', 'Chuyên sâu nghiệp vụ'), 0, 'SPIDERPLUS · Buildee · Photoruction', ['spider', 'buildee', 'photoruction']],
];
export function pageVsWin({ L3, head, b }) {
  const sub = b.c('pricing');
  const max = 200000;
  const fee = FEE.map(([n, v, lab, mo, r, me]) => `      <div class="ap-vb-r${me ? ' is-me' : ''}${v === null ? ' is-q' : ''}" title="${n}: ${lab.en}${mo ? `, ${mo.en}` : ''}"><b>${n}</b><span class="ap-vb-t"><i data-v="${v ?? 'quote'}" style="--w:${v === null ? 0 : Math.max(1.5, v / max * 100).toFixed(1)}%"></i></span>${L3('em', b.t(lab, ...r))}${mo ? L3('small', mo) : '<small></small>'}</div>`).join('\n');
  const str = STR.map(([ic, k, me, rv, r]) => `      <li class="ap-vw-r" title="${k.en}: ${me && rv ? 'ANDPAD = ' + rv : me ? 'ANDPAD' : rv}">${ico(ic, 26)}${L3('b', b.t(k, ...r))}<span class="ap-vw-a${me ? ' on' : ''}">ANDPAD</span><span class="ap-vw-v${rv ? ' on' : ''}">${rv || '·'}</span></li>`).join('\n');
  return `<section class="pg" data-chap="IV" id="ap-vs-win">
${head('VS 3　<b>STRENGTHS BY CRITERION</b>', T('観点ごとの<br /><i>強みを比較。</i>', 'Strengths<br /><i>by criterion.</i>', 'Thế mạnh<br /><i>theo từng tiêu chí.</i>'),
    'Entry cost ／ Strengths', T('初期費用と5つの観点で比較。', 'Setup fee and five criteria.', 'So sánh phí khởi tạo và 5 tiêu chí.'), sub)}
  <div class="card ap-vs-c rv" style="--d:160ms">
    <div class="ap-vs-ch">${ico('funnel', 26)}${L3('h3', T('初期費用（公開価格）', 'Setup fee (public price)', 'Phí khởi tạo (giá công khai)'))}</div>
    <div class="ap-vs-chart ap-vb ap-vb-fee" role="img" aria-label="Setup fee: KANNA 0 yen; Buildee 50,000 yen; Dandori Work from 200,000 yen; ANDPAD, SPIDERPLUS, Photoruction quote only">
${fee}
    </div>
  </div>
  <div class="card ap-vs-c rv" style="--d:200ms">
    <p class="ap-vw-h"><i></i>${L3('span', T('観点', 'Criterion', 'Tiêu chí'))}<span>ANDPAD</span>${L3('span', T('他社製品', 'Other products', 'Sản phẩm khác'))}</p>
    <ul class="ap-vw">
${str}
    </ul>
  </div>
${endLine(L3, T('ANDPADの強みは規模と製品の幅。導入しやすい料金と特定工程の専門性では、他社製品に強みがある。', 'ANDPAD\'s strengths are scale and product breadth; other products stand out on entry cost and process depth.', 'Thế mạnh của ANDPAD là quy mô và phạm vi sản phẩm; các sản phẩm khác nổi bật về chi phí khởi đầu và tính chuyên sâu nghiệp vụ.'))}
${b.list()}
</section>`;
}
