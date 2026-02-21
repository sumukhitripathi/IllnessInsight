// IntelliMed Chat JavaScript

let currentChatSession = null;
let isTyping = false;
let currentPersona = 'general';
let voiceRecognition = null;

// Initialize chat
function initializeChat(persona = 'general') {
    currentPersona = persona;
    setupEventListeners();
    initializeVoiceRecognition();
    console.log(`Chat initialized with persona: ${persona}`);
}

// Setup event listeners
function setupEventListeners() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');

    // Send message on Enter key
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea as user types
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    // Send button click
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Voice button click
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceRecognition);
    }
}

// Initialize voice recognition for senior-friendly features
function initializeVoiceRecognition() {
    if (currentPersona === 'senior' && 'webkitSpeechRecognition' in window) {
        voiceRecognition = new webkitSpeechRecognition();
        voiceRecognition.continuous = false;
        voiceRecognition.interimResults = false;
        voiceRecognition.lang = 'en-US';

        voiceRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.value = transcript;
                sendMessage();
            }
        };

        voiceRecognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            IntelliMed.showNotification('Voice recognition error. Please try again.', 'warning');
            updateVoiceButton(false);
        };

        voiceRecognition.onend = function() {
            updateVoiceButton(false);
        };
    }
}

// Toggle voice recognition
function toggleVoiceRecognition() {
    const voiceBtn = document.getElementById('voice-btn');
    
    if (!voiceRecognition) {
        IntelliMed.showNotification('Voice recognition is not available.', 'info');
        return;
    }

    if (voiceRecognition && voiceBtn && !voiceBtn.classList.contains('recording')) {
        voiceRecognition.start();
        updateVoiceButton(true);
    } else if (voiceRecognition) {
        voiceRecognition.stop();
        updateVoiceButton(false);
    }
}

// Update voice button state
function updateVoiceButton(isRecording) {
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn) {
        if (isRecording) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
            voiceBtn.title = 'Stop recording';
        } else {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            voiceBtn.title = 'Click to speak';
        }
    }
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message) return;

    // Clear input and disable send button
    messageInput.value = '';
    messageInput.style.height = 'auto';
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.disabled = true;
    }

    // Add user message to chat
    addMessageToChat(message, true);

    // Show typing indicator
    showTypingIndicator();

    try {
        // Send message to API
        const response = await IntelliMed.api.post('/api/chat', {
            message: message,
            persona: currentPersona
        });

        if (response.success) {
            // Hide typing indicator
            hideTypingIndicator();
            
            // Add AI response to chat
            addMessageToChat(response.response, false);
            
            // Speak response for senior persona
            if (currentPersona === 'senior') {
                IntelliMed.voice.speak(response.response, { rate: 0.8 });
            }
        } else {
            throw new Error(response.error || 'Failed to get response');
        }
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessageToChat(
            "I apologize, but I'm having trouble processing your message right now. Please try again in a moment.",
            false
        );
        IntelliMed.showNotification('Failed to send message. Please try again.', 'danger');
    } finally {
        // Re-enable send button
        if (sendBtn) {
            sendBtn.disabled = false;
        }
    }
}

// Add message to chat
function addMessageToChat(message, isUser) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    if (isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${IntelliMed.utils.sanitizeHTML(message)}
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                ${getPersonaIcon()}
            </div>
            <div class="message-content">
                ${formatBotMessage(message)}
            </div>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Get persona icon
function getPersonaIcon() {
    const icons = {
        senior: '<i class="fas fa-user-clock"></i>',
        pediatric: '<i class="fas fa-child"></i>',
        empathetic: '<i class="fas fa-heart"></i>',
        caregiver: '<i class="fas fa-user-nurse"></i>',
        general: '<i class="fas fa-user-md"></i>'
    };
    return icons[currentPersona] || icons.general;
}

// Format bot message with special features
function formatBotMessage(message) {
    let formattedMessage = IntelliMed.utils.sanitizeHTML(message);
    
    // Add emojis for pediatric persona
    if (currentPersona === 'pediatric') {
        formattedMessage = addFriendlyEmojis(formattedMessage);
    }
    
    // Convert URLs to links
    formattedMessage = formattedMessage.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    
    return formattedMessage;
}

// Add friendly emojis for pediatric persona
function addFriendlyEmojis(message) {
    const emojiMap = {
        'great': 'great 😊',
        'good': 'good 👍',
        'healthy': 'healthy 💪',
        'medicine': 'medicine 💊',
        'doctor': 'doctor 👨‍⚕️',
        'feel better': 'feel better 🌟',
        'exercise': 'exercise 🏃‍♀️',
        'eat': 'eat 🍎',
        'sleep': 'sleep 😴'
    };
    
    let result = message;
    Object.keys(emojiMap).forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, emojiMap[word]);
    });
    
    return result;
}

// Show typing indicator
function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="bot-avatar">
            ${getPersonaIcon()}
        </div>
        <div class="typing-indicator">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;

    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// Scroll to bottom of chat
function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Quick message suggestions based on persona
function getQuickSuggestions(persona) {
    const suggestions = {
        senior: [
            "I'm having trouble with my medication",
            "I need help understanding my symptoms",
            "Can you help me find a doctor nearby?",
            "I'm worried about my health"
        ],
        pediatric: [
            "My tummy hurts",
            "I don't want to take medicine",
            "When will I feel better?",
            "Can you help me understand what's wrong?"
        ],
        empathetic: [
            "I'm feeling anxious about my health",
            "I'm scared about my symptoms",
            "I don't know what to do",
            "Can you help me feel better?"
        ],
        caregiver: [
            "I'm caring for someone with health issues",
            "I need advice for helping my family member",
            "How can I manage caregiver stress?",
            "What resources are available for caregivers?"
        ],
        general: [
            "I have questions about my symptoms",
            "I need to find a healthcare provider",
            "Can you help me understand my condition?",
            "I need health advice"
        ]
    };
    
    return suggestions[persona] || suggestions.general;
}

// Initialize quick suggestions
function initializeQuickSuggestions() {
    const suggestions = getQuickSuggestions(currentPersona);
    const suggestionsContainer = document.getElementById('quick-suggestions');
    
    if (suggestionsContainer && suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(suggestion => 
            `<button class="btn btn-outline-primary btn-sm me-2 mb-2" onclick="sendQuickMessage('${suggestion}')">
                ${suggestion}
            </button>`
        ).join('');
    }
}

// Send quick message
function sendQuickMessage(message) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.value = message;
        sendMessage();
    }
}

// Handle persona changes
function changePersona(newPersona) {
    currentPersona = newPersona;
    
    // Update UI to reflect new persona
    updatePersonaUI();
    
    // Show persona change message
    addMessageToChat(
        `I've switched to ${getPersonaName(newPersona)} mode. How can I help you today?`,
        false
    );
    
    // Reinitialize voice recognition if needed
    if (newPersona === 'senior') {
        initializeVoiceRecognition();
    }
}

// Get persona display name
function getPersonaName(persona) {
    const names = {
        senior: 'Senior Care',
        pediatric: 'Child-Friendly',
        empathetic: 'Empathetic Care',
        caregiver: 'Caregiver Support',
        general: 'General Healthcare'
    };
    return names[persona] || names.general;
}

// Update UI for current persona
function updatePersonaUI() {
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        // Remove existing persona classes
        chatContainer.classList.remove('persona-senior', 'persona-pediatric', 'persona-empathetic', 'persona-caregiver', 'persona-general');
        // Add current persona class
        chatContainer.classList.add(`persona-${currentPersona}`);
    }
    
    // Update persona-specific styles
    if (currentPersona === 'senior') {
        document.body.style.fontSize = '1.1rem';
    } else {
        document.body.style.fontSize = '';
    }
}

// Export chat functions for global use
window.chat = {
    sendMessage,
    sendQuickMessage,
    changePersona,
    initializeChat,
    toggleVoiceRecognition
};

// Auto-scroll on new messages
const chatObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
            scrollToBottom();
        }
    });
});

// Observe chat messages container for new messages
document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
        chatObserver.observe(messagesContainer, { childList: true });
    }
});
