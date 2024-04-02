#!/usr/bin/env node

import cssModulesPlugin from "esbuild-css-modules-plugin";
import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["./src/webview-ui/index.tsx"],
  bundle: true,
  outfile: "out/webview.js",
  plugins: [cssModulesPlugin()],
});

// async function watch(){
//   let ctx = await esbuild.context({
//     entryPoints: ['./src/webview-ui/index.tsx'],
//     bundle: true,
//     outfile: 'out/webview.js',
//     plugins: [cssModulesPlugin()],
//   });
//   await ctx.watch();
// }
// watch();
