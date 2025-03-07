document.addEventListener("DOMContentLoaded", function () {
    const addTaskButton = document.getElementById("addTaskButton");
    const taskInput = document.getElementById("taskInput");
    const taskList = document.getElementById("taskList");

    // Carregar tarefas salvas ao abrir o site
    function loadTasks() {
        const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
        savedTasks.forEach(task => {
            addTaskToList(task.text, task.completed);
        });
    }

    // Adicionar nova tarefa ao clicar no botão
    addTaskButton.addEventListener("click", function () {
        const taskText = taskInput.value.trim();
        if (taskText !== "") {
            addTaskToList(taskText);
            saveTasks();
            taskInput.value = "";
        }
    });

    taskInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addTaskButton.click();
        }
    });
    

    // Função para adicionar a tarefa ao HTML
    function addTaskToList(text, completed = false) {
        const taskItem = document.createElement("li");
        taskItem.textContent = text;
        taskItem.classList.add("task-item");

        // Se a tarefa estiver concluída, adiciona a classe correspondente
        if (completed) {
            taskItem.classList.add("completed");
        }

        // Alternar entre concluído/não concluído ao clicar
        taskItem.addEventListener("click", function () {
            taskItem.classList.toggle("completed");
            saveTasks();
        });

        // Criar botão de remover tarefa
        const removeButton = document.createElement("button");
        removeButton.textContent = "X";
        removeButton.classList.add("remove-btn"); // Garantir que tenha a classe 'remove-btn'
        removeButton.addEventListener("click", function () {
            taskItem.remove();
            saveTasks();
        });

        // Adicionar botão ao item da lista
        taskItem.appendChild(removeButton);
        taskList.appendChild(taskItem);
    }

    // Salvar tarefas no LocalStorage
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll(".task-item").forEach(task => {
            tasks.push({
                text: task.firstChild.textContent.trim(),
                completed: task.classList.contains("completed")
            });
        });
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    loadTasks();
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
