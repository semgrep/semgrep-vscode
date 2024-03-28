import { vscode } from "./utilities/vscode";
import "./App.css";
import { useEffect, useState } from "react";
import { TopSection } from "./src/components/TopSection/TopSection";
import { SearchResults } from "./src/components/SearchResults/SearchResults";
import { State } from "./src/types/state";

const App: React.FC = () => {
  const [state, setState] = useState<State>();

  // This code registers a handler with the VSCode interfacing infrastrucure,
  // outside of this component.
  // This is because we need this webview to re-render every time that we
  // receive results from the extension. To make sure that the component
  // knows to re-render, we will allow `vscode.ts` to call this callback,
  // which will update the state of the component.
  useEffect(() => {
    vscode.onChange = (state: State) => {
      setState(state);
    };
  }, []);

  return (
    <main>
      <TopSection />
      <SearchResults state={state} />
    </main>
  );
};

export default App;
