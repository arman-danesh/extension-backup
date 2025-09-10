# VS Code Google Backup Extension

This extension allows you to back up your VS Code settings (`settings.json`) and your (`extensions.json`) to your Google Drive using your Gmail account.

## Features

- Upload `settings.json` and `extensions.json`  to Google Drive.
- Automatically creates a `VSCodeBackups` folder.
- Securely stores Google OAuth tokens.

## Requirements

- A Google account.
- Permissions to access Google Drive.

## Usage

1. Press **F5** in VS Code to launch the Extension Development Host.
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. Search for **Backup:open Backup Manager UI** and run it.
4. The first time, you will be asked to authorize with Google:
   - Open the provided URL in your browser.
   - Log in and copy the authorization code.
   - Paste the code into VS Code.
5. Your `settings.json` and `extensions.json` will be uploaded to the `VSCodeBackups` folder in Google Drive.

## Future Plan

1. add option to upload to git 
2. add option to back up as json file in you device
2. add option to send you setting and extensions to someone else useing gmail/git
 

- Initial release with Google Drive backup functionality.
