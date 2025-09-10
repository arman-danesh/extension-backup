import * as dotenv from 'dotenv';
import * as vscode from "vscode";
import { registerBackupCommand } from "./commands/backupCommand";
import { registerRestoreCommand } from "./commands/restoreCommand";
import { showBackupUI } from "./ui/uiPanel"; // import the UI panel

export function activate(context: vscode.ExtensionContext) {
  // Register existing commands
  registerBackupCommand(context);
  registerRestoreCommand(context);

  // Register a new command to show the UI
  const disposableUI = vscode.commands.registerCommand("backup.showUI", () => {
    showBackupUI(context);
  });
  context.subscriptions.push(disposableUI);

  vscode.window.showInformationMessage("VS Code Google Backup Extension Activated ✅");
}

dotenv.config();
export function deactivate() {}
