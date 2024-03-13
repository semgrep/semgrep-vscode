import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useCallback, useState } from "react";
import { Uri } from "vscode";
import { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";
import { vscode } from "../../utilities/vscode";
import { useHover } from "react-use";
import { MatchItemButtons } from "./MatchItemButtons";

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
  const { before, inside, after } = match;

  let matchText;
  if (match.searchMatch.fix) {
    matchText = (
      <>
        <span className={styles["match-text-deleted"]}>{inside}</span>
        <span className={styles["match-text-inserted"]}>fix</span>
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

  const [hoveredElem] = useHover((hovered) => {
    return (
      <li className={styles["match-item"]} onClick={onClick}>
        <div className={styles["match-text-box"]}>
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
