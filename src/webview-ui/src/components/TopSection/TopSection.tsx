import { useState } from "react";
import { MainInputs } from "./MainInputs";

import styles from "./TopSection.module.css";
import { VscEllipsis } from "react-icons/vsc";
import { TextBox } from "../utils/TextBox";

export interface TopSectionProps {
  onNewSearch: (scanID: string) => void;
}
export const TopSection: React.FC<TopSectionProps> = ({ onNewSearch }) => {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className={styles.topSection}>
      <MainInputs onNewSearch={onNewSearch} />
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
            keyName="includes"
          />
        )}
        {showOptions && (
          <TextBox
            description="files to exclude"
            onNewSearch={onNewSearch}
            isMultiline={false}
            keyName="excludes"
          />
        )}
      </div>
    </div>
  );
};
