// 3 slide hình tóm gọn đối thủ ANDPAD, ngay sau #ap-compete: ít chữ, chủ yếu chart, mỗi slide 1 câu kết.
// #ap-vs-scale = quy mô (thanh số công ty, số người dùng); #ap-vs-map = bản đồ định vị 6 sản phẩm (phạm vi x cách bắt đầu);
// #ap-vs-win = phí ban đầu công khai + ai đang thắng ở tiêu chí nào.
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
  ['SPIDERPLUS', 23000, T('2.3万社超', '23,000+', 'Hơn 23.000'), '2026.09', ['spider']],
];
const US = [
  ['ANDPAD', 818000, T('81.8万人', '818,000', '818.000'), '', ['top'], 1],
  ['SPIDERPLUS', 800000, T('80万人超', '800,000+', 'Hơn 800.000'), '2026.09', ['spider']],
];
const bars = (L3, b, rows, max, aria) => `<div class="ap-vs-chart ap-vb" role="img" aria-label="${aria}">
${rows.map(([n, v, lab, d, r, me]) => `      <div class="ap-vb-r${me ? ' is-me' : ''}" title="${n}: ${lab.en}${d ? ` (${d})` : ''}"><b>${n}</b><span class="ap-vb-t"><i data-v="${v}" style="--w:${(v / max * 100).toFixed(1)}%"></i></span>${L3('em', b.t(lab, ...r))}${d ? `<small>${d}</small>` : '<small></small>'}</div>`).join('\n')}
    </div>`;
export function pageVsScale({ L3, head, b }) {
  const sub = b.c('share', 'mic');
  return `<section class="pg" data-chap="IV" id="ap-vs-scale">
${head('VS 1　<b>SCALE</b>', T('規模は<br /><i>ANDPADが首位。</i>', 'On scale,<br /><i>ANDPAD leads.</i>', 'Về quy mô,<br /><i>ANDPAD dẫn đầu.</i>'),
    'Companies ／ Users ／ No.1', T('導入企業数で8年連続1位。', 'No.1 by adopting companies, 8 years running.', 'Số 1 về số doanh nghiệp dùng, 8 năm liền.'), sub)}
  <div class="ap-vs-hero rv" style="--d:160ms">
    <div class="card ap-vs-no1">${ico('milestone-report', 54)}<b>No.1</b>${L3('span', T('8年連続', '8 years running', '8 năm liền'))}</div>
    <div class="card ap-vs-c">
      <div class="ap-vs-ch">${ico('office-building', 26)}${L3('h3', T('利用企業数', 'Companies using it', 'Số công ty đang dùng'))}</div>
    ${bars(L3, b, CO, 279000, 'Companies using it: ANDPAD 279,000; KANNA 100,000+ incl. free partners; SPIDERPLUS 23,000+')}
      ${L3('p', T('各社の公表値（数え方は各社で異なる場合あり）。＊無料の協力会社を含む', 'Figures as published by each company; counting may differ. * incl. free partners', 'Số do từng hãng tự công bố, cách đếm có thể khác. * gồm cả đối tác dùng miễn phí'), ' class="ap-vs-note"')}
    </div>
  </div>
  <div class="card ap-vs-c rv" style="--d:200ms">
    <div class="ap-vs-ch">${ico('team-group', 26)}${L3('h3', T('ユーザー数', 'Users', 'Số người dùng'))}</div>
    ${bars(L3, b, US, 818000, 'Users: ANDPAD 818,000; SPIDERPLUS 800,000+')}
  </div>
  <ul class="ap-vs-na rv" style="--d:220ms">
    <li>${ico('magnifier', 22)}<b>Buildee</b>${L3('span', b.t(T('元請1,061社（単位が異なる）', '1,061 prime contractors (other unit)', '1.061 tổng thầu (khác đơn vị)'), 'buildee'))}</li>
    <li>${ico('magnifier', 22)}<b>Photoruction</b>${L3('span', b.t(T('社数は非公開', 'No public count', 'Không công bố số công ty'), 'photoruction'))}</li>
  </ul>
${endLine(L3, T('利用企業数は首位、ユーザー数はSPIDERPLUSと並ぶ。', 'Most companies by far; users on par with SPIDERPLUS.', 'Nhiều công ty dùng nhất; số người dùng ngang SPIDERPLUS.'))}
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
  ['Buildee', 12, 44, T('安全書類、元請', 'Safety papers, primes', 'An toàn, tổng thầu')],
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
${head('VS 2　<b>POSITIONING</b>', T('一つの工程か、<br /><i>全体か。</i>', 'One task,<br /><i>or the whole flow?</i>', 'Một khâu<br /><i>hay trọn quy trình?</i>'),
    'Scope ／ Entry price ／ Map', T('範囲と始めやすさで6製品を配置。', 'Six products by scope and ease of entry.', '6 sản phẩm theo phạm vi và độ dễ bắt đầu.'), sub)}
  <div class="card ap-vs-c ap-vm rv" style="--d:160ms">
    <svg class="ap-vs-chart ap-vm-svg" role="img" aria-label="Positioning map: only ANDPAD covers the whole flow (quote-only pricing); SPIDERPLUS and Photoruction are quote-only and narrower; KANNA, Dandori Work and Buildee are easier to start with" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <rect x="${X(50)}" y="${P}" width="${X(100) - X(50)}" height="${Y(50) - P}" class="ap-vm-q is-me"/>
      <line x1="${P}" y1="${Y(50)}" x2="${W - P}" y2="${Y(50)}" class="ap-vm-ax"/><line x1="${X(50)}" y1="${P}" x2="${X(50)}" y2="${Y(0)}" class="ap-vm-ax"/>
      ${txt(P, H - 12, T('← 一つの工程', '← One task', '← Một khâu'), 'ap-vm-al', 'start')}${txt(W - P, H - 12, T('工程全体 →', 'Whole flow →', 'Trọn quy trình →'), 'ap-vm-al', 'end')}
      ${txt(P + 4, P - 14, T('↑ 個別見積もりのみ', '↑ Quote only', '↑ Chỉ báo giá riêng'), 'ap-vm-al', 'start')}${txt(P + 4, Y(0) + 22, T('↓ 始めやすい（料金公開、初期0円）', '↓ Easy entry (public price, no setup fee)', '↓ Dễ bắt đầu (giá công khai, 0 yên)'), 'ap-vm-al', 'start')}
${dots}
    </svg>
    ${L3('p', b.t(T('位置は前ページの比較データからの推定', 'Positions estimated from the comparison page', 'Vị trí ước lượng từ trang so sánh'), 'spider', 'photoruction', 'kanna', 'kannaFree', 'dandori', 'dandoriPlan', 'buildee'), ' class="ap-vs-note"')}
  </div>
${endLine(L3, T('ANDPADは全体型で独走。競合は安さか一工程の深さで勝負。', 'ANDPAD alone covers the whole flow; rivals compete on low entry price or depth in one task.', 'ANDPAD một mình phủ trọn quy trình; đối thủ chọn giá dễ vào hoặc sâu một khâu.'))}
${b.list()}
</section>`;
}

// ---------- Slide 3: giá bắt đầu + ai thắng ở đâu ----------
// [tên, phí ban đầu (yên) hoặc null = báo giá riêng, nhãn, phí tháng, nguồn]
const FEE = [
  ['KANNA', 0, T('0円', '¥0', '0 yên'), T('無料プランあり', 'free plan', 'có gói miễn phí'), ['kanna', 'kannaFree']],
  ['Buildee', 50000, T('5万円', '¥50,000', '50.000 yên'), T('月3万円／支店', '¥30,000/mo per branch', '30.000 yên/tháng/chi nhánh'), ['buildee']],
  ['Dandori Work', 200000, T('20万円〜', 'from ¥200,000', 'từ 200.000 yên'), T('月1.5万円〜', 'from ¥15,000/mo', 'từ 15.000 yên/tháng'), ['dandoriPlan']],
  ['ANDPAD', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['pricing'], 1],
  ['SPIDERPLUS', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['spider']],
  ['Photoruction', null, T('個別見積もり', 'quote only', 'báo giá riêng'), null, ['photoruction']],
];
// [icon, tiêu chí, ANDPAD thắng?, đối thủ thắng (tên) hoặc '', nguồn]
const WIN = [
  ['team-group', T('規模', 'Scale', 'Quy mô'), 1, '', ['share']],
  ['building-blocks', T('製品の幅', 'Product breadth', 'Độ rộng sản phẩm'), 1, '', ['products']],
  ['chat-bubbles', T('言語（6言語）', 'Languages (6)', 'Ngôn ngữ (6)'), 1, 'KANNA', ['newsLang6', 'kannaFree']],
  ['key', T('始めやすい料金', 'Easy entry price', 'Giá dễ bắt đầu'), 0, 'KANNA · Buildee · Dandori Work', ['kanna', 'buildee', 'dandoriPlan']],
  ['checklist', T('一工程の深さ', 'Depth in one task', 'Sâu một khâu'), 0, 'SPIDERPLUS · Buildee · Photoruction', ['spider', 'buildee', 'photoruction']],
];
export function pageVsWin({ L3, head, b }) {
  const sub = b.c('pricing');
  const max = 200000;
  const fee = FEE.map(([n, v, lab, mo, r, me]) => `      <div class="ap-vb-r${me ? ' is-me' : ''}${v === null ? ' is-q' : ''}" title="${n}: ${lab.en}${mo ? `, ${mo.en}` : ''}"><b>${n}</b><span class="ap-vb-t"><i data-v="${v ?? 'quote'}" style="--w:${v === null ? 0 : Math.max(1.5, v / max * 100).toFixed(1)}%"></i></span>${L3('em', b.t(lab, ...r))}${mo ? L3('small', mo) : '<small></small>'}</div>`).join('\n');
  const win = WIN.map(([ic, k, me, rv, r]) => `      <li class="ap-vw-r" title="${k.en}: ${me && rv ? 'ANDPAD = ' + rv : me ? 'ANDPAD' : rv}">${ico(ic, 26)}${L3('b', b.t(k, ...r))}<span class="ap-vw-a${me ? ' on' : ''}">ANDPAD</span><span class="ap-vw-v${rv ? ' on' : ''}">${rv || '·'}</span></li>`).join('\n');
  return `<section class="pg" data-chap="IV" id="ap-vs-win">
${head('VS 3　<b>WHO WINS WHERE</b>', T('どこで勝ち、<br /><i>どこで負けるか。</i>', 'Where it wins,<br /><i>where it does not.</i>', 'Thắng ở đâu,<br /><i>thua ở đâu.</i>'),
    'Entry price ／ Scorecard', T('初期費用と5つの観点で比較。', 'Setup fee and five criteria.', 'So phí ban đầu và 5 tiêu chí.'), sub)}
  <div class="card ap-vs-c rv" style="--d:160ms">
    <div class="ap-vs-ch">${ico('funnel', 26)}${L3('h3', T('初期費用（公開価格）', 'Setup fee (public price)', 'Phí ban đầu (giá công khai)'))}</div>
    <div class="ap-vs-chart ap-vb ap-vb-fee" role="img" aria-label="Setup fee: KANNA 0 yen; Buildee 50,000 yen; Dandori Work from 200,000 yen; ANDPAD, SPIDERPLUS, Photoruction quote only">
${fee}
    </div>
  </div>
  <div class="card ap-vs-c rv" style="--d:200ms">
    <p class="ap-vw-h"><i></i>${L3('span', T('観点', 'Criterion', 'Tiêu chí'))}<span>ANDPAD</span>${L3('span', T('競合', 'Rival', 'Đối thủ'))}</p>
    <ul class="ap-vw">
${win}
    </ul>
  </div>
${endLine(L3, T('ANDPADは規模と幅で勝ち、始めやすさと一工程の深さで追われる。', 'ANDPAD wins on scale and breadth; rivals press on entry price and depth.', 'ANDPAD thắng ở quy mô và độ rộng; bị đuổi ở giá dễ vào và độ sâu một khâu.'))}
${b.list()}
</section>`;
}
