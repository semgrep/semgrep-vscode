import { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";
import { VscClose, VscReplace } from "react-icons/vsc";

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
    <div className={styles["match-buttons"]}>
      {match.searchMatch.fix ? (
        <div onClick={() => onFix(match)}>
          <VscReplace role="button" title="Replace" tabIndex={0} />
        </div>
      ) : null}
      <div onClick={() => onDismiss(match)}>
        <VscClose role="button" title="Dismiss" tabIndex={0} />
      </div>
    </div>
  );
};
