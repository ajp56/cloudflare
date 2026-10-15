# Imopreferencial — Worker no Cloudflare (site + painel de edição + email)

Esta versão publica-se por linha de comandos com o Wrangler (ferramenta oficial do Cloudflare). O KV `imopreferencial-content` já está ligado no ficheiro `wrangler.jsonc`.

## O que precisa
- Node.js (versão LTS) instalado: https://nodejs.org
- A sua conta Cloudflare

## Passo a passo

1. **Descompacte** o ZIP e abra um terminal dentro da pasta (no Windows: clique com o botão direito num espaço vazio da pasta → "Abrir no Terminal").
2. `npm install`
3. `npx wrangler login` — abre o navegador; autorize o acesso.
4. `npx wrangler deploy` — publica o site e mostra o endereço (algo como `https://imopreferencial.SEU-NOME.workers.dev`).
5. **Defina os segredos.** Execute cada comando e, quando pedir, cole o valor:
   ```
   npx wrangler secret put ADMIN_PASSWORD     (palavra-passe do painel, forte)
   npx wrangler secret put SESSION_SECRET     (texto aleatório longo, 32+ caracteres)
   npx wrangler secret put RESEND_API_KEY     (chave do Resend)
   npx wrangler secret put MAIL_TO            (email que recebe os pedidos)
   npx wrangler secret put MAIL_FROM          (ex.: Imopreferencial <site@seudominio.pt>)
   ```
6. Abra `https://SEU-ENDEREÇO/admin`, entre com a palavra-passe e edite.

## Email (Resend)
1. Crie conta em resend.com e uma API key.
2. Para enviar para o email da empresa, verifique o domínio da empresa no Resend (acrescenta registos DNS).
3. Sem domínio verificado, o Resend só deixa enviar testes para o email da própria conta Resend (remetente `onboarding@resend.dev`).

## Mudar o endereço (domínio da empresa)
No painel do Cloudflare, abra este Worker → **Settings** → **Domains & Routes** (Domínios e rotas) → adicione o domínio. Se o domínio estiver ligado ao projeto antigo (só ficheiros), retire-o de lá primeiro.

## Atualizar o site
Altere os ficheiros em `public/` e execute `npx wrangler deploy`. Os textos editados no painel **não se perdem**, porque ficam no KV.

## Notas
- O painel edita texto simples (sem negrito, cores ou links). Mudar a estrutura da página exige alterar `public/index.html` e `public/css/styles.css`.
- O KV pode demorar cerca de 1 minuto a mostrar uma edição a quem está noutro local.
- Reforce com uma regra de Rate Limiting do Cloudflare nos caminhos `/api/login` e `/api/contact`.
- O nome `CONTENT` do KV está no `wrangler.jsonc` e em `src/index.js` (`env.CONTENT`); se mudar um, mude o outro.

## Estrutura
```
wrangler.jsonc   configuração (nome, KV, ficheiros)
src/index.js     API do painel e do formulário
public/          o site (HTML, CSS, JS, logótipos)
```
