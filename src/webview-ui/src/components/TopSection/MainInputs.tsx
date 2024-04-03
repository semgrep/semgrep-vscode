import { TextBox } from "../utils/TextBox";
import { vscode } from "../../../utilities/vscode";
import { LangChooser } from "../utils/LangChooser";
import { State } from "../../types/state";
import { VscReplaceAll } from "react-icons/vsc";
import styles from "./MainInputs.module.css";

export interface MainInputsProps {
  onNewSearch: (scanID: string) => void;
  state: State | null;
}
export const MainInputs: React.FC<MainInputsProps> = ({
  onNewSearch,
  state,
}) => {
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
      <div className={styles["search-row"]}>
        <TextBox
          onNewSearch={onNewSearch}
          placeholder="Pattern"
          isMultiline={true}
          keyName="pattern"
        />
        <LangChooser keyName="language" />
      </div>
      <div className={styles["search-row"]}>
        <TextBox
          onNewSearch={onNewSearch}
          placeholder="Fix"
          isMultiline={true}
          keyName="fix"
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
