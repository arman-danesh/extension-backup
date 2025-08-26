import * as vscode from "vscode";
import { backupAll } from "../core/backupManager";

export function registerBackupCommand(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("backup.uploadGoogle", async () => {
    try { await backupAll(context); }
    catch (err) { vscode.window.showErrorMessage(`Backup failed: ${(err as Error).message}`); }
  });
  context.subscriptions.push(disposable);
}
