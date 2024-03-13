import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { MatchItem } from "./MatchItem";
import { ViewResult } from "../../types/results";
import { PathHeader } from "./PathHeader";

import styles from "./SearchResults.module.css";

export interface SearchResultEntryProps {
  result: ViewResult;
}
export const SearchResultEntry: React.FC<SearchResultEntryProps> = ({
  result,
}) => {
  const { path } = result;
  return (
    <div>
      <PathHeader path={path} />
      <ul className={styles["matches-list"]}>
        {result.matches.map((match) => (
          <MatchItem match={match} />
        ))}
      </ul>
    </div>
  );
};
