import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";
import {
  type LanguageClient,
  PublishDiagnosticsNotification,
  type PublishDiagnosticsParams,
} from "vscode-languageclient/node";

// PR 1 baseline / contract suite for the dedicated findings panel.
//
// This pins the diagnostic contract the findings view will consume, established
// empirically by driving `semgrep lsp` directly:
//   * source === "Semgrep"                (the view's filter key)
//   * code   === short rule id            (the view's leaf label)
//   * severity 1/2/3 == Error/Warning/Info (severity-mapping baseline)
//   * exact per-file finding counts        (Problems-tab behavior we must not regress)
//
// It also documents the CURRENT "before" state: no findings view is contributed
// yet. That assertion flips in PR 2.
//
// The optional login leg records what the bundled Pro engine + a logged-in
// deployment policy emit (4th severity level? product discriminator?) as a CI
// artifact — the two questions that cannot be answered on the OSS engine.

const SCAN_TIMEOUT = 120000;

const RULES = process.env["SEMGREP_HERMETIC_RULES"];
const WS = process.env["SEMGREP_HERMETIC_WS"];

// Expected findings for the fixture workspace (see fixtures/hermetic).
// Keyed by basename. Values verified empirically by driving `semgrep lsp`:
//   * line   — 0-based (LSP Position.line), NOT the editor's 1-based number.
//   * severity — LSP DiagnosticSeverity enum (1=Error, 2=Warning, 3=Information).
//   * ruleIdSuffix — file-loaded rules are namespaced by the rules-file stem
//     (rules.yaml -> "rules.hardcoded-aws-key"), so we match on the suffix.
//     This pins a real gotcha for the findings view's leaf label: the short id
//     is NOT always the bare rule id; deriving it must strip the config prefix.
const EXPECTED: Record<
  string,
  { ruleIdSuffix: string; line: number; severity: number }[]
> = {
  "login.py": [{ ruleIdSuffix: "tainted-sql-string", line: 6, severity: 1 }],
  "config.py": [
    { ruleIdSuffix: "hardcoded-aws-key", line: 1, severity: 2 },
    { ruleIdSuffix: "placeholder-password-note", line: 2, severity: 3 },
  ],
};

async function getEnv() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const extension = vscode.extensions.getExtension("Semgrep.semgrep")!;
  if (!extension.isActive) await extension.activate();
  return extension.exports;
}

function waitForDiagnostics(
  client: LanguageClient,
  uriString: string,
): Promise<PublishDiagnosticsParams> {
  return new Promise((resolve) => {
    client.onNotification(PublishDiagnosticsNotification.type, (params) => {
      if (params.uri === uriString && params.diagnostics.length > 0) {
        resolve(params);
      }
    });
  });
}

suite("Findings panel — PR 1 baseline (hermetic)", function () {
  this.timeout(SCAN_TIMEOUT);
  let client: LanguageClient;

  suiteSetup(async function () {
    // Only meaningful under the dedicated hermetic runner, which sets these.
    // If another runner picks this file up, skip rather than fail.
    if (!RULES || !WS) {
      this.skip();
      return;
    }

    // Point the extension at the local rules file — no --config=auto, no network.
    // Set this BEFORE activation so the LS starts with the right config.
    await vscode.workspace
      .getConfiguration("semgrep")
      .update(
        "scan.configuration",
        [RULES],
        vscode.ConfigurationTarget.Workspace,
      );

    const env = await getEnv();
    client = env.client;

    // Wait for rules to load, but don't hang forever: the rulesRefreshed event
    // may already have fired before we subscribed (activation completed during
    // getEnv), so race it against a timeout and proceed either way. A later
    // scan step re-confirms rules are actually loaded via real diagnostics.
    await new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      env.onRulesRefreshed(done, true);
      setTimeout(done, 30000);
    });

    // Restart the LS so it definitely picks up the workspace config set above,
    // then give rules a moment to reload. This removes the ordering dependency
    // between config-update and activation that made setup flaky in CI.
    if (client) {
      await vscode.commands.executeCommand("semgrep.restartLanguageServer");
      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        env.onRulesRefreshed(done, true);
        setTimeout(done, 30000);
      });
      client = env.client;
    }
  });

  // ---- Contract: the fields the findings view depends on ----
  for (const [file, expected] of Object.entries(EXPECTED)) {
    test(`diagnostic contract for ${file}`, async () => {
      const uri = vscode.Uri.file(path.join(WS as string, file));
      const diagsPromise = waitForDiagnostics(client, uri.toString());
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
      const params = await diagsPromise;

      assert.strictEqual(
        params.diagnostics.length,
        expected.length,
        `${file}: finding count`,
      );

      for (const d of params.diagnostics) {
        // Filter key the findings view keys on.
        assert.strictEqual(d.source, "Semgrep", `${file}: source`);
        // Rule id — may be prefixed by the config/file stem (see EXPECTED note).
        const code = String(
          typeof d.code === "object" ? (d.code as any).value : d.code,
        );
        const match = expected.find((e) => code.endsWith(e.ruleIdSuffix));
        assert.ok(match, `${file}: unexpected rule id ${code}`);
        assert.strictEqual(
          d.severity,
          match.severity,
          `${file}: severity for ${code}`,
        );
        assert.strictEqual(
          d.range.start.line,
          match.line,
          `${file}: line for ${code}`,
        );
      }
    });
  }

  // ---- "Before" state: no findings view exists yet (flips in PR 2) ----
  test("no findings view is contributed yet (documents PR 1 baseline)", () => {
    const ext = vscode.extensions.getExtension("Semgrep.semgrep");
    const views =
      ext?.packageJSON?.contributes?.views?.["semgrep-sidebar"] ?? [];
    const ids = views.map((v: { id: string }) => v.id);
    assert.ok(
      !ids.includes("semgrep.view.findings"),
      "PR 1 baseline: findings view should not exist yet",
    );
  });

  // ---- Optional Pro/login leg: RECORD (not assert) what the paid path emits ----
  //
  // Login handshake (verified against the extension's auth wiring):
  //   * The `semgrep lsp` child process inherits the extension host's env
  //     (src/lsp.ts sets options.env only for tracing; otherwise the LS
  //     inherits process.env), so a SEMGREP_APP_TOKEN present in CI reaches
  //     the engine and activates the deployment policy WITHOUT the interactive
  //     OAuth flow (loginStart -> browser -> loginFinish).
  //   * BUT the extension's own login *state* (env.deploymentInfo, the
  //     `semgrep.loggedIn` context key) is not hydrated by the env var alone —
  //     it is set by loginFinish or an explicit `semgrep.loginStatus`. So we
  //     call loginStatus to make the extension reflect the token-based session,
  //     then confirm a deployment actually came back before recording.
  //
  // POLICY: SEMGREP_APP_TOKEN must be a Semgrep-owned TEST org token, never a
  // customer/CDK org. It only ever runs against the in-repo fixture code, and
  // nothing here logs the token or transmits customer code.
  test("record Pro/logged-in diagnostic shape when SEMGREP_APP_TOKEN is set", async function () {
    if (!process.env["SEMGREP_APP_TOKEN"]) {
      this.skip();
      return;
    }

    // Hydrate the extension's login state from the env-provided token.
    // Bound the wait: with an invalid/unreachable token the LS may block on
    // loginStatus rather than returning null quickly (observed against the OSS
    // engine), so we fail the test cleanly instead of hanging the CI job.
    const LOGIN_TIMEOUT = 20000;
    const loggedIn = await Promise.race([
      vscode.commands.executeCommand("semgrep.loginStatus").then(() => true),
      new Promise<boolean>((r) => setTimeout(() => r(false), LOGIN_TIMEOUT)),
    ]);
    assert.ok(
      loggedIn,
      `semgrep.loginStatus did not return within ${LOGIN_TIMEOUT}ms — ` +
        "token likely invalid/expired or the platform was unreachable",
    );
    const env = await getEnv();
    const deployment = env.deploymentInfo;
    assert.ok(
      deployment && deployment.deploymentName,
      "SEMGREP_APP_TOKEN did not resolve to a deployment — token invalid, " +
        "expired, or the engine could not reach the platform",
    );
    console.log(`Logged in to deployment: ${deployment.deploymentName}`);

    // Capture raw diagnostics across the fixture and dump them for review.
    // This answers the two OSS-unanswerable questions in CI:
    //   Q1: does a Critical policy finding carry a 4th severity level / data?
    //   Q2: is there a product discriminator (Code / Supply Chain / Secrets)?
    const captured: {
      uri: string;
      code: unknown;
      severity: number | undefined;
      source: string | undefined;
      hasData: boolean;
      keys: string[];
    }[] = [];
    const raw: unknown[] = [];
    client.onNotification(PublishDiagnosticsNotification.type, (params) => {
      for (const d of params.diagnostics) {
        raw.push({ uri: params.uri, diagnostic: d });
        captured.push({
          uri: params.uri,
          code: d.code,
          severity: d.severity,
          source: d.source,
          hasData: (d as { data?: unknown }).data !== undefined,
          keys: Object.keys(d),
        });
      }
    });

    // Re-scan with the deployment policy now active.
    await vscode.commands.executeCommand("semgrep.scanWorkspaceFull");
    await new Promise((r) => setTimeout(r, 30000));

    const outPath = path.join(process.cwd(), "pro-diagnostics.json");
    fs.writeFileSync(outPath, JSON.stringify(raw, null, 2));

    // Summary that directly speaks to Q1/Q2 (also visible in CI logs).
    const severities = [...new Set(captured.map((c) => c.severity))].sort();
    const anyData = captured.some((c) => c.hasData);
    const allKeys = [...new Set(captured.flatMap((c) => c.keys))].sort();
    console.log(
      `Recorded ${raw.length} Pro/logged-in diagnostics -> ${outPath}\n` +
        `  severities seen: ${JSON.stringify(severities)} ` +
        `(4 distinct => 4-level severity may be representable)\n` +
        `  any diagnostic.data present: ${anyData} ` +
        `(true => product/severity metadata may be recoverable)\n` +
        `  union of diagnostic keys: ${JSON.stringify(allKeys)}`,
    );
    // Intentionally no hard assertion on Q1/Q2 yet: this test EXISTS to produce
    // the artifact + summary that tell us whether PR 3 ships 4 severity levels
    // and how PR 2 routes findings by product. Assertions land once we know.
  });
});
