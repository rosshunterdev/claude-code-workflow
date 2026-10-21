#!/usr/bin/env node
// Blocks network commands from auto-executing.
// Checks only the command field (not the description), whole words only,
// so "Confirm ..." or "firmware" no longer match "irm".
// Receives hook JSON on stdin. Prints {} to defer, or a "deny" decision.

const PATTERN = /(^|[^\w-])(curl|wget|iwr|irm|invoke-webrequest|invoke-restmethod)(?![\w-])/i;

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const { tool_input } = JSON.parse(input);
    const cmd = tool_input?.command || '';
    const m = cmd.match(PATTERN);
    if (!m) return console.log('{}');

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: `Network command (${m[2]}) requires manual approval`
      }
    }));
  } catch {
    console.log('{}');
  }
}

main();
