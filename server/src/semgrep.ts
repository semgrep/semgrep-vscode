import {
  Range,
  Position,
  Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver";
import { spawn, ChildProcess } from "child_process";
import { SOURCE_NAME } from "./constant";
import { URL } from "url";
import * as child_process from 'child_process';
import * as https from 'https';
import * as fs from 'fs';

const getSeverity = (result: any): DiagnosticSeverity => {
  switch (result.extra.severity) {
    case "ERROR":
      return DiagnosticSeverity.Error;
    case "WARNING":
      return DiagnosticSeverity.Warning;
    default:
      return DiagnosticSeverity.Information;
  }
};

const onExit = (child: ChildProcess): Promise<void> => {
  return new Promise((resolve, reject) => {
    child.on("exit", resolve);
    child.on('error', reject);
  });
};

// TODO: restore suggestions
// export const synthesizePatterns = async (
//   path: string,
//   ranges: string[]
// ): Promise<vscode.QuickPickItem[]> => {
//   let results: any[] | null = null;
//   for (const range of ranges) {
//     const args = ["--quiet", "--synthesize-patterns", range, path];
//     try {
//       var { stdout, stderr } = await execFileAsync("semgrep", args, {
//         timeout: 30 * 1000,
//         encoding: "utf-8",
//         shell: true,
//       });
//     } catch (error: any) {
//       if (error.code === 127 && error.message.includes("command not found")) {
//         await vscode.window.showInformationMessage(
//           "Semgrep is not installed, try running `pip install semgrep`"
//         );
//         return [];
//       } else {
//         console.error(
//           `Failed to invoke semgrep CLI with args ${args}:\n  ${error}\n\n[STDERR]\n\n${stderr}`
//         );
//         continue;
//       }
//     }

//     if (stdout[0] !== "{") {
//       console.warn(
//         `Didn't get JSON from semgrep CLI with args ${args}:\n\n[STDOUT]\n\n${stdout}`
//       );
//       continue;
//     }

//     results = Object.entries(JSON.parse(stdout)).filter(
//       (entry: any) =>
//         results === null ||
//         new Set(results.map((result) => result[1])).has(entry[1])
//     );
//   }

//   if (results === null) {
//     return [];
//   }

//   return results.map((entry) => ({
//     label: entry[0] as string,
//     detail: entry[1] as string,
//   }));
// };
export const getSuggestions = () => {};

class RulesCache {
  ruleNameToText: Map<string, string> = new Map();
  
  isRegistryRule(rule: string): boolean {
    return rule.startsWith("https://semgrep.dev/p/") || rule.startsWith("p/") || rule === 'auto'; 
  }

  ruleURL(rule: string): string {
    if (rule.startsWith("https://semgrep.dev/p/")) {
      return rule.replaceAll('https://semgrep.dev/p/', 'https://semgrep.dev/c/p/');
    }
    if (rule.startsWith("https://semgrep.dev/c/")) {
      return rule;
    }
    return "https://semgrep.dev/c/" + rule;
    // TODO support auto
  }

  getRuleText(rule: string): Promise<string> {
    if (!this.isRegistryRule(rule)) {
      return Promise.resolve(rule);
    }

    const cachedFile = this.ruleNameToText.get(rule);
    if (cachedFile != null) {
      return Promise.resolve(cachedFile);
    }

    // TODO use an https library with a sane interface
    return new Promise((resolve, reject) => {
      const ruleURL = this.ruleURL(rule);

      // TODO handle errors
      https.get(ruleURL, (res) => {
        let str = '';
        res.on('data', chunk => { str += chunk });
        res.on('end', () => {
          this.ruleNameToText.set(rule, str);
          resolve(str);
        });
      });
    });
  }
}

const rulesCache: RulesCache = new RulesCache();

export class SemgrepRPC {
  constructor() {
    // TODO start semgrep-rpc server
  }

  async getDiagnostics(uri: string, rules: string): Promise<Array<Diagnostic> | null> {
    const ruleText = await rulesCache.getRuleText(rules);
    // TODO async
    const filename = uri.replace('file://', '');
    const content = fs.readFileSync(filename).toString();
    const request = {
      method: 'scan',
      params: {
        rule: ruleText,
        targets: [{name: "test.js", content}],
        options: {strict: true, no_rewrite_rule_ids: true},
        output: {output_time: true},
      },
      // TODO increment this, and probably use a real json-rpc library
      id: 0,
      jsonrpc: '2.0'
    }
    // TODO async
    const output = child_process.execFileSync('curl', ['localhost:4000', '--data-raw', JSON.stringify(request)]).toString();
    const result = JSON.parse(output);

    return result.result.results.map((result: any) => {
      const range = Range.create(
        Position.create(result.start.line - 1, result.start.col - 1),
        Position.create(result.end.line - 1, result.end.col - 1)
      );
      const diagnostic: Diagnostic = {
        range,
        message: result.extra.message,
        severity: getSeverity(result),
        source: SOURCE_NAME,
        code: result.check_id,
      };

      return diagnostic;
    });
  }
}
// TODO: add ability to cache rules to speed up analysis?
//       `curl -L -H 'User-Agent: Semgrep/0.90.0' https://semgrep.dev/p/r2c-ci`
export const getDiagnostics = async (
  uri: string,
  rules: string
): Promise<Diagnostic[] | null> => {
  const url = new URL(uri);
  const child = spawn("semgrep", ["--disable-version-check", "--json", "--config", rules, url.pathname], {
    timeout: 30 * 1000,
  });

  if (child === null) {
    return null;
  }

  let output = [];
  for await (const chunk of child.stdout) {
    output.push(chunk);
  }

  await onExit(child);

  if (child.exitCode !== 0) {
    return null;
  }

  const results = JSON.parse(output.join("")).results;
  return results.map((result: any) => {
    const range = Range.create(
      Position.create(result.start.line - 1, result.start.col - 1),
      Position.create(result.end.line - 1, result.end.col - 1)
    );
    const diagnostic: Diagnostic = {
      range,
      message: result.extra.message,
      severity: getSeverity(result),
      source: SOURCE_NAME,
      code: result.check_id,
    };

    return diagnostic;
  });
};

export const getVersion = async (): Promise<string | null> => {
  let child;

  child = spawn("semgrep", ["--version"], {
    timeout: 3 * 1000,
  });

  let output = [];
  for await (const chunk of child.stdout) {
    output.push(chunk);
  }

  try {
    await onExit(child);
  } catch(error) {
    console.error(
      `Failed to invoke semgrep --version:\n  ${error}`
    );
    return null;
  }

  return output.join('').trim();
};
