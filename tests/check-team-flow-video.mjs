// Task 7x9o (/media-business-video): clip workflow 4-5 giây cho tab Team Management.
// Kiểm tĩnh: 6 file MP4 (JA/EN/VI x ngang 16:9 + dọc 3:4 cho màn hẹp) + poster tồn tại, đúng thông số (ffprobe),
// chỗ nối vòng lặp trên chính file MP4 liền (PSNR khung cuối/khung đầu), có nút tạm dừng, nhúng đúng chỗ trong #team-skills,
// chỉ tải video của ngôn ngữ đang xem, tôn trọng prefers-reduced-motion, ẩn khi in; engine không có dấu gạch dài,
// không "you/your", không offset-path (luật layout của skill).
// Chạy: node tests/check-team-flow-video.mjs   (thoát 0 = đạt; cần ffprobe trong PATH)
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const fails = []; let checks = 0;
const ok = (c, m) => { checks++; if (!c) fails.push(m); };
const LANGS = ['ja', 'en', 'vi'];

// 1) file + thông số video
const psnrFirstLast = (mp4, frames) => {
  // khung cuối (t = 4.783 s) phải gần như trùng khung đầu thì lúc lặp mới không giật
  const r = spawnSync('ffmpeg', ['-v', 'info', '-i', mp4, '-i', mp4, '-filter_complex',
    `[0:v]select='eq(n,0)',setpts=PTS-STARTPTS[a];[1:v]select='eq(n,${frames - 1})',setpts=PTS-STARTPTS[b];[a][b]psnr`, '-f', 'null', '-'], { encoding: 'utf8' });
  if (r.error) throw r.error;
  return r.stderr;
};
for (const l of LANGS) for (const [sfx, OW, OH] of [['', 1280, 720], ['-m', 720, 960]]) {
  const name = `team-flow-${l}${sfx}`;
  const mp4 = join(root, `assets/workflow/${name}.mp4`), webp = join(root, `assets/workflow/${name}.webp`);
  ok(existsSync(mp4), `thiếu assets/workflow/${name}.mp4`);
  ok(existsSync(webp), `thiếu assets/workflow/${name}.webp`);
  if (!existsSync(mp4)) continue;
  const size = statSync(mp4).size;
  ok(size > 50_000 && size < 1_600_000, `${name}.mp4 dung lượng ${size} B ngoài khoảng 50 KB..1.6 MB`);
  if (existsSync(webp)) ok(statSync(webp).size < 200_000, `${name}.webp poster quá nặng`);
  let p;
  try {
    p = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], { encoding: 'utf8' }));
  } catch (e) { ok(false, `ffprobe lỗi với ${name}.mp4: ${e.message}`); continue; }
  const v = p.streams.filter((s) => s.codec_type === 'video'), a = p.streams.filter((s) => s.codec_type === 'audio');
  ok(v.length === 1 && v[0].codec_name === 'h264', `${name}.mp4 phải có đúng 1 luồng H.264`);
  ok(a.length === 0, `${name}.mp4 không được có tiếng (clip nền tự chạy, muted)`);
  const dur = Number(p.format.duration);
  ok(dur >= 4 && dur <= 5, `${name}.mp4 dài ${dur}s, yêu cầu 4..5s`);
  if (v[0]) {
    const [n, d] = v[0].r_frame_rate.split('/').map(Number);
    ok(Math.round(n / d) === 60, `${name}.mp4 ${n / d} fps, yêu cầu 60 fps (mượt)`);
    ok(v[0].width === OW && v[0].height === OH, `${name}.mp4 khung ${v[0].width}x${v[0].height}, yêu cầu ${OW}x${OH}`);
    const frames = Number(v[0].nb_frames);
    ok(frames === 288, `${name}.mp4 có ${frames} khung, yêu cầu 288 (4.8 s x 60)`);
    try {
      const m = psnrFirstLast(mp4, frames).match(/average:([\d.]+|inf)/);
      const db = m ? (m[1] === 'inf' ? 99 : Number(m[1])) : 0;
      ok(db >= 38, `${name}.mp4 chỗ nối vòng lặp lệch (PSNR khung cuối/đầu ${db} dB < 38)`);
    } catch (e) { ok(false, `${name}.mp4 không đo được PSNR: ${e.message.slice(0, 120)}`); }
    ok(v[0].pix_fmt === 'yuv420p', `${name}.mp4 pix_fmt ${v[0].pix_fmt}, cần yuv420p để mọi trình duyệt phát được`);
  }
}

// 2) nhúng trong #team-skills, trước lưới 6 thẻ
const sec = html.slice(html.indexOf('id="team-skills"'), html.indexOf('id="team-daily"'));
ok(sec.length > 100, 'không tìm thấy section #team-skills');
const fig = sec.match(/<figure class="tf-vid[^"]*"[\s\S]*?<\/figure>/)?.[0] || '';
ok(fig, '#team-skills thiếu <figure class="tf-vid">');
ok(fig && sec.indexOf(fig) < sec.indexOf('class="g3'), 'clip phải nằm trước lưới 6 thẻ (.g3)');
for (const l of LANGS) {
  const vtag = fig.match(new RegExp(`<video[^>]*data-l="${l}"[^>]*>[\\s\\S]*?</video>`))?.[0] || '';
  ok(vtag, `thiếu <video data-l="${l}">`);
  if (!vtag) continue;
  for (const attr of ['muted', 'loop', 'playsinline', 'preload="none"', `poster="assets/workflow/team-flow-${l}.webp"`, 'class="tf-v"'])
    ok(vtag.includes(attr), `<video data-l="${l}"> thiếu ${attr}`);
  ok(/aria-label="[^"]{12,}"/.test(vtag), `<video data-l="${l}"> thiếu aria-label mô tả`);
  ok(vtag.includes(`data-src="assets/workflow/team-flow-${l}.mp4"`), `<video data-l="${l}"> phải trỏ data-src tới team-flow-${l}.mp4 (chưa tải khi chưa thấy)`);
  ok(vtag.includes(`data-src-m="assets/workflow/team-flow-${l}-m.mp4"`) && vtag.includes(`data-poster-m="assets/workflow/team-flow-${l}-m.webp"`), `<video data-l="${l}"> thiếu bản dọc cho màn hẹp (data-src-m / data-poster-m)`);
  ok(!/\ssrc="/.test(vtag) && !/autoplay/.test(vtag), `<video data-l="${l}"> không được tải/tự chạy sẵn (3 ngôn ngữ sẽ tải cả 3)`);
}
const btn = fig.match(/<button class="tf-pp"[\s\S]*?<\/button>/)?.[0] || '';
ok(btn && /type="button"/.test(btn) && /aria-pressed=/.test(btn), 'thiếu nút tạm dừng / phát (.tf-pp, type=button, aria-pressed) theo WCAG 2.2.2');
for (const l of LANGS) ok(new RegExp(`class="tf-sr" data-l="${l}">[^<]{4,}<`).test(btn), `nút tạm dừng thiếu nhãn đọc màn hình ${l}`);
const js = html.match(/<script>[^<]*tf-v[\s\S]*?<\/script>/)?.[0] || '';
ok(/IntersectionObserver/.test(js), 'thiếu script IntersectionObserver phát video khi thấy');
ok(/prefers-reduced-motion/.test(js), 'script phải tôn trọng prefers-reduced-motion');
ok(/max-width: 600px/.test(js) && /data-src-m/.test(js), 'script phải chọn bản dọc khi màn hẹp');
ok(/@media print\{[^}]*\.tf-vid[^}]*display:none/.test(html), 'khi in phải ẩn .tf-vid');

// 3) engine + luật chữ của skill (không dấu gạch dài, không you/your, không offset-path)
const engPath = join(root, 'tools/team-flow/engine.html');
ok(existsSync(engPath), 'thiếu tools/team-flow/engine.html (nguồn dựng clip, sửa được)');
if (existsSync(engPath)) {
  const eng = readFileSync(engPath, 'utf8');
  ok(!/[—–]/.test(eng), 'engine có dấu gạch dài');
  const labels = eng.match(/const LABELS = [\s\S]*?\n};/)?.[0] || '';
  ok(labels.length > 200, 'engine thiếu bảng chữ LABELS (JA/EN/VI)');
  ok(!/\byour?\b/i.test(labels), 'chữ trên clip có "you/your"');
  ok(!/offset-path|offsetPath/.test(eng), 'engine dùng offset-path (phần tử bay tự do, cấm theo luật layout)');
  ok(/window\.seek\s*=/.test(eng) && /window\.DURATION\s*=/.test(eng), 'engine phải có window.seek(t) và window.DURATION (khung thuần theo thời gian)');
}
ok(existsSync(join(root, 'tools/team-flow/render.mjs')), 'thiếu tools/team-flow/render.mjs (lệnh dựng lại clip)');

if (fails.length) { console.error(`FAIL check-team-flow-video (${fails.length}/${checks})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`PASS check-team-flow-video: ${checks} điểm kiểm, 6 clip JA/EN/VI ngang + dọc, 60 fps 4.8 s, nối vòng lặp liền, nút tạm dừng, nhúng #team-skills, tải lười, reduced-motion, ẩn khi in`);
