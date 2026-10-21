// Tests for hooks/secret-guard.js. Run from the repo root: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import myCases from './fixtures/blocked-commands.mjs';
import pluginCases from './fixtures/plugin-cases.mjs';

const require = createRequire(import.meta.url);
const HOOK = fileURLToPath(new URL('../hooks/secret-guard.js', import.meta.url));
const { decide } = require(HOOK);

const bash = command => ({ tool_name: 'Bash', tool_input: { command } });
const ps = command => ({ tool_name: 'PowerShell', tool_input: { command } });
const outcome = input => decide(input).decision;

for (const c of myCases) {
  test(`my sessions #${c.n} (${c.expect}): ${c.why}`, () => assert.equal(outcome(c.input), c.expect));
}

for (const c of pluginCases) {
  test(`plugin suite (${c.expect}): ${c.name}`, () => assert.equal(outcome(c.input), c.expect));
}

// The plugin never checks the PowerShell tool.
const powershell = [
  ['Get-Content .env', 'block'],
  ['gc .\\.env.local', 'block'],
  ['Get-Content -Path C:\\proj\\.env -Raw', 'block'],
  ['type .env', 'block'],
  ['$k = (Get-Content .env)', 'block'],
  ['cd C:\\proj; Get-Content .env | Select-String KEY', 'block'],
  ['Select-String -Path .env -Pattern KEY', 'block'],
  ['Select-String KEY .env', 'block'],
  ['Get-ChildItem env:', 'block'],
  ['Write-Output $env:API_KEY', 'block'],
  ['Copy-Item .env backup.env', 'ask'],
  ['Remove-Item .env', 'ask'],
  ['Get-Content .env.example', 'pass'],
  ["Select-String -Pattern '\\.env' -Path notes.md", 'pass'],
  ['Write-Output $env:PATH', 'pass'],
  ['git status; Get-Content README.md', 'pass'],
];
for (const [command, expect] of powershell) {
  test(`PowerShell (${expect}): ${command}`, () => assert.equal(outcome(ps(command)), expect));
}

// Shell features the parser has to see through.
const parser = [
  ["bash -c 'cat .env'", 'block'],
  ['export $(cat .env | xargs)', 'block'],
  ['git show HEAD:.env', 'block'],
  ['cat "C:\\Users\\me\\proj\\.env"', 'block'],
  ['cat .env.example > .env', 'ask'],
  ['echo "${API_KEY:+set}"', 'pass'],
  ["cat > .env.example <<'EOF'\nAPI_KEY=\nEOF", 'pass'],
  ["git log --all --name-only | grep -i '\\.env'", 'pass'],
];
for (const [command, expect] of parser) {
  test(`parser (${expect}): ${JSON.stringify(command)}`, () => assert.equal(outcome(bash(command)), expect));
}

// End to end: hook JSON on stdin, decision on stdout, as Claude Code runs it.
function run(stdin) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'secret-guard-'));
  const res = spawnSync(process.execPath, [HOOK], {
    input: stdin, encoding: 'utf8', env: { ...process.env, HOME: home, USERPROFILE: home },
  });
  return { status: res.status, out: JSON.parse(res.stdout), home };
}

test('end to end: denies a secret read and logs the full command', () => {
  const command = 'cd app && cat .env';
  const { status, out, home } = run(JSON.stringify(bash(command)));
  assert.equal(status, 0);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /\.env/);
  const logDir = path.join(home, '.claude', 'hooks-logs');
  const logged = fs.readdirSync(logDir).map(f => fs.readFileSync(path.join(logDir, f), 'utf8')).join('');
  assert.equal(JSON.parse(logged.trim().split('\n').pop()).command, command);
});

test('end to end: asks before copying a secret', () => {
  assert.equal(run(JSON.stringify(bash('cp .env .env.bak'))).out.hookSpecificOutput.permissionDecision, 'ask');
});

test('end to end: defers on a safe command', () => {
  assert.deepEqual(run(JSON.stringify(bash('ls -la'))).out, {});
});

test('end to end: defers on input it cannot parse', () => {
  const { status, out } = run('not json');
  assert.equal(status, 0);
  assert.deepEqual(out, {});
});
