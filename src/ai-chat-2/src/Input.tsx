import { useState } from "react";

export interface InputProps {
  onSend: (message: string) => void;
}

export const Input: React.FC<InputProps> = ({ onSend }: InputProps) => {
  const [message, setMessage] = useState("");
  return (
    <div className="input-container">
      <input
        type="text"
        placeholder="Type your message here..."
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
