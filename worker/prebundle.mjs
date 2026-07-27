// Chay luc BUILD DOCKER: bundle Remotion 1 lan vao BUNDLE_DIR. Worker luc chay tai su dung
// -> bo hoan toan 30-60s bundle moi lan worker lanh (nut that toc do lon nhat).
import { getBundle } from "./render.mjs";

const dir = await getBundle();
console.log("PREBUNDLE_OK:", dir);
