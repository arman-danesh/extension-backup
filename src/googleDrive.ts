import { google } from "googleapis";
import * as fs from "fs";
import * as vscode from "vscode";
import { getOAuthClient } from "./googleAuth";

export async function uploadBackup(context: vscode.ExtensionContext, filePath: string) {
  const auth = await getOAuthClient(context);
  const drive = google.drive({ version: "v3", auth });

  const folderName = "VSCodeBackups";
  let folderId: string | undefined;

  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: "files(id, name)",
  });

  if (res.data.files && res.data.files.length > 0) {
    folderId = res.data.files[0].id ?? undefined;
  } else {
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    folderId = folder.data.id ?? undefined;
  }

  if (!folderId) {
    vscode.window.showErrorMessage("Failed to get or create backup folder on Google Drive.");
    return;
  }

  const fileMetadata = {
    name: "settings.json",
    parents: [folderId],
  };

  const media = {
    mimeType: "application/json",
    body: fs.createReadStream(filePath),
  };

  await drive.files.create({
    requestBody: fileMetadata as any, // cast to any to bypass strict types
    media,
    fields: "id",
  });

  vscode.window.showInformationMessage("Backup uploaded to Google Drive ✅");
}
