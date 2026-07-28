// Render COMPONENT so lieu thanh cac dong ASS (chu co style + thanh block). Dung cho che do NHANH (ffmpeg)
// -> giu duoc scene "bieu do/so lieu" ma khong can Chrome. Loai vong tron (gauge/donut/pie) ha ve so/legend.
// Tra ve mang chuoi Dialogue (Layer 1, quanh giua man) hoac null (data rong -> canh se hien tieu de).
import { assColor, assTime, assText } from "./assSub.mjs";

const str = (x) => String(x ?? "").trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const pad = (s, n) => { s = clip(str(s), n); return s + " ".repeat(Math.max(0, n - s.length)); };
// Thanh block: so o ti le val/max (1..cells).
function bar(val, max, cells = 15) {
  const v = Math.max(0, Number(val) || 0);
  const m = Math.max(1, Number(max) || 1);
  return "█".repeat(Math.max(1, Math.min(cells, Math.round((cells * v) / m))));
}

// Stack cac dong theo chieu doc, can giua o cy. items: [{txt,size,col,bold,mono,gap}].
function stack(items, opts, cy = 980) {
  items = items.filter((it) => it && str(it.txt));
  if (!items.length) return null;
  const heights = items.map((it) => (it.size || 46) * (it.gap || 1.42));
  const total = heights.reduce((a, b) => a + b, 0);
  let y = cy - total / 2;
  const out = [];
  items.forEach((it, i) => {
    const size = it.size || 46;
    const yy = Math.round(y + size * 0.62);
    const col = it.col || opts.subCol;
    const style = it.mono ? "Mono" : "Comp";
    const st = assTime(Math.min(0.5, i * 0.06));
    out.push(`Dialogue: 1,${st},${opts.end},${style},,0,0,0,,{\\pos(540,${yy})\\an5\\fs${size}\\1c${col}\\b${it.bold ? 1 : 0}\\fad(150,0)}${assText(it.txt)}`);
    y += heights[i];
  });
  return out;
}

export function componentDialogues(component, opts) {
  const type = component && component.type;
  const d = (component && component.data) || {};
  const acc = opts.accBGR;   // mau accent (ASS BGR)
  const ink = assColor(opts.ink, 0);
  const sub = opts.subCol;
  if (!type) return null;

  // Big number: gia tri to + nhan. gauge/donut ha ve day (them %).
  const bigNum = (value, label) => {
    const v = str(value);
    if (!v) return null;
    const size = Math.min(200, Math.max(64, Math.round(1500 / Math.max(3, v.length))));
    return stack([{ txt: v, size, col: acc, bold: true }, label ? { txt: label, size: 46, col: sub } : null].filter(Boolean), opts);
  };

  switch (type) {
    case "bigNumber":
      return bigNum(d.value, d.label);
    case "gauge":
      return bigNum(d.value != null ? d.value : `${d.pct ?? ""}%`, d.label);
    case "donut":
      return bigNum(`${d.pct ?? d.value ?? ""}%`, d.label);

    case "bars":
    case "ranking": {
      const items = (Array.isArray(d.items) ? d.items : []).slice(0, 5);
      const max = Math.max(1, ...items.map((x) => Number(x.val) || 0));
      const rows = items.map((it) => ({ txt: `${pad(it.label, 11)} ${bar(it.val, max)} ${str(it.val)}`, size: 46, col: acc, bold: true, mono: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    case "progress":
    case "funnel": {
      const items = (Array.isArray(d.items) ? d.items : Array.isArray(d.rows) ? d.rows : []).slice(0, 5);
      const rows = items.map((it) => ({ txt: `${pad(it.label, 11)} ${bar(it.pct, 100)} ${str(it.pct)}%`, size: 46, col: acc, bold: true, mono: true, gap: 1.5 }));
      return stack(rows, opts);
    }

    case "list": {
      const items = (Array.isArray(d.items) ? d.items : []).slice(0, 6);
      const numbered = d.type === "num";
      const rows = items.map((t, i) => ({ txt: `${numbered ? i + 1 + "." : "✓"} ${str(t)}`, size: 48, col: ink, bold: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    case "tags": {
      const tags = (Array.isArray(d.tags) ? d.tags : []).slice(0, 8).map(str);
      if (!tags.length) return null;
      // chia 2 dong neu nhieu
      const mid = Math.ceil(tags.length / (tags.length > 4 ? 2 : 1));
      const l1 = tags.slice(0, mid).join("   ");
      const l2 = tags.slice(mid).join("   ");
      return stack([{ txt: l1, size: 54, col: acc, bold: true }, l2 ? { txt: l2, size: 54, col: acc, bold: true } : null].filter(Boolean), opts);
    }

    case "kpi":
    case "statCards": {
      const cells = (Array.isArray(d.cells) ? d.cells : Array.isArray(d.cards) ? d.cards : []).slice(0, 4);
      const rows = cells.map((c) => ({ txt: `${str(c.v)}  ${str(c.l)}`, size: 62, col: acc, bold: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    case "statPanel": {
      const rows = (Array.isArray(d.rows) ? d.rows : []).slice(0, 4);
      const out = rows.map((r) => ({ txt: `${str(r.label)}: ${str(r.value)}${r.big ? "  " + str(r.big) : ""}`, size: 50, col: acc, bold: true, gap: 1.5 }));
      return stack(out, opts);
    }
    case "compare": {
      const a = d.a || {}, b = d.b || {};
      const items = [
        { txt: `${str(a.name) || "A"}   vs   ${str(b.name) || "B"}`, size: 60, col: acc, bold: true, gap: 1.6 },
        ...(Array.isArray(a.items) ? a.items : []).slice(0, 3).map((t) => ({ txt: `${str(a.name) || "A"} · ${str(t)}`, size: 40, col: ink })),
        ...(Array.isArray(b.items) ? b.items : []).slice(0, 3).map((t) => ({ txt: `${str(b.name) || "B"} · ${str(t)}`, size: 40, col: sub })),
      ];
      return stack(items, opts);
    }

    case "quote": {
      const q = str(d.text || d.quote);
      if (!q) return null;
      const size = q.length > 60 ? 52 : 64;
      return stack([{ txt: `“${q}”`, size, col: ink, bold: true, gap: 1.35 }, d.author ? { txt: `— ${str(d.author)}`, size: 40, col: sub } : null].filter(Boolean), opts);
    }
    case "timeline": {
      const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
      const rows = steps.map((s) => ({ txt: `${str(s.time)} · ${str(s.text)}`, size: 44, col: ink, bold: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    case "roadmap": {
      const steps = (Array.isArray(d.steps) ? d.steps : []).slice(0, 5);
      const rows = steps.map((s, i) => ({ txt: `${i + 1}. ${str(s.label)}${s.sub ? " — " + str(s.sub) : ""}`, size: 44, col: ink, bold: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    case "badge": {
      const t = str(d.title);
      if (!t) return null;
      return stack([{ txt: `🏆 ${t}`, size: 66, col: acc, bold: true }, d.sub ? { txt: str(d.sub), size: 40, col: sub } : null].filter(Boolean), opts);
    }
    case "terminal": {
      const ls = (Array.isArray(d.lines) ? d.lines : []).slice(0, 6);
      const rows = ls.map((ln) => ({ txt: str(ln.t), size: 40, col: acc, bold: true, mono: true, gap: 1.55 }));
      return stack(rows, opts);
    }
    case "nodeBurst":
      return d.center ? stack([{ txt: str(d.center), size: 72, col: acc, bold: true }], opts) : null;
    case "pie": {
      const segs = (Array.isArray(d.segs) ? d.segs : []).slice(0, 6);
      const rows = segs.map((s) => ({ txt: `● ${str(s.label)}  ${str(s.pct)}%`, size: 48, col: ink, bold: true, gap: 1.5 }));
      return stack(rows, opts);
    }
    default:
      return null; // loai la -> canh hien tieu de
  }
}
