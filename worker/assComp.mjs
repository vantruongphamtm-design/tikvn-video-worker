// Render COMPONENT so lieu thanh ASS/libass cho che do NHANH (ffmpeg) - VE HINH VECTOR THAT
// (thanh bo goc, vong ring, the KPI co vien, cot so sanh, chip tick, pie) trong CUNG luot burn phu de
// -> giu scene "bieu do" ma KHONG can Chrome va KHONG them thoi gian render (do speedtest: ~0%).
// Tra ve mang chuoi Dialogue (Layer 1=hinh, 2=chu) hoac null (data rong -> canh hien tieu de).
import { assColor, assText } from "./assSub.mjs";

const CX = 540;   // tam ngang khung 1080
const CY = 1010;  // tam doc vung component (giua kicker ~690 va caption ~1580)

const str = (x) => String(x ?? "").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const R = (n) => Math.round(Number(n) || 0);
const ahex = (a) => Math.max(0, Math.min(255, Math.round(a))).toString(16).padStart(2, "0").toUpperCase();
const SOLID = (hex) => assColor(hex, 0); // luon dung mau DAC; do trong do \1a quyet dinh

// Ve hinh (toa do TUYET DOI, an7 + pos(0,0)). alpha 0=dac..255=trong. opt.bord => vien.
function shape(draw, fill, alpha, layer, end, opt = {}) {
  const { bord = 0, bordCol = "&H00FFFFFF&", bordA = 40, extra = "" } = opt;
  const b = bord > 0 ? `\\bord${bord}\\3c${bordCol}\\3a&H${ahex(bordA)}&` : `\\bord0`;
  return `Dialogue: ${layer},0:00:00.00,${end},Comp,,0,0,0,,{\\an7\\pos(0,0)\\p1\\1c${fill}\\1a&H${ahex(alpha)}&${b}\\shad0\\fad(160,0)${extra}}${draw}{\\p0}`;
}
// Chu tai (x,y). an: 5=giua,4=trai,6=phai. Comp style co outline -> doc tot tren anh.
function text(x, y, txt, size, col, bold, end, an = 5, extra = "") {
  return `Dialogue: 2,0:00:00.00,${end},Comp,,0,0,0,,{\\an${an}\\pos(${R(x)},${R(y)})\\fs${R(size)}\\1c${col}\\b${bold ? 1 : 0}\\shad0\\fad(160,0)${extra}}${assText(txt)}`;
}

// Chu nhat bo goc (toa do tuyet doi). r = ban kinh goc.
function rrect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const k = 0.5523 * r, x2 = x + w, y2 = y + h;
  return (
    `m ${R(x + r)} ${R(y)} l ${R(x2 - r)} ${R(y)} ` +
    `b ${R(x2 - r + k)} ${R(y)} ${R(x2)} ${R(y + r - k)} ${R(x2)} ${R(y + r)} ` +
    `l ${R(x2)} ${R(y2 - r)} b ${R(x2)} ${R(y2 - r + k)} ${R(x2 - r + k)} ${R(y2)} ${R(x2 - r)} ${R(y2)} ` +
    `l ${R(x + r)} ${R(y2)} b ${R(x + r - k)} ${R(y2)} ${R(x)} ${R(y2 - r + k)} ${R(x)} ${R(y2 - r)} ` +
    `l ${R(x)} ${R(y + r)} b ${R(x)} ${R(y + r - k)} ${R(x + r - k)} ${R(y)} ${R(x + r)} ${R(y)}`
  );
}

// Cung tron / vanh khuyen (0deg=dinh tren, thuan chieu kim).
function pt(cx, cy, rad, deg) { const a = (deg * Math.PI) / 180; return [cx + rad * Math.sin(a), cy - rad * Math.cos(a)]; }
function arc(cx, cy, rad, d0, d1) {
  let out = "", a0 = d0; const dir = d1 >= d0 ? 1 : -1;
  while (Math.abs(d1 - a0) > 0.01) {
    const step = dir * Math.min(90, Math.abs(d1 - a0)), a1 = a0 + step;
    const t = (4 / 3) * Math.tan((step * Math.PI) / 180 / 4);
    const [x0, y0] = pt(cx, cy, rad, a0), [x1, y1] = pt(cx, cy, rad, a1);
    const r0 = (a0 * Math.PI) / 180, r1 = (a1 * Math.PI) / 180;
    out += ` b ${R(x0 + t * rad * Math.cos(r0))} ${R(y0 + t * rad * Math.sin(r0))} ${R(x1 - t * rad * Math.cos(r1))} ${R(y1 - t * rad * Math.sin(r1))} ${R(x1)} ${R(y1)}`;
    a0 = a1;
  }
  return out;
}
function ringSector(cx, cy, RO, RI, d0, d1) {
  const [ox, oy] = pt(cx, cy, RO, d0), [ix, iy] = pt(cx, cy, RI, d1);
  return `m ${R(ox)} ${R(oy)}` + arc(cx, cy, RO, d0, d1) + ` l ${R(ix)} ${R(iy)}` + arc(cx, cy, RI, d1, d0);
}

export function componentDialogues(component, opts) {
  const type = component && component.type;
  const d = (component && component.data) || {};
  if (!type) return null;

  const light = !!opts.light;
  const acc = opts.accBGR;               // accent (dac)
  const ink = assColor(opts.ink, 0);     // chu chinh (trang tren toi / den tren paper)
  const sub = opts.subCol;               // chu phu
  const white = SOLID("#ffffff");
  const end = opts.end;
  const out = [];

  // Mau + do trong dung chung (doc tren nen toi / sang / anh):
  const trackCol = light ? SOLID("#241f1b") : white;      const trackA = 205;      // thanh nen mo
  const panelCol = light ? white : SOLID("#0c1526");       const panelA = light ? 36 : 96; // the: paper trang gan dac / toi frosted
  const edgeCol = light ? SOLID("#c9b7a6") : white;        const edgeA = light ? 120 : 150; // vien mong dinh nghia the

  const cardOf = (x, y, w, h, r) => shape(rrect(x, y, w, h, r), panelCol, panelA, 1, end, { bord: 2.4, bordCol: edgeCol, bordA: edgeA });

  // Thanh ngang bo goc: nhan trai + gia tri phai (tren) + track + fill.
  const barRows = (rows, unit = "") => {
    const items = rows.slice(0, 5);
    if (!items.length) return null;
    const barW = 760, barH = 40, labelH = 54, gap = 34, x0 = CX - barW / 2;
    const totalH = items.length * (labelH + barH + gap) - gap;
    let y = CY - totalH / 2;
    for (const it of items) {
      out.push(text(x0, y + labelH / 2, clip(str(it.label), 22), 46, ink, true, end, 4));
      out.push(text(x0 + barW, y + labelH / 2, `${str(it.v)}${unit}`, 46, acc, true, end, 6));
      y += labelH;
      out.push(shape(rrect(x0, y, barW, barH, barH / 2), trackCol, trackA, 1, end));
      const fw = Math.max(barH, barW * Math.max(0, Math.min(1, it.p)));
      out.push(shape(rrect(x0, y, fw, barH, barH / 2), acc, 0, 1, end));
      y += barH + gap;
    }
    return out;
  };

  // The KPI: nen bo goc co vien + vach accent trai + nhan trai + gia tri to phai.
  const cards = (cells) => {
    const items = cells.slice(0, 4).filter((c) => str(c.v) || str(c.l));
    if (!items.length) return null;
    const cardW = 824, cardH = 126, gap = 26, x0 = CX - cardW / 2;
    const totalH = items.length * (cardH + gap) - gap;
    let y = CY - totalH / 2;
    for (const c of items) {
      out.push(cardOf(x0, y, cardW, cardH, 24));
      out.push(shape(rrect(x0 + 14, y + 24, 10, cardH - 48, 5), acc, 0, 1, end)); // vach mau trai
      out.push(text(x0 + 48, y + cardH / 2, clip(str(c.l), 26), 46, ink, true, end, 4));
      out.push(text(x0 + cardW - 40, y + cardH / 2, str(c.v), 70, acc, true, end, 6));
      y += cardH + gap;
    }
    return out;
  };

  switch (type) {
    case "bigNumber":
    case "gauge":
    case "donut": {
      const pctRaw = d.pct != null ? Number(d.pct) : (typeof d.value === "string" && d.value.includes("%") ? parseFloat(d.value) : null);
      const center = type === "bigNumber" && d.value != null ? str(d.value) : (d.pct != null ? `${d.pct}%` : str(d.value));
      if (!str(center)) return null;
      const cy = CY - 40, hasRing = pctRaw != null && isFinite(pctRaw);
      if (hasRing) {
        out.push(shape(ringSector(CX, cy, 220, 176, 0, 359.9), trackCol, trackA, 1, end));
        out.push(shape(ringSector(CX, cy, 220, 176, 0, Math.max(5, 360 * pctRaw / 100)), acc, 0, 1, end));
      }
      const cs = hasRing ? Math.min(150, Math.max(80, Math.round(900 / Math.max(2, center.length)))) : Math.min(210, Math.max(96, Math.round(1560 / Math.max(3, center.length))));
      out.push(text(CX, cy, center, cs, acc, true, end, 5));
      if (d.label) out.push(text(CX, cy + (hasRing ? 262 : 152), clip(str(d.label), 30), 46, sub, false, end, 5));
      return out;
    }

    case "bars":
    case "ranking": {
      const items = (Array.isArray(d.items) ? d.items : []).map((x) => ({ label: x.label, v: x.val })).filter((x) => str(x.label));
      const max = Math.max(1, ...items.map((x) => Number(x.v) || 0));
      return barRows(items.map((x) => ({ ...x, p: (Number(x.v) || 0) / max })));
    }
    case "progress":
    case "funnel": {
      const src = Array.isArray(d.items) ? d.items : Array.isArray(d.rows) ? d.rows : [];
      const items = src.map((x) => ({ label: x.label, v: x.pct, p: (Number(x.pct) || 0) / 100 })).filter((x) => str(x.label));
      return barRows(items, "%");
    }

    case "kpi":
    case "statCards":
      return cards((Array.isArray(d.cells) ? d.cells : Array.isArray(d.cards) ? d.cards : []).map((c) => ({ v: c.v, l: c.l })));
    case "statPanel":
      return cards((Array.isArray(d.rows) ? d.rows : []).map((r) => ({ v: str(r.value) + (r.big ? " " + str(r.big) : ""), l: r.label })));

    case "list": {
      const items = (Array.isArray(d.items) ? d.items : []).slice(0, 6).map(str).filter(Boolean);
      if (!items.length) return null;
      const numbered = d.type === "num";
      const chip = 56, gap = 40, rowH = chip + gap, textX = CX - 300;
      const totalH = items.length * rowH - gap;
      let y = CY - totalH / 2;
      items.forEach((t, i) => {
        const cx = textX - 34;
        out.push(shape(rrect(cx - chip, y, chip, chip, numbered ? 14 : chip / 2), acc, 0, 1, end));
        out.push(text(cx - chip / 2, y + chip / 2, numbered ? String(i + 1) : "✓", numbered ? 40 : 42, white, true, end, 5));
        out.push(text(textX, y + chip / 2, clip(t, 34), 50, ink, true, end, 4));
        y += rowH;
      });
      return out;
    }

    case "compare": {
      const a = d.a || {}, b = d.b || {};
      const colW = 400, colH = 452, gapX = 44, colY = CY - colH / 2 + 24;
      const lx = CX - gapX / 2 - colW, rx = CX + gapX / 2;
      const col = (x, name, items, headCol) => {
        out.push(cardOf(x, colY, colW, colH, 28));
        out.push(shape(rrect(x, colY, colW, 78, 28), headCol, light ? 150 : 60, 1, end)); // header nen mau
        out.push(text(x + colW / 2, colY + 42, clip(str(name), 16), 48, light ? white : headCol === acc ? acc : ink, true, end, 5));
        let yy = colY + 116;
        (Array.isArray(items) ? items : []).slice(0, 4).forEach((t) => {
          out.push(text(x + 30, yy, "• " + clip(str(t), 22), 38, ink, false, end, 4));
          yy += 74;
        });
      };
      col(lx, a.name || "A", a.items, acc);
      col(rx, b.name || "B", b.items, SOLID("#94a3b8"));
      out.push(shape(rrect(CX - 40, CY + 4, 80, 80, 40), panelCol, Math.max(0, panelA - 40), 1, end, { bord: 2.4, bordCol: edgeCol, bordA: edgeA }));
      out.push(text(CX, CY + 44, "VS", 44, acc, true, end, 5));
      return out;
    }

    case "quote": {
      const q = str(d.text || d.quote);
      if (!q) return null;
      out.push(text(CX, CY - 210, "“", 210, acc, true, end, 5));
      const size = q.length > 90 ? 52 : q.length > 55 ? 60 : 68;
      out.push(text(CX, CY, `${q}`, size, ink, true, end, 5, "\\i1"));
      out.push(shape(rrect(CX - 60, CY + 148, 120, 6, 3), acc, 0, 1, end));
      if (d.author) out.push(text(CX, CY + 208, `— ${str(d.author)}`, 42, sub, false, end, 5));
      return out;
    }

    case "pie": {
      const segs = (Array.isArray(d.segs) ? d.segs : []).map((s) => ({ label: str(s.label), pct: Number(s.pct) || 0 })).filter((s) => s.pct > 0).slice(0, 6);
      if (!segs.length) return null;
      const total = segs.reduce((a, s) => a + s.pct, 0) || 100;
      const cy = CY - 130, RO = 196;
      const cols = [acc, SOLID("#38bdf8"), SOLID("#a3e635"), SOLID("#f472b6"), SOLID("#fbbf24"), SOLID("#94a3b8")];
      let deg = 0;
      segs.forEach((s, i) => {
        const span = (360 * s.pct) / total;
        out.push(shape(`m ${CX} ${cy} l ${R(pt(CX, cy, RO, deg)[0])} ${R(pt(CX, cy, RO, deg)[1])}` + arc(CX, cy, RO, deg, deg + span) + ` l ${CX} ${cy}`, cols[i % cols.length], 0, 1, end));
        deg += span;
      });
      let ly = CY + 150;
      segs.forEach((s, i) => {
        out.push(shape(rrect(CX - 250, ly - 20, 36, 36, 9), cols[i % cols.length], 0, 2, end));
        out.push(text(CX - 196, ly, `${clip(s.label, 22)}  ${s.pct}%`, 42, ink, true, end, 4));
        ly += 58;
      });
      return out;
    }

    case "tags": {
      const tags = (Array.isArray(d.tags) ? d.tags : []).slice(0, 8).map(str).filter(Boolean);
      if (!tags.length) return null;
      const mid = tags.length > 4 ? Math.ceil(tags.length / 2) : tags.length;
      const lines = [tags.slice(0, mid).join("    "), tags.slice(mid).join("    ")].filter(Boolean);
      let y = CY - ((lines.length - 1) * 66) / 2;
      lines.forEach((ln) => { out.push(text(CX, y, ln, 56, acc, true, end, 5)); y += 66; });
      return out;
    }
    case "timeline":
    case "roadmap": {
      const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
      if (!steps.length) return null;
      const rowH = 96;
      let y = CY - (steps.length * rowH) / 2 + rowH / 2;
      steps.forEach((s, i) => {
        const label = type === "timeline" ? `${str(s.time)} · ${str(s.text)}` : `${i + 1}. ${str(s.label)}${s.sub ? " — " + str(s.sub) : ""}`;
        out.push(shape(rrect(CX - 380, y - 20, 40, 40, type === "timeline" ? 20 : 10), acc, 0, 1, end));
        out.push(text(CX - 320, y, clip(label, 34), 48, ink, true, end, 4));
        y += rowH;
      });
      return out;
    }
    case "badge": {
      const t = str(d.title);
      if (!t) return null;
      out.push(cardOf(CX - 340, CY - 92, 680, 184, 30));
      out.push(text(CX, CY - 22, "🏆 " + clip(t, 24), 64, acc, true, end, 5));
      if (d.sub) out.push(text(CX, CY + 48, clip(str(d.sub), 40), 42, sub, false, end, 5));
      return out;
    }
    default:
      return null;
  }
}
