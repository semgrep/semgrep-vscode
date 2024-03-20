import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { TextBox } from "../utils/TextBox";
import { LangChooser } from "../utils/LangChooser";
import styles from "./MainInputs.module.css";
import { State } from "../../types/state";
import { VscReplaceAll } from "react-icons/vsc";
import { useStore } from "../../hooks/useStore";
import { PatternList } from "./PatternList";

export interface MainInputsProps {
  onNewSearch: (scanID: string) => void;
  state: State | null;
}
export const MainInputs: React.FC<MainInputsProps> = ({
  onNewSearch,
  state,
}) => {
  const [fix, setFix] = useStore("fix");

  function onFixAll() {
    if (state) {
      vscode.sendMessageToExtension({
        command: "webview/semgrep/replaceAll",
        matches: state.results,
      });
    }
  }

  // enable fix button iff there is at least one match with a pending fix
  const fixExists = state?.results.locations.some((l) =>
    l.matches.some((m) => m.searchMatch.fix && !m.isFixed)
  );

  return (
    <>
      <PatternList onNewSearch={onNewSearch} state={state} />
      <div className={styles["search-row"]}>
        <TextBox
          onNewSearch={onNewSearch}
          placeholder="Fix"
          isMultiline={true}
          value={fix}
          onChange={setFix}
        />
        <div
          className={`${styles["replace-all-button"]} ${
            fixExists ? "" : styles["disabled"]
          }`}
          onClick={onFixAll}
        >
          <VscReplaceAll
            role="button"
            title="Replace All"
            tabIndex={0}
            size="1.4em"
          />
        </div>
      </div>
    </>
  );
};
