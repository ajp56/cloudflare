/* CONFIGURAÇÃO: preencher com os dados reais da empresa */
const CONFIG={
  formEndpoint:"/api/contact", // backend incluído neste projeto
  email:"", phone:"", address:"",
  whatsapp:"",       // número com indicativo, só dígitos (ex.: 351912345678). Vazio = botão escondido
  chatEndpoint:""    // opcional: backend com IA. Recebe {messages:[{role,content}]} e devolve {reply}
};


document.getElementById("yr").textContent=new Date().getFullYear();

/* Menu móvel */
const nav=document.getElementById("nav"),mb=document.getElementById("menuBtn");
function setMenu(o){nav.classList.toggle("open",o);mb.setAttribute("aria-expanded",o);mb.setAttribute("aria-label",o?"Fechar menu":"Abrir menu")}
mb.addEventListener("click",()=>setMenu(!nav.classList.contains("open")));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});

/* Dados de contacto (só aparecem quando configurados) */
const info=document.getElementById("info");
function renderInfo(){info.replaceChildren();
  [["Email",CONFIG.email,v=>"mailto:"+v],["Telefone",CONFIG.phone,v=>"tel:"+v.replace(/\s/g,"")],["Morada",CONFIG.address,null]].forEach(([l,v,h])=>{
    if(!v)return;const li=document.createElement("li");li.append(l+": ");
    if(h){const a=document.createElement("a");a.href=h(v);a.textContent=v;li.append(a)}else li.append(v);info.append(li)});
  info.hidden=!info.children.length}
renderInfo();

/* Formulário */
const form=document.getElementById("form"),status=document.getElementById("status"),send=document.getElementById("send");
const rules={
  nome:v=>v.trim().length>=2||"Indique o seu nome.",
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())||"Indique um email válido, por exemplo nome@empresa.pt.",
  telefone:v=>!v.trim()||/^[+\d][\d\s().-]{6,}$/.test(v.trim())||"Indique um número de telefone válido.",
  area:v=>!!v||"Selecione uma área de interesse.",
  mensagem:v=>v.trim().length>=10||"Escreva uma mensagem com pelo menos 10 caracteres."
};
function check(n){const f=form.elements[n],r=rules[n](f.value),ok=r===true;
  f.setAttribute("aria-invalid",!ok);document.getElementById("e-"+n).textContent=ok?"":r;return ok}
Object.keys(rules).forEach(n=>form.elements[n].addEventListener("blur",()=>check(n)));
function show(t,c){status.textContent=t;status.className=c}
form.addEventListener("submit",async e=>{
  e.preventDefault();status.className="";
  const bad=Object.keys(rules).filter(n=>!check(n));
  if(bad.length){form.elements[bad[0]].focus();return show("Verifique os campos assinalados e tente novamente.","bad")}
  if(!CONFIG.formEndpoint)return show("O envio ainda não está configurado. Por favor, contacte-nos por outro meio.","bad");
  send.disabled=true;send.textContent="A enviar…";
  try{
    const r=await fetch(CONFIG.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
    if(!r.ok){const d=await r.json().catch(()=>({}));const er=new Error(d.error||"");er.server=true;throw er}
    form.reset();show("Pedido enviado com sucesso. Entraremos em contacto consigo em breve.","ok");
  }catch(er){show(er.server&&er.message?er.message:"Não foi possível enviar o pedido. Tente novamente dentro de instantes.","bad")}
  finally{send.disabled=false;send.textContent="Enviar pedido"}
});

/* Chat de dúvidas: respostas só com informação confirmada; sem IA enquanto não houver chatEndpoint */
const chat=document.getElementById("chat"),fab=document.getElementById("chatFab"),log=document.getElementById("chatLog"),cin=document.getElementById("chatIn");
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const hist=[];let started=false;
function add(t,cls){const d=document.createElement("div");d.className="msg"+(cls?" "+cls:"");d.textContent=t;log.append(d);log.scrollTop=log.scrollHeight;return d}
function chips(list){const w=document.createElement("div");w.className="chips";
  list.forEach(([l,fn])=>{const b=document.createElement("button");b.type="button";b.className="chip";b.textContent=l;b.onclick=()=>{w.remove();fn()};w.append(b)});
  log.append(w);log.scrollTop=log.scrollHeight}
const goForm=()=>{setChat(false);document.getElementById("contactos").scrollIntoView()};
const menu=()=>chips([["Que serviços oferecem?",()=>ask("Que serviços oferecem?")],["O que é automação e IA?",()=>ask("O que é automação e IA?")],["Quem são?",()=>ask("Quem são?")],["Como peço contacto?",()=>ask("Como peço contacto?")]]);
async function answer(q){
  if(CONFIG.chatEndpoint){try{const r=await fetch(CONFIG.chatEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist})});
    if(r.ok){const d=await r.json();if(d.reply)return{t:d.reply}}}catch(_){}}
  const n=norm(q),m=FAQ.find(e=>e.palavras.some(k=>n.includes(norm(k))));return m?{t:m.resposta,go:m.formulario}:{t:SEM_RESPOSTA,go:1}}
async function ask(q){
  add(q,"me");hist.push({role:"user",content:q});
  const r=await answer(q);hist.push({role:"assistant",content:r.t});add(r.t);
  if(r.go)chips([["Ir para o formulário",goForm],["Outra pergunta",menu]]);else menu()}
function setChat(o){chat.classList.toggle("open",o);fab.setAttribute("aria-expanded",o);
  if(o){if(!started){started=true;add("Olá! Sou o assistente da Imopreferencial. Escolha uma pergunta ou escreva a sua dúvida.");menu()}cin.focus()}else fab.focus()}
fab.addEventListener("click",()=>setChat(!chat.classList.contains("open")));
document.getElementById("chatClose").addEventListener("click",()=>setChat(false));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&chat.classList.contains("open"))setChat(false)});
document.getElementById("chatForm").addEventListener("submit",e=>{e.preventDefault();const q=cin.value.trim();if(!q)return;cin.value="";ask(q)});
function applyWa(){const w=document.getElementById("waLink");
  if(CONFIG.whatsapp){w.href="https://wa.me/"+CONFIG.whatsapp.replace(/\D/g,"");w.hidden=false}else w.hidden=true}
applyWa();

/* Conteúdo gerido no painel (só existe com o backend) */
fetch("/api/content").then(r=>r.ok?r.json():null).then(c=>{
  if(!c)return;
  Object.entries(c.texts||{}).forEach(([k,v])=>{const e=document.querySelector('[data-edit="'+k+'"]');if(e&&v)e.textContent=v});
  Object.assign(CONFIG,c.settings||{});renderInfo();applyWa();
  if(Array.isArray(c.faq))FAQ=c.faq;
}).catch(()=>{});
