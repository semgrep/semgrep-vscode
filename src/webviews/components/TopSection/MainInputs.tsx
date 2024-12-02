import { VscReplaceAll } from "react-icons/vsc";
import { type Store, useSetStore } from "../../hooks/useStore";
import type { State } from "../../types/state";
import { vscode } from "../../utilities/vscode";
import { TextBox } from "../utils/TextBox";
import { PatternList } from "./PatternList";

import styles from "./MainInputs.module.css";

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
