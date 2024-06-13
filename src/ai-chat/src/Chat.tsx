import { AiChatMessage } from "../../lspExtensions";
import { ChatBox } from "./ChatBox";
import { Box, Text, CloseButton } from "@mantine/core";

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

      <Box mt="md">
        <Text w={500}>Good Examples</Text>
        {goodExamples.map((example, index) => (
          <Box
            key={index}
            p="sm"
            mb="sm"
            style={{ border: "1px solid green", position: "relative" }}
          >
            <Text>{example}</Text>
            <CloseButton
              size="sm"
              style={{ position: "absolute", top: 5, right: 5 }}
              onClick={() => removeGoodExample(index)}
            />
          </Box>
        ))}
      </Box>

      <Box mt="md">
        <Text w={500}>Bad Examples</Text>
        {badExamples.map((example, index) => (
          <Box
            key={index}
            p="sm"
            mb="sm"
            style={{ border: "1px solid red", position: "relative" }}
          >
            <Text>{example}</Text>
            <CloseButton
              size="sm"
              style={{ position: "absolute", top: 5, right: 5 }}
              onClick={() => removeBadExample(index)}
            />
          </Box>
        ))}
      </Box>
    </div>
  );
};
