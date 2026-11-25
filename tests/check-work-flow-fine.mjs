// Task cogy: workflow "những việc đã làm" (#projects .pjf) tinh tế hơn: đường nối mảnh (ống nền, chấm gạch, vệt sáng, cục sáng, mũi tên nhỏ),
// icon và chữ lớn hơn một chút so với bản mwuc (icon 46px / ảnh 32px / tên 12px / số 9.5px).
// Chạy: node tests/check-work-flow-fine.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(process.argv[2] || root + 'index.html', 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
// Lấy khai báo của đúng 1 selector ở cấp gốc (không nằm trong @media)
const rule = (sel) => { const m = html.match(new RegExp('\\n' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const px = (decl, prop) => { const m = decl.match(new RegExp('(?:^|;)\\s*' + prop + ':\\s*([\\d.]+)(?:px)?')); return m ? +m[1] : NaN; };

// 1. Đường nối mảnh
const tube = px(rule('.pjf-tube'), 'stroke-width'), flow = px(rule('.pjf-flow'), 'stroke-width'), lit = px(rule('.pjf-lit'), 'stroke-width');
ok(tube <= 4, `ống nền .pjf-tube phải mảnh (<= 4px), đang ${tube}`);
ok(flow <= 1.5, `nét chấm gạch .pjf-flow phải mảnh (<= 1.5px), đang ${flow}`);
ok(lit <= 2.5, `vệt sáng .pjf-lit phải mảnh (<= 2.5px), đang ${lit}`);
const orb = px(rule('.pjf-orb'), 'width');
ok(orb <= 12, `cục sáng .pjf-orb phải nhỏ (<= 12px), đang ${orb}`);
const arrow = rule('.pjf-row>li+li::before');
ok(/border-top:\s*1(\.\d+)?px/.test(arrow) && px(arrow, 'width') <= 6, 'mũi tên giữa các bước phải nhỏ, nét <= 1.5px');
ok(/height:\s*1px/.test(rule('.pjf-row::before')), 'đường nối tĩnh (không JS) phải 1px');

// 2. Icon và chữ lớn hơn
const ic = rule('.pjf-ic'), img = rule('.pjf-ic img');
ok(px(ic, 'width') >= 52 && px(ic, 'width') <= 60, `vòng icon .pjf-ic cần 52..60px (lớn hơn 46px một chút), đang ${px(ic, 'width')}`);
ok(px(img, 'width') >= 36, `ảnh icon cần >= 36px (đang ${px(img, 'width')})`);
const co = rule('.pjf-row .pj-co').match(/font:\s*700\s+([\d.]+)px/), no = rule('.pjf-no').match(/font:\s*700\s+([\d.]+)px/);
ok(co && +co[1] >= 13 && +co[1] <= 14.5, `tên bước .pj-co cần 13..14.5px, đang ${co && co[1]}`);
ok(no && +no[1] >= 10.5, `số bước .pjf-no cần >= 10.5px, đang ${no && no[1]}`);

if (fails.length) { console.error('FAIL check-work-flow-fine:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('PASS check-work-flow-fine: đường nối mảnh (ống, chấm gạch, vệt sáng, cục sáng, mũi tên), icon 52..60px và chữ tên / số lớn hơn');
