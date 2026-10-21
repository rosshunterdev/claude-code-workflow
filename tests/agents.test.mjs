// Checks every subagent in agents/: valid frontmatter, and no way to edit files.
// Run from the repo root: node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../agents', import.meta.url));
const WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit'];

function frontmatter(file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(file, 'utf8'));
  assert.ok(m, 'starts with a --- frontmatter block');
  return Object.fromEntries(m[1].split(/\r?\n/).map(line => {
    const i = line.indexOf(':');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  }));
}
const list = value => (value || '').split(',').map(s => s.trim()).filter(Boolean);

for (const file of fs.readdirSync(DIR).filter(f => f.endsWith('.md'))) {
  const fm = frontmatter(path.join(DIR, file));

  test(`${file}: name matches the file name`, () => {
    assert.match(fm.name, /^[a-z][a-z0-9-]*$/);
    assert.equal(`${fm.name}.md`, file);
  });

  test(`${file}: has a description that says when to use it`, () => {
    assert.ok(fm.description && fm.description.length > 40);
  });

  test(`${file}: cannot edit files`, () => {
    assert.ok(fm.tools, 'lists its tools explicitly instead of inheriting all of them');
    for (const tool of WRITE_TOOLS) {
      assert.ok(!list(fm.tools).includes(tool), `${tool} is not in tools`);
      assert.ok(list(fm.disallowedTools).includes(tool), `${tool} is in disallowedTools`);
    }
  });
}
