// Auth state
let authToken = localStorage.getItem('authToken') || null;
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// DOM Elements
const authModal = document.getElementById('authModal');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
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

let conversationHistory = [];

// Auth functions
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
    updateUIForAuth();
}

function updateUIForAuth() {
    if (currentUser) {
        authModal.classList.add('hidden');
        app.classList.remove('hidden');
        userDisplay.textContent = `${currentUser.fullName || currentUser.username} (${currentUser.role})`;
        userProfile.textContent = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
        greetingText.textContent = `¡Hola, ${currentUser.fullName || currentUser.username}! ¿En qué te ayudo hoy?`;
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

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value;
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, fullName })
        });
        
        if (data.success) {
            setAuth(data.token, data.user);
            registerFormElement.reset();
        } else {
            alert(data.error || 'Error al registrarse');
        }
    } catch (error) {
        alert(error.message);
    }
});

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    // Don't allow closing if not authenticated
    if (!currentUser) return;
});

logoutBtn.addEventListener('click', async () => {
    try {
        await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    clearAuth();
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