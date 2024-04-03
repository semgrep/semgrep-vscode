import { useState } from "react";
import { TextBox } from "../utils/TextBox";
import { LangChooser } from "../utils/LangChooser";
import styles from "./MainInputs.module.css";
import { VscClose } from "react-icons/vsc";
import { useStore } from "../../hooks/useStore";
import { PatternBadge } from "./PatternBadge";

export type simplePattern = { positive: boolean; pattern: string };

export function isLast(
  index: number | null,
  patterns: simplePattern[]
): boolean {
  return (
    (index === null && patterns.length === 0) || index === patterns.length - 1
  );
}

export interface PatternListProps {
  onNewSearch: (scanID: string) => void;
}
export const PatternList: React.FC<PatternListProps> = ({ onNewSearch }) => {
  const [pattern, setPattern] = useStore("pattern");
  const [patterns, setPatterns] = useStore("simplePatterns");

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
    const newPatterns = patterns.concat({ positive: true, pattern: "" });
    setPatterns(newPatterns);
    setNumRerenders(numRerenders + 1);
  }

  function mkPattern(p: simplePattern, index: number | null) {
    return (
      <div className={styles.searchRow}>
        <PatternBadge
          positive={p.positive}
          onPositivityToggle={() =>
            setPatternAtIndex(index, {
              positive: !p.positive,
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
              positive: p.positive,
              pattern: value,
            })
          }
        />
        {index === null ? (
          <LangChooser keyName="language" />
        ) : (
          <div
            className={styles.deletePatternButton}
            onClick={() => deletePatternAtIndex(index)}
          >
            <VscClose />
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={styles.patternList}>
      {mkPattern({ positive: true, pattern: pattern }, null)}
      {patterns.map((p: simplePattern, index: number) => mkPattern(p, index))}
    </div>
  );
};
