import { AiChatMessage } from "../../lspExtensions";
import { ChatBox } from "./ChatBox";
import Markdown from "react-markdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import "./Chat.css";

export interface ChatProps {
  messages: AiChatMessage[];
  badExamples?: string[];
  goodExamples?: string[];
  setBadExamples?: (examples: string[]) => void;
  setGoodExamples?: (examples: string[]) => void;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  setBadExamples = () => {
    return;
  },
  setGoodExamples = () => {
    return;
  },
  badExamples = [],
  goodExamples = [],
}) => {
  const removeBadExample = (index: number) => {
    setBadExamples(badExamples.filter((_, i) => i !== index));
  };

  const removeGoodExample = (index: number) => {
    setGoodExamples(goodExamples.filter((_, i) => i !== index));
  };

  return (
    <div className="chat-container">
      {messages.map((message: AiChatMessage, index: number) => (
        <ChatBox key={index} role={message.role} content={message.content} />
      ))}

      <div className="examples-container">
        <div className="examples-section">
          <h3>Good Examples</h3>
          {goodExamples.map((example, index) => (
            <div key={index} className="example-box good-example">
              <button
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => removeGoodExample(index)}
              >
                <FontAwesomeIcon size="xs" icon={faTimes} />
              </button>
              <Markdown>{example}</Markdown>
            </div>
          ))}
        </div>

        <div className="examples-section">
          <h3>Bad Examples</h3>
          {badExamples.map((example, index) => (
            <div key={index} className="example-box bad-example">
              <button
                style={{
                  position: "absolute",
                  top: "5px",
                  right: "5px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => removeBadExample(index)}
              >
                <FontAwesomeIcon size="xs" icon={faTimes} />
              </button>
              <Markdown>{example}</Markdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
