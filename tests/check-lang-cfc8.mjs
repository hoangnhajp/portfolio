// Task cfc8: (1) #lang-ja (JAPANESE AT WORK) bỏ hẳn khối hội thoại giả (bong bóng President / Me, chấm "đang gõ"),
// dòng tiến trình 6 bước trải ngang toàn khổ, đường nối chạy tuyến tính khớp nhịp icon sáng;
// (2) #lang-bridge: tam giác CEO / Đội ngũ / Kết quả cân đối: cạnh nối đúng toạ độ 3 nút, hub ở trọng tâm,
//     nhãn cạnh ở đúng trung điểm, căn giữa bằng thuộc tính translate (keyframe transform không ghi đè được), nhãn nút không đẩy lệch tâm icon.
// Chạy: node tests/check-lang-cfc8.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
const css = (html.match(/<!-- lang-css:start -->([\s\S]*?)<!-- lang-css:end -->/) || [, ''])[1];
const rule = (sel) => (css.match(new RegExp(`(?:^|\\n|\\})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\{([^}]*)\\}`)) || [, ''])[1];

// 1) #lang-ja: không còn hội thoại
const ja = sec('lang-ja');
ok(ja, 'thiếu #lang-ja');
ok(!/lg-chat|lg-msg|lg-bub|lg-typing/.test(ja), '#lang-ja: còn khối hội thoại (lg-chat / lg-msg / lg-bub / lg-typing)');
ok(!/<small>(President|Me)<\/small>/.test(ja), '#lang-ja: còn nhãn bong bóng President / Me');
ok(!/lg-chat|lg-msg|lg-bub|lg-typing|lgB[1-4]|lgType|lgDot/.test(css), 'lang-css: còn CSS / keyframe của hội thoại cũ');
ok(!/class="lg-two/.test(ja), '#lang-ja: còn lưới 2 cột lg-two (hội thoại + tiến trình)');
ok((ja.match(/class="lg-tk"/g) || []).length === 6 && /class="card lg-track lg-anim rv"/.test(ja), '#lang-ja: cần 1 thẻ .lg-track trải ngang gồm 6 bước');
ok(/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/.test(rule('.lg-tks')), '.lg-tks: màn rộng phải là lưới 6 cột đều');
ok(/lgFillX/.test(css) && /\.lg-tks::after\{animation:lgFillX 7s linear infinite\}/.test(css.replace(/html\.js \.lg-track /g, '')), 'đường nối tiến trình phải chạy tuyến tính (linear) để khớp nhịp icon');

// 2) #lang-bridge: hình học tam giác
const br = sec('lang-bridge');
const num = (s, k) => +((s.match(new RegExp(`--${k}:(-?[\\d.]+)`)) || [])[1]);
const nodes = [...br.matchAll(/<span class="lg-node" style="([^"]*)"/g)].map((m) => [num(m[1], 'x'), num(m[1], 'y')]);
const edges = [...br.matchAll(/<i class="lg-edge" style="([^"]*)"/g)].map((m) => ({ x: num(m[1], 'x'), y: num(m[1], 'y'), l: num(m[1], 'l'), a: num(m[1], 'a') }));
const docs = [...br.matchAll(/<span class="lg-doc" style="([^"]*)"/g)].map((m) => [num(m[1], 'x'), num(m[1], 'y')]);
const hub = (br.match(/<span class="lg-hub" style="([^"]*)"/) || [])[1] || '';
ok(nodes.length === 3 && edges.length === 3 && docs.length === 3, `#lang-bridge: cần 3 nút, 3 cạnh, 3 nhãn cạnh (đang ${nodes.length}/${edges.length}/${docs.length})`);
const AR = 2; // khung 2:1, toạ độ % theo rộng (x) và cao (y)
const near = (p, q, t = 0.6) => Math.abs(p[0] - q[0]) <= t && Math.abs(p[1] - q[1]) <= t;
for (const e of edges) {
  const rad = (e.a * Math.PI) / 180; const end = [e.x + e.l * Math.cos(rad), e.y + e.l * Math.sin(rad) * AR];
  ok(nodes.some((n) => near(n, [e.x, e.y])) && nodes.some((n) => near(n, end)), `#lang-bridge: cạnh (${e.x},${e.y}) l=${e.l} a=${e.a} không nối đúng 2 nút (đầu cuối ${end.map((v) => v.toFixed(1))})`);
  const mid = [(e.x + end[0]) / 2, (e.y + end[1]) / 2];
  ok(docs.some((d) => near(d, mid, 0.8)), `#lang-bridge: cạnh (${e.x},${e.y}) không có nhãn đúng trung điểm (${mid.map((v) => v.toFixed(1))})`);
}
if (nodes.length === 3) {
  const c = [(nodes[0][0] + nodes[1][0] + nodes[2][0]) / 3, (nodes[0][1] + nodes[1][1] + nodes[2][1]) / 3];
  ok(near([num(hub, 'x'), num(hub, 'y')], c, 0.4), `#lang-bridge: hub phải ở trọng tâm tam giác (${c.map((v) => v.toFixed(2))}), đang ${hub}`);
  ok(Math.abs((nodes[0][0] + nodes[1][0]) / 2 - 50) < 0.01 && nodes[0][1] === nodes[1][1] && nodes[2][0] === 50, '#lang-bridge: tam giác phải đối xứng qua trục giữa (2 nút trên cùng hàng, nút dưới x=50)');
}
for (const sel of ['.lg-node', '.lg-hub', '.lg-doc']) {
  const r = rule(sel);
  ok(/translate:-50% -50%/.test(r) && !/transform:translate\(-50%/.test(r), `${sel}: phải căn giữa bằng thuộc tính translate:-50% -50% (không dùng transform để keyframe khỏi ghi đè)`);
}
ok(/position:absolute/.test(rule('.lg-node b')), '.lg-node b: nhãn nút phải đặt tuyệt đối dưới icon để tâm nút = tâm icon');

if (fails.length) { console.error(`FAIL check-lang-cfc8 (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lang-cfc8: #lang-ja bỏ hội thoại giả, tiến trình 6 bước ngang khớp nhịp; #lang-bridge tam giác đối xứng, cạnh nối đúng nút, hub ở trọng tâm, nhãn ở trung điểm, căn giữa bằng translate');
