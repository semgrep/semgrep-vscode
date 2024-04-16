import { MatchItem } from "./MatchItem";
import { ViewMatch, ViewResult } from "../../types/results";

import styles from "./SearchResults.module.css";
import { EntryHeader } from "./EntryHeader";
import { useState } from "react";
import { vscode } from "../../../utilities/vscode";

export interface SearchResultEntryProps {
  result: ViewResult;
}
export const SearchResultEntry: React.FC<SearchResultEntryProps> = ({
  result,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  // This is really only so that we can re-render.
  const [numRerenders, setNumRerenders] = useState(0);

  const matches = result.matches.filter(
    (match) => !(match.isFixed || match.isDismissed)
  );

  return (
    <div>
      <EntryHeader
        result={result}
        isExpanded={isExpanded}
        toggleIsExpanded={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && (
        <ul className={styles.matchesList}>
          {matches.map((match) => (
            <MatchItem
              uri={result.uri}
              match={match}
              onFix={() => {
                if (match.searchMatch.fix) {
                  vscode.sendMessageToExtension({
                    command: "webview/semgrep/replace",
                    uri: result.uri,
                    range: match.searchMatch.range,
                    fix: match.searchMatch.fix,
                  });
                  match.isFixed = true;
                  setNumRerenders(numRerenders + 1);
                }
              }}
              onDismiss={() => {
                match.isDismissed = true;
                setNumRerenders(numRerenders + 1);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
