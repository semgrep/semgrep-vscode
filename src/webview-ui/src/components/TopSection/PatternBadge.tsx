import { vscode } from "./../../utilities/vscode";
import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { TextBox } from "../utils/TextBox";
import { LangChooser } from "../utils/LangChooser";
import styles from "./MainInputs.module.css";
import { State } from "../../types/state";
import { VscReplaceAll, VscAdd, VscChevronDown } from "react-icons/vsc";
import { useStore } from "../../hooks/useStore";
import { isLast, simplePattern } from "./PatternList";
import { VscCircleSlash } from "react-icons/vsc";

export interface PatternBadgeProps {
  index: number | null;
  patterns: simplePattern[];
  positive: boolean;
  onNewPattern: () => void;
  onPositivityToggle: () => void;
}
export const PatternBadge: React.FC<PatternBadgeProps> = ({
  onNewPattern,
  index,
  patterns,
  positive,
  onPositivityToggle,
}) => {
  const last = isLast(index, patterns);
  const color = positive ? "#458c4c" : "#a23636";
  const heightOfAdd = last ? "15px" : "27px";
  const heightOfChevron = last ? "7px" : "0px";
  return (
    <div>
      <div
        style={{ backgroundColor: color, height: heightOfAdd }}
        className={styles.positivityButton}
        onClick={onPositivityToggle}
      >
        {positive ? <VscAdd /> : <VscCircleSlash />}
      </div>
      {last && (
        <div
          className={styles.addPatternButton}
          style={{ height: heightOfChevron, marginTop: "4px" }}
          onClick={onNewPattern}
        >
          <VscChevronDown />
        </div>
      )}
    </div>
  );
};
