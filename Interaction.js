document.addEventListener("DOMContentLoaded", function () {
    const subjectSelect = document.getElementById("subjectSelect");
    const descriptionSelect = document.getElementById("descriptionSelect");
    const addTaskButton = document.getElementById("addTaskButton");
    const taskList = document.getElementById("taskList");
    const dateInput = document.getElementById("task-date");
    const cards = document.querySelectorAll(".card");

    function atualizarSelects() {
        subjectSelect.innerHTML = '<option value="" disabled selected>Selecione a matéria...</option>';
        descriptionSelect.innerHTML = '<option value="" disabled selected>Selecione a descrição...</option>';
        descriptionSelect.disabled = true;

        const materiasSet = new Set();
        const descricoesMap = {};

        cards.forEach(card => {
            const materia = card.querySelector("h4")?.textContent.trim();
            const descricao = card.querySelector(".card-description")?.textContent.trim();

            if (materia) materiasSet.add(materia);
            if (materia && descricao) {
                if (!descricoesMap[materia]) descricoesMap[materia] = [];
                descricoesMap[materia].push(descricao);
            }
        });

        materiasSet.forEach(materia => {
            const option = document.createElement("option");
            option.value = materia;
            option.textContent = materia;
            subjectSelect.appendChild(option);
        });

        subjectSelect.addEventListener("change", function () {
            const selectedSubject = subjectSelect.value;
            descriptionSelect.innerHTML = '<option value="" disabled selected>Selecione a descrição...</option>';

            if (descricoesMap[selectedSubject]) {
                descricoesMap[selectedSubject].forEach(desc => {
                    const option = document.createElement("option");
                    option.value = desc;
                    option.textContent = desc;
                    descriptionSelect.appendChild(option);
                });

                descriptionSelect.disabled = false;
            } else {
                descriptionSelect.disabled = true;
            }
        });
    }

    function salvarTarefas() {
        const tarefas = [];
        document.querySelectorAll("#taskList li").forEach(li => {
            tarefas.push(li.firstChild.textContent.trim());
        });
        localStorage.setItem("tarefas", JSON.stringify(tarefas));
    }

    function carregarTarefas() {
        const tarefasSalvas = JSON.parse(localStorage.getItem("tarefas")) || [];
        tarefasSalvas.forEach(tarefa => {
            adicionarTarefaNaLista(tarefa);
        });
    }

    function adicionarTarefaNaLista(tarefaTexto) {
        const tarefasExistentes = Array.from(taskList.children).map(li => li.firstChild.textContent.trim());

        if (tarefasExistentes.includes(tarefaTexto)) {
            alert("Esta tarefa já foi adicionada.");
            return;
        }

        const li = document.createElement("li");
        li.textContent = tarefaTexto;

        const removeButton = document.createElement("button");
        removeButton.textContent = "X";
        removeButton.classList.add("remove-btn");
        removeButton.addEventListener("click", function () {
            li.remove();
            removerDestaque(tarefaTexto);
            salvarTarefas();
        });

        li.appendChild(removeButton);
        taskList.appendChild(li);
        destacarCardPorTarefa(tarefaTexto);
        salvarTarefas();
    }

    function destacarCardPorTarefa(tarefaTexto) {
        cards.forEach(card => {
            const cardMateria = card.querySelector("h4")?.textContent.trim();
            const cardDescricao = card.querySelector(".card-description")?.textContent.trim();
            if (tarefaTexto.includes(cardMateria) && tarefaTexto.includes(cardDescricao)) {
                card.classList.add("highlighted");
            }
        });
    }

    function removerDestaque(tarefaTexto) {
        cards.forEach(card => {
            const cardMateria = card.querySelector("h4")?.textContent.trim();
            const cardDescricao = card.querySelector(".card-description")?.textContent.trim();
            if (tarefaTexto.includes(cardMateria) && tarefaTexto.includes(cardDescricao)) {
                card.classList.remove("highlighted");
            }
        });
    }

    addTaskButton.addEventListener("click", function () {
        const selectedSubject = subjectSelect.value;
        const selectedDescription = descriptionSelect.value;
        if (selectedSubject && selectedDescription) {
            const tarefaTexto = `${selectedSubject}: ${selectedDescription}`;
            adicionarTarefaNaLista(tarefaTexto);
        } else {
            alert("Por favor, selecione a matéria e a descrição.");
        }
    });

    function filtrarPorData() {
        const selectedDate = dateInput.value.split("-").reverse().join("/"); 
        let hasMatch = false;
        cards.forEach(card => {
            const dueDateElement = card.querySelector(".para");
            if (dueDateElement) {
                let dueDate = dueDateElement.textContent.trim().replace("Para ", "");
                if (dueDate === selectedDate) {
                    card.style.display = "block";
                    hasMatch = true;
                } else {
                    card.style.display = "none";
                }
            }
        });

        if (!hasMatch) {
            cards.forEach(card => card.style.display = "block");
            alert("Nenhuma tarefa encontrada para essa data.");
        }
    }

    dateInput.addEventListener("change", filtrarPorData);

    atualizarSelects();
    carregarTarefas();
});

    
    

//Abrir lição calendário

document.addEventListener("DOMContentLoaded", function () {
    const dateInput = document.getElementById("task-date");
    const cards = document.querySelectorAll(".card");
    const showAllButton = document.createElement("button");

    // Configuração do botão "Mostrar todas as lições"
    showAllButton.textContent = "Mostrar todas as lições";
    showAllButton.style.display = "none"; // Inicialmente oculto
    showAllButton.classList.add("show-all-btn"); // Adiciona uma classe para estilização

    // Insere o botão abaixo do calendário
    dateInput.parentElement.appendChild(showAllButton);

    dateInput.addEventListener("change", function () {
        const selectedDate = this.value.split("-").reverse().join("/"); // Converte 'YYYY-MM-DD' para 'DD/MM/YYYY'
        let hasMatch = false;

        cards.forEach(card => {
            const dueDateElement = card.querySelector(".para");
            const descriptionElement = card.querySelector(".card-description");

            if (dueDateElement && descriptionElement) {
                let dueDate = dueDateElement.textContent.trim().replace("Para ", ""); // Remove "Para "
                let description = descriptionElement.textContent.trim(); // Obtém a descrição

                if (dueDate === selectedDate && description !== "") {
                    card.style.display = "block"; // Exibe o card se a data for correspondente e a descrição estiver preenchida
                    hasMatch = true;
                } else {
                    card.style.display = "none"; // Esconde os cards inválidos
                }
            }
        });

        // Se não houver lições para a data, exibe todos os cards com descrição
        if (!hasMatch) {
            cards.forEach(card => {
                const descriptionElement = card.querySelector(".card-description");
                if (descriptionElement && descriptionElement.textContent.trim() !== "") {
                    card.style.display = "block"; // Exibe cards com descrição
                }
            });
            alert("Nenhuma tarefa encontrada para essa data. Exibindo todos os cards com lições.");
        }

        // Exibe o botão "Mostrar todas as lições" somente se houver lições encontradas
        if (hasMatch) {
            showAllButton.style.display = "block";
        } else {
            showAllButton.style.display = "none";
        }
    });

    // Evento do botão para exibir novamente apenas os cards com lições válidas e resetar a data
    showAllButton.addEventListener("click", function () {
        cards.forEach(card => {
            const descriptionElement = card.querySelector(".card-description");
            if (descriptionElement && descriptionElement.textContent.trim() !== "") {
                card.style.display = "block"; // Apenas os cards com lições são exibidos
            }
        });

        // Reseta o campo de data
        dateInput.value = ""; // Limpa o campo de data

        showAllButton.style.display = "none"; // Oculta o botão novamente
    });
});

//Verificar lição repitida
document.getElementById("addTaskButton").addEventListener("click", function () {
    let taskInput = document.getElementById("taskInput").value.trim();
    let taskDate = document.getElementById("task-date").value;
    let taskList = document.getElementById("taskList");
    
    if (taskInput === "") {
        alert("Por favor, insira uma tarefa válida!");
        return;
    }
    
    // Verifica se a tarefa já existe na lista
    let tasks = document.querySelectorAll("#taskList li");
    for (let task of tasks) {
        if (task.textContent === taskInput) {
            alert("Essa tarefa já foi adicionada!");
            return;
        }
    }
    
    // Cria um novo item na lista
    let listItem = document.createElement("li");
    listItem.textContent = taskInput + (taskDate ? " (Para: " + taskDate + ")" : "");
    taskList.appendChild(listItem);
    
    // Limpa o campo de entrada
    document.getElementById("taskInput").value = "";
    document.getElementById("task-date").value = "";
});

