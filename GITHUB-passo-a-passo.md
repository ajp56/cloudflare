# Publicar o site no Cloudflare através do GitHub (sem linha de comandos)

Resultado: o site, o painel `/admin` e o formulário a funcionar, e cada alteração guardada no GitHub atualiza o site sozinha.

## Parte 1 — Pôr os ficheiros no GitHub

1. **Descompacte** o `imopreferencial-github.zip` num sítio do computador. Vai ficar com `public`, `src`, `wrangler.jsonc`, `package.json` e `README.md`.
2. Entre em github.com (crie conta gratuita, se não tiver).
3. Carregue em **+ → New repository**. Nome: `imopreferencial-site`. Escolha **Private** (privado). Carregue em **Create repository**.
4. Na página seguinte, carregue na ligação **uploading an existing file**.
5. **Arraste para a janela o conteúdo da pasta descompactada** (as pastas `public` e `src` e os ficheiros soltos), não o ZIP. Use o Chrome ou o Edge, que mantêm as pastas.
6. Confirme que se veem as pastas `public` e `src` e os ficheiros `wrangler.jsonc` e `package.json`, e carregue em **Commit changes**.

## Parte 2 — Ligar o GitHub ao Cloudflare

1. No Cloudflare: **Workers e Pages** → criar aplicação → **Importar um repositório** (Import a repository) → **Começar** (Get started).
2. Ligue a sua conta GitHub (autorize, de preferência só o repositório `imopreferencial-site`) e escolha o repositório.
3. **Nome do projeto: `imopreferencial`** (tem de ser igual ao `name` do ficheiro `wrangler.jsonc`).
4. **Comando de build:** deixe vazio. **Comando de implementação (deploy):** `npx wrangler deploy`.
5. Carregue em **Guardar e implementar** (Save and Deploy). No fim aparece o endereço do site (`…workers.dev`).

Se der erro de nome, abra o `wrangler.jsonc` no GitHub (lápis) e coloque no campo `name` exatamente o nome do projeto do Cloudflare, depois faça Commit.

## Parte 3 — Segredos (painel e email)

No Cloudflare, abra o Worker `imopreferencial` → **Definições** (Settings) → **Variáveis e segredos** → **Adicionar**. Para cada linha, escolha o tipo **Segredo** (Secret), não "Texto":

| Nome | Valor |
|---|---|
| `ADMIN_PASSWORD` | palavra-passe do painel (forte) |
| `SESSION_SECRET` | texto aleatório longo (mais de 32 caracteres) |
| `RESEND_API_KEY` | chave do Resend |
| `MAIL_TO` | email que recebe os pedidos |
| `MAIL_FROM` | ex.: `Imopreferencial <site@seudominio.pt>` |

Guarde e implemente (Deploy) para os segredos entrarem em vigor.

**Resend:** crie conta em resend.com e uma chave API. Para enviar para o email da empresa, verifique o domínio da empresa no Resend (acrescenta registos DNS). Sem isso, só envia testes para o email da própria conta Resend.

## Parte 4 — Usar

- Abra `https://SEU-ENDEREÇO/admin`, entre com a palavra-passe e clique nos textos para editar. **Guardar** no fim.
- Teste o formulário: um pedido de teste deve chegar ao `MAIL_TO`.

## Domínio da empresa
Worker → **Definições → Domínios e rotas** → adicionar domínio. Se o domínio estiver ligado ao projeto antigo (só ficheiros), retire-o de lá primeiro.

## Atualizar o site depois
No GitHub, abra o ficheiro (por exemplo `public/index.html`), carregue no lápis, altere, **Commit changes**. O Cloudflare publica sozinho em cerca de um minuto. Os textos editados no painel não se perdem, porque ficam no KV.
