// Trang "sau khi ký hợp đồng" (dịch vụ sau bán hàng) trong tab Sales:
//   #sales-after      MAYEKAWA (máy lạnh công nghiệp), ngay sau #sales-cycle
//   #sales-jil-after  JILNESTA (phần mềm), ngay sau khối sales-jil (#sales-jil-flow)
// Kèm nhãn giai đoạn hợp đồng (tools/sales/phase.mjs) trên #sales-cycle, mục lục, ảnh nền (IDS pganh) và đánh số lại
// nhãn eb + mục lục tab Sales theo đúng thứ tự mục lục (01, 02, ...).
// Cảnh động dùng lại CSS / JS của cảnh .gx (tools/gx/build.mjs) và danh sách .sc-list của khối sales-css; icon có sẵn assets/gx.
// Chạy: node tools/sales/after.mjs [index.html]   (chạy lại không nhân đôi: thay giữa các dấu sales-after / sales-jil-after / sales-after-css)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { phase, rePhase, PHASE_CSS } from './phase.mjs';

const file = process.argv[2] || fileURLToPath(new URL('../../index.html', import.meta.url));
let html = readFileSync(file, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const fix = (t) => t.replace(/\r?\n/g, EOL);

const L = (ja, en, vi, tag = 'span', cls = '') => [['ja', ja], ['en', en], ['vi', vi]]
  .map(([l, t]) => `<${tag}${cls ? ` class="${cls}"` : ''} data-l="${l}">${t}</${tag}>`).join('');
const gimg = (n, s) => `<img src="assets/gx/${n}.webp" alt="" width="${s}" height="${s}" loading="lazy" decoding="async">`;
const LOGO = {
  myc: '<p class="colg colg--co rv"><img src="assets/logos/mayekawa.svg" alt="MAYEKAWA (MYCOM)" width="181" height="25" decoding="async"><span class="co-nm">MAYEKAWA VIETNAM<em>2022.02 ～ 2026.06</em></span></p>',
  jil: '<p class="colg colg--co colg--jil rv"><img src="assets/logos/jilnesta.png" alt="JILNESTA" width="138" height="38" decoding="async"><span class="co-nm">JILNESTA, Inc.<em>2017.08 ～ 2022.02</em></span></p>',
};

// Cảnh luồng 4 bước dùng lại giao diện .gx--flow. Class đầu là sa-flow: không phải cảnh do tools/gx/build.mjs sinh
// (build đó gỡ / đếm mọi <figure class="gx ...">), nên chạy lại gx/build.mjs không xoá và tests/check-gx-scenes.mjs không đếm nhầm.
const flow = (steps) => '<figure class="sa-flow gx gx--flow" aria-hidden="true"><div class="gx-in">'
  + steps.map(([ic, t, chip], i) => `<div class="gx-st${chip ? ' is-hot' : ''}" style="--i:${i}"><span class="gx-pl">${gimg(ic, 88)}</span><b class="gx-lb">${L(...t)}</b>`
    + (chip ? `<em class="gx-chip gx-chip--o">${L(...chip)}</em>` : '') + '</div>'
    + (i < steps.length - 1 ? `<i class="gx-ln" style="--i:${i}"><i class="gx-cm"></i></i>` : '')).join('')
  + '</div></figure>';
const list = (items) => '<ol class="sc-list rv" style="--d:200ms" data-no-zoom>' + items.map(([ic, t, d], i) =>
  `<li>${gimg(ic, 44)}<div><em>${String(i + 1).padStart(2, '0')}</em>${L(...t, 'b')}${L(...d, 'p')}</div></li>`).join('') + '</ol>';
const chips = (ja, en, vi) => '<div class="kw1 rv" style="margin:8px 0 10px">'
  + [['ja', ja], ['en', en], ['vi', vi]].map(([l, cs]) => `<div class="chips" data-l="${l}">` + cs.map((c) => `<span class="chip">${c}</span>`).join('') + '</div>').join('') + '</div>';
function section({ id, chap, logo, eb, h2, sub, chip, steps, items }) {
  return `<section class="pg" data-chap="${chap}" id="${id}">\n  ${logo}\n`
    + `  <span class="eb rv">00　<b>${eb}</b></span>${phase('post')}\n`
    + `  <h2 class="kw rv" style="--d:60ms">${L(...h2)}</h2>\n  <div class="kwbar rv" style="--d:120ms"><span></span></div>\n`
    + ['ja', 'en', 'vi'].map((l, i) => `  <p class="kw-sub rv" style="--d:140ms" data-l="${l}">${sub[i]}</p>\n`).join('')
    + `  ${chips(...chip)}\n  ${flow(steps)}\n  ${list(items)}\n</section>\n`;
}

// ───────── MAYEKAWA: sau khi ký hợp đồng (máy lạnh công nghiệp)
const SEC_MYC = section({
  id: 'sales-after', chap: 'V', logo: LOGO.myc, eb: 'AFTER-SALES SERVICE',
  h2: ['契約後も技術チームと、<br /><i>機械の稼働を見守る。</i>', 'After the contract,<br /><i>keeping the machines running well.</i>', 'Sau khi ký hợp đồng,<br /><i>đồng hành cùng khách vận hành máy.</i>'],
  sub: ['契約後は技術チームと連携して取扱説明書の内容を説明し、顧客の質問に回答。定期的に現場で稼働状況を確認し、検収に立ち会い四半期ごとに報告。',
    'After signing, I explained user manuals with our engineers, answered questions, checked machines on site and handled acceptance and quarterly reports.',
    'Sau khi ký hợp đồng, tôi phối hợp đội kỹ thuật truyền đạt tài liệu hướng dẫn, giải đáp thắc mắc, kiểm tra máy định kỳ, nghiệm thu, báo cáo quý.'],
  chip: [['アフターサービス', '技術チームと連携', '取扱説明書', '質問への回答', '定期点検', '検収', '四半期報告'],
    ['after-sales service', 'with engineers', 'user manuals', 'answering questions', 'regular site checks', 'acceptance', 'quarterly reports'],
    ['dịch vụ sau bán hàng', 'phối hợp kỹ thuật', 'tài liệu hướng dẫn', 'giải đáp thắc mắc', 'kiểm tra định kỳ', 'nghiệm thu', 'báo cáo quý']],
  steps: [['team-group', ['技術チームと連携', 'With engineers', 'Phối hợp kỹ thuật']], ['chat-bubbles', ['質問に回答', 'Answer questions', 'Giải đáp thắc mắc']],
    ['magnifier', ['定期点検', 'Site checks', 'Kiểm tra định kỳ']], ['milestone-report', ['検収と報告', 'Acceptance, reports', 'Nghiệm thu, báo cáo'], ['四半期ごと', 'Quarterly', 'Theo quý']]],
  items: [
    ['jd-document', ['取扱説明書の説明', 'Explain the user manuals', 'Truyền đạt tài liệu hướng dẫn'],
      ['技術チームと連携し、取扱説明書の内容を顧客に説明する', 'Work with the engineers to walk the client through the user manuals', 'Phối hợp với đội kỹ thuật truyền đạt tài liệu hướng dẫn sử dụng cho khách hàng']],
    ['chat-bubbles', ['顧客の質問に回答', 'Answer client questions', 'Giải đáp thắc mắc'],
      ['技術的な質問を受け、技術チームと一緒にわかりやすく回答する', 'Take technical questions and answer them clearly together with the engineers', 'Tiếp nhận câu hỏi kỹ thuật, cùng đội kỹ thuật giải đáp thắc mắc của khách hàng']],
    ['magnifier', ['定期訪問と点検', 'Regular site visits', 'Định kỳ kiểm tra tại chỗ'],
      ['定期的に現場を訪ね、機械の稼働状況を評価、確認する', 'Visit the site regularly to assess and check how the machines are running', 'Định kỳ đến tận nơi đánh giá, kiểm tra tình hình vận hành của máy']],
    ['milestone-report', ['検収と四半期報告', 'Acceptance and quarterly reports', 'Nghiệm thu, báo cáo theo quý'],
      ['検収に立ち会い、四半期ごとに報告書を提出する', 'Take part in the acceptance and submit a report every quarter', 'Tham gia nghiệm thu và nộp báo cáo theo quý']],
  ],
});

// ───────── JILNESTA: sau khi ký hợp đồng (phần mềm)
const SEC_JIL = section({
  id: 'sales-jil-after', chap: 'I', logo: LOGO.jil, eb: 'AFTER-SALES SUPPORT',
  h2: ['契約後も、<br /><i>ソフトの利用を支える。</i>', 'After the contract,<br /><i>supporting the software in use.</i>', 'Sau khi ký hợp đồng,<br /><i>hỗ trợ khách dùng phần mềm.</i>'],
  sub: ['契約後は顧客にソフトウェアの使い方を案内し、利用中のバグやサーバーの障害を受け付けて開発チームに報告し、解決につなげる。',
    'After the contract, I showed clients how to use the software, took bug and server issue reports and passed them to the dev team to fix.',
    'Sau khi ký hợp đồng, tôi hướng dẫn khách sử dụng phần mềm, tiếp nhận lỗi bug, sự cố server khi dùng và báo cáo đội dev để giải quyết.'],
  chip: [['アフターサポート', '使い方の案内', '問い合わせ対応', 'バグ対応', 'サーバー障害', '開発チームへ報告'],
    ['after-sales support', 'user guidance', 'answering questions', 'bug reports', 'server issues', 'reporting to the dev team'],
    ['hỗ trợ sau bán hàng', 'hướng dẫn sử dụng', 'giải đáp thắc mắc', 'xử lý bug', 'sự cố server', 'báo cáo đội dev']],
  steps: [['jd-document', ['使い方の案内', 'User guidance', 'Hướng dẫn sử dụng']], ['chat-bubbles', ['問い合わせ対応', 'Questions', 'Giải đáp thắc mắc']],
    ['workflow-gears', ['バグとサーバー', 'Bugs, servers', 'Bug, server']], ['team-group', ['開発チームへ報告', 'Dev team report', 'Báo cáo đội dev'], ['解決へ', 'To a fix', 'Giải quyết']]],
  items: [
    ['jd-document', ['ソフトウェアの使い方を案内', 'Show how to use the software', 'Hướng dẫn sử dụng phần mềm'],
      ['操作マニュアルをもとに、顧客にソフトウェアの使い方を案内する', 'Walk clients through the software using the user guide', 'Hướng dẫn khách hàng sử dụng phần mềm theo tài liệu hướng dẫn']],
    ['chat-bubbles', ['利用中の問い合わせ対応', 'Answer user questions', 'Giải đáp thắc mắc'],
      ['利用中の質問を受け付け、わかりやすく回答する', 'Take questions from users and answer them clearly', 'Tiếp nhận và giải đáp thắc mắc của khách trong quá trình sử dụng']],
    ['workflow-gears', ['バグとサーバーの障害', 'Bugs and server issues', 'Sự cố bug và server'],
      ['利用中に起きたバグやサーバーの障害の連絡を受け付ける', 'Take reports of bugs and server problems found in use', 'Tiếp nhận lỗi bug, sự cố server trong quá trình sử dụng phần mềm']],
    ['team-group', ['開発チームへ報告', 'Report to the dev team', 'Báo cáo đội dev'],
      ['開発チームに報告し、バグとサーバーの問題を解決につなげる', 'Report to the dev team so bugs and server problems get solved', 'Báo cáo đội dev để giải quyết sự cố bug, server']],
  ],
});

const CSS = `<style id="sales-after-css">
/* Trang sau khi ky hop dong (tools/sales/after.mjs) + nhan giai doan hop dong (tools/sales/phase.mjs) */
${PHASE_CSS}
.gx.sa-flow{margin-top:6px}
</style>
`;

// ───────── Chèn vào index.html
const endOfSection = (id) => {
  const a = html.indexOf(`id="${id}"`); if (a < 0) throw new Error('không thấy #' + id);
  const e = html.indexOf('</section>', a); return html.indexOf('\n', e) + 1;
};
const putBlock = (name, body, at) => {
  const re = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->\\r?\\n`);
  const block = fix(`<!-- ${name}:start -->\n${body}<!-- ${name}:end -->\n`);
  if (re.test(html)) { html = html.replace(re, () => block); return; }
  const pos = at();
  html = html.slice(0, pos) + block + html.slice(pos);
};
putBlock('sales-after-css', CSS, () => {
  const m = '<!-- sales-jil-css:end -->'; const a = html.indexOf(m);
  if (a >= 0) return html.indexOf('\n', a) + 1;
  const h = html.indexOf('</head>'); if (h < 0) throw new Error('không thấy </head>'); return h;
});
putBlock('sales-after', SEC_MYC, () => endOfSection('sales-cycle'));
putBlock('sales-jil-after', SEC_JIL, () => {
  const a = html.indexOf('<!-- sales-jil:end -->'); if (a < 0) throw new Error('không thấy <!-- sales-jil:end -->');
  return html.indexOf('\n', a) + 1;
});

// Nhãn "trước khi ký hợp đồng" trên dòng eb của #sales-cycle (#sales-jil-flow do tools/jil/build.mjs sinh)
{
  const a = html.indexOf('id="sales-cycle"'), e = html.indexOf('</section>', a);
  const b = html.indexOf('<span class="eb rv">', a); if (b < 0 || b > e) throw new Error('không thấy nhãn eb của #sales-cycle');
  const le = html.indexOf('\n', b);
  const line = html.slice(b, le).replace(/\r$/, '').replace(rePhase, '');
  html = html.slice(0, b) + line + phase('pre') + (html[le - 1] === '\r' ? '\r' : '') + html.slice(le);
}

// Mục lục tab Sales: 1 dòng mỗi trang mới, ngay sau trang đứng trước
const NAV = [['sales-after', 'sales-cycle', 'アフターサービス', 'After-sales service', 'Dịch vụ sau bán hàng'],
  ['sales-jil-after', 'sales-jil-flow', 'アフターサポート', 'After-sales support', 'Hỗ trợ sau bán hàng']];
for (const [id, prev, ja, en, vi] of NAV) {
  html = html.replace(new RegExp(`[ \\t]*<a href="#${id}" data-sec="${id}">[^\\n]*\\n`, 'g'), '');
  const p = html.indexOf(`<a href="#${prev}" data-sec="${prev}">`); if (p < 0) throw new Error('không thấy mục lục ' + prev);
  const nl = html.indexOf('\n', p) + 1;
  html = html.slice(0, nl) + `      <a href="#${id}" data-sec="${id}"><em>00</em>${L(ja, en, vi)}</a>${EOL}` + html.slice(nl);
}

// Ảnh nền (khối pganh): thêm id ngay sau trang đứng trước
for (const [id, prev] of NAV) {
  const ids0 = html.indexOf('var IDS=');
  if (ids0 >= 0 && html.slice(ids0, html.indexOf('];', ids0)).includes(`'${id}'`)) continue;
  const before = html;
  html = html.replace(new RegExp(`(var IDS=\\[[^\\]]*?)'${prev}',`), `$1'${prev}','${id}',`);
  if (html === before) throw new Error('không thêm được ' + id + ' vào mảng IDS');
}

// Đánh số lại theo thứ tự mục lục tab Sales (bỏ mục TOP); đây là nơi quyết định số cuối cùng (tools/jil/build.mjs tự tính cùng quy tắc): <em>NN</em> trong mục lục và nhãn eb NN của từng trang
{
  const re = /(<nav class="sb-nav" data-for="sales"[^>]*>)([\s\S]*?)(<\/nav>)/;
  const m = html.match(re); if (!m) throw new Error('không thấy mục lục tab Sales');
  const ids = [...m[2].matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((x) => x[1]).filter((id) => id !== 'sales-top');
  const no = (id) => String(ids.indexOf(id) + 1).padStart(2, '0');
  html = html.replace(re, (_, a, body, c) => a + body.replace(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g, (s, id) => id === 'sales-top' ? s : `data-sec="${id}"><em>${no(id)}</em>`) + c);
  for (const id of ids) {
    const a = html.indexOf(`id="${id}"`); if (a < 0) throw new Error('không thấy #' + id);
    const e = html.indexOf('</section>', a);
    const seg = html.slice(a, e).replace(/<span class="eb rv">\d+　<b>/, `<span class="eb rv">${no(id)}　<b>`);
    html = html.slice(0, a) + seg + html.slice(e);
  }
}

writeFileSync(file, html);
console.log('sales-after: #sales-after (MAYEKAWA), #sales-jil-after (JILNESTA), nhãn trước / sau khi ký hợp đồng, đánh số lại mục lục Sales');
