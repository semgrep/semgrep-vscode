import { AiChatMessage } from "../../lspExtensions";
import { ChatBox } from "./ChatBox";
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
              <span>{example}</span>
              <button
                className="close-button"
                onClick={() => removeGoodExample(index)}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className="examples-section">
          <h3>Bad Examples</h3>
          {badExamples.map((example, index) => (
            <div key={index} className="example-box bad-example">
              <span>{example}</span>
              <button
                className="close-button"
                onClick={() => removeBadExample(index)}
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
