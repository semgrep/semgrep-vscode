import * as vscode from "vscode";
import type { Environment } from "../env";
import {
  ScanError,
  type ScanFinding,
  type ScanSeverity,
  runFindingsScan,
} from "../findingsScan";

/*****************************************************************************/
/* Prelude */
/*****************************************************************************/

/* A dedicated tree view of Semgrep findings.

   There are two possible sources for what this shows, and they are not
   equivalent:

   - `semgrep scan --json`, run on demand. Carries the rule's metadata, so a
     row can say "Found Cross-Site-Scripting (XSS)" and sort a CRITICAL above
     an ERROR. This is the preferred source.
   - The LSP diagnostics the language client already holds, which is what
     fills the Problems panel. These arrive live as you save, but a Semgrep
     diagnostic carries only range/severity/source/message/code — no `data`
     payload — so there is no vulnerability class to show and CRITICAL has
     already been flattened into Error.

   The view runs on diagnostics until a scan has been run, then switches to the
   scan's results. `sourceLabel` in the view header says which one you are
   looking at, because the difference is visible in the rows.
 */

/*****************************************************************************/
/* Types */
/*****************************************************************************/

/* Semgrep tags every diagnostic it publishes with this source, which is how we
   tell our findings apart from those of other extensions. */
const FINDING_SOURCE = "Semgrep";

const GROUP_BY_STATE_KEY = "semgrep.findings.groupBy";

/* How long to wait for the diagnostics to settle before rebuilding the tree.
   A workspace scan publishes one notification per file, so without this we
   would rebuild the whole tree hundreds of times over. */
const REFRESH_DEBOUNCE_MS = 150;

export type GroupBy = "class" | "file" | "severity" | "rule";

/* Findings whose rule ships no `metadata.vulnerability_class`, gathered under
   one heading rather than scattered as their own groups. */
const UNCLASSIFIED = "Unclassified";

/* Most severe first — this is the sort order as well as the display order. */
const SEVERITIES: ScanSeverity[] = ["critical", "error", "warning", "info"];

type Finding = {
  uri: vscode.Uri;
  range: vscode.Range;
  severity: ScanSeverity;
  message: string;
  /* The fully qualified id Semgrep reported, e.g.
     `javascript.express.security.audit.xss.direct-response-write`. Kept for the
     hover; it is a registry namespace path, not what the rule author wrote. */
  ruleId: string;
  /* The rule's own `id:` — `direct-response-write` — which is what identifies
     the rule to a reader. Widened by the smallest possible prefix only when two
     distinct rules in the current results share one, so no two rules ever
     render identically. */
  ruleName: string;
  vulnerabilityClass: string | undefined;
  cwe: string | undefined;
  docsUrl: vscode.Uri | undefined;
};

type FindingsNode = GroupNode | FindingNode;

/*****************************************************************************/
/* Rule ids */
/*****************************************************************************/

/* Registry rule ids repeat their last segment
   (`...audit.eval-detected.eval-detected`), which reads as a stutter once we
   shorten them. */
function canonicalRuleId(ruleId: string): string[] {
  const segments = ruleId.split(".").filter((segment) => segment.length > 0);
  if (
    segments.length > 1 &&
    segments[segments.length - 1] === segments[segments.length - 2]
  ) {
    segments.pop();
  }
  return segments.length > 0 ? segments : [ruleId];
}

/* Two different rules routinely end in the same segment — a local
   `demo.python.dangerous-eval` and a registry
   `javascript.lang.security.audit.dangerous-eval` would both display as
   `dangerous-eval`, which makes the tree look like it is repeating itself.
   Give every rule the shortest trailing slice of its id that no other rule in
   the current result set shares. */
function ruleDisplayNames(ruleIds: Iterable<string>): Map<string, string> {
  const unique = [...new Set(ruleIds)];
  const segmentsById = new Map(
    unique.map((ruleId) => [ruleId, canonicalRuleId(ruleId)]),
  );

  const suffix = (segments: string[], depth: number): string =>
    segments.slice(Math.max(0, segments.length - depth)).join(".");

  /* Count how many rules share each suffix, one pass per depth. Asking
     "does anything else collide with me?" per rule instead would be quadratic
     in the number of rules, which on a workspace with a few thousand findings
     spread over a thousand rules costs seconds of frozen UI. */
  const maxDepth = unique.reduce(
    (deepest, ruleId) =>
      Math.max(deepest, (segmentsById.get(ruleId) as string[]).length),
    1,
  );
  const countsByDepth: Map<string, number>[] = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    const counts = new Map<string, number>();
    for (const ruleId of unique) {
      const candidate = suffix(segmentsById.get(ruleId) as string[], depth);
      counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    }
    countsByDepth.push(counts);
  }

  const names = new Map<string, string>();
  for (const ruleId of unique) {
    const segments = segmentsById.get(ruleId) as string[];
    // Falls back to the whole id when even that is not unique.
    let chosen = suffix(segments, segments.length);
    for (let depth = 1; depth <= segments.length; depth++) {
      const candidate = suffix(segments, depth);
      if (countsByDepth[depth - 1].get(candidate) === 1) {
        chosen = candidate;
        break;
      }
    }
    names.set(ruleId, chosen);
  }
  return names;
}

/*****************************************************************************/
/* Presentation helpers */
/*****************************************************************************/

function locationOf(uri: vscode.Uri, range: vscode.Range): string {
  return `${vscode.workspace.asRelativePath(uri)}:${range.start.line + 1}`;
}

/* `asRelativePath` uses the platform separator, so split on both. */
function splitRelativePath(uri: vscode.Uri): {
  directory: string | undefined;
  fileName: string;
} {
  const relative = vscode.workspace.asRelativePath(uri);
  const lastSlash = Math.max(
    relative.lastIndexOf("/"),
    relative.lastIndexOf("\\"),
  );
  return lastSlash === -1
    ? { directory: undefined, fileName: relative }
    : {
        directory: relative.slice(0, lastSlash),
        fileName: relative.slice(lastSlash + 1),
      };
}

/* Deep source trees share long prefixes — a hundred findings under
   `src/main/java/org/owasp/benchmark/testcode/` all truncate to the same
   unreadable string. The file name and line are what tell two rows apart, so
   they go in the label, where VS Code will not clip them, and the directory
   goes in the description, which is allowed to truncate. */
function shortLocationOf(uri: vscode.Uri, range: vscode.Range): string {
  return `${splitRelativePath(uri).fileName}:${range.start.line + 1}`;
}

function severityLabel(severity: ScanSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function severityIcon(severity: ScanSeverity): vscode.ThemeIcon {
  switch (severity) {
    /* Critical and Error share the error icon. VS Code's problem vocabulary
       has three levels, not four, and inventing a fourth glyph for Critical
       reads as decoration rather than meaning — the ordering, the severity
       grouping and the tooltip all still distinguish the two. */
    case "critical":
    case "error":
      return new vscode.ThemeIcon(
        "error",
        new vscode.ThemeColor("problemsErrorIcon.foreground"),
      );
    case "warning":
      return new vscode.ThemeIcon(
        "warning",
        new vscode.ThemeColor("problemsWarningIcon.foreground"),
      );
    default:
      return new vscode.ThemeIcon(
        "info",
        new vscode.ThemeColor("problemsInfoIcon.foreground"),
      );
  }
}

/*****************************************************************************/
/* Building findings */
/*****************************************************************************/

/* The language client folds `codeDescription.href` into the diagnostic code,
   turning it from a bare string into a `{value, target}` pair. Handle both,
   since a rule with no registry entry (a local rule, say) has no href. */
function ruleInfoOfDiagnostic(diagnostic: vscode.Diagnostic): {
  ruleId: string;
  docsUrl: vscode.Uri | undefined;
} {
  const code = diagnostic.code;
  if (code === undefined || code === null) {
    return { ruleId: "(unknown rule)", docsUrl: undefined };
  }
  if (typeof code === "string" || typeof code === "number") {
    return { ruleId: String(code), docsUrl: undefined };
  }
  return { ruleId: String(code.value), docsUrl: code.target };
}

function severityOfDiagnostic(
  severity: vscode.DiagnosticSeverity,
): ScanSeverity {
  switch (severity) {
    case vscode.DiagnosticSeverity.Error:
      return "error";
    case vscode.DiagnosticSeverity.Warning:
      return "warning";
    default:
      return "info";
  }
}

/* Fill in the two fields that can only be decided once the whole result set is
   known. */
function withRuleNames(
  findings: Omit<Finding, "ruleName">[],
): Finding[] {
  const names = ruleDisplayNames(findings.map((finding) => finding.ruleId));
  return findings.map((finding) => ({
    ...finding,
    ruleName: names.get(finding.ruleId) ?? finding.ruleId,
  }));
}

function findingsFromScan(results: ScanFinding[]): Finding[] {
  return withRuleNames(
    results.map((result) => ({
      uri: result.uri,
      range: result.range,
      severity: result.severity,
      message: result.message,
      ruleId: result.ruleId,
      vulnerabilityClass: result.vulnerabilityClass,
      cwe: result.cwe,
      docsUrl: result.docsUrl,
    })),
  );
}

function findingsFromDiagnostics(): Finding[] {
  const collected: Omit<Finding, "ruleName">[] = [];
  for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
    for (const diagnostic of diagnostics) {
      if (diagnostic.source !== FINDING_SOURCE) {
        continue;
      }
      const { ruleId, docsUrl } = ruleInfoOfDiagnostic(diagnostic);
      collected.push({
        uri,
        range: diagnostic.range,
        severity: severityOfDiagnostic(diagnostic.severity),
        message: diagnostic.message,
        ruleId,
        // Diagnostics carry no rule metadata; see the note at the top.
        vulnerabilityClass: undefined,
        cwe: undefined,
        docsUrl,
      });
    }
  }
  return withRuleNames(collected);
}

/* Most severe first, then in file order, so the tree reads top-to-bottom the
   way someone would work through the findings. */
function bySeverityThenPosition(a: Finding, b: Finding): number {
  const severity =
    SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
  if (severity !== 0) {
    return severity;
  }
  const file = a.uri.fsPath.localeCompare(b.uri.fsPath);
  if (file !== 0) {
    return file;
  }
  return a.range.start.compareTo(b.range.start);
}

/*****************************************************************************/
/* Tree items */
/*****************************************************************************/

class GroupNode extends vscode.TreeItem {
  constructor(
    label: string,
    readonly findings: Finding[],
    options: {
      icon?: vscode.TreeItem["iconPath"];
      resourceUri?: vscode.Uri;
      description?: string;
      /* Descriptions are truncated from the right. Put the count first when
         what follows it is long enough to be worth sacrificing. */
      countLeads?: boolean;
      tooltip?: string | vscode.MarkdownString;
    } = {},
  ) {
    /* Starts expanded; `collapseGroups` closes them all when the result set is
       big enough that opening everything would bury the structure. */
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.contextValue = "semgrep.findingGroup";
    this.iconPath = options.icon;
    this.resourceUri = options.resourceUri;
    this.tooltip = options.tooltip;
    const count = `${findings.length} finding${findings.length === 1 ? "" : "s"}`;
    if (!options.description) {
      this.description = count;
    } else if (options.countLeads) {
      this.description = `${count} · ${options.description}`;
    } else {
      this.description = `${options.description} · ${count}`;
    }
  }
}

class FindingNode extends vscode.TreeItem {
  constructor(
    readonly finding: Finding,
    /* What the enclosing group already tells the reader, so the row can avoid
       repeating it. */
    groupBy: GroupBy,
  ) {
    const {
      uri,
      range,
      severity,
      message,
      ruleId,
      ruleName,
      vulnerabilityClass,
      cwe,
      docsUrl,
    } = finding;
    const line = range.start.line + 1;
    const { directory } = splitRelativePath(uri);
    const shortLocation = shortLocationOf(uri, range);

    /* Grouped by rule, the header already carries both the rule and its
       vulnerability class, so every row beneath it saying "Found Code
       Injection" next to the same rule id is noise. There the row is just the
       source location.

       Grouped any other way, the label names the kind of problem — and a rule
       with no vulnerability class has nothing to name, so rather than padding
       the row with filler it falls back to the location. Either way the row
       opens the file at the finding. */
    /* Grouped by class the class is already the header, so the row is the rule
       that caught it. Everywhere else the row names what was found — and falls
       back to the location for a rule that declares no class, rather than
       padding the row with filler. */
    const groupedByClass = groupBy === "class";
    const namesTheClass = !groupedByClass && !!vulnerabilityClass;
    super(
      groupedByClass
        ? ruleName
        : namesTheClass
          ? `Found ${vulnerabilityClass}`
          : shortLocation,
      vscode.TreeItemCollapsibleState.None,
    );

    if (groupedByClass) {
      // The rule is the label, so the row still needs to say where.
      this.description = shortLocation;
    } else if (namesTheClass) {
      /* The label says what; the description says where. Only the file name and
         line, never the full path — a deep tree's shared prefix would fill the
         description and clip the part that identifies the row. */
      this.description = groupBy === "rule" ? shortLocation : `${ruleName}:${line}`;
    } else if (groupBy === "rule") {
      /* No class to name, so the location took the label and the directory is
         the remainder — and it is the part that may safely be clipped. */
      this.description = directory;
    } else {
      // The label is already the location, so pair it with the rule.
      this.description = ruleName;
    }
    this.iconPath = severityIcon(severity);
    this.contextValue = docsUrl
      ? "semgrep.finding.documented"
      : "semgrep.finding";

    const tooltip = new vscode.MarkdownString(undefined, true);
    tooltip.appendMarkdown(`**${severityLabel(severity)}**`);
    if (vulnerabilityClass) {
      tooltip.appendMarkdown(` · ${vulnerabilityClass}`);
    }
    tooltip.appendMarkdown(`\n\n\`${ruleId}\`\n\n`);
    if (cwe) {
      tooltip.appendMarkdown(`${cwe}\n\n`);
    }
    // The row only shows a summary, so keep the full text here.
    tooltip.appendMarkdown(`${message}\n\n`);
    // The row shows only the file name, so the hover carries the full path.
    tooltip.appendMarkdown(`_${locationOf(uri, range)}_`);
    if (docsUrl) {
      tooltip.appendMarkdown(`\n\n[View rule](${docsUrl.toString()})`);
    }
    this.tooltip = tooltip;

    this.command = {
      command: "vscode.open",
      title: "Open Finding",
      arguments: [
        uri,
        <vscode.TextDocumentShowOptions>{ selection: range, preview: true },
      ],
    };
  }
}

/*****************************************************************************/
/* Provider */
/*****************************************************************************/

export class SemgrepFindingsProvider
  implements vscode.TreeDataProvider<FindingsNode>, vscode.Disposable
{
  public static readonly viewType = "semgrep.view.findings";

  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  private readonly disposables: vscode.Disposable[] = [];
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private view: vscode.TreeView<FindingsNode> | undefined;
  private groupBy: GroupBy;

  /* Null until a scan has been run; once set it takes over from diagnostics. */
  private scanResults: ScanFinding[] | null = null;
  private scanning = false;

  constructor(private readonly env: Environment) {
    /* Grouped by vulnerability class is the default: one header per kind of
       problem, with each finding underneath naming the rule that caught it. */
    this.groupBy = env.context.workspaceState.get<GroupBy>(
      GROUP_BY_STATE_KEY,
      "class",
    );
    this.publishGroupByContext();

    this.disposables.push(
      this._onDidChangeTreeData,
      /* Diagnostics only feed the tree until a scan has been run. Once one
         has, rebuilding on every keystroke's worth of diagnostics would redo
         the whole grouping for a result set that did not change. */
      vscode.languages.onDidChangeDiagnostics(() => {
        if (!this.scanResults) {
          this.scheduleRefresh();
        }
      }),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("semgrep.scan.onlyGitDirty")) {
          this.scheduleRefresh();
        }
      }),
    );
  }

  /* Creating the view here (rather than in `extension.ts`) keeps the handle
     around so we can drive the header message and the activity bar badge. */
  register(): vscode.TreeView<FindingsNode> {
    const view = vscode.window.createTreeView(
      SemgrepFindingsProvider.viewType,
      { treeDataProvider: this, showCollapseAll: true },
    );
    this.view = view;
    this.disposables.push(view);
    this.refresh();
    return view;
  }

  /*************************************************************************/
  /* Scanning */
  /*************************************************************************/

  async scan(): Promise<void> {
    if (this.scanning) {
      return;
    }
    this.scanning = true;
    try {
      const results = await vscode.window.withProgress(
        {
          location: { viewId: SemgrepFindingsProvider.viewType },
          title: "Scanning for findings",
          cancellable: true,
        },
        (_progress, token) => runFindingsScan(this.env, token),
      );
      this.scanResults = results;
      this.refresh();
    } catch (error) {
      if (error instanceof vscode.CancellationError) {
        return;
      }
      const detail =
        error instanceof ScanError || error instanceof Error
          ? error.message
          : String(error);
      vscode.window.showErrorMessage(`Semgrep findings scan failed: ${detail}`);
    } finally {
      this.scanning = false;
    }
  }

  /*************************************************************************/
  /* State */
  /*************************************************************************/

  setGroupBy(groupBy: GroupBy): void {
    if (this.groupBy === groupBy) {
      return;
    }
    this.groupBy = groupBy;
    this.env.context.workspaceState.update(GROUP_BY_STATE_KEY, groupBy);
    this.publishGroupByContext();
    this.refresh();
  }

  /* Backs the `when` clauses that hide whichever grouping is already active
     from the Group By menu. */
  private publishGroupByContext(): void {
    vscode.commands.executeCommand(
      "setContext",
      "semgrep.findings.groupBy",
      this.groupBy,
    );
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      this.refresh();
    }, REFRESH_DEBOUNCE_MS);
  }

  refresh(): void {
    this.cachedFindings = null;
    this.updateHeader();
    this._onDidChangeTreeData.fire();
  }

  /* Rebuilding this walks every finding and disambiguates every rule id, which
     is not free on a workspace with thousands of them — and a single refresh
     asks for it more than once (the header, then the root children). Cache it
     and let `refresh` be the one place that invalidates. */
  private cachedFindings: Finding[] | null = null;

  private currentFindings(): Finding[] {
    if (!this.cachedFindings) {
      this.cachedFindings = this.scanResults
        ? findingsFromScan(this.scanResults)
        : findingsFromDiagnostics();
    }
    return this.cachedFindings;
  }

  private updateHeader(): void {
    if (!this.view) {
      return;
    }
    const total = this.currentFindings().length;

    this.view.badge =
      total > 0
        ? {
            value: total,
            tooltip: `${total} Semgrep finding${total === 1 ? "" : "s"}`,
          }
        : undefined;

    if (total === 0) {
      // An empty tree falls back to the view's `viewsWelcome` content.
      this.view.message = undefined;
    } else if (this.scanResults) {
      this.view.message = undefined;
    } else if (this.env.config.onlyGitDirty) {
      /* Two things worth saying before a scan has been run: these rows came
         from the editor's diagnostics, so they have no vulnerability class,
         and they only cover changed lines. */
      this.view.message =
        "Live results for files changed since the last commit. Run a scan for full results and vulnerability classes.";
    } else {
      this.view.message =
        "Live results from the editor. Run a scan to include vulnerability classes.";
    }
  }

  /*************************************************************************/
  /* Tree */
  /*************************************************************************/

  getTreeItem(element: FindingsNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FindingsNode): vscode.ProviderResult<FindingsNode[]> {
    if (element instanceof FindingNode) {
      return [];
    }
    if (element instanceof GroupNode) {
      return element.findings
        .slice()
        .sort(bySeverityThenPosition)
        .map((finding) => new FindingNode(finding, this.groupBy));
    }
    return collapseGroups(this.rootGroups(this.currentFindings()));
  }

  private rootGroups(findings: Finding[]): GroupNode[] {
    switch (this.groupBy) {
      case "class":
        return this.groupByClass(findings);
      case "severity":
        return this.groupBySeverity(findings);
      case "rule":
        return this.groupByRule(findings);
      default:
        return this.groupByFile(findings);
    }
  }

  /* One heading per kind of vulnerability. Grouping by rule and then leading
     each header with its class repeats "Code Injection" once per rule that
     detects it; grouping by the class itself says it once and gathers every
     rule that found it underneath. */
  private groupByClass(findings: Finding[]): GroupNode[] {
    const byClass = new Map<string, Finding[]>();
    for (const finding of findings) {
      const key = finding.vulnerabilityClass ?? UNCLASSIFIED;
      const group = byClass.get(key);
      if (group) {
        group.push(finding);
      } else {
        byClass.set(key, [finding]);
      }
    }

    return [...byClass.entries()]
      .map(
        ([className, group]) =>
          new GroupNode(className, group, {
            icon: new vscode.ThemeIcon("shield"),
          }),
      )
      .sort((a, b) => {
        // Unclassified last, whatever its severity.
        const aUnknown = a.label === UNCLASSIFIED ? 1 : 0;
        const bUnknown = b.label === UNCLASSIFIED ? 1 : 0;
        return (
          aUnknown - bUnknown ||
          worstSeverity(a) - worstSeverity(b) ||
          b.findings.length - a.findings.length ||
          compareLabels(a, b)
        );
      });
  }

  private groupByFile(findings: Finding[]): GroupNode[] {
    const byFile = new Map<string, Finding[]>();
    for (const finding of findings) {
      const key = finding.uri.toString();
      const group = byFile.get(key);
      if (group) {
        group.push(finding);
      } else {
        byFile.set(key, [finding]);
      }
    }

    return [...byFile.entries()]
      .map(([key, group]) => {
        const uri = vscode.Uri.parse(key);
        const { directory, fileName } = splitRelativePath(uri);
        return new GroupNode(fileName, group, {
          // Setting both gives us the real file-type icon from the active
          // icon theme.
          resourceUri: uri,
          icon: vscode.ThemeIcon.File,
          description: directory,
          tooltip: vscode.workspace.asRelativePath(uri),
        });
      })
      .sort(
        (a, b) => worstSeverity(a) - worstSeverity(b) || compareLabels(a, b),
      );
  }

  private groupBySeverity(findings: Finding[]): GroupNode[] {
    return SEVERITIES.map((severity) => ({
      severity,
      group: findings.filter((finding) => finding.severity === severity),
    }))
      .filter(({ group }) => group.length > 0)
      .map(
        ({ severity, group }) =>
          new GroupNode(severityLabel(severity), group, {
            icon: severityIcon(severity),
          }),
      );
  }

  private groupByRule(findings: Finding[]): GroupNode[] {
    const byRule = new Map<string, Finding[]>();
    for (const finding of findings) {
      const group = byRule.get(finding.ruleId);
      if (group) {
        group.push(finding);
      } else {
        byRule.set(finding.ruleId, [finding]);
      }
    }

    return [...byRule.entries()]
      .map(([ruleId, group]) => {
        /* The header is the rule's own id and nothing else. The vulnerability
           class belongs on the findings underneath — putting it here too is
           what made the header and its rows repeat each other. */
        return new GroupNode(group[0].ruleName, group, {
          icon: new vscode.ThemeIcon("law"),
          // The authored id is what fits; the namespaced one is a hover away.
          tooltip: ruleId,
        });
      })
      /* Most severe rule first, then the noisiest, so whatever most deserves
         attention is at the top. */
      .sort(
        (a, b) =>
          worstSeverity(a) - worstSeverity(b) ||
          b.findings.length - a.findings.length ||
          compareLabels(a, b),
      );
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}

/* A small result set is most useful fully open. A large one is not: expanding
   every group at once buries the headers — which are the thing worth scanning —
   under thousands of rows. Past this many findings the groups start closed and
   the reader opens what they care about. */
const EXPAND_GROUPS_UP_TO = 40;

function collapseGroups(groups: GroupNode[]): GroupNode[] {
  const total = groups.reduce((sum, group) => sum + group.findings.length, 0);
  if (total > EXPAND_GROUPS_UP_TO) {
    for (const group of groups) {
      group.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
  }
  return groups;
}

function worstSeverity(node: GroupNode): number {
  return node.findings.reduce(
    (worst, finding) => Math.min(worst, SEVERITIES.indexOf(finding.severity)),
    SEVERITIES.length,
  );
}

function compareLabels(a: GroupNode, b: GroupNode): number {
  return String(a.label).localeCompare(String(b.label));
}

/*****************************************************************************/
/* Commands */
/*****************************************************************************/

export function registerFindingsCommands(
  provider: SemgrepFindingsProvider,
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand("semgrep.findings.scan", () =>
      provider.scan(),
    ),

    vscode.commands.registerCommand("semgrep.findings.groupByClass", () =>
      provider.setGroupBy("class"),
    ),
    vscode.commands.registerCommand("semgrep.findings.groupByFile", () =>
      provider.setGroupBy("file"),
    ),
    vscode.commands.registerCommand("semgrep.findings.groupBySeverity", () =>
      provider.setGroupBy("severity"),
    ),
    vscode.commands.registerCommand("semgrep.findings.groupByRule", () =>
      provider.setGroupBy("rule"),
    ),

    vscode.commands.registerCommand(
      "semgrep.findings.openRuleDocs",
      (node?: FindingNode) => {
        const docsUrl = node?.finding?.docsUrl;
        if (!docsUrl) {
          vscode.window.showInformationMessage(
            "This rule has no linked documentation.",
          );
          return;
        }
        vscode.env.openExternal(docsUrl);
      },
    ),

    vscode.commands.registerCommand(
      "semgrep.findings.copyMessage",
      (node?: FindingNode) => {
        const finding = node?.finding;
        if (!finding) {
          return;
        }
        vscode.env.clipboard.writeText(
          `${finding.ruleId}\n${finding.message}`,
        );
      },
    ),
  ];
}
