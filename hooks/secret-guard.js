#!/usr/bin/env node
// Stops Claude reading secret files (.env, keys, credentials) and asks before
// it deletes, copies or moves one. Replaces the protect-secrets plugin, which
// matched patterns against the raw command text, so heredoc notes, search
// patterns and file-name listings that only mentioned .env were blocked.
// This hook splits a command into the commands that actually run, then judges
// each one by its program and the files it is handed.
// Covers the Read, Edit, Write, Grep, Bash and PowerShell tools.
// Receives hook JSON on stdin. Prints {} to defer, or a deny/ask decision.

const fs = require('fs');
const os = require('os');
const path = require('path');

// ---------------------------------------------------------------------------
// Secret files and variables

const TEMPLATE = /\.(?:example|sample|template|schema|defaults|dist)$/i;
const SECRET_PATHS = [
  /(?:^|\/)\.env(?:\.[^/]+)?$/i,
  /(?:^|\/)\.envrc$/,
  /(?:^|\/)(?:id_rsa|id_ed25519|id_ecdsa|id_dsa)$/,
  /(?:^|\/)\.ssh\/(?:id_[^/]+|authorized_keys)$/,
  /\.(?:pem|key|p12|pfx|keystore|jks)$/i,
  /(?:^|\/)\.aws\/(?:credentials|config)$/,
  /(?:^|\/)\.kube\/config$/,
  /(?:^|\/)\.docker\/config\.json$/,
  /(?:^|\/)\.gem\/credentials$/,
  /(?:^|\/)(?:credentials?|secrets?)\.(?:json|ya?ml|toml)$/i,
  /service[_-]?account[^/]*\.json$/i,
  /(?:^|\/)\.(?:netrc|npmrc|pypirc|pgpass|my\.cnf|git-credentials|vault-token)$/,
  /(?:^|\/)\.?htpasswd$/,
  /(?:^|\/)\.config\/gcloud\/.*(?:credentials|tokens)/i,
  /(?:^|\/)\.azure\/(?:credentials|accessTokens)/i,
  /^\/proc\/[^/]+\/environ$/,
];
const SECRET_WORDS = new Set(['SECRET', 'SECRETS', 'KEY', 'KEYS', 'TOKEN', 'TOKENS', 'PASSWORD',
  'PASSWD', 'PASS', 'PASSPHRASE', 'CREDENTIAL', 'CREDENTIALS', 'APIKEY', 'AUTH', 'PRIVATE', 'PAT']);

function isSecretPath(word) {
  if (!word) return false;
  const p = word.replace(/\\/g, '/');
  if (TEMPLATE.test(p) || /\.pub$/.test(p)) return false;
  return SECRET_PATHS.some(re => re.test(p));
}

// A glob such as .env* counts if what it starts with is a secret name.
const isSecretGlob = word => isSecretPath(word) || isSecretPath(word.replace(/\*+$/, ''));

// Whole name segments, so $NODE_ENV and $MONKEY stay clean.
const isSecretVar = name => name.toUpperCase().split('_').some(s => SECRET_WORDS.has(s));

// PowerShell's env: drive: the whole drive, or one secret variable.
function isEnvDrive(word) {
  const m = /^env:(.*)$/i.exec(word);
  return !!m && (m[1] === '' || m[1] === '*' || isSecretVar(m[1]));
}

// ---------------------------------------------------------------------------
// Shell parsing: text in, list of simple commands out.
// Each command: { words, inputs, outputs, vars, pipe }. Heredoc and
// here-string bodies and comments are dropped; substitutions such as $(...)
// are parsed as commands of their own.

function findClose(text, from, ps, open = '(', close = ')') {
  let depth = 1;
  for (let j = from; j < text.length; j++) {
    const ch = text[j];
    if ((!ps && ch === '\\') || (ps && ch === '`')) { j++; continue; }
    if (ch === "'") { const e = text.indexOf("'", j + 1); if (e < 0) return text.length; j = e; continue; }
    if (ch === '"') {
      for (j++; j < text.length && text[j] !== '"'; j++) if ((!ps && text[j] === '\\') || (ps && text[j] === '`')) j++;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) return j;
  }
  return text.length;
}

function parseShell(text, shell) {
  const ps = shell === 'powershell';
  const commands = [];
  let pipe = {};
  let cmd = fresh();
  let word = null;
  let redirect = null;
  const heredocs = [];
  let i = 0;

  function fresh() { return { words: [], inputs: [], outputs: [], vars: [], pipe }; }
  function add(s) { word = (word ?? '') + s; }
  function endWord() {
    if (word !== null) {
      if (redirect === 'in') cmd.inputs.push(word);
      else if (redirect === 'out') cmd.outputs.push(word);
      else if (redirect !== 'skip') cmd.words.push(word);
      redirect = null;
    }
    word = null;
  }
  function endCmd(newPipe) {
    endWord();
    redirect = null;
    if (cmd.words.length || cmd.inputs.length || cmd.outputs.length) commands.push(cmd);
    if (newPipe) pipe = {};
    cmd = fresh();
  }
  function nested(inner, placeholder) {
    commands.push(...parseShell(inner, shell));
    add(placeholder);
  }

  function readDollar(j) {
    const rest = text.slice(j + 1);
    if (rest[0] === '(') {
      const close = findClose(text, j + 2, ps);
      nested(text.slice(j + 2, close), '$(...)');
      return close + 1;
    }
    if (rest[0] === '{') {
      const close = text.indexOf('}', j + 2);
      const end = close < 0 ? text.length : close;
      const inner = text.slice(j + 2, end);
      const name = /^[#!]?(?:env:)?([A-Za-z_][A-Za-z0-9_]*)/i.exec(inner);
      // ${#VAR} is a length and ${VAR:+x} only says whether it's set.
      const silent = inner.startsWith('#') || /^[A-Za-z_]\w*:?\+/.test(inner);
      if (name && !silent) cmd.vars.push(name[1]);
      add(text.slice(j, end + 1));
      return end + 1;
    }
    const m = (ps ? /^(?:env:)?([A-Za-z_][A-Za-z0-9_]*)/i : /^([A-Za-z_][A-Za-z0-9_]*)/).exec(rest);
    if (m) {
      cmd.vars.push(m[1]);
      add(text.slice(j, j + 1 + m[0].length));
      return j + 1 + m[0].length;
    }
    add('$');
    return j + 1;
  }

  function readDouble(start) {
    let j = start + 1;
    add('');
    while (j < text.length) {
      const ch = text[j];
      if (ch === '"') {
        if (ps && text[j + 1] === '"') { add('"'); j += 2; continue; }
        break;
      }
      if (!ps && ch === '\\' && '$`"\\\n'.includes(text[j + 1])) { if (text[j + 1] !== '\n') add(text[j + 1]); j += 2; continue; }
      if (ps && ch === '`') { add(text[j + 1] ?? ''); j += 2; continue; }
      if (ch === '$') { j = readDollar(j); continue; }
      if (!ps && ch === '`') {
        const e = text.indexOf('`', j + 1);
        const end = e < 0 ? text.length : e;
        nested(text.slice(j + 1, end), '`...`');
        j = end + 1;
        continue;
      }
      add(ch);
      j++;
    }
    return j + 1;
  }

  function readRedirect(j) {
    const c = text[j];
    // A descriptor written against the operator, as in 2> or *>
    if (word !== null && /^(?:\d+|\*)$/.test(word)) word = null;
    else endWord();
    if (!ps && c === '<' && text[j + 1] === '<') {
      if (text[j + 2] === '<') { redirect = 'skip'; return j + 3; }
      let k = j + 2;
      if (text[k] === '-') k++;
      while (text[k] === ' ' || text[k] === '\t') k++;
      const m = /^(['"]?)([^\s'"<>|;&()]+)\1/.exec(text.slice(k));
      if (m) heredocs.push(m[2]);
      return k + (m ? m[0].length : 0);
    }
    if (!ps && text[j + 1] === '(') {
      const close = findClose(text, j + 2, ps);
      nested(text.slice(j + 2, close), '<(...)');
      return close + 1;
    }
    let k = j + 1;
    if (c === '>' && (text[k] === '>' || text[k] === '|')) k++;
    if (text[k] === '&') { redirect = 'skip'; return k + 1; }
    redirect = c === '<' ? 'in' : 'out';
    return k;
  }

  function skipHeredoc(from, delim) {
    let j = from;
    while (j < text.length) {
      const e = text.indexOf('\n', j);
      const end = e < 0 ? text.length : e;
      const line = text.slice(j, end).replace(/^[ \t]+/, '').replace(/\r$/, '');
      j = end + 1;
      if (line === delim) return j;
    }
    return text.length;
  }

  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '\n') {
      endCmd(true);
      i++;
      while (heredocs.length) i = skipHeredoc(i, heredocs.shift());
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') { endWord(); i++; continue; }

    if (c === '#' && word === null) { const e = text.indexOf('\n', i); i = e < 0 ? text.length : e; continue; }
    if (ps && c === '<' && next === '#') { const e = text.indexOf('#>', i + 2); i = e < 0 ? text.length : e + 2; continue; }

    if (!ps && c === '\\') { if (next !== '\n') add(next ?? ''); i += 2; continue; }
    if (ps && c === '`') {
      if (next === '\n') { i += 2; continue; }
      if (next === '\r' && text[i + 2] === '\n') { i += 3; continue; }
      add(next ?? '');
      i += 2;
      continue;
    }

    if (c === "'") {
      let j = i + 1;
      add('');
      for (; j < text.length; j++) {
        if (text[j] !== "'") { add(text[j]); continue; }
        if (ps && text[j + 1] === "'") { add("'"); j++; continue; }
        break;
      }
      i = j + 1;
      continue;
    }
    if (c === '"') { i = readDouble(i); continue; }
    if (ps && c === '@' && (next === "'" || next === '"') && /^\r?\n/.test(text.slice(i + 2))) {
      const e = text.indexOf(`\n${next}@`, i + 2);
      i = e < 0 ? text.length : e + 3;
      add('@here');
      continue;
    }

    if (c === '$') { i = readDollar(i); continue; }
    if (!ps && c === '`') {
      const e = text.indexOf('`', i + 1);
      const end = e < 0 ? text.length : e;
      nested(text.slice(i + 1, end), '`...`');
      i = end + 1;
      continue;
    }

    // Subshells, PowerShell expressions and script blocks
    if (c === '(' || (ps && c === '{')) {
      const close = findClose(text, i + 1, ps, c, c === '(' ? ')' : '}');
      nested(text.slice(i + 1, close), '(...)');
      i = close + 1;
      continue;
    }
    if (c === ')' || (ps && c === '}')) { i++; continue; }

    if (!ps && c === '&' && next === '>') {
      endWord();
      redirect = 'out';
      i += text[i + 2] === '>' ? 3 : 2;
      continue;
    }
    if (c === '<' || c === '>') { i = readRedirect(i); continue; }

    if (c === ';' || c === '|' || c === '&') {
      // In PowerShell a lone & is the call operator, not a separator.
      if (ps && c === '&' && next !== '&') { endWord(); i++; continue; }
      const pair = c + (next ?? '');
      endCmd(!(c === '|' && next !== '|'));
      i += ['&&', '||', ';;', '|&'].includes(pair) ? 2 : 1;
      continue;
    }

    add(c);
    i++;
  }
  endCmd(true);
  return commands;
}

// ---------------------------------------------------------------------------
// Judging commands

const READERS = new Set(['cat', 'tac', 'head', 'tail', 'less', 'more', 'bat', 'batcat', 'view', 'nl',
  'od', 'xxd', 'hexdump', 'strings', 'base64', 'base32', 'cut', 'sort', 'uniq', 'column', 'fold',
  'rev', 'paste', 'diff', 'comm', 'jq', 'yq', 'openssl', 'gpg', 'source', '.',
  'get-content', 'gc', 'type', 'format-hex', 'fhx']);
const MOVERS = new Set(['cp', 'mv', 'rm', 'unlink', 'shred', 'truncate',
  'copy-item', 'cpi', 'copy', 'move-item', 'mi', 'move', 'remove-item', 'ri', 'del', 'erase',
  'rename-item', 'ren', 'rni', 'clear-content', 'clc', 'set-content', 'sc', 'add-content', 'ac', 'out-file']);
const SENDERS = new Set(['scp', 'rsync', 'sftp', 'nc', 'ncat', 'netcat', 'socat']);
const UPLOADERS = new Set(['curl', 'wget', 'http', 'https', 'xh', 'iwr', 'irm', 'invoke-webrequest', 'invoke-restmethod']);
const PRINTERS = new Set(['echo', 'printf', 'write-output', 'write', 'write-host']);
const LISTERS = new Set(['get-childitem', 'gci', 'ls', 'dir', 'get-item', 'gi']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash', 'ksh']);
const KEYWORDS = new Set(['{', '}', '!', 'if', 'then', 'else', 'elif', 'fi', 'do', 'done', 'while', 'until', 'time']);
const GIT_READS = new Set(['show', 'diff', 'log', 'grep', 'blame', 'cat-file', 'annotate', 'whatchanged']);

// Commands whose first operand is a pattern or script, not a file.
const GREP = { values: ['-e', '-f', '-A', '-B', '-C', '-m', '-d', '-D', '-g', '-t', '-T', '-M', '-j',
  '--regexp', '--file', '--glob', '--iglob', '--type', '--type-not', '--max-count', '--context',
  '--before-context', '--after-context', '--max-columns', '--threads'],
  pattern: ['-e', '--regexp', '-f', '--file'], files: ['-f', '--file'] };
const SED = { values: ['-e', '-f', '-l', '--expression', '--file'], pattern: ['-e', '-f', '--expression', '--file'], files: ['-f', '--file'] };
const AWK = { values: ['-F', '-v', '-f'], pattern: ['-f'], files: ['-f'] };
const SLS = { values: ['-pattern', '-path', '-literalpath', '-context', '-encoding', '-include', '-exclude'],
  pattern: ['-pattern'], files: ['-path', '-literalpath'] };
const PATTERN_FIRST = { grep: GREP, egrep: GREP, fgrep: GREP, zgrep: GREP, rg: GREP, ag: GREP, ack: GREP,
  sed: SED, awk: AWK, gawk: AWK, mawk: AWK, nawk: AWK, 'select-string': SLS, sls: SLS };

// Options of wrapper commands that take a separate value.
const WRAPPERS = { sudo: ['-u', '-g', '-h', '-p'], env: ['-u', '-C', '-S'], command: [], builtin: [],
  exec: [], nohup: [], nice: ['-n'], stdbuf: [], timeout: ['-s', '-k', '--signal', '--kill-after'],
  xargs: ['-n', '-I', '-L', '-P', '-d', '-a', '-s', '-E'] };

const commandName = w => w.replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, '');
const isOption = a => a.length > 1 && a.startsWith('-');

// The words that name files: options, option values and a leading
// pattern or script are left out.
function operands(name, args) {
  const spec = PATTERN_FIRST[name];
  if (!spec) return args.filter(a => !isOption(a));
  const norm = a => (spec === SLS ? a.toLowerCase() : a);
  const files = [];
  let patternGiven = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (a === '--') {
      const rest = args.slice(k + 1);
      files.push(...(patternGiven ? rest : rest.slice(1)));
      break;
    }
    if (!isOption(a)) {
      if (patternGiven) files.push(a);
      else patternGiven = true;
      continue;
    }
    const eq = a.indexOf('=');
    const flag = norm(eq > 0 ? a.slice(0, eq) : a);
    if (spec.pattern.includes(flag) || spec.pattern.some(p => p.length === 2 && flag.startsWith(p) && flag.length > 2)) patternGiven = true;
    if (eq > 0) { if (spec.files.includes(flag)) files.push(a.slice(eq + 1)); continue; }
    if (spec.values.includes(flag)) {
      const value = args[++k];
      if (spec.files.includes(flag) && value !== undefined) files.push(value);
    }
  }
  return files;
}

const SEVERITY = { pass: 0, ask: 1, block: 2 };
const worst = results => results.reduce((a, b) => (SEVERITY[b.decision] > SEVERITY[a.decision] ? b : a), { decision: 'pass' });

function judgeCommand(cmd, all, ps) {
  const results = [];
  const flag = (decision, rule, target) => results.push({ decision, rule, target });

  for (const f of cmd.inputs) if (isSecretPath(f)) flag('block', 'reads-secret', f);
  for (const f of cmd.outputs) if (isSecretPath(f)) flag('ask', 'overwrites-secret', f);

  let words = cmd.words.slice();
  while (words.length && (KEYWORDS.has(words[0]) || (!ps && /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[0])))) words.shift();

  // Unwrap sudo, env, xargs and friends to reach the real command.
  let viaXargs = false;
  while (words.length && WRAPPERS[commandName(words[0])]) {
    const wrapper = commandName(words[0]);
    let k = 1;
    while (k < words.length && (isOption(words[k]) || (wrapper === 'env' && /^[A-Za-z_]\w*=/.test(words[k])))) {
      k += WRAPPERS[wrapper].includes(words[k]) ? 2 : 1;
    }
    if (wrapper === 'timeout') k++;
    if (wrapper === 'env' && k >= words.length) { flag('block', 'dumps-env', 'env'); return worst(results); }
    if (wrapper === 'xargs') viaXargs = true;
    words = words.slice(k);
  }
  if (!words.length) return worst(results);

  const name = commandName(words[0]);
  const args = words.slice(1);

  // Shells handed a script as a string.
  if (SHELLS.has(name) && args.includes('-c')) results.push(judgeShell(args[args.indexOf('-c') + 1] || '', 'bash'));
  if (name === 'eval') results.push(judgeShell(args.join(' '), 'bash'));
  if (name === 'powershell' || name === 'pwsh') {
    const k = args.findIndex(a => /^-(?:c|command)$/i.test(a));
    if (k >= 0) results.push(judgeShell(args.slice(k + 1).join(' '), 'powershell'));
  }
  if (name === 'cmd') {
    const k = args.findIndex(a => /^\/[ck]$/i.test(a));
    if (k >= 0) results.push(judgeShell(args.slice(k + 1).join(' '), 'powershell'));
  }

  const reads = READERS.has(name) || PATTERN_FIRST[name];
  if (reads) {
    for (const f of operands(name, args)) {
      if (isSecretPath(f)) flag('block', 'reads-secret', f);
      else if (isEnvDrive(f)) flag('block', 'dumps-env', f);
    }
    // `echo .env | xargs cat`: the file names arrive through the pipe.
    if (viaXargs && all.some(c => c !== cmd && c.pipe === cmd.pipe && c.words.some(isSecretGlob))) {
      flag('block', 'reads-secret', 'files piped to xargs');
    }
  }
  if (MOVERS.has(name)) for (const f of operands(name, args)) if (isSecretPath(f)) flag('ask', 'moves-secret', f);
  if (SENDERS.has(name)) for (const f of operands(name, args)) if (isSecretPath(f)) flag('block', 'sends-secret', f);
  if (UPLOADERS.has(name)) {
    args.forEach((a, k) => {
      const at = /(?:^|=)@(.+)$/.exec(a);
      if (at && isSecretPath(at[1])) flag('block', 'sends-secret', at[1]);
      const upload = /^(?:-T|--upload-file|--post-file|--body-file|-infile)(?:=(.+))?$/i.exec(a);
      const file = upload && (upload[1] ?? args[k + 1]);
      if (file && isSecretPath(file)) flag('block', 'sends-secret', file);
    });
  }
  if (PRINTERS.has(name)) {
    const secret = cmd.vars.find(isSecretVar);
    if (secret) flag('block', 'prints-secret-var', `$${secret}`);
  }
  if (name === 'printenv' && (!args.length || args.some(isSecretVar))) flag('block', 'dumps-env', 'printenv');
  if (!ps && ['export', 'declare', 'typeset'].includes(name) && args.every(isOption)) flag('block', 'dumps-env', name);
  if (!ps && name === 'set' && !args.length) flag('block', 'dumps-env', 'set');
  if (LISTERS.has(name) && args.some(isEnvDrive)) flag('block', 'dumps-env', 'env:');

  if (name === 'find') {
    const k = args.findIndex(a => /^-(?:exec|execdir|ok|okdir)$/.test(a));
    const runs = k >= 0 && args[k + 1] ? commandName(args[k + 1]) : '';
    if ((READERS.has(runs) || PATTERN_FIRST[runs]) && args.slice(0, k).some(isSecretGlob)) {
      flag('block', 'reads-secret', 'files found by find');
    }
  }

  if (name === 'git') {
    let k = 0;
    while (k < args.length && isOption(args[k])) k += ['-C', '-c', '--git-dir', '--work-tree'].includes(args[k]) ? 2 : 1;
    const sub = args[k];
    if (GIT_READS.has(sub)) {
      const rest = args.slice(k + 1);
      const paths = sub === 'grep' ? operands('grep', rest) : rest.filter(a => !isOption(a));
      for (const p of paths) {
        if (/^:(?:!|\^|\()/.test(p)) continue; // excluded pathspec
        const file = p.includes(':') ? p.slice(p.indexOf(':') + 1) : p; // HEAD:.env
        if (isSecretPath(file)) flag('block', 'reads-secret', file);
      }
    }
  }

  return worst(results);
}

function judgeShell(text, shell) {
  const ps = shell === 'powershell';
  const commands = parseShell(text, shell);
  return worst(commands.map(cmd => judgeCommand(cmd, commands, ps)));
}

// Returns { decision: 'block' | 'ask' | 'pass', rule, target }.
function decide({ tool_name, tool_input = {} }) {
  if (['Read', 'Edit', 'Write'].includes(tool_name)) {
    return isSecretPath(tool_input.file_path)
      ? { decision: 'block', rule: 'reads-secret', target: tool_input.file_path }
      : { decision: 'pass' };
  }
  if (tool_name === 'Grep') {
    const target = [tool_input.path, tool_input.glob, tool_input.include].find(v => typeof v === 'string' && isSecretGlob(v));
    return target ? { decision: 'block', rule: 'reads-secret', target } : { decision: 'pass' };
  }
  if (tool_name === 'Bash') return judgeShell(tool_input.command || '', 'bash');
  if (tool_name === 'PowerShell') return judgeShell(tool_input.command || '', 'powershell');
  return { decision: 'pass' };
}

// ---------------------------------------------------------------------------
// Hook entry point

const WHAT = {
  'reads-secret': 'reads a secret file',
  'sends-secret': 'sends a secret file off this machine',
  'prints-secret-var': 'prints a secret variable',
  'dumps-env': 'prints the environment, which can hold secrets',
  'moves-secret': 'deletes, copies or moves a secret file',
  'overwrites-secret': 'overwrites a secret file',
};

function log(entry) {
  try {
    const dir = path.join(process.env.HOME || process.env.USERPROFILE || os.homedir(), '.claude', 'hooks-logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`),
      JSON.stringify({ ts: new Date().toISOString(), hook: 'secret-guard', ...entry }) + '\n');
  } catch {
    // Logging must never stop the hook answering.
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const data = JSON.parse(input);
    const result = decide(data);
    if (result.decision === 'pass') return console.log('{}');

    const { tool_name, tool_input = {}, session_id, cwd } = data;
    // The full command is logged so false blocks can be measured later.
    log({ decision: result.decision, rule: result.rule, target: result.target, tool: tool_name,
      command: tool_input.command, file_path: tool_input.file_path, session_id, cwd });

    const why = `secret-guard: ${WHAT[result.rule]} (${result.target}).`;
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: result.decision === 'block' ? 'deny' : 'ask',
        permissionDecisionReason: result.decision === 'block'
          ? `${why} Secrets stay out of the conversation; ask the user if a value is needed.`
          : `${why} Approve?`,
      },
    }));
  } catch {
    console.log('{}');
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = { decide, isSecretPath, parseShell };
}
