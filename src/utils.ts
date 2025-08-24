import * as path from "path";
import * as os from "os";

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
