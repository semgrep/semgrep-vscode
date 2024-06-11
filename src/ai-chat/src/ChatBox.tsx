import { AiChatMessage } from "../../lspExtensions";
import Markdown from "react-markdown";

export const ChatBox: React.FC<AiChatMessage> = ({ content, role }) => {
  return (
    <div className={`message ${role}`}>
      <Markdown>{content}</Markdown>
    </div>
  );
};
