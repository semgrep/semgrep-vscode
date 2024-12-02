import { vscode } from "./utilities/vscode";
import "./App.css";
import { useState, useSyncExternalStore } from "react";
import { SearchResults } from "./components/SearchResults/SearchResults";
import { TopSection } from "./components/TopSection/TopSection";
import { InfoBlurb } from "./components/utils/InfoBlurb";
import { exportRule, useSetStore, useStore } from "./hooks/useStore";
import type { ViewResults } from "./types/results";
import type { State } from "./types/state";

const App: React.FC = () => {
  // This store is all of the non-search-result related state that the
  // webview needs to maintain.
  // This includes stuff like the things that the user writes into boxes, like the
  // patterns, autofix, etc.
  const store = useStore();

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

  vscode.onClear = () => {
    useSetStore("pattern", "");
    useSetStore("simplePatterns", []);
    setState(null);
  };
  vscode.onExportRule = () => {
    exportRule();
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
      <TopSection store={store} onNewSearch={onNewSearch} state={state} />
      {state ? <SearchResults state={state} /> : <InfoBlurb />}
    </main>
  );
};

export default App;
