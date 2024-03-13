import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { MatchItem } from "./MatchItem";
import { ViewResult } from "../../types/results";
import { PathHeader } from "./PathHeader";

import styles from "./SearchResults.module.css";
import { EntryHeader } from "./EntryHeader";

export interface SearchResultEntryProps {
  result: ViewResult;
}
export const SearchResultEntry: React.FC<SearchResultEntryProps> = ({
  result,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <EntryHeader
        result={result}
        isExpanded={isExpanded}
        toggleIsExpanded={() => setIsExpanded(!isExpanded)}
      />
      {isExpanded && (
        <ul className={styles["matches-list"]}>
          {result.matches.map((match) => (
            <MatchItem uri={result.uri} match={match} />
          ))}
        </ul>
      )}
    </div>
  );
};
