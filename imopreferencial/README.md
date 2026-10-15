# Imopreferencial — site com painel de edição (Cloudflare Workers + GitHub)

Este repositório publica-se no Cloudflare automaticamente: cada alteração guardada no GitHub atualiza o site.

```
wrangler.jsonc   configuração (nome do Worker, KV, pasta dos ficheiros)
src/index.js     API do painel de edição e do formulário (email via Resend)
public/          o site (HTML, CSS, JavaScript, logótipos)
```

## Notas
- O nome do projeto no Cloudflare tem de ser igual ao campo `name` do `wrangler.jsonc` (`imopreferencial`). Se mudar um, mude o outro.
- Os segredos (palavra-passe, chave do email, etc.) **nunca** devem ser escritos nos ficheiros. Definem-se no painel do Cloudflare, como "Secret".
- O KV está ligado pelo nome `CONTENT` (em `wrangler.jsonc` e em `src/index.js`).
- O painel `/admin` edita texto simples. Mudar a estrutura da página exige alterar `public/index.html` e `public/css/styles.css`.
