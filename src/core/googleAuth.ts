// src/googleAuth.ts
import * as vscode from "vscode";
import { google } from "googleapis";
import * as http from "http";
import * as url from "url";
import destroyer from "server-destroy"; // CommonJS import, patched below
import config from "../../config.json";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",   // Existing Drive access
  "https://www.googleapis.com/auth/gmail.send"    // New Gmail send access
];

// Replace with your OAuth credentials from Google Cloud Console
const CLIENT_ID = config.CLIENT_ID;
const CLIENT_SECRET = config.CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:1250"; // Desktop app flow

export async function getOAuthClient(context: vscode.ExtensionContext) {
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Check if we already have a stored token
  const token = await context.secrets.get("googleToken");
  if (token) {
    const stored = JSON.parse(token);

    // If stored token does NOT include Gmail send scope, force re-auth
    const scopesInToken = stored.scope || stored.scopes || [];
    if (!scopesInToken.includes("https://www.googleapis.com/auth/gmail.send")) {
      await context.secrets.delete("googleToken"); // delete old token
    } else {
      oAuth2Client.setCredentials(stored);
      return oAuth2Client;
    }
  }

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  vscode.window.showInformationMessage(
    "Please authorize the extension with Google Drive in your browser."
  );
  vscode.env.openExternal(vscode.Uri.parse(authUrl));

  // Create local server to receive auth code
  const server = http.createServer(async (req, res) => {
    if (!req.url){return;}

    const qs = new url.URL(req.url, "http://localhost:1250").searchParams;
    const code = qs.get("code");

    if (code) {
      res.end(
        "Authentication successful! You can close this window and return to VS Code."
      );
      (server as any).destroy();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Store tokens securely
        await context.secrets.store("googleToken", JSON.stringify(tokens));

        vscode.window.showInformationMessage(
          "Google authentication successful ✅"
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          "Failed to get access token: " + (err as Error).message
        );
      }
    } else {
      res.end("No code received.");
    }
  });

  server.listen(1250);
  (destroyer as any)(server); // Patch server to have destroy()

  return oAuth2Client;
}
