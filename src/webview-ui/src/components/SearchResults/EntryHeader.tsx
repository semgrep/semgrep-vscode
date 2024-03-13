import { vscode } from "./../../utilities/vscode";
import {
  VSCodeBadge,
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { MatchItem } from "./MatchItem";
import { ViewResult } from "../../types/results";
import { PathHeader } from "./PathHeader";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";

import styles from "./SearchResults.module.css";

export interface EntryHeaderProps {
  result: ViewResult;
  isExpanded: boolean;
  toggleIsExpanded: () => void;
}
export const EntryHeader: React.FC<EntryHeaderProps> = ({
  result,
  isExpanded,
  toggleIsExpanded,
}) => {
  const { path } = result;
  return (
    <div className={styles["entry-header"]} onClick={toggleIsExpanded}>
      <div
        className={styles["collapse-button"]}
        aria-label="ExpandButton"
        role="button"
      >
        {isExpanded ? <VscChevronDown /> : <VscChevronRight />}
      </div>
      <PathHeader path={path} />
      <VSCodeBadge className={styles["match-num-badge"]}>
        {result.matches.length}
      </VSCodeBadge>
    </div>
  );
};
