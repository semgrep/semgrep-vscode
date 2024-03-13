import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { SearchResults } from "../../../../lspExtensions";

export interface SearchResultEntryProps {
  entry: SearchResults;
}
export const FileItem: React.FC<SearchResultEntryProps> = ({ entry }) => {
  return <>{entry.locations.length}</>;
};
