import * as vscode from "vscode";
import * as path from "path";
import { backupAll, restoreAll } from "../core/backupManager";

export function showBackupUI(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    "backupUI",
    "Backup Manager",
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const cssUri = panel.webview.asWebviewUri(
    vscode.Uri.file(path.join(context.extensionPath, "out", "ui", "style.css"))
  );

  // Get list of installed extensions (exclude built-in)
  const extensions = vscode.extensions.all
    .filter(ext => !ext.packageJSON.isBuiltin)
    .map(ext => ({
      id: ext.id, // Use this as value for CLI
      name: ext.packageJSON.displayName || ext.id
    }));

  panel.webview.html = getWebviewContent(cssUri, extensions);

  // Listen for messages from Webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      if (message.command === "backup") {
        try {
          vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: "Backing up..." },
            async () => {
              await backupAll(context, message.backupSettings, message.extensions);
            }
          );
          vscode.window.showInformationMessage("✅ Backup completed!");
        } catch (err) {
          vscode.window.showErrorMessage(`Backup failed: ${(err as Error).message}`);
        }
      }

      if (message.command === "restore") {
        try {
          vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: "Restoring..." },
            async () => await restoreAll(context)
          );
          vscode.window.showInformationMessage("✅ Restore completed!");
        } catch (err) {
          vscode.window.showErrorMessage(`Restore failed: ${(err as Error).message}`);
        }
      }
    },
    undefined,
    context.subscriptions
  );
}

function getWebviewContent(cssUri: vscode.Uri, extensions: {id: string, name: string}[]): string {
  const extensionCheckboxes = extensions
    .map(ext => `<label><input type="checkbox" class="ext-checkbox" value="${ext.id}"> ${ext.name}</label><br>`)
    .join("\n");

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

      <div id="backupOptions" style="display:none; margin-top:20px;">
        <h3>Select Backup Options:</h3>
        <label>
          <input type="checkbox" id="backupSettings" checked>
          Backup VS Code Settings
        </label>

        <h4>Extensions:</h4>
        <button id="selectAllExt">Select All</button>
        <button id="deselectAllExt">Deselect All</button>

        <div id="extensionList" style="max-height:200px; overflow-y:auto; border:1px solid #333; padding:5px;">
          ${extensionCheckboxes}
        </div>

        <button id="startBackupBtn" style="margin-top:10px;">
          Start Backup
        </button>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const status = document.getElementById('status');
      const backupOptions = document.getElementById('backupOptions');

      document.getElementById('backupBtn').addEventListener('click', () => {
        backupOptions.style.display = 'block';
        status.textContent = 'Select backup options...';
      });

      document.getElementById('restoreBtn').addEventListener('click', () => {
        vscode.postMessage({ command: 'restore' });
        status.textContent = 'Restoring... ⏳';
      });

        document.getElementById('startBackupBtn').addEventListener('click', () => {
        const backupSettings = document.getElementById('backupSettings').checked;
        const selectedExtensions = Array.from(document.querySelectorAll('.ext-checkbox:checked'))
            .map(cb => cb.value); // this now correctly contains the extension IDs
        vscode.postMessage({
            command: 'backup',
            backupSettings,
            extensions: selectedExtensions
        });
        status.textContent = 'Backing up... ⏳';
        });


      document.getElementById('selectAllExt').addEventListener('click', () => {
        document.querySelectorAll('.ext-checkbox').forEach(cb => cb.checked = true);
      });

      document.getElementById('deselectAllExt').addEventListener('click', () => {
        document.querySelectorAll('.ext-checkbox').forEach(cb => cb.checked = false);
      });
    </script>
  </body>
  </html>
  `;
}
