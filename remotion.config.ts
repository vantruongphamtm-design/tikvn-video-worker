/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Ep webpack dung hash Node crypto (sha256) thay vi wasm-hash: Node 24 lam vo
// wasm-hash cua webpack (Cannot read properties of undefined 'length' khi bundle).
Config.overrideWebpackConfig((config) => {
  const c = enableTailwind(config);
  // cache:false = tranh persistent-cache hashing (cho undefined tren Node 24).
  return { ...c, cache: false, output: { ...(c.output || {}), hashFunction: "sha256" } };
});
