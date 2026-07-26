import { loadFont } from "@remotion/google-fonts/BeVietnamPro";
import { AbsoluteFill, Sequence } from "remotion";
import { C } from "./theme";
import { FloatingPaws, Paw } from "./paws";
import { HookScene, ListScene, CtaScene, Scene } from "./scenes";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "700", "800"],
  subsets: ["latin", "vietnamese"],
});

const CAUSES = [
  { title: "Thiếu dinh dưỡng", sub: "Thiếu Omega-3/6, protein, vitamin" },
  { title: "Bệnh nội tiết", sub: "Suy giáp làm lông khô, chậm mọc" },
  { title: "Ký sinh trùng & bệnh da", sub: "Ve, bọ chét, nấm, viêm da" },
  { title: "Dị ứng", sub: "Thức ăn, bụi, phấn hoa, hoá chất" },
  { title: "Môi trường & tắm sai cách", sub: "Da khô, mất lớp dầu tự nhiên" },
  { title: "Stress, trầm cảm", sub: "Mèo bỏ chải chuốt, liếm quá mức" },
  { title: "Di truyền & tuổi tác", sub: "Mèo già giảm tái tạo lông" },
];

const CARE = [
  { title: "Dinh dưỡng cân đối", sub: "Bổ sung Omega-3/6, dầu cá" },
  { title: "Tắm đúng cách", sub: "Không tắm quá thường xuyên" },
  { title: "Chải lông thường xuyên", sub: "Gỡ lông chết, tăng độ bóng" },
  { title: "Cải thiện môi trường sống", sub: "Đủ ẩm, sạch sẽ, thoáng" },
  { title: "Giảm stress cho boss", sub: "Chơi, vận động, ổn định tâm lý" },
];

const HOOK = 90;
const CAUSE = 340;
const CARE_D = 270;
const CTA = 120;
export const HELIPET_DURATION = HOOK + CAUSE + CARE_D + CTA; // 820 frames ≈ 27.3s

export const HelipetPromo: React.FC = () => {
  let cur = 0;
  const at = (len: number) => {
    const from = cur;
    cur += len;
    return { from, len };
  };
  const hook = at(HOOK);
  const cause = at(CAUSE);
  const care = at(CARE_D);
  const cta = at(CTA);

  return (
    <AbsoluteFill style={{ fontFamily, background: C.bg0 }}>
      <FloatingPaws />

      <Sequence name="Hook" from={hook.from} durationInFrames={hook.len} layout="none">
        <Scene durationInFrames={hook.len}>
          <HookScene />
        </Scene>
      </Sequence>

      <Sequence name="Causes" from={cause.from} durationInFrames={cause.len} layout="none">
        <Scene durationInFrames={cause.len}>
          <ListScene heading="7 nguyên nhân" accent={C.coral} items={CAUSES} />
        </Scene>
      </Sequence>

      <Sequence name="Care" from={care.from} durationInFrames={care.len} layout="none">
        <Scene durationInFrames={care.len}>
          <ListScene heading="Cách chăm sóc" accent={C.teal} items={CARE} />
        </Scene>
      </Sequence>

      <Sequence name="CTA" from={cta.from} durationInFrames={cta.len} layout="none">
        <Scene durationInFrames={cta.len}>
          <CtaScene />
        </Scene>
      </Sequence>

      {/* brand corner tag */}
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-start", padding: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, opacity: 0.85 }}>
          <Paw size={40} color={C.coral} />
          <span style={{ fontFamily, fontSize: 40, fontWeight: 800, color: C.ink }}>Helipet</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
