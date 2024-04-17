import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { vscode } from "../../../utilities/vscode";
import { SearchLanguage } from "../../../../interface/interface";
import { useState } from "react";
import { useSetStore } from "../../hooks/useStore";
import { SUPPORTED_LANGS } from "../../../../constants";

import styles from "./Utils.module.css";

export interface LangChooserProps {
  lang: string;
}

export const LangChooser: React.FC<LangChooserProps> = ({ lang }) => {
  const activeLang = SUPPORTED_LANGS.includes(lang as SearchLanguage)
    ? (lang as SearchLanguage)
    : null;

  const setLang = (lang: SearchLanguage) => {
    useSetStore("language", lang);
  };

  const [userHasSelectedLang, setUserHasSelectedLang] =
    useState<boolean>(false);

  // we need to receive the currently active language from vscode. This
  // registers a callback that can be called when the activeLang command
  // is received.
  vscode.onUpdateActiveLang = (activeLang: SearchLanguage | null) => {
    // only update the language if the user has not manually selected it.
    if (userHasSelectedLang) {
      return;
    }

    setLang(activeLang ?? "");
  };

  const handleUpdateLang = (lang: string) => {
    setUserHasSelectedLang(true);
    if (lang == "all") {
      setLang("");
    }
    if (SUPPORTED_LANGS.includes(lang as SearchLanguage)) {
      setLang(lang);
    } else {
      throw new Error("Invalid language");
    }
  };

  return (
    <VSCodeDropdown
      value={activeLang ?? "all"}
      onChange={(e: any) => handleUpdateLang(e.currentTarget.value)}
      className={styles["lang-chooser"]}
    >
      <VSCodeOption>all</VSCodeOption>
      {SUPPORTED_LANGS.map((l) => (
        <VSCodeOption>{l}</VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};
