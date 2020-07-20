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

const onPatternSelect = async (
  item: vscode.QuickPickItem,
  language: string,
  code: string
) => {
  let snippet: SnippetResponse;
  try {
    snippet = await saveSnippet({
      language: language,
      pattern: item.detail ?? "",
      target: code,
    });
  } catch (e) {
    console.error(e);
    return;
  }
  vscode.env.openExternal(
    vscode.Uri.parse(`https://semgrep.live/${snippet.id}`)
  );
};

const suggestPatterns = async (
  context: vscode.ExtensionContext,
  mode: "selection" | "line"
) => {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined) {
    console.error("couldn't find active editor");
    return;
  }

  const { selections, document } = editor;

  let rangeStrings: string[];
  switch (mode) {
    case "line":
      rangeStrings = selections.map(
        (selection) =>
          `${positionToString(
            document.lineAt(selection.start.line).range.start
          )}-${positionToString(
            document.lineAt(selection.start.line).range.end.translate(0, -1)
          )}`
      );
      break;
    case "selection":
      rangeStrings = selections.map(
        (selection) =>
          `${positionToString(selection.start)}-${positionToString(
            previousPosition(document, selection.end)
          )}`
      );
      break;
    default:
      console.error("running mode wasn't given");
      return;
  }

  const selection = await vscode.window.showQuickPick(
    synthesizePatterns(document.fileName, rangeStrings),
    {
      placeHolder: "Select pattern to view on semgrep.live",
    }
  );

  if (selection === undefined) {
    console.debug("no pattern was selected");
    return;
  }

  await onPatternSelect(
    selection,
    document.languageId,
    selections.map((selection) => document.getText(selection)).join("\n\n")
  );
};
export default suggestPatterns;
