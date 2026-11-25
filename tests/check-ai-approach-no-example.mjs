// Task zvhs: slide 02 MY WORKFLOW (#ai-approach, tab AI Skills) bỏ thẻ "Example / Ví dụ: báo cáo ngày của đội"
// (tiêu đề, chips, câu "Tôi dùng AI tổng hợp thời gian...") ở dưới chuỗi bước; giữ nguyên chuỗi bước.
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.error('FAIL ' + m); } };
const m = html.match(/<section class="pg"[^>]*id="ai-approach">([\s\S]*?)<\/section>/);
ok(m, 'không tìm thấy #ai-approach');
const s = m ? m[1] : '';
for (const t of ['<span class="lbl">Example</span>', '例：チームの日次報告', "Example: the team's daily report", 'Ví dụ: báo cáo ngày của đội',
  'báo cáo ngày</span>', 'AI tổng hợp</span>', 'xem xét nguyên nhân</span>', 'thứ tự ưu tiên</span>',
  'Tôi dùng AI tổng hợp thời gian và việc đình trệ', 'I use AI to summarise time and delays by step', 'AIで工程別の時間や停滞を集計'])
  ok(!s.includes(t), `#ai-approach: thẻ ví dụ vẫn còn (${t})`);
ok(/<div class="cyc cyc--live/.test(s), '#ai-approach: mất chuỗi bước workflow');
ok(s.includes('Tôi biến việc lặp lại thành quy trình theo các bước sau.'), '#ai-approach: mất câu dẫn trên chuỗi bước');
if (fail) { console.error(`${fail} lỗi`); process.exit(1); }
console.log('PASS check-ai-approach-no-example: #ai-approach không còn thẻ Example báo cáo ngày (3 ngôn ngữ), chuỗi bước giữ nguyên');
