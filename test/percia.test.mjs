import test from 'node:test';
import assert from 'node:assert/strict';
import {TOPICS,grounded,crisisFor,possiblePersonal,modelRequest,directModelRequest} from '../src/core.mjs';
import {createHandler} from '../dist/server/index.js';
const topic=(id)=>TOPICS.find(t=>t.id===id).prompt;
const request=(input,headers={})=>new Request('https://percia.test/api/chat',{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(input)});
const base={provider:'mistral',model:'mistral-teste',key:'CHAVE-SINTETICA',messages:[{role:'user',content:topic('bpc')}]};
test('os oito casos integrados abrem a ficha correspondente',()=>{
  for(const t of TOPICS){const r=grounded(t.prompt);assert.deepEqual(r.topics,[t.id],t.id);assert.ok(r.sources.length,t.id);}
  assert.match(grounded(topic('bpc')).text,/135.*|30 dias/s);
  assert.match(grounded(topic('iptu')).text,/não dão, por si só/);
  assert.match(grounded(topic('aposentadoria')).text,/15 anos/);
  assert.match(grounded(topic('cidade')).text,/Ouvidoria-Geral/);
  assert.match(grounded(topic('discriminacao')).text,/100/);
  assert.match(grounded(topic('assistencia')).text,/mesmo sem documentos/);
  assert.match(grounded(topic('ambiente')).text,/193/);
});
test('negativa, leitura fácil, documentos e jurisdição têm caminhos diferentes',()=>{
  assert.match(grounded('Meu BPC foi negado, explique mais fácil').text,/Primeiro, veja por quê/);
  assert.match(grounded('Quais documentos?',{context:'iptu'}).text,/conta de água ou luz/);
  assert.match(grounded('Moro em Ananindeua e preciso de isenção de IPTU.').text,/contatos locais desta ficha são de Belém/);
  assert.match(grounded('Meu pedido de BPC foi negado e estou sem comida hoje').text,/começar por comida/);
  assert.match(grounded('Fui impedida de entrar porque uso cadeira de rodas, aconteceu ontem.').text,/100/);
});
test('risco imediato tem o número certo na primeira linha',()=>{
  for(const [s,risk,num] of [['Vou me machucar agora','self','192'],['Meu agressor está na porta agora','violence','190'],['Minha casa está alagando','flood','193'],['Ela não está respirando','health','192'],['Minha vizinha com deficiência está sozinha sem cuidador hoje','neglect','190']]){
    assert.equal(crisisFor(s),risk,s);assert.match(grounded(s).text.split('\n')[0],new RegExp(num));
  }
  assert.match(grounded('Não aguento mais').text,/188/);
  assert.match(grounded('Ela está segura agora, ficou sem o cuidado que precisa.').text,/100/);
  assert.equal(crisisFor('Me discriminaram ontem, não estou em perigo agora.'),'');
  assert.equal(crisisFor('Não consigo','self'),'self'); 
});
test('detecção mínima de identificadores evita CPF ou e-mail',()=>{
  assert.equal(possiblePersonal('CPF: 000.000.000-00'),true);
  assert.equal(possiblePersonal('endereço exemplo@exemplo.invalid'),true);
  assert.equal(possiblePersonal('Posso ligar 135 ou 129?'),false);
});
test('o proxy envia apenas ao provedor escolhido e não repete a chave',async()=>{
  let seen;
  const handler=createHandler(async (url,opts)=>{seen={url,opts};return Response.json({choices:[{message:{content:'Abra a decisão no Meu INSS.'}}]});});
  const res=await handler(request(base));const body=await res.json();
  assert.equal(res.status,200);
  assert.equal(body.answer,'Abra a decisão no Meu INSS.');
  assert.equal(seen.url,'https://api.mistral.ai/v1/chat/completions');
  assert.equal(seen.opts.headers.authorization,'Bearer CHAVE-SINTETICA');
  assert.equal(seen.opts.redirect,'error');
  const upstream=JSON.parse(seen.opts.body);
  assert.match(upstream.messages[0].content,/FICHAS CONFERIDAS/);
  assert.ok(!JSON.stringify(body).includes(base.key));
  assert.equal(res.headers.get('cache-control'),'no-store');
});
test('crise, identificadores e endereços personalizados não são encaminhados pelo proxy',async()=>{
  let calls=0;const handler=createHandler(async()=>{calls++;return Response.json({});});
  const danger=await handler(request({...base,messages:[{role:'user',content:'Quero me matar agora, meu CPF é 000.000.000-00'}]}));
  assert.equal((await danger.json()).risk,'self');
  assert.equal((await handler(request({...base,messages:[{role:'user',content:'Meu BPC e CPF: 000.000.000-00'}]}))).status,400);
  assert.equal((await handler(request({...base,provider:'custom',url:'https://example.invalid/'}))).status,400);
  assert.equal((await handler(request(base,{origin:'https://example.invalid'}))).status,403);
  assert.equal(calls,0);
});
test('proxy permite teste mínimo e oculta respostas de erro brutas',async()=>{
  const handler=createHandler(async (_url,opts)=>{assert.match(opts.body,/Responda apenas/);return Response.json({private:'segredo upstream'},{status:401});});
  const response=await handler(request({...base,test:true}));
  assert.equal(response.status,401);
  assert.doesNotMatch(await response.text(),/segredo upstream|CHAVE-SINTETICA/);
  const shape=modelRequest({provider:'anthropic',key:'CHAVE-SINTETICA',model:'modelo'},base.messages,['bpc'],true);
  assert.equal(shape.headers['x-api-key'],'CHAVE-SINTETICA');
  assert.match(shape.body.system,/Modo leitura fácil/);
  assert.equal(shape.body.messages[0].role,'user');
});
test('modo publicado usa o destino direto e separa os dois formatos de API',()=>{
  const anthropic=directModelRequest({provider:'anthropic',model:'teste',key:'SINTETICA'},base.messages,['bpc'],false,true);
  assert.equal(anthropic.url,'https://api.anthropic.com/v1/messages');
  assert.equal(anthropic.headers['anthropic-dangerous-direct-browser-access'],'true');
  assert.equal(anthropic.body.system,'Responda apenas OK.');
  const custom=directModelRequest({provider:'custom',url:'https://example.invalid/v1/chat/completions',model:'teste',key:'SINTETICA'},base.messages,['bpc'],false,false);
  assert.equal(custom.url,'https://example.invalid/v1/chat/completions');
  assert.match(custom.body.messages[0].content,/FICHAS CONFERIDAS/);
});
test('página, JavaScript e CSS têm os tipos e cabeçalhos esperados',async()=>{
  const handler=createHandler();
  const result=await handler(new Request('https://percia.test/'));
  assert.match(result.headers.get('content-type'),/text\/html/);
  assert.match(result.headers.get('content-security-policy'),/script-src 'self'/);
  assert.match(await result.text(),/Ajuda imediata/);
  assert.equal((await handler(new Request('https://percia.test/app.js'))).status,200);
  assert.equal((await handler(new Request('https://percia.test/style.css'))).status,200);
  const zip=await handler(new Request('https://percia.test/percia-prototipo.zip'));
  assert.equal(zip.headers.get('content-type'),'application/zip');
  assert.equal(new DataView(await zip.arrayBuffer()).getUint32(0,true),0x04034b50);
});

