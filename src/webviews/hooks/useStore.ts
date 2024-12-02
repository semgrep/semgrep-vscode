import { useSyncExternalStore } from "react";
import type { simplePattern } from "../components/TopSection/PatternList";
import { SUPPORTED_LANGS, type SearchLanguage } from "../interface";
import { vscode } from "../utilities/vscode";

export interface Store {
  pattern: string;
  fix: string;
  includes: string;
  excludes: string;
  language: string;
  simplePatterns: simplePattern[];
}

/* TODO: We are no longer using  local storage due to version issues with
   React 18 and useSyncExternalStore, but we can bring this back later once
   we do.
*/
/*
const localStorageKeys: Record<keyof Store, string> = {
  pattern: "semgrep-search-pattern",
  fix: "semgrep-search-fix",
  includes: "semgrep-search-includes",
  excludes: "semgrep-search-excludes",
  language: "semgrep-search-language",
  simplePatterns: "semgrep-search-simple-patterns",
};
*/

function defaultStore() {
  return {
    pattern: "",
    fix: "",
    includes: "",
    excludes: "",
    language: "",
    simplePatterns: [],
  };
}

const store: Store = defaultStore();
let version = 114514;
let subscribeFunction: (() => void) | null = null;

export function onStoreChange() {
  version = version + 1;
  if (subscribeFunction) {
    subscribeFunction();
  }
}

export function subscribe(onChange: () => void): () => void {
  subscribeFunction = onChange;
  return () => {
    subscribeFunction = null;
  };
}

export function getSnapshot() {
  return version;
}

export function generateUniqueID(): string {
  return Math.random().toString(36).substring(7);
}

export function useSearch(
  store: Store,
  onNewSearch: (scanID: string) => void,
): void {
  function splitAndTrim(value: string): string[] {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }
  const fixValue = store.fix === "" ? null : store.fix;
  const lang = SUPPORTED_LANGS.includes(store.language as SearchLanguage)
    ? (store.language as SearchLanguage)
    : null;
  const scanID = generateUniqueID();
  // do some naive parsing here
  const includes = splitAndTrim(store.includes);
  const excludes = splitAndTrim(store.excludes);
  onNewSearch(scanID);
  vscode.sendMessageToExtension({
    command: "webview/semgrep/search",
    patterns: [
      { positive: true, pattern: store.pattern },
      ...store.simplePatterns,
    ],
    fix: fixValue,
    includes: includes,
    excludes: excludes,
    scanID: scanID,
    lang,
  });
}

export function useStore() {
  useSyncExternalStore(subscribe, getSnapshot);
  return store;
}

// This function sets the store to have a certain value.
// Ideally, we could use local storage to persist this across sessions,
// but useSyncExternalStore is from React 18, which from experimentation
// seems to be messing with `react-use` at 17.5.
// So for now, we'll eschew the local storage, as it shouldn't matter too much.
export function useSetStore(key: keyof Store, value: any): void {
  if (key === "simplePatterns") {
    // const [field = [], setField] = useLocalStorage(localStorageKeys[key], []);
    store[key] = value;
    // annoying code duplication here because simplePatterns has a different type of
    // data that it is storing, vs the other keys
  } else {
    // const [field = "", setField] = useLocalStorage(localStorageKeys[key], "");
    store[key] = value;
  }
  onStoreChange();
}

export function exportRule() {
  vscode.sendMessageToExtension({
    command: "webview/semgrep/exportRule",
    patterns: [
      { positive: true, pattern: store.pattern },
      ...store.simplePatterns,
    ],
    language: store.language,
  });
}
