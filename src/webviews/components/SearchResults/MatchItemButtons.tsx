import { VscClose, VscReplace } from "react-icons/vsc";
import type { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";

export interface MatchItemButtonsProps {
  isHovered: boolean;
  match: ViewMatch;
  onFix: (match: ViewMatch) => void;
  onDismiss: (match: ViewMatch) => void;
}
export const MatchItemButtons: React.FC<MatchItemButtonsProps> = ({
  isHovered,
  match,
  onFix,
  onDismiss,
}) => {
  if (!isHovered) {
    return null;
  }

  return (
    <div className={styles.matchButtons}>
      {match.searchMatch.fix ? (
        <div className={styles.matchButton} onClick={() => onFix(match)}>
          <VscReplace role="button" title="Replace" tabIndex={0} />
        </div>
      ) : null}
      <div className={styles.matchButton} onClick={() => onDismiss(match)}>
        <VscClose role="button" title="Dismiss" tabIndex={0} />
      </div>
    </div>
  );
};
