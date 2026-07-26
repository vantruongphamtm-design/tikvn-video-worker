import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { COLORS, EASE_OUT } from "./theme";

// Animated dark background with drifting orange radial glows
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  const glowY1 = interpolate(t, [0, 1], [30, 70]);
  const glowX2 = interpolate(t, [0, 1], [80, 40]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${COLORS.bg0} 0%, ${COLORS.bg1} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 25% ${glowY1}%, rgba(249,115,22,0.28), transparent 45%),
                       radial-gradient(circle at ${glowX2}% 15%, rgba(251,146,60,0.20), transparent 40%),
                       radial-gradient(circle at 60% 90%, rgba(194,65,18,0.22), transparent 50%)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Reactive audio waveform bars — the voice-studio motif
export const Waveform: React.FC<{ bars?: number; height?: number; opacity?: number }> = ({
  bars = 40,
  height = 260,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height,
        opacity,
      }}
    >
      {new Array(bars).fill(0).map((_, i) => {
        const seed = Math.sin(i * 12.9898) * 43758.5453;
        const phase = (seed - Math.floor(seed)) * Math.PI * 2;
        const speed = 0.18 + ((i % 5) * 0.04);
        const h =
          0.18 +
          0.82 * Math.abs(Math.sin(frame * speed + phase)) * (0.5 + 0.5 * Math.abs(Math.cos(i * 0.3)));
        const barH = h * height;
        const mid = bars / 2;
        const dist = Math.abs(i - mid) / mid;
        const col = interpolate(dist, [0, 1], [0, 1]);
        return (
          <div
            key={i}
            style={{
              width: 10,
              height: barH,
              borderRadius: 6,
              background: `linear-gradient(to top, ${COLORS.orangeDeep}, ${col > 0.5 ? COLORS.orangeLight : COLORS.amber})`,
            }}
          />
        );
      })}
    </div>
  );
};

// Per-scene wrapper that fades + eases content in and out
export const Scene: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const rise = interpolate(frame, [0, 20], [40, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(fadeIn, fadeOut),
        translate: `0px ${rise}px`,
        alignItems: "center",
        justifyContent: "center",
        padding: 90,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// A feature card: icon badge + title + subtitle + step index
export const FeatureScene: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  index: number;
  total: number;
}> = ({ icon, title, subtitle, index, total }) => {
  const frame = useCurrentFrame();
  const badgeScale = interpolate(frame, [4, 26], [0.4, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
      <div
        style={{
          width: 260,
          height: 260,
          borderRadius: 60,
          background: COLORS.card,
          border: `3px solid ${COLORS.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          scale: badgeScale,
          boxShadow: "0 30px 90px rgba(249,115,22,0.25)",
        }}
      >
        <div style={{ scale: 1.5, display: "flex" }}>{icon}</div>
      </div>
      <div
        style={{
          fontSize: 88,
          fontWeight: 800,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 46,
          fontWeight: 500,
          color: COLORS.muted,
          textAlign: "center",
          lineHeight: 1.35,
          maxWidth: 820,
        }}
      >
        {subtitle}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
        {new Array(total).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === index ? 56 : 20,
              height: 20,
              borderRadius: 10,
              background: i === index ? COLORS.orangeLight : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
};
