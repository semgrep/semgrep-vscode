import path from "node:path";
import find = require("find-process");
import * as cp from "node:child_process";
import {
  downloadAndUnzipVSCode,
  resolveCliArgsFromVSCodeExecutablePath,
  runTests,
} from "@vscode/test-electron";
import * as tmp from "tmp";

const REPOS = [
  ["semgrep", "https://github.com/semgrep/semgrep.git", "v1.52.0"],
  ["juice-shop", "https://github.com/juice-shop/juice-shop.git", "v15.0.0"],
  ["semgrep-vscode", "https://github.com/semgrep/semgrep-vscode.git", "v1.5.2"],
  [
    "semgrep-intellij",
    "https://github.com/semgrep/semgrep-intellij.git",
    "v0.1.5",
  ],
];
async function main() {
  // Download VSCode
  const vscodeExecutablePath = await downloadAndUnzipVSCode("stable");
  const [cli, ...args] =
    resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
  // Install some extensions so it's more like a real user
  // Install ruff
  cp.spawnSync(
    cli,
    args.concat(["--install-extension", "charliermarsh.ruff"]),
    {
      encoding: "utf-8",
      stdio: "inherit",
    },
  );
  // Setup temp dir for all repos
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const realTmpDir = cp
    .execSync(`pwd -P`, { cwd: tmpDir.name })
    .toString()
    .trim();
  console.log(`Using tmp dir ${realTmpDir}`);
  let hasFailed = false;
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");

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

    if (process.env["USE_JS"] !== undefined) {
      extensionTestsEnv = {
        ...extensionTestsEnv,
        USE_JS: process.env["USE_JS"],
      };
    }
    const cwd = process.cwd();
    extensionTestsEnv = {
      ...extensionTestsEnv,
      CWD: cwd,
      NODE_ENV: "test",
    };
    for (const repo of REPOS) {
      const repoName = repo[0];
      const repoUrl = repo[1];
      const tag = repo[2];
      console.log(`Running tests for ${repoName}`);
      const repoPath = path.join(realTmpDir, repoName); // nosem
      console.log(`Running in ${repoPath}`);
      // Clone repo
      cp.execSync(`git clone ${repoUrl} ${repoPath}`); // nosem
      cp.execSync(`git checkout ${tag}`, { cwd: repoPath }); // nosem
      // Download VS Code, unzip it and run the integration test
      try {
        await runTests({
          vscodeExecutablePath,
          extensionDevelopmentPath,
          extensionTestsPath,
          extensionTestsEnv,
          launchArgs: [repoPath],
        });
      } catch (err) {
        console.error(`Failed to run tests for ${repoName}`);
        hasFailed = true;
      }
    }
  } catch (err) {
    console.error("Failed to run tests");
    hasFailed = true;
  } finally {
    tmpDir.removeCallback();
  }
  if (hasFailed) {
    process.exit(1);
  }
}

main();
