import assert from 'node:assert/strict';
import test from 'node:test';
import {createManagedHandler} from '../scripts/managed-api.mjs';

const origin = 'https://site.example';
const key = 'segredo-sintetico-de-teste';
const question = {role:'user',content:'Meu BPC foi negado, como eu recorro?'};
const chat = (body,from=origin) => new Request('https://api.example/chat',{
  method:'POST',
  headers:{origin:from,'content-type':'application/json'},
  body:JSON.stringify(body),
});

test('IA do site usa somente o provedor fixo, protege o segredo e respeita a cota',async()=>{
  let calls=0;
  const handle = createManagedHandler({key,publicOrigin:origin,now:()=>123000,upstream:async(url,opts)=>{
    calls++;
    assert.equal(url,'https://api.groq.com/openai/v1/chat/completions');
    assert.equal(opts.headers.authorization,'Bearer '+key);
    const data=JSON.parse(opts.body);
    assert.equal(data.model,'qwen/qwen3.8-27b');
    assert.equal(data.messages.at(-1).content,question.content);
    return Response.json({choices:[{message:{content:'Consulte a decisão no Meu INSS.'}}]});
  }});
  assert.equal((await handle(chat({messages:[question]},'https://elsewhere.example'))).status,403);
  const sensitive = await handle(chat({messages:[{role:'user',content:'Meu BPC foi negado. CPF 000.111.222-33.'}]}));
  assert.equal(sensitive.status,400);
  const risk = await handle(chat({messages:[{role:'user',content:'Vou me machucar agora.'}]}));
  assert.equal((await risk.json()).local,true);
  assert.equal(calls,0);
  for (let i=0;i<3;i++) {
    const response = await handle(chat({messages:[question],provider:'custom',key:'outro',test:true}),'visitor');
    assert.equal(response.status,200);
    assert.equal(response.headers.get('access-control-allow-origin'),origin);
    const body = await response.text();
    assert.match(body,/Meu INSS/);
    assert.doesNotMatch(body,/segredo-sintetico/);
  }
  assert.equal((await handle(chat({messages:[question]}),'visitor')).status,429);
  assert.equal(calls,3);
});

test('servidor publicado sem chave preserva a indicação de indisponibilidade',async()=>{
  const handle = createManagedHandler({publicOrigin:origin,upstream:()=>assert.fail('Chamou o provedor')});
  assert.deepEqual(await (await handle(new Request('https://api.example/healthz'))).json(),{ready:false});
  assert.equal((await handle(chat({messages:[question]}))).status,503);
});

