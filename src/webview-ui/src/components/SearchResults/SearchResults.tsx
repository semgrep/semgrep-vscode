import { State } from "../../types/state";

import styles from "./SearchResults.module.css";
import { SearchResultEntry } from "./SearchResultEntry";
import { vscode } from "../../../utilities/vscode";
import { VscReplaceAll } from "react-icons/vsc";

export interface SearchResultsProps {
  state: State | undefined;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ state }) => {
  const numMatches = state?.results_by_file.reduce(
    (acc, result) => acc + result.matches.length,
    0
  );
  const numFiles = state?.results_by_file.length;

  if (state === undefined) {
    return null;
  }

  function onFixAll() {
    if (state !== undefined) {
      vscode.sendMessageToExtension({
        command: "webview/semgrep/replaceAll",
        matches: state.results_by_file,
      });
    }
  }

  const status = state.searchConcluded ? "" : "(searching)";

  return (
    <div>
      <div className={styles.matchesSummary}>
        {`${numMatches} matches in ${numFiles} files ${status}`}
        <div className={styles.replaceAllButton} onClick={onFixAll}>
          <VscReplaceAll role="button" title="Replace All" tabIndex={0} />
        </div>
      </div>
      {state.results_by_file.map((result) => (
        <SearchResultEntry result={result} />
      ))}
    </div>
  );
};
