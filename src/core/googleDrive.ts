// src/googleDrive.ts
import { google } from "googleapis";
import * as fs from "fs";
import * as vscode from "vscode";
import { getOAuthClient } from "./googleAuth";

/**
 * Handles invalid_grant errors by clearing stored token and retrying once.
 */
async function withAuthRetry<T>(
  context: vscode.ExtensionContext,
  operation: (auth: any) => Promise<T>
): Promise<T> {
  try {
    const auth = await getOAuthClient(context);
    return await operation(auth);
  } catch (err: any) {
    if (err.message?.includes("invalid_grant")) {
      await context.secrets.delete("googleToken");
      vscode.window.showWarningMessage(
        "Google authentication expired. Please sign in again."
      );
      const auth = await getOAuthClient(context);
      return await operation(auth);
    }
    throw err;
  }
}

/**
 * Get an existing folder or optionally create it
 * @param createIfMissing default true. If false, only searches and returns folder id
 */
export async function getOrCreateFolder(
  context: vscode.ExtensionContext,
  folderName: string,
  createIfMissing: boolean = true
): Promise<string | undefined> {
  return await withAuthRetry(context, async (auth) => {
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: "files(id, name)",
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id ?? undefined;
    } else if (createIfMissing) {
      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });
      return folder.data.id ?? undefined;
    } else {
      return undefined; // Folder not found and createIfMissing is false
    }
  });
}

/**
 * Deletes a folder by its Google Drive ID
 */
export async function deleteFolder(
  context: vscode.ExtensionContext,
  folderId: string
) {
  return await withAuthRetry(context, async (auth) => {
    const drive = google.drive({ version: "v3", auth });

    try {
      await drive.files.delete({ fileId: folderId });
      console.log(`Deleted folder with ID ${folderId}`);
    } catch (err) {
      vscode.window.showErrorMessage(
        "Failed to delete previous backup folder: " + (err as Error).message
      );
    }
  });
}

export async function uploadFile(
  context: vscode.ExtensionContext,
  folderId: string,
  localPath: string,
  fileName: string
) {
  return await withAuthRetry(context, async (auth) => {
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = { name: fileName, parents: [folderId] };
    const media = {
      mimeType: "application/json",
      body: fs.createReadStream(localPath),
    };

    await drive.files.create({
      requestBody: fileMetadata as any,
      media,
      fields: "id",
    });
  });
}

export async function downloadFile(
  context: vscode.ExtensionContext,
  folderId: string,
  fileName: string,
  savePath: string
) {
  return await withAuthRetry(context, async (auth) => {
    const drive = google.drive({ version: "v3", auth });

    const res = await drive.files.list({
      q: `'${folderId}' in parents and name='${fileName}' and trashed=false`,
      fields: "files(id, name)",
    });

    if (!res.data.files || res.data.files.length === 0) {
      vscode.window.showErrorMessage(
        `File ${fileName} not found in Google Drive.`
      );
      return;
    }

    const fileId = res.data.files[0].id!;
    const dest = fs.createWriteStream(savePath);

    await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" },
      (err, response) => {
        if (err) throw err;
        (response!.data as any)
          .on("end", () =>
            vscode.window.showInformationMessage(`${fileName} restored ✅`)
          )
          .on("error", (err: any) =>
            vscode.window.showErrorMessage("Download failed: " + err.message)
          )
          .pipe(dest);
      }
    );
  });
}

/**
 * Command for manual re-authentication
 */
export async function reauthenticate(context: vscode.ExtensionContext) {
  await context.secrets.delete("googleToken");
  vscode.window.showInformationMessage("Please re-authenticate with Google.");
  await getOAuthClient(context);
}
