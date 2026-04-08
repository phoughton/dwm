import * as vscode from 'vscode';
import { BatchService } from './batchService';
import { BatchViewProvider } from './batchViewProvider';

const SECRET_KEY = 'dwm.doublewordApiKey';

let provider: BatchViewProvider | undefined;
let timer: ReturnType<typeof setInterval> | undefined;

async function getApiKey(secrets: vscode.SecretStorage): Promise<string | undefined> {
  // Priority: SecretStorage > setting > env var
  const stored = await secrets.get(SECRET_KEY);
  if (stored) { return stored; }

  const fromSetting = vscode.workspace.getConfiguration('dwm').get<string>('apiKey', '');
  if (fromSetting) { return fromSetting; }

  return process.env.DOUBLEWORD_API_KEY;
}

async function startMonitoring(apiKey: string, context: vscode.ExtensionContext): Promise<void> {
  if (timer) { clearInterval(timer); }

  const service = new BatchService(apiKey);
  provider = new BatchViewProvider(service);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('dwm.batchView', provider),
  );

  const intervalSec = vscode.workspace.getConfiguration('dwm').get<number>('refreshInterval', 30);
  timer = setInterval(() => provider?.refresh(), intervalSec * 1000);
  context.subscriptions.push({ dispose: () => { if (timer) { clearInterval(timer); } } });
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const secrets = context.secrets;

  context.subscriptions.push(
    vscode.commands.registerCommand('dwm.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Enter your doubleword.ai API key',
        password: true,
        ignoreFocusOut: true,
      });
      if (key) {
        await secrets.store(SECRET_KEY, key);
        vscode.window.showInformationMessage('DWM: API key saved. Starting batch monitor.');
        await startMonitoring(key, context);
      }
    }),
    vscode.commands.registerCommand('dwm.refresh', () => provider?.refresh()),
  );

  const apiKey = await getApiKey(secrets);
  if (apiKey) {
    await startMonitoring(apiKey, context);
  } else {
    vscode.window
      .showErrorMessage(
        'DWM: No API key found. Use "DWM: Set API Key" command, or set DOUBLEWORD_API_KEY env var.',
        'Set API Key'
      )
      .then(choice => {
        if (choice === 'Set API Key') {
          vscode.commands.executeCommand('dwm.setApiKey');
        }
      });
  }
}

export function deactivate(): void {
  if (timer) { clearInterval(timer); }
}
