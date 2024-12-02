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

import type * as vscode from "vscode";
import type { ViewResults } from "./types/results";

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

// TODO: This should really be obtained from the CLI rather than be static.
export const SUPPORTED_LANGS = [
  "bash",
  "sh",
  "c",
  "clojure",
  "c++",
  "c#",
  "dart",
  "dockerfile",
  "elixir",
  "go",
  "hack",
  "html",
  "java",
  "javascript",
  "json",
  "jsonnet",
  "julia",
  "kotlin",
  "lisp",
  "lua",
  "ocaml",
  "php",
  "python",
  "r",
  "ruby",
  "rust",
  "scala",
  "scheme",
  "solidity",
  "sol",
  "swift",
  "terraform",
  "typescript",
  "xml",
  "yaml",
];

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
    };

/*****************************************************************************/
/* Extension to webview commands */
/*****************************************************************************/

export const results = "extension/semgrep/results";
export const activeLang = "extension/semgrep/activeLang";
export const clear = "extension/semgrep/clear";
export const exportRuleRequest = "extension/semgrep/exportRuleRequest";

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
  | { command: typeof exportRuleRequest };
