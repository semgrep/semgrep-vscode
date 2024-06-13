import { useState } from "react";
import "./App.css";
import { Chat } from "./src/Chat";
import { vscode } from "./utilities/vscode";
import { AiChatMessage } from "../lspExtensions";
import {
  init,
  removeExample,
  sendToApp,
  webviewPostChat,
} from "../interface/interface";
import { Input } from "./src/Input";
import { parse } from "yaml"; // Import yaml

import { Examples } from "./src/Examples";
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react";
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
const defaultMessage: AiChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm Semgrep Assistant and I'm here to help you write a rule. Give me good and bad examples and tell me your intent of the rule",
};
const App: React.FC = () => {
  const [messages, setMessages] = useState<(AiChatMessage | string)[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [goodExamples, setGoodExamples] = useState<string[]>([]);
  const [badExamples, setBadExamples] = useState<string[]>([]);
  const [languageGuessed, setLanguage] = useState<string>("python");
  const [loading, setLoading] = useState(false);
  vscode.onMessage = (message: AiChatMessage) => {
    message.content = `\`\`\`yaml\n${message.content}\n\`\`\``;
    setMessages([message, ...messages]);
    setLoading(false);
  };

  vscode.onSetBadExample = (example: string, language: string) => {
    setBadExamples([example, ...badExamples]);
    setLanguage(language);
    if (messages.length == 0) {
      setMessages([defaultMessage]);
    } else {
      setLoading(true);
      setMessages([`The user added a bad example`, ...messages]);
    }
  };
  vscode.onSetGoodExample = (example: string, language: string) => {
    setGoodExamples([example, ...goodExamples]);
    setLanguage(language);
    if (messages.length == 0) {
      setMessages([defaultMessage]);
    } else {
      setLoading(true);
      setMessages([`The user added a good example`, ...messages]);
    }
  };
  const onRemoveBadExample = (example: string) => {
    vscode.sendMessageToExtension({
      command: removeExample,
      good: false,
      example: example,
    });
    setMessages([`The user removed a bad example`, ...messages]);
    setLoading(true);
  };
  const onRemoveGoodExample = (example: string) => {
    vscode.sendMessageToExtension({
      command: removeExample,
      good: true,
      example: example,
    });
    setMessages([`The user removed a good example`, ...messages]);
    setLoading(true);
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
    setLoading(true);
  };
  const onViewInApp = () => {
    if (typeof messages[0] === "string") {
      return;
    }
    const lastMessage = messages[0].content;
    const combinedExamples = [...badExamples, "", ...goodExamples].join("\n");
    let definition = { rules: lastMessage };
    try {
      const yamlContent = lastMessage.replace(/```yaml\n|```/g, "");
      definition = parse(yamlContent);
    } catch (e) {
      console.error("Failed to parse YAML", e);
    }
    const saveMetadata: RulePostParams = {
      definition: definition,
      language: languageGuessed,
      test_target: combinedExamples,
      highlights: [],
      visibility: "unlisted",
    };
    vscode.sendMessageToExtension({
      command: sendToApp,
      message: saveMetadata,
    });
  };
  const placeholder =
    messages.length !== 0
      ? "Explain what refinement you would like to make to the rule"
      : "Explain what you would like the rule to do";
  return (
    <main>
      <Examples
        goodExamples={goodExamples}
        badExamples={badExamples}
        setBadExamples={setBadExamples}
        setGoodExamples={setGoodExamples}
        language={languageGuessed}
        onRemoveBadExample={onRemoveBadExample}
        onRemoveGoodExample={onRemoveGoodExample}
      />
      <VSCodeDivider />
      <Chat messages={messages} loading={loading} />
      {!loading && messages.length > 1 && (
        <VSCodeButton onClick={onViewInApp}>View in App</VSCodeButton>
      )}
      <Input placeholder={placeholder} onSend={onSend} />
    </main>
  );
};

export default App;
