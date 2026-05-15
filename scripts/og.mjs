import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import TOML from '@iarna/toml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'static', 'og');
const FONTS = path.join(ROOT, 'static', 'fonts');

const BG = '#fafafa';
const FG = '#1a1a1a';
const MUTED = '#666';
const RULE = '#e5e5e5';

function el(type, style, children) {
  return { type, props: { style, children } };
}

function card({ title, description, siteTitle }) {
  return el('div', {
    width: '100%',
    height: '100%',
    background: BG,
    color: FG,
    fontFamily: 'Newsreader',
    display: 'flex',
    flexDirection: 'column',
    padding: '80px',
  }, [
    el('div', {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      fontSize: 72,
      fontWeight: 500,
      lineHeight: 1.15,
      letterSpacing: '-0.01em',
    }, title),
    description
      ? el('div', {
          marginTop: 24,
          fontSize: 28,
          lineHeight: 1.4,
          color: MUTED,
        }, description)
      : null,
    el('div', {
      marginTop: 40,
      paddingTop: 32,
      borderTop: `1px solid ${RULE}`,
      fontSize: 24,
      color: MUTED,
      display: 'flex',
    }, siteTitle),
  ].filter(Boolean));
}

function parseFrontMatter(raw) {
  const m = raw.match(/^\+\+\+\r?\n([\s\S]*?)\r?\n\+\+\+/);
  return m ? TOML.parse(m[1]) : null;
}

function slugFromPath(relPath) {
  const parts = relPath.split(path.sep);
  const last = parts[parts.length - 1];
  if (last === '_index.md') return null;
  if (last === 'index.md') return parts[parts.length - 2];
  return last.replace(/\.md$/, '');
}

async function walk(dir, out = []) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) await walk(full, out);
    else if (ent.name.endsWith('.md')) out.push(full);
  }
  return out;
}

async function loadFonts() {
  const [regular, medium] = await Promise.all([
    fs.readFile(path.join(FONTS, 'Newsreader-Regular.ttf')),
    fs.readFile(path.join(FONTS, 'Newsreader-Medium.ttf')),
  ]);
  return [
    { name: 'Newsreader', data: regular, weight: 400, style: 'normal' },
    { name: 'Newsreader', data: medium, weight: 500, style: 'normal' },
  ];
}

async function render(fonts, opts, outFile) {
  const svg = await satori(card(opts), { width: 1200, height: 630, fonts });
  const png = new Resvg(svg).render().asPng();
  await fs.writeFile(outFile, png);
  console.log(`  ${path.relative(ROOT, outFile)}`);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const config = TOML.parse(await fs.readFile(path.join(ROOT, 'config.toml'), 'utf8'));
  const siteTitle = new URL(config.base_url).host;

  const fonts = await loadFonts();

  console.log('Generating OG images…');
  await render(fonts, {
    title: config.title,
    description: config.description,
    siteTitle,
  }, path.join(OUT, 'default.png'));

  for (const file of await walk(CONTENT)) {
    const rel = path.relative(CONTENT, file);
    const slug = slugFromPath(rel);
    if (!slug) continue;
    const fm = parseFrontMatter(await fs.readFile(file, 'utf8'));
    if (!fm?.title) continue;
    if (fm.extra?.og_image) continue;
    await render(fonts, {
      title: fm.title,
      description: fm.description,
      siteTitle,
    }, path.join(OUT, `${slug}.png`));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
