import {deflateRawSync} from 'node:zlib';
export const portableFiles=[
  'README.md','LEIA-PRIMEIRO.md','CHAVES-E-SEGURANCA.md','PROMPT-CLAUDE-CODE.md','VALIDACAO.md',
  '.gitignore','package.json','wrangler.jsonc',
  'src/core.mjs','src/worker.mjs','src/app.mjs','src/style.css','src/index.html',
  'scripts/build.mjs','scripts/build-static.mjs','scripts/zip.mjs','scripts/serve.mjs',
  'scripts/managed-api.mjs','scripts/serve-managed.mjs',
  'test/percia.test.mjs','test/managed.test.mjs',
];
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(0xedb88320&-(crc&1));
  }
  return (crc^0xffffffff)>>>0;
}
export function zip(files) {
  const chunks=[],directory=[];
  let offset=0;
  const dosDate=((2026-1980)<<9)|(11<<5)|11;
  for(const [name,value] of files) {
    const filename=Buffer.from('percia-laboratorio/'+name),data=Buffer.from(value),compressed=deflateRawSync(data),crc=crc32(data);
    const local=Buffer.alloc(30),central=Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt16LE(dosDate,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(filename.length,26);
    central.writeUInt32LE(0x02014b50);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt16LE(dosDate,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(filename.length,28);central.writeUInt32LE(offset,42);
    chunks.push(local,filename,compressed);directory.push(central,filename);offset+=local.length+filename.length+compressed.length;
  }
  const table=Buffer.concat(directory),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(table.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...chunks,table,end]);
}

