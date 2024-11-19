import styles from "./SearchResults.module.css";

function splitByLastSlash(str: string): [string, string] {
  const lastIndex = str.lastIndexOf("/");
  if (lastIndex !== -1) {
    const beforeLastSlash = str.substring(0, lastIndex);
    const afterLastSlash = str.substring(lastIndex + 1);
    return [beforeLastSlash, afterLastSlash];
  } else {
    // If no slash is found, return the original string and an empty string
    return ["", str];
  }
}

export interface PathHeaderProps {
  path: string;
}
export const PathHeader: React.FC<PathHeaderProps> = ({ path }) => {
  const [prefix, filename] = splitByLastSlash(path);
  return (
    <div className={styles.pathHeader}>
      <a className={styles.fileName}>{filename}</a>
      <span className={styles.prefixPath}>{prefix}</span>
    </div>
  );
};
