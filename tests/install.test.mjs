// Tests for install.mjs. Run from the repo root: node --test
// Every test installs into a throwaway folder via CLAUDE_CONFIG_DIR.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('..', import.meta.url));
const INSTALL = path.join(REPO, 'install.mjs');

const target = () => fs.mkdtempSync(path.join(os.tmpdir(), 'install-'));
const install = (dir, ...args) => spawnSync(process.execPath, [INSTALL, ...args],
  { encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: dir } });

// A target that should end up identical to the repo.
function fullTarget() {
  const dir = target();
  fs.writeFileSync(path.join(dir, 'CLAUDE.personal.md'), 'private\n');
  fs.copyFileSync(path.join(REPO, 'settings', 'settings.json'), path.join(dir, 'settings.json'));
  install(dir);
  return dir;
}

test('dry run writes nothing', () => {
  const dir = target();
  install(dir, '--dry-run');
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('skips CLAUDE.md until the private file exists', () => {
  const dir = target();
  const res = install(dir);
  assert.match(res.stdout, /skip\s+CLAUDE\.md/);
  assert.equal(fs.existsSync(path.join(dir, 'CLAUDE.md')), false);
  assert.equal(fs.existsSync(path.join(dir, 'commands', 'start.md')), true);
});

test('check exits 1 when something has drifted', () => {
  const dir = target();
  install(dir);
  assert.equal(install(dir, '--check').status, 1);
});

test('check is up to date after a full install', () => {
  const res = install(fullTarget(), '--check');
  assert.equal(res.status, 0);
  assert.match(res.stdout, /Up to date\./);
});

test('backs up a changed file before overwriting it', () => {
  const dir = fullTarget();
  const file = path.join(dir, 'commands', 'next.md');
  fs.appendFileSync(file, 'local edit\n');
  install(dir);
  const [stamp] = fs.readdirSync(path.join(dir, 'workflow-backups'));
  assert.match(fs.readFileSync(path.join(dir, 'workflow-backups', stamp, 'commands', 'next.md'), 'utf8'), /local edit/);
  assert.equal(fs.readFileSync(file, 'utf8'), fs.readFileSync(path.join(REPO, 'commands', 'next.md'), 'utf8'));
});

test('never deletes files it does not manage', () => {
  const dir = fullTarget();
  const extra = path.join(dir, 'commands', 'local-only.md');
  fs.writeFileSync(extra, 'mine\n');
  install(dir);
  assert.equal(fs.existsSync(extra), true);
});

test('never writes settings.json', () => {
  const dir = target();
  fs.writeFileSync(path.join(dir, 'settings.json'), '{}\n');
  install(dir);
  assert.equal(fs.readFileSync(path.join(dir, 'settings.json'), 'utf8'), '{}\n');
});
