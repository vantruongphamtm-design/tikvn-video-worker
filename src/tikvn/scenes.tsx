import { interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS, EASE_OUT } from "./theme";
import { Waveform } from "./components";
import { MusicIcon } from "./icons";

// Logo lockup used in intro and CTA
export const Logo: React.FC<{ size?: number }> = ({ size = 150 }) => {
  return (
    <div style={{ display: "flex", alignItems: "baseline", fontWeight: 800, fontSize: size, letterSpacing: -3 }}>
      <span style={{ color: COLORS.white }}>Tik</span>
      <span
        style={{
          color: COLORS.white,
          background: `linear-gradient(120deg, ${COLORS.orangeLight}, ${COLORS.orange}, ${COLORS.orangeDeep})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        VN
      </span>
    </div>
  );
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = interpolate(frame, [0, 28], [0.6, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const lineWidth = interpolate(frame, [24, 52], [0, 460], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const tagOpacity = interpolate(frame, [40, 66], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const waveOpacity = interpolate(frame, [10, 40], [0, 0.9], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 50 }}>
      <div style={{ scale: logoScale }}>
        <Logo size={190} />
      </div>
      <div style={{ width: lineWidth, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.amber})` }} />
      <div
        style={{
          fontSize: 58,
          fontWeight: 700,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.25,
          opacity: tagOpacity,
          maxWidth: 880,
        }}
      >
        Giọng đọc AI tiếng Việt<br />tự nhiên như người thật
      </div>
      <div style={{ marginTop: 30 }}>
        <Waveform bars={36} height={200} opacity={waveOpacity} />
      </div>
    </div>
  );
};

export const StatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.round(
    interpolate(frame, [8, 60], [0, 732], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
      easing: Easing.bezier(...EASE_OUT),
    })
  );
  const labelOpacity = interpolate(frame, [48, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const pillsOpacity = interpolate(frame, [62, 84], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <div style={{ marginBottom: 10, scale: 1.2, display: "flex" }}><MusicIcon /></div>
      <div
        style={{
          fontSize: 300,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: -6,
          background: `linear-gradient(120deg, ${COLORS.amber}, ${COLORS.orange}, ${COLORS.orangeDeep})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {count}
      </div>
      <div style={{ fontSize: 60, fontWeight: 700, color: COLORS.white, textAlign: "center", opacity: labelOpacity }}>
        bản nhạc nền không lời
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 24, opacity: pillsOpacity }}>
        {["Tải về miễn phí", "Nghe không giới hạn"].map((t) => (
          <div
            key={t}
            style={{
              padding: "20px 40px",
              borderRadius: 999,
              background: COLORS.card,
              border: `2px solid ${COLORS.cardBorder}`,
              color: COLORS.orangeLight,
              fontSize: 40,
              fontWeight: 600,
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = interpolate(frame, [0, 24], [0.7, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const btnScale = interpolate(frame, [24, 46], [0.6, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
    easing: Easing.bezier(...EASE_OUT),
  });
  const pulse = 1 + 0.03 * Math.sin(frame * 0.18);
  const urlOpacity = interpolate(frame, [46, 66], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
      <div style={{ scale: logoScale }}>
        <Logo size={160} />
      </div>
      <div style={{ fontSize: 56, fontWeight: 600, color: COLORS.muted, textAlign: "center", maxWidth: 820 }}>
        Tạo giọng đọc miễn phí, không giới hạn
      </div>
      <div
        style={{
          scale: btnScale * pulse,
          padding: "44px 88px",
          borderRadius: 999,
          background: `linear-gradient(120deg, ${COLORS.orange}, ${COLORS.orangeDeep})`,
          color: COLORS.white,
          fontSize: 62,
          fontWeight: 800,
          boxShadow: "0 30px 90px rgba(249,115,22,0.5)",
        }}
      >
        Bắt đầu miễn phí
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, color: COLORS.orangeLight, opacity: urlOpacity, letterSpacing: 1 }}>
        tikvn.io
      </div>
    </div>
  );
};
