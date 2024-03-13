/* Brandon Wu
 *
 * Copyright (C) 2019-2023 Semgrep, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public License
 * version 2.1 as published by the Free Software Foundation, with the
 * special exception on linking described in file LICENSE.
 *
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the file
 * LICENSE for more details.
 */

import { SearchResults } from "../lspExtensions";
import { ViewResult, ViewResults } from "../webview-ui/src/types/results";
import * as vscode from "vscode";

/*****************************************************************************/
/* Prelude */
/*****************************************************************************/

/* This file concerns the interface between the Webkit view and the Semgrep VS
   Code Extension.

   The webview provider will handle messages that it receives, which have
   particular constants associated with them. To make sure that we exhaustively
   handle our possibilities, we maintain a webkitCommand type, which is to be
   extended whenever we add a new command.

   See `search.ts` for the view which implements the handler.
 */

/*****************************************************************************/
/* Webview to extension commandsj */
/*****************************************************************************/

export const search = "webview/semgrep/search";
/* just a test command. can be removed later. */
export const print = "webview/semgrep/print";
export const select = "webview/semgrep/select";

export type webviewToExtensionCommand =
  | { command: typeof search; pattern: string; fix: string | null }
  | { command: typeof print; message: string }
  | { command: typeof select; uri: string; range: vscode.Range };

/*****************************************************************************/
/* Extension to webview commands */
/*****************************************************************************/

export const results = "extension/semgrep/results";

export type extensionToWebviewCommand = {
  command: typeof results;
  results: ViewResults;
};
