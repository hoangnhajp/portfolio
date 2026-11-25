// Task mjd6: câu dẫn trang #it-top (tab IT Knowledge) không mở đầu bằng "Là IT communicator" nữa,
// mà nói công ty JILNESTA đã quản lý dự án IT, outsourcing và nhân sự ngành IT, rồi mới tới
// câu hiểu đặc tính cơ cấu dự án, ngôn ngữ lập trình, nhân sự ngành IT (task 8vs2 thay câu "truyền đạt yêu cầu...";
// đủ 3 ngôn ngữ JA / EN / VI).
// Chạy: node tests/check-it-jil-intro.mjs   (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

const sec = (html.match(/<section[^>]*id="it-top"[^>]*>([\s\S]*?)<\/section>/) || [])[1] || '';
ok(sec, 'thiếu section #it-top');
const sub = (l) => ((sec.match(new RegExp(`<p class="kw-sub[^"]*"[^>]*data-l="${l}">([\\s\\S]*?)</p>`)) || [])[1] || '');
const ja = sub('ja'), en = sub('en'), vi = sub('vi');

// 1) Không còn tự giới thiệu là IT communicator ở câu dẫn này
ok(!/IT ?communicator|ITコミュニケーター/i.test(ja + en + vi), '#it-top câu dẫn còn "IT communicator"');
// 2) Nêu JILNESTA quản lý dự án IT, outsourcing, nhân sự ngành IT
ok(/JILNESTA/.test(vi) && /quản lý dự án IT, outsourcing và nhân sự ngành IT/.test(vi), 'VI thiếu câu JILNESTA quản lý dự án IT, outsourcing, nhân sự ngành IT');
ok(/JILNESTA/.test(en) && /IT projects/.test(en) && /outsourcing/i.test(en) && /IT (staff|talent|personnel)/.test(en), 'EN thiếu câu JILNESTA quản lý IT projects, outsourcing, IT staff');
ok(/JILNESTA/.test(ja) && /ITプロジェクト/.test(ja) && /アウトソーシング/.test(ja) && /IT人材/.test(ja), 'JA thiếu câu JILNESTA ITプロジェクト、アウトソーシング、IT人材');
// 3) Task 8vs2: câu sau nói hiểu biết (cơ cấu dự án, ngôn ngữ, nhân sự ngành IT), không kể chuyện phát triển dự án
ok(/Từ đó tôi hiểu đặc tính của cơ cấu dự án, ngôn ngữ lập trình và nhân sự ngành IT\.$/.test(vi), 'VI thiếu câu hiểu đặc tính cơ cấu dự án, ngôn ngữ lập trình, nhân sự ngành IT');
ok(/how IT projects are structured/.test(en) && /how IT talent works\.$/.test(en), 'EN thiếu câu hiểu cấu trúc dự án, ngôn ngữ, IT talent');
ok(/プロジェクトの体制、開発言語、IT人材の特徴を理解してきました。$/.test(ja), 'JA thiếu câu プロジェクトの体制、開発言語、IT人材の特徴を理解してきました。');

if (fails.length) { console.error('FAIL check-it-jil-intro:\n- ' + fails.join('\n- ')); process.exit(1); }
console.log('OK check-it-jil-intro');
