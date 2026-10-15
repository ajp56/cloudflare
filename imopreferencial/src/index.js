/* Cloudflare Pages (modo avançado): API do painel de edição e do formulário.
   Tudo o que não começa por /api/ é servido como ficheiros estáticos. */
const enc = new TextEncoder();
const DEFAULT = { texts: {}, faq: null, settings: { email: "", phone: "", address: "", whatsapp: "" } };
const SET = ["email", "phone", "address", "whatsapp"];
const json = (o, status = 200, headers = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
const bad = (error, status = 400) => { throw { status, error }; };

/* ---- sessão de administrador (cookie assinado) ---- */
async function hmac(secret, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)))].map(b => b.toString(16).padStart(2, "0")).join("");
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
const cookie = (v, age) => `adm=${v}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${age}`;
async function isAdmin(request, env) {
  if (!env.SESSION_SECRET) return false;
  const m = (request.headers.get("Cookie") || "").match(/(?:^|; )adm=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  return +exp > Date.now() && same(sig || "", await hmac(env.SESSION_SECRET, "admin|" + exp));
}

/* ---- limite simples de pedidos (por instância; reforce com uma regra de Rate Limiting do Cloudflare) ---- */
const hits = new Map();
function limited(key, max, ms) {
  if (hits.size > 1000) hits.clear();
  const now = Date.now(), a = (hits.get(key) || []).filter(t => now - t < ms);
  const over = a.length >= max;
  if (!over) a.push(now);
  hits.set(key, a);
  return over;
}

/* ---- conteúdo (guardado no KV, chave "content") ---- */
async function readContent(env) {
  if (!env.CONTENT) return structuredClone(DEFAULT);
  try {
    const v = (await env.CONTENT.get("content", "json")) || {};
    return { ...DEFAULT, ...v, settings: { ...DEFAULT.settings, ...(v.settings || {}) } };
  } catch { return structuredClone(DEFAULT); }
}
const str = (v, max) => typeof v === "string" && v.length <= max;
function validate(b, cur) {
  const out = { ...cur };
  if (b.texts !== undefined) {
    const e = Object.entries(b.texts || {});
    if (e.length > 200 || !e.every(([k, v]) => /^[a-z0-9_]{1,40}$/.test(k) && str(v, 2000))) bad("Textos inválidos.");
    out.texts = Object.fromEntries(e);
  }
  if (b.faq !== undefined) {
    const f = b.faq;
    if (!Array.isArray(f) || f.length > 100 || !f.every(x => x && Array.isArray(x.palavras) && x.palavras.length <= 30 && x.palavras.every(p => str(p, 60)) && str(x.resposta, 1500))) bad("Perguntas do chat inválidas.");
    out.faq = f.map(x => ({ palavras: x.palavras, resposta: x.resposta, formulario: x.formulario ? 1 : 0 }));
  }
  if (b.settings !== undefined) {
    const s = b.settings || {};
    if (!SET.every(k => s[k] === undefined || str(s[k], 200))) bad("Dados de contacto inválidos.");
    out.settings = { ...cur.settings };
    SET.filter(k => s[k] !== undefined).forEach(k => { out.settings[k] = k === "whatsapp" ? s[k].replace(/\D/g, "") : s[k].trim(); });
  }
  return out;
}

async function readBody(request) {
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) bad("Pedido inválido.", 415);
  const t = await request.text();
  if (t.length > 200000) bad("Pedido demasiado grande.", 413);
  try { return JSON.parse(t) || {}; } catch { return bad("Pedido inválido."); }
}

async function api(request, env, p) {
  const m = request.method, ip = request.headers.get("CF-Connecting-IP") || "x";

  if (p === "/api/content" && m === "GET") return json(await readContent(env));
  if (p === "/api/me" && m === "GET") return json({ admin: await isAdmin(request, env) });

  if (p === "/api/login" && m === "POST") {
    if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) bad("O painel ainda não está configurado (faltam variáveis no Cloudflare).", 503);
    if (limited("login" + ip, 8, 15 * 60e3)) bad("Demasiadas tentativas. Tente novamente mais tarde.", 429);
    const pw = String((await readBody(request)).password || "");
    const ok = same(await hmac(env.SESSION_SECRET, "pw|" + pw), await hmac(env.SESSION_SECRET, "pw|" + env.ADMIN_PASSWORD));
    if (!ok) bad("Palavra-passe incorreta.", 401);
    const exp = Date.now() + 7 * 864e5;
    return json({ ok: true }, 200, { "Set-Cookie": cookie(`${exp}.${await hmac(env.SESSION_SECRET, "admin|" + exp)}`, 604800) });
  }
  if (p === "/api/logout" && m === "POST") return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });

  if (p === "/api/content" && m === "POST") {
    if (!(await isAdmin(request, env))) bad("Sessão expirada. Entre novamente.", 401);
    if (!env.CONTENT) bad("O armazenamento (KV) ainda não está ligado ao projeto.", 503);
    const next = validate(await readBody(request), await readContent(env));
    await env.CONTENT.put("content", JSON.stringify(next));
    return json({ ok: true });
  }

  if (p === "/api/contact" && m === "POST") {
    if (limited("contact" + ip, 5, 10 * 60e3)) bad("Demasiados pedidos. Tente novamente mais tarde.", 429);
    const b = await readBody(request);
    if (b.website) return json({ ok: true }); // campo-armadilha para robôs
    const f = Object.fromEntries(["nome", "email", "empresa", "telefone", "area", "mensagem"].map(k => [k, String(b[k] || "").trim()]));
    if (f.nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || !f.area || f.mensagem.length < 10 || Object.values(f).some(v => v.length > 3000))
      bad("Verifique os campos do formulário e tente novamente.");
    if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) bad("O envio de emails ainda não está configurado.", 503);
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.MAIL_FROM, to: [env.MAIL_TO], reply_to: f.email,
        subject: `Novo pedido do site: ${f.area}`.replace(/[\r\n]/g, " "),
        text: `Nome: ${f.nome}\nEmail: ${f.email}\nEmpresa: ${f.empresa || "-"}\nTelefone: ${f.telefone || "-"}\nÁrea de interesse: ${f.area}\n\nMensagem:\n${f.mensagem}\n`
      })
    });
    if (!r.ok) { console.error("Resend:", r.status, await r.text()); bad("Não foi possível enviar o pedido. Tente novamente dentro de instantes.", 502); }
    return json({ ok: true });
  }
  return json({ error: "Não encontrado." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/admin") return Response.redirect(url.origin + "/?edit=1", 302);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(request, env, url.pathname); }
      catch (e) {
        if (e && e.error) return json({ error: e.error }, e.status || 400);
        console.error(e); return json({ error: "Erro no servidor." }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
