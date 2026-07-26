import { Composition } from "remotion";
import { TikVNPromo, TIKVN_DURATION } from "./tikvn/TikVNPromo";
import { HelipetPromo, HELIPET_DURATION } from "./helipet/HelipetPromo";
import { AutoVideo, autoCalcMetadata, SAMPLE_PROPS } from "./auto/AutoVideo";

export const MyComposition = () => {
  return (
    <>
      {/* Composition tu dong: nhan scene plan (LLM xuat) lam props, do dai tinh theo audio. */}
      <Composition
        id="AutoVideo"
        component={AutoVideo}
        calculateMetadata={autoCalcMetadata}
        defaultProps={SAMPLE_PROPS}
        fps={30}
        width={1080}
        height={1920}
        durationInFrames={300}
      />
      <Composition
        id="TikVNPromo"
        component={TikVNPromo}
        durationInFrames={TIKVN_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HelipetPromo"
        component={HelipetPromo}
        durationInFrames={HELIPET_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
