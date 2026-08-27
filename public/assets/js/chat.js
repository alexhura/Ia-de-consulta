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

const greetingText = document.getElementById('greetingText');
const heroSection = document.getElementById('heroSection');
const chatSection = document.getElementById('chatSection');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
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
        topbarUser.textContent = `${currentUser.fullName || currentUser.username} · ${roleLabel(currentUser.role)}`;
        greetingText.textContent = `¡Hola, ${currentUser.fullName || currentUser.username}! ¿En qué te ayudo hoy?`;
        settingsBtn.classList.toggle('hidden', currentUser.role !== 'admin');
        sidebarAvatar.textContent = initials(currentUser);
        sidebarAvatar.title = `${currentUser.fullName || currentUser.username} — Cerrar sesión`;
    } else {
        authModal.classList.remove('hidden');
        app.classList.add('hidden');
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

    if (response.status === 401) {
        clearAuth();
        throw new Error('Sesión expirada');
    }

    return response.json();
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
    messageInput.value = '';
    messageInput.focus();
}

function addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    conversationHistory.push({ role, content });
    if (conversationHistory.length > 12) {
        conversationHistory = conversationHistory.slice(-12);
    }
}

function renderMessages(messages) {
    chatContainer.innerHTML = '';
    conversationHistory = [];
    messages.forEach(m => addMessage(m.content, m.role));
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
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
    if (!message.trim()) return;

    showChat();
    addMessage(message, 'user');

    sendButton.disabled = true;
    chatSendBtn.disabled = true;
    messageInput.disabled = true;
    chatInput.disabled = true;

    showTyping();

    try {
        const data = await apiRequest('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
                message,
                history: conversationHistory.slice(0, -1)
            })
        });

        hideTyping();

        if (data.success) {
            addMessage(data.response, 'assistant');
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
        messages: conversationHistory.slice()
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

// ---------------- Ventana de usuarios (admin) ----------------
function openAdminPanel() {
    if (!currentUser || currentUser.role !== 'admin') return;
    topbarTitle.textContent = 'Configuración';
    closeOverlay(adminPanel);
    loadUsers();
    openOverlay(adminPanel);
}

adminCloseBtn.addEventListener('click', () => {
    topbarTitle.textContent = 'Chat';
    closeOverlay(adminPanel);
});

settingsBtn.addEventListener('click', openAdminPanel);

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