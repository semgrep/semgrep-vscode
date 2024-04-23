import path = require("path");
import {
  SearchParams,
  SearchResults,
  search,
  searchOngoing,
} from "./lspExtensions";
import { ViewResults } from "./webview-ui/src/types/results";
import * as vscode from "vscode";
import { Environment } from "./env";

/*****************************************************************************/
/* Types */
/*****************************************************************************/

export type SearchMatch = {
  range: vscode.Range;
  fix: string | null;
  before: string;
  inside: string;
  after: string;
};

export class SearchResult {
  constructor(readonly uri: string, readonly matches: SearchMatch[]) {}
}

/*****************************************************************************/
/* Helpers */
/*****************************************************************************/

async function viewResultsOfSearchResults(
  scanID: string,
  results: SearchResults
): Promise<ViewResults> {
  async function viewResultofSearchResult(result: SearchResult) {
    const uri = vscode.Uri.parse(result.uri);
    const workspacePath = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
    return {
      uri: result.uri,
      path: path.relative(workspacePath, uri.fsPath),
      matches: await Promise.all(
        result.matches.map(async (match) => {
          return {
            isFixed: false,
            isDismissed: false,
            searchMatch: match,
          };
        })
      ),
    };
  }
  return {
    scanID: scanID,
    locations: await Promise.all(
      results.locations.map(viewResultofSearchResult)
    ),
  };
}

/*****************************************************************************/
/* Searching */
/*****************************************************************************/

export async function handleSearch(
  env: Environment,
  searchParams: SearchParams
): Promise<void> {
  env.scanID = searchParams.scanID;

  env.client?.onNotification("foo/bar", (params) => {
    console.log("got foo/bar");
  });

  if (searchParams != null) {
    console.log("sending search req");
    await env.client?.sendRequest(search, searchParams.lspParams);
    console.log("got search req response");
  }
}
