import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "./theme";

// Paw print icon
export const Paw: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = C.coral }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    <ellipse cx="50" cy="62" rx="24" ry="20" />
    <ellipse cx="26" cy="40" rx="10" ry="13" />
    <ellipse cx="44" cy="30" rx="10" ry="13" />
    <ellipse cx="62" cy="30" rx="10" ry="13" />
    <ellipse cx="76" cy="42" rx="10" ry="13" />
  </svg>
);

// Cat face icon for the hook
export const CatFace: React.FC<{ size?: number }> = ({ size = 220 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M22 30 L30 8 L44 24 M78 30 L70 8 L56 24" stroke={C.coral} strokeWidth={5} strokeLinejoin="round" fill={C.card} />
    <path d="M18 52 a32 30 0 0 0 64 0 a32 30 0 0 0 -64 0Z" fill={C.card} stroke={C.coral} strokeWidth={5} />
    <circle cx="38" cy="50" r="5" fill={C.ink} />
    <circle cx="62" cy="50" r="5" fill={C.ink} />
    <path d="M50 60 l-5 5 M50 60 l5 5 M50 60 v6" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
    <path d="M30 58 h-16 M30 64 h-14 M70 58 h16 M70 64 h14" stroke={C.inkSoft} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

// Drifting paw prints in the background
export const FloatingPaws: React.FC = () => {
  const frame = useCurrentFrame();
  const paws = [
    { x: 12, y: 18, s: 70, c: C.coral, sp: 0.4 },
    { x: 82, y: 26, s: 90, c: C.teal, sp: 0.3 },
    { x: 20, y: 74, s: 100, c: C.amber, sp: 0.35 },
    { x: 78, y: 82, s: 64, c: C.coral, sp: 0.45 },
    { x: 50, y: 92, s: 54, c: C.teal, sp: 0.25 },
    { x: 88, y: 55, s: 58, c: C.amber, sp: 0.5 },
  ];
  return (
    <AbsoluteFill style={{ background: `linear-gradient(165deg, ${C.bg0} 0%, ${C.bg1} 100%)` }}>
      {paws.map((p, i) => {
        const drift = Math.sin(frame * 0.02 * p.sp + i) * 14;
        const rot = Math.sin(frame * 0.015 + i) * 12;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              translate: `0px ${drift}px`,
              rotate: `${rot + i * 20}deg`,
              opacity: 0.1,
            }}
          >
            <Paw size={p.s} color={p.c} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
