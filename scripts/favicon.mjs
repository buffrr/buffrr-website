import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FONTS = path.join(ROOT, 'static', 'fonts');
const OUT = path.join(ROOT, 'static');

const FG = '#1a1a1a';
const BG = '#fafafa';

function favicon() {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        background: BG,
        color: FG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Newsreader',
        fontSize: 380,
        fontWeight: 500,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      },
      children: 'B',
    },
  };
}

async function main() {
  const medium = await fs.readFile(path.join(FONTS, 'Newsreader-Medium.ttf'));
  const fonts = [{ name: 'Newsreader', data: medium, weight: 500, style: 'normal' }];

  const svg = await satori(favicon(), { width: 512, height: 512, fonts });

  console.log('Generating favicons…');
  await fs.writeFile(path.join(OUT, 'favicon.svg'), svg);
  console.log('  static/favicon.svg');

  for (const { size, name } of [
    { size: 32,  name: 'favicon.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ]) {
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
    await fs.writeFile(path.join(OUT, name), png);
    console.log(`  static/${name} (${size}×${size})`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
