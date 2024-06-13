import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark, faTimes } from "@fortawesome/free-solid-svg-icons";
import { CodeHighlighting } from "./CodeHighlighting";
import { on } from "events";

export interface ExamplesProps {
  badExamples?: string[];
  goodExamples?: string[];
  setBadExamples?: (examples: string[]) => void;
  setGoodExamples?: (examples: string[]) => void;
  onRemoveBadExample?: (example: string) => void;
  onRemoveGoodExample?: (example: string) => void;
  language: string;
}

export const Examples: React.FC<ExamplesProps> = ({
  setBadExamples = () => {
    return;
  },
  setGoodExamples = () => {
    return;
  },
  onRemoveBadExample = () => {
    return;
  },
  onRemoveGoodExample = () => {
    return;
  },
  badExamples = [],
  goodExamples = [],
  language,
}) => {
  const removeBadExample = (index: number) => {
    onRemoveBadExample(badExamples[index]);
    setBadExamples(badExamples.filter((_, i) => i !== index));
  };

  const removeGoodExample = (index: number) => {
    onRemoveGoodExample(goodExamples[index]);
    setGoodExamples(goodExamples.filter((_, i) => i !== index));
  };

  const codeBlockOfExample = (example: string) => {
    return `\`\`\`${language}\n${example}\n\`\`\``;
  };
  return (
    <div>
      <div>
        <h3>Good Examples</h3>
        {goodExamples.map((example, index) => (
          <div key={index} className="example-box good-example">
            <VSCodeButton
              className="close-button"
              onClick={() => removeGoodExample(index)}
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
            </VSCodeButton>
            <div style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
              <CodeHighlighting content={codeBlockOfExample(example)} />
            </div>
          </div>
        ))}
      </div>

      <div className="examples-section">
        <h3>Bad Examples</h3>
        {badExamples.map((example, index) => (
          <div key={index} className="example-box bad-example">
            <VSCodeButton
              className="close-button"
              onClick={() => removeBadExample(index)}
            >
              <FontAwesomeIcon icon={faTimes} color="red" size="sm" />
            </VSCodeButton>
            <div style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
              <CodeHighlighting content={codeBlockOfExample(example)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
