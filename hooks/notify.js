#!/usr/bin/env node
// Shows a Windows toast (with the default notification sound) when Claude
// finishes a turn (Stop) or is waiting on a permission prompt (Notification).
// Receives hook JSON on stdin. Uses the built-in WinRT toast API through
// Windows PowerShell 5.1, so nothing needs installing.

const { spawn } = require('child_process');
const path = require('path');

// PowerShell's own AppUserModelID: lets an unpackaged script raise toasts.
const APP_ID = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe';

// Escape for XML, and turn ' into &apos; so the text is also safe inside a
// PowerShell single-quoted string.
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function showToast(title, body) {
  const xml = `<toast><visual><binding template="ToastGeneric">`
    + `<text>${xmlEscape(title)}</text><text>${xmlEscape(body)}</text>`
    + `</binding></visual><audio src="ms-winsoundevent:Notification.Default"/></toast>`;

  const ps = [
    '[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null',
    '[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null',
    '$xml = New-Object Windows.Data.Xml.Dom.XmlDocument',
    `$xml.LoadXml('${xml}')`,
    '$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)',
    `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('${APP_ID}').Show($toast)`
  ].join('\n');

  // -EncodedCommand (UTF-16LE base64) avoids every shell-quoting problem.
  const encoded = Buffer.from(ps, 'utf16le').toString('base64');

  // Detached so the hook returns immediately and never slows Claude down.
  const child = spawn('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const { hook_event_name, message, cwd } = JSON.parse(input);
    const project = cwd ? path.basename(cwd) : 'Claude Code';

    if (hook_event_name === 'Notification') {
      showToast(`${project}: needs you`, message || 'Claude is waiting for your input');
    } else {
      showToast(`${project}: done`, 'Claude finished. Ready for your next message.');
    }
  } catch {
    // Never let a notification failure surface as a hook error.
  }
}

main();
