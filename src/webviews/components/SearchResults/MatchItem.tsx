import useHover from "react-use/lib/useHover";
import type { ViewMatch } from "../../types/results";
import { vscode } from "../../utilities/vscode";
import { MatchItemButtons } from "./MatchItemButtons";

import styles from "./SearchResults.module.css";

export interface MatchItemProps {
  uri: string;
  match: ViewMatch;
  onFix: (match: ViewMatch) => void;
  onDismiss: (match: ViewMatch) => void;
}
export const MatchItem: React.FC<MatchItemProps> = ({
  uri,
  match,
  onFix,
  onDismiss,
}) => {
  const { before, inside, after } = match.searchMatch;

  const matchText = match.searchMatch.fix ? (
    <>
      <span className={styles.matchTextDeleted}>{inside}</span>
      <span className={styles.matchTextInserted}>{match.searchMatch.fix}</span>
    </>
  ) : (
    <span className={styles.matchTextNormal}>{inside}</span>
  );

  function onClick() {
    vscode.sendMessageToExtension({
      command: "webview/semgrep/select",
      uri: uri,
      range: match.searchMatch.range,
    });
  }

  const [hoveredElem] = useHover((hovered: boolean) => {
    return (
      <li className={styles.matchItem} onClick={onClick}>
        <div className={styles.matchTextBox}>
          {before}
          {matchText}
          {after}
        </div>
        <MatchItemButtons
          isHovered={hovered}
          match={match}
          onFix={onFix}
          onDismiss={onDismiss}
        />
      </li>
    );
  });

  return hoveredElem;
};
