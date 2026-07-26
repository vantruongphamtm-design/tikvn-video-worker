// Smoke test OmniVoice: sinh 1 cau -> bao thanh cong + do dai + file (KHONG in key/audio).
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { synthAll } from "./tts.mjs";

const hasKey = !!process.env.RUNPOD_API_KEY;
console.log("RUNPOD_API_KEY:", hasKey ? "co" : "KHONG (se mock)");
const wd = await mkdtemp(path.join(os.tmpdir(), "tikvn-smoke-"));
const t0 = Date.now();
const { audioFile, scenes } = await synthAll(
  [{ caption: "Xin chào, đây là giọng đọc thử nghiệm của Tik Vê En." }],
  process.env.TEST_VOICE || "",
  wd
);
console.log("sec:", scenes[0].sec, "| thoi gian goi:", ((Date.now() - t0) / 1000).toFixed(1) + "s");
console.log("audioFile:", audioFile);
