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

import { SUPPORTED_LANGS } from "../constants";
import { AiChatMessage } from "../lspExtensions";
import { ViewResults } from "../search-ui/src/types/results";
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
export const replace = "webview/semgrep/replace";
export const replaceAll = "webview/semgrep/replaceAll";
export const getLanguage = "webview/semgrep/getActiveLang";
export const exportRule = "webview/semgrep/exportRule";
export const webviewPostChat = "webview/semgrep/postChat";
export const init = "webview/semgrep/init";

export type webviewToExtensionCommand =
  | {
      command: typeof search;
      patterns: { positive: boolean; pattern: string }[];
      fix: string | null;
      includes: string[];
      excludes: string[];
      scanID: string;
      lang: SearchLanguage | null; // null means all languages
    }
  | { command: typeof print; message: string }
  | { command: typeof select; uri: string; range: vscode.Range }
  | { command: typeof replace; uri: string; range: vscode.Range; fix: string }
  | { command: typeof replaceAll; matches: ViewResults }
  | { command: typeof getLanguage }
  | {
      command: typeof exportRule;
      patterns: { positive: boolean; pattern: string }[];
      language: string;
    }
  | { command: typeof webviewPostChat; message: AiChatMessage }
  | { command: typeof init; message: AiChatMessage };

/*****************************************************************************/
/* Extension to webview commands */
/*****************************************************************************/

export const results = "extension/semgrep/results";
export const activeLang = "extension/semgrep/activeLang";
export const clear = "extension/semgrep/clear";
export const exportRuleRequest = "extension/semgrep/exportRuleRequest";
export const postChat = "extension/semgrep/postChat";
export const setGoodExample = "extension/semgrep/setGoodExample";
export const setBadExample = "extension/semgrep/setBadExample";
export type SearchLanguage = (typeof SUPPORTED_LANGS)[number];

export type extensionToWebviewCommand =
  | {
      command: typeof results;
      results: ViewResults;
    }
  | {
      command: typeof activeLang;
      lang: SearchLanguage | null;
    }
  | { command: typeof clear }
  | { command: typeof exportRuleRequest }
  | { command: typeof postChat; message: AiChatMessage }
  | { command: typeof setGoodExample; example: string; language: string }
  | { command: typeof setBadExample; example: string; language: string };
