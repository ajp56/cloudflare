/* ===== PERGUNTAS E RESPOSTAS DO CHAT: editar aqui =====
   Cada pergunta é um bloco { ... } separado por vírgula.
   palavras:   o que o visitante pode escrever. Basta um pedaço da palavra
               (ex.: "contab" apanha "contabilidade"). Não importam maiúsculas nem acentos.
   resposta:   o texto que o chat responde. Use \n para mudar de linha.
   formulario: 1 = mostra também o botão "Ir para o formulário". Pode omitir.
   Se várias perguntas servirem, vale a que estiver mais acima na lista.
   Só escreva informação confirmada pela empresa. */
var FAQ=[
 { palavras:["preco","custo","quanto","valor","horario","avenca"],
   resposta:"Não tenho valores nem horários confirmados aqui. Deixe o seu pedido no formulário e a equipa dá-lhe a informação certa.", formulario:1 },
 { palavras:["automa","inteligencia","artificial","tecnolog"],
   resposta:"Usamos tecnologia para automatizar tarefas administrativas e empresariais repetitivas, libertando tempo para o que mais importa no negócio." },
 { palavras:["contab","fiscal","impost"],
   resposta:"Na contabilidade e fiscalidade apoiamos a organização contabilística e o acompanhamento das obrigações fiscais da sua empresa." },
 { palavras:["gest","consult"],
   resposta:"Na gestão e consultoria damos apoio na organização do negócio e na análise da informação, para decidir com mais controlo." },
 { palavras:["servic","oferec","fazem","areas"],
   resposta:"Trabalhamos em quatro áreas: Contabilidade, Gestão, Consultoria e Soluções Tecnológicas.\nNas soluções, destacamos contabilidade e fiscalidade, gestão e consultoria, e automação e inteligência artificial." },
 { palavras:["quem","sobre","empresa","imopreferencial"],
   resposta:"A Imopreferencial acompanha empresas na organização, na gestão e na utilização de tecnologia, para lhes dar mais opções de crescimento." },
 { palavras:["contact","falar","pedido","orcamento","reuniao","email","telefone","morada"],
   resposta:"Pode deixar o seu pedido no formulário da secção Contactos e a equipa responde.", formulario:1 }
];
/* Resposta quando nenhuma pergunta serve */
var SEM_RESPOSTA="Não encontrei essa informação aqui. Escolha uma das perguntas abaixo ou deixe o seu pedido no formulário.";
/* ===== fim das perguntas e respostas ===== */
