// ==========================================================================
// VARIABLES DE ESTADO GLOBALES
// ==========================================================================
let currentUser = null; // Almacena el nombre del usuario logueado

let tasks = [];
let activeTaskId = null;
let timerInterval = null;
let timeRemaining = 25 * 60; // 25 minutos en segundos
const totalDuration = 25 * 60;
let isPaused = false;
let soundEnabled = true;

// Estado del Jardín
let plantState = 1; // 1 a 4
let nutrients = 0; // 0 a 100
let isWithered = false;

// Historial de analíticas
let weeklyHistory = {
  "Lun": 0, "Mar": 0, "Mié": 0, "Jue": 0, "Vie": 0, "Sáb": 0, "Dom": 0
};

// ==========================================================================
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Comprobar si hay una sesión activa de usuario
  currentUser = localStorage.getItem('focusglow_logged_in_user');

  if (currentUser) {
    showApp();
  } else {
    showAuth();
  }

  setupValidation();
  setupAuthEvents();

  // Escucha el evento submit del formulario para agregar tareas de forma correcta
  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', addTask);
  }
});

// ==========================================================================
// MÓDULO DE AUTENTICACIÓN (LOGIN & REGISTRO MULTI-USUARIO)
// ==========================================================================
let isRegisterMode = false;

function setupAuthEvents() {
  const authForm = document.getElementById('auth-form');
  const toggleAuthMode = document.getElementById('toggle-auth-mode');
  const logoutBtn = document.getElementById('logout-btn');

  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  if (toggleAuthMode) {
    toggleAuthMode.addEventListener('click', (e) => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      
      const authTitle = document.getElementById('auth-title');
      const submitBtn = document.getElementById('auth-submit-btn');
      const toggleText = document.getElementById('auth-toggle-text-span');

      if (isRegisterMode) {
        authTitle.innerText = 'Registrarse';
        submitBtn.innerText = 'Crear Cuenta';
        toggleText.innerText = '¿Ya tienes cuenta?';
        toggleAuthMode.innerText = 'Inicia sesión aquí';
      } else {
        authTitle.innerText = 'Iniciar Sesión';
        submitBtn.innerText = 'Ingresar';
        toggleText.innerText = '¿No tienes cuenta?';
        toggleAuthMode.innerText = 'Regístrate aquí';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!username || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Obtener lista global de usuarios y sus credenciales de localStorage
  let users = JSON.parse(localStorage.getItem('focusglow_users')) || {};

  if (isRegisterMode) {
    // REGISTRO
    if (users[username]) {
      alert("El nombre de usuario ya está tomado. Elige otro.");
      return;
    }

    // Registrar y guardar credenciales
    users[username] = { password: password };
    localStorage.setItem('focusglow_users', JSON.stringify(users));

    alert("¡Cuenta creada con éxito! Iniciando sesión automáticamente...");

    // Autologin e inicio de sesión inmediato
    loginUser(username);
  } else {
    // INICIAR SESIÓN
    if (users[username] && users[username].password === password) {
      loginUser(username);
    } else {
      alert("Usuario o contraseña incorrectos.");
    }
  }
}

function loginUser(username) {
  currentUser = username;
  localStorage.setItem('focusglow_logged_in_user', currentUser);
  
  // Limpiar campos del formulario
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';

  showApp();
}

function logout() {
  // Asegurar que el temporizador se detenga antes de salir
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  currentUser = null;
  localStorage.removeItem('focusglow_logged_in_user');
  
  showAuth();
}

// Control de vistas (Auth vs App)
function showApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-grid').style.display = 'grid';
  
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  if (userDisplay) userDisplay.innerText = `👤 ${currentUser}`;
  if (logoutBtn) logoutBtn.style.display = 'inline-block';

  // Cargar todos los datos correspondientes únicamente al usuario activo
  loadFromLocalStorage();
  renderTasks();
  updatePlantUI();
  renderAnalytics();
}

function showAuth() {
  document.getElementById('auth-container').style.display = 'flex';
  document.getElementById('main-grid').style.display = 'none';
  
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  if (userDisplay) userDisplay.innerText = '';
  if (logoutBtn) logoutBtn.style.display = 'none';
  
  resetTimerUI();
}

// ==========================================================================
// SONIDOS DE RECOMPENSA SINTETIZADOS NATIVAMENTE
// ==========================================================================
function playChime() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Primera nota (Do)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.5);

    // Segunda nota (Mi) con delay
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.5);
    }, 200);

    // Tercera nota (Sol) con delay
    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      gain3.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.start();
      osc3.stop(audioCtx.currentTime + 0.5);
    }, 400);

  } catch (error) {
    console.error("No se pudo reproducir el sonido sintetizado: ", error);
  }
}

// --- MANEJO DE CONFIGURACIÓN DE AUDIO ---
function toggleSound(e) {
  soundEnabled = e.target.checked;
  if (currentUser) {
    localStorage.setItem(`focusglow_${currentUser}_sound`, JSON.stringify(soundEnabled));
  }
}

// ==========================================================================
// FORMULARIO & VALIDACIONES
// ==========================================================================
function setupValidation() {
  const titleInput = document.getElementById('task-title');
  const categoryInput = document.getElementById('task-category');
  const saveBtn = document.getElementById('save-task-btn');

  if (!titleInput || !categoryInput || !saveBtn) return;

  function validate() {
    if (titleInput.value.trim().length >= 3 && categoryInput.value !== "") {
      saveBtn.disabled = false;
      saveBtn.style.opacity = "1";
    } else {
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.5";
    }
  }

  titleInput.addEventListener('input', validate);
  categoryInput.addEventListener('change', validate);
  validate();
}

// --- AGREGAR TAREAS ---
function addTask(e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const category = document.getElementById('task-category').value;
  const estimated = parseInt(document.getElementById('task-estimated').value);

  const newTask = {
    id: Date.now(),
    title,
    category,
    estimated,
    completedPomodoros: 0,
    status: 'pending'
  };

  tasks.push(newTask);
  saveToLocalStorage();
  renderTasks();
  
  // Reset form
  document.getElementById('task-form').reset();
  setupValidation();
}

// --- RENDERIZADO DE TAREAS ---
function renderTasks() {
  const pendingList = document.getElementById('pending-tasks');
  const completedList = document.getElementById('completed-tasks');

  if (!pendingList || !completedList) return;

  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.status === 'completed' ? 'completed' : ''}`;

    let tomatoesHTML = '';
    for (let i = 0; i < task.estimated; i++) {
      tomatoesHTML += '🍅 ';
    }

    li.innerHTML = `
      <div class="task-header">
        <span class="task-title">${task.title}</span>
        <span class="badge badge-${task.category}">${task.category}</span>
      </div>
      <div class="task-tomatoes">${tomatoesHTML} <span style="font-size: 0.75rem; color: var(--text-muted);">(${task.completedPomodoros}/${task.estimated})</span></div>
      <div class="task-actions">
        ${task.status === 'pending' ? `
          <button class="task-btn" onclick="selectTask(${task.id})">Enfoque</button>
          <button class="task-btn complete-btn" onclick="completeTask(${task.id})">Completar</button>
        ` : ''}
        <button class="task-btn delete-btn" onclick="deleteTask(${task.id})">Eliminar</button>
      </div>
    `;

    if (task.status === 'pending') {
      pendingList.appendChild(li);
    } else {
      completedList.appendChild(li);
    }
  });
}

// --- EVENTOS DE TAREA ---
function selectTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    activeTaskId = task.id;
    document.getElementById('active-task-display').innerText = `Enfoque Activo: ${task.title}`;
  }
}

function completeTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.status = 'completed';
    if (activeTaskId === id) {
      activeTaskId = null;
      document.getElementById('active-task-display').innerText = 'Selecciona una tarea para iniciar';
      resetTimerUI();
    }
    saveToLocalStorage();
    renderTasks();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  if (activeTaskId === id) {
    activeTaskId = null;
    document.getElementById('active-task-display').innerText = 'Selecciona una tarea para iniciar';
    resetTimerUI();
  }
  saveToLocalStorage();
  renderTasks();
}

// ==========================================================================
// GESTIÓN DEL TEMPORIZADOR
// ==========================================================================
function toggleTimer() {
  if (!activeTaskId) {
    showWarning();
    return;
  }

  if (timerInterval) return;

  isPaused = false;
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'inline-block';
  document.getElementById('abandon-btn').style.display = 'inline-block';

  timerInterval = setInterval(() => {
    if (timeRemaining > 0) {
      timeRemaining--;
      updateTimerUI();
    } else {
      completePomodoro();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isPaused = true;
  document.getElementById('start-btn').style.display = 'inline-block';
  document.getElementById('pause-btn').style.display = 'none';
  
  const activeTask = tasks.find(t => t.id === activeTaskId);
  document.title = `[PAUSADO] ${activeTask ? activeTask.title : 'FocusGlow'}`;
}

function abandonSession() {
  const secondsPassed = totalDuration - timeRemaining;
  if (secondsPassed > 60) {
    isWithered = true;
    saveToLocalStorage();
    updatePlantUI();
  }

  resetTimerUI();
}

function completePomodoro() {
  playChime();
  
  const task = tasks.find(t => t.id === activeTaskId);
  if (task) {
    task.completedPomodoros = Math.min(task.estimated, task.completedPomodoros + 1);
  }

  nutrients = Math.min(100, nutrients + 25);
  if (nutrients >= 100 && plantState < 4) {
    plantState++;
    nutrients = (plantState === 4) ? 100 : 0;
  }
  isWithered = false;

  logProductivityMinutes(25);

  saveToLocalStorage();
  renderTasks();
  updatePlantUI();
  renderAnalytics();
  resetTimerUI();
}

function resetTimerUI() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeRemaining = totalDuration;
  isPaused = false;
  document.getElementById('start-btn').style.display = 'inline-block';
  document.getElementById('pause-btn').style.display = 'none';
  document.getElementById('abandon-btn').style.display = 'none';
  updateTimerUI();
}

function updateTimerUI() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  document.getElementById('timer-display').innerText = formattedTime;

  const ring = document.getElementById('progress-ring');
  if (ring) {
    const circumference = 565.48;
    const offset = circumference - (timeRemaining / totalDuration) * circumference;
    ring.style.strokeDashoffset = offset;
  }

  const activeTask = tasks.find(t => t.id === activeTaskId);
  if (activeTask) {
    if (isPaused) {
      document.title = `[PAUSADO] ${activeTask.title}`;
    } else {
      document.title = `[${formattedTime}] ${activeTask.title}`;
    }
  } else {
    document.title = "FocusGlow - Digital Garden";
  }
}

function showWarning() {
  const toast = document.getElementById('warning-toast');
  if (toast) {
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 3000);
  }
}

function toggleFocusMode() {
  if (!activeTaskId) {
    showWarning();
    return;
  }
  document.body.classList.add('focus-mode-active');
}

function exitFocusMode() {
  document.body.classList.remove('focus-mode-active');
}

// ==========================================================================
// MODULO VIRTUAL GARDEN & AUDIO
// ==========================================================================
function updatePlantUI() {
  const plantSvg = document.getElementById('plant-svg');
  const harvestBtn = document.getElementById('harvest-btn');
  
  if (!plantSvg) return;

  plantSvg.className.baseVal = "plant-svg";

  if (isWithered) {
    plantSvg.classList.add('withered');
  }

  plantSvg.classList.add(`state-${plantState}`);

  const nutrientBar = document.getElementById('nutrient-bar');
  const nutrientPercent = document.getElementById('nutrient-percent');
  if (nutrientBar) nutrientBar.style.width = `${nutrients}%`;
  if (nutrientPercent) nutrientPercent.innerText = `${nutrients}%`;

  if (harvestBtn) {
    if (plantState === 4 && !isWithered) {
      harvestBtn.style.display = 'block';
      plantSvg.classList.add('celebrate');
    } else {
      harvestBtn.style.display = 'none';
      plantSvg.classList.remove('celebrate');
    }
  }
}

function harvestPlant() {
  alert("¡Enhorabuena! Has cosechado una planta maravillosa gracias a tu enfoque.");
  plantState = 1;
  nutrients = 0;
  isWithered = false;
  saveToLocalStorage();
  updatePlantUI();
}

function logProductivityMinutes(minutes) {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const todayName = days[new Date().getDay()];
  weeklyHistory[todayName] = (weeklyHistory[todayName] || 0) + minutes;
}

// ==========================================================================
// ANALÍTICAS
// ==========================================================================
function renderAnalytics() {
  const container = document.getElementById('analytics-chart');
  if (!container) return;
  container.innerHTML = '';

  const maxVal = Math.max(...Object.values(weeklyHistory), 25);

  Object.entries(weeklyHistory).forEach(([day, minutes]) => {
    const heightPercent = (minutes / maxVal) * 100;

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-bar-wrapper';

    wrapper.innerHTML = `
      <div class="chart-bar" style="height: ${heightPercent}%;" title="${minutes} min enfocados"></div>
      <span class="chart-day">${day}</span>
    `;
    container.appendChild(wrapper);
  });
}

// ==========================================================================
// PERSISTENCIA DE DATOS EXCLUSIVA POR USUARIO
// ==========================================================================
function saveToLocalStorage() {
  if (!currentUser) return;
  
  localStorage.setItem(`focusglow_${currentUser}_tasks`, JSON.stringify(tasks));
  localStorage.setItem(`focusglow_${currentUser}_plantState`, JSON.stringify(plantState));
  localStorage.setItem(`focusglow_${currentUser}_nutrients`, JSON.stringify(nutrients));
  localStorage.setItem(`focusglow_${currentUser}_isWithered`, JSON.stringify(isWithered));
  localStorage.setItem(`focusglow_${currentUser}_weekly`, JSON.stringify(weeklyHistory));
}

function loadFromLocalStorage() {
  if (!currentUser) return;

  try {
    const localTasks = localStorage.getItem(`focusglow_${currentUser}_tasks`);
    const localState = localStorage.getItem(`focusglow_${currentUser}_plantState`);
    const localNutrients = localStorage.getItem(`focusglow_${currentUser}_nutrients`);
    const localWithered = localStorage.getItem(`focusglow_${currentUser}_isWithered`);
    const localWeekly = localStorage.getItem(`focusglow_${currentUser}_weekly`);
    const localSound = localStorage.getItem(`focusglow_${currentUser}_sound`);

    if (localTasks) {
      tasks = JSON.parse(localTasks);
    } else {
      // Valores por defecto para nuevos usuarios
      tasks = [
        { id: 1, title: 'Maquetar Interfaz CSS', category: 'diseno', estimated: 3, completedPomodoros: 1, status: 'pending' },
        { id: 2, title: 'Programar Core de JavaScript', category: 'desarrollo', estimated: 4, completedPomodoros: 2, status: 'pending' }
      ];
    }

    plantState = localState ? JSON.parse(localState) : 1;
    nutrients = localNutrients ? JSON.parse(localNutrients) : 0;
    isWithered = localWithered ? JSON.parse(localWithered) : false;
    weeklyHistory = localWeekly ? JSON.parse(localWeekly) : { "Lun": 0, "Mar": 0, "Mié": 0, "Jue": 0, "Vie": 0, "Sáb": 0, "Dom": 0 };

    if (localSound) {
      soundEnabled = JSON.parse(localSound);
      const soundToggle = document.getElementById('sound-toggle');
      if (soundToggle) soundToggle.checked = soundEnabled;
    }

  } catch (e) {
    console.warn("Datos corruptos detectados para el usuario actual, inicializando con valores por defecto.");
    tasks = [
      { id: 1, title: 'Revisión de requerimientos', category: 'reunion', estimated: 2, completedPomodoros: 0, status: 'pending' }
    ];
    plantState = 1;
    nutrients = 0;
    isWithered = false;
    weeklyHistory = { "Lun": 0, "Mar": 0, "Mié": 0, "Jue": 0, "Vie": 0, "Sáb": 0, "Dom": 0 };
  }
}

function resetApp() {
  if (!currentUser) return;
  
  if (confirm("¿Estás seguro de que deseas restablecer por completo tus datos? Perderás todo tu progreso personal.")) {
    // Solo borramos las claves del usuario actual para no interferir con otros perfiles
    localStorage.removeItem(`focusglow_${currentUser}_tasks`);
    localStorage.removeItem(`focusglow_${currentUser}_plantState`);
    localStorage.removeItem(`focusglow_${currentUser}_nutrients`);
    localStorage.removeItem(`focusglow_${currentUser}_isWithered`);
    localStorage.removeItem(`focusglow_${currentUser}_weekly`);
    localStorage.removeItem(`focusglow_${currentUser}_sound`);
    
    location.reload();
  }
}