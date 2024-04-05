import { ViewResults } from "./results";

// The state of an ongoing search.
// We fill up the `results` field as we receive match information!
export type State = {
  searchConcluded: boolean;
  scanID: string;
  results_by_file: ViewResults[];
};
