// Task 7x9o (/media-business-video): kiểm clip workflow Team Management trên Chrome headless thật (CDP).
// A) Engine tools/team-flow/engine.html: khung là hàm thuần của t (seek 2 lần ra cùng ảnh), vòng lặp liền
//    (seek(0) == seek(DURATION)), không khối chữ nào chồng nhau / tràn khung ở các mốc, 6 bước đều bật trước khi lặp.
//    Kiểm cả 2 bố cục: ngang 16:9 và dọc 3:4 (?layout=m) cho màn hẹp.
// B) index.html: ở #team-skills chỉ video của ngôn ngữ đang xem được tải và đang chạy; đổi ngôn ngữ (2 chiều) thì video mới chạy;
//    nút tạm dừng / phát hoạt động; prefers-reduced-motion: không tự tải, bấm nút mới phát; mobile 390px dùng bản dọc, không tràn ngang.
// Chạy: node tests/browser-team-flow.mjs   (thoát 0 = đạt). CHROME=<đường dẫn> để đổi trình duyệt.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openChrome, sleep } from '../tools/team-flow/cdp.mjs';

const fileUrl = (p) => pathToFileURL(fileURLToPath(new URL(p, import.meta.url))).href;
const ENGINE = fileUrl('../tools/team-flow/engine.html');
const PAGE = fileUrl('../index.html');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };

const BOXES = `(() => {
  const out = [];
  for (const e of document.querySelectorAll('[data-box]')) {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (r.width === 0 || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    out.push({ k: e.dataset.box, x: r.left, y: r.top, w: r.width, h: r.height });
  }
  return { out, offset: [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).offsetPath !== 'none').length };
})()`;

async function main() {
  const c = await openChrome();
  try {
    // ── A) engine
    for (const lang of ['ja', 'en', 'vi']) for (const [lay, W, H] of [['d', 1600, 900], ['m', 1200, 1600]]) {
      await c.go(`${ENGINE}?lang=${lang}&layout=${lay}`, W, H);
      const D = await c.evaluate('window.DURATION');
      ok(D >= 4 && D <= 5, `engine/${lang}/${lay}: DURATION ${D}, yêu cầu 4..5 s`);
      const at = async (t) => { await c.evaluate(`window.seek(${t})`); return c.shot(); };
      const a0 = await at(0), aEnd = await at(D);
      ok(a0.equals(aEnd), `engine/${lang}/${lay}: khung đầu và khung cuối khác nhau (vòng lặp bị giật)`);
      const m1 = await at(2.1), m2 = await at(3.3), m3 = await at(2.1);
      ok(m1.equals(m3), `engine/${lang}/${lay}: seek(2.1) hai lần ra hai ảnh khác (khung không thuần theo t)`);
      ok(!m1.equals(m2) && !m1.equals(a0), `engine/${lang}/${lay}: hình không chuyển động giữa các mốc`);
      for (const t of [0, 0.6, 1.2, 1.8, 2.4, 3.0, 3.6, 4.0, 4.5]) {
        await c.evaluate(`window.seek(${t})`);
        const { out, offset } = await c.evaluate(BOXES);
        ok(offset === 0, `engine/${lang}/${lay}@${t}: có ${offset} phần tử dùng offset-path`);
        ok(out.length >= 15, `engine/${lang}/${lay}@${t}: chỉ thấy ${out.length} khối chữ`);
        for (const b of out) ok(b.x >= 40 && b.y >= 40 && b.x + b.w <= W - 40 && b.y + b.h <= H - 40, `engine/${lang}/${lay}@${t}: "${b.k}" tràn lề an toàn`);
        for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
          const p = out[i], q = out[j];
          const ix = Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x), iy = Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y);
          ok(!(ix > 2 && iy > 2), `engine/${lang}/${lay}@${t}: "${p.k}" chồng lên "${q.k}"`);
        }
      }
      await c.evaluate('window.seek(3.95)');
      const st = await c.evaluate('window.STATE()');
      ok(st.active.every((k) => k > 0.99), `engine/${lang}/${lay}: lúc 3.95 s chưa bật đủ 6 bước ${JSON.stringify(st.active)}`);
      await c.evaluate('window.seek(0.1)');
      const s0 = await c.evaluate('window.STATE()');
      ok(s0.active.every((k) => k < 0.01), `engine/${lang}/${lay}: lúc 0.1 s đã có bước bật sẵn ${JSON.stringify(s0.active)}`);
    }

    // ── B) trang thật
    const probe = `(() => { const r = {}; for (const v of document.querySelectorAll('#team-skills video.tf-v')) {
      r[v.dataset.l] = { src: v.currentSrc || v.getAttribute('src') || '', t: v.currentTime, paused: v.paused, w: v.getBoundingClientRect().width, h: v.getBoundingClientRect().height }; }
      r.overflowX = document.documentElement.scrollWidth - innerWidth; return r; })()`;
    const show = `document.querySelector('#team-skills .tf-vid').scrollIntoView({block:'center'})`;
    for (const lang of ['ja', 'en', 'vi']) {
      await c.go(`${PAGE}?lang=${lang}#team-skills`, 1280, 900);
      await c.evaluate(show); await sleep(1800);
      const r = await c.evaluate(probe);
      ok(r[lang] && /team-flow-\w\w\.mp4$/.test(r[lang].src), `page/${lang}: video ${lang} chưa được tải khi đã cuộn tới`);
      ok(r[lang] && !r[lang].paused && r[lang].t > 0.3, `page/${lang}: video ${lang} không chạy (${JSON.stringify(r[lang])})`);
      ok(r[lang] && r[lang].w >= 600, `page/${lang}: video quá nhỏ (${r[lang]?.w}px)`);
      for (const o of ['ja', 'en', 'vi'].filter((x) => x !== lang)) ok(r[o] && !r[o].src, `page/${lang}: video ${o} bị tải dù đang ẩn`);
    }
    // nút tạm dừng / phát (WCAG 2.2.2)
    const btn = `document.querySelector('#team-skills .tf-pp')`;
    await c.evaluate(`${btn}.click()`); await sleep(500);
    const pz = await c.evaluate(probe), t1 = pz.vi.t; await sleep(600);
    const pz2 = await c.evaluate(probe);
    const st = await c.evaluate(`[${btn}.getAttribute('aria-pressed'), document.querySelector('.tf-vid').classList.contains('is-paused')]`);
    ok(pz.vi.paused && pz2.vi.t === t1 && st[0] === 'true' && st[1], `page: bấm nút mà video không dừng (${JSON.stringify([pz.vi, st])})`);
    await c.evaluate(`${btn}.click()`); await sleep(900);
    const pz3 = await c.evaluate(probe);
    ok(!pz3.vi.paused && pz3.vi.t > t1, 'page: bấm nút lần 2 mà video không chạy lại');
    // đổi ngôn ngữ ngay trên trang
    await c.go(`${PAGE}?lang=ja#team-skills`, 1280, 900);
    await c.evaluate(show); await sleep(800);
    await c.evaluate(`document.querySelector('.sb-lang button[data-lang="vi"]').click()`); await c.evaluate(show); await sleep(1800);
    const sw = await c.evaluate(probe);
    ok(sw.vi && !sw.vi.paused && sw.vi.t > 0.3, `page: đổi sang VI nhưng video VI không chạy (${JSON.stringify(sw.vi)})`);
    ok(sw.ja && sw.ja.paused, 'page: đổi sang VI mà video JA vẫn chạy ngầm');
    await c.evaluate(`document.querySelector('.sb-lang button[data-lang="en"]').click()`); await c.evaluate(show); await sleep(1800);
    const sw2 = await c.evaluate(probe);
    ok(sw2.en && !sw2.en.paused && sw2.en.t > 0.3 && sw2.vi.paused, `page: đổi VI sang EN không đúng (${JSON.stringify([sw2.en, sw2.vi])})`);
    // reduced motion
    await c.go(`${PAGE}?lang=en#team-skills`, 1280, 900, { reducedMotion: true });
    await c.evaluate(show); await sleep(1200);
    const rm = await c.evaluate(probe);
    ok(rm.en && !rm.en.src && rm.en.paused, `page/reduced-motion: video vẫn tải/chạy (${JSON.stringify(rm.en)})`);
    await c.evaluate(`${btn}.click()`); await sleep(1500);
    const rm2 = await c.evaluate(probe);
    ok(rm2.en && /team-flow-en\.mp4$/.test(rm2.en.src) && !rm2.en.paused, `page/reduced-motion: bấm nút phát mà video không chạy (${JSON.stringify(rm2.en)})`);
    // mobile
    await c.go(`${PAGE}?lang=vi#team-skills`, 390, 844);
    await c.evaluate(show); await sleep(1500);
    const mb = await c.evaluate(probe);
    ok(mb.overflowX <= 1, `page/mobile: tràn ngang ${mb.overflowX}px`);
    ok(mb.vi && mb.vi.w > 300 && mb.vi.w <= 390, `page/mobile: bề rộng video ${mb.vi?.w}px`);
    ok(mb.vi && !mb.vi.paused, 'page/mobile: video không chạy');
    ok(mb.vi && /team-flow-vi-m\.mp4$/.test(mb.vi.src), `page/mobile: màn hẹp phải dùng bản dọc -m (${mb.vi?.src})`);
    ok(mb.vi && Math.abs(mb.vi.h / mb.vi.w - 4 / 3) < 0.03, `page/mobile: khung video không phải 3:4 (${mb.vi?.w}x${mb.vi?.h})`);
    ok(c.errors.length === 0, `lỗi JS/console: ${c.errors.slice(0, 5).join(' | ')}`);
  } finally { c.close(); }
}

main().catch((e) => fails.push('lỗi chạy: ' + e.message)).finally(() => {
  setTimeout(() => {
    if (fails.length) { console.error(`FAIL browser-team-flow (${fails.length}/${checks})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
    console.log(`PASS browser-team-flow: ${checks} điểm kiểm; engine JA/EN/VI x ngang/dọc thuần theo t, lặp liền, không chồng chữ; trang chỉ tải và chạy video đúng ngôn ngữ, đổi ngôn ngữ 2 chiều, nút tạm dừng, reduced-motion, mobile bản dọc`);
    process.exit(0);
  }, 400);
});
