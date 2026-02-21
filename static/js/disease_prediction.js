// IntelliMed Disease Prediction JavaScript

let currentAnalysis = null;
let selectedSymptoms = [];
let commonSymptoms = [
    'Headache', 'Fever', 'Cough', 'Sore throat', 'Runny nose',
    'Body aches', 'Fatigue', 'Nausea', 'Dizziness', 'Shortness of breath',
    'Chest pain', 'Abdominal pain', 'Diarrhea', 'Vomiting', 'Rash'
];

// Initialize disease prediction
document.addEventListener('DOMContentLoaded', function() {
    initializeDiseasePrediction();
});

// Initialize disease prediction functionality
function initializeDiseasePrediction() {
    setupEventListeners();
    populateCommonSymptoms();
    setupFormValidation();
    console.log('Disease Prediction initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Analyze symptoms button
    const analyzeBtn = document.getElementById('analyze-symptoms-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeSymptoms);
    }

    // Form field change handlers
    const userAge = document.getElementById('user-age');
    const symptomSeverity = document.getElementById('symptom-severity');
    const symptomDuration = document.getElementById('symptom-duration');

    if (userAge) {
        userAge.addEventListener('change', updatePersonaBasedOnAge);
    }

    // Additional symptom checkboxes
    const additionalSymptoms = ['fever', 'fatigue', 'nausea', 'difficulty-breathing'];
    additionalSymptoms.forEach(symptomId => {
        const checkbox = document.getElementById(symptomId);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    addSelectedSymptom(this.value);
                } else {
                    removeSelectedSymptom(this.value);
                }
            });
        }
    });

    // Main complaint textarea
    const mainComplaint = document.getElementById('main-complaint');
    if (mainComplaint) {
        mainComplaint.addEventListener('input', function() {
            // Auto-resize textarea
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
}

// Populate common symptoms checkboxes
function populateCommonSymptoms() {
    const symptomsContainer = document.getElementById('common-symptoms');
    if (!symptomsContainer) return;

    symptomsContainer.innerHTML = commonSymptoms.map(symptom => `
        <div class="col-md-6 col-lg-4 mb-2">
            <div class="form-check">
                <input class="form-check-input symptom-checkbox" 
                       type="checkbox" 
                       id="symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}" 
                       value="${symptom}">
                <label class="form-check-label" for="symptom-${symptom.toLowerCase().replace(/\s+/g, '-')}">
                    ${symptom}
                </label>
            </div>
        </div>
    `).join('');

    // Add event listeners to symptom checkboxes
    const checkboxes = symptomsContainer.querySelectorAll('.symptom-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                addSelectedSymptom(this.value);
            } else {
                removeSelectedSymptom(this.value);
            }
        });
    });
}

// Add selected symptom
function addSelectedSymptom(symptom) {
    if (!selectedSymptoms.includes(symptom)) {
        selectedSymptoms.push(symptom);
    }
}

// Remove selected symptom
function removeSelectedSymptom(symptom) {
    selectedSymptoms = selectedSymptoms.filter(s => s !== symptom);
}

// Update persona based on age selection
function updatePersonaBasedOnAge() {
    const ageSelect = document.getElementById('user-age');
    if (!ageSelect) return;

    const selectedAge = ageSelect.value;
    let message = '';

    switch (selectedAge) {
        case '0-2':
        case '3-12':
            message = 'I\'ll use child-friendly language to help explain any results. 👶';
            break;
        case '65+':
            message = 'I\'ll provide clear, detailed explanations and speak slowly if needed. 👴';
            break;
        case '13-17':
            message = 'I\'ll explain things in a way that\'s easy to understand for teens. 🧑‍🎓';
            break;
        default:
            message = '';
    }

    if (message) {
        IntelliMed.showNotification(message, 'info');
    }
}

// Setup form validation
function setupFormValidation() {
    const requiredFields = ['user-age', 'main-complaint'];
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        }
    });
}

// Validate individual field
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (!value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('is-invalid');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(field) {
    if (typeof field === 'object') {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    } else {
        // Called from event listener
        const fieldElement = field.target;
        fieldElement.classList.remove('is-invalid');
        const errorDiv = fieldElement.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
}

// Analyze symptoms
async function analyzeSymptoms() {
    // Validate form
    if (!validateSymptomForm()) {
        return;
    }

    // Collect form data
    const symptomsData = collectSymptomData();
    
    // Show loading modal
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    try {
        const response = await IntelliMed.api.post('/api/predict-disease', symptomsData);
        
        if (response.success) {
            currentAnalysis = response;
            displayAnalysisResults(response);
            showResultsCard();
        } else {
            throw new Error(response.error || 'Failed to analyze symptoms');
        }
    } catch (error) {
        console.error('Symptom analysis error:', error);
        IntelliMed.showNotification('Failed to analyze symptoms. Please try again.', 'danger');
        displayAnalysisError();
    } finally {
        loadingModal.hide();
    }
}

// Validate symptom form
function validateSymptomForm() {
    let isValid = true;

    // Check required fields
    const ageSelect = document.getElementById('user-age');
    const mainComplaint = document.getElementById('main-complaint');

    if (!ageSelect.value.trim()) {
        showFieldError(ageSelect, 'Please select your age range');
        isValid = false;
    }

    if (!mainComplaint.value.trim()) {
        showFieldError(mainComplaint, 'Please describe your main concern or symptom');
        isValid = false;
    }

    // Check if at least one symptom is provided
    const hasMainComplaint = mainComplaint.value.trim().length > 0;
    const hasSelectedSymptoms = selectedSymptoms.length > 0;
    const hasAdditionalSymptoms = document.querySelectorAll('#symptom-details-card input[type="checkbox"]:checked').length > 0;

    if (!hasMainComplaint && !hasSelectedSymptoms && !hasAdditionalSymptoms) {
        IntelliMed.showNotification('Please provide at least one symptom to analyze.', 'warning');
        isValid = false;
    }

    if (!isValid) {
        // Scroll to first error
        const firstError = document.querySelector('.is-invalid');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

// Collect symptom data from form
function collectSymptomData() {
    const symptoms = [...selectedSymptoms];
    
    // Add main complaint as a symptom
    const mainComplaint = document.getElementById('main-complaint').value.trim();
    if (mainComplaint) {
        symptoms.push(mainComplaint);
    }

    // Add additional symptoms from checkboxes
    const additionalCheckboxes = document.querySelectorAll('#symptom-details-card input[type="checkbox"]:checked');
    additionalCheckboxes.forEach(checkbox => {
        if (!symptoms.includes(checkbox.value)) {
            symptoms.push(checkbox.value);
        }
    });

    return {
        symptoms: symptoms,
        age: document.getElementById('user-age').value,
        gender: document.getElementById('user-gender').value,
        duration: document.getElementById('symptom-duration').value,
        severity: document.getElementById('symptom-severity').value,
        medical_conditions: document.getElementById('medical-conditions').value.trim(),
        medications: document.getElementById('current-medications').value.trim()
    };
}

// Display analysis results
function displayAnalysisResults(results) {
    const resultsContainer = document.getElementById('analysis-results');
    if (!resultsContainer) return;

    const urgencyClass = `urgency-${results.urgency_level}`;
    const confidencePercentage = Math.round(results.confidence * 100);

    resultsContainer.innerHTML = `
        <div class="analysis-result ${urgencyClass}">
            <div class="mb-3">
                <h6 class="fw-bold d-flex align-items-center">
                    ${getUrgencyIcon(results.urgency_level)}
                    <span class="ms-2">Analysis Results</span>
                </h6>
                <div class="urgency-badge mb-2">
                    <span class="badge ${getUrgencyBadgeClass(results.urgency_level)}">
                        ${results.urgency_level.toUpperCase()} PRIORITY
                    </span>
                </div>
            </div>

            <div class="prediction-section mb-3">
                <h6 class="fw-bold">Assessment</h6>
                <p class="mb-2">${results.prediction}</p>
                
                <div class="confidence-section">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <small class="text-muted">Confidence Level</small>
                        <small class="fw-bold">${confidencePercentage}%</small>
                    </div>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar ${getConfidenceColor(results.confidence)}" 
                             style="width: ${confidencePercentage}%"></div>
                    </div>
                </div>
            </div>

            ${results.recommendations.length > 0 ? `
                <div class="recommendations-section mb-3">
                    <h6 class="fw-bold">Recommendations</h6>
                    ${results.recommendations.map(rec => `
                        <div class="recommendation-item">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            ${rec}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="disclaimer-section">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Important:</strong> This is an AI assessment and should not replace professional medical advice. 
                    Please consult with healthcare providers for proper diagnosis and treatment.
                </div>
            </div>

            <div class="action-buttons d-flex gap-2 flex-wrap">
                <button class="btn btn-primary btn-sm" onclick="findNearbyDoctors()">
                    <i class="fas fa-map-marker-alt me-1"></i>Find Doctors
                </button>
                <button class="btn btn-success btn-sm" onclick="bookConsultation()">
                    <i class="fas fa-calendar-plus me-1"></i>Book Consultation
                </button>
                <button class="btn btn-info btn-sm" onclick="chatWithAI()">
                    <i class="fas fa-comments me-1"></i>Chat with AI
                </button>
                ${results.urgency_level === 'emergency' ? `
                    <a href="tel:108" class="btn btn-danger btn-sm">
                        <i class="fas fa-phone me-1"></i>Call 108
                    </a>
                ` : ''}
            </div>
        </div>
    `;
}

// Get urgency icon
function getUrgencyIcon(urgency) {
    const icons = {
        low: '<i class="fas fa-info-circle text-success"></i>',
        medium: '<i class="fas fa-exclamation-circle text-warning"></i>',
        high: '<i class="fas fa-exclamation-triangle text-danger"></i>',
        emergency: '<i class="fas fa-ambulance text-danger"></i>'
    };
    return icons[urgency] || icons.medium;
}

// Get urgency badge class
function getUrgencyBadgeClass(urgency) {
    const classes = {
        low: 'bg-success',
        medium: 'bg-warning',
        high: 'bg-danger',
        emergency: 'bg-danger'
    };
    return classes[urgency] || classes.medium;
}

// Get confidence color
function getConfidenceColor(confidence) {
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-warning';
    return 'bg-danger';
}

// Show results card
function showResultsCard() {
    const resultsCard = document.getElementById('results-card');
    if (resultsCard) {
        resultsCard.style.display = 'block';
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Display analysis error
function displayAnalysisError() {
    const resultsContainer = document.getElementById('analysis-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Analysis Error</strong>
            <p class="mb-2">We encountered an issue while analyzing your symptoms. This could be due to:</p>
            <ul class="mb-3">
                <li>Temporary server issues</li>
                <li>Network connectivity problems</li>
                <li>High system load</li>
            </ul>
            <p class="mb-0">Please try again in a few moments, or contact our support team if the issue persists.</p>
        </div>
        
        <div class="mt-3 d-flex gap-2">
            <button class="btn btn-primary btn-sm" onclick="analyzeSymptoms()">
                <i class="fas fa-redo me-1"></i>Try Again
            </button>
            <button class="btn btn-success btn-sm" onclick="chatWithAI()">
                <i class="fas fa-comments me-1"></i>Chat with Support
            </button>
        </div>
    `;

    showResultsCard();
}

// Action button functions
function findNearbyDoctors() {
    window.location.href = '/facility-finder';
}

function bookConsultation() {
    window.location.href = '/appointments';
}

function chatWithAI() {
    const persona = determineAppropriatePersona();
    window.location.href = `/chat?persona=${persona}`;
}

// Determine appropriate chat persona based on user age
function determineAppropriatePersona() {
    const ageSelect = document.getElementById('user-age');
    if (!ageSelect) return 'empathetic';

    const age = ageSelect.value;
    
    if (age === '0-2' || age === '3-12') {
        return 'pediatric';
    } else if (age === '65+') {
        return 'senior';
    } else {
        return 'empathetic';
    }
}

// Save analysis to history (future feature)
function saveAnalysis() {
    if (!currentAnalysis) return;

    // Store in localStorage for now
    const history = JSON.parse(localStorage.getItem('symptom_history') || '[]');
    history.push({
        ...currentAnalysis,
        timestamp: new Date().toISOString(),
        id: Date.now()
    });
    
    // Keep only last 10 analyses
    if (history.length > 10) {
        history.splice(0, history.length - 10);
    }
    
    localStorage.setItem('symptom_history', JSON.stringify(history));
}

// Load and display history (future feature)
function loadAnalysisHistory() {
    const history = JSON.parse(localStorage.getItem('symptom_history') || '[]');
    const historySection = document.getElementById('history-section');
    const historyContainer = document.getElementById('analysis-history');
    
    if (history.length === 0 || !historyContainer) return;

    historyContainer.innerHTML = history.reverse().map(analysis => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">${analysis.prediction.substring(0, 100)}...</h6>
                        <p class="card-text">
                            <small class="text-muted">
                                ${new Date(analysis.timestamp).toLocaleDateString()} - 
                                ${analysis.urgency_level.toUpperCase()} priority
                            </small>
                        </p>
                    </div>
                    <span class="badge ${getUrgencyBadgeClass(analysis.urgency_level)}">
                        ${Math.round(analysis.confidence * 100)}% confident
                    </span>
                </div>
            </div>
        </div>
    `).join('');

    if (historySection) {
        historySection.style.display = 'block';
    }
}

// Initialize history on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAnalysisHistory();
});

// Export functions for global use
window.diseasePrediction = {
    analyzeSymptoms,
    findNearbyDoctors,
    bookConsultation,
    chatWithAI
};

// Form step navigation (future enhancement)
function nextStep(currentStep) {
    const steps = document.querySelectorAll('.card[id*="-card"]');
    const nextStepIndex = currentStep + 1;
    
    if (nextStepIndex < steps.length) {
        steps[nextStepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function previousStep(currentStep) {
    const steps = document.querySelectorAll('.card[id*="-card"]');
    const prevStepIndex = currentStep - 1;
    
    if (prevStepIndex >= 0) {
        steps[prevStepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
