"use strict";

const storage_key="teamflow_data";

function loadData(){
    try{
        const saved=localStorage.getItem(storage_key);
        if(saved){
            const data=JSON.parse(saved);
            if(
                Array.isArray(data.projects) &&
                Array.isArray(data.members) &&
                Array.isArray(data.tasks)
            )
            {
                return data;
            }
        }
    }
    catch(error){
        console.error("Could not load saved data:", error);

    }
    return{
        projects:[],
        members:[],
        tasks:[]
    };
}

let state = loadData();
let activeProjectId = state.projects[0]?.id || null;
let editingTaskId = null;


const projectForm = document.getElementById("projectform");
const projectName = document.getElementById("projectname");
const projectsList = document.getElementById("projectlist");

const memberForm = document.getElementById("memberform");
const memberName = document.getElementById("membername");
const membersList = document.getElementById("memberslist");

const projectTitle = document.getElementById("projecttitle");
const newTaskBtn = document.getElementById("newTaskbtn");

const taskDialog = document.getElementById("taskdialog");
const taskForm = document.getElementById("taskform");
const formTitle = document.getElementById("formtitle");
const taskTitle = document.getElementById("tasktitle");
const taskDescription = document.getElementById("taskdescription");
const taskAssignee = document.getElementById("taskassignee");
const taskDeadline = document.getElementById("taskdeadline");
const taskPriority = document.getElementById("taskpriority");
const taskStatus = document.getElementById("taskstatus");
const cancelBtn = document.getElementById("cancelbtn");

const columns = {
  todo: document.getElementById("todolist"),
  inprogress: document.getElementById("inprogresslist"),
  done: document.getElementById("donelist")
};

const counts = {
  todo: document.getElementById("count-todo"),
  inprogress: document.getElementById("count-inprogress"),
  done: document.getElementById("count-done")
};

const progressBar = document.getElementById("progressbar");
const progressText = document.getElementById("progresstext");
const taskSummary = document.getElementById("tasksummary");


function createId() {
  return crypto.randomUUID();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getActiveProject() {
  return state.projects.find(
    project => project.id === activeProjectId
  );
}



function getMemberName(memberId) {
  const member = state.members.find(
    item => item.id === memberId
  );

  return member ? member.name : "Unassigned";
}

projectForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = projectName.value.trim();

  if (!name) return;

  const project = {
    id: createId(),
    name: name
  };

  state.projects.push(project);

  activeProjectId = project.id;

  saveData();
  projectForm.reset();
  renderAll();
});



function renderProjects() {
  projectsList.innerHTML = "";

  state.projects.forEach(project => {
    const item = document.createElement("div");

    item.className =
      "project-item" +
      (project.id === activeProjectId ? " active" : "");

    item.innerHTML = `
      <div class="project-name">${escapeHTML(project.name)}</div>
      <button type="button" class="delete-project">
        Delete
      </button>
    `;

    item.addEventListener("click", event => {
      if (event.target.closest(".delete-project")) return;

      activeProjectId = project.id;
      renderAll();
    });

    item.querySelector(".delete-project").addEventListener(
      "click",
      () => {
        if (!confirm(`Delete "${project.name}" and its tasks?`)) {
          return;
        }

        state.projects = state.projects.filter(
          item => item.id !== project.id
        );

        state.tasks = state.tasks.filter(
          task => task.projectId !== project.id
        );

        if (activeProjectId === project.id) {
          activeProjectId = state.projects[0]?.id || null;
        }

        saveData();
        renderAll();
      }
    );

    projectsList.appendChild(item);
  });
}



memberForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = memberName.value.trim();

  if (!name) return;

  state.members.push({
    id: createId(),
    name: name
  });

  saveData();
  memberForm.reset();
  renderAll();
});


function renderMembers() {
  membersList.innerHTML = "";

  state.members.forEach(member => {
    const item = document.createElement("div");
    item.className = "member-item";

    item.innerHTML = `
      <span>${escapeHTML(member.name)}</span>
      <button type="button" class="remove-member">
        Remove
      </button>
    `;

    item.querySelector(".remove-member").addEventListener(
      "click",
      () => {
        if (!confirm(`Remove ${member.name} from the team?`)) {
          return;
        }

        state.members = state.members.filter(
          item => item.id !== member.id
        );

        // Unassign tasks belonging to this member.
        state.tasks.forEach(task => {
          if (task.assignee === member.id) {
            task.assignee = "";
          }
        });

        saveData();
        renderAll();
      }
    );

    membersList.appendChild(item);
  });

  taskAssignee.innerHTML =
    '<option value="">Unassigned</option>';

  state.members.forEach(member => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    taskAssignee.appendChild(option);
  });
}



newTaskBtn.addEventListener("click", () => {
  if (!activeProjectId) {
    alert("Create or select a project first.");
    return;
  }

  openTaskForm();
});

function openTaskForm(task = null) {
  editingTaskId = task ? task.id : null;

  taskForm.reset();

  formTitle.textContent = task ? "Edit Task" : "Create a Task";

  taskTitle.value = task ? task.title : "";
  taskDescription.value = task ? task.description : "";
  taskAssignee.value = task ? task.assignee : "";
  taskDeadline.value = task ? task.deadline : "";
  taskPriority.value = task ? task.priority : "medium";
  taskStatus.value = task ? task.status : "todo";

  taskDialog.showModal();
}

cancelBtn.addEventListener("click", () => {
  taskDialog.close();
});





taskForm.addEventListener("submit", event => {
  event.preventDefault();

  if (!activeProjectId) return;

  const title = taskTitle.value.trim();

  if (!title) return;

  const taskData = {
    title: title,
    description: taskDescription.value.trim(),
    assignee: taskAssignee.value,
    deadline: taskDeadline.value,
    priority: taskPriority.value,
    status: taskStatus.value
  };

  if (editingTaskId) {
    const task = state.tasks.find(
      item => item.id === editingTaskId
    );

    if (task) {
      Object.assign(task, taskData);
    }
  } else {
    state.tasks.push({
      id: createId(),
      projectId: activeProjectId,
      ...taskData
    });
  }

  saveData();
  taskDialog.close();
  renderAll();
});




function renderTasks() {
  Object.values(columns).forEach(column => {
    column.innerHTML = "";
  });

  Object.values(counts).forEach(count => {
    count.textContent = "0";
  });

  const project = getActiveProject();

  if (!project) {
    projectTitle.textContent = "Welcome to TeamFlow";
    updateProgress([]);
    return;
  }

  projectTitle.textContent = project.name;

  const tasks = state.tasks.filter(
    task => task.projectId === activeProjectId
  );

  tasks.forEach(task => {
    const card = document.createElement("article");

    card.className = "task-card";
    card.draggable = true;

    card.innerHTML = `
      <span class="priority ${escapeHTML(task.priority)}">
        ${escapeHTML(task.priority.toUpperCase())} PRIORITY
      </span>

      <h4>${escapeHTML(task.title)}</h4>

      <p>${escapeHTML(task.description || "No description")}</p>

      <p>👤 ${escapeHTML(getMemberName(task.assignee))}</p>

      <p>📅 ${escapeHTML(task.deadline || "No deadline")}</p>

      <div class="task-actions">
        <button type="button" class="edit-btn">Edit</button>
        <button type="button" class="delete-btn">Delete</button>
      </div>
    `;

    card.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
    });

    card.querySelector(".edit-btn").addEventListener(
      "click",
      () => openTaskForm(task)
    );

    card.querySelector(".delete-btn").addEventListener(
      "click",
      () => {
        if (!confirm(`Delete "${task.title}"?`)) return;

        state.tasks = state.tasks.filter(
          item => item.id !== task.id
        );

        saveData();
        renderAll();
      }
    );

    const destination = columns[task.status] || columns.todo;
    destination.appendChild(card);

    counts[task.status].textContent =
      Number(counts[task.status].textContent) + 1;
  });

  updateProgress(tasks);
}



document.querySelectorAll(".column").forEach(column => {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  column.addEventListener("drop", event => {
    event.preventDefault();

    const taskId = event.dataTransfer.getData("text/plain");
    const newStatus = column.dataset.status;

    const task = state.tasks.find(
      item => item.id === taskId
    );

    if (!task || task.projectId !== activeProjectId) return;

    task.status = newStatus;

    saveData();
    renderAll();
  });
});




function updateProgress(tasks) {
  const total = tasks.length;

  const completed = tasks.filter(
    task => task.status === "done"
  ).length;

  const percentage = total
    ? Math.round((completed / total) * 100)
    : 0;

  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}%`;

  taskSummary.textContent =
    `${completed} of ${total} tasks completed`;
}



function renderAll() {
  renderProjects();
  renderMembers();
  renderTasks();
}

renderAll();