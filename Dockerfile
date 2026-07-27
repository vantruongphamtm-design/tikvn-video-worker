# TikVN Auto Video worker - RunPod Serverless CPU.
# Node 22 (tranh bug webpack hash cua Node 24). Remotion render bang CPU (--gl=swangle).
FROM node:22-bookworm-slim

# Deps: Chrome Headless Shell (Remotion), ffmpeg, python3 (runpod), fonts co dau tieng Viet.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg python3 python3-pip \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 \
    libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 \
    libpango-1.0-0 libcairo2 libcups2 libxext6 libxrender1 libxi6 \
    fonts-liberation fonts-noto-core fonts-noto-cjk ca-certificates \
    libgl1 libglx-mesa0 libegl1 libgles2 libvulkan1 mesa-vulkan-drivers libglu1-mesa \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --break-system-packages runpod

WORKDIR /app

# Cai node_modules truoc (cache layer)
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source (.dockerignore da loai node_modules/out/.cache)
COPY . .

# Tai san Chrome Headless Shell vao image luc build (khong tai luc chay)
RUN npx remotion browser ensure

# PREBUNDLE Remotion vao /app/.bundle luc BUILD -> worker KHONG bundle lai luc chay
# (bo 30-60s bundle moi lan worker lanh = nut that toc do lon nhat).
RUN node worker/prebundle.mjs

# Model manh hon cho A3 scene-plan (flash-lite qua yeu -> canh trong, thieu title/component).
# Template RunPod khong set OPENROUTER_VIDEO_MODEL nen ENV nay se duoc dung.
# RENDER_CONCURRENCY/RENDER_CHUNKS/REMOTION_GL dat o ENDPOINT (theo vCPU + GPU); day chi la mac dinh.
ENV RENDER_CONCURRENCY=2 \
    RENDER_CHUNKS=3 \
    NODE_ENV=production \
    OPENROUTER_VIDEO_MODEL=google/gemini-2.5-flash

# RunPod goi handler.py -> node worker/pipeline.mjs
CMD ["python3", "worker/handler.py"]
