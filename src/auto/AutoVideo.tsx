import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Img,
  type CalculateMetadataFunction,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/BeVietnamPro";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
});

// ---- Kieu du lieu scene plan (LLM xuat ra cai nay) ----
export type CompSpec = { type: string; data?: Record<string, unknown> };
export type SceneSpec = {
  sec: number; // do dai canh (giay) - lay tu do dai audio TTS
  industry: string; // id nganh (theme)
  kicker?: string; // nhan nho tren tieu de
  title?: string; // tieu de lon giua khung (\n xuong dong)
  caption?: string; // phu de karaoke (tu IN HOA se to mau accent)
  motion?: string; // id chuyen dong cho tieu de
  image?: string; // url anh nen (neu co)
  component?: CompSpec; // chen 1 thanh phan truc quan thay tieu de
};
export type AutoVideoProps = { scenes: SceneSpec[]; brand?: string; audio?: string };

const FPS = 30;

// Palette xoay theo canh -> moi canh 1 mau khac nhau (het don dieu). Nen toi + accent tuoi.
const SCENE_PALETTE: { g: [string, string]; acc: string }[] = [
  { g: ["#0f223f", "#060c16"], acc: "#fb923c" }, // navy / orange
  { g: ["#0b2018", "#04120b"], acc: "#34d399" }, // forest / green
  { g: ["#2a0d18", "#0f0409"], acc: "#f472b6" }, // maroon / pink
  { g: ["#1a1140", "#0a0620"], acc: "#a78bfa" }, // indigo / violet
  { g: ["#0c2a2f", "#041214"], acc: "#38bdf8" }, // teal / cyan
  { g: ["#3a1c08", "#160a03"], acc: "#fbbf24" }, // brown / amber
  { g: ["#301018", "#120407"], acc: "#f87171" }, // wine / red
  { g: ["#12325a", "#0a1526"], acc: "#e9c877" }, // blue / gold
];

export const autoCalcMetadata: CalculateMetadataFunction<AutoVideoProps> = ({ props }) => {
  const durationInFrames = Math.max(
    1,
    props.scenes.reduce((a, s) => a + Math.round((s.sec || 3) * FPS), 0)
  );
  return { durationInFrames, fps: FPS, width: 1080, height: 1920 };
};

const ease = (p: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);

/** Style vao cho tieu de theo motion (MVP: backbone; con lai fallback fade). */
function motionStyle(motion: string | undefined, frame: number): React.CSSProperties {
  const p = ease(frame / (0.5 * FPS));
  switch (motion) {
    case "rise":
      return { opacity: p, transform: `translateY(${(1 - p) * 70}px)` };
    case "drop":
      return { opacity: p, transform: `translateY(${(1 - p) * -70}px)` };
    case "slideL":
      return { opacity: p, transform: `translateX(${(1 - p) * -100}px)` };
    case "slideR":
      return { opacity: p, transform: `translateX(${(1 - p) * 100}px)` };
    case "zoomin":
      return { opacity: p, transform: `scale(${0.7 + p * 0.3})` };
    case "zoomout":
      return { opacity: p, transform: `scale(${1.3 - p * 0.3})` };
    case "pop": {
      const s = interpolate(frame, [0, 8, 14, 20], [0.7, 1.08, 0.98, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `scale(${s})` };
    }
    case "skewin":
      return { opacity: p, transform: `skewX(${(1 - p) * 12}deg) translateX(${(1 - p) * 40}px)` };
    case "bounce": {
      const y = interpolate(frame, [0, 6, 12, 18, 24], [-90, 14, -8, 4, 0], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `translateY(${y}px)` };
    }
    case "flipy":
      return { opacity: p, transform: `perspective(900px) rotateY(${(1 - p) * 90}deg)` };
    case "flipx":
      return { opacity: p, transform: `perspective(900px) rotateX(${(1 - p) * 90}deg)` };
    case "blurin":
      return { opacity: p, filter: `blur(${(1 - p) * 16}px)` };
    case "expand":
      return { opacity: p, transform: `scaleX(${0.45 + p * 0.55})` };
    case "rotatein":
      return { opacity: p, transform: `rotate(${(1 - p) * -14}deg) scale(${0.8 + p * 0.2})` };
    case "punch": {
      const s = interpolate(frame, [0, 5, 10], [1.6, 0.95, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 4), transform: `scale(${s})` };
    }
    case "flyin":
      return { opacity: p, transform: `translate(${(1 - p) * -80}px, ${(1 - p) * 60}px)` };
    case "zoomspin":
      return { opacity: p, transform: `scale(${0.6 + p * 0.4}) rotate(${(1 - p) * -20}deg)` };
    case "iris":
      return { opacity: p, transform: `scale(${0.2 + p * 0.8})` };
    case "swing": {
      const a = interpolate(frame, [0, 8, 16, 24, 32], [-9, 5, -3, 2, 0], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `rotate(${a}deg)` };
    }
    case "slideT":
      return { opacity: p, transform: `translateY(${(1 - p) * -130}px)` };
    case "slideB":
      return { opacity: p, transform: `translateY(${(1 - p) * 130}px)` };
    case "glideL":
      return { opacity: p, transform: `translateX(${(1 - p) * -150}px) scale(${0.94 + p * 0.06})` };
    case "glideR":
      return { opacity: p, transform: `translateX(${(1 - p) * 150}px) scale(${0.94 + p * 0.06})` };
    case "spinin":
      return { opacity: p, transform: `rotate(${(1 - p) * 200}deg) scale(${0.35 + p * 0.65})` };
    case "wobble": {
      const a = interpolate(frame, [0, 6, 12, 18, 24, 30], [0, -7, 5, -3, 2, 0], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `rotate(${a}deg) scale(${0.9 + ease(frame / 8) * 0.1})` };
    }
    case "squeeze": {
      const sx = interpolate(frame, [0, 8, 16], [1.6, 0.85, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 5), transform: `scaleX(${sx})` };
    }
    case "riseblur":
      return { opacity: p, filter: `blur(${(1 - p) * 12}px)`, transform: `translateY(${(1 - p) * 60}px)` };
    case "zoomblur":
      return { opacity: p, filter: `blur(${(1 - p) * 10}px)`, transform: `scale(${1.28 - p * 0.28})` };
    case "slamdown": {
      const y = interpolate(frame, [0, 7, 12, 17], [-170, 20, -8, 0], { extrapolateRight: "clamp" });
      const s = interpolate(frame, [0, 12], [1.15, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 5), transform: `translateY(${y}px) scale(${s})` };
    }
    case "flip3d":
      return { opacity: p, transform: `perspective(900px) rotateX(${(1 - p) * -90}deg)` };
    case "tiltin":
      return { opacity: p, transform: `perspective(900px) rotateY(${(1 - p) * 35}deg) rotateX(${(1 - p) * 10}deg)` };
    case "shake": {
      const x = Math.sin(frame * 1.6) * (1 - Math.min(1, frame / 12)) * 20;
      return { opacity: ease(frame / 5), transform: `translateX(${x}px)` };
    }
    case "neon": {
      const o = frame < 14 ? (frame % 4 < 2 ? 0.45 : 1) : 1;
      return { opacity: o * ease(frame / 3) };
    }
    case "typein":
      return { opacity: 1, clipPath: `inset(0 ${(1 - ease(frame / (0.7 * FPS))) * 100}% 0 0)` };
    case "unfoldY":
      return { opacity: p, transform: `scaleY(${0.1 + p * 0.9})`, transformOrigin: "top" };
    case "popL": {
      const s = interpolate(frame, [0, 8, 14], [0.7, 1.06, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `scale(${s}) translateX(${(1 - ease(frame / 10)) * -55}px)` };
    }
    case "popR": {
      const s = interpolate(frame, [0, 8, 14], [0.7, 1.06, 1], { extrapolateRight: "clamp" });
      return { opacity: ease(frame / 6), transform: `scale(${s}) translateX(${(1 - ease(frame / 10)) * 55}px)` };
    }
    default:
      return { opacity: p };
  }
}

/** Phu de karaoke kieu Submagic: mot luc chi hien 1 CUM ~4 tu, tu DANG DOC to mau
 *  accent (cac tu khac trang), cum doi lien tuc theo giong. Cum moi pop vao. */
const CHUNK = 4;
const Caption: React.FC<{ text: string; acc: string }> = ({ text, acc }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = text.split(" ").filter(Boolean);
  if (words.length === 0) return null;
  const readEnd = Math.max(1, durationInFrames * 0.94);
  const spokenWord = Math.min(words.length - 0.001, (frame / readEnd) * words.length);
  const cur = Math.floor(spokenWord); // tu dang doc (chi so toan cuc)
  const chunkIdx = Math.floor(cur / CHUNK);
  const start = chunkIdx * CHUNK;
  const chunk = words.slice(start, start + CHUNK);
  const chunkStartFrame = (start / words.length) * readEnd; // luc cum nay bat dau
  const appear = ease((frame - chunkStartFrame) / (0.14 * FPS));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 250 }}>
      <div
        style={{
          maxWidth: 940,
          textAlign: "center",
          fontSize: 64,
          fontWeight: 800,
          lineHeight: 1.18,
          textShadow: "0 4px 20px rgba(0,0,0,.95), 0 0 8px rgba(0,0,0,.7)",
          opacity: appear,
          transform: `translateY(${(1 - appear) * 16}px) scale(${0.95 + appear * 0.05})`,
        }}
      >
        {chunk.map((w, i) => {
          const gi = start + i;
          const isCur = gi === cur;
          const c = w.replace(/[.,!?:;]/g, "");
          const kw = c.length > 1 && c === c.toLocaleUpperCase("vi") && /[A-Za-zÀ-Ỹ]/.test(c);
          return (
            <span
              key={gi}
              style={{
                display: "inline-block",
                // Padding hai ben (khong dung margin) de khoang cach luon giu duoc,
                // khong bi chu IN HOA/dam de dinh vao nhau.
                padding: "0 0.14em",
                color: isCur ? acc : "#fff",
                fontWeight: kw ? 900 : 800,
                // Nhan chu dang doc bang glow + nhich len, KHONG phong to ngang
                // (scale ngang lam chu rong de len khoang cach -> dinh chu).
                transform: isCur ? "translateY(-3px)" : "none",
                textShadow: isCur
                  ? `0 0 22px ${acc}, 0 0 8px ${acc}, 0 4px 20px rgba(0,0,0,.95)`
                  : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---- Vai thanh phan truc quan (MVP; mo rong dan toi 100) ----
const CompView: React.FC<{ spec: CompSpec; acc: string }> = ({ spec, acc }) => {
  const frame = useCurrentFrame();
  const grow = ease(frame / (0.9 * FPS));
  const d = (spec.data || {}) as Record<string, unknown>;

  if (spec.type === "bigNumber") {
    const value = String(d.value ?? "");
    const label = String(d.label ?? "");
    const fs = Math.min(300, Math.round(1500 / Math.max(4, value.length)));
    return (
      <div style={{ textAlign: "center", opacity: grow, transform: `scale(${0.85 + grow * 0.15})` }}>
        <div style={{ fontFamily: "'Arial Narrow', sans-serif", fontWeight: 900, fontSize: fs, lineHeight: 0.9, color: acc }}>{value}</div>
        {label ? <div style={{ marginTop: 12, fontSize: 40, color: "#cfe" }}>{label}</div> : null}
      </div>
    );
  }

  if (spec.type === "bars") {
    const items = (d.items as { label: string; val: number; color?: string }[]) || [];
    return (
      <div style={{ width: 720 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24, height: 420 }}>
          {items.map((it, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ color: "#eaf0f8", fontWeight: 800, fontSize: 30, marginBottom: 8 }}>{it.val}</div>
              <div style={{ width: "100%", height: `${grow * it.val}%`, background: `linear-gradient(${it.color || acc}, transparent)`, borderRadius: "12px 12px 0 0" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
          {items.map((it, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", color: "#9fb", fontSize: 26 }}>{it.label}</div>
          ))}
        </div>
      </div>
    );
  }

  if (spec.type === "list") {
    const items = (d.items as string[]) || [];
    const numbered = d.type === "num";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: 760 }}>
        {items.map((t, i) => {
          const ip = ease((frame - i * 8) / 12);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, opacity: ip, transform: `translateX(${(1 - ip) * 40}px)` }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: numbered ? "transparent" : "#16351f", color: numbered ? acc : "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: numbered ? 48 : 34, fontFamily: numbered ? "'Arial Narrow', sans-serif" : undefined }}>
                {numbered ? i + 1 : "✓"}
              </div>
              <div style={{ fontSize: 42, fontWeight: 700, color: "#fff" }}>{t}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (spec.type === "kpi") {
    const cells = (d.cells as { v: string; l: string; color?: string }[]) || [];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: 720, opacity: grow }}>
        {cells.map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,.06)", borderRadius: 24, padding: 28, textAlign: "center" }}>
            <div style={{ fontFamily: "'Arial Narrow', sans-serif", fontWeight: 900, fontSize: 84, lineHeight: 1, color: c.color || acc }}>{c.v}</div>
            <div style={{ marginTop: 6, fontSize: 30, color: "#cdd" }}>{c.l}</div>
          </div>
        ))}
      </div>
    );
  }

  if (spec.type === "donut") {
    const pct = Math.max(0, Math.min(100, Number(d.pct ?? d.value ?? 70)));
    const deg = Math.round(pct * 3.6 * grow);
    const label = String(d.label ?? "");
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 460, height: 460, borderRadius: "50%", margin: "0 auto", background: `conic-gradient(${acc} ${deg}deg, #1b2436 0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "74%", height: "74%", borderRadius: "50%", background: "#0b1220", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Arial Narrow', sans-serif", fontWeight: 900, fontSize: 130, color: acc }}>{Math.round(pct * grow)}%</div>
        </div>
        {label ? <div style={{ marginTop: 22, fontSize: 38, color: "#cfe" }}>{label}</div> : null}
      </div>
    );
  }

  if (spec.type === "progress") {
    const items = (d.items as { label: string; pct: number; color?: string }[]) || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 30, width: 780 }}>
        {items.map((it, i) => (
          <div key={i}>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{it.label} · {it.pct}%</div>
            <div style={{ height: 34, background: "#1b2436", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${grow * it.pct}%`, background: it.color || acc, borderRadius: 999 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (spec.type === "compare") {
    const a = (d.a as { name: string; items: string[]; color?: string }) || { name: "A", items: [] };
    const b = (d.b as { name: string; items: string[]; color?: string }) || { name: "B", items: [] };
    const Col = (x: { name: string; items: string[]; color?: string }) => (
      <div style={{ flex: 1, background: "rgba(255,255,255,.05)", borderRadius: 28, padding: "34px 24px", textAlign: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 54, color: x.color || acc, marginBottom: 18 }}>{x.name}</div>
        {x.items.map((t, i) => <div key={i} style={{ fontSize: 34, color: "#e6edf5", margin: "10px 0" }}>{t}</div>)}
      </div>
    );
    return <div style={{ display: "flex", gap: 26, width: 900, opacity: grow }}>{Col(a)}{Col(b)}</div>;
  }

  if (spec.type === "ranking") {
    const items = (d.items as { label: string; val: number; color?: string }[]) || [];
    const max = Math.max(1, ...items.map((x) => x.val));
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 860 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 260, fontSize: 34, fontWeight: 700, color: "#fff", textAlign: "right" }}>{it.label}</div>
            <div style={{ flex: 1, height: 56, borderRadius: 999, background: it.color || acc, width: `${(it.val / max) * 100 * grow}%`, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 20, color: "#0a0c11", fontWeight: 900, fontSize: 30 }}>{it.val}</div>
          </div>
        ))}
      </div>
    );
  }

  if (spec.type === "quote") {
    const q = String(d.text ?? d.quote ?? "");
    const author = String(d.author ?? "");
    return (
      <div style={{ maxWidth: 860, textAlign: "center", opacity: grow }}>
        <div style={{ fontSize: 200, lineHeight: 0.5, color: acc, opacity: 0.5, fontFamily: "Georgia, serif" }}>&#8220;</div>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 66, lineHeight: 1.25, color: "#fff" }}>{q}</div>
        {author ? <div style={{ marginTop: 22, fontSize: 38, color: "#cfe" }}>&#8212; {author}</div> : null}
      </div>
    );
  }

  if (spec.type === "statPanel") {
    const rows = (d.rows as { label: string; value: string; big?: string; color?: string }[]) || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 840, opacity: grow }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, background: "rgba(18,24,36,.82)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: "22px 26px" }}>
            <div style={{ width: 8, alignSelf: "stretch", borderRadius: 99, background: r.color || acc }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#8aa" }}>{r.label}</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>{r.value}</div>
            </div>
            {r.big ? <div style={{ fontFamily: "'Arial Narrow', sans-serif", fontWeight: 900, fontSize: 86, color: r.color || acc }}>{r.big}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  if (spec.type === "timeline") {
    const steps = (d.steps as { time: string; text: string }[]) || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", width: 780, paddingLeft: 20 }}>
        {steps.map((s, i) => {
          const ip = ease((frame - i * 8) / 12);
          return (
            <div key={i} style={{ position: "relative", padding: "18px 0 18px 46px", borderLeft: `6px solid ${acc}`, opacity: ip }}>
              <div style={{ position: "absolute", left: -16, top: 22, width: 26, height: 26, borderRadius: "50%", background: acc }} />
              <div style={{ fontSize: 36, color: "#fff" }}><b style={{ color: "#cfe" }}>{s.time}</b> · {s.text}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (spec.type === "funnel") {
    const rows = (d.rows as { label: string; pct: number; color?: string }[]) || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: 780, opacity: grow }}>
        {rows.map((r, i) => (
          <div key={i} style={{ height: 72, borderRadius: 12, background: r.color || acc, width: `${r.pct}%`, display: "flex", alignItems: "center", justifyContent: "center", color: "#06121c", fontWeight: 800, fontSize: 32 }}>{r.label} · {r.pct}%</div>
        ))}
      </div>
    );
  }

  if (spec.type === "pie") {
    const segs = (d.segs as { pct: number; color: string; label: string }[]) || [];
    let a2 = 0;
    const g = segs.map((s) => { const from = a2 * grow; a2 += s.pct; return `${s.color} ${from * 3.6}deg ${a2 * grow * 3.6}deg`; }).join(", ");
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 460, height: 460, borderRadius: "50%", margin: "0 auto", background: `conic-gradient(${g}, #1b2436 0)` }} />
        <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 18, fontSize: 32, flexWrap: "wrap" }}>
          {segs.map((s, i) => <span key={i} style={{ color: "#e6edf5" }}><b style={{ color: s.color }}>&#9679;</b> {s.label} {s.pct}%</span>)}
        </div>
      </div>
    );
  }

  if (spec.type === "tags") {
    const tags = (d.tags as string[]) || [];
    const cols = [acc, "#38bdf8", "#34d399", "#f472b6"];
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", maxWidth: 920, opacity: grow }}>
        {tags.map((t, i) => <b key={i} style={{ fontSize: 42, fontWeight: 800, padding: "14px 30px", borderRadius: 999, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", color: cols[i % 4] }}>{t}</b>)}
      </div>
    );
  }

  return null;
};

const SceneView: React.FC<{ spec: SceneSpec; brand?: string; index: number }> = ({ spec, brand, index }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pal = SCENE_PALETTE[index % SCENE_PALETTE.length];
  const acc = pal.acc;
  const bgScale = interpolate(frame, [0, durationInFrames], [1.05, 1.16], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Nen: anh (neu co) hoac gradient theo palette canh, zoom cham (Ken Burns) */}
      <AbsoluteFill style={{ transform: `scale(${bgScale})` }}>
        {spec.image ? (
          <Img src={spec.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <AbsoluteFill style={{ background: `linear-gradient(160deg, ${pal.g[0]}, ${pal.g[1]})` }} />
        )}
      </AbsoluteFill>
      {/* Glow accent goc tren cho bot don dieu (chi khi nen gradient) */}
      {spec.image ? null : <AbsoluteFill style={{ background: `radial-gradient(52% 36% at 78% 12%, ${acc}33, transparent 62%)` }} />}
      {/* Scrim cho de doc */}
      <AbsoluteFill style={{ background: "radial-gradient(80% 55% at 50% 42%, rgba(4,8,16,.3), rgba(4,8,16,.78))" }} />

      {/* Than: thanh phan truc quan, hoac kicker + tieu de */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 90px", textAlign: "center" }}>
        {spec.component ? (
          <>
            {spec.kicker ? <div style={{ color: acc, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", fontSize: 34, marginBottom: 28 }}>{spec.kicker}</div> : null}
            <CompView spec={spec.component} acc={acc} />
          </>
        ) : (
          <div style={motionStyle(spec.motion, frame)}>
            {spec.kicker ? <div style={{ color: acc, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", fontSize: 36, marginBottom: 24 }}>{spec.kicker}</div> : null}
            <div
              style={{
                whiteSpace: "pre-line",
                fontWeight: 900,
                fontSize: 112,
                lineHeight: 1.04,
                backgroundImage: `linear-gradient(180deg, #ffffff 0%, ${acc} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 10px 30px rgba(0,0,0,.55))",
              }}
            >
              {spec.title}
            </div>
          </div>
        )}
      </AbsoluteFill>

      {spec.caption ? <Caption text={spec.caption} acc={acc} /> : null}

      {brand ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90 }}>
          <div style={{ color: acc, fontWeight: 800, letterSpacing: 2, opacity: 0.9, fontSize: 34 }}>{brand}</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const AutoVideo: React.FC<AutoVideoProps> = ({ scenes, brand, audio }) => {
  const { fps } = useVideoConfig();
  let cursor = 0;
  const audioSrc = audio ? (/^https?:/.test(audio) ? audio : staticFile(audio)) : null;
  return (
    <AbsoluteFill style={{ fontFamily, background: "#000" }}>
      {audioSrc ? <Audio src={audioSrc} /> : null}
      {scenes.map((s, i) => {
        const len = Math.round((s.sec || 3) * fps);
        const from = cursor;
        cursor += len;
        return (
          <Sequence key={i} from={from} durationInFrames={len} layout="none">
            <SceneView spec={s} brand={brand} index={i} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// Scene plan mau de render thu (npx remotion render AutoVideo).
export const SAMPLE_PROPS: AutoVideoProps = {
  brand: "@kenh.cua.ban",
  scenes: [
    { sec: 3, industry: "bds", kicker: "Meo dau tu", title: "5 THOI QUEN\nMUA NHA", caption: "Nam 2026, tien thong minh chay vao BAT DONG SAN", motion: "pop" },
    { sec: 3, industry: "bds", kicker: "Vi tri", title: "Vi tri vang\nven ho", caption: "Vi tri vang VEN HO gia tri tang moi nam", motion: "rise" },
    { sec: 3.5, industry: "bds", kicker: "Quy mo", caption: "Quy mo 313 HECTA, lo tu 1 hecta", motion: "fade", component: { type: "bigNumber", data: { value: "313 ha", label: "gan 182 ha dat cong nghiep" } } },
    { sec: 3, industry: "tc", kicker: "So lieu", caption: "Doanh thu tang deu qua tung QUY", motion: "fade", component: { type: "bars", data: { items: [{ label: "Q1", val: 45 }, { label: "Q2", val: 62 }, { label: "Q3", val: 74 }, { label: "Q4", val: 95 }] } } },
    { sec: 3, industry: "tc", kicker: "Loi ich", caption: "Ba dieu ban NHAN DUOC khi dau tu som", motion: "slideL", component: { type: "list", data: { items: ["Lai kep theo thoi gian", "Tai san tang gia", "An tam ve huu"], type: "num" } } },
    { sec: 2.5, industry: "bds", title: "Nhan tu van\nmien phi", caption: "De lai thong tin, tu van MIEN PHI hom nay", motion: "zoomin" },
  ],
};
