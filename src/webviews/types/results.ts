import type { SearchMatch } from "../../search";

export type ViewMatch = {
  // Flags set on each match. Initially false, and populated if the
  // button is clicked to fix or dismiss the match.
  isFixed: boolean;
  isDismissed: boolean;

  searchMatch: SearchMatch;
};

export type ViewResult = {
  uri: string;
  // This path has already been processed to be relative to the workspace
  // path.
  path: string;
  matches: ViewMatch[];
};

export type ViewResults = {
  scanID: string;
  locations: ViewResult[];
};
