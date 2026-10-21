#!/usr/bin/env node
// Copies this repo's Claude Code setup into ~/.claude.
// The repo is the source of truth: edit files here, then run this script.
//
//   node install.mjs            install (backs up any file it overwrites)
//   node install.mjs --dry-run  show what would change, write nothing
//   node install.mjs --check    exit 1 if ~/.claude has drifted from the repo
//
// It never deletes anything in ~/.claude and never writes settings.json
// (Claude Code edits that file itself). It only reports whether the keys in
// settings/settings.json still match the live file.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const TARGET = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const MANAGED = ['CLAUDE.md', 'commands', 'skills', 'hooks'];
const PERSONAL = 'CLAUDE.personal.md';

const args = process.argv.slice(2);
const mode = args.includes('--check') ? 'check' : args.includes('--dry-run') ? 'dry-run' : 'install';

function listFiles(rel) {
  const abs = path.join(REPO, rel);
  if (!fs.statSync(abs).isDirectory()) return [rel];
  return fs.readdirSync(abs).flatMap(name => listFiles(path.join(rel, name)));
}

function status(rel) {
  const dest = path.join(TARGET, rel);
  if (!fs.existsSync(dest)) return 'new';
  return fs.readFileSync(path.join(REPO, rel)).equals(fs.readFileSync(dest)) ? 'same' : 'changed';
}

// CLAUDE.md imports the private file. Installing it before that file exists
// would drop the personal section, so CLAUDE.md waits until it does.
const hasPersonal = fs.existsSync(path.join(TARGET, PERSONAL));
const backupDir = path.join(TARGET, 'workflow-backups', new Date().toISOString().replace(/[:.]/g, '-'));
let drift = 0;
let backedUp = 0;

for (const rel of MANAGED.flatMap(listFiles)) {
  const s = status(rel);
  if (s === 'same') continue;
  drift++;

  if (rel === 'CLAUDE.md' && !hasPersonal) {
    console.log(`skip     ${rel} (create ${path.join(TARGET, PERSONAL)} first)`);
    continue;
  }

  console.log(`${s.padEnd(8)} ${rel}`);
  if (mode !== 'install') continue;

  const dest = path.join(TARGET, rel);
  if (s === 'changed') {
    const backup = path.join(backupDir, rel);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(dest, backup);
    backedUp++;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(REPO, rel), dest);
}

const wanted = JSON.parse(fs.readFileSync(path.join(REPO, 'settings', 'settings.json'), 'utf8'));
let live = {};
try {
  live = JSON.parse(fs.readFileSync(path.join(TARGET, 'settings.json'), 'utf8'));
} catch {
  // Missing or invalid settings.json: every key below reports as different.
}
for (const key of Object.keys(wanted)) {
  if (isDeepStrictEqual(wanted[key], live[key])) continue;
  drift++;
  console.log(`differs  settings.json "${key}" (copy it across by hand)`);
}

if (!drift) console.log('Up to date.');
else if (mode === 'check') process.exitCode = 1;
else if (mode === 'install' && backedUp) console.log(`\nBacked up ${backedUp} overwritten file(s) to ${backupDir}`);
