import { useState } from "react";
import { VscClose } from "react-icons/vsc";
import { type Store, useSetStore } from "../../hooks/useStore";
import { LangChooser } from "../utils/LangChooser";
import { TextBox } from "../utils/TextBox";
import { PositivityBadge } from "./PositivityBadge";

import styles from "./MainInputs.module.css";

export type simplePattern = { positive: boolean; pattern: string };

export function isLast(
  index: number | null,
  patterns: simplePattern[],
): boolean {
  return (
    (index === null && patterns.length === 0) || index === patterns.length - 1
  );
}

export interface PatternListProps {
  onNewSearch: (scanID: string) => void;
  store: Store;
}
export const PatternList: React.FC<PatternListProps> = ({
  onNewSearch,
  store,
}) => {
  function setPattern(pattern: string) {
    useSetStore("pattern", pattern);
  }
  function setPatterns(simplePatterns: simplePattern[]) {
    useSetStore("simplePatterns", simplePatterns);
  }

  function setPatternAtIndex(index: number | null, p: simplePattern) {
    if (index === null) {
      setPattern(p.pattern);
    } else {
      store.simplePatterns[index] = p;
      setPatterns(store.simplePatterns);
    }
  }

  function deletePatternAtIndex(index: number | null) {
    if (index === null) {
      return;
    }
    store.simplePatterns.splice(index, 1);
    setPatterns(store.simplePatterns);
  }

  function onNewPattern() {
    const newPatterns = store.simplePatterns.concat({
      positive: true,
      pattern: "",
    });
    setPatterns(newPatterns);
  }

  function mkPattern(p: simplePattern, index: number | null) {
    return (
      <div className={styles.searchRow}>
        <PositivityBadge
          positive={p.positive}
          onPositivityToggle={() =>
            setPatternAtIndex(index, {
              positive: !p.positive,
              pattern: p.pattern,
            })
          }
          onNewPattern={onNewPattern}
          patterns={store.simplePatterns}
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
          store={store}
        />
        {index === null ? (
          <LangChooser lang={store.language} />
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
      {mkPattern({ positive: true, pattern: store.pattern }, null)}
      {store.simplePatterns.map((p: simplePattern, index: number) =>
        mkPattern(p, index),
      )}
    </div>
  );
};
