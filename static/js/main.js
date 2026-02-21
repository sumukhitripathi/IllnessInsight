// IntelliMed Main JavaScript

// Global variables
let currentUser = null;
let notificationCount = 0;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkUserSession();
});

// Initialize application
function initializeApp() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Setup intersection observer for animations
    setupScrollAnimations();
    
    // Setup accessibility features
    setupAccessibility();
    
    console.log('IntelliMed application initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Global error handler
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        showNotification('An error occurred. Please try again.', 'danger');
    });

    // Handle form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        if (form && form.classList.contains('needs-validation')) {
            handleFormValidation(form, event);
        }
    });

    // Handle card hover effects
    document.addEventListener('mouseenter', function(event) {
        if (event.target && event.target.classList && event.target.classList.contains('hover-card')) {
            event.target.style.transform = 'translateY(-5px)';
            event.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
    }, true);

    document.addEventListener('mouseleave', function(event) {
        if (event.target && event.target.classList && event.target.classList.contains('hover-card')) {
            event.target.style.transform = 'translateY(0)';
            event.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
    }, true);

    // Handle click outside to close dropdowns
    document.addEventListener('click', function(event) {
        closeOpenDropdowns(event);
    });
}

// Check user session
function checkUserSession() {
    // In a real app, this would check authentication status
    const sessionData = localStorage.getItem('intellimed_session');
    if (sessionData) {
        try {
            currentUser = JSON.parse(sessionData);
            updateUIForUser();
        } catch (error) {
            console.error('Error parsing session data:', error);
            localStorage.removeItem('intellimed_session');
        }
    }
}

// Update UI for authenticated user
function updateUIForUser() {
    if (currentUser) {
        // Update navbar with user info
        const userElement = document.getElementById('user-info');
        if (userElement) {
            userElement.innerHTML = `
                <span class="me-2">Welcome, ${currentUser.name}</span>
                <button class="btn btn-outline-light btn-sm" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            `;
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('intellimed_session');
    currentUser = null;
    window.location.reload();
}

// Form validation handler
function handleFormValidation(form, event) {
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        
        // Find first invalid field and focus on it
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            showNotification('Please fill in all required fields correctly.', 'warning');
        }
    }
    
    form.classList.add('was-validated');
}

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = getOrCreateNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification-item`;
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${getNotificationIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Auto-dismiss after specified duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('fade');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 150);
        }
    }, duration);
    
    return notification;
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        danger: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Get or create notification container
function getOrCreateNotificationContainer() {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'position-fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    return container;
}

// Loading overlay
function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'position-fixed w-100 h-100 d-flex align-items-center justify-content-center';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
        overlay.style.zIndex = '9998';
        document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
        <div class="text-center text-white">
            <div class="spinner-border mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div class="h5">${message}</div>
        </div>
    `;
    overlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Setup scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

// Setup accessibility features
function setupAccessibility() {
    // Skip navigation link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'visually-hidden-focusable btn btn-primary position-absolute';
    skipLink.style.top = '10px';
    skipLink.style.left = '10px';
    skipLink.style.zIndex = '10000';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add ARIA labels where missing
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
        const icon = button.querySelector('i[class*="fa-"]');
        if (icon && !button.textContent.trim()) {
            const iconClass = icon.className;
            let label = 'Button';
            
            if (iconClass.includes('fa-search')) label = 'Search';
            else if (iconClass.includes('fa-close') || iconClass.includes('fa-times')) label = 'Close';
            else if (iconClass.includes('fa-edit')) label = 'Edit';
            else if (iconClass.includes('fa-delete') || iconClass.includes('fa-trash')) label = 'Delete';
            else if (iconClass.includes('fa-save')) label = 'Save';
            else if (iconClass.includes('fa-plus')) label = 'Add';
            
            button.setAttribute('aria-label', label);
        }
    });

    // Handle focus management for modals
    document.addEventListener('shown.bs.modal', function (event) {
        const modal = event.target;
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    });
}

// Close open dropdowns when clicking outside
function closeOpenDropdowns(event) {
    if (!event.target) return;
    
    const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
    openDropdowns.forEach(dropdown => {
        const prevElement = dropdown.previousElementSibling;
        if (dropdown && 
            !dropdown.contains(event.target) && 
            prevElement && 
            !prevElement.contains(event.target)) {
            const dropdownInstance = bootstrap.Dropdown.getInstance(prevElement);
            if (dropdownInstance) {
                dropdownInstance.hide();
            }
        }
    });
}

// Utility functions
const utils = {
    // Format date
    formatDate: function(date, format = 'short') {
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' }
        };
        
        return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(new Date(date));
    },

    // Format number
    formatNumber: function(number, options = {}) {
        return new Intl.NumberFormat('en-US', options).format(number);
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Generate UUID
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Sanitize HTML
    sanitizeHTML: function(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // Local storage with expiry
    setStorageWithExpiry: function(key, value, ttl = 3600000) { // default 1 hour
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    getStorageWithExpiry: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            localStorage.removeItem(key);
            return null;
        }
    }
};

// API helper functions
const api = {
    // Base request function
    request: async function(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // GET request
    get: function(url) {
        return this.request(url);
    },

    // POST request
    post: function(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // PUT request
    put: function(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // DELETE request
    delete: function(url) {
        return this.request(url, {
            method: 'DELETE',
        });
    }
};

// Voice recognition utilities (for senior-friendly features)
const voice = {
    recognition: null,
    isListening: false,

    // Initialize speech recognition
    init: function() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            return true;
        }
        return false;
    },

    // Start listening
    startListening: function(callback) {
        if (!this.recognition) {
            if (!this.init()) {
                showNotification('Speech recognition is not supported in your browser.', 'warning');
                return;
            }
        }

        if (this.isListening) return;

        this.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            callback(transcript);
        };

        this.recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showNotification('Speech recognition error. Please try again.', 'danger');
        };

        this.recognition.onend = function() {
            voice.isListening = false;
        };

        this.recognition.start();
        this.isListening = true;
    },

    // Stop listening
    stopListening: function() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    },

    // Text to speech
    speak: function(text, options = {}) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = options.rate || 0.8;
            utterance.pitch = options.pitch || 1;
            utterance.volume = options.volume || 1;
            speechSynthesis.speak(utterance);
        } else {
            console.warn('Text-to-speech is not supported in your browser.');
        }
    }
};

// Performance monitoring
const performance = {
    // Mark performance metrics
    mark: function(name) {
        if ('performance' in window && 'mark' in window.performance) {
            window.performance.mark(name);
        }
    },

    // Measure performance between marks
    measure: function(name, startMark, endMark) {
        if ('performance' in window && 'measure' in window.performance) {
            window.performance.measure(name, startMark, endMark);
            const measure = window.performance.getEntriesByName(name)[0];
            console.log(`${name}: ${measure.duration}ms`);
            return measure.duration;
        }
    }
};

// Export utilities for use in other scripts
window.IntelliMed = {
    utils,
    api,
    voice,
    performance,
    showNotification,
    showLoadingOverlay,
    hideLoadingOverlay,
    currentUser,
    logout
};

// Mark app initialization complete
performance.mark('app-init-complete');
