import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import Markdown from "react-markdown";

export interface CodeHighlightingProps {
  content: string;
}
export const CodeHighlighting: React.FC<CodeHighlightingProps> = ({
  content,
}) => {
  return (
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
              language={match[1].toLowerCase()}
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
  );
};
