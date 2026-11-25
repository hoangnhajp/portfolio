// Task pt2m: trang 06 / 13 (#w-mycom, MAYEKAWA) giải thích bằng workflow động + icon, chữ chỉ còn 5 đến 6 câu mỗi ngôn ngữ.
// - Câu = tiêu đề h2 + câu dẫn .zz-lead của 2 thẻ (JA đếm 「。」, EN/VI đếm dấu chấm cuối câu).
// - Không còn khối chữ .lines / .kw1 trong section; 2 workflow .zz: Sales 7 bước, HR 4 bước (.zz--4).
// - Mỗi bước có icon 3D assets/gx/*.webp (file có thật), nhãn ngắn đủ JA/EN/VI; giữ dữ kiện cũ.
// Chạy: node tests/check-mycom-workflow.mjs   (HTML=<file> để kiểm file khác, ví dụ bản HEAD)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.env.HTML || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sec = (html.match(/<section[^>]*id="w-mycom"[\s\S]*?<\/section>/) || [''])[0];
ok(!!sec, 'không thấy section #w-mycom');

// 1. Số câu giải thích mỗi ngôn ngữ: 5 đến 6
const lang = (s, l) => [...s.matchAll(new RegExp(`<span data-l="${l}">([\\s\\S]*?)</span>(?=<span data-l|</h2>|</p>)`, 'g'))].map((m) => strip(m[1])).join(' ');
const h2 = (sec.match(/<h2[\s\S]*?<\/h2>/) || [''])[0];
const leads = [...sec.matchAll(/<p class="zz-lead">[\s\S]*?<\/p>/g)].map((m) => m[0]);
ok(leads.length === 2, `cần 2 câu dẫn .zz-lead (Sales, HR), đang ${leads.length}`);
const count = { ja: (t) => (t.match(/。/g) || []).length, en: (t) => (t.match(/[.!?](\s|$)/g) || []).length, vi: (t) => (t.match(/[.!?](\s|$)/g) || []).length };
for (const l of ['ja', 'en', 'vi']) {
  const t = [h2, ...leads].map((b) => lang(b, l)).join(' ');
  const n = count[l](t);
  ok(n >= 5 && n <= 6, `${l}: trang 06 có ${n} câu giải thích (cần 5 đến 6): "${t.slice(0, 80)}"`);
}

// 2. Không còn khối chữ dài
ok(!/<div class="lines"|<div class="kw1"|<ul class="b"/.test(sec), '#w-mycom còn khối chữ .lines / .kw1 / gạch đầu dòng');

// 3. 2 workflow: Sales 7 bước, HR 4 bước, bước nào cũng có icon thật + nhãn ngắn 3 ngôn ngữ
const zz = [...sec.matchAll(/<div class="(zz[^"]*)" data-zz>([\s\S]*?)<\/ol>/g)];
ok(zz.length === 2, `cần 2 workflow .zz (Sales + HR), đang ${zz.length}`);
const want = [['zz', 7], ['zz zz--4', 4]];
zz.forEach((z, k) => {
  if (!want[k]) return;
  ok(z[1] === want[k][0], `workflow ${k + 1}: class "${z[1]}" (cần "${want[k][0]}")`);
  const ns = [...z[2].matchAll(/<li class="zz-n" style="--i:(\d)"><b class="zz-d" aria-hidden="true">(\d\d)<\/b><span class="zz-t">([\s\S]*?)<\/span><\/li>/g)];
  ok(ns.length === want[k][1], `workflow ${k + 1}: cần ${want[k][1]} bước, đang ${ns.length}`);
  const icons = new Set();
  ns.forEach((n, i) => {
    ok(+n[1] === i && +n[2] === i + 1, `workflow ${k + 1} bước ${i + 1}: --i / số thứ tự lệch`);
    const ic = (n[3].match(/<img class="zz-ic" src="(assets\/gx\/[a-z-]+\.webp)" alt="" width="34" height="34"/) || [])[1];
    ok(!!ic && existsSync(root + ic), `workflow ${k + 1} bước ${i + 1}: thiếu icon assets/gx hoặc file không có (${ic})`);
    icons.add(ic);
    for (const l of ['ja', 'en', 'vi']) {
      const t = strip((n[3].match(new RegExp(`<span data-l="${l}">([^<]*)</span>`)) || ['', ''])[1]);
      ok(!!t, `workflow ${k + 1} bước ${i + 1}: thiếu nhãn ${l}`);
      // task a94u: bước 01 HR theo chữ người vận hành chốt (10 từ VI) nên trần nới lên JA 17 ký tự, EN/VI 10 từ
      if (l === 'ja') ok(t.length <= 17, `workflow ${k + 1} bước ${i + 1} JA "${t}" dài quá 17 ký tự`);
      else { const w = t.split(' ').length; ok(w >= 2 && w <= 10, `workflow ${k + 1} bước ${i + 1} ${l.toUpperCase()} "${t}": ${w} từ (cần 2 đến 10)`); }
    }
  });
  ok(icons.size === ns.length, `workflow ${k + 1}: icon bị lặp giữa các bước`);
});

// 4. Giữ dữ kiện cũ
for (const s of ['クレーム', 'complaint', 'khiếu nại', '提案書', 'ASEAN', 'ChatGPT', '未経験', 'no experience', 'chưa có kinh nghiệm', 'Horenso'])
  ok(sec.includes(s), `#w-mycom mất dữ kiện "${s}"`);

// 5. CSS icon + workflow 4 bước có trong khối zz-css, có reduced-motion
const css = (html.match(/<!-- zz-css:start -->([\s\S]*?)<!-- zz-css:end -->/) || ['', ''])[1];
for (const k of ['.zz-ic{', '.zz-n.on .zz-ic', '.zz--4 .zz-list', '.zz-lead{']) ok(css.includes(k), `CSS thiếu ${k}`);
ok(/prefers-reduced-motion:reduce\)\{\.zz-ic/.test(css), 'CSS icon thiếu reduced-motion');
ok(!sec.includes('—'), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-mycom-workflow (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-mycom-workflow: #w-mycom còn 5 đến 6 câu mỗi ngôn ngữ, 2 workflow động (Sales 7 bước, HR 4 bước) có icon 3D thật, nhãn ngắn JA/EN/VI, giữ dữ kiện');
