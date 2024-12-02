import { VSCodeBadge } from "@vscode/webview-ui-toolkit/react";
import { VscChevronDown, VscChevronRight } from "react-icons/vsc";
import type { ViewResult } from "../../types/results";
import { PathHeader } from "./PathHeader";

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
    <div className={styles.entryHeader} onClick={toggleIsExpanded}>
      <div
        className={styles.collapseButton}
        aria-label="ExpandButton"
        role="button"
      >
        {isExpanded ? <VscChevronDown /> : <VscChevronRight />}
      </div>
      <PathHeader path={path} />
      <VSCodeBadge className={styles.matchNumBadge}>
        {result.matches.length}
      </VSCodeBadge>
    </div>
  );
};
