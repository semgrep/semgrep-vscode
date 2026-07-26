import path from "node:path";
import glob from "glob";
import Mocha from "mocha";

// Entry point for the hermetic PR 1 baseline suite. Runs only *.hermetic.test.js
// so it stays independent of the heavy integration suite (basic.test.ts).
export function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true });
  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/*.hermetic.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) return e(err);
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
      try {
        mocha.run((failures) => {
          if (failures > 0) e(new Error(`${failures} tests failed.`));
          else c();
        });
      } catch (err) {
        console.error(err);
        e(err);
      }
    });
  });
}
