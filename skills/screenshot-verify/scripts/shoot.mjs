// Screenshots pages at several widths and reports console errors, page errors and 4xx/5xx responses.
// Uses the CURRENT PROJECT's puppeteer (or playwright), so run it from the project root.
//
//   node ~/.claude/skills/screenshot-verify/scripts/shoot.mjs --base http://localhost:4321 / /about
//   options: --widths 1440,390   --out screenshots   --label before   --wait 1200 (ms after load)
//            --full (full-page; default viewport only)
// Exit code 1 if any page had errors.

import { createRequire } from 'module';
import { mkdir } from 'fs/promises';
import { join, resolve } from 'path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args.splice(i, 2)[1];
};
const flag = name => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? false : (args.splice(i, 1), true);
};

const base = opt('base', 'http://localhost:4321').replace(/\/$/, '');
const widths = opt('widths', '1440,390').split(',').map(Number);
const outDir = resolve(opt('out', 'screenshots'));
const label = opt('label', '');
const fullPage = flag('full');
const waitMs = Number(opt('wait', '1200')); // let loaders and intro animations finish
// Git Bash rewrites "/about" to "C:/Program Files/Git/about"; undo that, and accept "about" too.
const normalise = p => {
  const unmangled = p.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/]|$)/, '').replaceAll('\\', '/');
  return unmangled.startsWith('/') ? unmangled : '/' + unmangled;
};
const paths = (args.length ? args : ['/']).map(normalise);

const req = createRequire(join(process.cwd(), 'package.json'));
let launch;
try {
  const puppeteer = req('puppeteer');
  launch = async () => {
    const browser = await puppeteer.launch();
    return {
      browser,
      newPage: async (w) => { const p = await browser.newPage(); await p.setViewport({ width: w, height: 900 }); return p; },
      goto: (p, url) => p.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }),
    };
  };
} catch {
  try {
    const { chromium } = req('playwright');
    launch = async () => {
      const browser = await chromium.launch();
      return {
        browser,
        newPage: (w) => browser.newPage({ viewport: { width: w, height: 900 } }),
        goto: (p, url) => p.goto(url, { waitUntil: 'networkidle', timeout: 30000 }),
      };
    };
  } catch {
    console.error('Neither puppeteer nor playwright is installed in this project. Ask before installing: npm i -D puppeteer');
    process.exit(2);
  }
}

await mkdir(outDir, { recursive: true });
const { browser, newPage, goto } = await launch();
let errorCount = 0;

for (const path of paths) {
  for (const width of widths) {
    const page = await newPage(width);
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });

    const slug = (path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/[\/?#=&]/g, '-')) || 'home';
    const file = join(outDir, `${label ? label + '-' : ''}${slug}-${width}.png`);
    try {
      await goto(page, base + path);
      await new Promise(r => setTimeout(r, waitMs));
      await page.screenshot({ path: file, fullPage });
      console.log(`${errors.length ? 'ERR ' : 'OK  '} ${path} @${width}  ${file}`);
    } catch (e) {
      errors.push(`navigation: ${e.message}`);
      console.log(`ERR  ${path} @${width}  (no screenshot)`);
    }
    for (const err of errors) console.log(`       ${err}`);
    errorCount += errors.length;
    await page.close();
  }
}

await browser.close();
console.log(`\n${paths.length} page(s) x ${widths.length} width(s) · ${errorCount} error(s)`);
process.exit(errorCount ? 1 : 0);
