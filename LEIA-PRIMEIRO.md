# percIA — guia de instalação, teste e publicação

Este pacote contém o laboratório da percIA, do projeto de extensão Em volta do capacitismo, do curso de Direito do CESUPA. A aplicação pode rodar no computador ou ser publicada em um endereço próprio. As fichas e os casos fictícios funcionam sem login e sem chave de API.

- [Instrução pronta para colar no Claude Code](PROMPT-CLAUDE-CODE.md)
- [Como escolher, criar e usar a chave de API](CHAVES-E-SEGURANCA.md)

## Teste rápido no computador

Extraia a pasta, abra um terminal onde está o `package.json` e rode `npm start` com Node.js 22 ou superior. Abra `http://127.0.0.1:4173` e escolha um caso fictício.

## 1. Preparar o código

1. Extraia este ZIP. Dentro da pasta `percia-laboratorio` devem aparecer `package.json`, `wrangler.jsonc`, `src/`, `scripts/` e `test/`.
2. Crie um repositório privado no seu GitHub, por exemplo `percia-laboratorio`. Adicione o conteúdo **da pasta** `percia-laboratorio` na raiz do repositório, mantendo `src/`, `scripts/`, `test/` e `.gitignore`. O arquivo `package.json` deve ficar ao lado de `wrangler.jsonc`. Se usar GitHub Desktop, clone o repositório que acabou de criar, copie os arquivos para a pasta clonada, faça o commit e envie com **Push origin**.
3. Abra [Claude Code na web](https://claude.ai/code), autorize o acesso ao seu GitHub e selecione o repositório. Use o texto de `PROMPT-CLAUDE-CODE.md` na sessão. O Claude pode rodar os testes e explicar o código com a sua assinatura, conforme os recursos do plano. [Claude Code na nuvem](https://support.claude.com/en/articles/12618689-use-claude-code-in-the-cloud)
4. Se o Claude propuser alterações, confira o diff antes de incorporar. Para reproduzir o original, basta usar o conteúdo já entregue. A assinatura Claude serve para trabalhar no código. A publicação e a API do chatbot têm contas e limites próprios. [Cobrança da API do Claude](https://support.claude.com/en/articles/9876003-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan)

## 2. Publicar uma cópia na sua conta

O pacote inclui a configuração para publicar o mesmo código num **Cloudflare Worker**. O plano Workers Free tem limites de uso. A publicação gera um endereço próprio `workers.dev`, que pode ser compartilhado. [Plano Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) · [Endereços workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

**Pelo painel da Cloudflare**

1. Entre na sua conta em [Cloudflare Dashboard](https://dash.cloudflare.com/). Em **Workers & Pages**, escolha **Create application** e a opção de conectar o GitHub ou importar um repositório. Autorize apenas o repositório da percIA.
2. Selecione o repositório e a branch `main`. Use o nome `percia-laboratorio`. Se escolher outro nome, troque também o campo `name` de `wrangler.jsonc`. Deixe a raiz do projeto como `/` se `package.json` estiver na raiz do GitHub.
3. Em **Build command**, use `npm run build`. Em **Deploy command**, use `npx --yes wrangler@4.160.1 deploy`. Use Node.js 22 ou superior. Se precisar definir a versão no painel, adicione a variável de build `NODE_VERSION=22`. O arquivo `wrangler.jsonc` aponta para `dist/server/index.js`, gerado pelo build. [Configuração do Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [Integração com GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)
4. Clique para publicar e copie a URL de produção exibida. Na configuração entregue, as URLs de prévia ficam desativadas. Abra o endereço de produção em uma aba anônima para conferir que a equipe consegue acessar. Durante os testes, compartilhe só com a equipe. O endereço é público e pode ser encaminhado.

**Pelo terminal, se preferir**

Abra o terminal na pasta que contém `package.json`, com Node.js 22 ou superior. Autentique-se no navegador quando o Wrangler solicitar, usando sua conta Cloudflare.

```sh
npm test
npx --yes wrangler@4.160.1 login
npx --yes wrangler@4.160.1 deploy
```

`npm test` também gera o arquivo do Worker. Se quiser abrir o projeto no seu computador, use `npm start` e acesse `http://127.0.0.1:4173`. [Primeiros passos com Wrangler](https://developers.cloudflare.com/workers/get-started/guide/)

## 3. Conferir a publicação

1. Abra o novo endereço em aba anônima. Escolha **BPC negado**. A ficha deve orientar sobre Meu INSS e mostrar as fontes.
2. Selecione **Testar uma urgência**. A mensagem simulada deve mostrar o 192 sem pedir chave.
3. Clique em **Baixar código do protótipo (ZIP)** e confira se o download abre.
4. Para testar uma IA com cota gratuita, escolha **Groq** e tente o modelo `qwen/qwen3.8-27b`. Crie uma chave própria no painel da Groq, cole somente no campo **Chave de API**, marque o aviso e clique em **Testar e conectar**. Depois escolha um caso fictício e confira se aparece **Resposta da IA**.
5. Recarregue a página. Ela deve voltar a **Modo sem chave**. Para encerrar sem recarregar, abra **Configurar IA** e escolha **Usar sem chave**.
6. Se houver divergência, use **Registrar problema nesta resposta**. Leia o relato antes de compartilhar com a equipe.

Uma sessão do Claude Code pode preparar e revisar o código. O Worker fornece o endereço público independente. As regras de compartilhamento dos Artifacts do Claude variam pelo plano, por isso este roteiro usa o Worker para oferecer acesso sem login. [Compartilhamento de Artifacts](https://support.claude.com/en/articles/9547008-share-artifacts)

