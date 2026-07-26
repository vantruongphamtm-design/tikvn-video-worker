# TikVN Auto Video Worker (RunPod Serverless CPU)

Biến **link web** hoặc **văn bản** thành video ngắn 9:16 có giọng đọc tiếng Việt + phụ đề karaoke.

## Luồng
`input` → **extract** (bóc nội dung link) → **A3 selectPlan** (LLM chọn ngành/chuyển động/thành phần + tiêu đề/mô tả/hashtag) → gán ảnh → **TTS** (giọng Việt, mỗi cảnh `sec` = độ dài audio → karaoke khớp) → **render** Remotion (`AutoVideo`, CPU `--gl=swangle`) → **upload R2** → trả `{videoUrl, title, description, hashtags}`.

## File
- `pipeline.mjs` — orchestrator (+ CLI: `node worker/pipeline.mjs input.json`)
- `selectPlan.mjs` — A3, gọi OpenRouter
- `extract.mjs` — bóc bài viết từ URL
- `tts.mjs` — TTS giọng Việt (có **mock im lặng** khi chưa cấu hình endpoint)
- `render.mjs` — render Remotion CLI → MP4
- `r2.mjs` — upload Cloudflare R2
- `catalog.mjs` — menu cho LLM (đồng bộ `src/auto/catalog.ts`)
- `handler.py` — entry RunPod Serverless
- `../Dockerfile` — Node 22 + Chromium + ffmpeg + runpod

## Quy ước cảnh theo thời lượng (web có 4 mốc)
`durationSec` được **chuẩn hóa về mốc gần nhất** (30/45/60/120) rồi ép LLM tạo **đúng số cảnh**:

| Thời lượng | Số cảnh | Cấu trúc | ~giây/cảnh | ~từ/caption |
|---|---|---|---|---|
| 30s | 4 | hook · 2 ý · CTA | 7.5 | 19 |
| 45s | 5 | hook · 3 ý · CTA | 9 | 23 |
| 60s | 6 | hook · 4 ý · CTA | 10 | 25 |
| 120s | 9 | hook · 7 ý · CTA | 13.3 | 33 |

Sau TTS, `pipeline.mjs` **chuẩn hóa tổng về đúng mốc** (thiếu thì giữ cảnh cuối/CTA lâu hơn). Sửa bảng ở `catalog.mjs` (`DURATION_SPEC`).

## Biến môi trường
| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `OPENROUTER_API_KEY` | A3 | LLM sinh scene plan |
| `OPENROUTER_VIDEO_MODEL` | không | mặc định `google/gemini-2.5-flash` |
| `RUNPOD_API_KEY` + `RUNPOD_TTS_ENDPOINT_ID` | TTS thật | mặc định endpoint `h2t1xhru34n54n` (OmniVoice), contract đã khớp |
| `PEXELS_API_KEY` | ảnh stock | dùng khi `imageSource:"stock"` (tìm ảnh 9:16 theo `imageQuery` A3 gợi ý) |
| `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BASE` | upload | không có thì trả `file://` local |
| `RENDER_CONCURRENCY` | không | mặc định 2 (theo vCPU) |

## Test cục bộ
1) **Không cần key** (mock TTS, render thật, có tiếng im lặng):
```bash
node worker/test-local.mjs
```
2) **Job đầy đủ** (cần OPENROUTER_API_KEY; TTS mock nếu chưa cấu hình RunPod):
```bash
OPENROUTER_API_KEY=sk-or-... node worker/pipeline.mjs worker/input.example.json
```
→ in ra dòng `RESULT_JSON:{...}` + MP4 ở `out/`.

## Build & deploy RunPod
```bash
# build (context = remotion-video/)
docker build -t <registry>/tikvn-video:latest .
docker push <registry>/tikvn-video:latest
```
- Tạo **RunPod Serverless endpoint** loại **CPU** từ image trên.
- Đặt env vars (bảng trên) trên **template** của endpoint.
- Gọi job: `POST https://api.runpod.ai/v2/<endpoint-id>/run` với body:
```json
{ "input": { "mode": "text", "content": "…", "durationSec": 60, "subtitle": true, "voice": "" } }
```
hoặc `{ "input": { "mode": "link", "url": "https://…", "images": ["https://…"] } }`.

## Kết quả trả về
```json
{ "jobId":"…", "videoUrl":"https://cdn…/videos/….mp4",
  "title":"…", "description":"…", "hashtags":["#…"], "industry":"…", "sceneCount":6 }
```

## Lưu ý
- **Node 22 trong Docker** để né bug webpack hash của Node 24 (local đã vá bằng `cache:false` trong `remotion.config.ts`).
- TTS: `synthReal` đang đoán output `{audio_base64 | audio_url}` — chỉnh lại đúng contract endpoint OmniVoice/Kokoro của bạn.
- Ảnh `images[]` là URL công khai (đã upload sẵn, vd R2). App sẽ upload ảnh người dùng rồi truyền URL vào đây.
