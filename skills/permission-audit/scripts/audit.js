#!/usr/bin/env node
// Scans Claude Code settings files for permission rules that weaken the global deny list.
// Usage: node audit.js [root ...]   (default roots: ~/Documents and ~/.claude)
// Read-only: never modifies any file.

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();
const roots = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [path.join(HOME, 'Documents'), path.join(HOME, '.claude')];
const SKIP_DIRS = new Set(['node_modules', '.git', 'plugins', 'projects', 'file-history', 'cache', 'dist', 'build', '.next', '.expo']);
const SETTINGS_NAMES = new Set(['settings.json', 'settings.local.json']);

// Order matters: first match wins.
const CHECKS = [
  { sev: 'HIGH', id: 'run-anything', why: 'allows every command for that tool', re: /^(Bash|PowerShell)(\(\*\))?$/ },
  // Only wildcard or bare interpreter rules; an exact one-off command falls through to LOW.
  { sev: 'HIGH', id: 'interpreter', why: 'interpreter can run any code, bypassing deny rules and network blocks',
    re: /^(Bash|PowerShell)\((node|python3?|py|bash|sh|zsh|pwsh|powershell|cmd|deno|bun|npx|pnpx|bunx|ruby|perl)(\)$|[^)]*\*)/i },
  { sev: 'LOW', id: 'interpreter-one-off', why: 'exact interpreter command; harmless but likely dead weight',
    re: /^(Bash|PowerShell)\((node|python3?|py|bash|sh|zsh|pwsh|powershell|cmd|deno|bun|npx|pnpx|bunx|ruby|perl)\b/i },
  { sev: 'HIGH', id: 'network', why: 'direct network access', re: /^(Bash|PowerShell)\((curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|irm)\b/i },
  { sev: 'HIGH', id: 'read-whole-drive', why: 'grants reads across the whole drive or home folder',
    re: /^(Read|Edit|Write)\((\/\/[a-z]\/\/?\*\*|\/\/\*\*|~\/\*\*|\/\*\*)\)$/i },
  { sev: 'MED', id: 'package-exec', why: 'can download and run arbitrary packages', re: /^(Bash|PowerShell)\((npm|pnpm|yarn|bun) (exec|dlx|x)\b/i },
  { sev: 'MED', id: 'broad-pkg-manager', why: 'wildcard package manager includes exec/publish', re: /^(Bash|PowerShell)\((npm|pnpm|yarn) (\*|:\*)\)$/i },
  { sev: 'LOW', id: 'stale-one-off', why: 'one-off rule with a hard-coded path or plugin version; likely dead weight',
    re: /(plugins\/cache\/|\d+\.\d+\.\d+\/skills|\\\\Users\\\\|C:\\\\)/i },
];

function walk(dir, out, depth = 0) {
  if (depth > 6) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(p, out, depth + 1);
    } else if (SETTINGS_NAMES.has(e.name) && path.basename(dir) === '.claude') {
      out.push(p);
    } else if (SETTINGS_NAMES.has(e.name) && dir === path.join(HOME, '.claude')) {
      out.push(p);
    }
  }
}

const files = [];
for (const r of roots) walk(r, files);
const uniqueFiles = [...new Set(files)];

const findings = [];
for (const f of uniqueFiles) {
  let json;
  try { json = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (err) {
    findings.push({ file: f, sev: 'LOW', id: 'unparseable', rule: '-', why: err.message });
    continue;
  }
  const allow = (json.permissions && json.permissions.allow) || [];
  for (const rule of allow) {
    const hit = CHECKS.find(c => c.re.test(rule));
    if (hit) findings.push({ file: f, sev: hit.sev, id: hit.id, rule, why: hit.why });
  }
}

const order = { HIGH: 0, MED: 1, LOW: 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev] || a.file.localeCompare(b.file));

console.log(`Scanned ${uniqueFiles.length} settings files.`);
if (!findings.length) { console.log('No risky allow rules found.'); process.exit(0); }
for (const f of findings) {
  console.log(`[${f.sev}] ${f.id}\n  file: ${f.file}\n  rule: ${f.rule}\n  why:  ${f.why}`);
}
const counts = findings.reduce((m, f) => (m[f.sev] = (m[f.sev] || 0) + 1, m), {});
console.log(`\nTotal: ${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}`);
