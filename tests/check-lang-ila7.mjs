// Task ila7: (1) tab Team Management không còn chữ "Claude" (thẻ 03 "Phân tích bằng Claude", câu dẫn, chip, caption, từ điển dịch);
// (2) tab Languages không còn "Sesame"; (3) #lang-ja thiết kế lại theo hourensou + làm chủ tiến độ (nắm tổng thể, deadline,
// kế hoạch, theo dõi, báo cáo theo tiến trình, kết quả), chủ yếu bằng tiếng Nhật; (4) #lang-en bỏ nhãn "Slide 01/02/03" trong animation;
// (5) #lang-bridge đổi nội dung: cầu nối giữa CEO và đội ngũ / phòng ban người Việt, học cách CEO dùng từ, suy nghĩ, tư duy,
// truyền đúng ý hai bên, hướng tới kết quả hơn là chỉ chuyển ngữ.
// Chạy: node tests/check-lang-ila7.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const only = (s, l) => s.replace(/<(\w+)\b[^>]*\bdata-l="(ja|en|vi)"[^>]*>[\s\S]*?<\/\1>/g, (m, t, x) => (x === l ? m : ' '));
const view = (v) => (html.match(new RegExp(`<main class="wrap" data-view="${v}" hidden>([\\s\\S]*?)</main>`)) || [])[1] || '';
const sec = (id) => (html.match(new RegExp(`<section class="pg"[^>]*id="${id}"[\\s\\S]*?</section>`)) || [''])[0];
const txt = (s) => ({ ja: strip(only(s, 'ja')), en: strip(only(s, 'en')), vi: strip(only(s, 'vi')) });

// 1) Team Management: không còn Claude (HTML + từ điển dịch của trang này)
const team = view('team');
ok(team, 'thiếu <main data-view="team">');
ok(!/claude/i.test(team), `tab Team Management còn "Claude": ${(team.match(/.{0,40}claude.{0,20}/i) || [''])[0]}`);
const dictTeam = html.split('\n').filter((l) => /Claude/.test(l) && /(日次報告|で分析|MAYEKAWA VIETNAMでは|Phân tích bằng|Analysis with|tổng hợp báo cáo|summarised daily)/.test(l));
ok(!dictTeam.length, `từ điển dịch trang Team còn Claude: ${dictTeam.map((l) => l.trim().slice(0, 50)).join(' | ')}`);
const daily = sec('team-daily');
const dt = txt(daily);
ok(dt.ja.includes('数値分析') && dt.en.includes('Data analysis') && dt.vi.includes('Phân tích số liệu'), '#team-daily: thẻ 03 phải là "数値分析 / Data analysis / Phân tích số liệu"');

// 2) Languages: không còn Sesame
const lang = view('lang');
ok(lang, 'thiếu <main data-view="lang">');
ok(!/sesame/i.test(lang), 'tab Languages còn "Sesame"');
ok(!/sesame/i.test((html.match(/<nav class="sb-nav" data-for="lang" hidden>[\s\S]*?<\/nav>/) || [''])[0]), 'mục lục Languages còn "Sesame"');

// 3) #lang-ja: hourensou + làm chủ tiến độ
const ja = sec('lang-ja');
const jt = txt(ja);
ok(/報連相/.test(jt.ja) && /hourensou/i.test(jt.en) && /hourensou/i.test(jt.vi), '#lang-ja: thiếu khái niệm 報連相 / hourensou');
for (const [l, keys] of Object.entries({
  ja: ['報告', '連絡', '相談', '全体の進捗', '期限', '計画', '進捗を追', '節目ごと', '結果', '日本語'],
  en: ['report', 'update', 'consult', 'overall progress', 'deadline', 'plan', 'track', 'milestone', 'result', 'Japanese'],
  vi: ['báo cáo', 'liên lạc', 'xin ý kiến', 'tiến độ tổng thể', 'deadline', 'kế hoạch', 'theo dõi tiến độ', 'tiến trình', 'kết quả', 'tiếng Nhật'],
})) for (const k of keys) ok(jt[l].toLowerCase().includes(k.toLowerCase()), `#lang-ja/${l}: thiếu "${k}"`);
ok(/class="[^"]*\blg-hrs\b/.test(ja) && (ja.match(/class="lg-hr"/g) || []).length === 3, '#lang-ja: cần dải hourensou .lg-hrs gồm 3 ô .lg-hr');
ok(/class="[^"]*\blg-track\b[^"]*\blg-anim\b/.test(ja) && (ja.match(/class="lg-tk"/g) || []).length === 6, '#lang-ja: cần dòng tiến trình .lg-track (lg-anim) gồm 6 bước .lg-tk');
ok((ja.match(/class="lg-msg[^"]*"/g) || []).length === 4, '#lang-ja: hội thoại phải còn 4 bong bóng');
ok(/proactive|chủ động|主体的/.test(jt.en + jt.vi + jt.ja) && /chủ động/.test(jt.vi) && /proactive/i.test(jt.en) && /主体的/.test(jt.ja), '#lang-ja: thiếu ý "chủ động trong công việc"');

// 4) #lang-en: không còn nhãn Slide 01/02/03
const en = sec('lang-en');
ok(!/Slide\s*0\d/i.test(en), '#lang-en: còn nhãn "Slide 0x" trong animation');
ok(!/<div class="lg-sl"[^>]*>[\s\S]*?<small>/.test(en), '#lang-en: .lg-sl còn thẻ <small>');
ok((en.match(/class="lg-sl"/g) || []).length === 3, '#lang-en: sân khấu phải còn 3 khung');

// 5) #lang-bridge: cầu nối CEO và đội ngũ
const br = sec('lang-bridge');
const bt = txt(br);
ok(!/IT communicator|ITコミュニケーター/.test(br), '#lang-bridge: còn nội dung IT communicator cũ');
ok(!/仕様書|đặc tả|\bspecs?\b/i.test(strip(br)), '#lang-bridge: còn ý dịch đặc tả cũ');
for (const [l, keys] of Object.entries({
  ja: ['社長', 'チーム', '部署', '言葉の選び方', '考え方', '意図', '成果', '単なる通訳'],
  en: ['CEO', 'team', 'department', 'choice of words', 'thinking', 'intent', 'results', 'not just'],
  vi: ['CEO', 'đội ngũ', 'phòng ban', 'cách dùng từ', 'suy nghĩ', 'tư duy', 'ý nghĩa thông điệp', 'kết quả công việc', 'không chỉ chuyển ngữ'],
})) for (const k of keys) ok(bt[l].includes(k), `#lang-bridge/${l}: thiếu "${k}"`);
ok(/class="[^"]*\blg-bridge\b/.test(br) && /class="lg-node[^"]*"[^>]*>[\s\S]*?assets\/gx\/manager\.webp/.test(br), '#lang-bridge: sơ đồ phải có nút CEO (manager.webp)');
ok(/assets\/gx\/team-group\.webp/.test(br), '#lang-bridge: sơ đồ phải có nút đội ngũ (team-group.webp)');
const nav = (html.match(/<a href="#lang-bridge" data-sec="lang-bridge">[\s\S]*?<\/a>/) || [''])[0];
ok(/CEO/.test(nav) && !/3言語|three languages|3 ngôn ngữ/i.test(nav), `mục lục 03 phải đổi theo nội dung CEO: ${strip(nav)}`);

if (fails.length) { console.error(`FAIL check-lang-ila7 (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lang-ila7: tab Team không còn Claude, Languages không còn Sesame, #lang-ja hourensou + 6 bước tiến độ, #lang-en bỏ nhãn Slide, #lang-bridge cầu nối CEO và đội ngũ');
