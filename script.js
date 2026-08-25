// Smart Campus Planner - 3단계(T3): 새로고침해도 유지되는 저장 기능 추가 + 전체 점검
// - 1단계(T1)에서 만든 추가 / 완료 체크 / 삭제 기능
// - 2단계(T2)에서 만든 카테고리 / 중요도 / 마감일 / 전체 완료율 표시 기능
// 위 두 단계의 기능을 모두 그대로 유지하면서, 브라우저의 localStorage를 이용해
// 할 일 데이터를 저장하고, 새로고침/재접속 시 다시 불러오는 기능을 추가한다.

// localStorage에 데이터를 저장할 때 사용할 key(이름표)
const STORAGE_KEY = "smart-campus-planner-todos";

// 할 일 목록을 저장하는 배열.
// 각 항목은 { id, title, category, priority, startDate, dueDate, completed } 형태를 가진다.
// - category : "학과" | "동아리" | "개인"
// - priority : "상" | "중" | "하"
// - startDate: "YYYY-MM-DD" 형식의 문자열 또는 빈 문자열("")
// - dueDate  : "YYYY-MM-DD" 형식의 문자열 또는 빈 문자열("")
let todos = [];

// 새로운 할 일에 부여할 고유 id를 만들기 위한 카운터
let nextId = 1;

// 화면의 주요 요소 참조
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const categorySelect = document.getElementById("category-select");
const prioritySelect = document.getElementById("priority-select");
const startDateInput = document.getElementById("start-date-input");
const dueDateInput = document.getElementById("due-date-input");
const todoList = document.getElementById("todo-list");
const emptyMessage = document.getElementById("empty-message");
const progressPercentEl = document.getElementById("progress-percent");
const progressBarFillEl = document.getElementById("progress-bar-fill");
const progressCountEl = document.getElementById("progress-count");

/**
 * 현재 todos 배열(할 일 목록)을 브라우저의 localStorage에 저장하는 함수
 * - 할 일을 추가/완료 체크/삭제할 때마다 이 함수를 호출해서 최신 상태를 저장한다.
 * - localStorage에 저장된 데이터는 브라우저를 새로고침하거나 다시 열어도 그대로 남아있다.
 */
function saveTodos() {
  try {
    const data = {
      todos: todos,
      nextId: nextId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // 저장 공간이 부족하거나 브라우저가 localStorage를 지원하지 않는 등의 예외 상황에서도
    // 화면 자체는 계속 정상적으로 동작하도록 오류를 콘솔에만 남기고 넘어간다.
    console.error("할 일 데이터를 저장하는 중 문제가 발생했습니다.", error);
  }
}

/**
 * 브라우저의 localStorage에 저장되어 있던 할 일 목록을 불러오는 함수
 * - 페이지가 처음 로드될 때(새로고침, 재접속 포함) 한 번 호출된다.
 * - 저장된 데이터가 없으면 빈 목록 상태를 그대로 유지한다.
 */
function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const data = JSON.parse(raw);
    if (data && Array.isArray(data.todos)) {
      todos = data.todos;
      nextId =
        typeof data.nextId === "number"
          ? data.nextId
          : todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
    }
  } catch (error) {
    // 저장된 데이터가 손상되었거나 읽을 수 없는 경우, 빈 목록으로 시작한다.
    console.error("저장된 할 일 데이터를 불러오는 중 문제가 발생했습니다.", error);
    todos = [];
    nextId = 1;
  }
}

/**
 * 마감일 문자열(YYYY-MM-DD)이 오늘보다 이전인지(기한이 지났는지) 확인하는 함수
 * @param {string} dueDate
 * @returns {boolean}
 */
function isOverdue(dueDate) {
  if (!dueDate) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  return due < today;
}

/**
 * 현재 todos 배열 상태를 화면(목록)에 다시 그려주는 함수
 */
function renderTodos() {
  // 목록을 비우고 다시 그린다
  todoList.innerHTML = "";

  // 할 일이 하나도 없으면 안내 문구를 보여주고, 있으면 숨긴다
  if (todos.length === 0) {
    emptyMessage.classList.remove("hidden");
  } else {
    emptyMessage.classList.add("hidden");
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = String(todo.id);

    // 완료 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    // 할 일 본문 영역 (제목 + 카테고리/중요도/마감일 배지)
    const mainDiv = document.createElement("div");
    mainDiv.className = "todo-main";

    // 할 일 제목 텍스트
    const titleSpan = document.createElement("span");
    titleSpan.className = "todo-title";
    titleSpan.textContent = todo.title;
    mainDiv.appendChild(titleSpan);

    // 카테고리 / 중요도 / 시작일 / 마감일 표시 영역
    const metaDiv = document.createElement("div");
    metaDiv.className = "todo-meta";

    const categoryBadge = document.createElement("span");
    categoryBadge.className = "badge badge-category-" + todo.category;
    categoryBadge.textContent = todo.category;
    metaDiv.appendChild(categoryBadge);

    const priorityBadge = document.createElement("span");
    priorityBadge.className = "badge badge-priority-" + todo.priority;
    priorityBadge.textContent = "중요도 " + todo.priority;
    metaDiv.appendChild(priorityBadge);

    if (todo.startDate) {
      const startDateBadge = document.createElement("span");
      startDateBadge.className = "badge badge-start-date";
      startDateBadge.textContent = "시작 " + todo.startDate;
      metaDiv.appendChild(startDateBadge);
    }

    if (todo.dueDate) {
      const dueDateBadge = document.createElement("span");
      const overdue = !todo.completed && isOverdue(todo.dueDate);
      dueDateBadge.className = "badge badge-due-date" + (overdue ? " overdue" : "");
      dueDateBadge.textContent = "마감 " + todo.dueDate + (overdue ? " (지남)" : "");
      metaDiv.appendChild(dueDateBadge);
    }

    mainDiv.appendChild(metaDiv);

    // 삭제 버튼
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(mainDiv);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });

  // 목록을 다시 그릴 때마다 완료율도 함께 갱신한다
  renderProgress();

  // 화면을 다시 그릴 때마다(추가/완료 체크/삭제 직후) 최신 상태를 저장소에 저장한다
  saveTodos();
}

/**
 * 전체 할 일 대비 완료된 할 일의 비율(완료율)을 계산해 화면에 표시하는 함수
 */
function renderProgress() {
  const total = todos.length;
  const completedCount = todos.filter((todo) => todo.completed).length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  progressPercentEl.textContent = percent + "%";
  progressBarFillEl.style.width = percent + "%";
  progressCountEl.textContent = "완료 " + completedCount + " / 전체 " + total;
}

/**
 * 새로운 할 일을 목록에 추가하는 함수
 * @param {string} title 할 일 제목
 * @param {string} category 카테고리 ("학과" | "동아리" | "개인")
 * @param {string} priority 중요도 ("상" | "중" | "하")
 * @param {string} startDate 시작일 ("YYYY-MM-DD" 또는 빈 문자열)
 * @param {string} dueDate 마감일 ("YYYY-MM-DD" 또는 빈 문자열)
 */
function addTodo(title, category, priority, startDate, dueDate) {
  const trimmedTitle = title.trim();
  if (trimmedTitle === "") {
    return;
  }

  todos.push({
    id: nextId++,
    title: trimmedTitle,
    category: category,
    priority: priority,
    startDate: startDate,
    dueDate: dueDate,
    completed: false,
  });

  renderTodos();
}

/**
 * 특정 id를 가진 할 일의 완료 상태를 반전(토글)시키는 함수
 * @param {number} id
 */
function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  renderTodos();
}

/**
 * 특정 id를 가진 할 일을 목록에서 삭제하는 함수
 * @param {number} id
 */
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  renderTodos();
}

// 폼 제출(추가 버튼 클릭 또는 엔터) 이벤트 처리
todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTodo(
    todoInput.value,
    categorySelect.value,
    prioritySelect.value,
    startDateInput.value,
    dueDateInput.value
  );

  // 입력값 초기화 (카테고리/중요도는 기본값 유지, 제목·시작일·마감일만 비움)
  todoInput.value = "";
  startDateInput.value = "";
  dueDateInput.value = "";
  todoInput.focus();
});

// 페이지가 처음 열릴 때: 저장되어 있던 할 일 목록을 불러온 뒤 화면에 그린다.
// (renderTodos 안에서 saveTodos도 함께 호출되지만, 방금 불러온 데이터를
//  그대로 다시 저장하는 것뿐이므로 데이터가 사라지거나 바뀌지는 않는다.)
loadTodos();
renderTodos();
