import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {portableFiles,zip} from './zip.mjs';
const root=new URL('../',import.meta.url);
const read=(name)=>readFile(new URL(name,root),'utf8');
const [core,client,worker,index,css]=await Promise.all(['src/core.mjs','src/app.mjs','src/worker.mjs','src/index.html','src/style.css'].map(read));
const shared=core.replace(/\nexport \{[^}]+\};\s*$/,'\n');
if(shared===core)throw new Error('Exports do núcleo não foram encontrados.');
await mkdir(new URL('dist/server/',root),{recursive:true});
const portable=zip(await Promise.all(portableFiles.map(async name=>[name,await read(name)])));
await writeFile(new URL('dist/percia-prototipo.zip',root),portable);
const assets={index,css,js:shared+'\n'+client,zip:portable.toString('base64')};
await writeFile(new URL('dist/server/index.js',root),'const ASSETS = '+JSON.stringify(assets)+';\n'+shared+'\n'+worker);
console.log('percIA pronta em dist/server/index.js');

