// =====================================================================
// LÓGICA DA AGENDA VIRTUAL (pt-BR)
// - Gerencia criação, edição, exclusão e listagem de tarefas
// - Persiste dados no localStorage
// - Filtros: pendentes, concluídas, por tipo, busca por título
// - Ordenação por data de entrega (asc/desc)
// - Destaque para tarefas atrasadas
// - Exportação/Importação de JSON
// - Drag & Drop para reordenar
// - Tema claro/escuro persistente
// - Barra de progresso (concluídas / total)
// - Data e hora dinâmicas no cabeçalho
// =====================================================================

/** Chave base para o localStorage */
const STORAGE_KEY = "agenda_virtual_v1";

/** Estado global simples da aplicação */
const state = {
  tarefas: [],       // Array de tarefas ({id, titulo, descricao, dataEntrega, pagina, tipo, status, imagem, icone, createdAt, order})
  filtro: "todas",   // "todas" | "pendentes" | "concluidas" | "tipo:<nome>"
  busca: "",         // texto de busca por título
  ordenacao: "asc",  // "asc" | "desc"
  tema: "claro",     // "claro" | "escuro"
};

// ============================ Utilidades ==============================

/** Gera um ID único simples */
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Lê e grava no localStorage */
function salvarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    tarefas: state.tarefas,
    tema: state.tema,
  }));
}
function carregarLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.tarefas = Array.isArray(data.tarefas) ? data.tarefas : [];
    state.tema = data.tema === "escuro" ? "escuro" : "claro";
  } catch (e) {
    console.error("Erro ao carregar storage:", e);
  }
}

/** Formata data (YYYY-MM-DD -> dd/mm/aaaa) */
function formatarData(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

/** Verifica se a tarefa está atrasada (apenas se pendente) */
function estaAtrasada(t) {
  if (t.status !== "pendente") return false;
  try {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const dt = new Date(t.dataEntrega);
    dt.setHours(0,0,0,0);
    return dt < hoje;
  } catch { return false; }
}

/** Atualiza barra de progresso */
function atualizarProgresso() {
  const total = state.tarefas.length;
  const concluidas = state.tarefas.filter(t => t.status === "concluida").length;
  const pct = total ? Math.round((concluidas / total) * 100) : 0;
  document.getElementById("progressoTexto").textContent = `${concluidas} de ${total} concluídas`;
  const barra = document.getElementById("progressoBarra");
  barra.style.width = pct + "%";
  const wrapper = barra.parentElement;
  wrapper.setAttribute("aria-valuenow", String(pct));
}

/** Atualiza relógio no cabeçalho */
function iniciarRelogio() {
  const el = document.getElementById("relogio");
  function tick() {
    const agora = new Date();
    const data = agora.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    el.textContent = `${data} — ${hora}`;
  }
  tick();
  setInterval(tick, 1000);
}

/** Aplica o tema salvo */
function aplicarTema() {
  document.body.classList.toggle("dark", state.tema === "escuro");
}

// ============================ Renderização ===========================

const navButtons = document.querySelectorAll('.nav-btn');

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active de todos
    navButtons.forEach(b => b.classList.remove('active'));
    // Adiciona active só no clicado
    btn.classList.add('active');
  });
});


/** Cria o elemento de cartão a partir de uma tarefa */
function criarCard(tarefa) {
  const tpl = document.getElementById("cardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);

  node.dataset.id = tarefa.id;

  // Aplica borda colorida se for pré-anotada
  // Aplica borda colorida se for pré-anotada

  if (tarefa.status === "pendente") {
    node.style.border = "3px solid #e74c3c"; // vermelho
    node.style.boxShadow = "0 0 10px rgba(231, 76, 60, 0.5)";
  } else if (tarefa.status === "concluida") {
    node.style.border = "3px solid #2ecc71"; // verde
    node.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.5)";
  }



  // Imagem ou ícone
  const imgWrap = node.querySelector(".card-image");
  imgWrap.innerHTML = "";
  if (tarefa.imagem) {
    const img = new Image();
    img.src = tarefa.imagem;
    img.alt = "Imagem da tarefa";
    img.loading = "lazy";
    imgWrap.appendChild(img);
  } else if (tarefa.icone) {
    imgWrap.textContent = tarefa.icone;
  } else {
    imgWrap.textContent = "📚";
  }

  // Conteúdo
  node.querySelector(".card-title").textContent = tarefa.titulo;
  node.querySelector(".badge.tipo").textContent = tarefa.tipo;
  node.querySelector(".card-desc").textContent = tarefa.descricao || "—";
  node.querySelector(".vencimento").textContent = formatarData(tarefa.dataEntrega);
  node.querySelector(".pagina").textContent = tarefa.pagina;
  node.querySelector(".status").textContent = tarefa.status === "concluida" ? "Concluída" : "Pendente";

  // Atraso?
  if (estaAtrasada(tarefa)) {
    node.setAttribute("aria-invalid", "true");
    node.title = "Tarefa atrasada";
  }

  // Botões
  node.querySelector(".toggle-status").addEventListener("click", () => alternarStatus(tarefa.id));
  node.querySelector(".editar").addEventListener("click", () => abrirModalEdicao(tarefa.id));
  node.querySelector(".excluir").addEventListener("click", () => excluirTarefa(tarefa.id));

  // Drag & Drop
  node.addEventListener("dragstart", handleDragStart);
  node.addEventListener("dragover", handleDragOver);
  node.addEventListener("drop", handleDrop);
  node.addEventListener("dragend", handleDragEnd);

  return node;
}


function adicionarTarefasFixas() {
  const fixas = [
    {
      titulo: "Trabalho de Artes",
      descricao: "Fazer uma maquete de uma casa",
      dataEntrega: "2025-08-21",
      pagina: "-",
      tipo: "Trabalho",
      status: "pendente",
      icone: "🎨",
      origem: "pre-anotadas",
    },
  ];

  // 1. Remover pré-anotadas que não estão mais na lista oficial
  state.tarefas = state.tarefas.filter(t => {
    if (t.origem !== "pre-anotadas") return true; // mantém as normais
    return fixas.some(f => f.titulo === t.titulo); // só mantém se ainda existe em fixas
  });

  // 2. Adicionar novas fixas que ainda não existem
  fixas.forEach(dados => {
    const jaExiste = state.tarefas.some(t => t.titulo === dados.titulo && t.origem === "pre-anotadas");
    if (!jaExiste) {
      adicionarTarefa(dados);
    }
  });

  // 3. Re-renderizar a lista
  render();
}


/** Renderiza todas as tarefas conforme filtros/ordenação/pesquisa */
function render() {
  const lista = document.getElementById("listaTarefas");
  lista.innerHTML = "";

  // Filtragem por aba
  let tarefas = [...state.tarefas];

  if (state.filtro === "pendentes") {
    tarefas = tarefas.filter(t => t.status === "pendente");
  } else if (state.filtro === "concluidas") {
    tarefas = tarefas.filter(t => t.status === "concluida");
  } else if (state.filtro === "pre-anotadas") {
    tarefas = tarefas.filter(t => t.origem === "pre-anotadas");
  } else if (state.filtro === "minhas-lições") {
    tarefas = tarefas.filter(t => t.origem === "minhas-lições");
  } else if (state.filtro.startsWith("tipo:")) {
    const tipo = state.filtro.split(":")[1];
    tarefas = tarefas.filter(t => t.tipo === tipo);
  }


  // Busca por título
  if (state.busca.trim()) {
    const q = state.busca.trim().toLowerCase();
    tarefas = tarefas.filter(t => t.titulo.toLowerCase().includes(q));
  }

  // Ordenação por data
  tarefas.sort((a, b) => {
    // primeiro por 'order' (drag-and-drop), depois por data (quando iguais)
    if (a.order !== b.order) return a.order - b.order;
    const da = new Date(a.dataEntrega).getTime();
    const db = new Date(b.dataEntrega).getTime();
    return state.ordenacao === "asc" ? da - db : db - da;
  });

  // Monta DOM
  const frag = document.createDocumentFragment();
  tarefas.forEach(t => frag.appendChild(criarCard(t)));
  lista.appendChild(frag);

  // Atualiza progresso
  atualizarProgresso();
}

// ============================ CRUD ===================================

/** Adiciona nova tarefa */
function adicionarTarefa(dados) {
  const nova = {
    id: uid(),
    titulo: dados.titulo.trim(),
    descricao: (dados.descricao || "").trim(),
    dataEntrega: dados.dataEntrega,
    pagina: dados.pagina.trim(),
    tipo: dados.tipo,
    status: dados.status, // "pendente" | "concluida"
    imagem: dados.imagem || null, // dataURL
    icone: dados.icone || null,   // emoji
    createdAt: Date.now(),
    order: state.tarefas.length ? Math.max(...state.tarefas.map(t => t.order || 0)) + 1 : 1,
    origem: dados.origem// padrão para novas tarefas
  };
  state.tarefas.push(nova);
  salvarLocal();
  render();
}

/** Atualiza tarefa existente */
function atualizarTarefa(id, dados) {
  const idx = state.tarefas.findIndex(t => t.id === id);
  if (idx === -1) return;
  const t = state.tarefas[idx];
  state.tarefas[idx] = {
    ...t,
    titulo: dados.titulo.trim(),
    descricao: (dados.descricao || "").trim(),
    dataEntrega: dados.dataEntrega,
    pagina: dados.pagina.trim(),
    tipo: dados.tipo,
    status: dados.status,
    // Mantém imagem/ícone a menos que o usuário forneça novo
    imagem: dados.imagem !== undefined ? dados.imagem : t.imagem,
    icone: dados.icone !== undefined ? dados.icone : t.icone,
  };
  salvarLocal();
  render();
}

/** Exclui tarefa */
function excluirTarefa(id) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
  state.tarefas = state.tarefas.filter(t => t.id !== id);
  salvarLocal();
  render();
}

/** Alterna status (pendente <-> concluída) */
function alternarStatus(id) {
  const t = state.tarefas.find(x => x.id === id);
  if (!t) return;
  t.status = (t.status === "pendente") ? "concluida" : "pendente";
  salvarLocal();
  render();
}

// ============================ Modal/Form =============================

const modal = document.getElementById("modalTarefa");
const form = document.getElementById("formTarefa");
const fecharModalBtn = document.getElementById("fecharModal");
const btnNovaTarefa = document.getElementById("btnNovaTarefa");
const btnSalvar = document.getElementById("salvarTarefa");

/** Limpa e abre o modal para nova tarefa */
function abrirModalNova() {
  form.reset();
  document.getElementById("tarefaId").value = "";
  document.getElementById("iconeEscolhido").value = "";
  document.getElementById("modalTitulo").textContent = "Nova Tarefa";
  // limpa estado de ícones
  document.querySelectorAll(".icon-choice").forEach(b => b.classList.remove("active"));
  modal.showModal();
}

/** Preenche e abre o modal para editar */
function abrirModalEdicao(id) {
  const t = state.tarefas.find(x => x.id === id);
  if (!t) return;
  document.getElementById("tarefaId").value = t.id;
  document.getElementById("titulo").value = t.titulo;
  document.getElementById("tipo").value = t.tipo;
  document.getElementById("dataEntrega").value = t.dataEntrega;
  document.getElementById("pagina").value = t.pagina;
  document.getElementById("descricao").value = t.descricao;
  // status
  form.querySelectorAll('input[name="status"]').forEach(r => r.checked = (r.value === t.status));
  // ícone
  document.getElementById("iconeEscolhido").value = t.icone || "";
  document.querySelectorAll(".icon-choice").forEach(b => {
    b.classList.toggle("active", b.dataset.icon === t.icone);
  });
  document.getElementById("modalTitulo").textContent = "Editar Tarefa";
  modal.showModal();
}

/** Fecha modal */
function fecharModal() { modal.close(); }

/** Converte arquivo de imagem em DataURL base64 */
function arquivoParaDataURL(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

/** Lida com envio do formulário */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("tarefaId").value || null;
  const titulo = document.getElementById("titulo").value;
  const tipo = document.getElementById("tipo").value;
  const dataEntrega = document.getElementById("dataEntrega").value;
  const pagina = document.getElementById("pagina").value;
  const descricao = document.getElementById("descricao").value;
  const status = form.querySelector('input[name="status"]:checked')?.value || "pendente";
  const icone = document.getElementById("iconeEscolhido").value || null;
  const arquivoImg = document.getElementById("imagem").files?.[0] || null;
  const origem = "minhas-lições"

  // Validação simples
  if (!titulo || !tipo || !dataEntrega || !pagina) {
    alert("Por favor, preencha todos os campos obrigatórios (*)");
    return;
  }

  let imagemDataURL = undefined; // "undefined" para manter imagem anterior ao editar
  if (arquivoImg) {
    try { imagemDataURL = await arquivoParaDataURL(arquivoImg); }
    catch { alert("Falha ao carregar imagem."); }
  } else if (icone && !id) {
    // Se é nova tarefa, e escolheu ícone (sem upload), zera imagem
    imagemDataURL = null;
  }

  const dados = { titulo, tipo, dataEntrega, pagina, descricao, status, icone, imagem: imagemDataURL, origem};

  if (!id) adicionarTarefa(dados);
  else atualizarTarefa(id, dados);

  fecharModal();
});

// Ícones rápidos
document.querySelectorAll(".icon-choice").forEach(btn => {
  btn.addEventListener("click", () => {
    const icone = btn.dataset.icon;
    document.getElementById("iconeEscolhido").value = icone;
    document.querySelectorAll(".icon-choice").forEach(b => b.classList.toggle("active", b === btn));
    // Se escolher ícone, limpamos o input de arquivo (se houver algo)
    document.getElementById("imagem").value = "";
  });
});

btnNovaTarefa.addEventListener("click", abrirModalNova);
fecharModalBtn.addEventListener("click", fecharModal);

// ============================ Filtros / Busca / Ordenação ============

/** Navbar: filtros rápidos */
document.querySelectorAll(".nav-btn[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.filtro = btn.dataset.filter;
    render();
  });
});

// Menu "Por Tipo"
const dropdown = document.querySelector(".nav-dropdown");
const btnPorTipo = document.getElementById("btnPorTipo");
btnPorTipo.addEventListener("click", () => {
  dropdown.classList.toggle("open");
});
document.getElementById("menuTipos").addEventListener("click", (e) => {
  const item = e.target.closest(".nav-item");
  if (!item) return;
  // Marca a aba como ativa visualmente
  document.querySelectorAll(".nav-btn[data-filter]").forEach(b => b.classList.remove("active"));
  btnPorTipo.classList.add("active");
  dropdown.classList.remove("open");
  state.filtro = "tipo:" + item.dataset.type;
  render();
});

// Busca por título
document.getElementById("busca").addEventListener("input", (e) => {
  state.busca = e.target.value;
  render();
});

// Ordenação por data
document.getElementById("ordenacao").addEventListener("change", (e) => {
  state.ordenacao = e.target.value;
  render();
});

// ============================ Exportar / Importar =====================

document.getElementById("btnExportar").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ tarefas: state.tarefas }, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const data = new Date().toISOString().slice(0,10);
  a.download = `agenda_virtual_${data}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importarArquivo").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!json || !Array.isArray(json.tarefas)) throw new Error("Arquivo inválido.");
    // Mescla sem duplicar por id (se colidir, atualiza a existente)
    const map = new Map(state.tarefas.map(t => [t.id, t]));
    for (const t of json.tarefas) {
      if (map.has(t.id)) {
        map.set(t.id, { ...map.get(t.id), ...t });
      } else {
        map.set(t.id, t);
      }
    }
    state.tarefas = Array.from(map.values());
    salvarLocal();
    render();
    alert("Tarefas importadas com sucesso!");
  } catch (err) {
    alert("Falha ao importar JSON: " + err.message);
  } finally {
    e.target.value = ""; // limpa input
  }
});

// ============================ Drag & Drop =============================

let dragSrcId = null;

function handleDragStart(e) {
  dragSrcId = this.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  this.style.opacity = "0.6";
}

function handleDragOver(e) {
  e.preventDefault(); // permite drop
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();
  const alvoId = this.dataset.id;
  if (!dragSrcId || dragSrcId === alvoId) return;

  const lista = state.tarefas.sort((a,b) => (a.order || 0) - (b.order || 0));
  const origemIdx = lista.findIndex(t => t.id === dragSrcId);
  const alvoIdx = lista.findIndex(t => t.id === alvoId);

  if (origemIdx === -1 || alvoIdx === -1) return;

  // Reordena array (modo simples: mover origem para a posição do alvo)
  const [movida] = lista.splice(origemIdx, 1);
  lista.splice(alvoIdx, 0, movida);

  // Reatribui 'order' incremental
  lista.forEach((t, i) => t.order = i + 1);

  salvarLocal();
  render();
}

function handleDragEnd() {
  this.style.opacity = "";
  dragSrcId = null;
}

// ============================ Tema ===================================

const btnTema = document.getElementById("btnTema");
btnTema.addEventListener("click", () => {
  state.tema = (state.tema === "claro") ? "escuro" : "claro";
  aplicarTema();
  salvarLocal();
});

// ============================ Inicialização ===========================

function init() {
  carregarLocal();
  aplicarTema();
  iniciarRelogio();

  adicionarTarefasFixas(); // <<< adiciona tarefas fixas primeiro
  state.filtro = "todas";  // garante que todas apareçam inicialmente
  render();

  // Acessibilidade: fechar dropdown ao clicar fora
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-dropdown")) {
      document.querySelector(".nav-dropdown")?.classList.remove("open");
    }
  });
}



// Inicia app quando DOM estiver pronto
document.addEventListener("DOMContentLoaded", init);
