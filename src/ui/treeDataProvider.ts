import * as vscode from "vscode";

export class BackupTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> = this._onDidChangeTreeData.event;

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): vscode.TreeItem[] {
    const commands = [
      { label: "Upload Settings", command: "vscodeBackup.uploadSettings" },
      { label: "Upload Extensions", command: "vscodeBackup.uploadExtensions" },
      { label: "Download Settings", command: "vscodeBackup.downloadSettings" },
      { label: "Download Extensions", command: "vscodeBackup.downloadExtensions" },
    ];

    return commands.map(cmd => {
      const item = new vscode.TreeItem(cmd.label, vscode.TreeItemCollapsibleState.None);
      item.command = { command: cmd.command, title: cmd.label };
      return item;
    });
  }
}
