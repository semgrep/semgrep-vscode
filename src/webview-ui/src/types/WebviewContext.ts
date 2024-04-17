import { createContext } from "react";
import { simplePattern } from "../components/TopSection/PatternList";
import { useLocalStorage } from "react-use";

type WebviewContextType = {
  getStore: () => Store;
};

const localStorageKeys: Record<keyof Store, string> = {
  pattern: "semgrep-search-pattern",
  fix: "semgrep-search-fix",
  includes: "semgrep-search-includes",
  excludes: "semgrep-search-excludes",
  language: "semgrep-search-language",
  simplePatterns: "semgrep-search-simple-patterns",
};

export interface Store {
  pattern: string;
  fix: string;
  includes: string;
  excludes: string;
  language: string;
  simplePatterns: simplePattern[];
}

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

export function initializeStore() {
  for (const keyInner in localStorageKeys) {
    const key = keyInner as keyof Store;

    if (key === "simplePatterns") {
      const [field = [], _setField] = useLocalStorage(
        localStorageKeys[key],
        []
      );
      store[key] = field;
      // annoying code duplication here because simplePatterns has a different type of
      // data that it is storing, vs the other keys
    } else {
      const [field = "", _setField] = useLocalStorage(
        localStorageKeys[key],
        ""
      );
      store[key] = field;
    }
  }
}

// Don't put anything that changes often here, as it will cause the entire component tree to re-render frequently
export const WebviewContext = createContext<WebviewContextType>({
  getStore: () => store,
});
