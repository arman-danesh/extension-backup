import * as vscode from "vscode";
import { backupAll, restoreAll } from "../core/backupManager";
import * as path from "path";

export function showBackupUI(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "backupUI",
    "Backup Manager",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const cssPath = vscode.Uri.file(
    path.join(context.extensionPath, "out", "ui", "style.css") // compiled location
  );
  const cssUri = panel.webview.asWebviewUri(cssPath);

  panel.webview.html = getWebviewContent(cssUri);

  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "backup":
          try {
            vscode.window.withProgress(
              { location: vscode.ProgressLocation.Notification, title: "Backing up..." },
              async () => await backupAll(context)
            );
            vscode.window.showInformationMessage("✅ Backup completed!");
          } catch (err) {
            vscode.window.showErrorMessage(`Backup failed: ${(err as Error).message}`);
          }
          break;
        case "restore":
          try {
            vscode.window.withProgress(
              { location: vscode.ProgressLocation.Notification, title: "Restoring..." },
              async () => await restoreAll(context)
            );
            vscode.window.showInformationMessage("✅ Restore completed!");
          } catch (err) {
            vscode.window.showErrorMessage(`Restore failed: ${(err as Error).message}`);
          }
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(cssUri: vscode.Uri): string {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Manager</title>
    <link href="${cssUri}" rel="stylesheet">
  </head>
  <body>
    <h1>VS Code Backup Manager</h1>
    <div class="card">
      <button id="backupBtn">💾 Backup Now</button>
      <button id="restoreBtn">🔄 Restore Now</button>
      <div class="status" id="status">Ready to backup or restore.</div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const status = document.getElementById('status');

      document.getElementById('backupBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'backup' });
        status.textContent = 'Backing up... ⏳';
      });

      document.getElementById('restoreBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'restore' });
        status.textContent = 'Restoring... ⏳';
      });
    </script>
  </body>
  </html>
  `;
}
