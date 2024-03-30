import { State } from "../../types/state";

import styles from "./SearchResults.module.css";
import { SearchResultEntry } from "./SearchResultEntry";

export interface SearchResultsProps {
  state: State | undefined;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ state }) => {
  const numMatches = state?.results.locations.reduce(
    (acc, result) => acc + result.matches.length,
    0
  );
  const numFiles = state?.results.locations.length;

  if (state === undefined) {
    return null;
  }

  const status = state.searchConcluded ? "" : "(searching)";

  return (
    <div>
      <div className={styles.matchesSummary}>
        {`${numMatches} matches in ${numFiles} files ${status}`}
      </div>
      {state.results.locations.map((result) => (
        <SearchResultEntry result={result} />
      ))}
    </div>
  );
};
