import { VSCodeDropdown, VSCodeOption } from "@vscode/webview-ui-toolkit/react";
import { vscode } from "../../../utilities/vscode";
import { SearchLanguage } from "../../../../interface/interface";
import { useState } from "react";
import { Store, useStore } from "../../hooks/useStore";
import { SUPPORTED_LANGS } from "../../../../constants";

const style = {
  // this makes it not quite as weirdly tall
  //   "--design-unit": "2",
  // I tried setting the borderRadius directly and it doesn't work.
  // For some reason it just doesn't show up in the styles.
  // This does, though.
  "--corner-radius": "2",
  padding: "0",
};

export interface LangChooserProps {
  keyName: keyof Store;
}

export const LangChooser: React.FC<LangChooserProps> = ({ keyName }) => {
  const [content, setContent] = useStore(keyName);

  const activeLang = SUPPORTED_LANGS.includes(content as SearchLanguage)
    ? (content as SearchLanguage)
    : null;

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

    setContent(activeLang ?? "");
  };

  const handleUpdateLang = (lang: string) => {
    setUserHasSelectedLang(true);
    if (lang == "all") {
      setContent("");
    }
    if (SUPPORTED_LANGS.includes(lang as SearchLanguage)) {
      setContent(lang);
    } else {
      throw new Error("Invalid language");
    }
  };

  return (
    <VSCodeDropdown
      value={activeLang ?? "all"}
      onChange={(e: any) => handleUpdateLang(e.currentTarget.value)}
      style={style}
    >
      <VSCodeOption>all</VSCodeOption>
      {SUPPORTED_LANGS.map((l) => (
        <VSCodeOption>{l}</VSCodeOption>
      ))}
    </VSCodeDropdown>
  );
};
