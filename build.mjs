#!/usr/bin/env node

import cssModulesPlugin from "esbuild-css-modules-plugin";
import esbuild from "esbuild";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";
async function buildSentrySourceMap() {
  esbuild.build({
    sourcemap: true, // Source map generation must be turned on
    bundle: true,
    platform: "node",
    plugins: [
      // Put the Sentry esbuild plugin after all other plugins
      sentryEsbuildPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "semgrep",
        project: "ide-vscode",
      }),
    ],
  });
}
// We should really just do this in the semgrep repo but oh well
async function buildLspJS(watch, minify) {
  const options = {
    logLevel: "info",
    entryPoints: ["./dist/lspjs/semgrep-lsp.js"],
    outfile: "./out/semgrep-lsp.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    minify,
  };
  if (watch) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}
async function buildExtension(watch, sourcemap, minify) {
  const options = {
    logLevel: "info",
    entryPoints: ["./src/extension.ts"],
    outfile: "./out/main.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    external: ["vscode"],
    sourcemap,
    plugins: [esbuildProblemMatcherPlugin],
    minify,
  };
  if (watch) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}
async function buildWebview(watch, sourcemap, minify) {
  let options = {
    logLevel: "info",
    entryPoints: ["./src/webview-ui/index.tsx"],
    outfile: "./out/webview.js",
    bundle: true,
    platform: "node",
    plugins: [cssModulesPlugin()],
    sourcemap,
    minify,
  };
  if (watch) {
    let ctx = await esbuild.context(options);
    await ctx.watch();
  } else {
    await esbuild.build(options);
  }
}

const isWatch = process.argv.includes("--watch");
const isSourcemap = process.argv.includes("--sourcemap");
const isMinify = process.argv.includes("--minify");
/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`,
        );
      });
      console.log("[watch] build finished");
    });
  },
};
await Promise.all([
  buildExtension(isWatch, isSourcemap, isMinify),
  buildLspJS(isWatch, isMinify),
  buildWebview(isWatch, isSourcemap, isMinify),
  buildSentrySourceMap(),
]);
