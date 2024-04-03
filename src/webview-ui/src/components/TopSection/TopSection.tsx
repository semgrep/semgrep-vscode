import { useState } from "react";
import { MainInputs } from "./MainInputs";

import styles from "./TopSection.module.css";
import { VscEllipsis } from "react-icons/vsc";
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
    <div className={styles.topSection}>
      <MainInputs onNewSearch={onNewSearch} state={state} />
      <div>
        <div
          role="button"
          onClick={() => setShowOptions(!showOptions)}
          className={styles.optionButton}
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
