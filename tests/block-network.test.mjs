// Tests for hooks/block-network.js. Run from the repo root: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../hooks/block-network.js', import.meta.url));

function decision(tool_input, tool_name = 'Bash') {
  const res = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ tool_name, tool_input }), encoding: 'utf8' });
  return JSON.parse(res.stdout).hookSpecificOutput?.permissionDecision ?? 'defer';
}

const denied = [
  'curl https://example.com',
  'wget https://example.com/file.zip',
  'iwr https://example.com',
  'irm https://example.com',
  'Invoke-WebRequest -Uri https://example.com',
  'Invoke-RestMethod https://api.example.com',
  'cd app && curl -s https://example.com',
  'CURL https://example.com',
];
for (const command of denied) {
  test(`denies: ${command}`, () => assert.equal(decision({ command }), 'deny'));
}

// Whole words only: these used to be blocked when the hook matched substrings.
const allowed = [
  'echo "Confirm the build"',
  'firmware --version',
  'curl-config --version',
  'my-curl test',
  'git status',
  'npm run build',
];
for (const command of allowed) {
  test(`defers: ${command}`, () => assert.equal(decision({ command }), 'defer'));
}

test('checks the PowerShell tool too', () => {
  assert.equal(decision({ command: 'irm https://example.com' }, 'PowerShell'), 'deny');
});

test('ignores the description field', () => {
  assert.equal(decision({ command: 'ls', description: 'download it with curl' }), 'defer');
});

test('defers on input it cannot parse', () => {
  const res = spawnSync(process.execPath, [HOOK], { input: 'not json', encoding: 'utf8' });
  assert.equal(res.status, 0);
  assert.deepEqual(JSON.parse(res.stdout), {});
});
