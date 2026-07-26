// A4 orchestrator: input job -> boc noi dung -> A3 (LLM plan) -> gan anh -> TTS (sec moi canh)
// -> render MP4 -> upload R2. Tra ve { videoUrl, title, description, hashtags, ... }.
import { extractFromUrl } from "./extract.mjs";
import { selectPlan } from "./selectPlan.mjs";
import { snapDuration } from "./catalog.mjs";
import { synthAll } from "./tts.mjs";
import { renderVideo } from "./render.mjs";
import { uploadR2 } from "./r2.mjs";
import { stockForScenes } from "./images.mjs";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * input = {
 *   mode?: "link" | "text", url?, content?/text?,
 *   images?: string[] (URL), voice?: string, subtitle?: boolean,
 *   durationSec?: 30|60|120, brand?: string, jobId?: string
 * }
 */
export async function runJob(input = {}) {
  const { mode, url, content, text, images = [], imageSource, voice, subtitle = true, durationSec = 60, brand } = input;
  const jobId = input.jobId || `job-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  // Do thoi gian tung khau (giay) de biet nut that thuc su.
  const T = {};
  const tick = (k, t0) => { T[k] = Math.round((Date.now() - t0) / 100) / 10; };

  // 1. Lay noi dung
  let t = Date.now();
  let source = "";
  if (mode === "link" || (url && !content && !text)) {
    const ex = await extractFromUrl(url);
    source = `${ex.title}\n${ex.text}`;
  } else {
    source = content || text || "";
  }
  if (!source.trim()) throw new Error("Khong co noi dung (link rong hoac text rong)");
  tick("extract", t);

  // 2. A3: LLM -> scene plan + tieu de/mo ta/hashtag
  t = Date.now();
  const plan = await selectPlan(source, durationSec);
  if (brand) plan.brand = brand;
  tick("llm", t);

  // 3. Anh nen theo lua chon nguoi dung
  t = Date.now();
  const src = imageSource || (images.length ? "upload" : "none");
  if (src === "upload" && images.length) {
    plan.scenes.forEach((s, i) => (s.image = images[i % images.length]));
  } else if (src === "stock") {
    await stockForScenes(plan.scenes, "");
  }
  tick("images", t);

  // 4. Phu de on/off: giu narration cho TTS, an caption hien thi neu tat
  plan.scenes.forEach((s) => {
    s.narration = s.caption;
    if (subtitle === false) s.caption = "";
  });

  // 5. TTS -> audio ghep + sec moi canh
  t = Date.now();
  const workDir = await mkdtemp(path.join(os.tmpdir(), "tikvn-"));
  const { audioFile, scenes } = await synthAll(plan.scenes, voice, workDir, snapDuration(durationSec));
  tick("tts", t);

  // 6. Render MP4
  t = Date.now();
  const mp4 = await renderVideo({ scenes, brand: plan.brand }, audioFile, jobId);
  tick("render", t);

  // 7. Upload R2 (neu cau hinh)
  t = Date.now();
  const videoUrl = await uploadR2(mp4, `videos/${jobId}.mp4`);
  tick("upload", t);

  await rm(workDir, { recursive: true, force: true }).catch(() => {});
  return {
    jobId,
    videoUrl: videoUrl || `file://${mp4}`,
    localPath: mp4,
    title: plan.title,
    description: plan.description,
    hashtags: plan.hashtags,
    industry: plan.industry,
    sceneCount: scenes.length,
    timings: T,
  };
}

// CLI: node worker/pipeline.mjs input.json  (in ra RESULT_JSON:{...})
if (process.argv[1] && process.argv[1].endsWith("pipeline.mjs")) {
  const inputPath = process.argv[2];
  const input = inputPath ? JSON.parse(await readFile(inputPath, "utf8")) : {};
  runJob(input)
    .then((r) => {
      console.log("RESULT_JSON:" + JSON.stringify(r));
    })
    .catch((e) => {
      console.error("ERROR:", e && e.message ? e.message : String(e));
      process.exit(1);
    });
}
