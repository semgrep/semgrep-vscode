import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { MatchResult, SearchResult } from "../../types/searchResult";

export interface MatchItemProps {
  match: MatchResult;
}
export const MatchItem: React.FC<MatchItemProps> = ({ match }) => {
  return <>{match.range}</>;
};
