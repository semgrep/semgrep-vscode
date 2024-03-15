import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { Store, useSearch, useStore } from "../../hooks/useStore";

export const InfoBlurb: React.FC = () => {
  return (
    <div style={{ paddingLeft: "10px", paddingTop: "15px" }}>
      Hi, and welcome to the Semgrep VS Code Extension!
      <br />
      Type a Semgrep pattern below to get started.
    </div>
  );
};
