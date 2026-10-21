// Tests for hooks/git-ask.js. Run from the repo root: node --test
// Each test uses throwaway repos in the temp folder; no commits are made.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = fileURLToPath(new URL('../hooks/git-ask.js', import.meta.url));

function repo(branch) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-ask-'));
  if (branch) execFileSync('git', ['init', '-q', '-b', branch, dir]);
  return dir;
}

function decision(command, cwd) {
  const input = JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd });
  const res = spawnSync(process.execPath, [HOOK], { input, encoding: 'utf8' });
  return JSON.parse(res.stdout).hookSpecificOutput?.permissionDecision ?? 'defer';
}

const main = repo('main');
const master = repo('master');
const feature = repo('feature/x');

for (const command of ['git commit -m "x"', 'git merge feature/x', 'git rebase origin/main', 'git -C . commit -m x']) {
  test(`asks on main: ${command}`, () => assert.equal(decision(command, main), 'ask'));
}

test('asks on master', () => assert.equal(decision('git commit -m x', master), 'ask'));

for (const command of ['git status', 'git push origin main', 'git log --oneline']) {
  test(`defers on main: ${command}`, () => assert.equal(decision(command, main), 'defer'));
}

test('defers on a feature branch', () => assert.equal(decision('git commit -m x', feature), 'defer'));

test('defers outside a repo', () => assert.equal(decision('git commit -m x', repo(null)), 'defer'));

test('follows a leading cd to the repo it names', () => {
  assert.equal(decision(`cd "${main}" && git commit -m x`, feature), 'ask');
});

test('understands Git Bash paths like /c/Users/...', { skip: process.platform !== 'win32' }, () => {
  const gitBash = main.replace(/^([A-Za-z]):\\/, (_, d) => `/${d.toLowerCase()}/`).replace(/\\/g, '/');
  assert.equal(decision(`cd ${gitBash} && git commit -m x`, feature), 'ask');
});
