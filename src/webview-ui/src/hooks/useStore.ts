import { useEffect } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { vscode } from "../../utilities/vscode";
import { SUPPORTED_LANGS } from "../../../constants";
import { SearchLanguage } from "../../../interface/interface";

export interface Store {
  pattern: string;
  fix: string;
  includes: string;
  excludes: string;
  language: string;
}

const localStorageKeys: Record<keyof Store, string> = {
  pattern: "semgrep-search-pattern",
  fix: "semgrep-search-fix",
  includes: "semgrep-search-includes",
  excludes: "semgrep-search-excludes",
  language: "semgrep-search-language",
};

const store: Record<keyof Store, string> = {
  pattern: "",
  fix: "",
  includes: "",
  excludes: "",
  language: "",
};
export function generateUniqueID(): string {
  return Math.random().toString(36).substring(7);
}

export function useSearch(onNewSearch: (scanID: string) => void): void {
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
    pattern: store.pattern,
    fix: fixValue,
    includes: includes,
    excludes: excludes,
    scanID: scanID,
    lang,
  });
}

export function useStore(key: keyof Store): [string, (value: string) => void] {
  const [field = "", setField] = useLocalStorage(localStorageKeys[key], "");
  useEffect(() => {
    store[key] = field;
  }, [field, key]);
  return [field, setField];
}
