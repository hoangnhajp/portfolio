// Task s5tp: clip workflow ở slide "Cách tôi vận hành đội ngũ, qua nguyên tắc PDCA" (#team-skills) phải khớp 6 bước PDCA mới
// (task j2u3): lập kế hoạch bằng số hành động, quản lý thực hiện + phân tích báo cáo, tìm điểm nghẽn, thảo luận gỡ điểm nghẽn,
// đề xuất kaizen, thực hiện + đo lường kaizen. Kiểm: chữ trên clip (JA/EN/VI), nhãn pha P/D/C/A cho từng bước, cung lặp Act -> Plan,
// aria-label của 3 video nói đúng nội dung mới, 6 clip + poster đã dựng lại (khác bản HEAD trước task).
// Chạy: node tests/check-team-flow-pdca.mjs   (thoát 0 = đạt)
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const eng = readFileSync(join(root, 'tools/team-flow/engine.html'), 'utf8');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };

// 1) bảng chữ LABELS
const labelsSrc = eng.match(/const LABELS = ([\s\S]*?\n});/)?.[1] || '';
let LABELS = null;
try { LABELS = Function(`return (${labelsSrc})`)(); } catch (e) { ok(false, `không đọc được LABELS: ${e.message}`); }
const WANT = {
  vi: [/kế hoạch/i, /thực hiện/i, /điểm nghẽn/i, /thảo luận/i, /kaizen/i, /đo lường/i],
  en: [/plan/i, /run|track/i, /bottleneck/i, /solve|discuss/i, /kaizen/i, /measure/i],
  ja: [/計画/, /実行/, /ボトルネック/, /話し合/, /改善提案|カイゼン提案/, /測定/],
};
const OLD = /SOP|KPI|1 lên 5|1 to 5|1名から5名|Báo cáo lãnh đạo|Report up|経営への報告/;
if (LABELS) for (const l of ['ja', 'en', 'vi']) {
  const L = LABELS[l];
  ok(L && /PDCA/.test(L.title), `${l}: tiêu đề clip phải nói PDCA (đang: ${L?.title})`);
  ok(L && L.steps.length === 6, `${l}: cần đúng 6 bước`);
  if (!L) continue;
  L.steps.forEach((st, i) => ok(WANT[l][i].test(st.join(' ')), `${l}: bước ${i + 1} "${st.join(' / ')}" không khớp ý PDCA mới (${WANT[l][i]})`));
  ok(!OLD.test(JSON.stringify(L)), `${l}: còn chữ của 6 nguyên tắc cũ`);
}

// 2) pha PDCA cho từng bước + cung lặp Act -> Plan
const phase = JSON.parse(((eng.match(/const PHASE = (\[[^\]]*\])/) || [])[1] || '[]').replace(/'/g, '"'));
ok(phase.join('') === 'PDCCAA', `PHASE phải là P,D,C,C,A,A (thấy ${phase.join(',')})`);
ok(/id: 'loop'|id="loop"/.test(eng), 'engine thiếu cung lặp (id loop) nối bước 6 về bước 1');
ok(/PLAN/.test(eng) && /CHECK/.test(eng) && /\bACT\b/.test(eng), 'engine thiếu tên pha PLAN / DO / CHECK / ACT');

// 3) aria-label 3 video
const fig = html.match(/<figure class="tf-vid[^"]*"[\s\S]*?<\/figure>/)?.[0] || '';
const aria = (l) => fig.match(new RegExp(`<video[^>]*data-l="${l}"[^>]*aria-label="([^"]+)"`))?.[1] || '';
ok(/PDCA/.test(aria('ja')) && /ボトルネック/.test(aria('ja')), `aria-label ja chưa theo PDCA: ${aria('ja')}`);
ok(/PDCA/.test(aria('en')) && /bottleneck/i.test(aria('en')) && /kaizen/i.test(aria('en')), `aria-label en chưa theo PDCA: ${aria('en')}`);
ok(/PDCA/.test(aria('vi')) && /điểm nghẽn/.test(aria('vi')) && /kaizen/i.test(aria('vi')), `aria-label vi chưa theo PDCA: ${aria('vi')}`);

// 4) clip + poster đã dựng lại (sha khác bản trước task, commit 74300b7)
const sha = (b) => createHash('sha1').update(b).digest('hex');
let gitOld = {};
try {
  const { execFileSync } = await import('node:child_process');
  for (const l of ['ja', 'en', 'vi']) for (const s of ['', '-m']) for (const ext of ['webp', 'mp4']) {
    const f = `assets/workflow/team-flow-${l}${s}.${ext}`;
    gitOld[f] = sha(execFileSync('git', ['show', `74300b7:${f}`], { cwd: root, maxBuffer: 1 << 26 }));
  }
} catch (e) { ok(false, `không đọc được bản cũ bằng git: ${e.message.slice(0, 80)}`); }
for (const f of Object.keys(gitOld)) {
  const p = join(root, f);
  ok(existsSync(p) && sha(readFileSync(p)) !== gitOld[f], `${f} chưa dựng lại theo PDCA`);
}

if (fails.length) { console.error(`FAIL check-team-flow-pdca (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-team-flow-pdca: ${checks} điểm kiểm, clip 6 bước PDCA JA/EN/VI, pha P/D/C/A, cung lặp, aria-label, 12 file đã dựng lại`);
