import { State } from "../../types/state";

import styles from "./SearchResults.module.css";
import { SearchResultEntry } from "./SearchResultEntry";

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
