// Task 3vnq: rà câu chữ toàn tab Andpad Info theo đúng từ ANDPAD dùng (đối chiếu andpad.jp, andpad.co.jp, PR TIMES, thông cáo EN ngày 26/11/2026).
// Mỗi dòng = [regex phải KHÔNG còn | phải CÓ, mô tả]. Kiểm trên HTML sinh trong khối ap:start/end (cả 3 ngôn ngữ).
// Chạy: node tests/check-ap-wording-3vnq.mjs [index.html] (thoát 0 = đạt)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const html = readFileSync(process.argv[2] || fileURLToPath(new URL('../index.html', import.meta.url)), 'utf8');
const ap = (html.match(/<!-- ap:start -->([\s\S]*?)<!-- ap:end -->/) || [])[1] || '';
const txt = ap.replace(/<sup class="ap-c">[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const fails = [];
if (ap.length < 1000) fails.push('không thấy khối ap:start/ap:end');

const BAN = [
  // ap-top / ap-news
  [/建設業界向けのVertical SaaS企業/, 'câu mở đầu dùng tên dịch vụ chính thức 「クラウド型建設プロジェクト管理サービス」 (andpad.jp), không tự gọi Vertical SaaS'],
  [/ngành xây dựng Nhật Bản\. Nền tảng/, 'bản VI câu mở đầu không thêm "Nhật Bản" mà JA / EN không có'],
  [/施工管理サービスANDPADを開始/, 'mốc 2016: 「クラウド型建設プロジェクト管理サービス「ANDPAD」の提供を開始」'],
  [/Comvex社/, 'tên JA của công ty bị mua là 「コンベックス」'],
  [/DXカンパニー部門を発表/, 'ANDPAD AWARD 2025: công bố 「入賞企業」, không phải công bố hạng mục'],
  [/新部門「?DX Project/, 'tên JA hạng mục mới là 「DXプロジェクト部門」'],
  [/ANDPAD レポートを公開/, 'mốc 2026.09: tên trong thông cáo là 「ANDPADレポート」 (không cách)'],
  [/DXの成果を出した会社/, 'ANDPAD AWARD tôn vinh 「企業やユーザー」'],
  // ap-vn / ap-app / ap-scope
  [/協力会社はPENTA-OCEAN/, '協力会社 = thầu phụ; nguồn ghi 「五洋建設ベトナム）と協力し」 (連携先)'],
  [/digital signboard/i, 'thông cáo EN chính thức: "digital blackboard"'],
  [/写真管理、電子黒板、帳票出力/, 'nguồn 20251006: 「写真登録・電子黒板機能や帳票出力機能」'],
  [/Photo management, (a )?digital/, 'thông cáo EN: "photo registration"'],
  [/建設業マネジメントクラウド市場/, 'tên khảo sát MIC: 「建設業マネジメントクラウドサービス市場」'],
  [/多言語化の第1弾|kế hoạch đa ngôn ngữ|multilingual plan/, 'nguồn 20250226: 「多言語対応の第一弾」, không có "kế hoạch"'],
  [/導入から定着まで/, 'nguồn 20251006: 「初期導入から運用サポートまで」'],
  [/その後は(周辺|近隣)国へ|then neighbouring countries|rồi tới nước lân cận|sau đó tới nước lân cận/, 'nguồn chỉ nói 「周辺国への展開準備」'],
  [/ベトナム人の職人|Vietnamese workers in Japan|thợ Việt tại Nhật/, 'nguồn 20250626: 「国内のベトナム語話者」'],
  [/Asia DX Promotion Program/, 'tên EN chính thức: "Japan-ASEAN Asia Digital Transformation Promotion Program"'],
  [/the ANDPAD site app/, 'app chủ lực là 施工管理 (Construction Management)'],
  // ap-products / ap-shots / ap-guide*
  [/Bảng tiến độ/, 'ANDPAD ボード là app 稼働管理 / 現場手配 (lịch điều phối thợ), không phải bảng tiến độ'],
  [/Nghiệm thu từ xa/, '遠隔臨場 = xác nhận, chỉ thị từ xa, không phải nghiệm thu (立会検査)'],
  [/Quản lý công(?!\p{L}| (trình|việc|nợ|nghệ|ty|đoạn|cụ))/u, '歩掛 = định mức nhân công'],
  [/Group chat with everyone on site|Chat nhóm với mọi người ở công trình/, 'ANDPAD チャット: 一括連絡 tới mọi người của công trình'],
  [/原価、入金管理/, 'tên chức năng ERP: 「実行予算」「入金管理」'],
  [/引合から契約までの件数/, 'Analytics dùng 「反響から契約まで」'],
  [/人工と経費/, 'report_cost: 「労務費や経費」'],
  [/役割ごとの承認ルート/, 'approval: 「役職ごとに…承認フロー」'],
  [/発注者のルールでフォルダ/, 'electronic_delivery: 「指定する要領に合わせて…電子納品ツリー」'],
  [/固定カメラの映像/, 'remote_presence: 「カメラ画像」'],
  [/住宅会社からゼネコンまで/, 'BIM: câu đối tượng dùng không có nguồn'],
  [/đã dặn mà không nhận/, '「言った言わない」 = "đã nói hay chưa"'],
  [/giá trị nghiệm thu/, '出来高査定 = thẩm định khối lượng hoàn thành'],
  [/建物の維持管理/, 'ANDPAD BM là 「建物・設備保全」'],
  [/製品をまとめました。/, 'tiêu đề phụ JA dùng thể ngắn (luật check-ja-title-plain), không です / ます'],
  // ap-market / ap-compete / ap-vs-*
  [/残業の上限/, 'MHLW: 「時間外労働の上限規制」'],
  [/Năm tài khóa 2040:/, '「2040年度までに」 = "Đến năm tài khóa 2040"'],
  [/つなぎ、日本語のほか6つの海外言語に対応|billing, in Japanese plus six foreign languages|hỗ trợ tiếng Nhật và 6 ngoại ngữ/, '6 ngoại ngữ chỉ áp cho chức năng 施工管理 (tin 20251216)'],
  [/SPIDERPLUS về nghiệm thu/, 'bản JA chỉ có 「検査」'],
  [/phạm vi chức năng và chi phí khởi đầu/, '「導入のしやすさ」 = mức độ dễ triển khai'],
];
for (const [re, m] of BAN) { const hit = txt.match(new RegExp(`.{0,20}${re.source}.{0,10}`, re.flags)); if (hit) fails.push(`${m}: "${hit[0]}"`); }

const NEED = [
  [/クラウド型建設プロジェクト管理サービス「ANDPAD」を提供/, 'câu mở đầu #ap-top'],
  [/DXプロジェクト部門/, 'hạng mục ANDPAD AWARD 2026'],
  [/五洋建設ベトナム/, 'đối tác JETRO'],
  [/写真登録、電子黒板、帳票出力/, 'chức năng dùng trong thí điểm Việt Nam'],
  [/ANDPAD AI-BPOサービス/, 'tên thẻ sản phẩm AI-BPO chính thức'],
  [/Lịch điều phối thợ/, 'tên VI của ANDPAD ボード'],
  [/実行予算、入金管理/, 'chức năng ERP'],
  [/時間外労働の上限規制/, 'thuật ngữ MHLW'],
  [/施工管理機能は日本語のほか6つの海外言語/, 'phạm vi 6 ngoại ngữ'],
];
for (const [re, m] of NEED) if (!re.test(txt)) fails.push(`thiếu ${m}: ${re}`);

if (fails.length) { console.error(`FAIL check-ap-wording-3vnq (${fails.length})\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`OK check-ap-wording-3vnq: ${BAN.length} từ lệch đã bỏ, ${NEED.length} từ chính thức ANDPAD có mặt`);
