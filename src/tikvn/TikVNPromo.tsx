import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { AbsoluteFill, Sequence } from "remotion";
import { Background, Scene, FeatureScene, Waveform } from "./components";
import { IntroScene, StatScene, CtaScene } from "./scenes";
import { MicIcon, ScriptIcon, FilmIcon, CloneIcon } from "./icons";
import { COLORS } from "./theme";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
});

const FEATURES = [
  { icon: <MicIcon />, title: "Tạo giọng đọc AI", subtitle: "Chuyển văn bản thành giọng nói tự nhiên chỉ trong vài giây" },
  { icon: <ScriptIcon />, title: "Viết kịch bản AI", subtitle: "AI viết lời đọc cho bạn — một chạm là ra giọng" },
  { icon: <FilmIcon />, title: "Lồng tiếng từ SRT", subtitle: "Nhập file phụ đề, giọng khớp video chuẩn từng giây" },
  { icon: <CloneIcon />, title: "Clone giọng của bạn", subtitle: "Thu vài mẫu để nhân bản giọng nói của riêng bạn" },
];

// Scene timing (30fps)
const INTRO = 120;
const FEAT = 100;
const STAT = 105;
const CTA = 125;
export const TIKVN_DURATION = INTRO + FEAT * 4 + STAT + CTA; // 750 frames = 25s

export const TikVNPromo: React.FC = () => {
  let cursor = 0;
  const at = (len: number) => {
    const from = cursor;
    cursor += len;
    return { from, len };
  };

  const intro = at(INTRO);
  const featSeqs = FEATURES.map(() => at(FEAT));
  const stat = at(STAT);
  const cta = at(CTA);

  return (
    <AbsoluteFill style={{ fontFamily, background: COLORS.bg0 }}>
      <Background />

      <Sequence name="Intro" from={intro.from} durationInFrames={intro.len} layout="none">
        <Scene durationInFrames={intro.len}>
          <IntroScene />
        </Scene>
      </Sequence>

      {featSeqs.map((s, i) => (
        <Sequence key={i} name={`Feature ${i + 1}`} from={s.from} durationInFrames={s.len} layout="none">
          <Scene durationInFrames={s.len}>
            <FeatureScene
              icon={FEATURES[i].icon}
              title={FEATURES[i].title}
              subtitle={FEATURES[i].subtitle}
              index={i}
              total={FEATURES.length}
            />
          </Scene>
        </Sequence>
      ))}

      <Sequence name="Stat 732" from={stat.from} durationInFrames={stat.len} layout="none">
        <Scene durationInFrames={stat.len}>
          <StatScene />
        </Scene>
      </Sequence>

      <Sequence name="CTA" from={cta.from} durationInFrames={cta.len} layout="none">
        <Scene durationInFrames={cta.len}>
          <CtaScene />
        </Scene>
      </Sequence>

      {/* Persistent brand waveform footer */}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
        <Waveform bars={30} height={90} opacity={0.28} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
