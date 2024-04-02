import * as vscode from "vscode";
import { SearchMatch } from "../../../searchResultsTree";

export type ViewMatch = {
  before: string;
  inside: string;
  after: string;

  searchMatch: SearchMatch;
};

export type ViewResult = {
  path: string;
  matches: ViewMatch[];
};

export type ViewResults = {
  locations: ViewResult[];
};
