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
const logoutBtn = document.getElementById('logoutBtn');
const userDisplay = document.getElementById('userDisplay');
const userProfile = document.getElementById('userProfile');
const greetingText = document.getElementById('greetingText');

const heroSection = document.getElementById('heroSection');
const chatSection = document.getElementById('chatSection');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const backBtn = document.getElementById('backBtn');
const actionBtns = document.querySelectorAll('.action-btn');
const clearChatBtn = document.getElementById('clearChatBtn');

// Admin Panel DOM
const adminBtn = document.getElementById('adminBtn');
const adminPanel = document.getElementById('adminPanel');
const adminBackBtn = document.getElementById('adminBackBtn');
const createUserForm = document.getElementById('createUserForm');
const usersTableBody = document.getElementById('usersTableBody');
const createUserMsg = document.getElementById('createUserMsg');
const usersMsg = document.getElementById('usersMsg');

let conversationHistory = [];

function roleLabel(role) {
    return ROLE_LABELS[role] || role || '—';
}

// Auth functions
function setAuth(token, user) {
    authToken = token;
    currentUser = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUIForAuth();
    if (currentUser.role === 'admin') loadUsers();
}

function clearAuth() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    closeAdminPanel();
    updateUIForAuth();
}

function updateUIForAuth() {
    if (currentUser) {
        authModal.classList.add('hidden');
        app.classList.remove('hidden');
        userDisplay.textContent = `${currentUser.fullName || currentUser.username} (${roleLabel(currentUser.role)})`;
        userProfile.textContent = currentUser.role === 'admin' ? 'Administrador' : roleLabel(currentUser.role) + ' - Usuario';
        greetingText.textContent = `¡Hola, ${currentUser.fullName || currentUser.username}! ¿En qué te ayudo hoy?`;
        adminBtn.classList.toggle('hidden', currentUser.role !== 'admin');
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
            loginFormElement.reset();
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        alert(error.message);
    }
});

closeModal.addEventListener('click', () => {
    if (!currentUser) return;
});

logoutBtn.addEventListener('click', async () => {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearAuth();
});

// Admin panel functions
function openAdminPanel() {
    heroSection.classList.add('hidden');
    chatSection.classList.remove('active');
    adminPanel.classList.remove('hidden');
    loadUsers();
}

function closeAdminPanel() {
    adminPanel.classList.add('hidden');
}

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
        if (user.username === 'admin') {
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

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'admin-btn';
        toggleBtn.textContent = user.isActive ? 'Desactivar' : 'Activar';
        toggleBtn.disabled = user.username === 'admin';
        toggleBtn.addEventListener('click', async () => {
            if (user.username === 'admin') return;
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

        if (user.username !== 'admin') {
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

adminBtn.addEventListener('click', openAdminPanel);
adminBackBtn.addEventListener('click', () => {
    closeAdminPanel();
    heroSection.classList.remove('hidden');
    messageInput.focus();
});

// Check auth on load
async function checkAuth() {
    if (authToken) {
        try {
            const data = await apiRequest('/api/auth/me');
            if (data.success) {
                setAuth(authToken, data.user);
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

// Chat functions
function showChat() {
    closeAdminPanel();
    heroSection.classList.add('hidden');
    chatSection.classList.add('active');
    chatInput.focus();
}

function showHero() {
    heroSection.classList.remove('hidden');
    chatSection.classList.remove('active');
    chatContainer.innerHTML = '';
    conversationHistory = [];
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    let html = div.innerHTML.replace(/\n/g, '<br>');
    
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    html = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    return html;
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

function clearChat() {
    if (confirm('¿Limpiar toda la conversación?')) {
        conversationHistory = [];
        chatContainer.innerHTML = '';
        showHero();
    }
}

// Event listeners
sendButton.addEventListener('click', () => sendMessage(messageInput.value));
chatSendBtn.addEventListener('click', () => sendMessage(chatInput.value));
clearChatBtn.addEventListener('click', clearChat);

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

backBtn.addEventListener('click', showHero);

actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        sendMessage(query);
    });
});

// Initialize
checkAuth();
messageInput.focus();