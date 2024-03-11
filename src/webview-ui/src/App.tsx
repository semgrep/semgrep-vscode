import { vscode } from "./utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useState } from "react";
import { webkitCommand } from "../../interface/commands";

const App: React.FC = () => {
  return (
    <main>
      <VSCodeTextField
        autofocus
        placeholder="Pattern"
        style={{ padding: "4px 0", width: "100%" }}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter") {
            vscode.postMessage({
              command: "webkit/semgrep/search",
              pattern: e.currentTarget.value,
            } as webkitCommand);
          }
        }}
      ></VSCodeTextField>
    </main>
  );
};

export default App;
