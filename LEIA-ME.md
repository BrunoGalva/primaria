# PRIMARIA Studio

Site próprio onde a equipe cria posts e stories da PRIMARIA: escolhe o formato, escreve a ideia, e o estúdio monta a peça com os efeitos, logos, cores e fonte da marca. Aprovações e reprovações viram memória para as próximas criações.

## O que tem aqui

| Pasta / arquivo | O que é |
|---|---|
| `index.html`, `app.js` | A interface (chat, prévia, baixar PNG, aprovar/reprovar, editar textos) |
| `lib/brand.js` | **Manual vivo da marca.** Cores, regras, frases, imagens, logos, dados do evento. É o arquivo que vocês editam. |
| `lib/effects.js` | Os efeitos: movimento, meio-tom, raio-x, sépia em papel, fotocópia, vermelho seletivo, borrado, grão |
| `lib/render.js` | Desenha a peça e corrige sozinho logo e texto para ter contraste (logo preto no claro, branco no escuro) |
| `lib/composer.js` | Compositor local (funciona mesmo sem IA; também é o botão "Variar") |
| `lib/prompt.js` | As instruções que a IA recebe |
| `api/compose.js` | Função de servidor que chama o Claude (a chave fica escondida aqui) |
| `api/feedback.js` | Memória compartilhada da equipe (opcional) |
| `assets/logos`, `assets/images` | Logos e fotos base |

## Colocar no ar (uns 10 minutos, sem programar)

1. **GitHub** (grátis): crie uma conta em github.com, clique em *New repository*, dê o nome `primaria-studio`, crie. Na página do repositório, clique em *uploading an existing file* e arraste **todo o conteúdo desta pasta** (não a pasta em si). Confirme em *Commit changes*.
2. **Vercel** (grátis): entre em vercel.com com a conta do GitHub. *Add New… → Project → Import* o `primaria-studio` → *Deploy*. Em um minuto sai um link tipo `primaria-studio.vercel.app`.
3. **Chave da IA**: em console.anthropic.com, crie uma conta, coloque créditos (US$ 10 dão para centenas de peças) e gere uma *API key*.
4. Na Vercel, abra o projeto → *Settings → Environment Variables* e adicione:
   - `ANTHROPIC_API_KEY` = a chave do passo 3 (obrigatório)
   - `STUDIO_PASSWORD` = uma senha para a equipe (recomendado; sem ela, qualquer pessoa com o link gasta seus créditos)
   - `ANTHROPIC_MODEL` = opcional. Padrão `claude-sonnet-5`. Se a Anthropic mudar o nome do modelo, troque aqui.
5. *Deployments → ⋯ → Redeploy*. Pronto: o selo no topo do site muda de "Modo local" para "IA conectada".

### Memória compartilhada da equipe (opcional, recomendado)
Sem isso, cada navegador guarda as próprias aprovações. Para todo mundo ensinar o mesmo estúdio:
1. Crie uma conta grátis em upstash.com → *Create Database* (Redis).
2. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` e adicione nas variáveis da Vercel. Redeploy.

## Como a equipe usa
1. Escolhe **Post 4:5** ou **Story 9:16**.
2. (Opcional) escolhe uma imagem ou envia uma foto. Sem escolher, o estúdio escolhe.
3. Escreve a ideia. Frase exata vai **entre aspas**. Ex.: `contagem, faltam 5 dias, clima escuro` ou `post de conceito com "O ORIGINAL AINDA EXISTE."`
4. **Gerar**. Não gostou do arranjo? **Variar**. Quer mudar uma palavra? Edite em *Textos da peça*.
5. **Aprovar** ou **Reprovar** (com o motivo). Isso ensina o estúdio.
6. **Baixar PNG** e postar.

## Como o estúdio "aprende"
Não é treino de modelo. A cada pedido, a IA recebe o manual da marca **mais** as últimas peças aprovadas e reprovadas com os motivos. O compositor local também aumenta o peso dos efeitos e composições aprovados e diminui os reprovados. Quanto mais vocês votam, mais preciso fica.

## Editar a marca
Tudo em `lib/brand.js`:
- **Frases**: lista `PHRASES`.
- **Evento**: objeto `EVENT` (data, horário, line-up real quando fechar).
- **Regras** e **reprovados fixos**: `RULES` e `REJECTED`.
- **Novas fotos**: coloque o arquivo em `assets/images/` e adicione uma linha em `IMAGES` com `id`, `kind` (rosto, corpo, detalhe ou textura) e uma descrição curta (a IA escolhe pela descrição).
- **Os outros 6 logos**: coloque o PNG transparente em `assets/logos/` e adicione em `LOGOS` com `variant`, `tone` e `ratio` (largura ÷ altura).

## Custos
- Vercel, GitHub, Upstash: grátis neste volume.
- Claude (API): cada geração custa na ordem de 2 a 5 centavos de dólar. 300 peças no mês ≈ US$ 10–15.

## Observação sobre a fonte
O site usa Helvetica quando o computador tem (Mac e iPhone têm). Em Windows/Android cai para Arial. Se quiserem a Helvetica em todo lugar, coloquem o arquivo da fonte licenciada em `assets/` e eu adiciono o carregamento.
