import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getOrCreateFolder, downloadFile } from "../core/googleDrive";
import { getCodeCliPath } from "@/core/utils";
import { execSync } from "child_process";

export async function showExtensionDownloadPanel(context: vscode.ExtensionContext) {
  const folderId = await getOrCreateFolder(context, "VSCodeBackups");
  const tempPath = path.join(require("os").tmpdir(), "extensions-selected.json");

  try {
    await downloadFile(context, folderId!, "extensions-selected.json", tempPath);
  } catch {
    vscode.window.showWarningMessage("No extension backup found.");
    return;
  }

  if (!fs.existsSync(tempPath)) return vscode.window.showWarningMessage("Extensions list missing.");

  const extensions: string[] = JSON.parse(fs.readFileSync(tempPath, "utf8"));
  const selected = await vscode.window.showQuickPick(extensions, { canPickMany: true, placeHolder: "Select extensions to restore" });
  if (!selected?.length) return;

  const codeCmd = getCodeCliPath();
  for (const ext of selected) {
    try {
      execSync(`${codeCmd} --install-extension ${ext}`, { stdio: "inherit" });
    } catch {
      vscode.window.showWarningMessage(`Failed to install ${ext}`);
    }
  }

  vscode.window.showInformationMessage("Selected extensions restored ✅");
}
