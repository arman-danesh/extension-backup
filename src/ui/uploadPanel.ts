import * as vscode from "vscode";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { getCodeCliPath } from "@/core/utils";
import { uploadFile, getOrCreateFolder } from "../core/googleDrive";

export async function showExtensionUploadPanel(context: vscode.ExtensionContext) {
  const codeCmd = getCodeCliPath();
  const extensions = execSync(`${codeCmd} --list-extensions`, { encoding: "utf8" })
    .split("\n")
    .map(e => e.trim())
    .filter(Boolean);

  const selected = await vscode.window.showQuickPick(extensions, { canPickMany: true, placeHolder: "Select extensions to upload" });
  if (!selected?.length) return;

  const folderId = await getOrCreateFolder(context, "VSCodeBackups");
  const tempPath = path.join(require("os").tmpdir(), "extensions-selected.json");
  fs.writeFileSync(tempPath, JSON.stringify(selected, null, 2), "utf8");

  await uploadFile(context, folderId!, tempPath, "extensions-selected.json");
  vscode.window.showInformationMessage("Selected extensions uploaded ✅");
}
