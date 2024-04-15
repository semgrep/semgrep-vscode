import { TextBox } from "../utils/TextBox";

export interface MainInputsProps {
  onNewSearch: (scanID: string) => void;
}
export const MainInputs: React.FC<MainInputsProps> = ({ onNewSearch }) => {
  return (
    <>
      <TextBox
        onNewSearch={onNewSearch}
        placeholder="Pattern"
        isMultiline={true}
        keyName="pattern"
      />
      <TextBox
        onNewSearch={onNewSearch}
        placeholder="Fix"
        isMultiline={true}
        keyName="fix"
      />
    </>
  );
};
