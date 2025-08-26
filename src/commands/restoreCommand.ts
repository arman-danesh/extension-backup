import * as vscode from "vscode";
import { restoreAll } from "../core/backupManager";

export function registerRestoreCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("backup.downloadGoogle", async () => {
    try { await restoreAll(context); }
    catch (err) { vscode.window.showErrorMessage(`Restore failed: ${(err as Error).message}`); }
  });
  context.subscriptions.push(disposable);
}
