// Tab "Task: Team Management" + "Task: AI Skills" (task cg5a): menu riêng, đủ JA/EN/VI, dữ kiện đúng hồ sơ gốc.
// Chạy: node tests/check-team-ai-tabs.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const JP = /[぀-ヿ一-龯]/;
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
// Bỏ các khối data-l của ngôn ngữ khác (khối data-l không lồng cùng thẻ bên trong)
const only = (s, l) => s.replace(/<(\w+)\b[^>]*\bdata-l="(ja|en|vi)"[^>]*>[\s\S]*?<\/\1>/g, (m, t, x) => (x === l ? m : ' '));

const TABS = {
  team: { top: 'team-top', secs: ['team-top', 'team-records', 'team-skills', 'team-daily'],
    facts: { ja: ['5～6名', '約27名', '2～3名', '1人', '5名', 'KPI', 'コーチ'], en: ['5 to 6', 'about 27', '2 to 3', 'five', 'KPI', 'coach'],
      vi: ['5 đến 6', 'khoảng 27', '2 đến 3', '5 người', 'KPI', 'kèm cặp'] } },
  ai: { top: 'ai-top', secs: ['ai-top', 'ai-pyramid', 'ai-approach', 'ai-uses', 'ai-people', 'ai-tools'], // task edof: thêm 01 kim tự tháp; task a9f4: thêm 05 #ai-tools
    facts: { ja: ['生成AI', 'AIエージェント', 'AI会話', // task 22v8: không nêu tên công cụ AI
      '80～90%', '3～4', '繰り返し', '人が確認', '設計と開発を主導'],
      en: ['generative AI', 'AI agents', 'AI conversation app', '80 to 90%', '3 to 4', 'repetitive', 'checks', 'led the design and development'],
      vi: ['AI tạo sinh', 'AI agent', 'hội thoại AI', '80 đến 90%', '3 đến 4', 'lặp lại', 'kiểm tra', 'chủ trì thiết kế'] } },
};

const topNav = (html.match(/<nav class="top-nav"[^>]*>([\s\S]*?)<\/nav>/) || [])[1] || '';
for (const [v, t] of Object.entries(TABS)) {
  ok(new RegExp(`<a href="#${t.top}" data-view="${v}">`).test(topNav), `top-nav thiếu link tab "${v}" (#${t.top})`);
  const main = (html.match(new RegExp(`<main class="wrap" data-view="${v}" hidden>([\\s\\S]*?)</main>`)) || [])[1] || '';
  ok(main, `thiếu <main data-view="${v}" hidden>`);
  if (!main) continue;
  const ids = [...main.matchAll(/<section class="pg"[^>]*\bid="([\w-]+)"/g)].map((m) => m[1]);
  ok(ids.join(',') === t.secs.join(','), `${v}: thứ tự trang sai: ${ids.join(',')}`);
  const nav = (html.match(new RegExp(`<nav class="sb-nav" data-for="${v}" hidden>([\\s\\S]*?)</nav>`)) || [])[1] || '';
  const nums = [...nav.matchAll(/data-sec="([\w-]+)"><em>(\w+)<\/em>/g)].map((m) => `${m[1]}:${m[2]}`).join(' ');
  ok(nums === t.secs.map((s, i) => `${s}:${i ? String(i).padStart(2, '0') : 'TOP'}`).join(' '), `${v}: mục lục sai: ${nums}`);
  for (const l of ['ja', 'en', 'vi']) ok((nav.match(new RegExp(`data-l="${l}"`, 'g')) || []).length === t.secs.length, `${v}: mục lục thiếu nhãn ${l}`);
  // Đủ 3 ngôn ngữ, EN/VI không sót chữ Nhật, JA có chữ Nhật
  const cnt = (l) => (main.match(new RegExp(`data-l="${l}"`, 'g')) || []).length;
  ok(cnt('ja') >= 30 && cnt('ja') === cnt('en') && cnt('en') === cnt('vi'), `${v}: số khối data-l lệch ja/en/vi ${cnt('ja')}/${cnt('en')}/${cnt('vi')}`);
  const txt = { ja: strip(only(main, 'ja')), en: strip(only(main, 'en')), vi: strip(only(main, 'vi')) };
  for (const l of ['en', 'vi']) { const m = txt[l].match(new RegExp(`.{0,20}${JP.source}.{0,20}`)); ok(!m, `${v}/${l}: còn chữ Nhật "${m && m[0]}"`); }
  for (const [l, keys] of Object.entries(t.facts)) for (const k of keys) ok(txt[l].includes(k), `${v}/${l}: thiếu dữ kiện "${k}"`);
  // Giọng ứng viên: kể ở ngôi thứ nhất
  ok((txt.en.match(/\bI\b/g) || []).length >= 8, `${v}/en: ít câu ngôi thứ nhất "I"`);
  ok((txt.vi.match(/(^|\s)[Tt]ôi\s/g) || []).length >= 8, `${v}/vi: ít câu có chủ ngữ "tôi"`);
  ok((txt.ja.match(/(ました|ます|でした|です)。/g) || []).length >= 8, `${v}/ja: ít câu です・ます`);
  // Luật hồ sơ gốc: không tên công ty ở tab tổng hợp kỹ năng, không Copilot, không "built alone", không gọi người đọc là "bạn", không gạch dài
  for (const bad of ['MAYEKAWA', 'MYCOM', 'JILNESTA', 'Isuzu', 'Copilot', 'built alone', '一人で開発', '—'])
    ok(!main.includes(bad), `${v}: còn "${bad}"`);
  ok(!/(^|[\s,.(])bạn(?! bè)([\s,.!?)]|$)/i.test(txt.vi), `${v}/vi: còn gọi người đọc là "bạn"`);
}
// Nút ngôn ngữ, PDF: tab mới không đổi luật router (main nào không phải profile thì ẩn link PDF)
ok((html.match(/<main class="wrap" data-view=/g) || []).length === 6, 'số view khác 6 (profile, sales, hr, team, ai, lang; tab Languages task a9f4 kiểm ở check-lang-tab.mjs, tab HR task 4ubf ở check-hr-tab.mjs)');

if (fails.length) { console.error(`FAIL check-team-ai-tabs (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-team-ai-tabs: 2 tab mới (team, ai) có link top-nav, mục lục TOP..03 x3 ngôn ngữ, đủ JA/EN/VI, EN/VI không sót chữ Nhật, đủ dữ kiện hồ sơ gốc, giọng ứng viên');
