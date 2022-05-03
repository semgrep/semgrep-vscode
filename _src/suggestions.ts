import * as vscode from "vscode";
import { synthesizePatterns } from "./cli";
import { saveSnippet, SnippetResponse } from "./api";

const positionToString = (position: vscode.Position) =>
  `${position.line + 1}:${position.character + 1}`;

function previousPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Position {
  let effectivePosition = position;
  while (effectivePosition.character === 0) {
    effectivePosition = document.lineAt(position.line - 1).range.end;
  }
  return effectivePosition.translate({ characterDelta: -1 });
}

const makeRule = (pattern: string) => `rules:
- id: vscode-suggested-pattern
  pattern: |
    ${pattern.replace("\n", "\n    ")}
  message: |
    Match found
  fix: |
    
  severity: WARNING
`;

const onPatternSelect = async (
  item: vscode.QuickPickItem,
  language: string,
  code: string
) => {
  if (item.detail === undefined) {
    return;
  }
  let snippet: SnippetResponse;
  try {
    snippet = await saveSnippet({
      language: language,
      pattern: makeRule(item.detail),
      target: code,
    });
  } catch (e) {
    console.error(e);
    return;
  }
  vscode.env.openExternal(
    vscode.Uri.parse(`https://semgrep.dev/${snippet.id}`)
  );
};

const suggest = async (mode: "selection" | "line") => {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    console.error("couldn't find active editor");
    return;
  }

  const { selections, document } = editor;

  let rangeStrings: string[];
  switch (mode) {
    case "line":
      rangeStrings = selections.map((selection) => {
        const endColOfLine = document.lineAt(selection.start.line).range.end;
        return `${positionToString(
          document.lineAt(selection.start.line).range.start
        )}-${positionToString(
          endColOfLine.character === 0
            ? endColOfLine
            : endColOfLine.translate(0, -1)
        )}`;
      });
      break;
    case "selection":
      rangeStrings = selections.map(
        (selection) =>
          `${positionToString(
            previousPosition(document, selection.start)
          )}-${positionToString(previousPosition(document, selection.end))}`
      );
      break;
    default:
      console.error("running mode wasn't given");
      return;
  }

  const items = await synthesizePatterns(document.fileName, rangeStrings);

  if (items.length === 0) {
    await vscode.window.showInformationMessage(
      "No pattern suggestions found for your selected code."
    );
    return;
  }

  const selection = await vscode.window.showQuickPick(items, {
    placeHolder: "Select pattern to view on semgrep.dev",
  });

  if (selection === undefined) {
    console.debug("no suggested pattern was selected");
    return;
  }

  let targetLines: string[];
  switch (mode) {
    case "line":
      targetLines = selections.map((selection) =>
        document.getText(document.lineAt(selection.start.line).range)
      );
      break;
    case "selection":
      targetLines = selections.map((selection) => document.getText(selection));
      break;
    default:
      return;
  }

  await onPatternSelect(selection, document.languageId, targetLines.join("\n"));
};

const activateSuggestions = (context: vscode.ExtensionContext) => {
  console.log("Registering Semgrep suggestion commands");

  const subs = context.subscriptions;
  subs.push(
    vscode.commands.registerCommand(
      "semgrep.suggestSelectionPatterns",
      async (context: vscode.ExtensionContext) => await suggest("selection")
    )
  );
  subs.push(
    vscode.commands.registerCommand(
      "semgrep.suggestLinePatterns",
      async (context: vscode.ExtensionContext) => await suggest("line")
    )
  );
};
export default activateSuggestions;
