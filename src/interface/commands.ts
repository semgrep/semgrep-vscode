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

export const search = "webkit/semgrep/search";

export type webkitCommand = { command: typeof search; pattern: string };
