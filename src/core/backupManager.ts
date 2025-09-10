// src/backupManager.ts
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { getOrCreateFolder, uploadFile, downloadFile, deleteFolder } from "./googleDrive";
import { getSettingsPath, getInstalledExtensions, getCodeCliPath } from "./utils";
import archiver from "archiver";
import { execSync } from "child_process";
const BACKUP_FOLDER = "VSCodeBackups";
import { sendBackupViaGmailAPI } from "./gmailSender";

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
  try {
    // Delete existing backup folder
    const existingFolderId = await getOrCreateFolder(context, BACKUP_FOLDER, false);
    if (existingFolderId) {
      try {
        await deleteFolder(context, existingFolderId);
      } catch (err) {
        vscode.window.showWarningMessage(`Failed to delete old backup folder: ${err}`);
      }
    }

    // Create new backup folder
    const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
    if (!folderId) {
      vscode.window.showErrorMessage("Failed to create/find backup folder.");
      return;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Backing up VS Code", cancellable: false },
      async (progress) => {
        // Backup settings.json
        if (backupSettings) {
          progress.report({ message: "Backing up settings..." });
          for (const target of getBackupTargets()) {
            try {
              await uploadFile(context, folderId, target.path, target.fileName);
            } catch (err) {
              vscode.window.showWarningMessage(`Failed to back up ${target.fileName}: ${err}`);
            }
          }
        }

        // Backup extensions
        progress.report({ message: "Backing up extensions..." });

        // Use cross-platform API instead of CLI
        let installed = getInstalledExtensions();

        // Filter by selectedExtensions if provided, else backup all
        const toBackup = selectedExtensions.length > 0
          ? installed.filter(ext => selectedExtensions.includes(ext))
          : installed;

        const tempPath = path.join(require("os").tmpdir(), "extensions-list.json");
        try {
          fs.writeFileSync(tempPath, JSON.stringify(toBackup, null, 2), "utf8");
          await uploadFile(context, folderId, tempPath, "extensions-list.json");
        } catch (err) {
          vscode.window.showWarningMessage(`Failed to back up extensions list: ${err}`);
        }

        vscode.window.showInformationMessage("Backup completed ✅");
      }
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Backup failed: ${err}`);
  }
}
export async function backupToZip(folderName: string = "VSCodeBackup"): Promise<string> {
  const tempDir = path.join(os.tmpdir(), folderName);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  // Copy settings.json
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) {
    fs.copyFileSync(settingsPath, path.join(tempDir, "settings.json"));
  }

  // Save extensions list
  const installedExtensions = getInstalledExtensions();
  fs.writeFileSync(path.join(tempDir, "extensions-list.json"), JSON.stringify(installedExtensions, null, 2), "utf8");

  // Create ZIP
  const zipPath = path.join(os.tmpdir(), `${folderName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise<string>((resolve, reject) => {
    output.on("close", () => resolve(zipPath));
    archive.on("error", (err:string) => reject(err));

    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();
  });
}

export async function sendBackupByEmail(context: vscode.ExtensionContext, recipientEmail: string) {
  try {
    const zipPath = await backupToZip();  // Your existing ZIP function
    await sendBackupViaGmailAPI(context, recipientEmail, zipPath);
  } catch (err) {
    vscode.window.showErrorMessage(`Failed to send backup: ${(err as Error).message}`);
  }
}



export async function restoreAll(context: vscode.ExtensionContext) {
  try {
    const folderId = await getOrCreateFolder(context, BACKUP_FOLDER);
    if (!folderId) {
      vscode.window.showErrorMessage("No backup folder found on Google Drive.");
      return;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Restoring VS Code Backup", cancellable: false },
      async (progress) => {
        // Restore settings
        progress.report({ message: "Restoring settings..." });
        for (const target of getBackupTargets()) {
          try {
            await downloadFile(context, folderId, target.fileName, target.path);
          } catch (err) {
            vscode.window.showWarningMessage(`Failed to restore ${target.fileName}: ${err}`);
          }
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

        let extensions: string[] = [];
        try {
          extensions = JSON.parse(fs.readFileSync(tempPath, "utf8"));
        } catch (err) {
          vscode.window.showErrorMessage(`Failed to parse extensions list: ${err}`);
          return;
        }

        if (extensions.length === 0) {
          vscode.window.showInformationMessage("No extensions to restore.");
          return;
        }

        // Use VS Code API to detect installed extensions
        const installed = getInstalledExtensions();
        const toInstall = extensions.filter(ext => !installed.includes(ext));

        if (toInstall.length === 0) {
          vscode.window.showInformationMessage("All extensions already installed ✅");
          return;
        }

        const failed: string[] = [];
        for (let i = 0; i < toInstall.length; i++) {
          const ext = toInstall[i];
          progress.report({ message: `Installing extension (${i + 1}/${toInstall.length}): ${ext}` });
          try {
            execSync(`${getCodeCliPath()} --install-extension ${ext}`, { stdio: "inherit" });
          } catch (err) {
            failed.push(ext);
            vscode.window.showWarningMessage(`Failed to install extension ${ext}: ${err}`);
          }
        }

        if (failed.length > 0) {
          vscode.window.showWarningMessage(`Some extensions failed to install: ${failed.join(", ")}`);
        } else {
          vscode.window.showInformationMessage("Extensions restored ✅");
        }
      }
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Restore failed: ${err}`);
  }
}
