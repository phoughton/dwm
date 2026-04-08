# DWM: DoubleWord Monitor

An unofficial VSCode extension for monitoring batch inference jobs on [doubleword.ai](https://doubleword.ai). This extension is not affiliated with or endorsed by DoubleWord.

DWM adds a sidebar panel that displays your recent batches with status, progress, error counts, and creation times. Clicking a batch opens it in the DoubleWord web app.

## Features

- Sidebar panel showing recent batch jobs in a table with aligned columns
- Color-coded status indicators (green tick for success, yellow warning for partial errors, red for failures)
- Progress tracking showing completed/total requests and percentage
- Auto-refresh every 30 seconds (configurable)
- Manual refresh via the toolbar button
- Click any batch to open it in the DoubleWord web app

## Setup

### API Key

You need a doubleword.ai API key to use this extension. The key is stored securely using VSCode's built-in secret storage.

1. Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **DWM: Set API Key**
3. Paste your API key when prompted

The key is stored securely by VSCode and persists across sessions. You only need to do this once.

Alternatively, the extension will also read from:
- The `dwm.apiKey` setting in VSCode settings (stored in plain text - not recommended)
- The `DOUBLEWORD_API_KEY` environment variable

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `dwm.apiKey` | `""` | API key (prefer the **DWM: Set API Key** command instead) |
| `dwm.refreshInterval` | `30` | Auto-refresh interval in seconds |
| `dwm.batchLimit` | `20` | Number of recent batches to fetch (max 100) |

## Installation

### From a pre-built VSIX

```sh
code --install-extension dwm-0.0.1.vsix
```

Or in VSCode: Extensions sidebar > `...` menu > **Install from VSIX...** and select the `.vsix` file.

### Building from source

**Prerequisites:** [Node.js](https://nodejs.org/) 18+ and npm.

1. Clone the repository:
   ```sh
   git clone https://github.com/doubleword/dwm.git
   cd dwm
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Compile the TypeScript source:
   ```sh
   npm run compile
   ```

4. Package into a `.vsix` file:
   ```sh
   npx @vscode/vsce package --allow-missing-repository
   ```
   This creates `dwm-0.0.1.vsix` in the project root.

5. Install the extension:
   ```sh
   code --install-extension dwm-0.0.1.vsix
   ```

### Development

To run the extension in a development host for testing:

1. Open the project folder in VSCode
2. Press `F5` to launch an Extension Development Host window
3. The DWM sidebar will appear in the activity bar of the new window

To watch for changes and recompile automatically:
```sh
npm run watch
```

## Project structure

```
src/
  extension.ts          # Entry point — activation, commands, polling timer
  batchViewProvider.ts   # WebviewView provider rendering the HTML table
  batchService.ts       # API client for doubleword.ai
  types.ts              # TypeScript interfaces for the API response
```

## License

MIT
