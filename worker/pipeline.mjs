// A4 orchestrator: input job -> boc noi dung -> A3 (LLM plan) -> gan anh -> TTS (sec moi canh)
// -> render MP4 -> upload R2. Tra ve { videoUrl, title, description, hashtags, ... }.
import { extractFromUrl } from "./extract.mjs";
import { selectPlan } from "./selectPlan.mjs";
import { snapDuration } from "./catalog.mjs";
import { synthAll } from "./tts.mjs";
import { selectComp, renderRange, renderVideo, chunkRange } from "./render.mjs";
import { combineChunks } from "./ffmpeg.mjs";
import { uploadR2 } from "./r2.mjs";
import { stockForScenes } from "./images.mjs";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Ha cac tu VIET HOA TOAN BO (>=2 ky tu) ve chu thuong -> danh cho PHAN LOI DOC (TTS).
// Giong AI doc sai chu in hoa toan bo (danh van/bo qua). Giu nguyen tu Title-case (dau cau, ten rieng).
function deCaps(text) {
  return String(text || "").replace(/[\p{Lu}][\p{Lu}\p{M}]+/gu, (w) => w.toLowerCase());
}

// ── Gọi endpoint GPU render + poll (render chunk song song nhiều worker) ──
async function gpuDispatch(ep, input) {
  const r = await fetch(`https://api.runpod.ai/v2/${ep}/run`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`, "Content-Type": "application/json", "User-Agent": "tikvn/1.0" },
    body: JSON.stringify({ input }),
  }).then((r) => r.json());
  if (!r || !r.id) throw new Error("GPU dispatch khong tra id: " + JSON.stringify(r).slice(0, 200));
  return r.id;
}
async function gpuPoll(ep, id, intervalMs = 2000, timeoutMs = 600000) {
  const t0 = Date.now();
  for (;;) {
    const s = await fetch(`https://api.runpod.ai/v2/${ep}/status/${id}`, {
      headers: { Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`, "User-Agent": "tikvn/1.0" },
    }).then((r) => r.json());
    if (s.status === "COMPLETED") return s.output || {};
    if (s.status === "FAILED" || s.status === "CANCELLED" || s.status === "TIMED_OUT")
      throw new Error(`GPU chunk ${s.status}: ${JSON.stringify(s.output || s.error || "").slice(0, 200)}`);
    if (Date.now() - t0 > timeoutMs) throw new Error("GPU chunk timeout");
    await new Promise((res) => setTimeout(res, intervalMs));
  }
}
async function downloadTo(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": "tikvn/1.0" } });
  if (!res.ok) throw new Error(`download chunk ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

/**
 * input = {
 *   mode?: "link" | "text", url?, content?/text?,
 *   images?: string[] (URL), voice?: string, subtitle?: boolean,
 *   durationSec?: 30|60|120, brand?: string, jobId?: string
 * }
 */
export async function runJob(input = {}) {
  const { mode, url, content, text, images = [], imageSource, voice, voiceRefText, subtitle = true, durationSec = 60, brand } = input;
  const jobId = input.jobId || `job-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  // ===== TANG 2 (worker GPU): render 1 CHUNK (khoang frame) cua video, KHONG tieng -> upload R2. =====
  //  CPU se tai cac chunk ve, concat + mux audio thanh video hoan chinh (nhanh gap ~chunkCount lan).
  if (input.stage === "render") {
    const plan = { scenes: input.scenes || [], brand: input.brand, theme: input.theme };
    const chunkIndex = Number(input.chunkIndex) || 0;
    const chunkCount = Number(input.chunkCount) || 1;
    const comp = await selectComp(plan);
    const range = chunkCount > 1 ? chunkRange(comp.durationInFrames, chunkCount, chunkIndex) : null;
    if (chunkCount > 1 && !range) return { chunkUrl: null, chunkIndex, empty: true, stage: "render" };
    const mp4 = await renderRange(comp, plan, `${jobId}-c${chunkIndex}`, range);
    const chunkUrl = await uploadR2(mp4, `chunks/${jobId}-c${chunkIndex}.mp4`);
    return { chunkUrl, chunkIndex, stage: "render" };
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

  // 4. Phu de on/off: giu narration cho TTS, an caption hien thi neu tat.
  //    LUOI AN TOAN: ha cac tu VIET HOA TOAN BO ve chu thuong CHO PHAN LOI DOC (giong AI doc sai
  //    chu in hoa, vd "GIO" doc thanh danh van). Caption HIEN THI giu nguyen (nhan manh thi giac).
  plan.scenes.forEach((s) => {
    s.narration = deCaps(s.caption);
    if (subtitle === false) s.caption = "";
  });

  // 5. TTS -> audio ghep + sec moi canh
  t = Date.now();
  const workDir = await mkdtemp(path.join(os.tmpdir(), "tikvn-"));
  const { audioFile, scenes } = await synthAll(plan.scenes, voice, workDir, snapDuration(durationSec), voiceRefText);
  tick("tts", t);

  const meta = { jobId, title: plan.title, description: plan.description, hashtags: plan.hashtags, industry: plan.industry, theme: plan.theme, sceneCount: scenes.length, timings: T };

  // 6. RENDER: chia video thanh nhieu CHUNK, ban SONG SONG sang nhieu worker GPU render (moi worker 1 chunk),
  //    roi CPU tai ve + concat (copy, khong re-encode) + mux audio -> video hoan chinh. Nhanh gap ~chunkCount lan.
  const GPU_EP = process.env.GPU_RENDER_ENDPOINT_ID;
  const renderPlan = { scenes, brand: plan.brand, theme: plan.theme };
  const estFrames = Math.round(scenes.reduce((a, s) => a + (Number(s.sec) || 3), 0) * 30);
  const maxChunks = Number(process.env.RENDER_CHUNKS) || 3;
  const chunkCount = Math.max(1, Math.min(maxChunks, Math.floor(estFrames / 200) || 1));
  const finalMp4 = path.join(workDir, `${jobId}.mp4`);
  const listTxt = path.join(workDir, "concat.txt");

  if (GPU_EP && chunkCount > 1) {
    t = Date.now();
    const ids = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        gpuDispatch(GPU_EP, { stage: "render", scenes, brand: plan.brand, theme: plan.theme, jobId, chunkIndex: i, chunkCount })
      )
    );
    const outputs = await Promise.all(ids.map((id) => gpuPoll(GPU_EP, id)));
    tick("renderGpu", t);
    t = Date.now();
    const chunks = outputs.filter((o) => o && o.chunkUrl).sort((a, b) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
    if (!chunks.length) throw new Error("Khong nhan duoc chunk video nao tu GPU");
    const files = [];
    for (const c of chunks) {
      const f = path.join(workDir, `chunk-${c.chunkIndex}.mp4`);
      await downloadTo(c.chunkUrl, f);
      files.push(f);
    }
    await combineChunks(files, listTxt, audioFile, finalMp4);
    tick("combine", t);
  } else {
    // Fallback: render CA video (muted) tai cho + mux audio (CPU-only, khong GPU, hoac video qua ngan).
    t = Date.now();
    const silent = await renderVideo(renderPlan, `${jobId}-silent`);
    await combineChunks([silent], listTxt, audioFile, finalMp4);
    tick("render", t);
  }
  t = Date.now();
  const videoUrl = await uploadR2(finalMp4, `videos/${jobId}.mp4`);
  tick("upload", t);
  await rm(workDir, { recursive: true, force: true }).catch(() => {});
  return { ...meta, timings: T, videoUrl: videoUrl || `file://${finalMp4}` };
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
