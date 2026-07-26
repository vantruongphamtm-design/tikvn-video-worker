import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, EASE } from "./theme";
import { Paw, CatFace } from "./paws";

const ez = (f: number, a: number, b: number, from: number, to: number) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE),
  });

// Scene fade/rise wrapper
export const Scene: React.FC<{ children: React.ReactNode; durationInFrames: number }> = ({
  children,
  durationInFrames,
}) => {
  const f = useCurrentFrame();
  const opIn = ez(f, 0, 12, 0, 1);
  const opOut = interpolate(f, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(opIn, opOut),
        alignItems: "center",
        justifyContent: "center",
        padding: 96,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const HookScene: React.FC = () => {
  const f = useCurrentFrame();
  const catScale = ez(f, 0, 26, 0.5, 1);
  const titleY = ez(f, 14, 40, 60, 0);
  const titleOp = ez(f, 14, 40, 0, 1);
  const subOp = ez(f, 40, 64, 0, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      <div style={{ scale: catScale }}>
        <CatFace size={300} />
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 800,
          color: C.ink,
          textAlign: "center",
          lineHeight: 1.05,
          letterSpacing: -1,
          translate: `0px ${titleY}px`,
          opacity: titleOp,
        }}
      >
        Lông mèo bị xơ?
      </div>
      <div style={{ fontSize: 46, fontWeight: 500, color: C.inkSoft, textAlign: "center", lineHeight: 1.35, maxWidth: 840, opacity: subOp }}>
        Bộ lông óng mượt sao lại khô ráp, xơ xác và mất sức sống?
      </div>
    </div>
  );
};

type Item = { title: string; sub: string };

export const ListScene: React.FC<{
  heading: string;
  accent: string;
  items: Item[];
}> = ({ heading, accent, items }) => {
  const f = useCurrentFrame();
  const headOp = ez(f, 0, 16, 0, 1);
  const headScale = ez(f, 0, 20, 0.85, 1);
  const perItem = 12;
  const start = 18;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 34, width: "100%", maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, justifyContent: "center", opacity: headOp, scale: headScale }}>
        <div style={{ width: 20, height: 64, borderRadius: 10, background: accent }} />
        <div style={{ fontSize: 74, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>{heading}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {items.map((it, i) => {
          const a = start + i * perItem;
          const op = ez(f, a, a + 16, 0, 1);
          const x = ez(f, a, a + 18, -60, 0);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 30,
                background: C.card,
                borderRadius: 30,
                border: `2px solid ${C.cardBorder}`,
                padding: "26px 34px",
                opacity: op,
                translate: `${x}px 0px`,
                boxShadow: "0 16px 40px rgba(45,42,50,0.06)",
              }}
            >
              <div
                style={{
                  minWidth: 74,
                  height: 74,
                  borderRadius: 20,
                  background: i % 2 === 0 ? "rgba(239,99,81,0.12)" : "rgba(42,157,143,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Paw size={44} color={i % 2 === 0 ? C.coral : C.teal} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: C.ink, lineHeight: 1.15 }}>{it.title}</div>
                <div style={{ fontSize: 34, fontWeight: 400, color: C.inkSoft, lineHeight: 1.2 }}>{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CtaScene: React.FC = () => {
  const f = useCurrentFrame();
  const iconScale = ez(f, 0, 24, 0.5, 1);
  const l1 = ez(f, 18, 42, 0, 1);
  const btnScale = ez(f, 40, 60, 0.7, 1);
  const pulse = 1 + 0.03 * Math.sin(f * 0.18);
  const urlOp = ez(f, 60, 80, 0, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46 }}>
      <div style={{ scale: iconScale }}>
        <CatFace size={230} />
      </div>
      <div style={{ fontSize: 58, fontWeight: 700, color: C.ink, textAlign: "center", lineHeight: 1.25, maxWidth: 860, opacity: l1 }}>
        Lông xơ kéo dài, rụng nhiều bất thường?<br />Hãy đưa boss đi khám bác sĩ thú y
      </div>
      <div
        style={{
          scale: btnScale * pulse,
          padding: "40px 78px",
          borderRadius: 999,
          background: `linear-gradient(120deg, ${C.coral}, ${C.coralDeep})`,
          color: C.card,
          fontSize: 58,
          fontWeight: 800,
          boxShadow: "0 26px 70px rgba(239,99,81,0.4)",
        }}
      >
        Helipet
      </div>
      <div style={{ fontSize: 50, fontWeight: 700, color: C.teal, opacity: urlOp, letterSpacing: 1 }}>helipet.vn</div>
    </div>
  );
};
