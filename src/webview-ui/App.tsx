import { vscode } from "./utilities/vscode";
import "./App.css";
import { useState } from "react";
import { SearchResults } from "./src/components/SearchResults/SearchResults";
import { TopSection } from "./src/components/TopSection/TopSection";
import { State } from "./src/types/state";
import { ViewResults } from "./src/types/results";

const App: React.FC = () => {
  /* The states are as follows:
     - null: No search has ever been requested yet.
     - { searchConcluded: false, { scanID, ...} }: a search is ongoing, for the scan
       ID scanID. We are waiting for results.
     - { searchConcluded: true, { scanID, results} }: a search has concluded, and we
       have saved results in `results`. This scan had ID scanID.
   */
  const [state, setState] = useState<State | null>(null);

  // This code registers a handler with the VSCode interfacing infrastrucure,
  // outside of this component.
  // This is because we need this webview to re-render every time that we
  // receive results from the extension. To make sure that the component
  // knows to re-render, we will allow `vscode.ts` to call this callback,
  // which will update the state of the component.
  vscode.onUpdate = (results: ViewResults) => {
    if (state === null) {
      vscode.sendMessageToExtension({
        command: "webview/semgrep/print",
        message: "Impossible? Webview got results while state was null.",
      });
      return;
    }
    /* This means that this update is not for the current ongoing search!
       We probably raced, and future results are coming in.
       Just ignore it until relevant results come in.
     */
    if (state.results.scanID !== results.scanID) {
      return;
    }

    /* The search is done! */
    if (results.locations.length === 0) {
      setState({ ...state, searchConcluded: true });
    } else {
      /* Combine the new results with the saved results! */
      const newState: State = {
        searchConcluded: false,
        results: {
          locations: state.results.locations.concat(results.locations),
          scanID: results.scanID,
        },
      };
      setState(newState);
    }
  };

  // On a new search, we will generate a new (hopefully) unique scan ID, and wait
  // to receive results.
  function onNewSearch(scanID: string) {
    setState({
      searchConcluded: false,
      results: { scanID: scanID, locations: [] },
    });
  }

  return (
    <main>
      <TopSection onNewSearch={onNewSearch} />
      {state && <SearchResults state={state} />}
    </main>
  );
};

export default App;
