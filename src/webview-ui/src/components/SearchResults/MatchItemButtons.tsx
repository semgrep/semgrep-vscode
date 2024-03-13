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
import { VscClose, VscReplace } from "react-icons/vsc";

export interface MatchItemButtonsProps {
  isHovered: boolean;
  uri: string;
  match: ViewMatch;
}
export const MatchItemButtons: React.FC<MatchItemButtonsProps> = ({
  isHovered,
  uri,
  match,
}) => {
  if (!isHovered) {
    return null;
  }

  function onReplace() {
    // This should be true, but the type system is having troubles here.
    if (match.searchMatch.fix !== null) {
      vscode.sendMessageToExtension({
        command: "webview/semgrep/replace",
        uri: uri,
        range: match.searchMatch.range,
        fix: match.searchMatch.fix,
      });
    }
  }

  function onDismiss() {
    vscode.sendMessageToExtension({
      command: "webview/semgrep/select",
      uri: uri,
      range: match.searchMatch.range,
    });
  }

  return (
    <div className={styles["match-buttons"]}>
      {match.searchMatch.fix ? (
        <div onClick={() => onReplace()}>
          <VscReplace role="button" title="Replace" tabIndex={0} />
        </div>
      ) : null}
      <div onClick={onDismiss}>
        <VscClose role="button" title="Dismiss" tabIndex={0} />
      </div>
    </div>
  );
};
