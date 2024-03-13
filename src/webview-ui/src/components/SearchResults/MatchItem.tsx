import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";
import { SearchMatch } from "../../../../searchResultsTree";

export interface MatchItemProps {
  match: SearchMatch;
}
export const MatchItem: React.FC<MatchItemProps> = ({ match }) => {
  return <>{match.range}</>;
};
