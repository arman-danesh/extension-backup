import * as vscode from "vscode";
import { registerBackupCommand } from "./commands/backupCommand";
import { registerRestoreCommand } from "./commands/restoreCommand";

export function activate(context: vscode.ExtensionContext) {
  registerBackupCommand(context);
  registerRestoreCommand(context);
  vscode.window.showInformationMessage("VS Code Google Backup Extension Activated ✅");
}

export function deactivate() {}
