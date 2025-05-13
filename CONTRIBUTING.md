## Local Development

The extension consists of the extension itself and an inner React app for the webview. They are built separately.

- run `npm run install:all` to install dependencies for the extension and for the inner react app.
- run `npm run watch:esbuild` to build the JS bundle for the extension and rebuild when source files change. This also builds the JS bundle for the webview react app. The VSCode task `watch:esbuild` does the same thing.
- In VSCode, press `F5` to launch a new vscode session with the local version of the extension. If you are developing on Windows, make sure that you have `bash.exe` (from Cygwin or other POSIX-compatible environments for Windows) on your PATH.

## Releasing a new version

Follow the instructions from the [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) docs.
Use the vsce access token shared via 1Password.
