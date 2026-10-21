// Real commands that protect-secrets 1.0.0 blocked in my sessions
// (September to October 2026), with paths and names replaced.
// Each one still trips the same rule it tripped originally.
//
// expect: "block"  reads the contents of a real secret file
//         "ask"    deletes, copies or moves a real .env without printing it
//         "pass"   mentions .env, lists names, or reads something else

const bash = command => ({ tool_name: 'Bash', tool_input: { command } });

export default [
  { n: 1, rule: 'env-file', expect: 'block', why: 'Reads a real .env file (a deliberate test of the hook)',
    input: { tool_name: 'Read', tool_input: { file_path: '/tmp/secrets-test/.env' } } },
  { n: 2, rule: 'rm-env', expect: 'ask', why: 'Deletes a .env; prints nothing, but the keys may have no other copy',
    input: bash(String.raw`rm -f "$TEMP/secrets-test/.env" && rmdir "$TEMP/secrets-test" && echo "removed"`) },
  { n: 5, rule: 'grep-env', expect: 'block', why: 'Text tool on a real .env (only a count here, but other flags print values)',
    input: bash(String.raw`grep -c "API_KEY" .env`) },
  { n: 9, rule: 'grep-env', expect: 'block', why: 'Text tool on a real .env',
    input: bash(String.raw`git check-ignore .env; echo -n "lines with sslmode=require: "; grep -c "sslmode=require" .env`) },
  { n: 10, rule: 'cat-env', expect: 'block', why: 'Prints a real .env.local in full',
    input: bash(String.raw`cat ../jest.config.ts ../.env.local ../next.config.ts`) },
  { n: 11, rule: 'cp-env', expect: 'ask', why: 'Copies a .env; prints nothing, but the copy could land in a repo that does not ignore it',
    input: bash(String.raw`cp /c/projects/app/backend/.env /c/projects/app-v2/backend/.env && ls /c/projects/app/frontend/.env* 2>/dev/null`) },
  { n: 12, rule: 'grep-env', expect: 'pass', why: 'Excludes .env.example from a search',
    input: bash(String.raw`git grep -n -i -E 'claude|openai|assistant' -- . ':!.env.example'`) },
  { n: 13, rule: 'cat-env', expect: 'pass', why: 'PR text mentions .env.example; --head looks like the head command',
    input: bash(String.raw`gh pr create --head cleanup --title "Pre-submission cleanup" --body "- Add .claude/ to .gitignore, tidy .env.example"`) },
  { n: 14, rule: 'xargs-cat-env', expect: 'pass', why: 'Counts lines, then reads a source file',
    input: bash(String.raw`find . -name "*.kt" | xargs wc -l | tail -1 && cat inference/PromptAssembler.kt`) },
  { n: 15, rule: 'cat-ssh-key', expect: 'pass', why: 'Source code containing event.key looks like a .key file',
    input: bash(String.raw`ls src/storage | head -1
python - <<'E'
p='src/storage/StorageAdapter.ts'
s=open(p).read().replace('if (event.key !== KEY)', 'if (event.key !== STORAGE_KEY)')
open(p,'w').write(s)
E`) },
  { n: 16, rule: 'xargs-cat-env', expect: 'pass', why: 'Counts lines, then reads config files',
    input: bash(String.raw`find src tests -name "*.py" | xargs wc -l | tail -20; cat requirements.txt; echo; cat .claude/settings.local.json`) },
  { n: 17, rule: 'xargs-cat-env', expect: 'pass', why: 'Counts lines, then reads a markdown file',
    input: bash(String.raw`find src -type f | xargs wc -l && cat DECISIONS.md | head -80`) },
  { n: 18, rule: 'cat-env', expect: 'pass', why: 'Edits code that uses process.env',
    input: bash(String.raw`EXE=$(ls chrome*/chrome.exe | head -1) && sed -i "s#chromium.launch()#chromium.launch({ executablePath: process.env.CHROME })#" shot.mjs`) },
  { n: 19, rule: 'grep-env', expect: 'pass', why: 'Lists tracked file names; reads no contents',
    input: bash(String.raw`git ls-files | grep -i -E "\.env|secret|\.pem|\.key"`) },
  { n: 20, rule: 'grep-env', expect: 'pass', why: 'Uses process.env.HOME in a script',
    input: bash(String.raw`grep -n "block-network" settings.json && node -e 'JSON.parse(require("fs").readFileSync(process.env.HOME+"/.claude/settings.json","utf8"))'`) },
  { n: 21, rule: 'grep-env', expect: 'pass', why: 'Writes notes that mention grep and .env',
    input: bash(String.raw`sed -i 's#old#grep-env fires on any command combining grep and the text .env (e.g. process.env).#' notes.md`) },
  { n: 22, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed .env names',
    input: bash(String.raw`git log --all --diff-filter=A --name-only --format= | grep -iE '\.env'`) },
  { n: 23, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed .env names',
    input: bash(String.raw`git ls-files | sort | uniq -c && git log --all --diff-filter=A --name-only --format= | grep -iE '\.env'`) },
  { n: 24, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed secret file names',
    input: bash(String.raw`cd /tmp/audit/app && git log --all --diff-filter=A --name-only --format= | grep -iE '\.env|\.pem|\.key'`) },
  { n: 25, rule: 'cat-env', expect: 'pass', why: 'Reads .env.example, which holds no secrets',
    input: bash(String.raw`cat package.json .gitignore .env.example; echo ---; head -40 CLAUDE.md`) },
  { n: 26, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed secret file names',
    input: bash(String.raw`cd /tmp/audit/app2 && git log --all --diff-filter=A --name-only --format= | grep -i -E '\.env|secret'`) },
  { n: 27, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed .env names',
    input: bash(String.raw`git ls-files | grep -iE '\.mp4|dist/' | head; git log --all --diff-filter=A --name-only --format= | grep -i '\.env'`) },
  { n: 28, rule: 'grep-env', expect: 'pass', why: 'Lists tracked file names; reads no contents',
    input: bash(String.raw`head -40 CLAUDE.md; echo ---; git ls-files | grep -iE '\.env'`) },
  { n: 29, rule: 'cat-env', expect: 'pass', why: 'Reads .env.example, with values redacted anyway',
    input: bash(String.raw`cat .env.example | sed 's/=.*/=<redacted>/'`) },
  { n: 30, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed .env names',
    input: bash(String.raw`echo ---ENV; git log --all --diff-filter=A --name-only --format= | grep -iE '\.env'`) },
  { n: 31, rule: 'xargs-cat-env', expect: 'pass', why: 'Sizes tracked files, then reads .gitignore',
    input: bash(String.raw`git ls-files -z | xargs -0 du -k | sort -rn | head -4; ls tests scripts docs; cat .gitignore | head -20`) },
  { n: 32, rule: 'xargs-cat-env', expect: 'pass', why: 'Filters .env out of a file list, then sizes files',
    input: bash(String.raw`git ls-files | grep -vE '(^|/)\.env|node_modules|dist/'; echo ---big; git ls-files -z | xargs -0 du -k | sort -rn | head -4`) },
  { n: 33, rule: 'xargs-cat-env', expect: 'pass', why: 'Sizes tracked files, then reads .gitignore',
    input: bash(String.raw`git ls-files -z | xargs -0 du -k 2>/dev/null | sort -rn | head -4; echo; cat .gitignore | head -20`) },
  { n: 34, rule: 'grep-env', expect: 'pass', why: 'Lists tracked file names; reads no contents',
    input: bash(String.raw`ls .github 2>&1 | head -2
echo --- env; git ls-files | grep -iE '\.env'`) },
  { n: 35, rule: 'xargs-cat-env', expect: 'pass', why: 'Lists secret file names, then sizes files',
    input: bash(String.raw`git ls-files | grep -iE '(^|/)\.env|\.pem$|\.key$'; git grep -nE 'hooks' -- . ':!package-lock.json' | head -20; git ls-files -z | xargs -0 du -k | sort -rn | head -5`) },
  { n: 36, rule: 'mv-env', expect: 'pass', why: 'Heredoc notes that mention mv and .env',
    input: bash(String.raw`cat > notes/app.md <<'EOF'
## app
- Stack: Astro; settings.local.json tracked (harmless mv permissions, but tooling noise).
- No .gitignore. No .env files ever committed.
EOF`) },
  { n: 37, rule: 'grep-env', expect: 'pass', why: 'Heredoc notes that mention grep and .env',
    input: bash(String.raw`cat > notes/app.md <<'EOF'
- Checked with grep for client names in *.md: no hits.
- Sensitive findings: none. Checked: tracked .env files.
EOF`) },
  { n: 38, rule: 'grep-env', expect: 'pass', why: 'Heredoc notes that mention grep and .env',
    input: bash(String.raw`cat > notes/app.md <<'EOF'
- Key scan: grep sk-, AKIA, ghp_: none. .gitignore ignores node_modules/dist/.env.
EOF`) },
  { n: 39, rule: 'cat-env', expect: 'pass', why: 'Heredoc notes that mention .env',
    input: bash(String.raw`cat > notes/app.md <<'EOF'
- Checked: tracked .env* (only .env.example).
EOF`) },
  { n: 40, rule: 'cat-secrets-file', expect: 'pass', why: 'Checks secrets.toml is gitignored; reads no contents',
    input: bash(String.raw`grep -n '"id"' evals/cases.json | head -20 && cat requirements.txt && git check-ignore -v .streamlit/secrets.toml evals/runs samples`) },
  { n: 41, rule: 'grep-env', expect: 'pass', why: 'Checks history for committed secret file names',
    input: bash(String.raw`echo "--- secrets scan"; git log --all --name-only --format= | sort -u | grep -iE '\.env|\.pem|\.key'`) },
  { n: 42, rule: 'grep-env', expect: 'pass', why: 'Lists tracked file names; reads no contents',
    input: bash(String.raw`cd /c/projects/app && cat backend/requirements.txt | tr '\n' ' '; echo; git ls-files | grep -i "\.env"`) },
  { n: 43, rule: 'cat-env', expect: 'block', why: 'Prints a real .env.local; only postgres lines are redacted',
    input: bash(String.raw`cat frontend/.env.local | sed 's/=.*postgres.*/=<redacted>/'`) },
  { n: 44, rule: 'grep-env', expect: 'pass', why: 'Excludes .env files from a search',
    input: bash(String.raw`grep -rliE 'todo' --exclude-dir=node_modules --exclude-dir=.git --exclude=.env* . | head -30`) },
  { n: 45, rule: 'xargs-cat-env', expect: 'pass', why: "Reads the hook's own source and license",
    input: bash(String.raw`grep -nE "id: '(grep-env|cat-env|xargs-cat-env)'" -A2 plugin/protect-secrets.js | head -24; ls plugin; cat plugin/LICENSE`) },
];
