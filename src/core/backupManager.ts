// src/backupManager.ts
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import { getOrCreateFolder, uploadFile, downloadFile, deleteFolder } from "./googleDrive";
import { getSettingsPath, getCodeCliPath } from "./utils";

const BACKUP_FOLDER = "VSCodeBackups";

function getBackupTargets() {
  return [
    {
      fileName: "settings.json",
      path: getSettingsPath(),
    },
  ];
}

export async function backupAll(
  context: vscode.ExtensionContext,
  backupSettings: boolean = true,
  selectedExtensions: string[] = []
) {
  // Check for existing backup folder
  const existingFolderId = await getOrCreateFolder(context, BACKUP_FOLDER, false);
  if (existingFolderId) {
    await deleteFolder(context, existingFolderId); // ✅ Pass both context and folderId
  }

  // Create a new backup folder
  const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
  if (!folderId) {
    vscode.window.showErrorMessage("Failed to create/find backup folder.");
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Backing up VS Code",
      cancellable: false,
    },
    async (progress) => {
      // Backup settings.json if selected
      if (backupSettings) {
        progress.report({ message: "Backing up settings..." });
        for (const target of getBackupTargets()) {
          await uploadFile(context, folderId, target.path, target.fileName);
        }
      }

      // Backup selected extensions
      if (selectedExtensions.length > 0) {
        progress.report({ message: "Backing up selected extensions..." });

        const codeCmd = getCodeCliPath();
        let installed: string[] = [];
        try {
          installed = execSync(`${codeCmd} --list-extensions`, { encoding: "utf8" })
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
        } catch {
          installed = [];
        }

        const toBackup = installed.filter((ext) => selectedExtensions.includes(ext));
        const tempPath = path.join(require("os").tmpdir(), "extensions-list.json");
        fs.writeFileSync(tempPath, JSON.stringify(toBackup, null, 2), "utf8");

        await uploadFile(context, folderId, tempPath, "extensions-list.json");
      }

      vscode.window.showInformationMessage("Backup completed ✅");
    }
  );
}

export async function restoreAll(context: vscode.ExtensionContext) {
  const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
  if (!folderId) {
    vscode.window.showErrorMessage("No backup folder found on Google Drive.");
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Restoring VS Code Backup",
      cancellable: false,
    },
    async (progress) => {
      // Restore settings
      progress.report({ message: "Restoring settings..." });
      for (const target of getBackupTargets()) {
        await downloadFile(context, folderId, target.fileName, target.path);
      }

      // Restore extensions
      progress.report({ message: "Downloading extensions list..." });
      const tempPath = path.join(require("os").tmpdir(), "extensions-list.json");
      try {
        await downloadFile(context, folderId, "extensions-list.json", tempPath);
      } catch {
        vscode.window.showWarningMessage("Extensions list not found; skipping restore.");
        return;
      }

      if (!fs.existsSync(tempPath)) {
        vscode.window.showWarningMessage("Extensions list file missing; skipping restore.");
        return;
      }

      const extensions: string[] = JSON.parse(fs.readFileSync(tempPath, "utf8"));
      if (extensions.length === 0) {
        vscode.window.showInformationMessage("No extensions to restore.");
        return;
      }

      const codeCmd = getCodeCliPath();
      progress.report({ message: "Checking currently installed extensions..." });

      let installed: string[] = [];
      try {
        installed = execSync(`${codeCmd} --list-extensions`, { encoding: "utf8" })
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
      } catch {
        installed = [];
      }

      const toInstall = extensions.filter((ext) => !installed.includes(ext));
      if (toInstall.length === 0) {
        vscode.window.showInformationMessage("All extensions already installed ✅");
        return;
      }

      const failed: string[] = [];
      for (let i = 0; i < toInstall.length; i++) {
        const ext = toInstall[i];
        progress.report({ message: `Installing extension (${i + 1}/${toInstall.length}): ${ext}` });
        try {
          execSync(`${codeCmd} --install-extension ${ext}`, { stdio: "inherit" });
        } catch {
          failed.push(ext);
        }
      }

      if (failed.length > 0) {
        vscode.window.showWarningMessage(`Some extensions failed to install: ${failed.join(", ")}`);
      } else {
        vscode.window.showInformationMessage("Extensions restored ✅");
      }
    }
  );
}
