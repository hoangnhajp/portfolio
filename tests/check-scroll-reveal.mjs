// Task zcd9: kiểm tĩnh khối "kéo tới đâu hiện ra tới đó" (sr-css + sr-js) trong index.html.
// Chạy: node tests/check-scroll-reveal.mjs   (thoát 0 = đạt). Hành vi thật: tests/browser-scroll-reveal.mjs (cần Chrome).
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const block = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); return i >= 0 && j > i ? html.slice(i, j) : ''; };

const css = block('<!-- sr-css:start -->', '<!-- sr-css:end -->');
const js = block('<!-- sr:start -->', '<!-- sr:end -->');
ok(css, 'thiếu khối <!-- sr-css:start/end -->');
ok(js, 'thiếu khối <!-- sr:start/end -->');
ok(html.split('<!-- sr-css:start -->').length === 2 && html.split('<!-- sr:start -->').length === 2, 'khối sr bị nhân đôi');
ok(html.indexOf('<!-- sr-css:end -->') < html.indexOf('</head>'), 'sr-css phải nằm trong <head>');
// Ẩn chỉ khi JS đã gắn .sr lên <html> (tắt JS thì không mất chữ)
ok(/html\.sr \.pg \.rv:not\(\.sr-in\)\{[^}]*opacity:0/.test(css), '.rv phải giữ ẩn tới khi chính nó có .sr-in');
ok(/html\.sr \.pg>\.sr\{[^}]*opacity:0/.test(css) && /html\.sr \.pg>\.sr\.sr-in\{[^}]*opacity:1/.test(css), 'khối .sr phải ẩn rồi hiện bằng .sr-in');
ok([...css.matchAll(/transition:([^;}]*)/g)].every((m) => m[1] === 'none!important' || /^opacity[^,]*,transform[^,]*$/.test(m[1].replace(/\([^)]*\)/g, ''))), 'chỉ chuyển động opacity/transform');
ok(/@media print\{[^}]*html\.sr/.test(css), 'in A4 phải hiện đủ');
ok(/@media \(prefers-reduced-motion:reduce\)\{[^}]*html\.sr/.test(css), 'reduced-motion phải hiện đủ');
// JS: IntersectionObserver từng khối, hiện một lần, van an toàn, chạm đáy hiện nốt, beforeprint
ok(/new IntersectionObserver/.test(js) && /io\.unobserve\(e\)/.test(js), 'phải theo dõi từng khối và thôi theo dõi khi đã hiện');
ok(/rootMargin:'0px 0px -10% 0px'/.test(js), 'mép đáy -10% như trang mẫu');
ok(/prefers-reduced-motion: reduce/.test(js) && /matchMedia\('print'\)/.test(js), 'reduced-motion / in thì không bật hiệu ứng');
ok(/setTimeout\(function\(\)\{if\(!got\)\{root\.classList\.remove\('sr'\)/.test(js), 'thiếu van an toàn bỏ .sr');
ok(/beforeprint/.test(js), 'thiếu beforeprint');
ok(/root\.classList\.add\('sr'\)/.test(js) && js.indexOf("root.classList.add('sr')") > js.indexOf('items.push'), 'chỉ gắn .sr sau khi đã đánh dấu khối');

if (fails.length) { console.error(`FAIL check-scroll-reveal (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-scroll-reveal: khối sr-css + sr-js đủ (ẩn theo .sr, hiện từng khối khi cuộn tới, van an toàn, in / reduced-motion hiện đủ)');
