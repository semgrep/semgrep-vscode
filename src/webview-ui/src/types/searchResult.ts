import { Uri } from "vscode";
import * as vscode from "vscode";

export type SearchResult = {
  uri: Uri;
  matches: MatchResult[];
};

export type MatchResult = {
  range: vscode.Range;
  fix: string | null;
};
