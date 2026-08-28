// Smart Campus Planner - 3단계(T3): 새로고침해도 유지되는 저장 기능 추가 + 전체 점검
// - 1단계(T1)에서 만든 추가 / 완료 체크 / 삭제 기능
// - 2단계(T2)에서 만든 카테고리 / 중요도 / 마감일 / 전체 완료율 표시 기능
// 위 두 단계의 기능을 모두 그대로 유지하면서, 브라우저의 localStorage를 이용해
// 할 일 데이터를 저장하고, 새로고침/재접속 시 다시 불러오는 기능을 추가한다.

// localStorage에 데이터를 저장할 때 사용할 key(이름표)
const STORAGE_KEY = "smart-campus-planner-todos";

// 일정별 메모를 저장할 때 사용할 key(이름표)
// 형태: { [todoId]: "메모 내용" }
const MEMO_STORAGE_KEY = "smart-campus-planner-memos";

// 시간표 데이터를 저장할 때 사용할 key(이름표)
// 형태: { "요일인덱스-시작시각": { subject: "과목명", location: "장소" } }
// 예: "0-9" => 월요일(0) 9시 칸
const TIMETABLE_STORAGE_KEY = "smart-campus-planner-timetable";

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

// 월간 달력 관련 요소 참조
const calendarTitleEl = document.getElementById("calendar-title");
const calendarGridEl = document.getElementById("calendar-grid");
const calendarPrevBtn = document.getElementById("calendar-prev-btn");
const calendarNextBtn = document.getElementById("calendar-next-btn");
const calendarSelectedInfoEl = document.getElementById("calendar-selected-info");

// 달력에서 현재 화면에 보여주고 있는 "연/월" 기준 날짜 (매달 1일로 고정해서 사용)
let calendarViewDate = new Date();
calendarViewDate.setDate(1);

// 달력에서 사용자가 클릭해 선택한 날짜("YYYY-MM-DD" 문자열, 없으면 null)
let selectedCalendarDate = null;

// 대한민국 공휴일 데이터 ("YYYY-MM-DD": "공휴일 이름")
// - 설날/추석처럼 음력 기준인 공휴일과 대체공휴일까지 포함해 미리 계산된 값을 담고 있다.
// - 이 앱은 별도 서버나 공휴일 API 없이 동작하는 정적인 웹페이지이므로,
//   공공데이터포털/행정안전부 발표 자료를 참고해 2024~2027년 공휴일을 직접 채워 넣었다.
// - 법정 공휴일이 추가/변경되면(예: 임시공휴일 지정) 이 표를 갱신해야 한다.
const HOLIDAYS_KR = {
  // 2024년
  "2024-01-01": "신정",
  "2024-02-09": "설날 연휴",
  "2024-02-10": "설날",
  "2024-02-11": "설날 연휴",
  "2024-02-12": "대체공휴일",
  "2024-03-01": "삼일절",
  "2024-04-10": "국회의원선거일",
  "2024-05-05": "어린이날",
  "2024-05-15": "부처님오신날",
  "2024-06-06": "현충일",
  "2024-08-15": "광복절",
  "2024-09-16": "추석 연휴",
  "2024-09-17": "추석",
  "2024-09-18": "추석 연휴",
  "2024-10-01": "임시공휴일",
  "2024-10-03": "개천절",
  "2024-10-09": "한글날",
  "2024-12-25": "성탄절",

  // 2025년
  "2025-01-01": "신정",
  "2025-01-27": "임시공휴일",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-03-01": "삼일절",
  "2025-03-03": "대체공휴일",
  "2025-05-05": "어린이날·부처님오신날",
  "2025-06-03": "임시공휴일(선거일)",
  "2025-06-06": "현충일",
  "2025-08-15": "광복절",
  "2025-10-03": "개천절",
  "2025-10-05": "추석 연휴",
  "2025-10-06": "추석",
  "2025-10-07": "추석 연휴",
  "2025-10-08": "대체공휴일",
  "2025-10-09": "한글날",
  "2025-12-25": "성탄절",

  // 2026년
  "2026-01-01": "신정",
  "2026-02-16": "설날 연휴",
  "2026-02-17": "설날",
  "2026-02-18": "설날 연휴",
  "2026-03-01": "삼일절",
  "2026-03-02": "대체공휴일",
  "2026-05-01": "노동절",
  "2026-05-05": "어린이날",
  "2026-05-24": "부처님오신날",
  "2026-05-25": "대체공휴일",
  "2026-06-06": "현충일",
  "2026-08-15": "광복절",
  "2026-08-17": "대체공휴일",
  "2026-09-24": "추석 연휴",
  "2026-09-25": "추석",
  "2026-09-26": "추석 연휴",
  "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일",
  "2026-10-09": "한글날",
  "2026-12-25": "성탄절",

  // 2027년
  "2027-01-01": "신정",
  "2027-02-06": "설날 연휴",
  "2027-02-07": "설날",
  "2027-02-08": "설날 연휴",
  "2027-02-09": "대체공휴일",
  "2027-03-01": "삼일절",
  "2027-05-01": "노동절",
  "2027-05-03": "대체공휴일",
  "2027-05-05": "어린이날",
  "2027-05-13": "부처님오신날",
  "2027-06-06": "현충일",
  "2027-08-15": "광복절",
  "2027-08-16": "대체공휴일",
  "2027-09-14": "추석 연휴",
  "2027-09-15": "추석",
  "2027-09-16": "추석 연휴",
  "2027-10-03": "개천절",
  "2027-10-04": "대체공휴일",
  "2027-10-09": "한글날",
  "2027-10-11": "대체공휴일",
  "2027-12-25": "성탄절",
};

/**
 * 특정 날짜("YYYY-MM-DD")가 한국 공휴일이면 그 이름을, 아니면 null을 반환하는 함수
 * @param {string} dateKey
 * @returns {string|null}
 */
function getHolidayName(dateKey) {
  return HOLIDAYS_KR[dateKey] || null;
}

// 왼쪽 상단 햄버거 메뉴 및 화면 전환(캘린더 / 메모 / 시간표) 관련 요소 참조
const menuToggleBtn = document.getElementById("menu-toggle-btn");
const menuDropdown = document.getElementById("menu-dropdown");
const menuOptionCalendar = document.getElementById("menu-option-calendar");
const menuOptionMemo = document.getElementById("menu-option-memo");
const menuOptionTimetable = document.getElementById("menu-option-timetable");
const calendarView = document.getElementById("calendar-view");
const memoView = document.getElementById("memo-view");
const timetableView = document.getElementById("timetable-view");

// 화면 이름과 각 화면의 DOM 요소 / 메뉴 버튼을 짝지어 관리하는 표
// - 화면을 추가/변경할 때 이 표만 갱신하면 switchView 로직을 그대로 재사용할 수 있다.
const VIEW_ELEMENTS = {
  calendar: { view: null, menuBtn: null }, // 아래에서 실제 요소로 채워진다
  memo: { view: null, menuBtn: null },
  timetable: { view: null, menuBtn: null },
};
VIEW_ELEMENTS.calendar.view = calendarView;
VIEW_ELEMENTS.calendar.menuBtn = menuOptionCalendar;
VIEW_ELEMENTS.memo.view = memoView;
VIEW_ELEMENTS.memo.menuBtn = menuOptionMemo;
VIEW_ELEMENTS.timetable.view = timetableView;
VIEW_ELEMENTS.timetable.menuBtn = menuOptionTimetable;

// 현재 보여주고 있는 화면 ("calendar" | "memo" | "timetable"). 기본값은 캘린더 화면이다.
let currentViewName = "calendar";

// 일정별 메모 화면 관련 요소 참조
const memoTodoListEl = document.getElementById("memo-todo-list");
const memoListEmptyEl = document.getElementById("memo-list-empty");
const memoTodoTitleEl = document.getElementById("memo-todo-title");
const memoTodoMetaEl = document.getElementById("memo-todo-meta");
const memoTextarea = document.getElementById("memo-textarea");
const memoSaveStatusEl = document.getElementById("memo-save-status");

// 일정별 메모 데이터를 담는 객체. { [todoId]: "메모 내용" } 형태를 가진다.
let memos = {};

// 메모 화면에서 현재 선택되어 있는 할 일의 id (선택 안 됨: null)
let selectedMemoTodoId = null;

// 시간표 화면 관련 요소 참조
const timetableGridEl = document.getElementById("timetable-grid");
const timetablePopupOverlay = document.getElementById("timetable-popup-overlay");
const timetablePopupTitle = document.getElementById("timetable-popup-title");
const timetablePopupSubjectInput = document.getElementById("timetable-popup-subject");
const timetablePopupLocationInput = document.getElementById("timetable-popup-location");
const timetablePopupDeleteBtn = document.getElementById("timetable-popup-delete-btn");
const timetablePopupCancelBtn = document.getElementById("timetable-popup-cancel-btn");
const timetablePopupSaveBtn = document.getElementById("timetable-popup-save-btn");

// 시간표에 표시할 요일 목록 (월~금)
const TIMETABLE_DAYS = ["월", "화", "수", "목", "금"];

// 시간표에 표시할 시간대 목록 (09시~21시, 1시간 단위 총 13칸: 09-10, 10-11, ..., 21-22)
const TIMETABLE_START_HOUR = 9;
const TIMETABLE_END_HOUR = 22;

// 시간표 데이터를 담는 객체. { "요일인덱스-시작시각": { subject, location } } 형태를 가진다.
let timetableEntries = {};

// 시간표 칸 클릭 시 입력 팝업이 어떤 칸을 대상으로 열렸는지 기억하는 값 ("요일인덱스-시작시각" 문자열, 없으면 null)
let activeTimetableCellKey = null;

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
 * 현재 memos 객체(일정별 메모)를 브라우저의 localStorage에 저장하는 함수
 * - 메모 내용을 입력할 때마다 호출해서 최신 상태를 저장한다.
 */
function saveMemos() {
  try {
    window.localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memos));
  } catch (error) {
    console.error("메모 데이터를 저장하는 중 문제가 발생했습니다.", error);
  }
}

/**
 * 브라우저의 localStorage에 저장되어 있던 일정별 메모를 불러오는 함수
 * - 페이지가 처음 로드될 때 한 번 호출된다.
 */
function loadMemos() {
  try {
    const raw = window.localStorage.getItem(MEMO_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      memos = data;
    }
  } catch (error) {
    console.error("저장된 메모 데이터를 불러오는 중 문제가 발생했습니다.", error);
    memos = {};
  }
}

/**
 * 현재 timetableEntries 객체(시간표 데이터)를 브라우저의 localStorage에 저장하는 함수
 * - 시간표 칸을 저장/삭제할 때마다 호출해서 최신 상태를 저장한다.
 */
function saveTimetable() {
  try {
    window.localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(timetableEntries));
  } catch (error) {
    console.error("시간표 데이터를 저장하는 중 문제가 발생했습니다.", error);
  }
}

/**
 * 브라우저의 localStorage에 저장되어 있던 시간표 데이터를 불러오는 함수
 * - 페이지가 처음 로드될 때 한 번 호출된다.
 */
function loadTimetable() {
  try {
    const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const data = JSON.parse(raw);
    if (data && typeof data === "object") {
      timetableEntries = data;
    }
  } catch (error) {
    console.error("저장된 시간표 데이터를 불러오는 중 문제가 발생했습니다.", error);
    timetableEntries = {};
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
 * 마감일 문자열(YYYY-MM-DD)을 기준으로 오늘부터 남은 일수를 계산하는 함수
 * - 오늘이 마감일이면 0, 마감일이 지나지 않았으면 양수, 이미 지났으면 음수를 반환한다.
 * @param {string} dueDate
 * @returns {number}
 */
function getDaysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((due.getTime() - today.getTime()) / msPerDay);
}

/**
 * 마감일 문자열(YYYY-MM-DD)을 받아 "D-3", "D-Day", "D+2" 형태의 D-Day 문구를 만드는 함수
 * - 마감일까지 남았으면 "D-남은일수", 오늘이 마감일이면 "D-Day", 이미 지났으면 "D+지난일수"를 반환한다.
 * @param {string} dueDate
 * @returns {string}
 */
function getDDayText(dueDate) {
  const diff = getDaysUntilDue(dueDate);
  if (diff === 0) {
    return "D-Day";
  }
  if (diff > 0) {
    return "D-" + diff;
  }
  return "D+" + Math.abs(diff);
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

      // 마감일까지 남은 날짜를 "D-3", "D-Day", "D+2" 형태로 함께 보여준다.
      const dDayBadge = document.createElement("span");
      dDayBadge.className = "badge badge-dday" + (overdue ? " overdue" : "");
      dDayBadge.textContent = getDDayText(todo.dueDate);
      metaDiv.appendChild(dDayBadge);
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

  // 목록을 다시 그릴 때마다 달력에 표시되는 시작일/마감일 점(dot)도 함께 갱신한다
  renderCalendar();

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
 * Date 객체를 "YYYY-MM-DD" 형식의 문자열로 변환하는 함수 (로컬 시간 기준)
 * @param {Date} date
 * @returns {string}
 */
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 현재 달력에 표시 중인 연/월을 기준으로 월간 달력을 그리는 함수
 * - 각 날짜 칸에는 해당 날짜를 시작일/마감일로 가진 할 일이 있으면 점(dot)으로 표시한다.
 * - 오늘 날짜는 테두리로 강조하고, 선택된 날짜는 배경색으로 강조한다.
 */
function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth(); // 0(1월) ~ 11(12월)

  calendarTitleEl.textContent = `${year}년 ${month + 1}월`;

  // 날짜별로 시작일/마감일 할 일이 있는지 미리 모아둔다.
  const dateInfoMap = {};
  todos.forEach((todo) => {
    if (todo.startDate) {
      if (!dateInfoMap[todo.startDate]) {
        dateInfoMap[todo.startDate] = { start: [], due: [] };
      }
      dateInfoMap[todo.startDate].start.push(todo);
    }
    if (todo.dueDate) {
      if (!dateInfoMap[todo.dueDate]) {
        dateInfoMap[todo.dueDate] = { start: [], due: [] };
      }
      dateInfoMap[todo.dueDate].due.push(todo);
    }
  });

  calendarGridEl.innerHTML = "";

  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const todayKey = formatDateKey(new Date());

  // 1일이 시작하는 요일 전까지는 빈 칸으로 채운다.
  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-cell empty";
    calendarGridEl.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateKey = formatDateKey(cellDate);
    const info = dateInfoMap[dateKey];
    const weekday = cellDate.getDay(); // 0(일) ~ 6(토)
    const holidayName = getHolidayName(dateKey);

    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.dataset.date = dateKey;

    // 주말(토/일) 표시: 일요일은 빨간 계열, 토요일은 파란 계열 글자색으로 구분한다.
    if (weekday === 0) {
      cell.classList.add("sunday");
    } else if (weekday === 6) {
      cell.classList.add("saturday");
    }

    // 대한민국 공휴일 표시: 날짜 숫자를 강조하고, 공휴일 이름을 작게 함께 보여준다.
    if (holidayName) {
      cell.classList.add("holiday");
      cell.title = holidayName;
    }

    if (dateKey === todayKey) {
      cell.classList.add("today");
    }
    if (dateKey === selectedCalendarDate) {
      cell.classList.add("selected");
    }

    const dateNum = document.createElement("span");
    dateNum.className = "calendar-date-num";
    dateNum.textContent = String(day);
    cell.appendChild(dateNum);

    if (holidayName) {
      const holidayLabel = document.createElement("span");
      holidayLabel.className = "calendar-holiday-name";
      holidayLabel.textContent = holidayName;
      cell.appendChild(holidayLabel);
    }

    if (info && (info.start.length > 0 || info.due.length > 0)) {
      cell.classList.add("has-todo");

      const dotsWrap = document.createElement("div");
      dotsWrap.className = "calendar-dots";

      if (info.start.length > 0) {
        const startDot = document.createElement("span");
        startDot.className = "calendar-dot calendar-dot-start";
        dotsWrap.appendChild(startDot);
      }
      if (info.due.length > 0) {
        const dueDot = document.createElement("span");
        dueDot.className = "calendar-dot calendar-dot-due";
        dotsWrap.appendChild(dueDot);
      }

      cell.appendChild(dotsWrap);

      cell.addEventListener("click", () => {
        selectedCalendarDate = selectedCalendarDate === dateKey ? null : dateKey;
        renderCalendar();
      });
    }

    calendarGridEl.appendChild(cell);
  }

  renderSelectedDateInfo(dateInfoMap);
}

/**
 * 달력에서 선택된 날짜에 해당하는 할 일 목록(시작일/마감일 기준)을 화면 하단에 보여주는 함수
 * @param {Object} dateInfoMap 날짜별 { start: Todo[], due: Todo[] } 정보
 */
function renderSelectedDateInfo(dateInfoMap) {
  calendarSelectedInfoEl.innerHTML = "";

  if (!selectedCalendarDate || !dateInfoMap[selectedCalendarDate]) {
    return;
  }

  const info = dateInfoMap[selectedCalendarDate];
  const heading = document.createElement("h3");
  heading.textContent = `${selectedCalendarDate} 할 일`;
  calendarSelectedInfoEl.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "calendar-selected-list";

  const combined = [
    ...info.start.map((todo) => ({ todo, type: "시작" })),
    ...info.due.map((todo) => ({ todo, type: "마감" })),
  ];

  combined.forEach(({ todo, type }) => {
    const item = document.createElement("li");
    item.className = "calendar-selected-item";

    const typeBadge = document.createElement("span");
    typeBadge.className =
      "badge " + (type === "시작" ? "badge-start-date" : "badge-due-date");
    typeBadge.textContent = type;
    item.appendChild(typeBadge);

    const titleSpan = document.createElement("span");
    titleSpan.textContent = todo.title;
    item.appendChild(titleSpan);

    list.appendChild(item);
  });

  calendarSelectedInfoEl.appendChild(list);
}

/**
 * 시간표 화면의 표(월~금 × 1시간 단위)를 처음부터 새로 그리는 함수
 * - 저장되어 있는 timetableEntries 데이터를 기준으로 이미 입력된 칸에는 과목명/장소를 표시한다.
 */
function renderTimetable() {
  timetableGridEl.innerHTML = "";

  // 머리글 행: 시간 열 + 월~금
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const cornerTh = document.createElement("th");
  cornerTh.className = "timetable-time-col";
  cornerTh.textContent = "시간";
  headRow.appendChild(cornerTh);

  TIMETABLE_DAYS.forEach((dayName) => {
    const th = document.createElement("th");
    th.textContent = dayName;
    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  timetableGridEl.appendChild(thead);

  // 본문: 시간대별 행, 각 행마다 월~금 5칸
  const tbody = document.createElement("tbody");

  for (let hour = TIMETABLE_START_HOUR; hour < TIMETABLE_END_HOUR; hour++) {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.className = "timetable-time-cell";
    timeCell.textContent = String(hour).padStart(2, "0") + ":00";
    row.appendChild(timeCell);

    TIMETABLE_DAYS.forEach((dayName, dayIndex) => {
      const cellKey = dayIndex + "-" + hour;
      const entry = timetableEntries[cellKey];

      const cell = document.createElement("td");
      cell.className = "timetable-cell";
      cell.dataset.cellKey = cellKey;

      if (entry) {
        cell.classList.add("filled");

        const subjectSpan = document.createElement("span");
        subjectSpan.className = "timetable-entry-subject";
        subjectSpan.textContent = entry.subject;
        cell.appendChild(subjectSpan);

        if (entry.location) {
          const locationSpan = document.createElement("span");
          locationSpan.className = "timetable-entry-location";
          locationSpan.textContent = entry.location;
          cell.appendChild(locationSpan);
        }
      }

      cell.addEventListener("click", () => openTimetablePopup(cellKey, dayName, hour));

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  }

  timetableGridEl.appendChild(tbody);
}

/**
 * 시간표의 특정 칸을 클릭했을 때 입력 팝업을 열고, 기존에 입력된 내용이 있으면 채워주는 함수
 * @param {string} cellKey "요일인덱스-시작시각" 형태의 칸 식별자
 * @param {string} dayName 요일 이름 (팝업 제목에 표시)
 * @param {number} hour 시작 시각 (팝업 제목에 표시)
 */
function openTimetablePopup(cellKey, dayName, hour) {
  activeTimetableCellKey = cellKey;

  const entry = timetableEntries[cellKey];
  timetablePopupTitle.textContent =
    dayName + "요일 " + String(hour).padStart(2, "0") + ":00 ~ " + String(hour + 1).padStart(2, "0") + ":00";
  timetablePopupSubjectInput.value = entry ? entry.subject : "";
  timetablePopupLocationInput.value = entry ? entry.location || "" : "";

  // 이미 입력된 내용이 있을 때만 삭제 버튼을 보여준다.
  timetablePopupDeleteBtn.classList.toggle("hidden", !entry);

  timetablePopupOverlay.classList.remove("hidden");
  timetablePopupSubjectInput.focus();
}

/**
 * 시간표 입력 팝업을 닫는 함수
 */
function closeTimetablePopup() {
  timetablePopupOverlay.classList.add("hidden");
  activeTimetableCellKey = null;
}

/**
 * 시간표 입력 팝업에서 입력한 내용을 저장하는 함수
 * - 과목명이 비어 있으면 저장하지 않고 안내만 한다.
 */
function saveTimetablePopup() {
  if (activeTimetableCellKey === null) {
    return;
  }

  const subject = timetablePopupSubjectInput.value.trim();
  if (subject === "") {
    timetablePopupSubjectInput.focus();
    return;
  }

  timetableEntries[activeTimetableCellKey] = {
    subject: subject,
    location: timetablePopupLocationInput.value.trim(),
  };

  saveTimetable();
  renderTimetable();
  closeTimetablePopup();
}

/**
 * 시간표 입력 팝업에서 현재 칸의 내용을 삭제하는 함수
 */
function deleteTimetablePopup() {
  if (activeTimetableCellKey === null) {
    return;
  }

  delete timetableEntries[activeTimetableCellKey];

  saveTimetable();
  renderTimetable();
  closeTimetablePopup();
}

/**
 * 왼쪽 상단 햄버거 버튼 아래에 펼쳐지는 드롭다운 메뉴를 열고 닫는 함수
 * @param {boolean} open true면 열기, false면 닫기
 */
function setMenuDropdownOpen(open) {
  menuDropdown.classList.toggle("hidden", !open);
  menuToggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  menuToggleBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
}

/**
 * 드롭다운 메뉴에서 선택한 화면("calendar" | "memo" | "timetable")으로 전환하는 함수
 * - 기본 화면은 캘린더 화면이며, 메뉴에서 선택한 화면만 보이고 나머지는 숨긴다.
 * @param {"calendar"|"memo"|"timetable"} viewName
 */
function switchView(viewName) {
  currentViewName = viewName;

  Object.keys(VIEW_ELEMENTS).forEach((name) => {
    const isActive = name === viewName;
    VIEW_ELEMENTS[name].view.classList.toggle("hidden", !isActive);
    VIEW_ELEMENTS[name].menuBtn.classList.toggle("active", isActive);
  });

  if (viewName === "memo") {
    renderMemoTodoOptions();
  } else if (viewName === "timetable") {
    renderTimetable();
  }

  setMenuDropdownOpen(false);
}

/**
 * 일정별 메모 화면 왼쪽의 "전체 일정 목록"을 현재 todos 배열을 기준으로 다시 그리는 함수
 * - 각 항목을 클릭하면 오른쪽 메모 작성 영역에 해당 일정이 표시된다.
 * - 이전에 선택되어 있던 할 일이 여전히 존재하면 선택 상태(강조 표시)를 유지한다.
 */
function renderMemoTodoOptions() {
  const previousSelectedId = selectedMemoTodoId;

  memoTodoListEl.innerHTML = "";

  const stillExists = todos.some((todo) => todo.id === previousSelectedId);
  selectedMemoTodoId = previousSelectedId !== null && stillExists ? previousSelectedId : null;

  memoListEmptyEl.classList.toggle("hidden", todos.length > 0);

  todos.forEach((todo) => {
    const li = document.createElement("li");

    const itemBtn = document.createElement("button");
    itemBtn.type = "button";
    itemBtn.className = "memo-todo-list-item";
    if (todo.id === selectedMemoTodoId) {
      itemBtn.classList.add("active");
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "memo-todo-list-item-title";
    titleSpan.textContent = (todo.completed ? "[완료] " : "") + todo.title;
    if (todo.dueDate) {
      titleSpan.textContent += " (" + getDDayText(todo.dueDate) + ")";
    }
    itemBtn.appendChild(titleSpan);

    // 메모가 이미 작성되어 있는 일정에는 작은 뱃지를 표시한다.
    if (memos[todo.id] && memos[todo.id].trim() !== "") {
      const memoBadge = document.createElement("span");
      memoBadge.className = "memo-todo-list-item-badge";
      memoBadge.textContent = "메모 있음";
      itemBtn.appendChild(memoBadge);
    }

    itemBtn.addEventListener("click", () => {
      selectedMemoTodoId = todo.id;
      renderMemoTodoOptions();
    });

    li.appendChild(itemBtn);
    memoTodoListEl.appendChild(li);
  });

  renderMemoDetail();
}

/**
 * 메모 화면에서 현재 선택된 할 일의 정보(제목/배지)와 저장된 메모 내용을 화면에 반영하는 함수
 */
function renderMemoDetail() {
  const todo = todos.find((item) => item.id === selectedMemoTodoId);

  memoTodoMetaEl.innerHTML = "";
  memoSaveStatusEl.textContent = "";

  if (!todo) {
    memoTodoTitleEl.textContent = "일정을 선택해주세요";
    memoTextarea.value = "";
    memoTextarea.disabled = true;
    return;
  }

  memoTodoTitleEl.textContent = todo.title;
  memoTextarea.disabled = false;
  memoTextarea.value = memos[todo.id] || "";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "badge badge-category-" + todo.category;
  categoryBadge.textContent = todo.category;
  memoTodoMetaEl.appendChild(categoryBadge);

  const priorityBadge = document.createElement("span");
  priorityBadge.className = "badge badge-priority-" + todo.priority;
  priorityBadge.textContent = "중요도 " + todo.priority;
  memoTodoMetaEl.appendChild(priorityBadge);

  if (todo.startDate) {
    const startDateBadge = document.createElement("span");
    startDateBadge.className = "badge badge-start-date";
    startDateBadge.textContent = "시작 " + todo.startDate;
    memoTodoMetaEl.appendChild(startDateBadge);
  }

  if (todo.dueDate) {
    const dueDateBadge = document.createElement("span");
    const overdue = !todo.completed && isOverdue(todo.dueDate);
    dueDateBadge.className = "badge badge-due-date" + (overdue ? " overdue" : "");
    dueDateBadge.textContent = "마감 " + todo.dueDate + (overdue ? " (지남)" : "");
    memoTodoMetaEl.appendChild(dueDateBadge);

    // 마감일까지 남은 날짜를 "D-3", "D-Day", "D+2" 형태로 함께 보여준다.
    const dDayBadge = document.createElement("span");
    dDayBadge.className = "badge badge-dday" + (overdue ? " overdue" : "");
    dDayBadge.textContent = getDDayText(todo.dueDate);
    memoTodoMetaEl.appendChild(dDayBadge);
  }
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

  // 삭제된 할 일에 연결되어 있던 메모도 함께 정리한다.
  if (Object.prototype.hasOwnProperty.call(memos, id)) {
    delete memos[id];
    saveMemos();
  }

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

// 달력 "이전 달" 버튼 클릭 이벤트 처리
calendarPrevBtn.addEventListener("click", () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
  renderCalendar();
});

// 달력 "다음 달" 버튼 클릭 이벤트 처리
calendarNextBtn.addEventListener("click", () => {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
  renderCalendar();
});

// 왼쪽 상단 햄버거(3줄) 메뉴 버튼 클릭 시 드롭다운 메뉴(캘린더/메모 선택)를 열고 닫는다.
menuToggleBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = !menuDropdown.classList.contains("hidden");
  setMenuDropdownOpen(!isOpen);
});

// 드롭다운 메뉴에서 "캘린더"를 선택하면 캘린더 화면으로 전환한다.
menuOptionCalendar.addEventListener("click", () => {
  switchView("calendar");
});

// 드롭다운 메뉴에서 "메모"를 선택하면 일정별 메모 화면으로 전환한다.
menuOptionMemo.addEventListener("click", () => {
  switchView("memo");
});

// 드롭다운 메뉴에서 "시간표"를 선택하면 시간표 화면으로 전환한다.
menuOptionTimetable.addEventListener("click", () => {
  switchView("timetable");
});

// 드롭다운 메뉴가 열려있는 상태에서 메뉴 바깥을 클릭하면 드롭다운을 닫는다.
document.addEventListener("click", (event) => {
  const isOpen = !menuDropdown.classList.contains("hidden");
  if (isOpen && !event.target.closest(".menu-wrapper")) {
    setMenuDropdownOpen(false);
  }
});

// 메모 내용을 입력할 때마다 자동으로 저장한다.
memoTextarea.addEventListener("input", () => {
  if (selectedMemoTodoId === null) {
    return;
  }
  memos[selectedMemoTodoId] = memoTextarea.value;
  saveMemos();

  // 왼쪽 목록의 "메모 있음" 뱃지 표시 여부를 최신 상태로 갱신한다.
  // (입력 중 매번 목록 전체를 새로 그리면 포커스가 풀리므로, 뱃지만 직접 갱신한다.)
  const activeItem = memoTodoListEl.querySelector(".memo-todo-list-item.active");
  if (activeItem) {
    const hasMemo = memoTextarea.value.trim() !== "";
    let badge = activeItem.querySelector(".memo-todo-list-item-badge");
    if (hasMemo && !badge) {
      badge = document.createElement("span");
      badge.className = "memo-todo-list-item-badge";
      badge.textContent = "메모 있음";
      activeItem.appendChild(badge);
    } else if (!hasMemo && badge) {
      badge.remove();
    }
  }

  memoSaveStatusEl.textContent = "저장되었습니다.";
  clearTimeout(memoTextarea._saveStatusTimer);
  memoTextarea._saveStatusTimer = setTimeout(() => {
    memoSaveStatusEl.textContent = "";
  }, 1500);
});

// 시간표 입력 팝업의 "저장" 버튼 클릭 이벤트 처리
timetablePopupSaveBtn.addEventListener("click", () => {
  saveTimetablePopup();
});

// 시간표 입력 팝업의 "삭제" 버튼 클릭 이벤트 처리
timetablePopupDeleteBtn.addEventListener("click", () => {
  deleteTimetablePopup();
});

// 시간표 입력 팝업의 "취소" 버튼 클릭 이벤트 처리
timetablePopupCancelBtn.addEventListener("click", () => {
  closeTimetablePopup();
});

// 시간표 입력 팝업의 어두운 배경(오버레이) 부분을 클릭하면 팝업을 닫는다.
timetablePopupOverlay.addEventListener("click", (event) => {
  if (event.target === timetablePopupOverlay) {
    closeTimetablePopup();
  }
});

// 시간표 입력 팝업에서 Enter 키를 누르면 저장, Escape 키를 누르면 닫기가 되도록 처리한다.
timetablePopupSubjectInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveTimetablePopup();
  }
});
timetablePopupLocationInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    saveTimetablePopup();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !timetablePopupOverlay.classList.contains("hidden")) {
    closeTimetablePopup();
  }
});

// 페이지가 처음 열릴 때: 저장되어 있던 할 일 목록, 메모, 시간표를 불러온 뒤 화면에 그린다.
// (renderTodos 안에서 saveTodos도 함께 호출되지만, 방금 불러온 데이터를
//  그대로 다시 저장하는 것뿐이므로 데이터가 사라지거나 바뀌지는 않는다.)
loadTodos();
loadMemos();
loadTimetable();
renderTodos();
