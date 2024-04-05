import path = require("path");
import { SearchParams, search } from "./lspExtensions";
import { SearchResult, getPreviewChunks } from "./searchResultsTree";
import { ViewResults } from "./webview-ui/src/types/results";
import * as vscode from "vscode";
import { Environment } from "./env";
import { ProtocolRequestType } from "vscode-languageclient";

/*****************************************************************************/
/* Helpers */
/*****************************************************************************/

async function viewResultsOfSearchResult(
  scanID: string,
  result: SearchResult
): Promise<ViewResults> {
  const uri = vscode.Uri.parse(result.uri);
  const doc = await vscode.workspace.openTextDocument(uri);
  const workspacePath = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : "";
  return {
    uri: result.uri,
    path: path.relative(workspacePath, uri.fsPath),
    matches: await Promise.all(
      result.matches.map(async (match) => {
        const range = new vscode.Range(match.range.start, match.range.end);
        const { before, inside, after } = getPreviewChunks(doc, range);
        return {
          before: before,
          inside: inside,
          after: after,
          isFixed: false,
          isDismissed: false,
          searchMatch: match,
        };
      })
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
  // set the global scanID to denote which search is currently happening!
  env.scanID = searchParams.scanID;

  searchParams.lspParams.partialResultToken = searchParams.scanID;

  env.client?.onNotification("$/progress", (params) => {
    console.log("got progress");
    console.log(params);
  });

  const disposable = env.client?.onProgress(
    search,
    searchParams.scanID,
    (results) => {
      console.log("got onProgress");
      console.log(results);

      /* This could only be true if another asynchronous handleSearch occurred,
      meaning that the search this loop is for has terminated.
      We need to stop this loop, and send no more results to the webview.
    */
      // THINK: This could have a race condition... if a separate searchLoop
      // changes the scanID after we pass this check, then we might hit the
      // LSP with a /semgrep/searchOngoing request, _after_ the new
      // /semgrep/search.
      // This means that we will get results for the new search, but not send
      // it to the webview.
      // INFO: Javascript async functions only yield at `await` points, which
      // means we could be safe, if not for the fact that `viewResultsOfSearchResults`
      // is in fact called via `await`.
      if (env.scanID !== null && searchParams.scanID !== env.scanID) {
        return;
      }

      // If results is null, that means our search is done, and we may send back an empty result.
      // Otherwise, we convert the existent results we have.
      // const viewResults = results === null ? null : await viewResultsOfSearchResult(searchParams.scanID, results);

      // // And if our search is done, we must un-set the scan ID.
      // if (results == null) {
      //   env.scanID = null;
      // }

      // // Either way, we send the results back to the webview for consumption.
      // env.provider?.sendMessageToWebview({
      //   command: "extension/semgrep/results",
      //   scanID: searchParams.scanID,
      //   results: viewResults,
      // });
    }
  );

  console.log("sending search req");
  await env.client?.sendRequest(search, searchParams.lspParams);
  console.log("got search req response");
}
