#!/usr/bin/env node
// Asks for approval before commit/merge/rebase while on main or master.
// Replaces the git-safety plugin, which denied these outright.
// Receives hook JSON on stdin. Prints {} to defer, or an "ask" decision.

const { execFileSync } = require('child_process');

const PROTECTED_BRANCHES = ['main', 'master'];
const PATTERN = /\bgit\s+(?:-C\s+\S+\s+)?(commit|merge|rebase)\b/;

// Commands often start with `cd "dir" && ...`, so check the branch there.
function targetDir(cmd, cwd) {
  const m = cmd.match(/^\s*cd\s+(?:"([^"]+)"|'([^']+)'|(\S+))\s*(?:&&|;)/);
  // Git Bash paths (/c/Users/...) aren't valid cwd values for Windows Node.
  return (m ? (m[1] || m[2] || m[3]) : cwd).replace(/^\/([a-z])\//i, '$1:/');
}

function getCurrentBranch(dir) {
  try {
    return execFileSync('git', ['branch', '--show-current'], { cwd: dir, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const { tool_input, cwd } = JSON.parse(input);
    const cmd = tool_input?.command || '';
    const m = cmd.match(PATTERN);
    if (!m) return console.log('{}');

    const branch = getCurrentBranch(targetDir(cmd, cwd));
    if (!PROTECTED_BRANCHES.includes(branch)) return console.log('{}');

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'ask',
        permissionDecisionReason: `git ${m[1]} on ${branch}: approve?`
      }
    }));
  } catch {
    console.log('{}');
  }
}

main();
