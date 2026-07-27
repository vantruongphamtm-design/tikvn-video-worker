// Helper ffmpeg dung cho GHEP CHUNK: noi cac doan video (concat demuxer, copy - khong re-encode)
// + mux audio giong doc. Tach rieng de pipeline dung, khong dung chung state voi tts.mjs.
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

export function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exit ${code}: ${err.slice(-500)}`))));
  });
}

/**
 * Ghep cac chunk video (theo dung thu tu) + mux audio -> 1 MP4 hoan chinh, TRONG 1 lenh ffmpeg.
 * - concat demuxer + `-c:v copy`: KHONG re-encode video -> nhanh + giu NGUYEN chat luong tung chunk.
 *   (Cac chunk render cung cau hinh h264 nen copy-concat lien mach.)
 * - audio: encode aac 192k, `-shortest` cat theo ben ngan hon.
 * files: mang duong dan mp4 (da sap xep). audioFile: mp3 (co the null -> video khong tieng).
 */
export async function combineChunks(files, listPath, audioFile, outFile) {
  const list = files.map((f) => `file '${String(f).replace(/'/g, "'\\''")}'`).join("\n");
  await writeFile(listPath, list, "utf8");
  const args = ["-y", "-fflags", "+genpts", "-f", "concat", "-safe", "0", "-i", listPath];
  if (audioFile) args.push("-i", audioFile);
  args.push("-map", "0:v:0");
  if (audioFile) args.push("-map", "1:a:0", "-c:a", "aac", "-b:a", "192k", "-shortest");
  args.push("-c:v", "copy", "-movflags", "+faststart", outFile);
  await run(FFMPEG, args);
  return outFile;
}
