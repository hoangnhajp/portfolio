// Task yt50: tab JD ANDPAD thêm trang #jd-match (mục 02 SKILL MATCH): đối chiếu kỹ năng trong portfolio với JD và nói lý do phù hợp.
//   radar chồng 2 lớp (mức JD cần = đúng điểm radar #jd-fit, mức của tôi = tự đánh giá), số tóm tắt TÍNH từ dữ liệu trên trang,
//   bảng đối chiếu phủ ĐỦ 12 yêu cầu của JD (7 bắt buộc, 2 ngoại ngữ, 1 học vấn, 2 ưu tiên; đếm lại từ fixture), mỗi dòng có link
//   sang trang bằng chứng có thật, 4 lý do theo đúng 4 chặng đồng hành ở #jd-fit, câu kết.
// Chạy: node tests/check-jd-match.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const p = (rel) => fileURLToPath(new URL(`../${rel}`, import.meta.url));
const html = readFileSync(p('index.html'), 'utf8').normalize('NFC');
const jd = readFileSync(p('tests/fixtures/jd-andpad.txt'), 'utf8').normalize('NFC').replace(/\r/g, '');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const main = (html.match(/<main class="wrap" data-view="jd" hidden>([\s\S]*?)<\/main>/) || [])[1] || '';
const ids = [...main.matchAll(/<section class="pg"[^>]*id="([\w-]+)"/g)].map((m) => m[1]);
ok(ids.join(',') === 'jd-top,jd-fit,jd-match', `tab JD cần 3 trang jd-top,jd-fit,jd-match: ${ids}`);
const sec = (id) => (main.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?<\\/section>`)) || [''])[0];
const fit = sec('jd-fit'), mt = sec('jd-match');
ok(mt, 'thiếu section #jd-match');
ok(/<span class="eb rv">02　<b>SKILL MATCH<\/b><\/span>/.test(mt), '#jd-match: nhãn eb phải là "02　SKILL MATCH"');

// Sidebar + ảnh nền
const sb = (html.match(/<nav class="sb-nav" data-for="jd" hidden>([\s\S]*?)<\/nav>/) || [])[1] || '';
ok(/<a href="#jd-match" data-sec="jd-match"><em>02<\/em>(<span data-l="(ja|en|vi)">[^<]+<\/span>){3}<\/a>/.test(sb), 'sidebar JD thiếu mục 02 #jd-match đủ 3 ngôn ngữ');
const IDS = (html.match(/var IDS=\[([^\]]*)\]/) || [])[1] || '';
ok(IDS.includes("'jd-fit','jd-match'"), "pganh IDS cần 'jd-match' ngay sau 'jd-fit'");
ok(existsSync(p('assets/pg/jd-match.webp')), 'thiếu assets/pg/jd-match.webp');

// 1) Radar chồng: lớp JD = đúng điểm radar #jd-fit; lớp tôi 1..5; toạ độ tính đúng (tâm 160,150, R 110, đều 40°)
const fitV = [...fit.matchAll(/<circle class="jd-pt" data-v="(\d)"/g)].map((m) => +m[1]);
const radar = (mt.match(/<svg class="jd-radar jm-radar"[\s\S]*?<\/svg>/) || [''])[0];
ok(radar, '#jd-match thiếu svg.jd-radar.jm-radar');
const layer = (k) => {
  const v = [...radar.matchAll(new RegExp(`<circle class="jm-pt jm-pt--${k}" data-v="(\\d)"`, 'g'))].map((m) => +m[1]);
  const pts = ((radar.match(new RegExp(`<polygon class="jm-area jm-area--${k}" points="([^"]+)"`)) || [])[1] || '').trim().split(/\s+/).map((s) => s.split(',').map(Number));
  v.forEach((x, i) => {
    const a = (-90 + i * 40) * Math.PI / 180, r = 110 * x / 5, [px, py] = pts[i] || [NaN, NaN];
    ok(Math.abs(px - (160 + r * Math.cos(a))) < 0.6 && Math.abs(py - (150 + r * Math.sin(a))) < 0.6, `radar ${k}: đỉnh ${i} lệch (${px},${py})`);
  });
  ok(pts.length === 9, `radar ${k}: đa giác cần 9 đỉnh, thấy ${pts.length}`);
  return v;
};
const vJd = layer('jd'), vMe = layer('me');
ok(vJd.length === 9 && vJd.join() === fitV.join(), `lớp JD phải trùng radar #jd-fit: ${vJd} / ${fitV}`);
ok(vMe.length === 9 && vMe.every((x) => x >= 1 && x <= 5), `lớp "tôi" cần 9 điểm 1..5: ${vMe}`);
for (const l of ['ja', 'en', 'vi']) ok((radar.match(new RegExp(`<text[^>]*data-l="${l}"`, 'g')) || []).length === 9, `nhãn trục radar #jd-match thiếu ${l}`);
ok((radar.match(/<title>/g) || []).length === 18, 'radar #jd-match: 18 điểm (9 JD + 9 tôi) mỗi điểm cần <title> (tooltip)');
ok(/tự đánh giá/.test(mt) && /自己評価/.test(mt) && /self-assess/.test(mt), '#jd-match phải ghi rõ mức của tôi là tự đánh giá (3 ngôn ngữ)');

// 2) Số tóm tắt tính từ dữ liệu trên trang, không gõ tay
const num = (k) => ((mt.match(new RegExp(`<b class="jm-num" data-k="${k}">([^<]+)</b>`)) || [])[1] || '').trim();
const meet = vMe.filter((x, i) => x >= vJd[i]).length;
ok(num('axes') === `${meet}/9`, `số "năng lực đạt hoặc vượt" phải là ${meet}/9, trang ghi "${num('axes')}"`);

// 3) Bảng đối chiếu phủ đủ 12 yêu cầu của JD
const bullets = (head) => { const r = jd.slice(jd.indexOf(head) + head.length); return (r.slice(0, r.search(/\n(\*\*|##)/)).match(/^- /gm) || []).length; };
const need = { m: bullets('**Yêu cầu bắt buộc (Must-have):**'), l: bullets('**Ngoại ngữ:**'), e: 1, n: bullets('**Ưu tiên (Nice-to-have):**') };
const all = Object.entries(need).flatMap(([k, n]) => Array.from({ length: n }, (_, i) => `${k}${i + 1}`));
ok(all.length === 12, `fixture JD lạ: ${all.length} yêu cầu`);
ok(num('req') === `${all.length}/${all.length}`, `số "yêu cầu có kinh nghiệm đối chiếu" phải là ${all.length}/${all.length}, trang ghi "${num('req')}"`);
const T = { m: 'must', l: 'lang', e: 'edu', n: 'nice' };
const rows = [...mt.matchAll(/<li class="jm-row" data-t="(\w+)" data-r="([\w ]+)"[^>]*>([\s\S]*?)<\/li>/g)];
ok(rows.length >= 8 && rows.length <= 11, `bảng đối chiếu cần 8..11 dòng, thấy ${rows.length}`);
const seen = [];
const sid = new Set([...html.matchAll(/<section[^>]*\bid="([\w-]+)"/g)].map((m) => m[1]));
for (const [, t, r, body] of rows) {
  const rs = r.trim().split(/\s+/); seen.push(...rs);
  ok(rs.every((x) => T[x[0]] === t), `dòng ${r}: nhãn nhóm ${t} không khớp mã yêu cầu`);
  for (const l of ['ja', 'en', 'vi']) ok((body.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === 2, `dòng ${r}: cần yêu cầu + bằng chứng bằng ${l}`);
  const go = [...body.matchAll(/<a href="#([\w-]+)">/g)].map((m) => m[1]);
  ok(go.length >= 1 && go.every((g) => sid.has(g)), `dòng ${r}: link bằng chứng thiếu hoặc trỏ trang không có: ${go}`);
}
ok([...seen].sort().join() === [...all].sort().join(), `bảng phải phủ mỗi yêu cầu đúng 1 lần: có ${seen.sort()}, cần ${all}`);

// 4) Lý do phù hợp theo đúng 4 chặng đồng hành của #jd-fit
const stages = [...fit.matchAll(/<li class="jd-st"[\s\S]*?<h3 data-l="vi">([^<]+)<\/h3>/g)].map((m) => m[1]);
const why = [...mt.matchAll(/<li class="jm-why"[\s\S]*?<h3 data-l="vi">([^<]+)<\/h3>[\s\S]*?<\/li>/g)];
ok(why.length === 4 && why.map((m) => m[1]).join('|') === stages.join('|'), `4 lý do phải theo 4 chặng ${stages}: ${why.map((m) => m[1])}`);
for (const m of why) ok(/<p data-l="vi">Tôi /.test(m[0]), `lý do "${m[1]}" cần câu ngôi thứ nhất (Tôi ...)`);
ok(/<div class="jm-end rv"[^>]*>(<p data-l="(ja|en|vi)">[^<]+<\/p>){3}<\/div>/.test(mt), '#jd-match thiếu câu kết .jm-end đủ 3 ngôn ngữ');

// 5) Chữ: 3 ngôn ngữ cân nhau, không gạch ngang dài, không tên công cụ AI, không tự nhận "IT communicator", không TOEIC
const c = ['ja', 'en', 'vi'].map((l) => (mt.match(new RegExp(`data-l="${l}"`, 'g')) || []).length);
ok(c[0] > 30 && c[0] === c[1] && c[1] === c[2], `#jd-match số chữ 3 ngôn ngữ lệch: ${c.join('/')}`);
const txt = strip(mt);
ok(!txt.includes('—'), '#jd-match có dấu gạch ngang dài');
ok(!/chat\s*-?gpt|\bclaude\b|copilot|gemini|openai/i.test(txt), '#jd-match nêu tên công cụ AI');
ok(!/IT communicator/i.test(txt) && !/TOEIC/i.test(txt), '#jd-match không tự nhận IT communicator / không nêu TOEIC');
// dữ kiện phải khớp portfolio
for (const f of ['JLPT N2', 'Khoảng 11 năm', '約11年', 'About 11 years', '13 công ty', '5 đến 6 người', '1 lên 5 người', 'cao học Tài chính']) ok(txt.includes(f), `#jd-match thiếu dữ kiện portfolio "${f}"`);
for (const f of ['khoảng 11 năm', 'JLPT N2', '13 công ty', '5 đến 6 người', '1 lên 5']) ok(strip(html.replace(mt, '')).includes(f), `dữ kiện "${f}" phải có ở trang khác của portfolio (không bịa)`);
ok(num('yrs') === '11', `ô số năm phải là 11 (khoảng 11 năm ở #career), trang ghi "${num('yrs')}"`);
ok(!/ngân hàng|3 công ty Nhật/.test(radar), 'tooltip radar không nêu dữ kiện ngoài portfolio');

// 6) CSS riêng nằm trong khối jd-css, có màn hẹp
const css = (html.match(/<!-- jd-css:start -->([\s\S]*?)<!-- jd-css:end -->/) || [])[1] || '';
ok(/\.jm-tbl|\.jm-row/.test(css) && /\.jm-area--me/.test(css), 'thiếu CSS .jm-* trong khối jd-css');
ok(/max-width:700px\)\{[\s\S]*\.jm-/.test(css), 'thiếu nhánh màn hẹp cho .jm-*');

if (fails.length) { console.error('FAIL check-jd-match\n- ' + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-jd-match (JD ${vJd} / tôi ${vMe}; ${meet}/9 đạt hoặc vượt; ${rows.length} dòng phủ ${all.length}/${all.length} yêu cầu)`);
