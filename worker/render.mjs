// Render AutoVideo tu scene plan -> MP4 (KHONG tieng - audio duoc ffmpeg mux sau, xem pipeline).
// TOI UU TOC DO:
//  1) PREBUNDLE luc build Docker (worker/prebundle.mjs -> BUNDLE_DIR). Worker KHONG bundle lai luc
//     chay -> bo 30-60s bundle moi lan worker lanh.
//  2) Render MUTED (bo audio khoi composition) -> khong phu thuoc staticFile audio -> prebundle sach.
//  3) Ho tro frameRange -> chia 1 video thanh nhieu CHUNK, render song song nhieu worker (xem pipeline).
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "out");
// Thu muc bundle da build san (Docker prebundle). Runtime tai su dung -> khong bundle lai.
const BUNDLE_DIR = process.env.BUNDLE_DIR || path.join(ROOT, ".bundle");

let _bundle = null;
/** Bundle 1 lan. Neu da prebundle (Docker) -> dung luon, khong bundle lai. */
export function getBundle() {
  if (_bundle) return _bundle;
  if (existsSync(path.join(BUNDLE_DIR, "index.html"))) {
    _bundle = Promise.resolve(BUNDLE_DIR);
    return _bundle;
  }
  // Fallback (chua prebundle): bundle luc chay vao BUNDLE_DIR.
  _bundle = rm(path.join(ROOT, "node_modules", ".cache"), { recursive: true, force: true })
    .catch(() => {})
    .then(() =>
      bundle({
        entryPoint: ENTRY,
        publicDir: PUBLIC,
        outDir: BUNDLE_DIR,
        webpackOverride: (c) => ({ ...enableTailwind(c), cache: false, output: { ...(c.output || {}), hashFunction: "sha256" } }),
      })
    );
  return _bundle;
}

/** Chon composition (co durationInFrames de chia chunk). plan = { scenes, brand, theme }. */
export async function selectComp(plan) {
  const serveUrl = await getBundle();
  return await selectComposition({ serveUrl, id: "AutoVideo", inputProps: { ...plan } });
}

/** Chia [0..total-1] thanh `count` doan lien tiep, tra ve [from,to] (inclusive) cua doan `index`. */
export function chunkRange(total, count, index) {
  const per = Math.ceil(total / count);
  const from = index * per;
  if (from > total - 1) return null; // doan rong (video qua ngan so voi so chunk)
  return [from, Math.min(total - 1, from + per - 1)];
}

/**
 * Render 1 doan (hoac ca video neu frameRange=null) ra MP4 KHONG tieng.
 * outName: ten file (khong duoi). frameRange: [from,to] inclusive hoac null.
 */
export async function renderRange(composition, plan, outName, frameRange) {
  const serveUrl = await getBundle();
  await mkdir(OUT, { recursive: true });
  const outFile = path.join(OUT, `${outName}.mp4`);
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: outFile,
    inputProps: { ...plan }, // KHONG audio -> render MUTED; audio mux bang ffmpeg o pipeline
    publicDir: PUBLIC,
    // concurrency theo vCPU (worker nhieu core -> nhanh). null = Remotion tu chon.
    concurrency: process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null,
    // GL: mac dinh swangle (CPU, on dinh). Worker co GPU dat REMOTION_GL=angle-egl|vulkan de rasterize GPU.
    chromiumOptions: { gl: process.env.REMOTION_GL || "swangle" },
    ...(frameRange ? { frameRange } : {}),
  });
  return outFile;
}

/** Tien ich: render CA video (khong chunk), khong tieng. Dung cho fallback CPU-only. */
export async function renderVideo(plan, jobId, frameRange = null) {
  const composition = await selectComp(plan);
  return await renderRange(composition, plan, jobId, frameRange);
}
