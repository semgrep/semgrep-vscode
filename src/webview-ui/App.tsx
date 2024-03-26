import { vscode } from "./utilities/vscode";
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { webkitCommand } from "../interface/commands";
import { useState } from "react";

const App: React.FC = () => {
  const [pattern, setPattern] = useState("");
  const [fix, setFix] = useState("");

  function searchQuery(pattern: string, fix: string) {
    const fixValue = fix === "" ? null : fix;
    vscode.postMessage({
      command: "webkit/semgrep/search",
      pattern: pattern,
      fix: fixValue,
    } as webkitCommand);
  }

  return (
    <main>
      <VSCodeTextField
        autofocus
        placeholder="Pattern"
        style={{ padding: "4px 0", width: "100%" }}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
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
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter") {
            searchQuery(pattern, e.currentTarget.value);
          }
        }}
        onChange={(e: any) => {
          setFix(e.target.value);
        }}
      />
    </main>
  );
};

export default App;
