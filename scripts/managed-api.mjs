import {createHandler, safeBody} from '../dist/server/index.js';

const model = 'qwen/qwen3.8-27b';
const unavailable = 'A IA da percIA está temporariamente indisponível.';
const quota = 'A cota da IA está temporariamente ocupada.';
const second = 1000;
const minute = 60 * second;
const day = 24 * 60 * minute;

export function createManagedHandler({key, publicOrigin, upstream=fetch, now=Date.now}) {
  const ready = Boolean(key && publicOrigin);
  let inFlight = 0;
  let minuteSlot = -1;
  let dailySlot = -1;
  let minuteCount = 0;
  let dailyCount = 0;
  const clients = new Map();

  function reply(body, status, cors=false) {
    const headers = new Headers({
      'cache-control':'no-store',
      'x-content-type-options':'nosniff',
      'content-type':'application/json; charset=utf-8',
      'vary':'Origin',
    });
    if (cors) {
      headers.set('access-control-allow-origin', publicOrigin);
      headers.set('access-control-allow-methods', 'POST, OPTIONS');
      headers.set('access-control-allow-headers', 'content-type');
    }
    return new Response(body===null?null:JSON.stringify(body), {status, headers});
  }

  function permit(client) {
    const currentMinute = Math.floor(now()/minute);
    const currentDay = Math.floor(now()/day);
    if (minuteSlot !== currentMinute) {
      minuteSlot = currentMinute;
      minuteCount = 0;
      clients.clear();
    }
    if (dailySlot !== currentDay) {
      dailySlot = currentDay;
      dailyCount = 0;
    }
    const count = clients.get(client)??0;
    if (minuteCount>=6 || dailyCount>=150 || count>=3 || inFlight>=3) return false;
    clients.set(client,count+1);
    minuteCount++;
    dailyCount++;
    return true;
  }

  return async function handle(request, client='unknown') {
    const path = new URL(request.url).pathname;
    if (path==='/healthz' && request.method==='GET') return reply({ready},200);
    if (path!=='/chat') return reply({error:'Página não encontrada.'},404);
    if (!publicOrigin || request.headers.get('origin')!==publicOrigin) return reply({error:'Origem não autorizada.'},403);
    if (request.method==='OPTIONS') return reply(null,204,true);
    if (request.method!=='POST') return reply({error:'Método não aceito.'},405,true);
    if (!ready) return reply({error:unavailable},503,true);
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')??'')) return reply({error:'Formato inválido.'},415,true);
    let input;
    try {
      input = await safeBody(request, 18000);
    } catch {
      return reply({error:'Mensagem inválida.'},400,true);
    }
    const messages = input?.messages;
    if (!Array.isArray(messages) || messages.length>5) return reply({error:'Conversa inválida.'},400,true);

    let throttled = false;
    const guardedUpstream = async (url, options) => {
      if (!permit(client)) {
        throttled = true;
        return new Response(null,{status:429});
      }
      inFlight++;
      try {
        return await upstream(url, {...options,signal:AbortSignal.any([request.signal,options.signal])});
      } finally {
        inFlight--;
      }
    };
    const result = await createHandler(guardedUpstream)(new Request('http://percia.internal/api/chat',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({provider:'groq',key,model,messages,easy:input.easy===true}),
    }));
    if (throttled || result.status===429 || result.status===402) return reply({error:quota},429,true);
    if (!result.ok) return reply({error:result.status===400?'Mensagem inválida.':unavailable},result.status===400?400:503,true);
    const response = await result.json();
    if (typeof response.answer==='string') {
      if (response.answer.includes(key)) return reply({error:unavailable},503,true);
      return reply({answer:response.answer,model},200,true);
    }
    return reply(response,200,true);
  };
}

