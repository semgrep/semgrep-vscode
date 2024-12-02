import type { State } from "../../types/state";

import styles from "./TopSection.module.css";
export interface MatchesSummaryProps {
  state: State | null;
}
export const MatchesSummary: React.FC<MatchesSummaryProps> = ({ state }) => {
  if (state === null) {
    return null;
  }

  const numMatches = state.results.locations.reduce(
    (acc, result) => acc + result.matches.length,
    0,
  );
  const numFiles = state.results.locations.length;

  const status = state.searchConcluded ? "" : "(searching)";

  return (
    <div className={styles.matchesSummary}>
      {`${numMatches} matches in ${numFiles} files ${status}`}
    </div>
  );
};
