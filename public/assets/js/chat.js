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
const closeModal = document.getElementById('closeModal');

const sidebarAvatar = document.getElementById('sidebarAvatar');
const settingsBtn = document.getElementById('settingsBtn');
const historyBtn = document.getElementById('historyBtn');
const newChatBtn = document.getElementById('newChatBtn');
const logoBtn = document.getElementById('logoBtn');
const topbarTitle = document.getElementById('topbarTitle');
const topbarUser = document.getElementById('topbarUser');

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
    chatAttachments.innerHTML = '';
    if (!pendingImage) {
        chatAttachments.classList.add('hidden');
        return;
    }
    const el = document.createElement('div');
    el.className = 'chat-attachment';
    el.innerHTML = `<img src="${pendingImage}" alt="Adjunto"><button class="att-remove" title="Quitar imagen">&times;</button>`;
    el.querySelector('.att-remove').addEventListener('click', () => {
        pendingImage = null;
        renderAttachment();
    });
    chatAttachments.appendChild(el);
    chatAttachments.classList.remove('hidden');
}

function setChatStatus(msg, isRec = false) {
    if (chatStatus) {
        chatStatus.textContent = msg || '';
        chatStatus.classList.toggle('rec', !!isRec);
    }
}

// ---------------- Dictado por voz ----------------
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
    chatMicBtn.classList.add('rec');
    chatMicBtn.title = 'Detener dictado';
    chatInput.placeholder = 'Escuchando...';
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
    chatMicBtn.classList.remove('rec');
    chatMicBtn.title = 'Dictar por voz';
    chatInput.placeholder = 'Escribe tu mensaje...';

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
    chatMicBtn.disabled = true;
    try {
        const data = await apiRequest('/api/chat/transcribe', {
            method: 'POST',
            body: JSON.stringify({ audio: b64, mime: blob.type })
        });
        if (data.success && data.text) {
            chatInput.value = data.text;
            chatInput.focus();
            setChatStatus('');
        } else {
            setChatStatus(data.error || 'No se pudo transcribir el audio');
        }
    } catch (e) {
        setChatStatus('Error al transcribir: ' + e.message);
    } finally {
        chatMicBtn.disabled = false;
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
    closeOverlay(historyPanel);
    updateUIForAuth();
}

function updateUIForAuth() {
    if (currentUser) {
        authModal.classList.add('hidden');
        app.classList.remove('hidden');
        topbarTitle.textContent = 'Chat';
        topbarUser.textContent = currentUser.username;
        greetingText.textContent = `¡Hola, ${currentUser.fullName || currentUser.username}! ¿En qué te ayudo hoy?`;
        settingsBtn.classList.remove('hidden');
        sidebarAvatar.textContent = initials(currentUser);
        sidebarAvatar.title = `${currentUser.fullName || currentUser.username} — Cerrar sesión`;
        startNotifications();
    } else {
        authModal.classList.remove('hidden');
        app.classList.add('hidden');
        settingsBtn.classList.add('hidden');
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

closeModal.addEventListener('click', () => {});

sidebarAvatar.addEventListener('click', async () => {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearAuth();
});

logoBtn.addEventListener('click', showHero);

// ---------------- Chat ----------------
function showChat() {
    closeOverlay(adminPanel);
    closeOverlay(editWindow);
    closeOverlay(historyPanel);
    heroSection.classList.add('hidden');
    chatSection.classList.add('active');
    chatInput.focus();
}

function showHero() {
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
        messageDiv.innerHTML = `<img class="msg-avatar" src="/assets/images/avatar-iA.gif" alt="IA"><div class="message-content">${escapeHtml(content)}</div>`;
    } else if (role === 'user') {
        const imgHtml = image
            ? `<img class="msg-image" src="${image}" alt="Imagen adjunta">`
            : '';
        messageDiv.innerHTML = `<div class="message-content">${imgHtml}${escapeHtml(content)}</div><div class="msg-avatar user-avatar">${initials(currentUser)}</div>`;
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
        <img class="msg-avatar" src="/assets/images/avatar-iA.gif" alt="IA">
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
const PANE_TABS = { notifications: 'paneNotifications', users: 'paneUsers', announcements: 'paneAnnouncements' };

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
    topbarTitle.textContent = 'Chat';
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

chatImgBtn.addEventListener('click', () => chatFileInput.click());
chatMicBtn.addEventListener('click', toggleMic);

chatFileInput.addEventListener('change', async () => {
    const file = chatFileInput.files && chatFileInput.files[0];
    chatFileInput.value = '';
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
});

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