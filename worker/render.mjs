// Render AutoVideo tu scene plan -> MP4.
// TOI UU CHO WORKER: bundle 1 LAN (cache o module), moi job chi renderMedia (khong bundle lai).
// -> tren RunPod worker am, moi video chi ton thoi gian render, KHONG ton 30-60s bundle moi lan.
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY = path.join(ROOT, "src", "index.ts");
const PUBLIC = path.join(ROOT, "public");

let _bundle = null;
/** Bundle du an 1 lan; cac lan sau tra ve serveUrl da cache. */
export function getBundle() {
  if (!_bundle) {
    // Node 24 local: xoa webpack cache truoc bundle (tranh bug FileSystemInfo hash undefined).
    // Docker Node 22 khong dinh; xoa cache o day chi anh huong lan bundle dau (worker chi bundle 1 lan).
    _bundle = rm(path.join(ROOT, "node_modules", ".cache"), { recursive: true, force: true })
      .catch(() => {})
      .then(() => bundle({
      entryPoint: ENTRY,
      publicDir: PUBLIC,
      // cache:false + sha256 -> tranh bug webpack hash Node 24 (Docker dung Node 22 nen vo hai).
      webpackOverride: (c) => ({ ...enableTailwind(c), cache: false, output: { ...(c.output || {}), hashFunction: "sha256" } }),
      }));
  }
  return _bundle;
}

/** plan: { scenes, brand } ; audioFile: mp3 giong doc (tuy chon). Tra ve duong dan MP4. */
export async function renderVideo(plan, audioFile, jobId) {
  const inputProps = { ...plan };
  if (audioFile) {
    await mkdir(PUBLIC, { recursive: true });
    const audioName = `voice-${jobId}.mp3`;
    await copyFile(audioFile, path.join(PUBLIC, audioName));
    inputProps.audio = audioName; // AutoVideo -> staticFile(audioName)
  }

  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: "AutoVideo", inputProps });

  await mkdir(path.join(ROOT, "out"), { recursive: true });
  const outFile = path.join(ROOT, "out", `${jobId}.mp4`);
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    outputLocation: outFile,
    inputProps,
    publicDir: PUBLIC,
    // concurrency: theo vCPU (RunPod nhieu core -> nhanh). null = Remotion tu chon.
    concurrency: process.env.RENDER_CONCURRENCY ? Number(process.env.RENDER_CONCURRENCY) : null,
    // GL backend: mac dinh "swangle" (phan mem, CPU). Tren worker GPU dat REMOTION_GL=angle-egl | vulkan
    // de rasterize bang GPU (nhanh hon nhieu cho shadow/blur/gradient nang).
    chromiumOptions: { gl: process.env.REMOTION_GL || "swangle" },
  });
  return outFile;
}
