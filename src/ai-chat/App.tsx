import { useState } from "react";
import "./App.css";
import { Chat } from "./src/Chat";
import { vscode } from "./utilities/vscode";
import { AiChatMessage } from "../lspExtensions";
import { init, webviewPostChat } from "../interface/interface";
import { Input } from "./src/Input";
interface CodeLoc {
  line: number;
  col?: number;
}
type Visibility =
  | "unlisted"
  | "public"
  | "org_private"
  | "logged_in"
  | "team_tier";
export interface CodeRange {
  start: CodeLoc;
  end: CodeLoc;
}
export type TestCaseHighlight = CodeRange & {
  message: string;
  fix?: string;
};
type RulePostParams = {
  definition: any;
  path?: string;
  language: string;
  test_target: string;
  visibility: Visibility;
  highlights?: TestCaseHighlight[];
  // only needed if visibility is org_private
  deployment_id?: number;
};
const App: React.FC = () => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [goodExamples, setGoodExamples] = useState<string[]>([]);
  const [badExamples, setBadExamples] = useState<string[]>([]);
  const [languageGuessed, setLanguage] = useState<string>("python");
  vscode.onMessage = (message: AiChatMessage) => {
    message.content = `\`\`\`yaml\n${message.content}\n\`\`\``;
    setMessages([message, ...messages]);
  };

  vscode.onSetBadExample = (example: string, language: string) => {
    setBadExamples([example, ...badExamples]);
    setLanguage(language);
  };
  vscode.onSetGoodExample = (example: string, language: string) => {
    setGoodExamples([example, ...goodExamples]);
    setLanguage(language);
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
  const onViewInApp = () => {
    const lastMessage = messages[0].content;
    const combinedExamples = [...badExamples, "", ...goodExamples].join("\n");
    const saveMetadata: RulePostParams = {
      definition: { rules: [lastMessage] },
      language: languageGuessed,
      test_target: combinedExamples,
      visibility: "unlisted",
    };
    fetch("http://localhost:3000/api/registry/rule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saveMetadata),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        const path = data["path"];
        window.open(`http://localhost:3000/orgs/-/editor/r/${path}`, "_blank");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  const placeholder =
    messages.length !== 0
      ? "Explain what refinement you would like to make to the rule"
      : "Explain what you would like the rule to do";
  return (
    <main>
      <Chat
        messages={messages}
        goodExamples={goodExamples}
        badExamples={badExamples}
        setBadExamples={setBadExamples}
        setGoodExamples={setGoodExamples}
      />
      {messages.length !== 0 && (
        <button onClick={onViewInApp}>View in App</button>
      )}
      <Input placeholder={placeholder} onSend={onSend} />
    </main>
  );
};

export default App;
