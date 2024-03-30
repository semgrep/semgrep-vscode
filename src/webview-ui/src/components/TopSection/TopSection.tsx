import { vscode } from "../../../utilities/vscode";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";

export function generateUniqueID(): string {
  return Math.random().toString(36).substring(7);
}
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

  return (
    <>
      <VSCodeTextField
        autofocus
        placeholder="Pattern"
        style={{ padding: "4px 0", width: "100%" }}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter") {
            searchQuery(e.currentTarget.value, fix);
          }
        }}
        // I literally have no idea what the type of this or the below handler should be
        // We use the onChange here because there's a delta between when the onKeyPress
        // is fired and when the value is updated
        onChange={(e: any) => {
          setPattern(e.target.value);
        }}
      />
      <VSCodeTextField
        placeholder="Autofix"
        style={{ padding: "4px 0", width: "100%" }}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter") {
            searchQuery(pattern, e.currentTarget.value);
          }
        }}
        onChange={(e: any) => {
          setFix(e.target.value);
        }}
      />
    </>
  );
};
