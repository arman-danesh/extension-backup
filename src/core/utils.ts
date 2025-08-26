// src/utils.ts
import * as path from "path";
import * as os from "os";

/**
 * Return absolute path to VS Code's user settings.json
 */
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
 * Return absolute path to VS Code CLI binary
 */
export function getCodeCliPath(): string {
  if (process.platform === "win32") {
    return `"${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\bin\\code.cmd"`;
  } else if (process.platform === "darwin") {
    return "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code";
  } else {
    return "code"; // Linux assumes code is in PATH
  }
}
