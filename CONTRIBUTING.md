## Local Development

The extension consists of the extension itself and an inner React app for the webview. They are built separately.

- run `npm run install:all` to install dependencies for the extension and for the inner react app.
- run `npm run build:webview` to build the JS bundle for the webview react app. If actively developing the react app, you can also run `build:webview:watch` to rebuild when any source files change.
- run `npm run esbuild-watch` to build the JS bundle for the extension and rebuild when source files change. The VSCode task `watch-build` does the same thing.
- In VSCode, press `F5` to launch a new vscode session with the local version of the extension.

## Releasing a new version

Follow the instructions from the [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) docs.
Use the vsce access token shared via 1Password.
