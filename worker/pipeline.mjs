// A4 orchestrator: input job -> boc noi dung -> A3 (LLM plan) -> gan anh -> TTS (sec moi canh)
// -> render MP4 -> upload R2. Tra ve { videoUrl, title, description, hashtags, ... }.
import { extractFromUrl } from "./extract.mjs";
import { selectPlan } from "./selectPlan.mjs";
import { snapDuration } from "./catalog.mjs";
import { synthAll } from "./tts.mjs";
import { renderVideo } from "./render.mjs";
import { uploadR2 } from "./r2.mjs";
import { stockForScenes } from "./images.mjs";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
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

  // ===== TANG 2 (chay tren worker GPU): CHI RENDER tu plan + audio da co san (khong LLM/TTS) =====
  if (input.stage === "render") {
    const wd = await mkdtemp(path.join(os.tmpdir(), "tikvn-r-"));
    let audioFile = null;
    if (input.audioUrl) {
      audioFile = path.join(wd, "voice.mp3");
      const res = await fetch(input.audioUrl, { headers: { "User-Agent": "tikvn/1.0" } });
      await writeFile(audioFile, Buffer.from(await res.arrayBuffer()));
    }
    const mp4 = await renderVideo({ scenes: input.scenes || [], brand: input.brand, theme: input.theme }, audioFile, jobId);
    const videoUrl = await uploadR2(mp4, `videos/${jobId}.mp4`);
    await rm(wd, { recursive: true, force: true }).catch(() => {});
    return { jobId, videoUrl: videoUrl || `file://${mp4}`, stage: "render" };
  }

  // ===== STAGE PLAN: CHI bóc nội dung + LLM -> tra ve kich ban (khong TTS/render) =====
  // Web goi stage nay de nguoi dung XEM & SUA kich ban truoc, roi moi gui plan da sua di render.
  if (input.stage === "plan") {
    let source = "";
    if (mode === "link" || (url && !content && !text)) {
      const ex = await extractFromUrl(url);
      source = `${ex.title}\n${ex.text}`;
    } else {
      source = content || text || "";
    }
    if (!source.trim()) throw new Error("Khong co noi dung (link rong hoac text rong)");
    const plan = await selectPlan(source, durationSec);
    if (brand) plan.brand = brand;
    return { jobId, stage: "plan", plan };
  }

  // Do thoi gian tung khau (giay) de biet nut that thuc su.
  const T = {};
  const tick = (k, t0) => { T[k] = Math.round((Date.now() - t0) / 100) / 10; };

  // 1-2. Lay noi dung + LLM -> plan. NEU web da gui plan da sua (input.plan) thi DUNG LUON,
  //      bo qua extract + LLM (nguoi dung da duyet kich ban o buoc truoc).
  let t = Date.now();
  let plan;
  if (input.plan && Array.isArray(input.plan.scenes) && input.plan.scenes.length) {
    plan = input.plan;
    tick("extract", t);
    tick("llm", t);
  } else {
    let source = "";
    if (mode === "link" || (url && !content && !text)) {
      const ex = await extractFromUrl(url);
      source = `${ex.title}\n${ex.text}`;
    } else {
      source = content || text || "";
    }
    if (!source.trim()) throw new Error("Khong co noi dung (link rong hoac text rong)");
    tick("extract", t);
    t = Date.now();
    plan = await selectPlan(source, durationSec);
    tick("llm", t);
  }
  if (brand) plan.brand = brand;

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

  const meta = { jobId, title: plan.title, description: plan.description, hashtags: plan.hashtags, industry: plan.industry, theme: plan.theme, sceneCount: scenes.length, timings: T };

  // 6. RENDER: neu co GPU_RENDER_ENDPOINT_ID -> TANG 2: upload audio + BAN job render sang GPU (async)
  //    roi TRA VE NGAY (CPU ngung tinh tien; GPU chi tinh luc render). App/caller poll GPU de lay video.
  const GPU_EP = process.env.GPU_RENDER_ENDPOINT_ID;
  if (GPU_EP) {
    t = Date.now();
    const audioUrl = await uploadR2(audioFile, `audio/${jobId}.mp3`);
    const disp = await fetch(`https://api.runpod.ai/v2/${GPU_EP}/run`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`, "Content-Type": "application/json", "User-Agent": "tikvn/1.0" },
      body: JSON.stringify({ input: { stage: "render", scenes, brand: plan.brand, theme: plan.theme, audioUrl, jobId } }),
    }).then((r) => r.json());
    tick("dispatch", t);
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    return { ...meta, timings: T, stage1: "done", gpuEndpoint: GPU_EP, gpuJobId: disp.id, audioUrl };
  }

  // Fallback: render tai cho (CPU-only, khong cau hinh GPU)
  t = Date.now();
  const mp4 = await renderVideo({ scenes, brand: plan.brand, theme: plan.theme }, audioFile, jobId);
  tick("render", t);
  t = Date.now();
  const videoUrl = await uploadR2(mp4, `videos/${jobId}.mp4`);
  tick("upload", t);
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
  return { ...meta, timings: T, videoUrl: videoUrl || `file://${mp4}`, localPath: mp4 };
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
