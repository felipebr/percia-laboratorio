const HEADERS={
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'permissions-policy':'camera=(), microphone=(), geolocation=()',
  'cache-control':'no-store',
  'content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https:; base-uri 'none'; form-action 'none'; frame-ancestors *"
};
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:{...HEADERS,'content-type':'application/json; charset=utf-8'}});
const staticResponse=(body,type)=>new Response(body,{headers:{...HEADERS,'content-type':type}});
const errors={
  input:'Confira o provedor, o modelo e a chave.',
  auth:'O provedor recusou a chave ou o acesso a esse modelo. Confira as permissões.',
  quota:'O provedor limitou a chamada. Confira o saldo, a cota ou tente mais tarde.',
  model:'O provedor não encontrou ou não aceitou esse modelo. Confira o ID no painel.',
  blocked:'O provedor não respondeu como esperado. Você pode seguir com as fichas.',
  net:'Não foi possível falar com o provedor agora. Você pode seguir com as fichas.',
  personal:'Parece haver um dado pessoal. Remova o dado e use um caso fictício.'
};
async function safeBody(req,max=24000) {
  if(!req.body || +(req.headers.get('content-length')||0)>max) throw new Error('size');
  const reader=req.body.getReader();
  const decoder=new TextDecoder();let size=0,s='';
  try {
    for(;;){const {done,value}=await reader.read();if(done) break;size+=value.byteLength;if(size>max) throw new Error('size');s+=decoder.decode(value,{stream:true});}
    return JSON.parse(s+decoder.decode());
  } finally {void reader.cancel().catch(()=>{});}
}
async function proxy(req,url,fetchUpstream) {
  const origin=req.headers.get('origin');
  if((origin && origin!==url.origin)|| !/^application\/json(?:;|$)/i.test(req.headers.get('content-type')||'')) return json({error:errors.input},403);
  let b;try{b=await safeBody(req);}catch{return json({error:errors.input},400);}
  const {provider,key,model,messages,easy,test}=b??{};
  const p=typeof provider==='string'&&Object.hasOwn(PROVIDERS,provider)?PROVIDERS[provider]:null;
  if(!p?.url||typeof key!=='string'||!key||key.length>600||!/^[\x21-\x7e]+$/.test(key)||typeof model!=='string'||!model.trim()||model.length>160) return json({error:errors.input},400);
  let history;
  let topics=[];
  if(test===true) history=[{role:'user',content:'Responda apenas: OK.'}];
  else {
    if(!Array.isArray(messages)||!messages.length||messages.length>9||messages.length%2!==1||messages.some((m,i)=>m?.role!==(i%2===0?'user':'assistant')||typeof m.content!=='string'||!m.content.trim()||m.content.length>3600)) return json({error:errors.input},400);
    const latest=messages.at(-1).content;
    const risk=crisisFor(latest);
    if(risk) return json({local:true,...CRISIS[risk],risk});
    if(messages.some(m=>possiblePersonal(m.content))) return json({error:errors.personal},400);
    const previous=messages.slice(0,-1).filter(m=>m.role==='user').reverse().map(m=>topicsFor(m.content)[0]?.id).find(Boolean);
    const card=grounded(latest,{easy:!!easy,context:previous});
    if(card.fixed||!card.topics.length) return json({local:true,...card});
    topics=card.topics;
    history=messages.map(({role,content})=>({role,content}));
  }
  const input=modelRequest({provider,key,model:model.trim()},history,topics,!!easy);
  if(test===true) {
    if(p.anthropic) input.body.system='Responda apenas OK.';
    else input.body.messages[0].content='Responda apenas OK.';
  }
  try {
    const response=await fetchUpstream(p.url,{method:'POST',headers:input.headers,body:JSON.stringify(input.body),redirect:'error',signal:AbortSignal.timeout(28000)});
    if(!response.ok){
      void response.body?.cancel().catch(()=>{});
      const msg=response.status===401||response.status===403?errors.auth:response.status===429||response.status===402?errors.quota:response.status===400||response.status===404?errors.model:errors.blocked;
      return json({error:msg},response.status<500?response.status:502);
    }
    const answer=unpack(await response.json());
    if(!answer) return json({error:errors.blocked},502);
    if(test===true) return json({ok:true});
    if(possiblePersonal(answer)) return json({error:errors.blocked},502);
    return json({answer});
  } catch {return json({error:errors.net},502);}
}
function createHandler(upstream=(...args)=>fetch(...args),{proxyEnabled=true}={}) {
  return async function handle(req){
    const url=new URL(req.url);
    if(req.method==='POST'&&url.pathname==='/api/chat') return proxyEnabled?proxy(req,url,upstream):json({error:'No site publicado, a conexão vai direto ao provedor.'},404);
    if(!['GET','HEAD'].includes(req.method)) return json({error:'Método não aceito.'},405);
    const path=url.pathname;
    if(path==='/percia-prototipo.zip')return new Response(req.method==='HEAD'?null:Uint8Array.from(atob(ASSETS.zip),c=>c.charCodeAt(0)),{headers:{...HEADERS,'content-type':'application/zip','content-disposition':'attachment; filename="percia-prototipo.zip"'}});
    const entry=path==='/'?['index','text/html; charset=utf-8']:path==='/app.js'?['js','text/javascript; charset=utf-8']:path==='/style.css'?['css','text/css; charset=utf-8']:null;
    if(!entry) return json({error:'Página não encontrada.'},404);
    return staticResponse(req.method==='HEAD'?null:ASSETS[entry[0]],entry[1]);
  };
}
export {createHandler};
export default {fetch:createHandler(undefined,{proxyEnabled:false})};
