import { vscode } from "../../../utilities/vscode";
import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";

export function generateUniqueID(): string {
  return Math.random().toString(36).substring(7);
}

const style = {
  // this makes it not quite as weirdly tall
  "--design-unit": "2",
  padding: "4px 12px",
  width: "calc(100% - 24px)",
};

export interface TopSectionProps {
  onNewSearch: (scanID: string) => void;
}
export const TopSection: React.FC<TopSectionProps> = ({ onNewSearch }) => {
  const [pattern, setPattern] = useState("");
  const [fix, setFix] = useState("");

  function searchQuery(pattern: string, fix: string) {
    const fixValue = fix === "" ? null : fix;
    const scanID = generateUniqueID();
    onNewSearch(scanID);
    vscode.sendMessageToExtension({
      command: "webview/semgrep/search",
      pattern: pattern,
      fix: fixValue,
      scanID: scanID,
    });
  }

  const numRowsPattern = pattern.split("\n").length;
  const numRowsFix = fix.split("\n").length;

  return (
    <>
      <VSCodeTextArea
        autofocus
        placeholder="Pattern"
        style={style}
        rows={numRowsPattern}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            searchQuery(e.currentTarget.value, fix);
          }
        }}
        // I literally have no idea what the type of this or the below handler should be
        // We use the onChange here because there's a delta between when the onKeyPress
        // is fired and when the value is updated
        onInput={(e: any) => {
          setPattern(e.target.value);
        }}
      />
      <VSCodeTextArea
        placeholder="Autofix"
        style={style}
        rows={numRowsFix}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            searchQuery(pattern, e.currentTarget.value);
          }
        }}
        onInput={(e: any) => {
          setFix(e.target.value);
        }}
      />
    </>
  );
};
