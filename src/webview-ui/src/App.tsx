import { vscode } from "./utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import "./App.css";
import { useState } from "react";

const App: React.FC = () => {
  const [pattern, setPattern] = useState("");
  function handleHowdyClick() {
    console.log("SNEINDING MESSAGE");
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  return (
    <main>
      <h1>Hello from React!</h1>
      <VSCodeTextField
        autofocus
        placeholder="Pattern"
        style={{ padding: "4px 0", width: "100%" }}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter") {
            vscode.postMessage({
              command: "hello",
              text: e.currentTarget.value,
            });
          }
        }}
      ></VSCodeTextField>
      <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton>
      {pattern}
    </main>
  );
};

export default App;
