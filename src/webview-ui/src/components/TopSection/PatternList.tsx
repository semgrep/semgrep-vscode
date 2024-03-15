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
import {
  VscReplaceAll,
  VscAdd,
  VscChevronDown,
  VscClose,
} from "react-icons/vsc";
import { useStore } from "../../hooks/useStore";
import { PatternBadge } from "./PatternBadge";

export type simplePattern = { isPositive: boolean; pattern: string };

export function isLast(index: number | null, patterns: simplePattern[]) {
  return (
    (index === null && patterns.length === 0) || index === patterns.length - 1
  );
}

export interface PatternListProps {
  onNewSearch: (scanID: string) => void;
  state: State | null;
}
export const PatternList: React.FC<PatternListProps> = ({
  onNewSearch,
  state,
}) => {
  const [pattern, setPattern] = useStore("pattern");
  const [patterns, setPatterns] = useState<simplePattern[]>([]);

  const [numRerenders, setNumRerenders] = useState(0);

  function setPatternAtIndex(index: number | null, p: simplePattern) {
    if (index === null) {
      setPattern(p.pattern);
    } else {
      patterns[index] = p;
      setPatterns(patterns);
      setNumRerenders(numRerenders + 1);
    }
  }

  function deletePatternAtIndex(index: number | null) {
    if (index === null) {
      return;
    }
    patterns.splice(index, 1);
    setPatterns(patterns);
    setNumRerenders(numRerenders + 1);
  }

  function onNewPattern() {
    const newPatterns = patterns.concat({ isPositive: true, pattern: "" });
    setPatterns(newPatterns);
    setNumRerenders(numRerenders + 1);
  }

  function mk(p: simplePattern, index: number | null) {
    return (
      <div className={styles["search-row"]}>
        <PatternBadge
          isPositive={p.isPositive}
          onPositivityToggle={() =>
            setPatternAtIndex(index, {
              isPositive: !p.isPositive,
              pattern: p.pattern,
            })
          }
          onNewPattern={onNewPattern}
          patterns={patterns}
          index={index}
        />
        <TextBox
          onNewSearch={onNewSearch}
          placeholder="Pattern"
          isMultiline={true}
          value={p.pattern}
          onChange={(value: string) =>
            setPatternAtIndex(index, {
              isPositive: p.isPositive,
              pattern: value,
            })
          }
        />
        {index === null ? (
          <LangChooser keyName="language" />
        ) : (
          <div
            className={styles["delete-pattern-button"]}
            onClick={() => deletePatternAtIndex(index)}
          >
            <VscClose />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={styles["pattern-list"]}>
      {mk({ isPositive: true, pattern: pattern }, null)}
      {patterns.map((p: simplePattern, index: number) => mk(p, index))}
    </div>
  );
};
