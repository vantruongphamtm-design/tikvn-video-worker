// Render video 9:16 bang FFMPEG THUAN (khong Remotion/Chrome) -> render trong VAI GIAY tren 1 worker CPU.
// Moi canh = 1 segment doc lap (anh + Ken Burns zoom + scrim + tieu de/kicker/karaoke burn tu ASS + progress),
// render SONG SONG nhieu core, roi concat (-c copy) + mux giong (combineChunks). Bo hieu ung browser-only
// (particle, bieu do dong, blur/glow) theo lua chon nguoi dung. Chi phi: CPU serverless ~1 xu/video.
import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { combineChunks } from "./ffmpeg.mjs";
import { buildSceneAss } from "./assSub.mjs";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FPS = 30;

// Theme rut gon (port tu AutoVideo THEMES): accents + mau nen khi khong co anh + sang/toi.
const THEME = {
  star: { accents: ["fb923c", "fbbf24", "f59e0b", "fdba74", "f97316"], bg: "0b1526", light: false, ink: "241f1b" },
  neon: { accents: ["2dd4bf", "34d399", "22d3ee", "a3e635", "38bdf8"], bg: "08131f", light: false, ink: "eafffb" },
  paper: { accents: ["ea580c", "e11d48", "f97316", "c026d3", "0d9488"], bg: "f7ede1", light: true, ink: "241f1b" },
};
const INDUSTRY_THEME = { tc: "star", bds: "star", tin: "star", luat: "star", ecom: "neon", sk: "neon", gd: "paper", quote: "paper", nha: "paper", fnb: "paper" };
function resolveTheme(plan) {
  if (plan.theme && THEME[plan.theme]) return THEME[plan.theme];
  const ind = plan.scenes?.[0]?.industry;
  return THEME[INDUSTRY_THEME[ind || ""]] || THEME.star;
}

// spawn co cwd (de subtitles= tham chieu ASS bang TEN FILE, tranh loi escape 'C:' tren Windows).
function run(args, cwd) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    p.stdout.on("data", () => {});
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${err.slice(-600)}`))));
  });
}

async function downloadTo(url, file) {
  const res = await fetch(url, { headers: { "User-Agent": "tikvn/1.0" } });
  if (!res.ok) throw new Error(`img ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

const enc = [
  "-r", "30", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
  "-pix_fmt", "yuv420p", "-profile:v", "high",
  "-x264-params", "keyint=60:scenecut=0", "-video_track_timescale", "30000",
];

// Render 1 canh -> seg-i.mp4 (khong tieng). i, scene, F0 (frame bat dau trong ca video), TOTAL (tong frame).
async function renderScene(scene, i, F0, TOTAL, theme, plan, workDir) {
  const N = Math.max(1, Math.round((Number(scene.sec) || 3) * FPS));
  const durSec = N / FPS;
  const accent = theme.accents[i % theme.accents.length];
  const onImg = !!scene.image;
  const light = onImg ? false : theme.light;
  const ink = light ? `#${theme.ink}` : "#ffffff";

  // Tieu de: giu nguyen neu co. Khong title + KHONG kicker (vd canh von la component da bo) -> lay
  // vai tu dau caption lam tieu de cho khoi trong giua. Co kicker roi thi de kicker dung 1 minh (khong lap).
  let title = scene.title;
  if (!title && !scene.kicker) title = (scene.caption || "").split(/\s+/).slice(0, 6).join(" ").toUpperCase();

  // ASS cua rieng canh (timeline 0..durSec).
  const assName = `scene-${i}.ass`;
  await writeFile(path.join(workDir, assName), buildSceneAss({ ...scene, title, sec: durSec }, { accent, ink, light, brand: plan.brand }));

  // Thanh progress (chay theo CA video nho F0/TOTAL) + track mo.
  const prog =
    `drawbox=x=0:y=0:w=1080:h=8:color=white@0.09:t=fill,` +
    `drawbox=x=0:y=0:w='1080*(${F0}+t*${FPS})/${TOTAL}':h=8:color=0x${accent}@1:t=fill`;

  let inputs, chain;
  if (onImg) {
    // Tai anh (loi -> fallback nen theme).
    const imgFile = `img-${i}.jpg`;
    try {
      await downloadTo(scene.image, path.join(workDir, imgFile));
    } catch {
      return renderScene({ ...scene, image: null }, i, F0, TOTAL, theme, plan, workDir);
    }
    const denom = Math.max(1, N - 1);
    // cover -> phong to 2x lay do phan giai cho zoompan muot -> Ken Burns 1.05->1.16 -> phu scrim gradient
    // (muot, khong con vien ngang) -> progress -> ASS. scrim.png sinh 1 lan o renderVideoFFmpeg.
    inputs = ["-i", imgFile, "-i", "scrim.png"];
    chain =
      `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,scale=2160:3840,` +
      `zoompan=z='1.05+0.11*on/${denom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${N}:s=1080x1920:fps=${FPS},setsar=1[bg];` +
      `[bg][1:v]overlay=0:0,${prog},subtitles=${assName},format=yuv420p[v]`;
  } else {
    // Khong anh -> nen mau theme + quang sang accent (theme toi) + vignette. Paper (sang) bo ca hai.
    inputs = ["-f", "lavfi", "-i", `color=c=0x${theme.bg}:s=1080x1920:r=${FPS}:d=${durSec.toFixed(3)}`];
    if (theme.light) {
      chain = `[0:v]${prog},subtitles=${assName},format=yuv420p[v]`;
    } else {
      inputs.push("-i", "glow.png");
      chain = `[0:v]vignette=PI/5[bg];[bg][1:v]overlay=0:0,${prog},subtitles=${assName},format=yuv420p[v]`;
    }
  }

  const seg = `seg-${i}.mp4`;
  await run(["-y", ...inputs, "-filter_complex", chain, "-map", "[v]", "-frames:v", String(N), ...enc, seg], workDir);
  return path.join(workDir, seg);
}

/**
 * plan: { scenes:[{sec,speakSec,image?,caption,title?,kicker?,industry}], brand?, theme? }
 * audioFile: giong doc mp3 (ca video). Tra ve duong dan MP4 hoan chinh (da mux giong).
 */
export async function renderVideoFFmpeg(plan, audioFile, jobId, workDir, finalMp4) {
  await mkdir(workDir, { recursive: true });
  const theme = resolveTheme(plan);
  const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
  if (!scenes.length) throw new Error("Khong co canh de render");

  // scrim gradient (mo o tren -> toi o duoi) de chu de doc tren anh, muot khong vien. Sinh 1 lan, phu moi canh anh.
  await run(
    ["-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920", "-vf", "format=rgba,geq=r=0:g=0:b=0:a='18+180*Y/H'", "-frames:v", "1", "scrim.png"],
    workDir
  );

  // Quang sang accent (goc tren, mem) cho canh KHONG anh + theme toi. Nuong 1 PNG bang geq (dung mau accent chinh).
  const ga = theme.accents[0];
  if (!theme.light) {
    await run(
      [
        "-y", "-f", "lavfi", "-i", "color=c=black:s=1080x1920",
        "-vf", `format=rgba,geq=r=0x${ga.slice(0, 2)}:g=0x${ga.slice(2, 4)}:b=0x${ga.slice(4, 6)}:a='clip(72*exp(-(pow((X-780)/470,2)+pow((Y-250)/400,2))),0,72)'`,
        "-frames:v", "1", "glow.png",
      ],
      workDir
    );
  }

  // Frame bat dau + tong frame (khop cach TTS tinh do dai).
  const Ns = scenes.map((s) => Math.max(1, Math.round((Number(s.sec) || 3) * FPS)));
  const TOTAL = Ns.reduce((a, b) => a + b, 0);
  const F0 = [];
  let acc = 0;
  for (const n of Ns) {
    F0.push(acc);
    acc += n;
  }

  // Render segment SONG SONG (pool theo core). RENDER_CONCURRENCY tai su dung lam so canh chay cung luc.
  const pool = Math.max(1, Number(process.env.RENDER_CONCURRENCY) || Math.min(6, os.cpus().length || 4));
  const segs = new Array(scenes.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(pool, scenes.length) }, async () => {
      while (next < scenes.length) {
        const i = next++;
        segs[i] = await renderScene(scenes[i], i, F0[i], TOTAL, theme, plan, workDir);
      }
    })
  );

  const out = finalMp4 || path.join(workDir, `${jobId}.mp4`);
  await combineChunks(segs, path.join(workDir, "concat.txt"), audioFile, out);
  return out;
}

// CLI test local: node worker/ffmpegRender.mjs plan.json voice.mp3
if (process.argv[1] && process.argv[1].endsWith("ffmpegRender.mjs")) {
  const plan = JSON.parse(await readFile(process.argv[2], "utf8"));
  const audio = process.argv[3] || null;
  const dir = await mkdtemp(path.join(os.tmpdir(), "ffr-"));
  const t0 = Date.now();
  const out = await renderVideoFFmpeg(plan, audio, "local", dir, path.join(process.cwd(), "out", "ffmpeg-local.mp4"));
  console.log(`OUT: ${out}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
