// Phim "từng bước" (step film): nhân vật salaryman 3D + đạo cụ icon bật theo từng bước, chữ bước, thanh bước có
// người chạy, thanh tiến trình. Cùng kiểu với phim Sales cycle (#sales-cycle) nhưng là bộ sinh dùng lại được cho
// bất kỳ section nào: khai báo phim trong tools/film/films.mjs rồi chạy lại.
// Chạy: node tools/film/step-film.mjs [films.mjs] [index.html]   (chạy lại không nhân đôi: thay nội dung giữa các dấu sfilm)
// Dùng như module: import { figure, css } from './step-film.mjs' (vd skill slide-step-film xuất slide HTML độc lập).
// Luật: chỉ animate transform / opacity, chạy khi trang đã hiện (html.js .pg.in), 1 biến chu kỳ --sf-t cho cả phim,
// trạng thái mặc định = khung tĩnh bước 1 đầy đủ (reduced-motion, tắt JS), nút dừng / .is-off dùng chung của .mv.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const r = (x) => (Math.round(Math.min(x, 100) * 100) / 100).toString();
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = (t, tag, cls = '') => typeof t === 'string' ? `<${tag}${cls ? ` class="${cls}"` : ''}>${esc(t)}</${tag}>`
  : ['ja', 'en', 'vi'].map((l) => `<${tag}${cls ? ` class="${cls}"` : ''} data-l="${l}">${esc(t[l])}</${tag}>`).join('');
const img = (src, w) => `<img src="${src}" alt="" width="${w}" height="${w}" loading="lazy" decoding="async">`;

// Đạo cụ: [hiệu ứng, icon | 'ring' | 'lines' | 'bar', x%, y%, cỡ px, trễ s]. Icon không có '/' => <film.iconDir || assets/gx>/<icon>.webp
const FX = ['Blink', 'Speed', 'Hand', 'Pop', 'Ring', 'Bubble', 'Fly', 'Drop', 'Tick', 'Spin', 'Glow', 'Slide', 'Shake', 'Nudge', 'Fade', 'Wobble', 'Burst', 'Badge'];
function prop([fx, ic, x, y, w, d], dir = 'assets/gx') {
  if (!FX.includes(fx)) throw new Error('hiệu ứng lạ: ' + fx);
  const st = `left:${x}%;top:${y}%` + (w ? `;width:${w}px;height:${w}px` : '') + (d ? `;animation-delay:${d}s` : '');
  let inner = '', k = '';
  if (ic === 'ring') k = ' sf-ring';
  else if (ic === 'bar') { k = ' sf-bar'; inner = '<b class="sfFill"></b>'; }
  else if (ic === 'lines') { k = ' sf-lines'; inner = '<b></b><b></b><b></b>'; }
  else inner = img(ic.includes('/') ? ic : `${dir}/${ic}.webp`, w);
  return `<i class="sf-p sf${fx}${k}" style="${st}">${inner}</i>`;
}

export function figure(f) {
  const n = f.steps.length, s = (i) => ` sf-s${i}`;
  const scenes = f.steps.map((st, i) => `<span class="sf-sc${s(i)}">${img(st.img, 400)}</span>`).join('');
  const fxs = f.steps.map((st, i) => `<span class="sf-fx${s(i)}" aria-hidden="true">${(st.fx || []).map((q) => prop(q, f.iconDir)).join('')}</span>`).join('');
  const texts = f.steps.map((st, i) => `<div class="sf-tx${s(i)}"><em class="sf-no">STEP ${String(i + 1).padStart(2, '0')}</em>${L(st.t, 'b', 'sf-tt')}${L(st.d, 'p', 'sf-ds')}</div>`).join('');
  const nodes = f.steps.map((st, i) => `<li class="sf-nd${s(i)}${i === n - 1 ? ' sf-last' : ''}"><span class="sf-dt">${img(st.img, 40)}<i class="sf-lit"></i></span><b>${String(i + 1).padStart(2, '0')}</b></li>`).join('');
  const pp = '<button class="mv-pp" type="button" aria-pressed="false"><i aria-hidden="true"></i><span class="mv-sr" data-l="ja">一時停止</span><span class="mv-sr" data-l="en">Pause animation</span><span class="mv-sr" data-l="vi">Tạm dừng hình động</span></button>';
  return `<figure class="mv sf sf--n${n} sf--${f.key} rv" style="--d:150ms;--sf-n:${n};--sf-t:${n * f.slot}s;--sf-s:${f.slot}s" data-no-zoom data-sf="${f.key}">\n`
    + `    <figcaption class="mv-head"><span class="mv-rec"></span><span class="mv-kick">${esc(f.kick)}</span>${L(f.title, 'span', 'mv-tt')}<span class="mv-time" aria-hidden="true">${n * f.slot}s</span>${pp}</figcaption>\n`
    + `    <div class="sf-stage"><div class="sf-scn">${scenes}${fxs}</div><div class="sf-txs">${texts}</div></div>\n`
    + `    <ol class="sf-trk">${nodes}<li class="sf-run" aria-hidden="true"><span class="sf-me">${img(f.runner, 28)}</span></li></ol>\n`
    + `    <div class="mv-bar" aria-hidden="true"><span></span></div>\n  </figure>`;
}

// Keyframes theo số bước N (khe = 100/N % chu kỳ): cảnh / chữ / đạo cụ hiện trong khe, icon bước sáng, người chạy nhảy ô.
export function frames(n) {
  const SL = 100 / n, out = [], an = [];
  for (let i = 0; i < n; i++) {
    const a = i * SL, b = a + SL - 1.6, z = (v) => i ? `0%,${r(a)}%{${v}}` : `0%{${v}}`;
    out.push(`@keyframes sfN${n}S${i}{${z('opacity:0;transform:translateY(10px) scale(.94)')}${r(a + 1.6)}%,${r(b)}%{opacity:1;transform:none}${r(b + 1.4)}%,100%{opacity:0;transform:translateY(-6px) scale(1.02)}}`);
    out.push(`@keyframes sfN${n}L${i}{${z('opacity:0;transform:scale(.7)')}${r(a + 1.2)}%{opacity:1;transform:scale(1.15)}${r(a + 2.4)}%,${r(b + .8)}%{opacity:1;transform:none}${r(b + 2.2)}%,100%{opacity:0;transform:none}}`);
    out.push(`@keyframes sfN${n}D${i}{${z('opacity:.45')}${r(a + 1.2)}%,97%{opacity:1}100%{opacity:.45}}`);
    const P = `html.js .pg.in .sf--n${n}`;
    an.push(`${P} .sf-sc.sf-s${i},${P} .sf-tx.sf-s${i},${P} .sf-fx.sf-s${i}{animation:sfN${n}S${i} var(--sf-t) var(--mv-p) infinite}`
      + `${P} .sf-nd.sf-s${i} .sf-lit{animation:sfN${n}L${i} var(--sf-t) var(--mv-p) infinite}`
      + `${P} .sf-nd.sf-s${i}{animation:sfN${n}D${i} var(--sf-t) linear infinite}`);
  }
  const me = Array.from({ length: n }, (_, i) => `${r(i * SL + (i ? 1.6 : 0))}%,${r(i * SL + SL - (i === n - 1 ? 1.2 : .6))}%{transform:translateX(${r(i * 100 / n)}%);opacity:1}`).join('');
  out.push(`@keyframes sfN${n}Me{${me}99%{transform:translateX(${r((n - 1) * 100 / n)}%);opacity:0}100%{transform:translateX(0);opacity:0}}`);
  an.push(`html.js .pg.in .sf--n${n} .sf-run{animation:sfN${n}Me var(--sf-t) var(--mv-p) infinite}`);
  return { kf: out.join('\n'), an: an.join('\n') };
}

export const BASE = `/* Phim tung buoc .sf (tools/film/step-film.mjs): canh nhan vat + dao cu theo khe, chu buoc, thanh buoc co nguoi chay.
   --sf-n so buoc, --sf-t chu ky, --sf-s 1 khe. Chi transform / opacity; mac dinh = khung tinh buoc 1. */
.sf-stage{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr);gap:16px;align-items:center;padding:12px 18px 0}
.sf-scn{position:relative;display:grid;aspect-ratio:1;max-width:250px;width:100%;justify-self:center;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fff 0,#eaf4ff 62%,#cfe6ff 100%);box-shadow:0 0 0 6px rgba(143,216,255,.14),0 18px 40px -18px rgba(38,179,244,.8)}
.sf-sc{grid-area:1/1;display:block;padding:8%;opacity:0}
.sf-sc img{display:block;width:100%;height:100%;object-fit:contain}
.sf-txs{display:grid;min-width:0}
.sf-tx{grid-area:1/1;align-self:center;opacity:0;min-width:0}
.sf .sf-s0{opacity:1}
.sf-no{display:inline-block;padding:3px 9px;border-radius:999px;font:700 10.5px/1.2 'Space Grotesk',sans-serif;font-style:normal;letter-spacing:.08em;color:#08152b;background:#FBA65A}
.sf-tt{display:block;margin:8px 0 6px;font:800 19px/1.3 'Manrope','Noto Sans JP',sans-serif;color:#fff}
.sf-ds{margin:0;font-size:13.5px;line-height:1.65;color:rgba(255,255,255,.86)}
.sf-trk{list-style:none;display:grid;grid-template-columns:repeat(var(--sf-n),minmax(0,1fr));margin:44px 10px 0;position:relative;padding:0}
.sf-nd{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px}
.sf-dt{position:relative;display:block;width:42px;height:42px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(255,255,255,.3)}
.sf-dt img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}
.sf-lit{position:absolute;inset:-4px;border-radius:50%;border:2px solid #FBA65A;box-shadow:0 0 14px 3px rgba(246,130,9,.65);opacity:0}
.sf-nd b{font:700 10.5px/1 'Space Grotesk',sans-serif;color:rgba(255,255,255,.75)}
/* duong noi: net dut tung cap icon, tu mep icon + 6px toi mep icon ke - 6px (icon 42px), khong xuyen qua icon */
.sf-nd:not(.sf-last)::after{content:"";position:absolute;top:20px;left:calc(50% + 27px);width:calc(100% - 54px);height:2px;background:repeating-linear-gradient(90deg,rgba(143,216,255,.7) 0 5px,transparent 5px 9px)}
.sf-nd:not(.sf-last)::before{content:"";position:absolute;top:16px;left:calc(150% - 33px);border:5px solid transparent;border-left:6px solid rgba(143,216,255,.8);border-right:0}
.sf-run{position:absolute;left:0;right:0;top:0;height:0;pointer-events:none}
.sf-me{position:absolute;left:calc(50% / var(--sf-n));top:-34px;width:28px;height:28px;translate:-50% 0;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #FBA65A,0 6px 14px -4px rgba(246,130,9,.8)}
.sf-me img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 12%}
.sf .mv-bar{margin-top:12px}
.sf-fx{grid-area:1/1;position:relative;display:block;opacity:0;pointer-events:none}
.sf-p{position:absolute;display:block;translate:-50% -50%;animation-fill-mode:backwards!important}
.sf-p img{display:block;width:100%;height:100%;filter:drop-shadow(0 4px 6px rgba(11,29,58,.25))}
.sf-ring{border-radius:50%;border:2px solid #F68209}
.sf-lines{display:grid;gap:4px;align-content:center}.sf-lines b{display:block;height:3px;border-radius:3px;background:rgba(38,179,244,.75)}.sf-lines b:nth-child(2){margin-left:8px}
.sf-bar{width:48%;height:7px;border-radius:7px;background:rgba(11,29,58,.14);overflow:hidden}
.sf-bar b{display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,#26B3F4,#F68209);transform-origin:0 50%}
html.js .pg.in .sf .mv-bar span{animation:mvBar var(--sf-t) linear infinite}
html.js .pg.in .sf .sf-sc img{animation:sfBob var(--sf-s) ease-in-out infinite}
html.js .pg.in .sf .sfBlink{animation:sfBlink calc(var(--sf-s) / 2) ease-in-out infinite}
html.js .pg.in .sf .sfSpeed{animation:sfSpeed calc(var(--sf-s) / 4) linear infinite}
html.js .pg.in .sf .sfHand{animation:sfHand var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfPop{animation:sfPop var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfRing{animation:sfRing 1.4s ease-out infinite}
html.js .pg.in .sf .sfBubble{animation:sfBubble var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfFly{animation:sfFly var(--sf-s) ease-in infinite}
html.js .pg.in .sf .sfDrop{animation:sfDrop var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfTick{animation:sfTick var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfSpin{animation:sfSpin var(--sf-s) linear infinite}
html.js .pg.in .sf .sfGlow{animation:sfGlow calc(var(--sf-s) / 2) ease-in-out infinite}
html.js .pg.in .sf .sfSlide{animation:sfSlide var(--sf-s) var(--mv-p) infinite}
html.js .pg.in .sf .sfShake{animation:sfShake var(--sf-s) ease-in-out infinite}
html.js .pg.in .sf .sfNudge{animation:sfNudge calc(var(--sf-s) / 2) ease-in-out infinite}
html.js .pg.in .sf .sfFade{animation:sfFade var(--sf-s) linear infinite}
html.js .pg.in .sf .sfFill{animation:sfFill var(--sf-s) ease-in-out infinite}
html.js .pg.in .sf .sfWobble{animation:sfWobble 1s ease-in-out infinite}
html.js .pg.in .sf .sfBurst{animation:sfBurst calc(var(--sf-s) / 2) ease-out infinite}
html.js .pg.in .sf .sfBadge{animation:sfBadge var(--sf-s) var(--mv-p) infinite}
@keyframes sfBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes sfBlink{0%,100%{opacity:.25;transform:scale(.9)}50%{opacity:1;transform:scale(1.08)}}
@keyframes sfSpeed{0%{opacity:0;transform:translateX(-10px)}30%{opacity:1}100%{opacity:0;transform:translateX(14px)}}
@keyframes sfHand{0%,4%{opacity:0;transform:translateX(-26px)}26%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes sfPop{0%,8%{opacity:0;transform:scale(.3)}18%{opacity:1;transform:scale(1.15)}24%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes sfRing{0%{opacity:.9;transform:scale(.5)}100%{opacity:0;transform:scale(1.7)}}
@keyframes sfBubble{0%,6%{opacity:0;transform:translateY(10px) scale(.4)}16%{opacity:1;transform:scale(1.15)}22%,70%{opacity:1;transform:translateY(0)}84%{opacity:1;transform:translateY(-6px)}100%{opacity:0;transform:translateY(-10px)}}
@keyframes sfFly{0%,10%{opacity:0;transform:translate(-30px,20px) scale(.6)}25%{opacity:1;transform:translate(-14px,8px) scale(1)}75%{opacity:1;transform:translate(14px,-12px)}100%{opacity:0;transform:translate(26px,-22px) scale(.8)}}
@keyframes sfDrop{0%{opacity:0;transform:translateY(-34px)}18%{opacity:1;transform:translateY(4px)}26%{transform:translateY(-3px)}32%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes sfTick{0%,10%{opacity:0;transform:scale(.4) rotate(-14deg)}22%{opacity:1;transform:scale(1.15) rotate(6deg)}30%,88%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes sfSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@keyframes sfGlow{0%,100%{opacity:.75;transform:scale(.94)}50%{opacity:1;transform:scale(1.12)}}
@keyframes sfSlide{0%,6%{opacity:0;transform:translateX(-30px)}24%,86%{opacity:1;transform:none}100%{opacity:0;transform:translateX(10px)}}
@keyframes sfShake{0%,30%,100%{transform:none}38%{transform:scale(1.12) rotate(-8deg)}46%{transform:scale(1.12) rotate(8deg)}54%{transform:scale(1.08) rotate(-5deg)}62%{transform:none}}
@keyframes sfNudge{0%,100%{transform:translateX(-4px)}50%{transform:translateX(5px)}}
@keyframes sfFade{0%,4%{opacity:0}12%,92%{opacity:1}100%{opacity:0}}
@keyframes sfFill{0%,10%{transform:scaleX(0)}80%,100%{transform:scaleX(1)}}
@keyframes sfWobble{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes sfBurst{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(2)}}
@keyframes sfBadge{0%,10%{opacity:0;transform:scale(.2)}22%{opacity:1;transform:scale(1.25)}30%,90%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@media screen and (max-width:700px){
  .sf-fx{scale:.82}
  .sf-stage{grid-template-columns:1fr;padding:10px 12px 0;text-align:center}.sf-scn{max-width:200px}.sf-tt{font-size:16px}
  .sf-trk{margin:40px 2px 0}.sf-dt{width:34px;height:34px}.sf-lit{inset:-3px}
  .sf-nd:not(.sf-last)::after{top:16px;left:calc(50% + 23px);width:calc(100% - 46px)}.sf-nd:not(.sf-last)::before{display:none}
}
@media screen and (max-width:420px){.sf-nd:not(.sf-last)::after{display:none}}
@media (prefers-reduced-motion:reduce){.sf *{animation:none!important}}`;

// CSS đủ cho mọi phim trong danh sách (keyframes sinh theo từng số bước có mặt)
export function css(films) {
  const parts = [...new Set(films.map((f) => f.steps.length))].sort((a, b) => a - b).map(frames);
  return `${BASE}\n${parts.map((p) => p.an).join('\n')}\n${parts.map((p) => p.kf).join('\n')}`;
}

// ── Chèn vào index.html (chỉ khi chạy trực tiếp) ──
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const { FILMS } = await import(pathToFileURL(resolve(process.argv[2] || here('./films.mjs'))).href);
const file = process.argv[3] || process.env.SF_FILE || here('../../index.html');
let html = readFileSync(file, 'utf8');
const EOL = html.includes('\r\n') ? '\r\n' : '\n';
const fix = (t) => t.replace(/\r?\n/g, EOL);
const CSS = `<!-- sfilm-css:start -->\n<style id="sfilm-css">\n${css(FILMS)}\n</style>\n<!-- sfilm-css:end -->\n`;
const cssRe = /<!-- sfilm-css:start -->[\s\S]*?<!-- sfilm-css:end -->\r?\n/;
if (cssRe.test(html)) html = html.replace(cssRe, () => fix(CSS));
else {
  const at = html.indexOf('</head>');
  if (at < 0) throw new Error('không thấy </head>');
  html = html.slice(0, at) + fix(CSS) + html.slice(at);
}
for (const f of FILMS) {
  if (!/^[a-z0-9-]+$/.test(f.key)) throw new Error('key phim chỉ gồm a-z 0-9 -: ' + f.key);
  const block = `  <!-- sfilm:${f.key}:start -->\n  ${figure(f)}\n  <!-- sfilm:${f.key}:end -->\n`;
  const re = new RegExp(`[ \\t]*<!-- sfilm:${f.key}:start -->[\\s\\S]*?<!-- sfilm:${f.key}:end -->\\r?\\n`);
  if (re.test(html)) { html = html.replace(re, () => fix(block)); continue; }
  const sec = html.indexOf(`id="${f.section}">`);
  if (sec < 0) throw new Error('không thấy section ' + f.section);
  const end = html.indexOf('</section>', sec);
  const at = html.indexOf(f.before, sec);
  if (at < 0 || at > end) throw new Error(`không thấy "${f.before}" trong #${f.section}`);
  const ls = html.lastIndexOf('\n', at) + 1; // chèn trước cả dòng chứa mốc
  html = html.slice(0, ls) + fix(block) + html.slice(ls);
}
writeFileSync(file, html);
console.log('sfilm:', FILMS.map((f) => `#${f.section} ${f.steps.length} bước ${f.steps.length * f.slot}s`).join(', '));
}
