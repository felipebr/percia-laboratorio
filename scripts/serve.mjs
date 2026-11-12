import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import {createHandler} from '../dist/server/index.js';
const handle=createHandler();
const port=Number(process.env.PERCIA_PORT||4173);
const host='127.0.0.1';
createServer(async (req,res)=>{
  try{
    const headers=new Headers();
    for(const [k,v] of Object.entries(req.headers)){if(v)headers.set(k,Array.isArray(v)?v.join(', '):v);}
    const init={method:req.method,headers};
    if(req.method==='POST')Object.assign(init,{body:Readable.toWeb(req),duplex:'half'});
    const result=await handle(new Request('http://'+host+':'+port+req.url,init));
    res.writeHead(result.status,Object.fromEntries(result.headers));
    if(result.body)Readable.fromWeb(result.body).pipe(res);
    else res.end();
  }catch{res.writeHead(500,{'content-type':'text/plain; charset=utf-8'});res.end('Não foi possível atender a solicitação.');}
}).listen(port,host,()=>console.log('percIA: http://'+host+':'+port));

