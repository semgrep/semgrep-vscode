import { AiChatMessage } from "../../lspExtensions";
import { CodeHighlighting } from "./CodeHighlighting";

export const ChatBox: React.FC<AiChatMessage> = ({ content, role }) => {
  return (
    <div className={`message ${role}`}>
      <CodeHighlighting content={content} />
    </div>
  );
};
