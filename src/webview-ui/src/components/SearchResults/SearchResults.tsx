import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { SearchResults as SearchResultsType } from "../../../../lspExtensions";
import { State } from "../../types/state";

import styles from "./SearchResults.module.css";

export interface SearchResultsProps {
  state: State | undefined;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ state }) => {
  const numMatches = state?.results.locations.reduce(
    (acc, result) => acc + result.matches.length,
    0
  );
  const numFiles = state?.results.locations.length;
  return (
    <>
      <div className={styles["matches-summary"]}>
        {state === undefined
          ? ""
          : `${numMatches} matches in ${numFiles} files`}
      </div>
    </>
  );
};
