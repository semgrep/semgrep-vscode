#!/usr/bin/env node

import cssModulesPlugin from "esbuild-css-modules-plugin";
import esbuild from "esbuild";

const commonOptions = {
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["vscode"],
};

async function buildExtension(watch) {
  const options = {
    entryPoints: ["./src/extension.ts"],
    outfile: "./out/extension.js",
    ...commonOptions,
  };
  if (watch) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}
async function buildWebview(watch) {
  let options = {
    entryPoints: ["./src/webview-ui/index.tsx"],
    outfile: "./out/webview.js",
    plugins: [cssModulesPlugin()],
    ...commonOptions,
  };
  if (watch) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}

const isWatch = process.argv.includes("--watch");

await Promise.all([buildExtension(isWatch), buildWebview(isWatch)]);
