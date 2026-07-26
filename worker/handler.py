# RunPod Serverless entry. Nhan job -> goi Node pipeline (Remotion) -> tra ket qua.
import os
import json
import tempfile
import subprocess

import runpod

ROOT = os.path.dirname(os.path.abspath(__file__))       # /app/worker
PROJECT = os.path.dirname(ROOT)                          # /app


def handler(event):
    job_input = (event or {}).get("input", {}) or {}

    fd, in_path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(job_input, f, ensure_ascii=False)

    try:
        proc = subprocess.run(
            ["node", os.path.join(ROOT, "pipeline.mjs"), in_path],
            cwd=PROJECT,
            capture_output=True,
            text=True,
            timeout=int(os.environ.get("JOB_TIMEOUT", "1800")),
        )
        if proc.returncode != 0:
            return {"error": (proc.stderr or proc.stdout or "pipeline failed")[-1200:]}

        result = None
        for line in proc.stdout.splitlines():
            if line.startswith("RESULT_JSON:"):
                result = json.loads(line[len("RESULT_JSON:"):])
        if result is None:
            return {"error": "khong tim thay RESULT_JSON", "stdout": proc.stdout[-1200:]}
        return result
    except subprocess.TimeoutExpired:
        return {"error": "het thoi gian render"}
    finally:
        try:
            os.unlink(in_path)
        except OSError:
            pass


runpod.serverless.start({"handler": handler})
