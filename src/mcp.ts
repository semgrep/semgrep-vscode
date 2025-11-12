import * as vscode from "vscode";
import fs from "fs";
import path from "node:path";

const mcpRuleText = `---
alwaysApply: true
---
- Always look first to any semgrep mcp servers for code security needs
- Whenever you generate code or commands, you MUST first ensure safety by scanning the content with the semgrep_scan tool. If you change any lockfile, you MUST run the semgrep_supply_chain tool. 

`;

export async function setupMcp(repoPath: string): Promise<void> {
  const mcpRulePath = path.join(repoPath, ".cursor", "rules", "semgrep.mdc");
  const mcpJsonPath = path.join(repoPath, ".cursor", "mcp.json");
  const serverInfo = {
    type: "streamable-http",
    url: "https://mcp.semgrep.ai/mcp",
  };
  let mcpJsonContents: any;
  if (fs.existsSync(mcpJsonPath)) {
    mcpJsonContents = JSON.parse(
      await vscode.workspace.fs
        .readFile(vscode.Uri.parse(mcpJsonPath))
        .then((buf) => buf.toString()),
    );
    // TODO: could overwrite
    mcpJsonContents.mcpServers["semgrep"] = serverInfo;
  } else {
    mcpJsonContents = {
      mcpServers: {
        semgrep: serverInfo,
      },
    };
  }
  await vscode.workspace.fs.writeFile(
    vscode.Uri.parse(mcpRulePath),
    new TextEncoder().encode(mcpRuleText),
  );
  await vscode.workspace.fs.writeFile(
    vscode.Uri.parse(mcpJsonPath),
    new TextEncoder().encode(JSON.stringify(mcpJsonContents)),
  );

  vscode.window.showInformationMessage(
    "MCP setup completed, finish by enabling the `semgrep` MCP server. Happy vibe coding!",
  );
}
