// Sinh phu de ASS (libass) cho 1 canh: kicker + title + KARAOKE caption (chay chu theo giong) + watermark.
// ASS xu ly unicode tieng Viet + can chinh + karaoke (\k) tot hon drawtext. Moi canh timeline 0..sec (local).

// Font: khop AutoVideo (Be Vietnam Pro). Image Docker cai san; thieu -> libass tu thay font khac (van co dau).
const FONT = process.env.VIDEO_FONT || "Be Vietnam Pro";

// Mau ASS la &HAABBGGRR (alpha,B,G,R) - dao nguoc so voi #RRGGBB. alpha: 00=dac, FF=trong.
function assColor(hex, alpha = 0) {
  const h = String(hex || "#ffffff").replace("#", "");
  const r = h.slice(0, 2) || "ff";
  const g = h.slice(2, 4) || "ff";
  const b = h.slice(4, 6) || "ff";
  const a = Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, "0");
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

function assTime(s) {
  s = Math.max(0, s);
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const sec = Math.floor(s);
  const cs = Math.round((s - sec) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

// Text an toan trong ASS: bo dau ngoac nhon (khoi override), backslash; xuong dong -> \N.
function assText(s) {
  return String(s || "")
    .replace(/[{}]/g, "")
    .replace(/\\N/g, "\n")
    .replace(/\\/g, "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\\N");
}

/**
 * plan-canh -> chuoi ASS (timeline 0..sec cua RIENG canh nay).
 * scene: { caption, title?, kicker?, sec, speakSec? }
 * opts: { accent, ink (mau chu title/caption unsung), light, brand }
 * width/height: 1080x1920.
 */
export function buildSceneAss(scene, opts = {}) {
  const W = 1080;
  const H = 1920;
  const accent = opts.accent || "#fb923c";
  const ink = opts.ink || (opts.light ? "#241f1b" : "#ffffff");
  const sec = Math.max(0.5, Number(scene.sec) || 3);
  const speak = Math.max(0.4, Math.min(sec, Number(scene.speakSec) || sec * 0.9));

  const primary = assColor(accent, 0); // tu da hat -> accent
  const secondary = assColor(ink, 0); // chua hat -> mau chu thuong
  const outline = assColor("#000000", opts.light ? 200 : 40);
  const titleCol = assColor(ink, 0);
  const kickCol = assColor(accent, 0);
  const brandCol = assColor(accent, 40);

  const head =
    `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\nYCbCr Matrix: TV.709\n\n` +
    `[V4+ Styles]\n` +
    `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
    `Style: Title,${FONT},104,${titleCol},&H000000FF,${outline},&H00000000,1,0,0,0,100,100,0,0,1,5,0,5,90,90,0,1\n` +
    `Style: Kicker,${FONT},40,${kickCol},&H00000000,${outline},&H00000000,1,0,0,0,100,100,3,0,1,3,0,5,90,90,0,1\n` +
    `Style: Cap,${FONT},62,${primary},${secondary},${outline},&H64000000,1,0,0,0,100,100,0,0,1,5,1,2,120,120,0,1\n` +
    `Style: Brand,${FONT},34,${brandCol},&H00000000,${outline},&H00000000,1,0,0,0,100,100,1,0,1,2,0,2,60,60,60,1\n\n` +
    `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  const lines = [];
  const end = assTime(sec);

  // Kicker (nhan nho phia tren), title (giua) - stack bang \pos + \an5.
  if (scene.kicker) {
    lines.push(`Dialogue: 0,${assTime(0)},${end},Kicker,,0,0,0,,{\\pos(540,560)\\an5\\fad(120,0)}${assText(scene.kicker).toUpperCase()}`);
  }
  if (scene.title) {
    lines.push(`Dialogue: 0,${assTime(0)},${end},Title,,0,0,0,,{\\pos(540,720)\\an5\\fad(200,0)}${assText(scene.title)}`);
  }

  // Karaoke caption: chia CHUNK 4 tu; moi chunk 1 Dialogue, \k per tu (centisecond).
  const words = String(scene.caption || "").trim().split(/\s+/).filter(Boolean);
  if (words.length) {
    const per = speak / words.length; // giay/tu
    const kcs = Math.max(6, Math.round(per * 100)); // \k centisecond
    for (let c = 0; c * 4 < words.length; c++) {
      const chunk = words.slice(c * 4, c * 4 + 4);
      const isLast = c * 4 + 4 >= words.length;
      const st = c * 4 * per;
      const en = isLast ? sec : (c * 4 + chunk.length) * per;
      const kar = chunk.map((w) => `{\\k${kcs}}${assText(w)}`).join(" ");
      lines.push(`Dialogue: 1,${assTime(st)},${assTime(en)},Cap,,0,0,0,,{\\pos(540,1580)\\an5}${kar}`);
    }
  }

  // Watermark thuong hieu (goc duoi)
  if (opts.brand) {
    lines.push(`Dialogue: 0,${assTime(0)},${end},Brand,,0,0,0,,{\\an2}${assText(opts.brand)}`);
  }

  return head + lines.join("\n") + "\n";
}
