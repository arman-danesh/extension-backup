// src/googleDrive.ts
import { google } from "googleapis";
import * as fs from "fs";
import * as vscode from "vscode";
import { getOAuthClient } from "./googleAuth";

export async function getOrCreateFolder(context: vscode.ExtensionContext, folderName: string): Promise<string | undefined> {
  const auth = await getOAuthClient(context);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: "files(id, name)",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id ?? undefined;
  } else {
    const folder = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id",
    });
    return folder.data.id ?? undefined;
  }
}

export async function uploadFile(
  context: vscode.ExtensionContext,
  folderId: string,
  localPath: string,
  fileName: string
) {
  const auth = await getOAuthClient(context);
  const drive = google.drive({ version: "v3", auth });

  const fileMetadata = { name: fileName, parents: [folderId] };
  const media = { mimeType: "application/json", body: fs.createReadStream(localPath) };

  await drive.files.create({ requestBody: fileMetadata as any, media, fields: "id" });
}

export async function downloadFile(
  context: vscode.ExtensionContext,
  folderId: string,
  fileName: string,
  savePath: string
) {
  const auth = await getOAuthClient(context);
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
    fields: "files(id, name)",
  });

  if (!res.data.files || res.data.files.length === 0) {
    vscode.window.showErrorMessage(`File ${fileName} not found in Google Drive.`);
    return;
  }

  const fileId = res.data.files[0].id!;
  const dest = fs.createWriteStream(savePath);

  await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" },
    (err, response) => {
      if (err) throw err;
      (response!.data as any)
        .on("end", () => vscode.window.showInformationMessage(`${fileName} restored ✅`))
        .on("error", (err: any) => vscode.window.showErrorMessage("Download failed: " + err.message))
        .pipe(dest);
    }
  );
}
