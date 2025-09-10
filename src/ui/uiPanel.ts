import * as vscode from "vscode";
import * as path from "path";
import { backupAll, restoreAll, sendBackupByEmail } from "../core/backupManager";

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
  
  const extensions = vscode.extensions.all
    .filter(ext => !ext.packageJSON.isBuiltin)
    .map(ext => ({
      id: ext.id,
      name: ext.packageJSON.displayName || ext.id
    }));

  panel.webview.html = getWebviewContent(cssUri, extensions);

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === "backup") {
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "Backing up..." },
        async () => await backupAll(context, message.backupSettings, message.extensions)
      );
    }

    if (message.command === "restore") {
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: "Restoring..." },
        async () => await restoreAll(context)
      );
    }

    if (message.command === "gmailBackup") {
      await sendBackupByEmail(context, message.email);
    } 

  });
}

function getWebviewContent(cssUri: vscode.Uri, extensions: {id:string,name:string}[]): string {
  const extensionCheckboxes = extensions.map(ext =>
    `<label><input type="checkbox" class="ext-checkbox" value="${ext.id}"> ${ext.name}</label><br>`
  ).join("\n");

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Manager</title>
    <link href="${cssUri}" rel="stylesheet">
    <style>
      .tabs { display:flex; cursor:pointer; margin-bottom:10px; }
      .tab { flex:1; padding:10px; text-align:center; background:#333; color:#ccc; border-radius:5px 5px 0 0; margin-right:2px; }
      .tab.active { background:#0e639c; color:white; }
      .tabContent { display:none; background:#252526; padding:10px; border-radius:0 0 8px 8px; }
      .tabContent.active { display:block; }
    </style>
  </head>
  <body>
    <h1>VS Code Backup Manager</h1>

    <div class="tabs">
      <div class="tab active" data-tab="driveTab">Google Drive</div>
      <div class="tab" data-tab="gmailTab">Gmail Export</div>
    </div>

    <div id="driveTab" class="tabContent active">
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

          <button id="startBackupBtn" style="margin-top:10px;">Start Backup</button>
        </div>
      </div>
    </div>

    <div id="gmailTab" class="tabContent">
      <div class="card">
        <h3>Export Backup via Gmail</h3>
        <label for="emailInput">Recipient Email:</label>
        <input type="email" id="emailInput" placeholder="example@gmail.com" style="width:100%; padding:5px; margin-top:5px; margin-bottom:10px;">
        <button id="startGmailBackup" style="background-color:green; color:white;">Backup & Send</button>
        <div class="status" id="gmailStatus">Ready to backup and send.</div>
      </div>
    </div>

    <script>
      (function(){
        const vscode = acquireVsCodeApi();

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tabContent').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
          });
        });

        // Google Drive backup
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
          const selectedExtensions = Array.from(document.querySelectorAll('.ext-checkbox:checked')).map(cb => cb.value);
          vscode.postMessage({ command:'backup', backupSettings, extensions: selectedExtensions });
          status.textContent = 'Backing up... ⏳';
        });

        document.getElementById('selectAllExt').addEventListener('click', () => {
          document.querySelectorAll('.ext-checkbox').forEach(cb => cb.checked=true);
        });

        document.getElementById('deselectAllExt').addEventListener('click', () => {
          document.querySelectorAll('.ext-checkbox').forEach(cb => cb.checked=false);
        });

        // Gmail
        document.getElementById('startGmailBackup').addEventListener('click', () => {
          const email = document.getElementById('emailInput').value;
          const gmailStatus = document.getElementById('gmailStatus');
          if (!email || !email.includes('@')) {
            gmailStatus.textContent = 'Please enter a valid email.';
            return;
          }
          vscode.postMessage({ command: 'gmailBackup', email });
          gmailStatus.textContent = 'Backing up and preparing email... ⏳';
        });
      })();
    </script>
  </body>
  </html>
  `;
}
