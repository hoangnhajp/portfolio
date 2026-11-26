// Nhãn giai đoạn hợp đồng trên trang Sales: [Trước khi ký hợp đồng] -> [Sau khi ký hợp đồng], sáng đoạn đang nói.
// Dùng chung cho tools/sales/after.mjs (#sales-cycle, #sales-after, #sales-jil-after) và tools/jil/build.mjs (#sales-jil-flow).
// Đặt CÙNG DÒNG với nhãn eb (dòng bắt đầu bằng <span class="eb ...>) để tools/gx/build.mjs vẫn coi là phần tiêu đề.
const L = (ja, en, vi) => [['ja', ja], ['en', en], ['vi', vi]].map(([l, t]) => `<span data-l="${l}">${t}</span>`).join('');
const SEG = {
  pre: L('契約前', 'Before the contract', 'Trước khi ký hợp đồng'),
  post: L('契約後', 'After the contract', 'Sau khi ký hợp đồng'),
};
export const phase = (p) => `<span class="sph sph--${p} rv" style="--d:40ms">`
  + `<b class="sph-s${p === 'pre' ? ' is-on" aria-current="step' : ''}"><i></i>${SEG.pre}</b><i class="sph-ar" aria-hidden="true"></i>`
  + `<b class="sph-s${p === 'post' ? ' is-on" aria-current="step' : ''}"><i></i>${SEG.post}</b></span><!--/sph-->`;
export const rePhase = /<span class="sph [\s\S]*?<!--\/sph-->/g;
export const PHASE_CSS = `.sph{display:flex;flex-wrap:wrap;align-items:center;gap:6px;width:fit-content;max-width:100%;margin:2px 0 14px;padding:4px;border-radius:999px;background:#fff;border:1px solid #ece8f3;box-shadow:0 1px 2px rgba(15,23,42,.05),0 10px 24px -18px rgba(20,57,107,.45)}
.sph-s{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:999px;font:800 11.5px/1.2 'Manrope','Noto Sans JP',sans-serif;letter-spacing:.02em;color:#8a8597;white-space:nowrap}
.sph-s>i{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.45}
.sph-s.is-on{color:#fff;background:linear-gradient(135deg,#FBA65A,#F68209);box-shadow:0 6px 14px -6px rgba(246,130,9,.85)}
.sph-s.is-on>i{opacity:1;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.35)}
[id^="sales-jil"] .sph-s.is-on{background:linear-gradient(135deg,#3ccfbe,#1FB6A6);box-shadow:0 6px 14px -6px rgba(31,182,166,.9)}
.sph-ar{position:relative;display:block;width:22px;height:2px;background:repeating-linear-gradient(90deg,#c9c3d6 0 4px,transparent 4px 7px)}
.sph-ar::after{content:'';position:absolute;right:-2px;top:-4px;border:5px solid transparent;border-left-color:#c9c3d6;border-right:0}
html.js .pg.in .sph-s.is-on>i{animation:sphPulse 1.8s ease-in-out infinite}
@keyframes sphPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.45);opacity:.7}}
@media screen and (max-width:600px){.sph{gap:4px;padding:3px;border-radius:16px}.sph-s{gap:5px;padding:4px 8px;font-size:9.8px;letter-spacing:0}.sph-s>i{width:6px;height:6px}.sph-ar{width:10px}}
@media (prefers-reduced-motion:reduce){.sph *{animation:none!important}}`;
