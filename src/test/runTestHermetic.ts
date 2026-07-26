// Hermetic test runner for the findings-panel PR 1 baseline suite.
//
// Unlike runTest.ts (which clones large repos and scans with --config=auto over
// the network), this runner:
//   * copies an in-repo fixture workspace into a fresh tmp dir OUTSIDE the git
//     repo, so semgrep's git-aware scanning actually sees the fixture files
//     (inside the repo, untracked/ignored fixtures are silently skipped), and
//   * points the extension at a local rules file via `semgrep.scan.configuration`
//     so the scan is deterministic and needs no network or login.
//
// It launches VS Code once against that workspace and runs suite/hermetic.
// The optional login leg (SEMGREP_APP_TOKEN) is handled inside the suite.
import path from "node:path";
import * as cp from "node:child_process";
import {
  downloadAndUnzipVSCode,
  runTests,
} from "@vscode/test-electron";
import * as tmp from "tmp";

async function main() {
  const vscodeExecutablePath = await downloadAndUnzipVSCode("stable");

  const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
  const extensionTestsPath = path.resolve(__dirname, "./suite/hermetic");

  // Source fixtures live in the repo; copy them somewhere git can't suppress them.
  const fixtureSrc = path.resolve(
    __dirname,
    "./fixtures/hermetic",
  );
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const realTmpDir = cp
    .execSync(`pwd -P`, { cwd: tmpDir.name })
    .toString()
    .trim();
  const wsDir = path.join(realTmpDir, "ws");
  const rulesDir = path.join(realTmpDir, "rules");
  // cp -R keeps this compatible with the older @types/node this repo pins
  // (no fs.cpSync), and matches runTest.ts's shell-based approach.
  cp.execSync(`cp -R ${path.join(fixtureSrc, "ws")} ${wsDir}`);
  cp.execSync(`cp -R ${path.join(fixtureSrc, "rules")} ${rulesDir}`);
  const rulesPath = path.join(rulesDir, "rules.yaml");
  console.log(`Hermetic workspace: ${wsDir}`);
  console.log(`Hermetic rules:     ${rulesPath}`);

  // Headless display plumbing (mirrors runTest.ts).
  const extensionTestsEnv: NodeJS.ProcessEnv = {
    CWD: wsDir,
    NODE_ENV: "test",
    // Consumed by the suite: local rules config + expected-fixture location.
    SEMGREP_HERMETIC_RULES: rulesPath,
    SEMGREP_HERMETIC_WS: wsDir,
  };

  let hasFailed = false;
  try {
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath,
      extensionTestsEnv,
      launchArgs: [wsDir, "--disable-extensions"],
    });
  } catch (err) {
    console.error("Hermetic suite failed", err);
    hasFailed = true;
  } finally {
    tmpDir.removeCallback();
  }
  if (hasFailed) process.exit(1);
}

main();
