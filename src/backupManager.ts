// src/backupManager.ts
import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import { getOrCreateFolder, uploadFile, downloadFile } from "./googleDrive";

const BACKUP_FOLDER = "VSCodeBackups";

/** Paths we want to back up */
function getBackupTargets() {
  const home = os.homedir();
  return [
    {
      fileName: "settings.json",
      path: process.platform === "win32"
        ? path.join(process.env.APPDATA || "", "Code", "User", "settings.json")
        : process.platform === "darwin"
        ? path.join(home, "Library", "Application Support", "Code", "User", "settings.json")
        : path.join(home, ".config", "Code", "User", "settings.json"),
    },
    // 🔮 In the future add keybindings.json, snippets folder, etc.
  ];
}

export async function backupAll(context: vscode.ExtensionContext) {
  const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
  if (!folderId) {
    vscode.window.showErrorMessage("Failed to create/find backup folder.");
    return;
  }

  for (const target of getBackupTargets()) {
    await uploadFile(context, folderId, target.path, target.fileName);
  }

  vscode.window.showInformationMessage("Backup completed ✅");
}

export async function restoreAll(context: vscode.ExtensionContext) {
  const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
  if (!folderId) {
    vscode.window.showErrorMessage("No backup folder found on Google Drive.");
    return;
  }

  for (const target of getBackupTargets()) {
    await downloadFile(context, folderId, target.fileName, target.path);
  }
}
