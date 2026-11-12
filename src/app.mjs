const $=(id)=>document.getElementById(id);
const icons={
 brand:'<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M12 7v6m-3-3h6"/>',
 heart:'<path d="M20.8 8.6c0 4.1-4.6 7.5-8.8 10.4-4.2-2.9-8.8-6.3-8.8-10.4a4.5 4.5 0 0 1 8.8-1.1 4.5 4.5 0 0 1 8.8 1.1Z"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><path d="M9 4v4m6 2v4m-6 2v4"/>',
 benefit:'<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 10h4m-4 4h8m2-4h.01"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
 home:'<path d="m3.5 10 8.5-6.5 8.5 6.5M6 9v11h12V9m-8 11v-6h4v6"/>',
 bus:'<rect x="5" y="4" width="14" height="15" rx="3"/><path d="M5 11h14M8 19v2m8-2v2M8 15h.01m8 0h.01"/>',
 shield:'<path d="M12 3.5c2.5 2 5.2 2.8 7.5 3v5.2c0 4.6-3.2 7.3-7.5 9.1-4.3-1.8-7.5-4.5-7.5-9.1V6.5c2.3-.2 5-1 7.5-3Z"/><path d="m9 12 2 2 4-4"/>',
 people:'<circle cx="10" cy="7" r="2.5"/><path d="M4.5 19v-2a5.5 5.5 0 0 1 11 0v2m2-14a2.5 2.5 0 0 1 0 5m.5 3a4.5 4.5 0 0 1 2.5 4v2"/>',
 rain:'<path d="M6 15a4 4 0 1 1 1-7.8 5 5 0 0 1 9.5 1.5A3.2 3.2 0 1 1 18 15H6m3 2-1 3m5-3-1 3m5-3-1 3"/>',
 bolt:'<path d="M13 3 5 14h6l-1 7 9-12h-6V3Z"/>',
 book:'<path d="M3.5 5.5c3-1 6-.5 8.5 1.5 2.5-2 5.5-2.5 8.5-1.5v13c-3-1-6-.5-8.5 1.5-2.5-2-5.5-2.5-8.5-1.5v-13ZM12 7v13"/>',
 flag:'<path d="M5 21V4m0 1c5-3 9 3 14 0v9c-5 3-9-3-14 0"/>',
 type:'<path d="m3 17 4-10 4 10m-6.5-4h5m6.5 4v-4a2 2 0 0 1 4 0v4m0-2h-2.5a1 1 0 0 0 0 2H20"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrowUp:'<path d="M12 20V4m-6 6 6-6 6 6"/>',
 lock:'<rect x="5.5" y="10" width="13" height="10" rx="2"/><path d="M8 10V8a4 4 0 0 1 8 0v2m-4 4v2"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 right:'<path d="m9 5 7 7-7 7"/>'
};
function draw(root=document){root.querySelectorAll('[data-icon]').forEach(e=>{
  if(!e.firstElementChild&&Object.hasOwn(icons,e.dataset.icon))e.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+icons[e.dataset.icon]+'</svg>';
});}
function node(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function ico(name,cls){const e=node('span','',cls);e.dataset.icon=name;e.setAttribute('aria-hidden','true');return e;}
const panel=$('panel');
const out=$('messages');
const localServer=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
let easy=false,config=null,history=[],context='',previousCrisis='',lastReport=null,version=0,pending=null,connectionAttempt=null,waiting=false;
const urgent='Não aguento mais e acho que vou me machucar agora. O que eu faço?';
const shortLabel={bpc:'Meu BPC foi negado',cidade:'Falta acessibilidade',cuidado:'Preciso de apoio'};
const officialOnly=(url)=>{const a=node('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
function sourceList(ids) {
  const ul=node('ul','','source-list');
  for(const id of new Set(ids)){
    if(!Object.hasOwn(SOURCES,id))continue;
    const [label,href]=SOURCES[id];const li=node('li');const a=officialOnly(href);a.textContent=label;li.append(a);ul.append(li);
  }
  return ul;
}
function updateMode(){ $('mode').textContent=config?'IA: '+PROVIDERS[config.provider].label:'Modo sem chave';$('settings').title=config?'Alterar conexão com a IA':'Configurar IA'; }
function status(s){$('status').textContent=s;}
function scrollMessages(){$('viewport').scrollTop=$('viewport').scrollHeight;}
function renderMessage(role,s,opts={}) {
  const m=node('article','',('message '+role+(opts.risk?' risk':'')));
  m.append(node('p',role==='user'?'Você':opts.risk?'percIA · Ajuda imediata':opts.remote?'percIA · Resposta da IA':'percIA · Ficha de orientação','message-meta'),node('p',s,'message-text'));
  if(opts.sources?.length){const d=node('details');d.append(node('summary','Ver fontes oficiais'),sourceList(opts.sources));m.append(d);}
  if(role==='assistant'){
    const b=node('button','Registrar problema nesta resposta','textbutton');b.type='button';
    const controls=node('div','','msg-actions');controls.append(b);
    const entry={answer:s,mode:opts.remote&&config?PROVIDERS[config.provider].label:'Ficha da percIA',model:opts.remote&&config?config.model:'',topic:opts.topics?.map(x=>TOPICS.find(t=>t.id===x)?.label).filter(Boolean).join(', ')||(opts.risk?'Urgência':'Conversa')};
    lastReport=entry;b.addEventListener('click',()=>report(entry));
    if(opts.topics?.length===1&&!opts.risk&&!opts.fixed){
      const prep=node('button','Preparar atendimento','textbutton');prep.type='button';
      const t=TOPICS.find(x=>x.id===opts.topics[0]);
      prep.addEventListener('click',()=>{openPanel('Preparar atendimento',[
        node('p','Você pode dizer: “Preciso de orientação sobre '+t.label.toLowerCase()+'. Pode me explicar qual é o primeiro passo e onde eu faço o pedido?”'),
        node('p','Pergunte se precisa agendar, o que deve levar e como acompanhar. Peça um número de protocolo, se houver.'),
        node('p','Use este roteiro como apoio. Ele não substitui a análise do serviço nem os documentos oficiais.')
      ]);});controls.append(prep);
    }
    m.append(controls);
  }
  $('welcome').hidden=true;
  out.append(m);scrollMessages();return m;
}
function openPanel(title,children) {
  $('panel-title').textContent=title;$('panel-body').replaceChildren(...children);
  if(!panel.open)panel.showModal();draw(panel);$('close').focus();
}
$('close').onclick=()=>panel.close();
panel.addEventListener('close',()=>{connectionAttempt?.abort();connectionAttempt=null;const key=$('key');if(key)key.value='';$('panel-body').replaceChildren();});
function help() {
  const h=node('div','','help-grid');
  for(const [num,label] of [['190','Polícia: violência ou perigo agora'],['192','SAMU: emergência de saúde'],['193','Bombeiros: incêndio ou resgate'],['188','CVV: apoio emocional, 24 horas'],['180','Orientação sobre violência contra a mulher'],['100','Denúncia de violações de direitos']]){
    const a=node('a');a.href='tel:'+num;a.append(node('strong',num),node('span',label));h.append(a);
  }
  openPanel('Precisa de ajuda agora?',[
    node('p','Se você ou alguém está em perigo, ligue para o serviço de emergência. Não espere uma resposta do chat.'),h,sourceList(['cem','cemLibras','samu','bombeiros','cvv','disque'])
  ]);
}
function report(entry=lastReport) {
  if(!entry){openPanel('Registrar um problema',[node('p','Teste um caso fictício primeiro. Depois, escolha “Registrar problema nesta resposta”.')]);return;}
  const form=node('div','','form-stack');
  const lbl=node('label','O que deu errado?');const sel=node('select');
  for(const s of ['Informação errada','Difícil de entender','Linguagem capacitista','Encaminhamento de urgência','Outro'])sel.append(node('option',s));
  lbl.append(sel);
  const more=node('label','Observação opcional, sem dados pessoais');const area=node('textarea');area.maxLength=500;area.rows=3;more.append(area);
  const actions=node('div','','panel-actions');
  const copy=node('button','Copiar relato','button solid');copy.type='button';
  const download=node('button','Baixar relato','button');download.type='button';actions.append(copy,download);
  const state=node('p','','panel-status');state.setAttribute('role','status');
  function body(){
    if(possiblePersonal(area.value)){state.textContent='Retire o possível dado pessoal da observação.';return '';}
    return 'percIA — relato de teste fictício\nTema: '+entry.topic+'\nModo: '+entry.mode+(entry.model?' / '+entry.model:'')+'\nProblema: '+sel.value+'\n'+(area.value.trim()?'Observação: '+area.value.trim()+'\n':'')+'\nResposta observada:\n'+entry.answer+'\n';
  }
  copy.onclick=async()=>{const s=body();if(!s)return;try{await navigator.clipboard.writeText(s);state.textContent='Relato copiado. Você pode compartilhar com a equipe.';}catch{state.textContent='A cópia não está disponível. Use “Baixar relato”.';}};
  download.onclick=()=>{const s=body();if(!s)return;const url=URL.createObjectURL(new Blob([s],{type:'text/plain;charset=utf-8'}));const a=node('a');a.href=url;a.download='percia-relato.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);state.textContent='Relato preparado para baixar.';};
  form.append(lbl,more,actions,state);
  openPanel('Registrar um problema',[node('p','O relato inclui a resposta, o tema e o modo de teste. Ele só sai daqui se você compartilhar. Revise antes de enviar à equipe.'),form]);
}
function setup() {
  openPanel('Configurar IA',[$('connection-template').content.cloneNode(true)]);
  const sel=$('provider'),key=$('key'),model=$('model'),endpoint=$('endpoint'),note=$('route-note'),outcome=$('connection-status'),connect=$('connect'),consent=$('consent');
  for(const [id,p] of Object.entries(PROVIDERS)){const op=node('option',p.label);op.value=id;sel.append(op);}
  if(config){sel.value=config.provider;model.value=config.model;endpoint.value=config.url??'';outcome.textContent='Conexão ativa nesta aba. Preencha a chave para trocar.';}
  function change(){
    const id=sel.value;const custom=id==='custom';
    $('custom-wrap').hidden=!custom;endpoint.required=custom;model.placeholder=PROVIDERS[id].example;
    note.textContent=custom?'O navegador envia a chave e as mensagens diretamente para o endereço HTTPS que você informar. Use só um serviço de confiança. O serviço precisa aceitar chamadas de navegador (CORS).':localServer?'A chave e as mensagens passam pelo servidor local para chegar ao provedor escolhido. O provedor pode registrar chamadas conforme as regras dele.':'Seu navegador envia a chave e as mensagens diretamente para o provedor escolhido. A chave fica apenas na memória desta aba. O provedor pode registrar chamadas conforme as regras dele.';
  }
  sel.onchange=()=>{model.value='';consent.checked=false;change();};change();
  $('disconnect').onclick=()=>{connectionAttempt?.abort();pending?.abort();pending=null;++version;setWaiting(false);config=null;history=[];updateMode();panel.close();status('Você está no modo sem chave.');};
  $('connection').onsubmit=async(e)=>{
    e.preventDefault();if(connectionAttempt)return;
    const p={provider:sel.value,key:key.value.trim(),model:model.value.trim()};
    if(!p.key||!p.model||!consent.checked)return;
    if(p.provider==='custom'){
      try{
        const u=new URL(endpoint.value.trim());
        if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error();
        p.url=u.href;
      }catch{outcome.textContent='Informe uma URL HTTPS sem senha, parâmetros ou fragmento.';return;}
    }
    const controller=new AbortController();connectionAttempt=controller;connect.disabled=true;outcome.textContent='Testando a conexão…';
    try{
      await requestAI(p,[{role:'user',content:'Responda apenas: OK.'}],[],true,controller.signal);
      if(controller.signal.aborted)return;
      config=p;history=[];updateMode();panel.close();status('IA conectada nesta aba.');
    }catch(err){if(!controller.signal.aborted)outcome.textContent=err.message;}
    finally{if(connectionAttempt===controller)connectionAttempt=null;connect.disabled=false;}
  };
}
async function requestAI(p,messages,topics,test,signal) {
  const timeout=AbortSignal.timeout(31000);
  const combined=AbortSignal.any([signal,timeout]);
  const direct=!localServer||p.provider==='custom';
  try{
    let res;
    if(direct){
      const input=directModelRequest(p,messages,topics,easy,test);
      res=await fetch(input.url,{method:'POST',headers:input.headers,body:JSON.stringify(input.body),redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',signal:combined});
      if(!res.ok) throw new Error(res.status===401||res.status===403?'Chave recusada ou sem permissão.':res.status===429||res.status===402?'Limite de chamadas ou de saldo do provedor atingido.':'A API não aceitou a solicitação. Confira o ID do modelo, a chave e o endereço.');
      const text=unpack(await res.json());
      if(!text)throw new Error('A API não retornou texto no formato esperado.');
      if(!test&&possiblePersonal(text))throw new Error('A IA devolveu um possível dado pessoal. A resposta não foi exibida.');
      return {answer:text};
    }
    res=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...p,messages,easy,test}),redirect:'error',credentials:'omit',signal:combined});
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'A API não aceitou a solicitação.');
    return data;
  }catch(err){
    if(signal.aborted||timeout.aborted||err instanceof TypeError||err instanceof SyntaxError)throw new Error(direct?'Não foi possível chamar essa API no navegador. Confira a rede e se o provedor permite chamadas do site (CORS). Para os provedores da lista, você também pode testar no pacote local.':'Não foi possível conectar ao provedor. Confira a rede ou use as fichas.');
    throw err;
  }
}
function setWaiting(on){waiting=on;out.setAttribute('aria-busy',String(on));}
async function send(s) {
  s=s.trim().slice(0,1600);if(!s)return;
  let card=grounded(s,{easy,context,previousCrisis});
  if(waiting&&!card.risk)return;
  if(waiting){pending?.abort();++version;setWaiting(false);}
  status('');
  if(!card.risk&&possiblePersonal(s)){
    $('prompt').value='';$('prompt').focus();status('Parece haver um dado pessoal. O texto não foi enviado. Escreva um caso fictício sem esse dado.');return;
  }
  $('prompt').value='';$('prompt').focus();
  renderMessage('user',card.risk&&possiblePersonal(s)?'Mensagem de urgência com possível dado pessoal ocultado.':s);
  if(card.risk) {previousCrisis=card.risk;history=[];renderMessage('assistant',card.text,card);return;}
  previousCrisis='';
  if(card.topics.length===1)context=card.topics[0];
  if(!config||card.fixed||!card.topics.length){renderMessage('assistant',card.text,card);return;}
  const active=config;
  const messages=[...history.slice(-8),{role:'user',content:s}];
  const ticket=++version;
  const controller=new AbortController();pending=controller;
  setWaiting(true);status('Aguardando resposta da IA…');
  try{
    const result=await requestAI(active,messages,card.topics,false,controller.signal);
    if(ticket!==version)return;
    if(result.local){
      card=result;status('');renderMessage('assistant',card.text,card);
    }else{
      if(!result.answer)throw new Error('A IA não retornou uma resposta.');
      if(active===config)history=[...messages,{role:'assistant',content:result.answer}].slice(-8);
      status('');renderMessage('assistant',result.answer,{...card,remote:true});
    }
  }catch(err){if(ticket===version){status(err.message+' Mostrando a ficha da percIA.');renderMessage('assistant',card.text,card);}}
  finally{if(ticket===version){pending=null;setWaiting(false);scrollMessages();}}
}
function reset(){
  pending?.abort();pending=null;++version;history=[];context='';previousCrisis='';lastReport=null;
  out.replaceChildren();$('welcome').hidden=false;$('prompt').value='';setWaiting(false);status('Nova conversa.');$('prompt').focus();$('viewport').scrollTop=0;
}
for(const t of TOPICS){
  const b=node('button','','scenario');b.type='button';b.append(ico(t.icon),node('span',t.label),ico('right','chev'));b.onclick=()=>send(t.prompt);$('scenarios').append(b);
  if(shortLabel[t.id]){
    const q=node('button');q.type='button';q.append(ico(t.icon),node('span',shortLabel[t.id]));q.onclick=()=>send(t.prompt);$('quick').append(q);
  }
}
$('compose').onsubmit=(e)=>{e.preventDefault();void send($('prompt').value);};
$('prompt').onkeydown=(e)=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&!e.isComposing){e.preventDefault();void send($('prompt').value);}};
$('settings').onclick=setup;$('help').onclick=help;$('report').onclick=()=>report();
$('reset').onclick=reset;$('urgent-case').onclick=()=>send(urgent);
$('easy').onclick=()=>{easy=!easy;$('easy').setAttribute('aria-pressed',String(easy));document.body.classList.toggle('easy',easy);status(easy?'Leitura fácil ligada para as próximas respostas.':'Leitura fácil desligada.');};
$('library').onclick=()=>openPanel('Base e fontes oficiais',[node('p','Fichas conferidas em '+VERIFIED+'. A base inclui canais nacionais e serviços de Belém, no Pará. A orientação é geral. Confirme com o órgão antes de ir.'),node('p','O modo sem chave usa fichas prontas. No modo com IA, a resposta pode variar. Confira as fontes abaixo.'),sourceList(Object.keys(SOURCES))]);
draw();

