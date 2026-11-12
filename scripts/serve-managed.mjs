import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {createManagedHandler} from './managed-api.mjs';

const key = process.env.GROQ_API_KEY?.trim();
const origin = process.env.PERCIA_PUBLIC_ORIGIN?.trim();
const publicOrigin = origin ? new URL(origin).origin : '';
const handle = createManagedHandler({key,publicOrigin});
const port = Number(process.env.PORT||10000);

createServer({requestTimeout:35000}, async (req,res)=>{
  const controller = new AbortController();
  res.once('close',()=>controller.abort());
  try {
    const headers = new Headers();
    for (const [name,value] of Object.entries(req.headers)) {
      if (value) headers.set(name, Array.isArray(value)?value.join(', '):value);
    }
    const init = {method:req.method,headers,signal:controller.signal};
    if (req.method==='POST') Object.assign(init,{body:Readable.toWeb(req),duplex:'half'});
    const client = headers.get('x-forwarded-for')?.split(',').at(-1)?.trim().slice(0,80) || req.socket.remoteAddress;
    const response = await handle(new Request('http://percia.internal'+req.url,init),client);
    if (res.destroyed) return;
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(response.body?Buffer.from(await response.arrayBuffer()):undefined);
  } catch {
    if (!res.destroyed) {
      res.writeHead(500,{'cache-control':'no-store','content-type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({error:'A IA da percIA está temporariamente indisponível.'}));
    }
  }
}).listen(port,'0.0.0.0',()=>console.log('API da percIA iniciada.'));

