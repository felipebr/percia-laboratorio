# Chaves de API na percIA

Quem só quer testar as fichas abre o link, escolhe um caso e conversa em **Modo sem chave**. Quem quer comparar a resposta de um modelo usa **Configurar IA** e preenche três campos: provedor, ID do modelo e chave de API. A chave identifica a conta do provedor e pode consumir cota ou saldo. O custo da API vai para a conta que emitiu a chave.

## Qual chave usar

Opções conferidas em 11/11/2026, horário de Belém. Modelos, cotas e preços mudam. Confirme o que aparece na sua conta.

| Provedor na percIA | ID para testar | Custo e como começar |
|---|---|---|
| **Groq** | `qwen/qwen3.8-27b` | A Groq lista esse Qwen na cota gratuita. É um modelo da Alibaba servido pela API da Groq. Mantenha a conta no plano Free. Crie uma chave no [painel da Groq](https://console.groq.com/keys). Consulte os [limites gratuitos](https://console.groq.com/docs/rate-limits) e a [documentação do modelo](https://console.groq.com/docs/models). |
| **Google Gemini** | `gemini-3-flash-preview`, se continuar disponível na sua conta com Free Tier | Crie uma chave no [Google AI Studio](https://aistudio.google.com/apikey) e confira se o projeto está no Free Tier. O Google informa que, no uso gratuito sujeito a essas condições, entradas e saídas podem ser usadas para melhorar produtos. Use só casos inventados. [Preços e modelos](https://ai.google.dev/gemini-api/docs/pricing) · [Termos de uso de dados](https://ai.google.dev/gemini-api/terms) |
| **DeepSeek** | `deepseek-flash` | Selecione **DeepSeek** e use uma chave do [painel oficial](https://platform.deepseek.com/api_keys). A API cobra por tokens. O Flash custa menos que o Pro na tabela atual. A conta precisa de saldo pago ou concedido pelo provedor. Se a API retornar 402, confira o saldo. [Preços oficiais](https://api-docs.deepseek.com/quick_start/pricing/) · [Códigos de erro](https://api-docs.deepseek.com/quick_start/error_codes/) |
| **OpenRouter** | `openrouter/free` | Crie uma chave do [OpenRouter](https://openrouter.ai/settings/keys). Esse identificador seleciona um modelo gratuito disponível, sujeito a limites. O modelo pode mudar entre chamadas. Para comparar um modelo específico, use o ID exato do catálogo. Na conferência, o catálogo público não listava um DeepSeek com sufixo `:free`. [Roteador gratuito](https://openrouter.ai/docs/guides/routing/routers/free-router) · [Catálogo gratuito](https://openrouter.ai/collections/free-models) |
| **Anthropic API / OpenAI API** | Use o ID de um modelo habilitado na sua conta de API | Crie a chave no console da respectiva API. A cobrança da API é separada da assinatura de chat. Alguns planos oferecem créditos específicos para API. Confira sua elegibilidade, o saldo e a recarga automática no console. [Claude e API](https://support.claude.com/en/articles/9876003-why-is-claude-api-usage-billed-separately-from-my-paid-claude-plan) · [ChatGPT e API](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform) |

A percIA também lista **Mistral** e **Together AI**. Use chaves próprias, confira os modelos no console e consulte o plano antes de habilitar cobrança. Em **Outra API compatível**, informe a **URL HTTPS completa** de Chat Completions, o ID do modelo e a chave daquele provedor. A API precisa aceitar chamadas da página por CORS. Use um endereço oficial que você reconheça. O prefixo de compatibilidade indica o formato da API. Por exemplo, selecionar Groq com um modelo Qwen envia a chamada para a Groq.

## O que acontece com a chave

1. **No site público**, a chave fica na memória da aba. Quando você testa a conexão ou envia um caso com o modelo ativo, o navegador faz uma chamada HTTPS direta para o provedor selecionado. O teste de conexão envia um texto curto. As chamadas do chat podem incluir mensagens recentes e as fichas do tema.
2. O código não grava a chave em banco, cookies, armazenamento local, arquivo de log ou no relatório. O campo de senha apenas esconde os caracteres na tela. Scripts ou extensões com acesso à página e quem controla o dispositivo podem ter acesso à chave enquanto a sessão estiver ativa. Use um dispositivo de confiança e uma chave exclusiva de teste, com cota gratuita ou saldo pequeno. Use os controles de limite do provedor onde existirem.
3. **Configurar IA → Usar sem chave** remove a chave da sessão. Recarregar ou fechar a aba também encerra a configuração. **Nova conversa** limpa só a conversa e mantém a conexão ativa. Para invalidar a chave em todas as sessões, revogue-a no painel do provedor.
4. **No pacote local**, os provedores listados passam pelo servidor do seu próprio computador, que usa os destinos fixos em `src/core.mjs`. A opção de API personalizada continua direta pelo navegador. No site publicado, a rota intermediária fica desligada.
5. O provedor recebe o texto das chamadas e aplica as próprias regras de processamento e retenção. A hospedagem também pode registrar metadados das visitas à página. Use apenas casos fictícios. O filtro de dados pessoais e a triagem de urgência reconhecem alguns padrões. O botão **Ajuda imediata** permanece visível mesmo sem modelo.

## Como testar gastando zero

1. Crie uma chave em uma conta Groq no plano **Free**. Use um modelo da lista de limites gratuitos, como `qwen/qwen3.8-27b`.
2. No link da percIA, escolha **Configurar IA → Groq**, informe o ID do modelo e cole a chave no campo de senha. Clique em **Testar e conectar**.
3. Teste com os exemplos do menu. Se a cota acabar, use as fichas ou aguarde a renovação da cota do provedor.
4. Se alguém precisar ver um erro, compartilhe só o texto da resposta e o nome do modelo. Uma captura da configuração ou do painel do provedor pode expor a chave. Se uma chave for exposta, revogue e gere outra.

**Se a equipe quiser que todo mundo converse com IA sem colocar chave:** mantenha o modo de fichas público. Para a modalidade com IA, desenhe uma versão separada em que o servidor guarda a chave em um cofre de segredos, as pessoas autorizadas entram com login e o servidor aplica limite por pessoa e limite de gasto. A coordenação deve aprovar o fluxo e o provedor antes de qualquer atendimento com dados reais. A versão do laboratório usa uma chave própria por visitante e foi preparada para testes fictícios.

## Se der erro

- **Chave recusada:** confira se a chave veio do mesmo provedor escolhido e se o modelo está habilitado. Cole a chave novamente no campo de senha, sem compartilhar o valor.
- **Limite ou saldo:** verifique cota, saldo, restrições do plano e se existe recarga automática. O erro 429 também pode indicar chamadas rápidas demais.
- **Falha de navegador (CORS):** use a versão local para um provedor da lista ou escolha outro que aceite chamadas do site. Chaves com restrições de origem ou contas com políticas especiais podem impedir a conexão.
- **Tempo excedido ou resposta vazia:** teste um modelo de chat mais rápido. Se continuar, use o modo de fichas e registre o erro sem dados pessoais.

