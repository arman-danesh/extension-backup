import * as vscode from "vscode";
import { google } from "googleapis";
import * as fs from "fs";
import { getOAuthClient } from "./googleAuth";

export async function sendBackupViaGmailAPI(
  context: vscode.ExtensionContext,
  recipientEmail: string,
  zipPath: string
) {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Backup ZIP file not found: ${zipPath}`);
  }

  const auth = await getOAuthClient(context);
  const gmail = google.gmail({ version: "v1", auth });

  // Read ZIP file and convert to base64
  const fileData = fs.readFileSync(zipPath).toString("base64");

  const rawMessage = [
    `To: ${recipientEmail}`,
    `Subject: VS Code Backup`,
    `Content-Type: application/zip; name="backup.zip"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="backup.zip"`,
    ``,
    fileData
  ].join("\n");

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage
    }
  });

  vscode.window.showInformationMessage(`Backup sent to ${recipientEmail} ✅`);
}
