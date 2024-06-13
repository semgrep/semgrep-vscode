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
      <input
        type="text"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        onClick={() => {
          onSend(message);
          setMessage("");
        }}
      >
        Send
      </button>
    </div>
  );
};
