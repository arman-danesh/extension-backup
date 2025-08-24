// src/extension.ts
import * as vscode from "vscode";
import { uploadBackup } from "./googleDrive";
import * as path from "path";
import * as os from "os";

/**
 * Returns the path to VS Code's settings.json file based on OS.
 */
function getSettingsPath(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || "", "Code", "User", "settings.json");
    case "darwin":
      return path.join(home, "Library", "Application Support", "Code", "User", "settings.json");
    default:
      return path.join(home, ".config", "Code", "User", "settings.json");
  }
}

export function activate(context: vscode.ExtensionContext) {
  // Register the command
  const disposable = vscode.commands.registerCommand("backup.uploadGoogle", async () => {
    try {
      const settingsPath = getSettingsPath();
      await uploadBackup(context, settingsPath);
    } catch (err) {
      vscode.window.showErrorMessage(`Backup failed: ${(err as Error).message}`);
    }
  });

  context.subscriptions.push(disposable);

  // Optional: show info message when extension is activated
  vscode.window.showInformationMessage("VS Code Google Backup Extension Activated ✅");
}

export function deactivate() {}
