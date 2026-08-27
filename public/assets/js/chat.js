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
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message, 
                history: conversationHistory.slice(0, -1) 
            })
        });
        
        const data = await response.json();
        hideTyping();
        
        if (data.success) {
            addMessage(data.response, 'assistant');
        } else {
            addMessage('Lo siento, ocurrió un error. Por favor intenta de nuevo.', 'assistant');
        }
        
    } catch (error) {
        hideTyping();
        addMessage('Error de conexión. Por favor verifica tu conexión a internet.', 'assistant');
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

messageInput.focus();