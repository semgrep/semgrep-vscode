import type { State } from "../../types/state";
import { SearchResultEntry } from "./SearchResultEntry";

import styles from "./SearchResults.module.css";

export interface SearchResultsProps {
  state: State;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ state }) => {
  return (
    <div className={styles.matchesSection}>
      {state.results.locations.map((result) => (
        <SearchResultEntry result={result} />
      ))}
    </div>
  );
};
