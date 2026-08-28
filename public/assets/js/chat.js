// Auth state
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Roles del sistema
const ROLE_LABELS = {
    'admin': 'Admin',
    'call center': 'Call Center',
    'desarrollo': 'Desarrollo',
    'customer': 'Customer',
    'sales': 'Sales'
};

// DOM Elements
const authModal = document.getElementById('authModal');
const app = document.getElementById('app');
const loginFormElement = document.getElementById('loginFormElement');

const sidebarAvatar = document.getElementById('sidebarAvatar');
const settingsBtn = document.getElementById('settingsBtn');
const historyBtn = document.getElementById('historyBtn');
const newChatBtn = document.getElementById('newChatBtn');
const logoBtn = document.getElementById('logoBtn');
const topbarTitle = document.getElementById('topbarTitle');

// Notificaciones DOM
const bellWrap = document.getElementById('bellWrap');
const bellBtn = document.getElementById('bellBtn');
const bellBadge = document.getElementById('bellBadge');
const bellDropdown = document.getElementById('bellDropdown');
const bellList = document.getElementById('bellList');
const bellMarkAll = document.getElementById('bellMarkAll');
const bellEmpty = document.getElementById('bellEmpty');
const toastContainer = document.getElementById('toastContainer');
const notifEnabledToggle = document.getElementById('notifEnabledToggle');
const notifSoundToggle = document.getElementById('notifSoundToggle');

const greetingText = document.getElementById('greetingText');
const heroSection = document.getElementById('heroSection');
const chatSection = document.getElementById('chatSection');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMicBtn = document.getElementById('chatMicBtn');
const chatImgBtn = document.getElementById('chatImgBtn');
const chatFileInput = document.getElementById('chatFileInput');
const chatAttachments = document.getElementById('chatAttachments');
const chatStatus = document.getElementById('chatStatus');
const heroMicBtn = document.getElementById('heroMicBtn');
const heroImgBtn = document.getElementById('heroImgBtn');
const heroFileInput = document.getElementById('heroFileInput');
const heroAttachments = document.getElementById('heroAttachments');
const heroStatus = document.getElementById('heroStatus');
const actionBtns = document.querySelectorAll('.action-btn');

// Admin windows DOM
const adminPanel = document.getElementById('adminPanel');
const adminCloseBtn = document.getElementById('adminCloseBtn');
const createUserForm = document.getElementById('createUserForm');
const usersTableBody = document.getElementById('usersTableBody');
const createUserMsg = document.getElementById('createUserMsg');
const usersMsg = document.getElementById('usersMsg');

const editWindow = document.getElementById('editWindow');
const editUserForm = document.getElementById('editUserForm');
const editFullName = document.getElementById('editFullName');
const editEmail = document.getElementById('editEmail');
const editUserMsg = document.getElementById('editUserMsg');

// History DOM
const historyPanel = document.getElementById('historyPanel');
const historyCloseBtn = document.getElementById('historyCloseBtn');
const historyList = document.getElementById('historyList');
const historyMsg = document.getElementById('historyMsg');

// Profile DOM
const profilePanel = document.getElementById('profilePanel');
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileUsername = document.getElementById('profileUsername');
const profileRole = document.getElementById('profileRole');
const profileMsg = document.getElementById('profileMsg');
const profileAvatarEdit = document.getElementById('profileAvatarEdit');
const avatarFileInput = document.getElementById('avatarFileInput');
const profileLogoutBtn = document.getElementById('profileLogoutBtn');

// Project Manager DOM
const pmBtn = document.getElementById('pmBtn');
const pmView = document.getElementById('pmView');
const pmGrid = document.getElementById('pmGrid');
const pmProjectsView = document.getElementById('pmProjectsView');
const pmDetailView = document.getElementById('pmDetailView');
const pmBackBtn = document.getElementById('pmBackBtn');
const pmMsg = document.getElementById('pmMsg');
const addProjectBtn = document.getElementById('addProjectBtn');
const pmFormWindow = document.getElementById('pmFormWindow');
const pmFormTitle = document.getElementById('pmFormTitle');
const pmForm = document.getElementById('pmForm');
const pmClient = document.getElementById('pmClient');
const pmBusiness = document.getElementById('pmBusiness');
const pmDescription = document.getElementById('pmDescription');
const pmEmail = document.getElementById('pmEmail');
const pmPhone = document.getElementById('pmPhone');
const pmServices = document.getElementById('pmServices');
const pmAreas = document.getElementById('pmAreas');
const pmUrl = document.getElementById('pmUrl');
const pmWpUser = document.getElementById('pmWpUser');
const pmWpPass = document.getElementById('pmWpPass');
const pmStatusSelect = document.getElementById('pmStatusSelect');
const pmFormMsg = document.getElementById('pmFormMsg');
const pmTaskWindow = document.getElementById('pmTaskWindow');
const pmTaskFormTitle = document.getElementById('pmTaskFormTitle');
const pmTaskProjectLabel = document.getElementById('pmTaskProjectLabel');
const pmTaskForm = document.getElementById('pmTaskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskStatus = document.getElementById('taskStatus');
const taskPriority = document.getElementById('taskPriority');
const taskAssignee = document.getElementById('taskAssignee');
const taskDueDate = document.getElementById('taskDueDate');
const pmTaskMsg = document.getElementById('pmTaskMsg');
const pmDetailName = document.getElementById('pmDetailName');
const pmDetailBusiness = document.getElementById('pmDetailBusiness');
const pmDetailStatus = document.getElementById('pmDetailStatus');
const pmDetailProgress = document.getElementById('pmDetailProgress');
const pmDetailProgressFill = document.getElementById('pmDetailProgressFill');
const pmDetailEfficiency = document.getElementById('pmDetailEfficiency');
const pmDetailTasks = document.getElementById('pmDetailTasks');
const pmDetailInfo = document.getElementById('pmDetailInfo');
const pmInfoFields = document.getElementById('pmInfoFields');
const pmWpFields = document.getElementById('pmWpFields');
const pmWpOpenBtn = document.getElementById('pmWpOpenBtn');
const pmPipeline = document.getElementById('pmPipeline');
const pmEditProjectBtn = document.getElementById('pmEditProjectBtn');
const pmDeleteProjectBtn = document.getElementById('pmDeleteProjectBtn');
const pmAddTaskBtn = document.getElementById('pmAddTaskBtn');
const pmDetailMsg = document.getElementById('pmDetailMsg');
const pmTaskDetailWindow = document.getElementById('pmTaskDetailWindow');
const taskDetailTitle = document.getElementById('taskDetailTitle');
const taskDetailEditBtn = document.getElementById('taskDetailEditBtn');
const taskDetailDeleteBtn = document.getElementById('taskDetailDeleteBtn');
const taskDetailMeta = document.getElementById('taskDetailMeta');
const taskDetailDescription = document.getElementById('taskDetailDescription');
const taskAttachments = document.getElementById('taskAttachments');
const taskComments = document.getElementById('taskComments');
const taskCommentInput = document.getElementById('taskCommentInput');
const taskCommentSendBtn = document.getElementById('taskCommentSendBtn');
const taskImageInput = document.getElementById('taskImageInput');
const taskDetailMsg = document.getElementById('taskDetailMsg');

let conversationHistory = [];
let activeConvId = null;
let editingUserId = null;

// Adjuntos y dictado
let pendingImage = null;
let mediaRecorder = null;
let mediaStream = null;
let micChunks = [];
let micRecording = false;
let micTimer = null;

const HISTORY_KEY_PREFIX = 'ia_chat_history_';

function roleLabel(role) {
    return ROLE_LABELS[role] || role || '—';
}

// ---------------- Utils ----------------
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML.replace(/\n/g, '<br>');
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    // Markdown basico: negritas e italicas (tras escapar HTML, es seguro).
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
               .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return html;
}

function openOverlay(el) {
    el.classList.remove('hidden');
}

function closeOverlay(el) {
    el.classList.add('hidden');
}

function initials(user) {
    const name = (user.fullName || user.username || '?').trim();
    const parts = name.split(/\s+/);
    return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

// ---------------- Avatar del usuario (local, por dispositivo) ----------------
const AVATARS_KEY = 'userAvatars';

function getAvatars() {
    try {
        return JSON.parse(localStorage.getItem(AVATARS_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function avatarFor(userId) {
    return getAvatars()[userId] || null;
}

function saveAvatar(userId, dataUrl) {
    const map = getAvatars();
    if (dataUrl) {
        map[userId] = dataUrl;
    } else {
        delete map[userId];
    }
    localStorage.setItem(AVATARS_KEY, JSON.stringify(map));
}

function setChatBrandTitle() {
    topbarTitle.innerHTML =
        '<span class="tt-brand">iA Assistant</span>' +
        '<span class="tt-version">Ant 2.0</span>';
}

function renderSidebarAvatar() {
    sidebarAvatar.innerHTML = '';
    sidebarAvatar.textContent = '';
    if (!currentUser) return;
    const av = avatarFor(currentUser.id);
    if (av) {
        const img = document.createElement('img');
        img.src = av;
        img.alt = 'Avatar';
        img.draggable = false;
        sidebarAvatar.appendChild(img);
    } else {
        sidebarAvatar.textContent = initials(currentUser);
    }
}

// ---------------- Adjuntar imágenes ----------------
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function resizeImage(file, maxDim = 1400, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
        img.src = url;
    });
}

function renderAttachment() {
    [chatAttachments, heroAttachments].forEach(container => {
        container.innerHTML = '';
        if (!pendingImage) {
            container.classList.add('hidden');
            return;
        }
        const el = document.createElement('div');
        el.className = 'chat-attachment';
        el.innerHTML = `<img src="${pendingImage}" alt="Adjunto"><button class="att-remove" title="Quitar imagen">&times;</button>`;
        el.querySelector('.att-remove').addEventListener('click', () => {
            pendingImage = null;
            renderAttachment();
        });
        container.appendChild(el);
        container.classList.remove('hidden');
    });
}

function setChatStatus(msg, isRec = false) {
    [chatStatus, heroStatus].forEach(el => {
        if (el) {
            el.textContent = msg || '';
            el.classList.toggle('rec', !!isRec);
        }
    });
}

// ---------------- Dictado por voz ----------------
function activeInput() {
    return heroSection.classList.contains('hidden') ? chatInput : messageInput;
}

function setMicButtons(rec) {
    [chatMicBtn, heroMicBtn].forEach(btn => {
        if (btn) {
            btn.classList.toggle('rec', rec);
            btn.title = rec ? 'Detener dictado' : 'Dictar por voz';
        }
    });
}

async function toggleMic() {
    if (micRecording) { stopMic(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setChatStatus('Tu navegador no soporta dictado por voz');
        return;
    }
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        setChatStatus('No hay micrófono o falta permiso');
        return;
    }
    micChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) micChunks.push(e.data); };
    mediaRecorder.onstop = handleMicStop;
    mediaRecorder.start();
    micRecording = true;
    setMicButtons(true);
    activeInput().placeholder = 'Escuchando...';
    setChatStatus('Grabando...', true);
    micTimer = setTimeout(() => { if (micRecording) stopMic(); }, 60000);
}

function stopMic() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
    clearTimeout(micTimer);
    try { mediaRecorder.stop(); } catch (e) {}
}

function handleMicStop() {
    const tracks = mediaStream ? mediaStream.getTracks() : [];
    tracks.forEach(t => t.stop());
    mediaStream = null;
    micRecording = false;
    setMicButtons(false);
    chatInput.placeholder = 'Escribe tu mensaje...';
    messageInput.placeholder = 'Pregúntame sobre cambios, mantenimiento, tiempos, productos...';

    const mime = (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm';
    const blob = new Blob(micChunks, { type: mime });
    mediaRecorder = null;
    if (micChunks.length === 0 || blob.size < 100) {
        setChatStatus('Audio demasiado corto, intenta de nuevo');
        return;
    }
    transcribeAudio(blob);
}

async function transcribeAudio(blob) {
    let b64;
    try { b64 = await blobToBase64(blob); }
    catch (e) { setChatStatus('Error leyendo el audio'); return; }

    setChatStatus('Transcribiendo...');
    [chatMicBtn, heroMicBtn].forEach(btn => { if (btn) btn.disabled = true; });
    try {
        const data = await apiRequest('/api/chat/transcribe', {
            method: 'POST',
            body: JSON.stringify({ audio: b64, mime: blob.type })
        });
        if (data.success && data.text) {
            activeInput().value = data.text;
            activeInput().focus();
            setChatStatus('');
        } else {
            setChatStatus(data.error || 'No se pudo transcribir el audio');
        }
    } catch (e) {
        setChatStatus('Error al transcribir: ' + e.message);
    } finally {
        [chatMicBtn, heroMicBtn].forEach(btn => { if (btn) btn.disabled = false; });
    }
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ---------------- Auth ----------------
function setAuth(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUIForAuth();
}

function clearAuth() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    closeOverlay(adminPanel);
    closeOverlay(editWindow);
    closeOverlay(profilePanel);
    closeOverlay(historyPanel);
    updateUIForAuth();
}

function updateUIForAuth() {
    if (currentUser) {
        authModal.classList.add('hidden');
        app.classList.remove('hidden');
        setChatBrandTitle();
        greetingText.textContent = `¡Hola, ${currentUser.fullName || currentUser.username}! ¿En qué te ayudo hoy?`;
        settingsBtn.classList.remove('hidden');
        pmBtn.classList.toggle('hidden', !canUsePM());
        renderSidebarAvatar();
        sidebarAvatar.title = 'Mi perfil';
        startNotifications();
    } else {
        authModal.classList.remove('hidden');
        app.classList.add('hidden');
        settingsBtn.classList.add('hidden');
        pmBtn.classList.add('hidden');
        stopNotifications();
    }
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
        ...options,
        headers
    });

    const raw = await response.text();
    let data = null;
    try {
        data = JSON.parse(raw) || null;
    } catch (e) {
        data = null;
    }

    if (response.status === 401) {
        if (endpoint !== '/api/auth/login' && authToken) {
            clearAuth();
            throw new Error('Sesión expirada');
        }
        throw new Error((data && data.error) || (response.statusText || 'No autorizado'));
    }

    if (!response.ok) {
        throw new Error((data && data.error) || `Error del servidor (HTTP ${response.status})`);
    }

    if (data === null && raw.trim() === '') {
        throw new Error('Respuesta vacía del servidor');
    }

    return data;
}

// Auth form handlers
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.success) {
            setAuth(data.token, data.user);
            showHero();
            loginFormElement.reset();
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        alert(error.message);
    }
});

sidebarAvatar.addEventListener('click', openProfile);

// ---------------- Mi perfil ----------------
function openProfile() {
    if (!currentUser) return;
    renderProfileAvatar();
    profileName.textContent = currentUser.fullName || '—';
    profileUsername.textContent = '@' + currentUser.username;
    profileRole.textContent = ROLE_LABELS[currentUser.role] || currentUser.role;
    profileMsg.textContent = '';
    profileMsg.classList.remove('error', 'success');
    openOverlay(profilePanel);
}

function renderProfileAvatar() {
    profileAvatar.innerHTML = '';
    const av = avatarFor(currentUser.id);
    if (av) {
        const img = document.createElement('img');
        img.src = av;
        img.alt = 'Avatar';
        profileAvatar.appendChild(img);
    } else {
        profileAvatar.textContent = initials(currentUser);
    }
}

document.querySelectorAll('[data-close="profilePanel"]').forEach(btn => {
    btn.addEventListener('click', () => closeOverlay(profilePanel));
});

profilePanel.addEventListener('click', (e) => {
    if (e.target === profilePanel) closeOverlay(profilePanel);
});

profileAvatarEdit.addEventListener('click', () => avatarFileInput.click());

avatarFileInput.addEventListener('change', async () => {
    const file = avatarFileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        profileMsg.textContent = 'Selecciona un archivo de imagen.';
        profileMsg.classList.add('error');
        return;
    }
    try {
        const dataUrl = await resizeImage(file, 200, 0.85);
        saveAvatar(currentUser.id, dataUrl);
        currentUser.avatar = dataUrl;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        renderProfileAvatar();
        renderSidebarAvatar();
        profileMsg.textContent = '✅ Avatar actualizado';
        profileMsg.classList.add('success');
    } catch (err) {
        profileMsg.textContent = 'No se pudo procesar la imagen.';
        profileMsg.classList.add('error');
    } finally {
        avatarFileInput.value = '';
    }
});

profileLogoutBtn.addEventListener('click', async () => {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearAuth();
});

// ---------------- Tooltips personalizados (estilo, no los del navegador) ----------------
const tooltipEl = document.createElement('div');
tooltipEl.id = 'customTooltip';
tooltipEl.setAttribute('role', 'tooltip');
document.body.appendChild(tooltipEl);

let tipTarget = null;
let tipTimer = null;

function positionTooltip(el) {
    const rect = el.getBoundingClientRect();
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.classList.add('visible');
    const tr = tooltipEl.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tr.width / 2;
    let top = rect.top - tr.height - 9;
    let below = false;
    if (top < 10) {
        top = rect.bottom + 9;
        below = true;
    }
    left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
    tooltipEl.classList.toggle('below', below);
    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
    tooltipEl.style.visibility = 'visible';
}

function hideTooltip() {
    clearTimeout(tipTimer);
    tipTarget = null;
    tooltipEl.classList.remove('visible');
}

document.addEventListener('mouseover', (e) => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest('[title]');
    if (!el || el.getAttribute('title') === '') return;
    if (tipTarget === el) return;
    hideTooltip();
    tipTarget = el;
    const content = el.getAttribute('title');
    el.setAttribute('data-tip-orig', content);
    el.setAttribute('title', '');
    tipTimer = setTimeout(() => {
        tooltipEl.textContent = content;
        positionTooltip(el);
    }, 450);
});

document.addEventListener('mouseout', (e) => {
    if (!(e.target instanceof Element)) return;
    if (tipTarget && (e.target === tipTarget || tipTarget.contains(e.target))) {
        const restore = tipTarget.getAttribute('data-tip-orig');
        if (restore !== null) tipTarget.setAttribute('title', restore);
        hideTooltip();
    }
});

logoBtn.addEventListener('click', showHero);

// ---------------- Project Manager (solo admin y Desarrollo) ----------------
const PM_STATUS_LABEL = { pendiente: 'Pendiente', en_progreso: 'En progreso', completado: 'Completado' };
const PM_PRIORITY_LABEL = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const PM_STAGE_LABEL = {
    por_iniciar: 'Por iniciar',
    en_progreso: 'En progreso',
    en_revision: 'En revisión',
    finalizado_sin_errores: 'Finalizado sin errores'
};
const PM_STAGES = ['por_iniciar', 'en_progreso', 'en_revision', 'finalizado_sin_errores'];

let pmProjects = [];
let editingProjectId = null;
let editingTaskId = null;
let taskProjectId = null;

const PM_ICON_PENCIL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
const PM_ICON_TRASH = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

function canUsePM() {
    return currentUser && (currentUser.role === 'admin' || currentUser.role === 'desarrollo');
}

function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).slice(0, 10) + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function uidColor(id) {
    let h = 0;
    const s = String(id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
}

function pmPeopleAvatar(userId, name, size) {
    const sizeClass = size === 'sm' ? ' pm-avatar-sm' : '';
    const av = avatarFor(userId);
    const n = name || '?';
    const parts = String(n).split(/\s+/);
    const ini = ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
    if (av) return `<span class="pm-avatar${sizeClass}" title="${escapeHtml(n)}"><img src="${av}" alt=""></span>`;
    return `<span class="pm-avatar${sizeClass} pm-avatar-ini" style="background:hsl(${uidColor(userId)} 65% 45%)" title="${escapeHtml(n)}">${escapeHtml(ini)}</span>`;
}

function pmProjectCard(p) {
    const eff = p.efficiency ? `<span class="pm-eff pm-eff-${p.efficiency_raw >= 75 ? 'good' : p.efficiency_raw >= 50 ? 'mid' : 'bad'}">Eficiencia ${escapeHtml(p.efficiency)}</span>` : '<span class="pm-eff pm-eff-na">Sin datos</span>';
    return `
        <div class="pm-card" data-action="pm-open" data-id="${p.id}" role="button" tabindex="0">
            <div class="pm-card-head">
                <div>
                    <div class="pm-card-title">${escapeHtml(p.client)}</div>
                    ${p.business ? `<div class="pm-card-business">${escapeHtml(p.business)}</div>` : ''}
                </div>
                <div class="pm-project-actions">
                    <button class="pm-btn-icon pm-admin-only hidden" data-action="pm-edit" data-id="${p.id}" title="Editar proyecto">${PM_ICON_PENCIL}</button>
                    <button class="pm-btn-icon danger pm-admin-only hidden" data-action="pm-delete" data-id="${p.id}" title="Eliminar proyecto">${PM_ICON_TRASH}</button>
                </div>
            </div>
            <div class="pm-card-stats">
                <span class="pm-status pm-status-${p.status}">${escapeHtml(PM_STATUS_LABEL[p.status] || p.status)}</span>
                <span class="pm-card-progress">
                    <span class="pm-progress-bar"><span class="pm-progress-fill" style="width:${p.progress}%"></span></span>
                    <span class="pm-progress-num">${p.progress}%</span>
                </span>
                ${eff}
            </div>
            <div class="pm-card-extra">${p.task_count || 0} tareas</div>
        </div>`;
}

function renderPMProjects() {
    document.querySelectorAll('.pm-admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin()));
    if (pmProjects.length === 0) {
        pmGrid.innerHTML = '<p class="pm-tasks-empty">No hay proyectos todavía. Crea el primero con "+ Proyecto".</p>';
        return;
    }
    pmGrid.innerHTML = pmProjects.map(pmProjectCard).join('');
}

async function loadPMProjects() {
    pmMsg.textContent = '';
    pmGrid.innerHTML = '<p class="pm-tasks-empty">Cargando proyectos...</p>';
    try {
        const data = await apiRequest('/api/pm/projects');
        pmProjects = data.projects || [];
        renderPMProjects();
        if (pmDetailView.classList.contains('active')) {
            const cur = pmProjects.find(p => p.id === openProjectId);
            if (cur) renderProjectDetail(cur); else closeProjectDetail();
        }
    } catch (e) {
        pmGrid.innerHTML = '';
        pmMsg.textContent = e.message;
    }
}

let pmPollTimer = null;

function startPMPolling() {
    if (pmPollTimer) return;
    pmPollTimer = setInterval(async () => {
        if (!pmView.classList.contains('active')) {
            stopPMPolling();
            return;
        }
        try {
            const data = await apiRequest('/api/pm/projects');
            const fresh = data.projects || [];
            const changed = JSON.stringify(fresh) !== JSON.stringify(pmProjects);
            if (changed) {
                pmProjects = fresh;
                renderPMProjects();
                if (pmDetailView.classList.contains('active')) {
                    const cur = pmProjects.find(p => p.id === openProjectId);
                    if (cur) renderProjectDetail(cur); else closeProjectDetail();
                }
            }
        } catch (e) {
            // Silencioso; se reintentará en el siguiente ciclo
        }
    }, 5000);
}

function stopPMPolling() {
    if (pmPollTimer) {
        clearInterval(pmPollTimer);
        pmPollTimer = null;
    }
}

function openPM() {
    if (!canUsePM()) return;
    chatView.classList.remove('active');
    pmView.classList.add('active');
    closeProjectDetail();
    loadPMProjects();
    startPMPolling();
}

function openProjectForm(projectId) {
    if (!isAdmin()) { pmMsg.textContent = 'Solo el admin puede crear o editar proyectos.'; return; }
    editingProjectId = projectId;
    const p = projectId ? pmProjects.find(x => x.id === projectId) : null;
    pmFormTitle.textContent = p ? 'Editar proyecto' : 'Nuevo proyecto';
    pmClient.value = p ? p.client : '';
    pmBusiness.value = p ? (p.business || '') : '';
    pmDescription.value = p ? (p.description || '') : '';
    pmEmail.value = p ? (p.email || '') : '';
    pmPhone.value = p ? (p.phone || '') : '';
    pmServices.value = p ? (p.services || '') : '';
    pmAreas.value = p ? (p.areas || '') : '';
    pmUrl.value = p ? (p.url || '') : '';
    pmWpUser.value = p ? (p.wp_user || '') : '';
    pmWpPass.value = p ? (p.wp_pass || '') : '';
    pmStatusSelect.value = p ? (p.status || 'pendiente') : 'pendiente';
    pmFormMsg.textContent = '';
    openOverlay(pmFormWindow);
    pmClient.focus();
}

function openTaskForm(projectId, taskId) {
    editingTaskId = taskId;
    taskProjectId = projectId;
    let task = null;
    let project = null;
    if (taskId) {
        task = pmProjects.flatMap(p => p.tasks || []).find(t => t.id === taskId);
        project = pmProjects.find(p => (p.tasks || []).some(t => t.id === taskId)) || null;
        taskProjectId = project ? project.id : null;
    } else {
        project = pmProjects.find(p => p.id === projectId) || null;
    }
    if (!project) { pmMsg.textContent = 'Selecciona un proyecto primero.'; return; }
    pmTaskFormTitle.textContent = task ? 'Editar tarea' : 'Nueva tarea';
    pmTaskProjectLabel.textContent = `Proyecto: ${project.client}`;
    taskTitle.value = task ? task.title : '';
    taskDescription.value = task ? (task.description || '') : '';
    taskStatus.value = task ? (task.status || 'por_iniciar') : 'por_iniciar';
    taskPriority.value = task ? (task.priority || 'media') : 'media';
    taskAssignee.value = task && task.assigned_to ? String(task.assigned_to) : '';
    taskDueDate.value = task && task.due_date ? String(task.due_date).slice(0, 10) : '';
    fillUsersSelect();
    pmTaskMsg.textContent = '';
    openOverlay(pmTaskWindow);
    taskTitle.focus();
}

async function fillUsersSelect() {
    if (taskAssignee.options.length > 1) return;
    try {
        const data = await apiRequest('/api/auth/admin/users');
        const users = data.users || [];
        const frag = document.createDocumentFragment();
        for (const u of users) {
            const opt = new Option(u.full_name || u.username, u.id);
            frag.appendChild(opt);
        }
        taskAssignee.appendChild(frag);
    } catch (e) { /* sin lista de usuarios */ }
}

pmBtn.addEventListener('click', openPM);

addProjectBtn.addEventListener('click', () => openProjectForm(null));
pmBackBtn.addEventListener('click', closeProjectDetail);
pmEditProjectBtn.addEventListener('click', () => openProjectForm(openProjectId));
pmAddTaskBtn.addEventListener('click', () => openTaskForm(openProjectId, null));
pmDeleteProjectBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar este proyecto y todas sus tareas?')) return;
    try {
        await apiRequest(`/api/pm/projects/${openProjectId}`, { method: 'DELETE' });
        closeProjectDetail();
        await loadPMProjects();
    } catch (err) {
        pmDetailMsg.textContent = err.message;
    }
});

document.querySelectorAll('[data-close="pmFormWindow"]').forEach(btn =>
    btn.addEventListener('click', () => closeOverlay(pmFormWindow))
);

document.querySelectorAll('[data-close="pmTaskWindow"]').forEach(btn =>
    btn.addEventListener('click', () => closeOverlay(pmTaskWindow))
);

document.querySelectorAll('[data-close="pmTaskDetailWindow"]').forEach(btn =>
    btn.addEventListener('click', () => closeOverlay(pmTaskDetailWindow))
);

function collectProjectPayload() {
    return {
        client: pmClient.value.trim(),
        business: pmBusiness.value.trim(),
        description: pmDescription.value.trim(),
        email: pmEmail.value.trim(),
        phone: pmPhone.value.trim(),
        services: pmServices.value.trim(),
        areas: pmAreas.value.trim(),
        url: pmUrl.value.trim(),
        wp_user: pmWpUser.value.trim(),
        wp_pass: pmWpPass.value.trim(),
        status: pmStatusSelect.value
    };
}

pmForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = collectProjectPayload();
    try {
        if (editingProjectId) {
            await apiRequest(`/api/pm/projects/${editingProjectId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await apiRequest('/api/pm/projects', { method: 'POST', body: JSON.stringify(payload) });
        }
        closeOverlay(pmFormWindow);
        pmForm.reset();
        await loadPMProjects();
    } catch (err) {
        pmFormMsg.textContent = err.message;
    }
});

pmTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        title: taskTitle.value.trim(),
        description: taskDescription.value.trim(),
        status: taskStatus.value,
        priority: taskPriority.value,
        assigned_to: taskAssignee.value ? parseInt(taskAssignee.value) : null,
        due_date: taskDueDate.value || null
    };
    try {
        if (editingTaskId) {
            await apiRequest(`/api/pm/tasks/${editingTaskId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            payload.project_id = taskProjectId;
            await apiRequest('/api/pm/tasks', { method: 'POST', body: JSON.stringify(payload) });
        }
        closeOverlay(pmTaskWindow);
        taskDueDate.value = '';
        await loadPMProjects();
    } catch (err) {
        pmTaskMsg.textContent = err.message;
    }
});

// ---------- Detalle de proyecto ----------
let openProjectId = null;

async function openProjectDetail(projectId) {
    openProjectId = projectId;
    const p = pmProjects.find(x => x.id === projectId);
    if (!p) return;
    pmProjectsView.classList.add('hidden');
    pmDetailView.classList.remove('hidden');
    pmDetailView.classList.add('active');
    pmBackBtn.classList.remove('hidden');
    renderProjectDetail(p);
}

function closeProjectDetail() {
    openProjectId = null;
    pmDetailView.classList.remove('active');
    pmDetailView.classList.add('hidden');
    pmProjectsView.classList.remove('hidden');
    pmBackBtn.classList.add('hidden');
    closeOverlay(pmTaskDetailWindow);
}

function renderProjectDetail(p) {
    const eff = p.efficiency ? `${p.efficiency}` : '—';
    pmDetailName.textContent = p.client;
    pmDetailBusiness.textContent = p.business || '';
    pmDetailStatus.textContent = PM_STATUS_LABEL[p.status] || p.status;
    pmDetailStatus.className = `pm-status pm-status-${p.status}`;
    pmDetailProgress.textContent = `${p.progress}%`;
    pmDetailProgressFill.style.width = `${p.progress}%`;
    pmDetailEfficiency.textContent = eff;
    pmDetailEfficiency.className = 'pm-stat-value pm-eff' + (p.efficiency_raw != null ? ` pm-eff-text-${p.efficiency_raw >= 75 ? 'good' : p.efficiency_raw >= 50 ? 'mid' : 'bad'}` : '');
    pmDetailTasks.textContent = `${p.task_count || 0}`;
    document.querySelectorAll('.pm-admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin()));

    const info = [];
    if (p.email) info.push(['Email', `<a href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>`]);
    if (p.phone) info.push(['Teléfono', `<a href="tel:${escapeHtml(p.phone)}">${escapeHtml(p.phone)}</a>`]);
    if (p.services) info.push(['Servicios', escapeHtml(p.services)]);
    if (p.areas) info.push(['Áreas de servicio', escapeHtml(p.areas)]);
    if (p.url) info.push(['URL', `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>`]);
    if (p.description) info.push(['Descripción', escapeHtml(p.description)]);
    pmDetailInfo.classList.toggle('hidden', info.length === 0);
    pmInfoFields.innerHTML = info.map(([k, v]) => `<div class="pm-info-item"><span class="pm-info-k">${k}</span><span class="pm-info-v">${v}</span></div>`).join('');

    const wp = [];
    if (p.wp_user) wp.push(['Usuario', escapeHtml(p.wp_user)]);
    if (p.wp_pass) wp.push(['Contraseña', `<span class="pm-wp-pass">${escapeHtml(p.wp_pass)}</span>`]);
    pmWpFields.innerHTML = wp.length ? wp.map(([k, v]) => `<div class="pm-info-item"><span class="pm-info-k">${k}</span><span class="pm-info-v">${v}</span></div>`).join('') : '<span class="pm-info-v pm-muted">Sin credenciales guardadas.</span>';
    pmWpOpenBtn.disabled = !p.url;
    pmWpOpenBtn.onclick = () => {
        if (!p.url) return;
        window.open(p.url.replace(/\/+$/, '') + '/wp-admin', '_blank', 'noopener');
    };
    renderPipeline(p);
}

function pmTaskCard(t) {
    const due = t.due_date
        ? `<span class="pm-due ${t.status === 'finalizado_sin_errores' ? '' : new Date(t.due_date + 'T23:59:59') < new Date() ? 'overdue' : ''}">📅 ${escapeHtml(fmtDate(t.due_date))}</span>`
        : '';
    const corr = t.corrections > 0 ? `<span class="pm-corr" title="Rechazada por errores ${t.corrections} ${t.corrections === 1 ? 'vez' : 'veces'}">Por corregir</span>` : '';
    return `
        <div class="pm-kanban-card${t.status === 'finalizado_sin_errores' ? ' pm-done' : ''} draggable="true" data-task-id="${t.id}">
            <div class="pm-task-title">${escapeHtml(t.title)}</div>
            <div class="pm-task-meta">
                ${due}
                <span class="pm-priority pm-priority-${t.priority}">${PM_PRIORITY_LABEL[t.priority] || t.priority}</span>
                ${corr}
            </div>
            <div class="pm-task-people">
                <span class="pm-people-label">D: ${pmPeopleAvatar(t.assigned_to, t.assigned_name, 'sm')}</span>
                <span class="pm-people-label">O: ${pmPeopleAvatar(t.owner_id, t.owner_name, 'sm')}</span>
                <button type="button" class="pm-advance" data-action="pm-advance" data-id="${t.id}" title="Avanzar a la siguiente etapa">→</button>
            </div>
        </div>`;
}

function renderPipeline(p) {
    const columns = pmPipeline.querySelectorAll('.pm-column');
    columns.forEach(col => {
        const stage = col.dataset.stage;
        const stageTasks = (p.tasks || []).filter(t => t.status === stage);
        col.querySelector('.pm-column-body').innerHTML = stageTasks.map(pmTaskCard).join('');
        col.querySelector('.pm-column-count').textContent = stageTasks.length;
        const drop = col.querySelector('.pm-column-body');
        drop.dataset.count = stageTasks.length;
    });
}

pmPipeline.addEventListener('click', (e) => {
    if (!e.target.classList.contains('pm-advance')) return;
    const id = parseInt(e.target.dataset.id);
    const task = pmProjects.flatMap(p => p.tasks || []).find(t => t.id === id);
    if (!task) return;
    const idx = PM_STAGES.indexOf(task.status);
    const next = task.status === PM_STAGES[PM_STAGES.length - 1] ? PM_STAGES[0] : PM_STAGES[idx + 1];
    moveTaskTo(id, next);
});

function moveTaskTo(id, stage) {
    if (stage === 'finalizado_sin_errores' && !isAdmin()) {
        pmMsg.textContent = 'Solo el admin puede mover tareas a "Finalizado sin errores".';
        pmDetailMsg.textContent = 'Solo el admin puede mover tareas a "Finalizado sin errores".';
        return;
    }
    apiRequest(`/api/pm/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status: stage }) })
        .then(() => loadPMProjects())
        .catch(err => { pmDetailMsg.textContent = err.message; });
}

// Drag & drop entre columnas
let dragTaskId = null;

pmPipeline.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.pm-kanban-card');
    if (!card) return;
    dragTaskId = parseInt(card.dataset.taskId);
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
});

pmPipeline.addEventListener('dragend', (e) => {
    document.querySelectorAll('.pm-kanban-card').forEach(c => c.classList.remove('dragging'));
    document.querySelectorAll('.pm-column-body.drop-active').forEach(c => c.classList.remove('drop-active'));
    dragTaskId = null;
});

pmPipeline.addEventListener('dragover', (e) => {
    const drop = e.target.closest('.pm-column-body');
    if (!drop) return;
    e.preventDefault();
    drop.classList.add('drop-active');
});

pmPipeline.addEventListener('dragleave', (e) => {
    const drop = e.target.closest('.pm-column-body');
    if (drop) drop.classList.remove('drop-active');
});

pmPipeline.addEventListener('drop', (e) => {
    const drop = e.target.closest('.pm-column-body');
    if (!drop) return;
    e.preventDefault();
    drop.classList.remove('drop-active');
    if (!dragTaskId) return;
    moveTaskTo(dragTaskId, drop.dataset.drop);
});

// ---------- Detalle de tarea ----------
async function openTaskDetail(taskId) {
    editingDetailTaskId = taskId;
    closeOverlay(pmTaskDetailWindow);
    taskDetailMsg.textContent = '';
    try {
        const data = await apiRequest(`/api/pm/tasks/${taskId}/detail`);
        const task = data.task;
        const comments = data.comments || [];
        const attachments = data.attachments || [];
        taskDetailTitle.textContent = task.title;

        const due = task.due_date ? ` <span class="pm-due">📅 ${escapeHtml(fmtDate(task.due_date))}</span>` : '';
        taskDetailMeta.innerHTML = `
            <span class="pm-stage-badge pm-stage-badge-${task.status}">${PM_STAGE_LABEL[task.status] || task.status}</span>
            <span class="pm-priority pm-priority-${task.priority}">${PM_PRIORITY_LABEL[task.priority] || task.priority}</span>
            ${task.corrections > 0 ? `<span class="pm-corr">Por corregir (${task.corrections})</span>` : ''}
            ${due}
            <span class="pm-people-block">
                <span>Responsable: ${pmPeopleAvatar(task.owner_id, task.owner_name)} <b>${escapeHtml(task.owner_name || '—')}</b></span>
                <span>Asignado: ${pmPeopleAvatar(task.assigned_to, task.assigned_name)} <b>${escapeHtml(task.assigned_name || '—')}</b></span>
            </span>`;
        taskDetailDescription.innerHTML = task.description ? `<p>${escapeHtml(task.description)}</p>` : '<p class="pm-muted">Sin descripción.</p>';

        taskAttachments.innerHTML = attachments.length
            ? attachments.map(a => `<div class="pm-attach"><img src="${escapeHtml(a.data_url)}" alt="adjunto"><button type="button" class="pm-btn-icon danger pm-admin-only hidden" data-action="pm-att-del" data-id="${a.id}" title="Eliminar imagen">×</button></div>`).join('')
            : '';
        document.querySelectorAll('.pm-admin-only').forEach(el => el.classList.toggle('hidden', !isAdmin()));

        taskComments.innerHTML = comments.length
            ? comments.map(c => `
                <div class="pm-comment">
                    <div class="pm-comment-head">
                        <b>${escapeHtml(c.author_name || 'Usuario')}</b>
                        <span>${new Date(c.created_at).toLocaleString('es-MX')}</span>
                        <button type="button" class="pm-btn-icon danger pm-admin-only hidden" data-action="pm-com-del" data-id="${c.id}" title="Eliminar comentario">×</button>
                    </div>
                    <p>${escapeHtml(c.content)}</p>
                </div>`).join('')
            : '<p class="pm-muted">Sin comentarios.</p>';

        taskCommentInput.value = '';
        openOverlay(pmTaskDetailWindow);
    } catch (e) {
        taskDetailMsg.textContent = e.message;
    }
}

taskDetailEditBtn.addEventListener('click', () => {
    const taskId = editingDetailTaskId;
    closeOverlay(pmTaskDetailWindow);
    openTaskForm(null, taskId);
});

taskDetailDeleteBtn.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
        await apiRequest(`/api/pm/tasks/${editingDetailTaskId}`, { method: 'DELETE' });
        closeOverlay(pmTaskDetailWindow);
        await loadPMProjects();
    } catch (err) {
        taskDetailMsg.textContent = err.message;
    }
});

let editingDetailTaskId = null;

taskAttachments.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="pm-att-del"]');
    if (!btn) return;
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
        await apiRequest(`/api/pm/attachments/${btn.dataset.id}`, { method: 'DELETE' });
        await openTaskDetail(editingDetailTaskId);
    } catch (err) {
        taskDetailMsg.textContent = err.message;
    }
});

taskComments.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="pm-com-del"]');
    if (!btn) return;
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
        await apiRequest(`/api/pm/comments/${btn.dataset.id}`, { method: 'DELETE' });
        await openTaskDetail(editingDetailTaskId);
    } catch (err) {
        taskDetailMsg.textContent = err.message;
    }
});

taskCommentSendBtn.addEventListener('click', async () => {
    const content = taskCommentInput.value.trim();
    if (!content) return;
    try {
        await apiRequest(`/api/pm/tasks/${editingDetailTaskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
        await openTaskDetail(editingDetailTaskId);
    } catch (err) {
        taskDetailMsg.textContent = err.message;
    }
});

taskCommentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        taskCommentSendBtn.click();
    }
});

// Subir imagen: se redimensiona a JPEG antes de guardar
function fileToDataUrl(file, maxSize, callback) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

taskImageInput.addEventListener('change', async () => {
    const file = taskImageInput.files && taskImageInput.files[0];
    if (!file) return;
    try {
        fileToDataUrl(file, 1100, async (dataUrl) => {
            await apiRequest(`/api/pm/tasks/${editingDetailTaskId}/attachments`, { method: 'POST', body: JSON.stringify({ data_url: dataUrl }) });
            await openTaskDetail(editingDetailTaskId);
        });
    } catch (err) {
        taskDetailMsg.textContent = err.message;
    }
    taskImageInput.value = '';
});

// Delegacion principal de clics del PM
function onPMClick(e) {
    const btn = e.target.closest('[data-action]');
    if (btn) {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'pm-open') { openProjectDetail(id); return; }
        if (!canUsePM()) return;
        if (action === 'pm-edit') openProjectForm(id);
        else if (action === 'pm-delete') {
            if (!confirm('¿Eliminar este proyecto y todas sus tareas?')) return;
            apiRequest(`/api/pm/projects/${id}`, { method: 'DELETE' })
                .then(() => loadPMProjects())
                .catch(err => { pmMsg.textContent = err.message; });
        } else if (action === 'pm-task-edit') openTaskForm(null, id);
        else if (action === 'pm-task-delete') {
            if (!confirm('¿Eliminar esta tarea?')) return;
            apiRequest(`/api/pm/tasks/${id}`, { method: 'DELETE' })
                .then(() => loadPMProjects())
                .catch(err => { pmMsg.textContent = err.message; });
        }
        return;
    }

    const kanban = e.target.closest('.pm-kanban-card');
    if (kanban) { openTaskDetail(parseInt(kanban.dataset.taskId)); }
}

pmView.addEventListener('click', onPMClick);

// ---------------- Chat ----------------
function showChat() {
    stopPMPolling();
    pmView.classList.remove('active');
    chatView.classList.add('active');
    closeOverlay(adminPanel);
    closeOverlay(editWindow);
    closeOverlay(historyPanel);
    closeOverlay(pmFormWindow);
    closeOverlay(pmTaskWindow);
    closeOverlay(pmTaskDetailWindow);
    heroSection.classList.add('hidden');
    chatSection.classList.add('active');
    chatInput.focus();
}

function showHero() {
    stopPMPolling();
    pmView.classList.remove('active');
    chatView.classList.add('active');
    closeOverlay(pmTaskDetailWindow);
    persistCurrentConversation();
    heroSection.classList.remove('hidden');
    chatSection.classList.remove('active');
    chatContainer.innerHTML = '';
    conversationHistory = [];
    activeConvId = null;
    pendingImage = null;
    renderAttachment();
    messageInput.value = '';
    messageInput.focus();
}

function addMessage(content, role, image) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (role === 'assistant') {
        messageDiv.innerHTML = `<div class="msg-avatar avatar-wrap"><img src="/assets/images/avatar-iA.gif" alt="IA"></div><div class="message-content">${escapeHtml(content)}</div>`;
    } else if (role === 'user') {
        const imgHtml = image
            ? `<img class="msg-image" src="${image}" alt="Imagen adjunta">`
            : '';
        const userAv = currentUser ? avatarFor(currentUser.id) : null;
        const userAvatarHtml = userAv
            ? `<div class="msg-avatar user-avatar photo"><img src="${userAv}" alt="Avatar"></div>`
            : `<div class="msg-avatar user-avatar">${currentUser ? initials(currentUser) : ''}</div>`;
        messageDiv.innerHTML = `<div class="message-content">${imgHtml}${escapeHtml(content)}</div>${userAvatarHtml}`;
    } else {
        messageDiv.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    }
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    conversationHistory.push({ role, content, image });
    if (conversationHistory.length > 12) {
        conversationHistory = conversationHistory.slice(-12);
    }
}

function renderMessages(messages) {
    chatContainer.innerHTML = '';
    conversationHistory = [];
    messages.forEach(m => addMessage(m.content, m.role, m.image));
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="msg-avatar avatar-wrap"><img src="/assets/images/avatar-iA.gif" alt="IA"></div>
        <div class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </div>
    `;
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

async function sendMessage(message) {
    const image = pendingImage;
    if (!message.trim() && !image) return;
    if (!message.trim() && image) message = 'Describe esta imagen';

    showChat();
    addMessage(message, 'user', image);

    sendButton.disabled = true;
    chatSendBtn.disabled = true;
    messageInput.disabled = true;
    chatInput.disabled = true;

    showTyping();

    try {
        const payload = {
            message,
            history: conversationHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
        };
        if (image) payload.image = image;

        const data = await apiRequest('/api/chat', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        hideTyping();

        if (data.success) {
            addMessage(data.response, 'assistant');
            pendingImage = null;
            renderAttachment();
        } else {
            addMessage('Lo siento, ocurrió un error. Por favor intenta de nuevo.', 'assistant');
        }
    } catch (error) {
        hideTyping();
        if (error.message === 'Sesión expirada') {
            addMessage('Tu sesión ha expirado. Por favor inicia sesión de nuevo.', 'assistant');
            setTimeout(() => clearAuth(), 1500);
        } else {
            addMessage('Error de conexión. Por favor verifica tu conexión a internet.', 'assistant');
        }
    } finally {
        sendButton.disabled = false;
        chatSendBtn.disabled = false;
        messageInput.disabled = false;
        chatInput.disabled = false;
        chatInput.value = '';
        chatInput.focus();
    }
}

// ---------------- Historial (localStorage) ----------------
function historyKey() {
    return HISTORY_KEY_PREFIX + currentUser.id;
}

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(historyKey()) || '[]');
    } catch (e) {
        return [];
    }
}

function saveHistory(list) {
    localStorage.setItem(historyKey(), JSON.stringify(list));
}

function persistCurrentConversation() {
    if (!currentUser || conversationHistory.length === 0) return;
    const first = conversationHistory.find(m => m.role === 'user');
    if (!first) return;

    const list = loadHistory();
    const entry = {
        id: activeConvId || Date.now(),
        title: first.content.length > 56 ? first.content.slice(0, 56) + '…' : first.content,
        date: new Date().toISOString(),
        messages: conversationHistory.slice().map(m => m.image ? { role: m.role, content: m.content } : m)
    };

    const idx = list.findIndex(c => String(c.id) === String(entry.id));
    if (idx !== -1) {
        list[idx] = entry;
    } else {
        list.unshift(entry);
        if (list.length > 50) list.length = 50;
    }
    activeConvId = entry.id;
    saveHistory(list);
}

function openHistory() {
    persistCurrentConversation();
    renderHistory();
    openOverlay(historyPanel);
}

function renderHistory() {
    historyList.innerHTML = '';
    const list = loadHistory();
    if (list.length === 0) {
        historyMsg.textContent = 'Aún no tienes conversaciones guardadas.';
        historyMsg.classList.remove('error');
        return;
    }
    historyMsg.textContent = '';

    list.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'history-item' + (String(conv.id) === String(activeConvId) ? ' active' : '');
        item.innerHTML = `
            <div class="history-item-main">
                <span class="history-item-title">${escapeHtml(conv.title)}</span>
                <span class="history-item-date">${formatDate(conv.date)} · ${conv.messages.filter(m => m.role === 'user').length} consultas</span>
            </div>
            <button class="icon-btn history-del" title="Eliminar">🗑</button>
        `;

        item.querySelector('.history-item-main').addEventListener('click', () => {
            loadConversation(conv);
        });

        item.querySelector('.history-del').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!confirm(`¿Eliminar la conversación "${conv.title}"?`)) return;
            const list2 = loadHistory().filter(c => String(c.id) !== String(conv.id));
            saveHistory(list2);
            if (String(activeConvId) === String(conv.id)) {
                activeConvId = null;
            }
            renderHistory();
        });

        historyList.appendChild(item);
    });
}

function loadConversation(conv) {
    closeOverlay(historyPanel);
    showChat();
    renderMessages(conv.messages);
    activeConvId = conv.id;
}

historyBtn.addEventListener('click', openHistory);
historyCloseBtn.addEventListener('click', () => closeOverlay(historyPanel));

newChatBtn.addEventListener('click', () => {
    persistCurrentConversation();
    showHero();
});

// ---------------- Notificaciones ----------------
const NOTIF_SETTINGS_KEY = 'ia_notif_settings';
const sessionStartTs = Date.now();

let notifications = [];
let unreadCount = 0;
let notifPollTimer = null;
let notifiedIds = new Set();
let expandedNotifId = null;

function loadNotifSettings() {
    try {
        const s = JSON.parse(localStorage.getItem(NOTIF_SETTINGS_KEY) || '{}');
        return { enabled: s.enabled !== false, sound: s.sound !== false };
    } catch (e) {
        return { enabled: true, sound: true };
    }
}

let notifSettings = loadNotifSettings();

function saveNotifSettings() {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(notifSettings));
}

function playNotifSound() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        [880, 1174].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = ctx.currentTime + i * 0.14;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);
        });
        setTimeout(() => ctx.close().catch(() => {}), 1200);
    } catch (e) {}
}

function bellItemPreview(message) {
    const plain = String(message || '').replace(/[*#_`>]/g, '').replace(/\s+/g, ' ');
    return plain.length > 140 ? plain.slice(0, 140) + '…' : plain;
}

function renderBellBadge() {
    bellBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    bellBadge.classList.toggle('hidden', unreadCount <= 0);
    bellBtn.classList.toggle('has-unread', unreadCount > 0);
}

// silent = true → NO dispara toasts (carga inicial / al abrir el panel)
async function refreshNotifications({ silent = false } = {}) {
    if (!currentUser || !notifSettings.enabled) return;
    try {
        const data = await apiRequest('/api/notifications');
        if (!data.success) return;

        const fresh = (data.notifications || []).filter(n => {
            const t = new Date(n.createdAt).getTime();
            return t > sessionStartTs && !notifiedIds.has(n.id);
        });

        notifications = data.notifications || [];
        unreadCount = data.unreadCount || 0;
        notifications.forEach(n => notifiedIds.add(n.id));
        renderBellBadge();

        if (!silent) {
            fresh.forEach(n => showNotificationToast(n));
        }
    } catch (e) {
        // Silencioso: el polling no debe molestar al usuario
    }
}

function showNotificationToast(n) {
    if (!notifSettings.enabled) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <div class="toast-title">${escapeHtml(n.title)}</div>
        <div class="toast-preview">${escapeHtml(bellItemPreview(n.message))}</div>
    `;
    toast.addEventListener('click', () => {
        openNotificationDetail(n.id);
        dismissToast(toast);
    });
    toastContainer.appendChild(toast);
    if (notifSettings.sound) playNotifSound();
    setTimeout(() => dismissToast(toast), 6500);
}

function dismissToast(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 320);
}

function renderBellList() {
    bellList.innerHTML = '';
    bellEmpty.classList.toggle('hidden', notifications.length > 0);
    bellMarkAll.style.display = unreadCount > 0 ? '' : 'none';

    notifications.forEach(n => {
        const item = document.createElement('div');
        item.className = 'bell-item' + (n.read ? ' read' : ' unread');
        item.innerHTML = `
            <div class="bell-item-head">
                <span class="bell-item-dot"></span>
                <span class="bell-item-title">${escapeHtml(n.title)}</span>
                <span class="bell-item-date">${formatDate(n.createdAt)}</span>
            </div>
            ${expandedNotifId === n.id
                ? `<div class="bell-item-detail">${escapeHtml(n.message)}</div>`
                : `<div class="bell-item-preview">${escapeHtml(bellItemPreview(n.message))}</div>`}
        `;
        item.addEventListener('click', () => {
            if (expandedNotifId === n.id) {
                expandedNotifId = null;
                renderBellList();
                return;
            }
            openNotificationDetail(n.id);
        });
        bellList.appendChild(item);
    });
}

function openNotificationDetail(id) {
    expandedNotifId = id;
    openOverlay(bellDropdown);
    renderBellList();
    const target = notifications.find(n => n.id === id);
    if (target && !target.read) {
        markNotifsRead([id]);
    }
}

function toggleBell() {
    if (bellDropdown.classList.contains('hidden')) {
        openOverlay(bellDropdown);
        refreshNotifications({ silent: true }).then(() => renderBellList());
    } else {
        closeOverlay(bellDropdown);
    }
}

async function markNotifsRead(ids) {
    if (!ids || ids.length === 0) return;
    try {
        await apiRequest('/api/notifications/read', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    } catch (e) {}
    ids.forEach(id => {
        const n = notifications.find(x => x.id === id);
        if (n && !n.read) {
            n.read = true;
            if (unreadCount > 0) unreadCount--;
        }
    });
    renderBellBadge();
    renderBellList();
}

bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBell();
});

bellMarkAll.addEventListener('click', async () => {
    const unread = notifications.filter(n => !n.read).map(n => n.id);
    await markNotifsRead(unread);
});

document.addEventListener('click', (e) => {
    if (!bellDropdown.classList.contains('hidden') &&
        !bellDropdown.contains(e.target) &&
        !bellWrap.contains(e.target)) {
        closeOverlay(bellDropdown);
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser && notifSettings.enabled) {
        refreshNotifications({ silent: true });
    }
});

function startNotifications() {
    stopNotifications();
    if (!currentUser) return;
    bellWrap.classList.toggle('hidden', !notifSettings.enabled);
    renderBellBadge();
    if (!notifSettings.enabled) return;
    refreshNotifications({ silent: true });
    notifPollTimer = setInterval(() => refreshNotifications({ silent: false }), 30000);
}

function stopNotifications() {
    if (notifPollTimer) {
        clearInterval(notifPollTimer);
        notifPollTimer = null;
    }
    closeOverlay(bellDropdown);
    bellWrap.classList.add('hidden');
}

notifEnabledToggle.addEventListener('change', () => {
    notifSettings.enabled = notifEnabledToggle.checked;
    saveNotifSettings();
    if (notifSettings.enabled) {
        startNotifications();
    } else {
        stopNotifications();
    }
});

notifSoundToggle.addEventListener('change', () => {
    notifSettings.sound = notifSoundToggle.checked;
    saveNotifSettings();
    if (notifSoundToggle.checked) playNotifSound();
});

function renderNotifSettings() {
    notifEnabledToggle.checked = notifSettings.enabled;
    notifSoundToggle.checked = notifSettings.sound;
}

// ---------------- Ventana de configuración (tabs) ----------------
const settingsTabs = document.querySelectorAll('.settings-tab');
const PANE_TABS = { notifications: 'paneNotifications', users: 'paneUsers', announcements: 'paneAnnouncements', knowledge: 'paneKnowledge' };

function setSettingsTab(tab) {
    const isAdmin = currentUser && currentUser.role === 'admin';
    settingsTabs.forEach(btn => {
        const t = btn.dataset.tab;
        const adminOnly = t !== 'notifications';
        btn.classList.toggle('hidden', adminOnly && !isAdmin);
        btn.classList.toggle('active', t === tab);
    });
    Object.keys(PANE_TABS).forEach(key => {
        document.getElementById(PANE_TABS[key]).classList.toggle('active', key === tab);
    });
    renderNotifSettings();
    if (tab === 'users') loadUsers();
    if (tab === 'announcements') loadAnnouncements();
    if (tab === 'knowledge') loadKnowledge();
}

function openSettings(tab) {
    if (!currentUser) return;
    topbarTitle.textContent = 'Configuración';
    openOverlay(adminPanel);
    setSettingsTab(tab || 'notifications');
}

settingsTabs.forEach(btn => btn.addEventListener('click', () => setSettingsTab(btn.dataset.tab)));

// ---------------- Ventana de usuarios (admin) ----------------
adminCloseBtn.addEventListener('click', () => {
    setChatBrandTitle();
    closeOverlay(adminPanel);
});

settingsBtn.addEventListener('click', () => openSettings('notifications'));

async function loadUsers() {
    try {
        const data = await apiRequest('/api/auth/admin/users');
        if (data.success) {
            renderUsers(data.users);
        } else {
            usersMsg.textContent = data.error || 'Error al obtener usuarios';
            usersMsg.classList.add('error');
        }
    } catch (error) {
        usersMsg.textContent = error.message;
        usersMsg.classList.add('error');
    }
}

function renderUsers(users) {
    usersTableBody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = user.isActive ? '' : 'inactive';
        const isSelf = currentUser && user.id === currentUser.id;

        const tdUser = document.createElement('td');
        tdUser.innerHTML = `<strong>${escapeHtml(user.username)}</strong>`;
        if (user.email && !user.email.endsWith('@ia-consulta.local')) {
            tdUser.innerHTML += `<br><small>${escapeHtml(user.email)}</small>`;
        }

        const tdName = document.createElement('td');
        tdName.textContent = user.fullName || '—';

        const tdRole = document.createElement('td');
        const roleSelect = document.createElement('select');
        roleSelect.className = 'admin-select admin-role-select';
        Object.keys(ROLE_LABELS).forEach(role => {
            const opt = document.createElement('option');
            opt.value = role;
            opt.textContent = ROLE_LABELS[role];
            if (role === user.role) opt.selected = true;
            roleSelect.appendChild(opt);
        });
        if (isSelf) {
            roleSelect.disabled = true;
        }
        roleSelect.addEventListener('change', async () => {
            if (roleSelect.value === user.role) return;
            const data = await apiRequest(`/api/auth/admin/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ role: roleSelect.value })
            });
            if (!data.success) {
                alert(data.error || 'Error al cambiar rol');
                roleSelect.value = user.role;
            } else {
                usersMsg.textContent = `Rol de "${user.username}" actualizado a ${roleLabel(roleSelect.value)}`;
                usersMsg.classList.remove('error');
            }
        });
        tdRole.appendChild(roleSelect);

        const tdStatus = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${user.isActive ? 'active' : 'inactive'}`;
        statusBadge.textContent = user.isActive ? 'Activo' : 'Inactivo';
        tdStatus.appendChild(statusBadge);

        const tdActions = document.createElement('td');
        tdActions.className = 'admin-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'admin-btn admin-btn-edit';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openEditWindow(user));
        tdActions.appendChild(editBtn);

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'admin-btn';
        toggleBtn.textContent = user.isActive ? 'Desactivar' : 'Activar';
        toggleBtn.disabled = isSelf;
        toggleBtn.addEventListener('click', async () => {
            if (isSelf) return;
            const data = await apiRequest(`/api/auth/admin/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !user.isActive })
            });
            if (data.success) {
                loadUsers();
            } else {
                alert(data.error || 'Error al cambiar estado');
            }
        });
        tdActions.appendChild(toggleBtn);

        if (!isSelf) {
            const delBtn = document.createElement('button');
            delBtn.className = 'admin-btn admin-btn-danger';
            delBtn.textContent = 'Eliminar';
            delBtn.addEventListener('click', async () => {
                if (!confirm(`¿Eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`)) return;
                const data = await apiRequest(`/api/auth/admin/users/${user.id}`, {
                    method: 'DELETE'
                });
                if (data.success) {
                    loadUsers();
                } else {
                    alert(data.error || 'Error al eliminar usuario');
                }
            });
            tdActions.appendChild(delBtn);
        }

        tr.appendChild(tdUser);
        tr.appendChild(tdName);
        tr.appendChild(tdRole);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);
        usersTableBody.appendChild(tr);
    });
}

// Editar usuario (nombre/email)
function openEditWindow(user) {
    editingUserId = user.id;
    editFullName.value = user.fullName || '';
    editEmail.value = user.email && !user.email.endsWith('@ia-consulta.local') ? user.email : '';
    editUserMsg.textContent = '';
    editUserMsg.classList.remove('error', 'success');
    openOverlay(editWindow);
    editFullName.focus();
}

editUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingUserId) return;
    editUserMsg.textContent = '';

    const payload = {};
    if (editFullName.value.trim()) payload.fullName = editFullName.value.trim();
    if (editEmail.value.trim()) payload.email = editEmail.value.trim();

    if (Object.keys(payload).length === 0) {
        editUserMsg.textContent = 'No hay cambios para guardar.';
        editUserMsg.classList.add('error');
        return;
    }

    try {
        const data = await apiRequest(`/api/auth/admin/users/${editingUserId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        if (data.success) {
            editUserMsg.textContent = '✅ Usuario actualizado.';
            editUserMsg.classList.add('success');
            const wasSelf = currentUser && currentUser.id === editingUserId;
            loadUsers();
            setTimeout(() => {
                closeOverlay(editWindow);
                if (wasSelf) {
                    setAuth(authToken, Object.assign({}, currentUser, data.user));
                }
            }, 800);
        } else {
            editUserMsg.textContent = data.error || 'Error al actualizar usuario';
            editUserMsg.classList.add('error');
        }
    } catch (error) {
        editUserMsg.textContent = error.message;
        editUserMsg.classList.add('error');
    }
});

document.querySelectorAll('[data-close="editWindow"]').forEach(btn => {
    btn.addEventListener('click', () => closeOverlay(editWindow));
});

createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    createUserMsg.textContent = '';
    createUserMsg.classList.remove('error', 'success');

    const payload = {
        username: document.getElementById('newUsername').value.trim(),
        password: document.getElementById('newPassword').value,
        fullName: document.getElementById('newFullName').value.trim() || null,
        email: document.getElementById('newEmail').value.trim() || null,
        role: document.getElementById('newRole').value
    };

    try {
        const data = await apiRequest('/api/auth/admin/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (data.success) {
            createUserMsg.textContent = `✅ Usuario "${data.user.username}" creado con rol ${roleLabel(data.user.role)}`;
            createUserMsg.classList.add('success');
            createUserForm.reset();
            loadUsers();
        } else {
            createUserMsg.textContent = data.error || 'Error al crear usuario';
            createUserMsg.classList.add('error');
        }
    } catch (error) {
        createUserMsg.textContent = error.message;
        createUserMsg.classList.add('error');
    }
});

// ---------------- Anuncios (admin) ----------------
const announcementForm = document.getElementById('announcementForm');
const annTitle = document.getElementById('annTitle');
const annMessage = document.getElementById('annMessage');
const annMsg = document.getElementById('annMsg');
const annList = document.getElementById('annList');
const annListMsg = document.getElementById('annListMsg');

announcementForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = annTitle.value.trim();
    const message = annMessage.value.trim();

    annMsg.textContent = '';
    annMsg.classList.remove('error', 'success');

    if (!title || !message) {
        annMsg.textContent = 'Completa el título y el mensaje';
        annMsg.classList.add('error');
        return;
    }

    const targetRoles = Array.from(
        document.querySelectorAll('#annRolesCheck input:checked')
    ).map(c => c.value);

    try {
        const data = await apiRequest('/api/notifications', {
            method: 'POST',
            body: JSON.stringify({ title, message, targetRoles })
        });

        if (data.success) {
            annMsg.textContent = '✅ Anuncio publicado.';
            annMsg.classList.add('success');
            announcementForm.reset();
            refreshNotifications({ silent: true });
            loadAnnouncements();
        } else {
            annMsg.textContent = data.error || 'Error al publicar';
            annMsg.classList.add('error');
        }
    } catch (error) {
        annMsg.textContent = error.message;
        annMsg.classList.add('error');
    }
});

function targetLabel(roles) {
    if (!roles || roles.length === 0) return 'Todos';
    return roles.map(r => ROLE_LABELS[r] || r).join(', ');
}

async function loadAnnouncements() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const data = await apiRequest('/api/notifications/admin');
        if (!data.success) {
            annListMsg.textContent = data.error || 'Error obteniendo anuncios';
            annListMsg.classList.add('error');
            return;
        }
        annListMsg.textContent = '';
        annListMsg.classList.remove('error');
        annList.innerHTML = '';

        const list = data.notifications || [];
        if (list.length === 0) {
            annListMsg.textContent = 'Aún no has publicado anuncios.';
            return;
        }

        list.forEach(n => {
            const all = !n.targetRoles || n.targetRoles.length === 0;
            const item = document.createElement('div');
            item.className = 'ann-item';
            item.innerHTML = `
                <div class="ann-item-title">
                    <strong>${escapeHtml(n.title)}</strong>
                    <span>${formatDate(n.createdAt)}</span>
                </div>
                <div class="ann-item-preview">${escapeHtml(bellItemPreview(n.message))}</div>
                <span class="ann-target ${all ? 'all' : ''}">${escapeHtml(targetLabel(n.targetRoles))}</span>
            `;
            annList.appendChild(item);
        });
    } catch (error) {
        annListMsg.textContent = error.message;
        annListMsg.classList.add('error');
    }
}

// ---------------- Aprendizaje (base de conocimiento) ----------------
let kbCategories = [];
let kbItems = [];

const kbCatForm = document.getElementById('kbCatForm');
const kbCatName = document.getElementById('kbCatName');
const kbCatIcon = document.getElementById('kbCatIcon');
const kbCatMsg = document.getElementById('kbCatMsg');
const kbCatList = document.getElementById('kbCatList');
const kbFormTitle = document.getElementById('kbFormTitle');
const kbForm = document.getElementById('kbForm');
const kbEditId = document.getElementById('kbEditId');
const kbCategory = document.getElementById('kbCategory');
const kbTitle = document.getElementById('kbTitle');
const kbContent = document.getElementById('kbContent');
const kbKeywords = document.getElementById('kbKeywords');
const kbPriority = document.getElementById('kbPriority');
const kbSubmitBtn = document.getElementById('kbSubmitBtn');
const kbCancelEdit = document.getElementById('kbCancelEdit');
const kbMsg = document.getElementById('kbMsg');
const kbFilter = document.getElementById('kbFilter');
const kbList = document.getElementById('kbList');
const kbListMsg = document.getElementById('kbListMsg');

function setKbMsg(el, text, isError) {
    el.textContent = text;
    el.classList.toggle('error', !!isError);
    el.classList.toggle('success', !isError && !!text);
}

function kbCategoryById(id) {
    return kbCategories.find(c => String(c.id) === String(id)) || {};
}

async function loadKnowledge() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const catsData = await apiRequest('/api/knowledge/categories');
        kbCategories = catsData.categories || [];
        renderKbCategories();
        renderKbCategorySelect();
    } catch (e) {
        setKbMsg(kbCatMsg, e.message, true);
    }
    await loadKnowledgeItems();
}

function renderKbCategories() {
    kbCatList.innerHTML = '';
    if (kbCategories.length === 0) {
        kbCatList.innerHTML = '<p class="setting-desc">Aún no hay categorías.</p>';
        return;
    }
    kbCategories.forEach(cat => {
        const chip = document.createElement('span');
        chip.className = 'kb-cat-chip';
        chip.innerHTML = `${escapeHtml(cat.icon || '📄')} ${escapeHtml(cat.name)} <button class="cat-del" title="Eliminar">&times;</button>`;
        chip.querySelector('.cat-del').addEventListener('click', () => deleteKbCategory(cat));
        kbCatList.appendChild(chip);
    });
}

function renderKbCategorySelect() {
    kbCategory.innerHTML = '';
    if (kbCategories.length === 0) {
        kbCategory.innerHTML = '<option value="">-- Crea una categoría primero --</option>';
        kbCategory.disabled = true;
        return;
    }
    kbCategory.disabled = false;
    kbCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon || '📄'} ${cat.name}`;
        kbCategory.appendChild(opt);
    });
}

kbCatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = kbCatName.value.trim();
    setKbMsg(kbCatMsg, '');
    if (!name) {
        setKbMsg(kbCatMsg, 'Escribe el nombre de la categoría', true);
        return;
    }
    try {
        const data = await apiRequest('/api/admin/knowledge/categories', {
            method: 'POST',
            body: JSON.stringify({ name, icon: kbCatIcon.value.trim() || '📄' })
        });
        if (data.success) {
            setKbMsg(kbCatMsg, `✅ Categoría "${data.category.name}" creada.`);
            kbCatForm.reset();
            kbCatIcon.value = '📄';
            await loadKnowledge();
        } else {
            setKbMsg(kbCatMsg, data.error, true);
        }
    } catch (err) {
        setKbMsg(kbCatMsg, err.message, true);
    }
});

async function deleteKbCategory(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    try {
        const data = await apiRequest(`/api/admin/knowledge/categories/${cat.id}`, { method: 'DELETE' });
        if (data.success) {
            setKbMsg(kbCatMsg, 'Categoría eliminada.');
            if (String(kbCategory.value) === String(cat.id)) kbForm.reset();
            await loadKnowledge();
        } else {
            setKbMsg(kbCatMsg, data.error, true);
        }
    } catch (err) {
        setKbMsg(kbCatMsg, err.message, true);
    }
}

kbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setKbMsg(kbMsg, '');

    const category_id = kbCategory.value;
    const title = kbTitle.value.trim();
    const content = kbContent.value.trim();
    const keywords = kbKeywords.value.trim();
    const priority = parseInt(kbPriority.value) || 0;
    const id = kbEditId.value;

    if (!category_id) {
        setKbMsg(kbMsg, 'Selecciona una categoría', true);
        return;
    }
    if (!title || !content) {
        setKbMsg(kbMsg, 'Completa el título y el contenido', true);
        return;
    }

    const payload = { category: kbCategoryById(category_id).name, title, content, keywords, priority };

    try {
        let data;
        if (id) {
            data = await apiRequest(`/api/admin/knowledge/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            data = await apiRequest('/api/admin/knowledge', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        if (data.success) {
            setKbMsg(kbMsg, id ? '✅ Conocimiento actualizado.' : '✅ Conocimiento guardado. La IA ya puede usarlo en el chat.');
            resetKbForm();
            await loadKnowledgeItems();
        } else {
            setKbMsg(kbMsg, data.error || 'Error al guardar', true);
        }
    } catch (err) {
        setKbMsg(kbMsg, err.message, true);
    }
});

function resetKbForm() {
    kbForm.reset();
    kbEditId.value = '';
    kbSubmitBtn.textContent = 'Guardar conocimiento';
    kbFormTitle.textContent = '➕ Añadir conocimiento';
    kbCancelEdit.classList.add('hidden');
    const firstCat = kbCategories[0];
    if (firstCat) kbCategory.value = firstCat.id;
}

kbCancelEdit.addEventListener('click', () => {
    resetKbForm();
    setKbMsg(kbMsg, '');
});

async function loadKnowledgeItems() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const data = await apiRequest('/api/admin/knowledge');
        if (!data.success) {
            setKbMsg(kbListMsg, data.error || 'Error obteniendo la base de conocimiento', true);
            return;
        }
        kbItems = data.items || [];
        renderKbList();
    } catch (err) {
        setKbMsg(kbListMsg, err.message, true);
    }
}

function renderKbList() {
    kbList.innerHTML = '';
    setKbMsg(kbListMsg, '');

    const q = (kbFilter.value || '').trim().toLowerCase();
    const filtered = q
        ? kbItems.filter(it =>
            it.title.toLowerCase().includes(q) ||
            (it.keywords || '').toLowerCase().includes(q) ||
            (it.category || '').toLowerCase().includes(q) ||
            it.content.toLowerCase().includes(q))
        : kbItems;

    if (filtered.length === 0) {
        kbListMsg.textContent = kbItems.length === 0
            ? 'Todavía no hay conocimiento. Crea una categoría y añade el primer contenido.'
            : 'Sin resultados para tu búsqueda.';
        kbListMsg.classList.remove('error');
        return;
    }

    filtered.forEach(it => {
        const item = document.createElement('div');
        item.className = 'kb-item';
        item.innerHTML = `
            <div class="kb-item-head">
                <div>
                    <div class="kb-item-title">${escapeHtml(it.title)}</div>
                    <div class="kb-item-badges">
                        <span class="kb-badge">${escapeHtml(it.icon || '📄')} ${escapeHtml(it.category || 'Sin categoría')}</span>
                        ${parseInt(it.priority) > 0 ? `<span class="kb-badge priority-2">Prioridad ${it.priority}</span>` : ''}
                        <span class="kb-badge">✏ ${escapeHtml(formatDate(it.updated_at))}</span>
                    </div>
                </div>
                <div class="kb-item-actions">
                    <button class="kb-btn kb-btn-edit" data-id="${it.id}">Editar</button>
                    <button class="kb-btn kb-btn-del" data-id="${it.id}">Eliminar</button>
                </div>
            </div>
            <div class="kb-item-content">${escapeHtml(it.content)}</div>
        `;
        item.querySelector('.kb-btn-edit').addEventListener('click', () => editKnowledgeItem(it));
        item.querySelector('.kb-btn-del').addEventListener('click', () => deleteKnowledgeItem(it));
        kbList.appendChild(item);
    });
}

function editKnowledgeItem(it) {
    kbEditId.value = it.id;
    kbCategory.value = it.category_id;
    kbTitle.value = it.title;
    kbContent.value = it.content;
    kbKeywords.value = it.keywords || '';
    kbPriority.value = String(it.priority || 0);
    kbSubmitBtn.textContent = 'Actualizar conocimiento';
    kbFormTitle.textContent = '✏️ Editar conocimiento';
    kbCancelEdit.classList.remove('hidden');
    setKbMsg(kbMsg, '');
    kbForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteKnowledgeItem(it) {
    if (!confirm(`¿Eliminar "${it.title}"?`)) return;
    try {
        const data = await apiRequest(`/api/admin/knowledge/${it.id}`, { method: 'DELETE' });
        if (data.success) {
            if (String(kbEditId.value) === String(it.id)) resetKbForm();
            await loadKnowledgeItems();
        } else {
            setKbMsg(kbListMsg, data.error || 'Error al eliminar', true);
        }
    } catch (err) {
        setKbMsg(kbListMsg, err.message, true);
    }
}

kbFilter.addEventListener('input', renderKbList);

// Check auth on load
async function checkAuth() {
    if (authToken) {
        try {
            const data = await apiRequest('/api/auth/me');
            if (data.success) {
                setAuth(authToken, data.user);
                showHero();
            } else {
                clearAuth();
            }
        } catch (error) {
            clearAuth();
        }
    } else {
        updateUIForAuth();
    }
}

// ---------------- Event listeners ----------------
sendButton.addEventListener('click', () => sendMessage(messageInput.value));
chatSendBtn.addEventListener('click', () => sendMessage(chatInput.value));

function bindImagePicker(btn, fileInput) {
    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        handleFilePick(file);
    });
}

async function handleFilePick(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        setChatStatus('Solo se permiten archivos de imagen');
        return;
    }
    try {
        pendingImage = await resizeImage(file);
        renderAttachment();
        setChatStatus('');
    } catch (e) {
        setChatStatus('No se pudo procesar la imagen');
    }
}

bindImagePicker(chatImgBtn, chatFileInput);
bindImagePicker(heroImgBtn, heroFileInput);
chatMicBtn.addEventListener('click', toggleMic);
heroMicBtn.addEventListener('click', toggleMic);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(messageInput.value);
    }
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(chatInput.value);
    }
});

actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        sendMessage(query);
    });
});

// ---------------- Initialize ----------------
checkAuth();