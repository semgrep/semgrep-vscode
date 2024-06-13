import {
  VSCodeButton,
  VSCodeTextArea,
  VSCodeTextField,
} from "@vscode/webview-ui-toolkit/react";
import { useState } from "react";

export interface InputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({
  onSend,
  placeholder,
}: InputProps) => {
  const [message, setMessage] = useState("");
  return (
    <div className="input-container">
      <VSCodeTextField
        className="input"
        placeholder={placeholder}
        value={message}
        onInput={(e) => setMessage(e.target?.value)}
      />
      <VSCodeButton
        className="button"
        onClick={() => {
          onSend(message);
          setMessage("");
        }}
      >
        Send
      </VSCodeButton>
    </div>
  );
};
