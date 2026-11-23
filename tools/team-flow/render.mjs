// Dựng clip workflow Team Management (task 7x9o, skill media-business-video, lane CRISP 2D KINETIC).
// engine.html (seek(t)) -> chụp từng khung 60 fps bằng Chrome headless -> ffmpeg H.264 yuv420p, không tiếng, faststart.
// 2 bố cục: ngang 16:9 (team-flow-<lang>.mp4, 1280x720) và dọc 3:4 cho màn hẹp (team-flow-<lang>-m.mp4, 720x960).
// Chạy: node tools/team-flow/render.mjs [ja en vi]   (cần ffmpeg trong PATH; mặc định cả 3 ngôn ngữ)
import { mkdtempSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { openChrome } from './cdp.mjs';

const FPS = 60, POSTER_T = 4.0;
const LAYOUTS = [{ id: 'd', suffix: '', W: 1600, H: 900, OW: 1280, OH: 720 }, { id: 'm', suffix: '-m', W: 1200, H: 1600, OW: 720, OH: 960 }];
const here = fileURLToPath(new URL('.', import.meta.url));
const ENGINE = pathToFileURL(join(here, 'engine.html')).href;
const OUT = join(here, '../../assets/workflow');
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['ja', 'en', 'vi'];

const c = await openChrome();
try {
  for (const lang of langs) for (const { id, suffix, W, H, OW, OH } of LAYOUTS) {
    await c.go(`${ENGINE}?lang=${lang}&layout=${id}`, W, H);
    const D = await c.evaluate('window.DURATION');
    const n = Math.round(D * FPS);               // khung n (= t D) trùng khung 0 nên không chụp: vòng lặp liền
    const dir = mkdtempSync(join(tmpdir(), `tflow-${lang}-`));
    for (let f = 0; f < n; f++) {
      await c.evaluate(`window.seek(${f / FPS})`);
      writeFileSync(join(dir, `f${String(f).padStart(4, '0')}.png`), await c.shot());
    }
    const mp4 = join(OUT, `team-flow-${lang}${suffix}.mp4`), webp = join(OUT, `team-flow-${lang}${suffix}.webp`);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%04d.png'),
      '-vf', `scale=${OW}:${OH}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'animation',
      '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', '-an', mp4]);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', join(dir, `f${String(Math.round(POSTER_T * FPS)).padStart(4, '0')}.png`),
      '-vf', `scale=${OW}:${OH}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '82', webp]);
    rmSync(dir, { recursive: true, force: true });
    console.log(`${lang}${suffix}: ${n} khung -> ${mp4} (${statSync(mp4).size} B), poster ${statSync(webp).size} B`);
  }
  if (c.errors.length) { console.error('lỗi JS trong engine:', c.errors.slice(0, 3)); process.exitCode = 1; }
} finally { c.close(); }
