import { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";
import { vscode } from "../../../utilities/vscode";
import { useHover } from "react-use";
import { MatchItemButtons } from "./MatchItemButtons";

export interface MatchItemProps {
  uri: string;
  match: ViewMatch;
}
export const MatchItem: React.FC<MatchItemProps> = ({ uri, match }) => {
  const { before, inside, after } = match;

  let matchText;
  if (match.searchMatch.fix) {
    matchText = (
      <>
        <span className={styles.matchTextDeleted}>{inside}</span>
        <span className={styles.matchTextInserted}>
          {match.searchMatch.fix}
        </span>
      </>
    );
  } else {
    matchText = <span className={styles.matchTextNormal}>{inside}</span>;
  }

  function onClick() {
    vscode.sendMessageToExtension({
      command: "webview/semgrep/select",
      uri: uri,
      range: match.searchMatch.range,
    });
  }

  const [hoveredElem] = useHover((hovered) => {
    return (
      <li className={styles.matchItem} onClick={onClick}>
        <div className={styles.matchTextBox}>
          {before}
          {matchText}
          {after}
        </div>
        <MatchItemButtons isHovered={hovered} uri={uri} match={match} />
      </li>
    );
  });

  return hoveredElem;
};
