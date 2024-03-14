import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { TextBox } from "../utils/TextBox";
import styles from "./TopSection.module.css";
import { LangChooser } from "../utils/LangChooser";

export interface MainInputsProps {
  onNewSearch: (scanID: string) => void;
}
export const MainInputs: React.FC<MainInputsProps> = ({ onNewSearch }) => {
  return (
    <>
      <TextBox
        onNewSearch={onNewSearch}
        placeholder="Pattern"
        isMultiline={true}
        keyName="pattern"
      />
      <LangChooser keyName="language" />
      <TextBox
        onNewSearch={onNewSearch}
        placeholder="Fix"
        isMultiline={true}
        keyName="fix"
      />
    </>
  );
};
