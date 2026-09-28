import * as fs from "node:fs";
import which from "which";
import { DIST_BINARY_PATH } from "./constants";
import type { Environment } from "./env";

/* Which Semgrep to run.

   This lives on its own, rather than in `lsp.ts`, so that callers who only
   need the binary (the findings scan) do not have to pull in the language
   client to get it. `findSemgrep` in `lsp.ts` follows the same precedence, so
   the language server and anything else that shells out stay on one install.
 */
export function semgrepBinaryPath(env: Environment): string | null {
  // An explicitly configured path always wins.
  if (env.config.path.length > 0 && fs.existsSync(env.config.path)) {
    return env.config.path;
  }
  // Then the version shipped with the extension, which is the proprietary one.
  if (fs.existsSync(DIST_BINARY_PATH)) {
    return DIST_BINARY_PATH;
  }
  return which.sync("semgrep", { nothrow: true });
}
