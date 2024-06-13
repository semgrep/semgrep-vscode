import { AiChatMessage } from "../../lspExtensions";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import Markdown from "react-markdown";

export const ChatBox: React.FC<AiChatMessage> = ({ content, role }) => {
  return (
    <div className={`message ${role}`}>
      <Markdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <SyntaxHighlighter
                {...rest}
                PreTag="div"
                children={String(children).replace(/\n$/, "")}
                language={match[1]}
              />
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
