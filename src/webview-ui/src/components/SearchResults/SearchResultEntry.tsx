import { MatchItem } from "./MatchItem";
import { ViewResult } from "../../types/results";

import styles from "./SearchResults.module.css";
import { EntryHeader } from "./EntryHeader";
import { useState } from "react";

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
        <ul className={styles.matchesList}>
          {result.matches.map((match) => (
            <MatchItem uri={result.uri} match={match} />
          ))}
        </ul>
      )}
    </div>
  );
};
