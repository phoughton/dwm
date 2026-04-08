import * as vscode from 'vscode';
import { Batch } from './types';
import { BatchService } from './batchService';

const BATCH_URL_BASE = 'https://app.doubleword.ai/batches/';

function formatDateShort(unix: number): string {
  const d = new Date(unix * 1000);
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const hr = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mon} ${day} ${hr}:${min}`;
}

function completionPercent(batch: Batch): number {
  const { total, completed } = batch.request_counts;
  if (total === 0) { return 0; }
  return Math.round((completed / total) * 100);
}

function statusIcon(batch: Batch): { symbol: string; cssClass: string } {
  switch (batch.status) {
    case 'completed':
      return batch.request_counts.failed > 0
        ? { symbol: '&#x26A0;', cssClass: 'status-warning' }
        : { symbol: '&#x2714;', cssClass: 'status-ok' };
    case 'in_progress':
      return { symbol: '&#x21BB;', cssClass: 'status-progress' };
    case 'failed':
      return { symbol: '&#x2716;', cssClass: 'status-failed' };
    case 'cancelled':
      return { symbol: '&#x2298;', cssClass: 'status-disabled' };
    case 'expired':
      return { symbol: '&#x23F1;', cssClass: 'status-disabled' };
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class BatchViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private fetching = false;

  constructor(private readonly service: BatchService) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };

    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'openBatch') {
        vscode.env.openExternal(vscode.Uri.parse(msg.url));
      }
    });

    webviewView.onDidDispose(() => {
      this.view = undefined;
    });

    this.refresh();
  }

  async refresh(): Promise<void> {
    if (this.fetching || !this.view) { return; }
    this.fetching = true;
    try {
      const limit = vscode.workspace.getConfiguration('dwm').get<number>('batchLimit', 20);
      const batches = await this.service.fetchBatches(limit);
      this.view.webview.html = this.getHtml(batches);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(`DWM: ${msg}`);
    } finally {
      this.fetching = false;
    }
  }

  private getHtml(batches: Batch[]): string {
    const rows = batches.map(b => {
      const { symbol, cssClass } = statusIcon(b);
      const shortId = b.id.length > 12 ? escapeHtml(b.id.slice(0, 12)) + '&hellip;' : escapeHtml(b.id);
      const date = escapeHtml(formatDateShort(b.created_at));
      const { total, completed, failed } = b.request_counts;
      const pct = completionPercent(b);
      const url = `${BATCH_URL_BASE}${encodeURIComponent(b.id)}`;
      const errorsCell = failed > 0
        ? `<span class="status-failed">${failed}</span>`
        : `${failed}`;

      return `<tr class="row" data-url="${escapeHtml(url)}">
        <td class="col-status"><span class="${cssClass}">${symbol}</span></td>
        <td class="col-id">${shortId}</td>
        <td class="col-date">${date}</td>
        <td class="col-progress">${completed}/${total} (${pct}%)</td>
        <td class="col-errors">${errorsCell}</td>
      </tr>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    margin: 0;
    padding: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  th {
    text-align: left;
    font-weight: 600;
    padding: 4px 6px;
    border-bottom: 1px solid var(--vscode-widget-border);
    white-space: nowrap;
    color: var(--vscode-descriptionForeground);
    font-size: 0.9em;
  }
  td {
    padding: 3px 6px;
    white-space: nowrap;
  }
  .row {
    cursor: pointer;
  }
  .row:hover {
    background: var(--vscode-list-hoverBackground);
  }
  .col-status {
    text-align: center;
    width: 1em;
  }
  .col-errors {
    text-align: right;
  }
  .status-ok { color: var(--vscode-testing-iconPassed); }
  .status-warning { color: var(--vscode-editorWarning-foreground); }
  .status-progress {
    display: inline-block;
    animation: spin 1s linear infinite;
  }
  .status-failed { color: var(--vscode-testing-iconFailed); }
  .status-disabled { color: var(--vscode-disabledForeground); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .empty {
    text-align: center;
    padding: 16px;
    color: var(--vscode-descriptionForeground);
  }
</style>
</head>
<body>
  ${batches.length === 0
    ? '<p class="empty">No batches found.</p>'
    : `<table>
    <thead>
      <tr>
        <th></th>
        <th>Batch ID</th>
        <th>Date/Time</th>
        <th>Progress</th>
        <th>Errors</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`}
  <script>
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('.row').forEach(row => {
      row.addEventListener('click', () => {
        vscode.postMessage({ type: 'openBatch', url: row.dataset.url });
      });
    });
  </script>
</body>
</html>`;
  }
}
