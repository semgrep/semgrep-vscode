import { AiChatMessage } from "../../lspExtensions";
import { ChatBox } from "./ChatBox";

import "./Chat.css";

export interface ChatProps {
  messages: AiChatMessage[];
}

export const Chat: React.FC<ChatProps> = ({ messages }) => {
  return (
    <div className="chat-container">
      {messages.map((message: AiChatMessage, index: number) => (
        <ChatBox key={index} role={message.role} content={message.content} />
      ))}
    </div>
  );
};
