// Task dom5: tiến trình 6 bước #lang-ja ("Cách tôi làm chủ công việc"): đường nối KHÔNG được là 1 vạch liền đi xuyên qua
// các icon (như gạch chéo). Mỗi cặp icon kề nhau có 1 đoạn NÉT ĐỨT riêng, bắt đầu sau mép phải icon này, dừng trước mép
// trái icon kế, có đầu mũi tên chỉ hướng, các đoạn sáng lần lượt theo chiều workflow; màn hẹp: đoạn dọc nét đứt từ đáy icon tới đỉnh icon kế.
// Hình học (icon 42px, tâm cột = 50%, khe --g): đoạn i đi từ 50% + 21px + hở tới 150% + g - 21px - hở.
// Chạy: node tests/check-lang-dom5.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const css = (html.match(/<!-- lang-css:start -->([\s\S]*?)<!-- lang-css:end -->/) || [, ''])[1];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rules = (sel) => [...css.matchAll(new RegExp(`(?:^|\\n|\\}|,)\\s*${esc(sel)}(?:,[^{]*)?\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join(';');
const wide = css.split(/@media screen and \(max-width:900px\)\{/)[0];
const narrow = (css.split(/@media screen and \(max-width:900px\)\{/)[1] || '').split(/\n\}\n/)[0];
const ruleIn = (src, sel) => [...src.matchAll(new RegExp(`(?:^|\\n|\\}|,)\\s*${esc(sel)}(?:,[^{]*)?\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join(';');

ok(css, 'thiếu khối <!-- lang-css:start/end -->');
// 1) bỏ vạch liền xuyên icon
ok(!/\.lg-tks::(before|after)\{[^}]*content/.test(css), 'còn vạch liền .lg-tks::before/::after đi xuyên qua các icon');
ok(!/lgFillX/.test(css), 'còn keyframe lgFillX của vạch liền cũ');

// 2) màn rộng: đoạn nét đứt giữa từng cặp icon
const seg = ruleIn(wide, '.lg-tk:not(:last-child)::after');
ok(/content:''/.test(seg) && /position:absolute/.test(seg), 'thiếu đoạn nối .lg-tk:not(:last-child)::after');
ok(/repeating-linear-gradient\(90deg/.test(seg), 'đoạn nối ngang phải là nét đứt (repeating-linear-gradient 90deg)');
const L = seg.match(/left:calc\(50% \+ (\d+)px\)/), W = seg.match(/width:calc\(100% \+ var\(--g\) - (\d+)px\)/);
ok(L && +L[1] > 21, `đoạn nối phải bắt đầu SAU mép phải icon (left > 50% + 21px), đang ${L && L[0]}`);
ok(L && W && +W[1] === 2 * +L[1], `đoạn nối phải dừng trước mép trái icon kế, đối xứng 2 đầu (width = 100% + g - 2*hở), đang ${W && W[0]}`);
ok(/top:20px/.test(seg) && /height:2px/.test(seg), 'đoạn nối phải nằm đúng trục tâm icon (top 20px, cao 2px; icon 42px)');
const arrow = ruleIn(wide, '.lg-tk:not(:last-child)::before');
ok(/content:''/.test(arrow) && /rotate\(45deg\)/.test(arrow) && /left:calc\(150% \+ var\(--g\) - \d+px\)/.test(arrow), 'thiếu đầu mũi tên trước icon kế (::before xoay 45deg, neo theo 150% + g)');
// đoạn i sáng lần lượt theo nhịp icon nảy (lgTk 7s, trễ i*0.98s), chỉ animate opacity (luật dự án: không animate thuộc tính nặng)
ok(/html\.js \.lg-track \.lg-tk:not\(:last-child\)::after,html\.js \.lg-track \.lg-tk:not\(:last-child\)::before\{animation:lgSeg 7s linear infinite backwards;animation-delay:calc\(var\(--i,0\)\*\.98s\)\}/.test(css), 'đoạn nối + mũi tên phải sáng lần lượt khớp nhịp icon (lgSeg 7s linear backwards, trễ i*0.98s)');
const kf = (css.match(/@keyframes lgSeg\{((?:[^{}]*\{[^}]*\})*)\}/) || [, ''])[1];
const decls = [...kf.matchAll(/\{([^}]*)\}/g)].flatMap((m) => m[1].split(';').filter(Boolean));
ok(decls.length && decls.every((d) => /^opacity:[\d.]+$/.test(d.trim())), `lgSeg chỉ được animate opacity (${decls.join(' | ')})`);
// vòng đầu cũng phải sáng lần lượt: lúc chờ trễ (backwards) đoạn đang mờ, nên khung 0% phải mờ
ok(/^0%\{opacity:\.4\}/.test(kf), 'lgSeg khung 0% phải mờ (.4) để lúc chờ trễ các đoạn chưa tới lượt không sáng sẵn');

// 3) màn hẹp: đoạn dọc nét đứt, mũi tên hướng xuống, tắt đoạn ngang
const vseg = ruleIn(narrow, '.lg-tk:not(:last-child)::after');
ok(/repeating-linear-gradient\(180deg/.test(vseg) && /left:20px/.test(vseg) && /width:2px/.test(vseg), 'màn hẹp: đoạn nối dọc phải là nét đứt trên trục tâm icon (left 20px)');
ok(/top:(4[6-9]|5\d)px/.test(vseg), 'màn hẹp: đoạn dọc phải bắt đầu dưới đáy icon (top > 42px)');
const varrow = ruleIn(narrow, '.lg-tk:not(:last-child)::before');
ok(/rotate\(135deg\)/.test(varrow), 'màn hẹp: mũi tên phải chỉ xuống (rotate 135deg)');

// 4) giảm chuyển động vẫn tắt hết
ok(/\.lg-anim \*,\.lg-anim \*::before,\.lg-anim \*::after\{animation:none!important/.test(css), 'reduced-motion phải tắt animation của ::before/::after');

if (fails.length) { console.error('FAIL check-lang-dom5:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-lang-dom5: tiến trình #lang-ja nối TỪNG CẶP icon bằng nét đứt có mũi tên (không còn vạch liền xuyên icon), các đoạn sáng lần lượt khớp nhịp icon; màn hẹp nét đứt dọc từ đáy icon tới đỉnh icon kế');
