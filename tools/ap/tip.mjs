// Tooltip dẫn chứng cho mọi số liệu / thông tin có số trích dẫn [n] trên tab Andpad Info.
// Rê chuột (hoặc Tab tới số [n], hoặc chạm số [n] trên điện thoại) => hộp nổi: tên nguồn (theo ngôn ngữ đang xem),
// đoạn NGUYÊN VĂN chép từ trang nguồn (tools/ap/quotes.mjs, ngôn ngữ gốc) và link mở trang gốc.
// Markup trích dẫn giữ nguyên `<sup class="ap-c">[n]</sup>`: script dò [n] -> li#<trang>-r<n> -> href -> đoạn trích.
// Dữ liệu trích ghi ra assets/ap/quotes.js (window.AP_Q, theo URL) để index.html không chứa chữ của nguồn.
// build.mjs gọi; kiểm tra: node tests/check-ap-quotes.mjs, node tests/browser-ap-quotes.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REFS } from './refs.mjs';
import { QUOTES } from './quotes.mjs';

const T = (ja, en, vi) => ({ ja, en, vi });
const LAB = { q: T('原文（出典ページより引用）', 'Original text (quoted from the source page)', 'Nguyên văn (trích từ trang nguồn)') };

export const QUOTES_JS = fileURLToPath(new URL('../../assets/ap/quotes.js', import.meta.url));
// Nội dung assets/ap/quotes.js: { url: [đoạn trích...] } (chỉ nguồn có trong REFS)
export function quotesJs() {
  const byUrl = {};
  for (const [k, qs] of Object.entries(QUOTES)) if (REFS[k]) byUrl[REFS[k][0]] = qs;
  return `/* Sinh bằng node tools/ap/build.mjs từ tools/ap/quotes.mjs; không sửa tay. Đoạn trích nguyên văn của từng nguồn tab Andpad Info. */\nwindow.AP_Q=${JSON.stringify(byUrl)};\n`;
}
export const writeQuotesJs = () => writeFileSync(QUOTES_JS, quotesJs());

const lab = JSON.stringify(LAB);
export const tipBlock = () => `<style>
.ap-tip{position:absolute;z-index:9000;max-width:min(400px,calc(100vw - 16px));box-sizing:border-box;width:max-content;padding:10px 12px 9px;background:#fff;border:1px solid #d9d2f5;border-left:4px solid #6d5bd0;border-radius:10px;box-shadow:0 10px 30px rgba(40,24,110,.22);font:400 12px/1.55 'Noto Sans JP',sans-serif;color:#2b2540;text-align:left;pointer-events:auto}
.ap-tip[hidden]{display:none}
.ap-tip .ap-tip-r+.ap-tip-r{margin-top:8px;padding-top:8px;border-top:1px dashed #e2ddf6}
.ap-tip .ap-tip-h{display:block;font-weight:700;color:#4a3bb0;font-size:11.5px}
.ap-tip .ap-tip-l{display:block;margin-top:4px;font-size:10px;letter-spacing:.02em;color:#8a83a6}
.ap-tip blockquote{margin:3px 0 0;padding:4px 8px;background:#f6f4fd;border-radius:6px;font-size:11.5px;color:#2b2540}
.ap-tip blockquote+blockquote{margin-top:4px}
.ap-tip a{display:inline-block;margin-top:4px;font-size:10.5px;color:#6d5bd0;word-break:break-all}
main[data-view="ap"] sup.ap-c{cursor:help}
main[data-view="ap"] .ap-tip-on{background:rgba(109,91,208,.10);border-radius:3px;box-shadow:0 0 0 2px rgba(109,91,208,.10)}
@media print{.ap-tip{display:none!important}main[data-view="ap"] .ap-tip-on{background:none;box-shadow:none}}
</style>
<script src="assets/ap/quotes.js" defer></script>
<script>/* ap-tip: tooltip dẫn chứng nguyên văn cho số trích dẫn [n] của tab Andpad Info */
(function(){
  var LAB=${lab};
  var root=document.querySelector('main[data-view="ap"]');if(!root)return;
  var tip=document.createElement('div');tip.className='ap-tip';tip.setAttribute('role','tooltip');tip.id='ap-tip';tip.hidden=true;document.body.appendChild(tip);
  var cur=null,pinned=false,hideT=0;
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function l3(o,tag){return ['ja','en','vi'].map(function(l){return '<'+tag+' data-l="'+l+'">'+esc(o[l])+'</'+tag+'>'}).join('')}
  // phần tử "mang số liệu": cha gần nhất có con trực tiếp sup.ap-c
  function host(el){for(var i=0;el&&el!==root&&i<4;i++,el=el.parentElement){if(el.matches&&el.matches('sup.ap-c'))return el.parentElement;for(var c=el.firstElementChild;c;c=c.nextElementSibling)if(c.matches('sup.ap-c'))return el}return null}
  function html(h){
    var sec=h.closest('section.pg');if(!sec)return '';
    var Q=window.AP_Q||{},out=[],seen={};
    [].forEach.call(h.querySelectorAll(':scope>sup.ap-c'),function(s){
      (s.textContent.match(/\\d+/g)||[]).forEach(function(n){
        if(seen[n])return;seen[n]=1;
        var li=document.getElementById(sec.id+'-r'+n);if(!li)return;
        var a=li.querySelector('a'),u=a&&a.getAttribute('href'),qs=Q[u]||[];
        var t=[].map.call(li.querySelectorAll('span[data-l]'),function(x){return x.outerHTML}).join('');
        out.push('<div class="ap-tip-r"><span class="ap-tip-h">['+n+'] '+t+'</span>'+(qs.length?'<span class="ap-tip-l">'+l3(LAB.q,'span')+'</span>'+qs.map(function(q){return '<blockquote>「'+esc(q)+'」</blockquote>'}).join(''):'')+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(u.replace(/^https:\\/\\/(www\\.)?/,''))+'</a>':'')+'</div>');
      });
    });
    return out.join('');
  }
  function place(h){
    if(!h.getClientRects().length){hide();return} // tờ chứa số [n] đã bị ẩn (chuyển slide / tab)
    var r=h.getBoundingClientRect(),sx=window.scrollX,sy=window.scrollY,vw=document.documentElement.clientWidth;
    tip.style.left='0px';tip.style.top='0px';
    var w=tip.offsetWidth,ht=tip.offsetHeight,x=Math.min(Math.max(8,r.left),vw-w-8),y=r.bottom+8;
    if(y+ht>window.innerHeight&&r.top-ht-8>0)y=r.top-ht-8;
    tip.style.left=(x+sx)+'px';tip.style.top=(y+sy)+'px';
  }
  function show(h){
    clearTimeout(hideT);if(cur===h&&!tip.hidden)return;
    var c=html(h);if(!c)return;
    if(cur)cur.classList.remove('ap-tip-on');cur=h;h.classList.add('ap-tip-on');
    tip.innerHTML=c;tip.hidden=false;place(h);
    var s=h.querySelector(':scope>sup.ap-c');if(s)s.setAttribute('aria-describedby','ap-tip');
  }
  function hide(){pinned=false;tip.hidden=true;if(cur){cur.classList.remove('ap-tip-on');var s=cur.querySelector(':scope>sup.ap-c');if(s)s.removeAttribute('aria-describedby')}cur=null}
  function later(){clearTimeout(hideT);hideT=setTimeout(function(){if(!pinned)hide()},180)}
  [].forEach.call(root.querySelectorAll('sup.ap-c'),function(s){s.tabIndex=0;s.setAttribute('role','button')});
  root.addEventListener('mouseover',function(e){if(pinned)return;var h=host(e.target);if(h)show(h)});
  root.addEventListener('mouseout',function(e){if(pinned)return;var h=host(e.target);if(h&&!h.contains(e.relatedTarget)&&!tip.contains(e.relatedTarget))later()});
  tip.addEventListener('mouseover',function(){clearTimeout(hideT)});
  tip.addEventListener('mouseout',function(e){if(!pinned&&!tip.contains(e.relatedTarget)&&!(cur&&cur.contains(e.relatedTarget)))later()});
  root.addEventListener('focusin',function(e){if(e.target.matches('sup.ap-c'))show(e.target.parentElement)});
  root.addEventListener('focusout',function(e){if(e.target.matches('sup.ap-c')&&!pinned)later()});
  // chạm / bấm số [n]: ghim hộp (không lật slide, không mở ảnh); bấm ra ngoài hoặc Esc để đóng
  document.addEventListener('click',function(e){
    var s=e.target.closest&&e.target.closest('main[data-view="ap"] sup.ap-c');
    if(s){e.preventDefault();e.stopPropagation();if(pinned&&cur===s.parentElement){hide();return}hide();show(s.parentElement);pinned=true;return}
    if(pinned&&!tip.contains(e.target))hide();
  },true);
  // Enter / Space trên số [n] đang chọn: ghim hộp như khi bấm (Space không lật slide); Esc đóng; phím khác (chuyển slide) thì kiểm lại
  document.addEventListener('keydown',function(e){
    var s=e.target.matches&&e.target.matches('main[data-view="ap"] sup.ap-c')?e.target:null;
    if(s&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopPropagation();show(s.parentElement);pinned=true;return}
    if(e.key==='Escape'&&!tip.hidden){hide();return}
    if(cur&&!tip.hidden)setTimeout(function(){if(cur)place(cur)},60);
  },true);
  // capture: bắt cả cuộn bên trong tờ (Slide view trên điện thoại cuộn trong main, không phải window)
  document.addEventListener('scroll',function(){if(cur&&!tip.hidden)place(cur)},{capture:true,passive:true});
  window.addEventListener('resize',function(){if(cur&&!tip.hidden)place(cur)});
})();
</script>`;
