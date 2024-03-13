import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { SearchResult } from "../../types/searchResult";

export interface SearchResultEntryProps {
  entry: SearchResult;
}
export const FileItem: React.FC<SearchResultEntryProps> = ({ entry }) => {
  return <>{entry.uri}</>;
};
