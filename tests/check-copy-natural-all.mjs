// Văn phong tự nhiên cho TOÀN BỘ portfolio (task 9yrc lượt 2 + madb): JA gạch đầu dòng đồng nhất 「。」, alt ảnh JA không cụt bằng trợ từ,
// sidebar không trùng ý, EN / VI không văn dịch. Chạy: node tests/check-copy-natural-all.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const body = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ');

// 1. JA: mọi gạch đầu dòng kinh nghiệm (.lines data-l="ja") là câu trọn, kết thúc 「。」
const jaBul = [...body.matchAll(/<div class="lines" data-l="ja">([\s\S]*?)<\/div>/g)].flatMap((m) => [...m[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => strip(p[1])));
const noStop = jaBul.filter((s) => /[ぁ-ん]$/.test(s));
ok(jaBul.length >= 20, `chỉ thấy ${jaBul.length} gạch đầu dòng JA`);
ok(noStop.length === 0, `JA: ${noStop.length} gạch đầu dòng thiếu 「。」: ${noStop.slice(0, 3).join(' / ')}`);

// 2. JA: alt / aria-label không cụt bằng trợ từ (で / と / に / を)
const jaAttr = [...body.matchAll(/\s(alt|aria-label)="([^"]*[ぁ-んァ-ヶ一-龥][^"]*)"/g)].map((m) => m[2]);
const dangling = jaAttr.filter((s) => /(?<!とも)[でとにを]$/.test(s));
ok(dangling.length === 0, `alt JA cụt bằng trợ từ: ${dangling.join(' / ')}`);

// 3. Sidebar tab Sales: không còn 2 mục trùng ý 「発表と会議」/「報告と会議」
ok(!/>発表と会議</.test(body), 'sidebar Sales còn 「発表と会議」 trùng ý với 「報告と会議」');

// 4. EN / VI: không còn cụm văn dịch đã biết
for (const p of ['A quick look at', 'handle alone', 'worked out profit', 'passed Japanese clients']) ok(!html.includes(p), `EN còn cụm gượng "${p}"`);
const vi = [...body.matchAll(/<(\w+)\b[^>]*\bdata-l="vi"[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => strip(m[2])).join(' ');
for (const p of ['Assistant Manager phòng', 'theo tới khi', 'Review định kỳ', 'Thực hiện nghiêm']) ok(!vi.includes(p), `VI còn cụm văn dịch "${p}"`);
ok(!html.includes('—'), 'có dấu gạch ngang dài');

if (fails.length) { console.error(`FAIL check-copy-natural-all (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-copy-natural-all: ${jaBul.length} gạch đầu dòng JA đủ 「。」, ${jaAttr.length} alt/aria JA không cụt, sidebar không trùng ý, EN/VI không còn cụm văn dịch đã biết`);
