import { mkdir, writeFile } from 'node:fs/promises';
import site from '../dist/server/index.js';

const destination = new URL('../dist/neutral-site/', import.meta.url);
const configuredUrl = process.env.PERCIA_MANAGED_API_URL?.trim();
const managedApi = configuredUrl ? new URL(configuredUrl) : null;
if (managedApi && (managedApi.protocol!=='https:' || managedApi.username || managedApi.password || managedApi.search || managedApi.hash || managedApi.pathname!=='/chat')) {
  throw new Error('PERCIA_MANAGED_API_URL deve ser uma URL HTTPS pública com caminho /chat.');
}
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
      `$1\n<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="referrer" content="no-referrer">`+
      (managedApi?`\n<meta name="percia-managed-api" content="${managedApi.href}">`:''),
    );
    await writeFile(new URL(filename, destination), html);
    continue;
  }

  await writeFile(new URL(filename, destination), new Uint8Array(await response.arrayBuffer()));
}

console.log('Site estático pronto em dist/neutral-site.');

