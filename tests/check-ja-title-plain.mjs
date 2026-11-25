// Câu dẫn dạng tiêu đề (p.kw-sub, p.zz-lead) bản JA dùng thể ngắn liệt kê (体言止め / 常体),
// không dùng thể masu (です、ます、ました、でした、ません) như đang kể lể.
// Áp cho index.html và nguồn sinh tab (tools/ap, tools/jd) để build lại không đưa thể masu quay về.
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', ROOT), 'utf8');
const strip = (s) => s.replace(/<sup class="ap-c">[^<]*<\/sup>/g, '').replace(/<[^>]+>/g, '').trim();
const MASU = /(です|でした|ます|ました|ません|ましょう)/;
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const subs = [];
for (const m of html.matchAll(/<p class="(kw-sub|zz-lead)[^"]*"([^>]*)>([\s\S]*?)<\/p>/g)) {
  let ja = null;
  if (/data-l="ja"/.test(m[2])) ja = m[3];
  else { const s = m[3].match(/<span data-l="ja">([\s\S]*?)<\/span>/); ja = s && s[1]; }
  if (ja != null) subs.push([m[1], strip(ja)]);
}
ok(subs.length >= 30, `chỉ thấy ${subs.length} câu dẫn JA (kw-sub / zz-lead)`);
for (const [cls, s] of subs) ok(!MASU.test(s), `${cls} JA còn thể masu: "${s.slice(0, 50)}"`);

// Câu dẫn ở ảnh người vận hành gửi (Projects / Portfolio)
ok(html.includes('業務の流れで見る、これまでの仕事。'), '#projects chưa đổi câu dẫn sang thể ngắn');

// Nguồn sinh tab: tham số sub của head() (tools/ap) và p.kw-sub viết tay (tools/jd)
const dir = new URL('tools/ap/', ROOT);
for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs'))) {
  const src = readFileSync(new URL(f, dir), 'utf8');
  for (const m of src.matchAll(/\$\{head\([\s\S]*?\n\s*'[^'\n]*',\s*\n\s*T\('([^']*)'/g)) ok(!MASU.test(m[1]), `tools/ap/${f}: sub JA còn thể masu: "${m[1].slice(0, 50)}"`);
}
const jd = readFileSync(new URL('tools/jd/build.mjs', ROOT), 'utf8');
for (const m of jd.matchAll(/<p class="kw-sub[^"]*"[^>]*data-l="ja">([^<]*)<\/p>/g)) ok(!MASU.test(m[1]), `tools/jd/build.mjs: kw-sub JA còn thể masu: "${m[1].slice(0, 50)}"`);

if (fails.length) { console.error(`FAIL check-ja-title-plain (${fails.length})`); for (const f of fails) console.error(' - ' + f); process.exit(1); }
console.log(`OK check-ja-title-plain: ${subs.length} câu dẫn JA đều thể ngắn`);
