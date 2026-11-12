import { mkdir, writeFile } from 'node:fs/promises';
import site from '../dist/server/index.js';

const destination = new URL('../dist/neutral-site/', import.meta.url);
const assets = [
  ['/', 'index.html'],
  ['/app.js', 'app.js'],
  ['/style.css', 'style.css'],
  ['/percia-prototipo.zip', 'percia-prototipo.zip'],
];

await mkdir(destination, { recursive: true });

for (const [path, filename] of assets) {
  const response = await site.fetch(new Request(new URL(path, 'https://percia.invalid')));
  if (!response.ok) throw new Error(`Falha ao exportar ${path}: HTTP ${response.status}`);

  if (path === '/') {
    // Aplica a política também em hospedagens estáticas sem cabeçalhos personalizados.
    const policy = response.headers.get('content-security-policy')
      .split(';')
      .map(directive => directive.trim())
      .filter(directive => !directive.startsWith('frame-ancestors '))
      .join('; ');
    const html = (await response.text()).replace(
      /(<meta charset="utf-8">)/,
      `$1\n<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="referrer" content="no-referrer">`,
    );
    await writeFile(new URL(filename, destination), html);
    continue;
  }

  await writeFile(new URL(filename, destination), new Uint8Array(await response.arrayBuffer()));
}

console.log('Site estático pronto em dist/neutral-site.');

