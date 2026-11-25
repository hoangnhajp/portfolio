// Task 3v6v: slide đầu tab AI (#ai-top) khẳng định quan niệm AI của ứng viên theo video TrinhLTD
// "AI thay đổi luật chơi tuyển dụng 2027": giao AI việc gì (bản nháp đầu tiên của việc lặp lại cụ thể),
// con người quyết định tầng nào (kiểm chứng, phán đoán chuyên môn, bảo mật dữ liệu, trách nhiệm cuối),
// vai trò chuyển từ người làm sang người điều phối + kiểm chứng, đo hiệu quả trước / sau; thuật ngữ AI fluency, human-in-the-loop.
// Chạy: node tests/check-ai-top-principles.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const s = (html.match(/<section class="pg"[^>]*\bid="ai-top"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(s, 'không thấy section #ai-top');

// 1. Khối nguyên tắc nằm sau hàng keyword, trước phim workflow
const iKw = s.indexOf('<div class="kw1'), iP = s.indexOf('<div class="aip'), iMv = s.indexOf('<figure class="mv');
ok(iP > iKw && iKw >= 0 && iP < iMv, `#ai-top: khối .aip phải nằm giữa hàng keyword và phim workflow (kw1=${iKw}, aip=${iP}, mv=${iMv})`);
const blk = (s.match(/<div class="aip[\s\S]*?<!-- \/aip -->/) || [''])[0];
ok(blk, '#ai-top: thiếu khối .aip (kết thúc bằng <!-- /aip -->)');

// 2. Hai cột: giao AI / con người quyết định, đủ 3 ngôn ngữ, mỗi cột có mục
const col = (cls) => (blk.match(new RegExp(`<div class="aip-col ${cls}"[\\s\\S]*?</ul>(?:\\s*<ul[\\s\\S]*?</ul>){2}`)) || [''])[0];
for (const [cls, min] of [['aip-ai', 2], ['aip-hu', 4]]) {
  const c = col(cls);
  ok(c, `thiếu cột .${cls}`);
  for (const l of ['ja', 'en', 'vi']) {
    const ul = (c.match(new RegExp(`<ul data-l="${l}">([\\s\\S]*?)</ul>`)) || ['', ''])[1];
    const n = (ul.match(/<li>/g) || []).length;
    ok(n >= min, `.${cls} [${l}]: cần >= ${min} mục, đang ${n}`);
  }
}

// 3. Ý cốt lõi của video, đủ JA/EN/VI
const txt = strip(blk);
const must = {
  'AI làm bản nháp': ['下書き', 'first draft', 'bản nháp'],
  'người chịu trách nhiệm bản cuối': ['最終版', 'final version', 'bản cuối'],
  'kiểm chứng số liệu': ['数字を検証', 'Verify the figures', 'Kiểm chứng số liệu'],
  'phán đoán chuyên môn, nhìn ra AI sai': ['AIの誤りを見抜く', 'spot where AI is wrong', 'nhìn ra AI sai ở đâu'],
  'bảo mật dữ liệu': ['公開AIに入れない', 'out of public AI tools', 'không đưa lên AI công cộng'],
  'trách nhiệm cuối cùng': ['最終責任', 'Own the result', 'Chịu trách nhiệm cuối cùng'],
  'điều phối + kiểm chứng': ['指揮し', 'directing AI and verifying', 'điều phối AI và kiểm chứng'],
  'đo trước / sau': ['前後', 'before and after', 'trước và sau'],
};
for (const [k, arr] of Object.entries(must)) for (const w of arr) ok(txt.includes(w), `khối nguyên tắc thiếu ý "${k}": "${w}"`);

// 4. Thuật ngữ AI skill trong hàng keyword, đủ 3 ngôn ngữ
const kw = (s.match(/<div class="kw1[\s\S]*?<\/div>\s*<\/div>/) || [''])[0];
for (const l of ['ja', 'en', 'vi']) {
  const row = (kw.match(new RegExp(`<div class="chips" data-l="${l}">([\\s\\S]*?)</div>`)) || ['', ''])[1];
  for (const t of ['AI fluency', 'human-in-the-loop']) ok(new RegExp(`>${t}<`, 'i').test(row), `hàng keyword [${l}] thiếu "${t}"`);
}

// 5. Không tên thương hiệu AI (task 22v8), không gạch dài, có CSS + bản mobile
ok(!/ChatGPT|Claude|Gemini|Copilot|Sesame/i.test(blk), 'khối nguyên tắc nêu tên công cụ AI cụ thể');
ok(!/[—]/.test(blk), 'khối nguyên tắc có dấu gạch ngang dài');
ok(/\.aip\{[^}]*grid/.test(html), 'thiếu CSS .aip (grid 2 cột)');
ok(/@media[^{]*max-width:\s*\d+px[^{]*\{[^@]*\.aip\{[^}]*grid-template-columns:\s*1fr[;}]/.test(html), 'thiếu CSS mobile: .aip 1 cột');

if (fails.length) { console.error(`FAIL check-ai-top-principles (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-ai-top-principles: #ai-top có khối nguyên tắc AI (giao AI bản nháp / người quyết định bản cuối), JA/EN/VI, AI fluency + human-in-the-loop');
