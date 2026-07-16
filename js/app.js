let currentUser = null;
let tasks = [];
let activeTaskId = null;
let timerInterval = null;
let timeRemaining = 25 * 60;
const totalDuration = 25 * 60;
let isPaused = false;
let soundEnabled = true;
let plantState = 1;
let nutrients = 0;
let isWithered = false;
let weeklyHistory = {
  "Lun": 0, "Mar": 0, "Mié": 0, "Jue": 0, "Vie": 0, "Sáb": 0, "Dom": 0
};
let isRegisterMode = false;

window.addEventListener('DOMContentLoaded', () => {
  currentUser = localStorage.getItem('focusglow_logged_in_user');
  if (currentUser) {
    showApp();
  } else {
    showAuth();
  }
  const taskForm = document.getElementById('task-form');
  if (taskForm) {
    taskForm.addEventListener('submit', addTask);
  }
});

function showAuth() {
  const authContainer = document.getElementById('auth-container');
  const mainGrid = document.getElementById('main-grid');
  if (mainGrid) mainGrid.style.display = 'none';
  if (authContainer) {
    authContainer.style.display = 'flex';
    authContainer.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-layout">
          <div class="auth-hero">
            <div class="auth-logo-brand">
              <span>💎</span> FocusGlow
            </div>
            <div class="hero-content">
              <span class="hero-badge">PRODUCTIVIDAD VIRTUAL</span>
              <h1 class="hero-title">Cultiva tu enfoque, crece tu jardín.</h1>
              <p class="hero-subtitle">Utiliza técnicas científicas de gestión de tiempo mientras creas y mantienes vivo un entorno digital relajante.</p>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-num">25</span>
                <span class="stat-label">MINUTOS DE ENFOQUE</span>
              </div>
              <div class="stat-item">
                <span class="stat-num">100%</span>
                <span class="stat-label">LIBRE DE DISTRACCIONES</span>
              </div>
            </div>
          </div>
          <div class="auth-form-column">
            <div class="auth-header-nav">
              <div class="auth-nav">
                <span class="nav-link">¿Primera vez?</span>
                <a href="#" id="nav-toggle-btn" class="nav-btn-alt">Crear Cuenta</a>
              </div>
            </div>
            <div class="auth-card-wrapper">
              <div class="auth-card">
                <h2 id="auth-title">Iniciar Sesión</h2>
                <p id="auth-subtitle" class="auth-card-subtitle">Introduce tus credenciales para acceder a tu espacio de enfoque.</p>
                <form id="auth-form">
                  <div class="input-group">
                    <label for="auth-username">NOMBRE DE USUARIO</label>
                    <div class="input-wrapper">
                      <span class="input-icon">👤</span>
                      <input type="text" id="auth-username" required placeholder="ej. neonDeveloper">
                    </div>
                  </div>
                  <div class="input-group">
                    <div class="label-row">
                      <label for="auth-password">CONTRASEÑA</label>
                      <a href="#" class="forgot-link">¿La olvidaste?</a>
                    </div>
                    <div class="input-wrapper">
                      <span class="input-icon">🔑</span>
                      <input type="password" id="auth-password" required placeholder="••••••••">
                    </div>
                  </div>
                  <div class="checkbox-group">
                    <input type="checkbox" id="remember-me" checked>
                    <label for="remember-me">Recordar sesión en este navegador</label>
                  </div>
                  <button type="submit" id="auth-submit-btn" class="solid-neon-btn">
                    <span>Ingresar</span>
                    <span class="arrow">→</span>
                  </button>
                </form>
                <div class="auth-toggle-text">
                  <span id="auth-toggle-text-span">¿No tienes cuenta?</span>
                  <a href="#" id="toggle-auth-mode">Regístrate aquí</a>
                </div>
              </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center;">
              FocusGlow © 2026. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    `;
    setupAuthEvents();
  }
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  if (userDisplay) userDisplay.innerText = '';
  if (logoutBtn) logoutBtn.style.display = 'none';
  resetTimerUI();
}

function setupAuthEvents() {
  const authForm = document.getElementById('auth-form');
  const toggleAuthMode = document.getElementById('toggle-auth-mode');
  const navToggleBtn = document.getElementById('nav-toggle-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
  }

  function switchAuthMode() {
    isRegisterMode = !isRegisterMode;
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text-span');
    const toggleBtn = document.getElementById('toggle-auth-mode');
    const navBtn = document.getElementById('nav-toggle-btn');

    if (isRegisterMode) {
      authTitle.innerText = 'Registrarse';
      authSubtitle.innerText = 'Crea una cuenta gratuita para comenzar a cultivar tu jardín virtual.';
      submitBtn.innerHTML = `<span>Crear Cuenta</span> <span class="arrow">→</span>`;
      toggleText.innerText = '¿Ya tienes cuenta?';
      toggleBtn.innerText = 'Inicia sesión aquí';
      if (navBtn) navBtn.innerText = 'Iniciar Sesión';
    } else {
      authTitle.innerText = 'Iniciar Sesión';
      authSubtitle.innerText = 'Introduce tus credenciales para acceder a tu espacio de enfoque.';
      submitBtn.innerHTML = `<span>Ingresar</span> <span class="arrow">→</span>`;
      toggleText.innerText = '¿No tienes cuenta?';
      toggleBtn.innerText = 'Regístrate aquí';
      if (navBtn) navBtn.innerText = 'Crear Cuenta';
    }
  }

  if (toggleAuthMode) toggleAuthMode.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode(); });
  if (navToggleBtn) navToggleBtn.addEventListener('click', (e) => { e.preventDefault(); switchAuthMode(); });

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

  let users = JSON.parse(localStorage.getItem('focusglow_users')) || {};

  if (isRegisterMode) {
    if (users[username]) {
      alert("El nombre de usuario ya está tomado. Elige otro.");
      return;
    }
    users[username] = { password: password };
    localStorage.setItem('focusglow_users', JSON.stringify(users));
    alert("¡Cuenta creada con éxito! Iniciando sesión automáticamente...");
    loginUser(username);
  } else {
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
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  showApp();
}

function logout() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  currentUser = null;
  localStorage.removeItem('focusglow_logged_in_user');
  showAuth();
}

function showApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-grid').style.display = 'grid';
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  if (userDisplay) userDisplay.innerText = `👤 ${currentUser}`;
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  loadFromLocalStorage();
  setupValidation();
  renderTasks();
  updatePlantUI();
  renderAnalytics();
}

function playChime() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.5);

    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
      gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.5);
    }, 200);

    setTimeout(() => {
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, audioCtx.currentTime);
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

function toggleSound(e) {
  soundEnabled = e.target.checked;
  if (currentUser) {
    localStorage.setItem(`focusglow_${currentUser}_sound`, JSON.stringify(soundEnabled));
  }
}

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

function addTask(e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const category = document.getElementById('task-category').value;
  const estimated = parseInt(document.getElementById('task-estimated').value) || 1;

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
  document.getElementById('task-form').reset();
  setupValidation();
}

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
  const timerDisplay = document.getElementById('timer-display');
  if (timerDisplay) timerDisplay.innerText = formattedTime;
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
    localStorage.removeItem(`focusglow_${currentUser}_tasks`);
    localStorage.removeItem(`focusglow_${currentUser}_plantState`);
    localStorage.removeItem(`focusglow_${currentUser}_nutrients`);
    localStorage.removeItem(`focusglow_${currentUser}_isWithered`);
    localStorage.removeItem(`focusglow_${currentUser}_weekly`);
    localStorage.removeItem(`focusglow_${currentUser}_sound`);
    location.reload();
  }
}