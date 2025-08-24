# VS Code Google Backup Extension

This extension allows you to back up your VS Code settings (`settings.json`) to your Google Drive using your Gmail account.

## Features

- Upload `settings.json` to Google Drive.
- Automatically creates a `VSCodeBackups` folder.
- Securely stores Google OAuth tokens.

## Requirements

- A Google account.
- Permissions to access Google Drive.

## Usage

1. Press **F5** in VS Code to launch the Extension Development Host.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Search for **Backup: Upload Google** and run it.
4. The first time, you will be asked to authorize with Google:
   - Open the provided URL in your browser.
   - Log in and copy the authorization code.
   - Paste the code into VS Code.
5. Your `settings.json` will be uploaded to the `VSCodeBackups` folder in Google Drive.

## Extension Settings

No settings yet, but future versions may include restore and automatic backup options.

## Known Issues

- Only supports the default `settings.json` location.
- Requires internet connection to upload backups.

## Release Notes

### 0.0.1

- Initial release with Google Drive backup functionality.
