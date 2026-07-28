// TTS giong Viet cho tung caption. Tra ve audio + do dai (giay) de gan sec moi canh
// (karaoke khop giong). Co MOCK fallback (audio im lang uoc do dai) de test khong can endpoint.
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} exit ${code}: ${err.slice(-400)}`))));
  });
}

async function durationOf(file) {
  const out = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", file]);
  const d = parseFloat(out.trim());
  return Number.isFinite(d) ? d : 3;
}

// Goi OmniVoice (RunPod). Contract: input {text, language, ref_audio_base64?|instruct?, output_format},
// output {audio_base64|audio_url, duration_seconds}. Tra ve {ok, sec} hoac false neu chua co key.
// voice: "" -> auto (giong mac dinh); URL -> clone; "instruct:..." -> voice_design.
// endpoint: mac dinh dung endpoint RIENG cho video "giong doc video ngan" qua RUNPOD_TTS_ENDPOINT_ID
// (tach khoi endpoint giong cua web). Chua set env thi ve endpoint OmniVoice chung h2t1xhru34n54n.
async function synthReal(text, voice, outFile, refText, speed, temperature, style) {
  const endpoint = process.env.RUNPOD_TTS_ENDPOINT_ID || "h2t1xhru34n54n";
  const apiKey = process.env.RUNPOD_API_KEY;
  if (!apiKey) return false;

  // num_step 32 khop web (handler mac dinh cung 32 -> vo hai, de ro rang).
  const input = { text, language: "Vietnamese", output_format: "mp3", num_step: 32 };
  // VieNeu doc cac tham so nay (OmniVoice cu bo qua). Chi gui khi hop le de khong doi hanh vi mac dinh.
  if (speed && speed > 0 && speed !== 1) input.speed = speed;
  if (temperature && temperature > 0) input.temperature = temperature;
  if (style) input.style = style;
  if (voice && /^https?:/.test(voice)) {
    // Tai file tham chieu -> base64. OmniVoice that doc ref_audio_base64 (khop web /api/tts).
    // Gui ref_audio_url thi handler co the BO QUA -> giong ve mac dinh (day la loi "giong sai").
    try {
      const rf = await fetch(voice, { headers: { "User-Agent": "tikvn/1.0" } });
      if (!rf.ok) throw new Error(`ref audio ${rf.status}`);
      input.ref_audio_base64 = Buffer.from(await rf.arrayBuffer()).toString("base64");
    } catch (e) {
      // Khong tai duoc ref -> de OmniVoice tu chon giong mac dinh (khong chan job).
      console.error("TTS ref audio loi (dung giong mac dinh):", e && e.message ? e.message : e);
    }
  } else if (voice && voice.startsWith("instruct:")) {
    input.instruct = voice.slice(9).trim();
  }
  // ref_text PHAI khop ref_audio (OmniVoice F5) -> chi gui khi co transcript khop VA da tai duoc ref audio.
  // Thieu transcript -> BO ref_text de OmniVoice tu boc loi (align dung). KHONG dung env co dinh:
  // env chi khop 1 giong -> lech 11 giong con lai -> giong doc noi dung khong lien quan (bug da gap).
  if (refText && refText.trim() && input.ref_audio_base64) input.ref_text = refText;

  const res = await fetch(`https://api.runpod.ai/v2/${endpoint}/runsync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error(`TTS loi (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.status && data.status !== "COMPLETED") throw new Error(`TTS status ${data.status}`);
  const o = data?.output || {};
  const sec = Number(o.duration_seconds) > 0 ? Number(o.duration_seconds) : null;
  if (o.audio_base64) {
    await writeFile(outFile, Buffer.from(o.audio_base64, "base64"));
    return { ok: true, sec };
  }
  if (o.audio_url) {
    const a = await fetch(o.audio_url);
    await writeFile(outFile, Buffer.from(await a.arrayBuffer()));
    return { ok: true, sec };
  }
  throw new Error("OmniVoice khong tra audio (kiem tra input/endpoint)");
}

// Mock: audio im lang, do dai uoc theo so tu (2.5 tu/giay), toi thieu 1.8s.
async function synthMock(text, outFile) {
  const words = String(text).trim().split(/\s+/).filter(Boolean).length;
  const sec = Math.max(1.8, Math.round((words / 2.5) * 10) / 10);
  await run(FFMPEG, ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(sec), "-q:a", "9", outFile]);
  return sec;
}

/**
 * scenes: [{caption,...}]. Sinh audio moi canh, gan sec, ghep thanh 1 file.
 * Tra ve { audioFile, scenes (da co sec) }.
 */
// So request TTS chay song song (khop workersMax cua endpoint TTS = 4). Chinh qua env.
const TTS_CONCURRENCY = Number(process.env.TTS_CONCURRENCY) || 4;

export async function synthAll(scenes, voice, workDir, targetSec, voiceRefText, opts = {}) {
  const { speed, temperature, style, silenceP } = opts;
  await mkdir(workDir, { recursive: true });
  // TTS moi canh SONG SONG (pool TTS_CONCURRENCY) thay vi tuan tu -> nhanh hon nhieu.
  // Ket qua giu dung thu tu canh (ghi vao secs[i]).
  const secs = new Array(scenes.length);
  async function one(i) {
    const f = path.join(workDir, `seg-${i}.mp3`);
    const speak = scenes[i].narration || scenes[i].caption || " ";
    let sec;
    try {
      const r = await synthReal(speak, voice, f, voiceRefText, speed, temperature, style);
      if (r && r.ok) sec = r.sec ?? (await durationOf(f));
      else sec = await synthMock(speak, f);
    } catch (e) {
      sec = await synthMock(speak, f);
    }
    secs[i] = Math.max(1.5, sec);
  }
  // Pool: chay toi da TTS_CONCURRENCY task cung luc.
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(TTS_CONCURRENCY, scenes.length) }, async () => {
      while (next < scenes.length) {
        const i = next++;
        await one(i);
      }
    })
  );
  const files = [];
  const outScenes = [];
  for (let i = 0; i < scenes.length; i++) {
    files.push(path.join(workDir, `seg-${i}.mp3`));
    // speakSec = do dai AUDIO THAT (truoc khi chen lang) -> karaoke chay khop giong, khong let.
    outScenes.push({ ...scenes[i], sec: secs[i], speakSec: secs[i] });
  }
  // KHONG ep du targetSec (de video dai TU NHIEN theo giong doc, vd chon 60s -> 50-60s la OK).
  // Chi chen 1 chut LANG NGHI giua cac canh cho de tho + karaoke kip chuyen canh.
  // Neu tong qua ngan so voi muc tieu (LLM viet thieu) thi nghi dai hon 1 chut (co tran), khong ep het.
  // silenceP (giay nghi giua canh) tu web -> lam GAP co so; thieu thi giu mac dinh 0.35s.
  const GAP_MIN = (typeof silenceP === "number" && silenceP >= 0) ? silenceP : 0.35;
  let gap = GAP_MIN;
  if (targetSec) {
    const speechTotal = outScenes.reduce((a, s) => a + s.sec, 0);
    const floor = targetSec * 0.82; // cho phep ngan hon muc tieu (vd 60s -> >= ~49s)
    if (speechTotal + GAP_MIN * outScenes.length < floor) {
      // thieu nhieu -> nghi dai hon de dat SAN (floor), toi da 1.2s/canh (khong ep tran target)
      gap = Math.min(1.2, (floor - speechTotal) / outScenes.length);
    }
  }
  gap = Math.round(gap * 100) / 100;
  {
    const gapFile = path.join(workDir, "gap.mp3");
    await run(FFMPEG, ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(gap), "-q:a", "9", gapFile]);
    const withGaps = [];
    files.forEach((f, i) => {
      withGaps.push(f, gapFile);
      outScenes[i].sec += gap; // sec = audio (speakSec) + nghi; karaoke chay theo speakSec roi giu
    });
    files.length = 0;
    files.push(...withGaps);
  }
  // Ghep audio: concat demuxer.
  const listFile = path.join(workDir, "list.txt");
  await writeFile(listFile, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n"));
  const audioFile = path.join(workDir, "voice.mp3");
  await run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c:a", "libmp3lame", "-q:a", "4", audioFile]);
  return { audioFile, scenes: outScenes };
}
