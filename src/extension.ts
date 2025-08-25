// src/extension.ts
import * as vscode from "vscode";
import { backupAll, restoreAll } from "./backupManager";

export function activate(context: vscode.ExtensionContext) {
  // Upload / backup command
  const disposableUpload = vscode.commands.registerCommand("backup.uploadGoogle", async () => {
    try {
      await backupAll(context);
    } catch (err) {
      vscode.window.showErrorMessage(`Backup failed: ${(err as Error).message}`);
    }
  });

  // Download / restore command
  const disposableDownload = vscode.commands.registerCommand("backup.downloadGoogle", async () => {
    try {
      await restoreAll(context);
    } catch (err) {
      vscode.window.showErrorMessage(`Restore failed: ${(err as Error).message}`);
    }
  });

  context.subscriptions.push(disposableUpload, disposableDownload);

  vscode.window.showInformationMessage("VS Code Google Backup Extension Activated ✅");
}

export function deactivate() {}
