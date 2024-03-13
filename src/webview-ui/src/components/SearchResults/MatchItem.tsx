import { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";
import { vscode } from "../../../utilities/vscode";

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
        <span className={styles["match-text-deleted"]}>{inside}</span>
        <span className={styles["match-text-inserted"]}>
          {match.searchMatch.fix}
        </span>
      </>
    );
  } else {
    matchText = <span className={styles["match-text-normal"]}>{inside}</span>;
  }

  function onClick() {
    vscode.sendMessageToExtension({
      command: "webview/semgrep/select",
      uri: uri,
      range: match.searchMatch.range,
    });
  }

  return (
    <li className={styles["match-item"]} onClick={onClick}>
      <div className={styles["match-text-box"]} onClick={onClick}>
        {before}
        {matchText}
        {after}
      </div>
    </li>
  );
};
