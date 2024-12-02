import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import { type Store, useSearch } from "../../hooks/useStore";

const style = {
  // this makes it not quite as weirdly tall
  "--design-unit": "2",
  // I tried setting the borderRadius directly and it doesn't work.
  // For some reason it just doesn't show up in the styles.
  // This does, though.
  "--corner-radius": "2",
  width: "100%",
};

export interface TextBoxProps {
  onNewSearch: (scanID: string) => void;
  isMultiline: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  store: Store;
}
export const TextBox: React.FC<TextBoxProps> = ({
  onNewSearch,
  placeholder,
  isMultiline,
  value,
  onChange,
  description,
  store,
}) => {
  const numRows = isMultiline ? value.split("\n").length : 1;

  return (
    <>
      {description && <h4>{description}</h4>}
      <VSCodeTextArea
        autofocus
        placeholder={placeholder}
        /* get the description text a little farther from the box if it exists */
        style={{ ...style, padding: description ? "2px 0px" : undefined }}
        rows={numRows}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            useSearch(store, onNewSearch);
          }
        }}
        value={value}
        // I literally have no idea what the type of this or the below handler should be
        // We use the onChange here because there's a delta between when the onKeyPress
        // is fired and when the value is updated
        onInput={(e: any) => {
          onChange(e.target.value);
        }}
      />
    </>
  );
};
