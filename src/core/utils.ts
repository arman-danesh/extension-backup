// src/utils.ts
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";

/** Return path to VS Code's user settings.json */
export function getSettingsPath(): string {
  const home = os.homedir();
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA || "", "Code", "User", "settings.json");
    case "darwin":
      return path.join(home, "Library", "Application Support", "Code", "User", "settings.json");
    default:
      return path.join(home, ".config", "Code", "User", "settings.json");
  }
}

/**
 * Return VS Code CLI path (best-effort).
 * Still kept for backward compatibility, but extensions backup no longer relies on it.
 */
export function getCodeCliPath(): string {
  if (process.platform === "win32") {
    const userPath = path.join(process.env.LOCALAPPDATA || "", "Programs", "Microsoft VS Code", "bin", "code.cmd");
    const systemPath = path.join(process.env.ProgramFiles || "C:\\Program Files", "Microsoft VS Code", "bin", "code.cmd");
    if (require("fs").existsSync(userPath)) return `"${userPath}"`;
    if (require("fs").existsSync(systemPath)) return `"${systemPath}"`;
    return "code";
  }

  if (process.platform === "darwin") {
    const appPath = "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code";
    const brewPath = "/usr/local/bin/code";
    if (require("fs").existsSync(appPath)) return appPath;
    if (require("fs").existsSync(brewPath)) return brewPath;
    return "code";
  }

  // Linux
  const binPath = "/usr/bin/code";
  const snapPath = "/snap/bin/code";
  if (require("fs").existsSync(binPath)) return binPath;
  if (require("fs").existsSync(snapPath)) return snapPath;

  // Flatpak fallback
  return "flatpak run com.visualstudio.code";
}

/**
 * Get the list of installed extensions via VS Code API.
 * This is OS-independent and more reliable than `code --list-extensions`.
 */
export function getInstalledExtensions(): string[] {
  return vscode.extensions.all
    .filter(ext => !ext.packageJSON.isBuiltin) // skip built-ins
    .map(ext => ext.id); // e.g., "ms-python.python"
}
