import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { ViewMatch } from "../../types/results";

import styles from "./SearchResults.module.css";

export interface MatchItemProps {
  match: ViewMatch;
}
export const MatchItem: React.FC<MatchItemProps> = ({ match }) => {
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

  return (
    <li className={styles["match-item"]}>
      <div className={styles["match-text-box"]}>
        {before}
        {matchText}
        {after}
      </div>
    </li>
  );
};
