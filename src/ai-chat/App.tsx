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
  vscode.onMessage = (message: AiChatMessage) => {
    message.content = `\`\`\`yaml\n${message.content}\n\`\`\``;
    setMessages([message, ...messages]);
  };

  vscode.onSetExample = (example: string, language: string) => {
    const message = {
      role: "assistant",
      content: `What's wrong with the following code snippet?\n \`\`\`${language.toLowerCase()}\n${example}\n\`\`\``,
    };
    setMessages([message, ...messages]);
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
  return (
    <main>
      <Chat messages={messages} />
      <Input onSend={onSend} />
    </main>
  );
};

export default App;
