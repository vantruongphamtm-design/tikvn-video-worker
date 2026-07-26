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

ENV RENDER_CONCURRENCY=2 \
    NODE_ENV=production

# RunPod goi handler.py -> node worker/pipeline.mjs
CMD ["python3", "worker/handler.py"]
