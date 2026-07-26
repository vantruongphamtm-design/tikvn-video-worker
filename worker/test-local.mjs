// Test cuc bo A4 (KHONG can OpenRouter/RunPod): dung plan.sample.json -> TTS mock
// -> gan sec theo audio -> render MP4 co tieng. Chay: node worker/test-local.mjs
import { readFile, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { synthAll } from "./tts.mjs";
import { renderVideo } from "./render.mjs";

const plan = JSON.parse(await readFile(new URL("../plan.sample.json", import.meta.url), "utf8"));
plan.scenes.forEach((s) => (s.narration = s.caption));

const workDir = await mkdtemp(path.join(os.tmpdir(), "tikvn-test-"));
console.log("TTS (mock) cho", plan.scenes.length, "canh...");
const { audioFile, scenes } = await synthAll(plan.scenes, null, workDir);
console.log("audio:", audioFile);
console.log("sec moi canh:", scenes.map((s) => s.sec));

console.log("Render...");
const mp4 = await renderVideo({ scenes, brand: plan.brand }, audioFile, "test-worker");
console.log("XONG MP4:", mp4);
