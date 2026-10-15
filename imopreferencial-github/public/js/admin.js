/* Modo de edição: abrir /admin (só funciona com o servidor ligado) */
(function () {
  if (!/[?&]edit=1/.test(location.search)) return;
  const $ = (t, p = {}, k = []) => { const e = Object.assign(document.createElement(t), p); k.flat().forEach(c => e.append(c)); return e; };
  const post = (u, b) => fetch(u, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) });
  document.head.append($("style", { textContent: `
.adm-ed{outline:2px dashed #0866D9;outline-offset:3px;cursor:text}
.adm-ed:focus{outline-style:solid;background:rgba(8,102,217,.08)}
.adm-bar{position:fixed;left:0;right:0;bottom:0;z-index:200;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));background:#0B2A5B;color:#fff;font:500 .85rem Poppins,system-ui,sans-serif}
.adm-ok{font:inherit;border:0;border-radius:999px;padding:8px 16px;cursor:pointer;background:#fff;color:#0B2A5B;border:1px solid #9bb}
.adm-ok.pri{background:#159447;color:#fff;border-color:#159447}
.adm-m{position:fixed;inset:0;z-index:300;background:rgba(5,15,40,.6);display:grid;place-items:center;padding:16px}
.adm-p{background:#fff;color:#1B2B45;border-radius:18px;padding:20px;width:min(640px,100%);max-height:86vh;overflow:auto;font:400 .9rem system-ui,sans-serif}
.adm-p textarea,.adm-p input[type=text],.adm-p input[type=password]{width:100%;font:inherit;margin:4px 0 10px;padding:8px;border:1px solid #bcd;border-radius:8px}
.adm-p fieldset{border:1px solid #D3E2F7;border-radius:12px;margin:0 0 12px}` }));

  function modal(title, body, ok, label) {
    const m = $("div", { className: "adm-m" });
    m.append($("div", { className: "adm-p", role: "dialog", "aria-label": title }, [
      $("h3", { textContent: title }), body,
      $("button", { className: "adm-ok pri", type: "button", textContent: label || "Aplicar", onclick() { m.remove(); ok(); } }), " ",
      $("button", { className: "adm-ok", type: "button", textContent: "Cancelar", onclick() { m.remove(); } })]));
    document.body.append(m);
  }
  function login() {
    const pw = $("input", { type: "password", autocomplete: "current-password" });
    modal("Entrar no painel", $("label", {}, ["Palavra-passe", pw]), async () => {
      const r = await post("/api/login", { password: pw.value });
      r.ok ? location.reload() : alert("Palavra-passe incorreta.");
    }, "Entrar");
  }

  function start() {
    const state = { faq: null, settings: null }, status = $("span");
    document.body.style.paddingBottom = "76px";
    document.querySelectorAll("[data-edit]").forEach(e => {
      e.contentEditable = "true"; e.classList.add("adm-ed");
      e.addEventListener("keydown", x => { if (x.key === "Enter") x.preventDefault(); });
      e.addEventListener("click", x => x.preventDefault());
      e.addEventListener("paste", x => { x.preventDefault(); document.execCommand("insertText", false, x.clipboardData.getData("text/plain").replace(/\s+/g, " ")); });
    });

    function faqPanel() {
      const list = (state.faq || FAQ).map(x => ({ palavras: [...x.palavras], resposta: x.resposta, formulario: x.formulario }));
      const wrap = $("div");
      const draw = () => wrap.replaceChildren(...list.map((x, i) => {
        const pa = $("textarea", { rows: 2, value: x.palavras.join(", "), oninput() { x.palavras = pa.value.split(",").map(s => s.trim()).filter(Boolean); } });
        const re = $("textarea", { rows: 3, value: x.resposta, oninput() { x.resposta = re.value; } });
        const fo = $("input", { type: "checkbox", checked: !!x.formulario, onchange() { x.formulario = fo.checked ? 1 : 0; } });
        return $("fieldset", {}, [
          $("label", { textContent: "Palavras que o visitante pode escrever (separadas por vírgula)" }), pa,
          $("label", { textContent: "Resposta" }), re,
          $("label", {}, [fo, " Mostrar o botão \"Ir para o formulário\""]), " ",
          $("button", { className: "adm-ok", type: "button", textContent: "Remover", onclick() { list.splice(i, 1); draw(); } })]);
      }), $("button", { className: "adm-ok", type: "button", textContent: "+ Nova pergunta", onclick() { list.push({ palavras: [], resposta: "", formulario: 0 }); draw(); } }), $("p"));
      draw();
      modal("Perguntas do chat", wrap, () => { state.faq = list.filter(x => x.palavras.length && x.resposta.trim()); window.FAQ = state.faq; status.textContent = "Alterações por guardar."; });
    }

    function settingsPanel() {
      const f = { email: "Email", phone: "Telefone", address: "Morada", whatsapp: "WhatsApp (indicativo e número, ex.: 351912345678)" };
      const inp = Object.fromEntries(Object.keys(f).map(k => [k, $("input", { type: "text", value: CONFIG[k] || "" })]));
      modal("Dados de contacto", $("div", {}, Object.keys(f).map(k => $("label", {}, [f[k], inp[k]]))), () => {
        state.settings = Object.fromEntries(Object.keys(f).map(k => [k, inp[k].value.trim()]));
        Object.assign(CONFIG, state.settings); renderInfo(); applyWa(); status.textContent = "Alterações por guardar.";
      });
    }

    async function save() {
      const texts = {};
      document.querySelectorAll("[data-edit]").forEach(e => { texts[e.dataset.edit] = e.textContent.replace(/\s+/g, " ").trim(); });
      status.textContent = "A guardar…";
      try {
        const r = await post("/api/content", { texts, ...(state.faq && { faq: state.faq }), ...(state.settings && { settings: state.settings }) });
        const d = await r.json().catch(() => ({}));
        status.textContent = r.ok ? "Guardado. A página já mostra as alterações." : (d.error || "Erro ao guardar.");
      } catch { status.textContent = "Sem ligação ao servidor."; }
    }

    const btn = (t, fn, c = "") => $("button", { className: "adm-ok " + c, type: "button", textContent: t, onclick: fn });
    document.body.append($("div", { className: "adm-bar", role: "toolbar", "aria-label": "Painel de edição" }, [
      "Clique nos textos para os editar.", btn("Guardar", save, "pri"), btn("Perguntas do chat", faqPanel), btn("Dados de contacto", settingsPanel),
      btn("Ver página", () => { location.href = "/"; }), btn("Sair", async () => { await post("/api/logout"); location.href = "/"; }), status]));
  }

  fetch("/api/me").then(r => r.json()).then(me => (me.admin ? start() : login()))
    .catch(() => alert("O painel só funciona na página publicada no Cloudflare. Está a ver a página como ficheiro simples."));
})();
