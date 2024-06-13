import { AiChatMessage } from "../../lspExtensions";
import { ChatBox } from "./ChatBox";

import "./Chat.css";
import {
  VSCodeBadge,
  VSCodeProgressRing,
} from "@vscode/webview-ui-toolkit/react";

export interface ChatProps {
  messages: (AiChatMessage | string)[];
  loading: boolean;
}

export const Chat: React.FC<ChatProps> = ({ messages, loading }) => {
  return (
    <div className="chat-container">
      {loading && <VSCodeProgressRing />}

      {messages.map((message: AiChatMessage | string, index: number) =>
        typeof message === "string" ? (
          <div key={index} className="badge-container">
            <VSCodeBadge>{message}</VSCodeBadge>
          </div>
        ) : (
          <ChatBox key={index} role={message.role} content={message.content} />
        )
      )}
    </div>
  );
};
