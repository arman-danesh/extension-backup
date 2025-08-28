import * as vscode from "vscode";

class BackupTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const items = [
      { label: "Upload Settings", command: "vscodeBackup.uploadSettings" },
      { label: "Upload Extensions", command: "vscodeBackup.uploadExtensions" },
      { label: "Download Settings", command: "vscodeBackup.downloadSettings" },
      { label: "Download Extensions", command: "vscodeBackup.downloadExtensions" }
    ];

    return items.map(i => {
      const item = new vscode.TreeItem(i.label);
      item.command = { command: i.command, title: i.label };
      return item;
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  // TreeDataProvider must be registered immediately
  const treeProvider = new BackupTreeDataProvider();
  vscode.window.registerTreeDataProvider("backupView", treeProvider);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeBackup.uploadSettings", () => vscode.window.showInformationMessage("Upload Settings clicked")),
    vscode.commands.registerCommand("vscodeBackup.uploadExtensions", () => vscode.window.showInformationMessage("Upload Extensions clicked")),
    vscode.commands.registerCommand("vscodeBackup.downloadSettings", () => vscode.window.showInformationMessage("Download Settings clicked")),
    vscode.commands.registerCommand("vscodeBackup.downloadExtensions", () => vscode.window.showInformationMessage("Download Extensions clicked"))
  );
}
