import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { MainInputs } from "./MainInputs";

import styles from "./TopSection.module.css";
import { VscEllipsis } from "react-icons/vsc";
import { SUPPORTED_LANGS } from "../../../../constants";
import { SearchLanguage } from "../../../../interface/interface";
import { TextBox } from "../utils/TextBox";
import { State } from "../../types/state";
import { MatchesSummary } from "./MatchesSummary";
import { useStore } from "../../hooks/useStore";

export interface TopSectionProps {
  onNewSearch: (scanID: string) => void;
  state: State | null;
}
export const TopSection: React.FC<TopSectionProps> = ({
  onNewSearch,
  state,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [includes, setIncludes] = useStore("includes");
  const [excludes, setExcludes] = useStore("excludes");

  return (
    <div className={styles["top-section"]}>
      <MainInputs onNewSearch={onNewSearch} state={state} />
      <div>
        <div
          role="button"
          onClick={() => setShowOptions(!showOptions)}
          className={styles["option-button"]}
        >
          <VscEllipsis />
        </div>
        {showOptions && (
          <TextBox
            description="files to include"
            onNewSearch={onNewSearch}
            isMultiline={false}
            value={includes}
            onChange={setIncludes}
          />
        )}
        {showOptions && (
          <TextBox
            description="files to exclude"
            onNewSearch={onNewSearch}
            isMultiline={false}
            value={excludes}
            onChange={setExcludes}
          />
        )}
      </div>
      <MatchesSummary state={state} />
    </div>
  );
};
