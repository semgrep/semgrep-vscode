import { VscAdd, VscChevronDown } from "react-icons/vsc";
import { VscCircleSlash } from "react-icons/vsc";
import { isLast, type simplePattern } from "./PatternList";

import styles from "./MainInputs.module.css";

export interface PositivityBadgeProps {
  index: number | null;
  patterns: simplePattern[];
  positive: boolean;
  onNewPattern: () => void;
  onPositivityToggle: () => void;
}
export const PositivityBadge: React.FC<PositivityBadgeProps> = ({
  onNewPattern,
  index,
  patterns,
  positive,
  onPositivityToggle,
}) => {
  const last = isLast(index, patterns);
  const color = positive
    ? "var(--positive-pattern-badge)"
    : "var(--negative-pattern-badge)";
  const heightOfAdd = last
    ? "var(--add-pattern-badge-height-short)"
    : "var(--add-pattern-badge-height-tall)";
  const heightOfChevron = last ? "var(--add-pattern-chevron-height)" : "0px";
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
