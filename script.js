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