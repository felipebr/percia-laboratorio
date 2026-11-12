# percIA — Laboratório de orientação

**Criado por Laryssa Sophia Cordeiro · 12 de novembro de 2026**

[Guia de instalação e publicação](LEIA-PRIMEIRO.md) · [Chaves gratuitas e segurança](CHAVES-E-SEGURANCA.md) · [Instruções para o Claude Code](PROMPT-CLAUDE-CODE.md)

Protótipo 0.1 do projeto de extensão *Em volta do capacitismo*, Direito/CESUPA, turma DI8NA, Belém (PA). Teste com casos fictícios. Nenhuma chave de API é incluída. A aplicação não precisa de conta para abrir.

## Começar

1. Instale Node.js 22 ou superior, se ainda não tiver.
2. Abra um terminal na pasta e rode `npm start`. Não é necessário instalar dependências.
3. Abra **http://127.0.0.1:4173**. Escolha um caso no menu ou escreva um relato fictício.
4. Para comparar respostas de um modelo, use **Configurar IA**, selecione seu provedor, informe o ID do modelo e uma chave de teste e confirme. O teste de conexão faz uma chamada curta que pode gerar cobrança.
5. Use **Registrar problema nesta resposta** para copiar ou baixar um relato e enviar à equipe manualmente.

O modo sem chave usa fichas e regras locais. O modo com chave envia apenas texto fictício para o provedor escolhido, a cada chamada com parte da conversa atual. Respostas do modelo podem variar e devem ser conferidas. Em sinais de urgência reconhecidos, o aplicativo mostra contatos locais da interface sem enviar a mensagem à API. O botão Ajuda imediata funciona sempre.

### Provedores e privacidade

O site publicado chama Gemini, Mistral, Groq, OpenRouter, DeepSeek, Together AI, OpenAI API e Anthropic API diretamente do navegador. Só o provedor recebe a chave e as mensagens. A configuração fica em memória até recarregar ou desconectar; a percIA não grava a chave ou a conversa. O provedor pode registrar as solicitações conforme as regras dele. Cada provedor precisa aceitar chamadas de navegador; contas com políticas especiais podem bloqueá-las. Na versão local, os provedores da lista são chamados pelo servidor no seu computador, sem depender de CORS.

Para outras APIs com a interface Chat Completions, informe a URL HTTPS completa e o ID do modelo. O navegador chama diretamente o provedor personalizado, que precisa permitir solicitações de navegador (CORS). APIs com outros formatos, autenticação especial ou bloqueio de navegador precisam de um adaptador. O servidor não aceita endereços arbitrários de destino. Use chave exclusiva de teste, com limite baixo, e confira o destinatário.

O detector de dados pessoais é apenas uma barreira básica. Não é um anonimimizador nem libera o envio de casos reais. A equipe deve revisar dados combinados, fotos, metadados e anexos antes de qualquer tratamento. O protótipo não recebe anexos, não envia relatos para terceiros e não tem coleta de conversas.

## Passar para a equipe e continuar no Claude

Compartilhe o ZIP. No Claude, abra um novo projeto ou conversa e forneça os arquivos do ZIP (extraia antes, se a interface exigir). Comece pelo README e por `src/core.mjs`. A aplicação continua independente do login e do modelo usado para editar o código.

- `src/core.mjs`: fichas, links oficiais, regras de crise, encaminhamentos e construção do contexto dos modelos.
- `src/index.html`, `src/style.css`, `src/app.mjs`: experiência de teste.
- `src/worker.mjs`: servidor e chamadas aos provedores listados.
- `test/percia.test.mjs`: testes de fichas, urgência, privacidade e conexão simulada.
- `VALIDACAO.md`: tarefas de revisão antes de atendimentos reais.

`npm test` verifica os casos e o proxy com serviços simulados. `npm run build` gera `dist/server/index.js`, um Worker ESM sem dependências. Para publicar por conta própria, aponte um serviço compatível com Cloudflare Workers para esse arquivo, ou use o servidor local Node como ponto de partida. O pacote portátil não inclui o ID de hospedagem. Para incorporar, use a URL HTTPS numa moldura com título, se o serviço de hospedagem e o site de destino permitirem: `<iframe src="URL_DO_SITE" title="percIA — Laboratório de orientação" width="100%" height="830"></iframe>`. Abra em página própria se o navegador restringir área de transferência ou se a tela for pequena.

