import * as vscode from "vscode"
import { LanguageClient } from "vscode-languageclient/node"
import { Environment } from "./env"

export function registerCommands(env:Environment,client:LanguageClient){
    vscode.commands.registerCommand(
        "semgrep.login",
        async () => {
            let result:any = await client?.sendRequest("semgrep/login")
            if (result.kind != 1){
                vscode.env.openExternal(vscode.Uri.parse(result.result.url))
                client?.sendNotification("semgrep/loginFinish",{"sessionId":result.result.sessionId})
            }
        }
    )
}