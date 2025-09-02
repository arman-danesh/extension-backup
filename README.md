![Extension Backup Banner](https://socialify.git.ci/arman-danesh/extension-backup/image?custom_language=VSCode&description=1&font=Jost&forks=1&issues=1&language=1&logo=https%3A%2F%2Fwww.svgrepo.com%2Fshow%2F374146%2Ftypescript-official.svg&name=1&owner=1&pattern=Solid&pulls=1&stargazers=1&theme=Dark)

# VS Code Google Backup Extension

[![License](https://img.shields.io/github/license/arman-danesh/extension-backup)](LICENSE)
[![Issues](https://img.shields.io/github/issues/arman-danesh/extension-backup)](https://github.com/arman-danesh/extension-backup/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/arman-danesh/extension-backup)](https://github.com/arman-danesh/extension-backup/pulls)
[![Stars](https://img.shields.io/github/stars/arman-danesh/extension-backup)](https://github.com/arman-danesh/extension-backup/stargazers)

---

This **VS Code Extension** allows you to back up your VS Code settings (`settings.json`) directly to your **Google Drive** using your Gmail account.

## ✨ Features

- 🔼 Upload `settings.json` to Google Drive.  
- 📂 Automatically creates a `VSCodeBackups` folder.  
- 🔐 Securely stores Google OAuth tokens.  

## 📋 Requirements

- ✅ A Google account.  
- ✅ Permissions to access Google Drive.  

## 🚀 Usage

1. Press **F5** in VS Code to launch the Extension Development Host.  
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).  
3. Search for **Backup: Upload Google** and run it.  
4. On first use, you’ll need to authorize with Google:
   - Open the provided URL in your browser.  
   - Log in and copy the authorization code.  
   - Paste the code into VS Code.  
5. Your `settings.json` will be uploaded to the `VSCodeBackups` folder in Google Drive.  

## ⚙️ Extension Settings

Currently, there are no settings.  
👉 Future versions may include **restore** and **automatic backup** options.  

## 🐞 Known Issues

- Supports only the default `settings.json` location.  
- Requires an internet connection to upload backups.  

## 📝 Release Notes

### 0.0.1
- Initial release with Google Drive backup functionality.
