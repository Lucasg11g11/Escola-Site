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