// Sinh phu de ASS (libass) cho 1 canh: kicker + title (CO CHUYEN DONG + GLOW) + component (neu co)
// + KARAOKE caption (chay chu theo giong, co "nay" tung cum) + watermark.
// Nhom hieu ung 🟢 lam LAI bang ASS/libass -> chi tiet: chuyen dong tieu de (\move/\t), glow (lop mo mau accent),
// karaoke pop (\t\fscx), component so lieu (assComp.mjs). Van render vai giay (khong Chrome).
import { componentDialogues } from "./assComp.mjs";

const FONT = process.env.VIDEO_FONT || "Be Vietnam Pro";

// Mau ASS la &HAABBGGRR (alpha,B,G,R) - dao nguoc so voi #RRGGBB. alpha: 00=dac, FF=trong.
export function assColor(hex, alpha = 0) {
  const h = String(hex || "#ffffff").replace("#", "");
  const r = h.slice(0, 2) || "ff";
  const g = h.slice(2, 4) || "ff";
  const b = h.slice(4, 6) || "ff";
  const a = Math.max(0, Math.min(255, alpha)).toString(16).padStart(2, "0");
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

export function assTime(s) {
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
export function assText(s) {
  return String(s || "")
    .replace(/[{}]/g, "")
    .replace(/\\N/g, "\n")
    .replace(/\\/g, "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\\N");
}

// Chuyen dong VAO cua tieu de: map scene.motion -> tag ASS (\move/\t/\fad). Thoi gian ms tinh tu dau dong.
function titleEntrance(motion) {
  const m = String(motion || "fade");
  const D = 320;
  switch (m) {
    case "rise": return `\\move(540,782,540,720,0,${D})\\fad(220,0)`;
    case "drop": case "slamdown": case "slideT": return `\\move(540,636,540,720,0,${D})\\fad(180,0)`;
    case "slideL": case "glideL": case "flyin": case "popL": return `\\move(280,720,540,720,0,${D})\\fad(150,0)`;
    case "slideR": case "glideR": case "popR": return `\\move(800,720,540,720,0,${D})\\fad(150,0)`;
    case "slideB": return `\\move(540,804,540,720,0,${D})\\fad(180,0)`;
    case "zoomin": case "iris": case "expand": case "squeeze": case "unfoldY": return `\\fscx55\\fscy55\\t(0,${D},\\fscx100\\fscy100)\\fad(150,0)`;
    case "zoomout": return `\\fscx136\\fscy136\\t(0,${D},\\fscx100\\fscy100)\\fad(150,0)`;
    case "pop": case "punch": case "bounce": return `\\fscx64\\fscy64\\t(0,170,\\fscx110\\fscy110)\\t(170,${D + 90},\\fscx100\\fscy100)\\fad(120,0)`;
    case "rotatein": case "spinin": case "swing": case "wobble": case "zoomspin": return `\\frz-16\\fscx72\\fscy72\\t(0,${D},\\frz0\\fscx100\\fscy100)\\fad(150,0)`;
    case "blurin": case "riseblur": case "zoomblur": return `\\blur10\\fscy80\\t(0,${D},\\blur0\\fscy100)\\fad(150,0)`;
    case "skewin": case "tiltin": case "flipy": case "flip3d": case "flipx": return `\\fscx38\\t(0,${D},\\fscx100)\\fad(150,0)`;
    case "shake": return `\\fad(120,0)\\t(0,90,\\frz3)\\t(90,180,\\frz-3)\\t(180,260,\\frz0)`;
    case "neon": return `\\fad(70,0)\\alpha&H55&\\t(0,120,\\alpha&H00&)\\t(120,220,\\alpha&H30&)\\t(220,340,\\alpha&H00&)`;
    default: return `\\fad(220,0)`;
  }
}

/**
 * plan-canh -> chuoi ASS (timeline 0..sec cua RIENG canh nay).
 * scene: { caption, title?, kicker?, motion?, component?, sec, speakSec? }
 * opts: { accent, ink, sub?, light, brand }
 */
export function buildSceneAss(scene, opts = {}) {
  const W = 1080, H = 1920;
  const accent = opts.accent || "#fb923c";
  const ink = opts.ink || (opts.light ? "#241f1b" : "#ffffff");
  const sub = opts.sub || (opts.light ? "#5b5048" : "#c7d0dc");
  const sec = Math.max(0.5, Number(scene.sec) || 3);
  const speak = Math.max(0.4, Math.min(sec, Number(scene.speakSec) || sec * 0.9));
  const end = assTime(sec);

  const primary = assColor(accent, 0);
  const secondary = assColor(ink, 0);
  const outline = assColor("#000000", opts.light ? 200 : 40);
  const titleCol = assColor(ink, 0);
  const kickCol = assColor(accent, 0);
  const brandCol = assColor(accent, 40);
  const accBGR = assColor(accent, 0); // dung cho \1c inline
  const subCol = assColor(sub, 0);

  const head =
    `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\nScaledBorderAndShadow: yes\nYCbCr Matrix: TV.709\n\n` +
    `[V4+ Styles]\n` +
    `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n` +
    `Style: Title,${FONT},120,${titleCol},&H000000FF,${outline},&H00000000,1,0,0,0,100,100,0,0,1,5,0,5,80,80,0,1\n` +
    `Style: Kicker,${FONT},46,${kickCol},&H00000000,${outline},&H00000000,1,0,0,0,100,100,6,0,1,3,0,5,90,90,0,1\n` +
    `Style: Cap,${FONT},72,${primary},${secondary},${outline},&H64000000,1,0,0,0,100,100,0,0,1,5,1,2,110,110,0,1\n` +
    `Style: Comp,${FONT},64,${titleCol},&H00000000,${outline},&H00000000,1,0,0,0,100,100,0,0,1,4,0,5,70,70,0,1\n` +
    `Style: Mono,DejaVu Sans Mono,54,${accBGR},&H00000000,${outline},&H00000000,1,0,0,0,100,100,0,0,1,3,0,5,80,80,0,1\n` +
    `Style: Brand,${FONT},38,${brandCol},&H00000000,${outline},&H00000000,1,0,0,0,100,100,1,0,1,2,0,2,60,60,64,1\n\n` +
    `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  const lines = [];

  // Kicker (nhan nho phia tren) - luon hien khi co.
  if (scene.kicker) {
    lines.push(`Dialogue: 1,${assTime(0)},${end},Kicker,,0,0,0,,{\\pos(540,690)\\an5\\fad(140,0)}${assText(scene.kicker).toUpperCase()}`);
  }

  // KHOI GIUA: component (neu render duoc) HOAC tieu de (co chuyen dong + glow).
  const compLines = scene.component ? componentDialogues(scene.component, { accent, ink, sub, accBGR, subCol, primary, outline, end, light: opts.light }) : null;
  if (compLines && compLines.length) {
    lines.push(...compLines);
  } else if (scene.title) {
    const ent = titleEntrance(scene.motion);
    // Lop GLOW mau accent (mo, ban trong) DUOI tieu de -> quang sang mem quanh chu.
    lines.push(`Dialogue: 0,${assTime(0)},${end},Title,,0,0,0,,{\\pos(540,900)\\an5\\1c${accBGR}\\3a&HFF&\\bord0\\blur20\\alpha&H5A&${ent}}${assText(scene.title)}`);
    // Tieu de sac net tren cung.
    lines.push(`Dialogue: 2,${assTime(0)},${end},Title,,0,0,0,,{\\pos(540,900)\\an5${ent}}${assText(scene.title)}`);
  }

  // Karaoke caption: chia CHUNK 4 tu; moi chunk "NAY" (\fscx88->100) + \k per tu.
  const words = String(scene.caption || "").trim().split(/\s+/).filter(Boolean);
  if (words.length) {
    const per = speak / words.length;
    const kcs = Math.max(6, Math.round(per * 100));
    for (let c = 0; c * 4 < words.length; c++) {
      const chunk = words.slice(c * 4, c * 4 + 4);
      const isLast = c * 4 + 4 >= words.length;
      const st = c * 4 * per;
      const en = isLast ? sec : (c * 4 + chunk.length) * per;
      const kar = chunk.map((w) => `{\\k${kcs}}${assText(w)}`).join(" ");
      lines.push(`Dialogue: 3,${assTime(st)},${assTime(en)},Cap,,0,0,0,,{\\pos(540,1580)\\an5\\fscx88\\fscy88\\t(0,140,\\fscx100\\fscy100)\\fad(90,0)}${kar}`);
    }
  }

  // Watermark thuong hieu (goc duoi)
  if (opts.brand) {
    lines.push(`Dialogue: 1,${assTime(0)},${end},Brand,,0,0,0,,{\\an2}${assText(opts.brand)}`);
  }

  return head + lines.join("\n") + "\n";
}
