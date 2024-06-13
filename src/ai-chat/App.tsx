import { useState } from "react";
import "./App.css";
import { Chat } from "./src/Chat";
import { vscode } from "./utilities/vscode";
import { AiChatMessage } from "../lspExtensions";
import { init, webviewPostChat } from "../interface/interface";
import { Input } from "./src/Input";

const App: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [goodExamples, setGoodExamples] = useState<string[]>([]);
  const [badExamples, setBadExamples] = useState<string[]>([]);
  vscode.onMessage = (message: AiChatMessage) => {
    message.content = `\`\`\`yaml\n${message.content}\n\`\`\``;
    setMessages([message, ...messages]);
  };
  vscode.onSetBadExample = (example: string, language: string) => {
    setBadExamples([example, ...badExamples]);
  };
  vscode.onSetGoodExample = (example: string, language: string) => {
    setGoodExamples([example, ...goodExamples]);
  };

  const onSend = (messageContent: string) => {
    const message: AiChatMessage = {
      role: "user",
      content: messageContent,
    };
    if (!initialized) {
      setInitialized(true);
      vscode.sendMessageToExtension({ command: init, message: message });
    } else {
      vscode.sendMessageToExtension({
        command: webviewPostChat,
        message: message,
      });
    }
    setMessages([message, ...messages]);
  };
  console.log("Here");
  return (
    <main>
      <Chat
        messages={messages}
        goodExamples={goodExamples}
        badExamples={badExamples}
        setBadExamples={setBadExamples}
        setGoodExamples={setGoodExamples}
      />
      <Input onSend={onSend}> iokjlafcealjkedsfklja</Input>
    </main>
  );
};

export default App;
