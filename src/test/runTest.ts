import * as path from "path";
import find = require("find-process");

import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");
    // Setup headless mode
    let extensionTestsEnv: NodeJS.ProcessEnv | undefined = undefined;
    if (process.platform === "linux" && !process.env["DISPLAY"]) {
      let display: string | undefined;
      const processes = await find("name", "/usr/bin/Xvfb");
      for (const item of processes) {
        if (item.name !== "Xvfb") {
          continue;
        }
        if (item.cmd !== undefined && item.cmd.length > 0) {
          display = item.cmd.split(" ")[1];
        }
      }
      if (display !== undefined) {
        extensionTestsEnv = { DISPLAY: display };
      }
    }

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      extensionTestsEnv,
      launchArgs: ["walkthrough", "--disable-extensions"],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
