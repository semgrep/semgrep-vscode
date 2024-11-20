import { TextBox } from "../utils/TextBox";
import { vscode } from "../../utilities/vscode";
import { State } from "../../types/state";
import { VscReplaceAll } from "react-icons/vsc";
import styles from "./MainInputs.module.css";
import { Store, useSetStore } from "../../hooks/useStore";
import { PatternList } from "./PatternList";

export interface MainInputsProps {
  onNewSearch: (scanID: string) => void;
  state: State | null;
  store: Store;
}
export const MainInputs: React.FC<MainInputsProps> = ({
  onNewSearch,
  state,
  store,
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
    l.matches.some((m) => m.searchMatch.fix && !m.isFixed),
  );

  return (
    <>
      <PatternList store={store} onNewSearch={onNewSearch} />
      <div className={styles.searchRow}>
        <TextBox
          onNewSearch={onNewSearch}
          placeholder="Fix"
          isMultiline={true}
          value={store.fix}
          onChange={(fix: string) => useSetStore("fix", fix)}
          store={store}
        />
        <div
          className={`${styles.replaceAllButton} ${
            fixExists ? "" : styles.disabled
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
