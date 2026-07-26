# Deploy worker lên RunPod Serverless CPU

Máy local **không có Docker** → build image bằng **GitHub Actions** (gh đã đăng nhập `vantruongphamtm-design`), push lên **ghcr**, rồi tạo endpoint RunPod trỏ vào image đó. Đúng pattern `omnivoice-worker`.

## Bước 1 — Tạo repo + push (kích hoạt CI build)
```bash
cd remotion-video
gh repo create vantruongphamtm-design/tikvn-video-worker --private --source=. --remote=origin
git add -A && git commit -m "worker: auto video (A3+A4)"
git push -u origin main
```
→ Actions `.github/workflows/build-worker.yml` tự build Dockerfile → push
`ghcr.io/vantruongphamtm-design/tikvn-video-worker:latest` (+ tag theo commit sha). Xem tiến độ:
```bash
gh run watch
```
(Build Remotion + Chromium ~10-15 phút. Nếu lỗi, xem log `gh run view --log-failed`.)

Sau khi build xong, **để RunPod pull được image private**: đặt package ghcr thành public
(`gh api -X PATCH /user/packages/container/tikvn-video-worker/visibility -f visibility=public`)
hoặc thêm registry auth vào template.

## Bước 2 — Tạo endpoint RunPod (CPU)
Cách chắc ăn — **Dashboard**: runpod.io → Serverless → New Endpoint → Import từ Docker image
`ghcr.io/vantruongphamtm-design/tikvn-video-worker:latest`, chọn **CPU** (vd 4 vCPU / 8GB),
`containerDisk 20GB`, `workersMin 0`, `workersMax 3`, `idleTimeout 30`.

Hoặc script REST (best-effort): `RUNPOD_API_KEY=... node worker/deploy-runpod.mjs`.

## Bước 3 — Đặt ENV trên endpoint (template)
| Biến | Giá trị |
|---|---|
| `OPENROUTER_API_KEY` | (key của bạn) |
| `RUNPOD_API_KEY` | (để worker gọi TTS OmniVoice) |
| `RUNPOD_TTS_ENDPOINT_ID` | `h2t1xhru34n54n` |
| `R2_ACCOUNT_ID` / `R2_BUCKET` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_PUBLIC_BASE` | (R2 để trả URL video) |
| `RENDER_CONCURRENCY` | theo vCPU (vd 3) |

## Bước 4 — Test job
```bash
curl -s -X POST https://api.runpod.ai/v2/<ENDPOINT_ID>/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" -H "Content-Type: application/json" \
  -d '{"input":{"mode":"link","url":"https://...","durationSec":60,"subtitle":true}}'
```
→ trả `{ videoUrl, title, description, hashtags }`.

## Lưu ý
- TTS `synthReal` (worker/tts.mjs) đã khớp contract OmniVoice thật: input `{text, language, ref_audio_url?|instruct?, output_format}`, output `{audio_base64|audio_url, duration_seconds}`. `voice`: rỗng=giọng auto, URL=clone ref, `instruct:...`=voice design.
- Docker dùng **Node 22** nên KHÔNG dính bug webpack Node 24.
- Chi phí: Serverless CPU chỉ tính khi có job (idle $0). Mỗi video vài phút CPU + vài lần gọi TTS.
