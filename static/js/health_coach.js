// IntelliMed Health Coach JavaScript

let healthGoals = [];
let progressChart = null;

// Initialize health coach dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeHealthCoach();
});

// Initialize health coach
function initializeHealthCoach() {
    setupEventListeners();
    loadHealthGoals();
    initializeProgressChart();
    setupCoachingTips();
    console.log('Health Coach initialized');
}

// Setup event listeners
function setupEventListeners() {
    // Goal form submission
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', handleGoalSubmission);
    }

    // Progress form submission
    const progressForm = document.getElementById('progress-form');
    if (progressForm) {
        progressForm.addEventListener('submit', handleProgressUpdate);
    }

    // Get AI suggestions button
    const suggestionsBtn = document.getElementById('get-suggestions-btn');
    if (suggestionsBtn) {
        suggestionsBtn.addEventListener('click', generateAISuggestions);
    }

    // Goal type change handler
    const goalTypeSelect = document.getElementById('goal-type');
    if (goalTypeSelect) {
        goalTypeSelect.addEventListener('change', updateGoalFormFields);
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('input[name="goalFilter"]');
    filterButtons.forEach(button => {
        button.addEventListener('change', filterGoals);
    });

    // Progress input change handler
    const currentValueInput = document.getElementById('current-value');
    if (currentValueInput) {
        currentValueInput.addEventListener('input', updateProgressPreview);
    }
}

// Load health goals from API
async function loadHealthGoals() {
    try {
        IntelliMed.showLoadingOverlay('Loading your health goals...');
        
        const response = await IntelliMed.api.get('/api/health-goals');
        
        if (response.success) {
            healthGoals = response.goals;
            displayHealthGoals(healthGoals);
            updateDashboardStats();
            updateProgressChart();
            updateCoachingTips();
        } else {
            throw new Error(response.error || 'Failed to load health goals');
        }
    } catch (error) {
        console.error('Error loading health goals:', error);
        IntelliMed.showNotification('Failed to load health goals. Please try again.', 'danger');
        displayEmptyGoalsState();
    } finally {
        IntelliMed.hideLoadingOverlay();
    }
}

// Display health goals
function displayHealthGoals(goals) {
    const goalsContainer = document.getElementById('goals-container');
    if (!goalsContainer) return;

    if (goals.length === 0) {
        displayEmptyGoalsState();
        return;
    }

    goalsContainer.innerHTML = goals.map(goal => createGoalCard(goal)).join('');
    
    // Add event listeners to goal cards
    goals.forEach(goal => {
        setupGoalCardEvents(goal);
    });
}

// Create goal card HTML
function createGoalCard(goal) {
    const progressPercentage = Math.min(Math.round(goal.progress_percentage), 100);
    const isCompleted = goal.is_completed;
    const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No target date';
    
    return `
        <div class="goal-card card mb-3 goal-type-${goal.goal_type}" data-goal-id="${goal.id}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="flex-grow-1">
                        <h5 class="card-title mb-1">
                            ${isCompleted ? '<i class="fas fa-check-circle text-success me-2"></i>' : ''}
                            ${goal.title}
                        </h5>
                        <p class="card-text text-muted small mb-2">${goal.description}</p>
                        <div class="goal-meta">
                            <span class="badge bg-${getGoalTypeBadgeColor(goal.goal_type)} me-2">
                                ${goal.goal_type.replace('-', ' ').toUpperCase()}
                            </span>
                            <small class="text-muted">Target: ${targetDate}</small>
                        </div>
                    </div>
                    <div class="goal-actions dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item" href="#" onclick="updateGoalProgress(${goal.id})">
                                    <i class="fas fa-chart-line me-2"></i>Update Progress
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" onclick="editGoal(${goal.id})">
                                    <i class="fas fa-edit me-2"></i>Edit Goal
                                </a>
                            </li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="#" onclick="deleteGoal(${goal.id})">
                                    <i class="fas fa-trash me-2"></i>Delete Goal
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div class="goal-progress mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold">Progress</span>
                        <span class="fw-bold">${progressPercentage}%</span>
                    </div>
                    <div class="progress" style="height: 10px;">
                        <div class="progress-bar ${isCompleted ? 'bg-success' : 'bg-primary'}" 
                             role="progressbar" 
                             style="width: ${progressPercentage}%" 
                             aria-valuenow="${progressPercentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-2">
                        <small class="text-muted">Current: ${goal.current_value} ${goal.unit}</small>
                        <small class="text-muted">Target: ${goal.target_value} ${goal.unit}</small>
                    </div>
                </div>
                
                ${isCompleted ? `
                    <div class="alert alert-success mb-0">
                        <i class="fas fa-trophy me-2"></i>
                        Congratulations! You've achieved this goal!
                    </div>
                ` : `
                    <div class="goal-actions-bar d-flex gap-2">
                        <button class="btn btn-primary btn-sm" onclick="updateGoalProgress(${goal.id})">
                            <i class="fas fa-plus me-1"></i>Update Progress
                        </button>
                        <button class="btn btn-outline-info btn-sm" onclick="getGoalAdvice(${goal.id})">
                            <i class="fas fa-lightbulb me-1"></i>Get Tips
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Setup goal card events
function setupGoalCardEvents(goal) {
    // Add hover effects are handled by CSS
}

// Get goal type badge color
function getGoalTypeBadgeColor(type) {
    const colors = {
        'fitness': 'primary',
        'nutrition': 'success',
        'weight': 'warning',
        'wellness': 'info',
        'sleep': 'secondary',
        'mental': 'danger'
    };
    return colors[type] || 'secondary';
}

// Display empty goals state
function displayEmptyGoalsState() {
    const goalsContainer = document.getElementById('goals-container');
    if (!goalsContainer) return;
    
    goalsContainer.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-bullseye text-muted" style="font-size: 4rem;"></i>
            <h5 class="text-muted mt-3">No goals yet</h5>
            <p class="text-muted">Start your health journey by adding your first goal!</p>
            <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#goalModal">
                <i class="fas fa-plus me-2"></i>Add Your First Goal
            </button>
        </div>
    `;
}

// Handle goal form submission
async function handleGoalSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const goalData = {
        goal_type: document.getElementById('goal-type').value,
        title: document.getElementById('goal-title').value,
        description: document.getElementById('goal-description').value,
        target_value: parseFloat(document.getElementById('target-value').value),
        unit: document.getElementById('goal-unit').value,
        target_date: document.getElementById('target-date').value
    };

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';
        submitBtn.disabled = true;

        const response = await IntelliMed.api.post('/api/health-goals', goalData);
        
        if (response.success) {
            IntelliMed.showNotification('Health goal created successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('goalModal'));
            modal.hide();
            
            // Reset form
            form.reset();
            
            // Reload goals
            await loadHealthGoals();
        } else {
            throw new Error(response.error || 'Failed to create goal');
        }
    } catch (error) {
        console.error('Goal creation error:', error);
        IntelliMed.showNotification('Failed to create goal. Please try again.', 'danger');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Goal';
        submitBtn.disabled = false;
    }
}

// Update goal progress
function updateGoalProgress(goalId) {
    const goal = healthGoals.find(g => g.id === goalId);
    if (!goal) return;

    // Populate progress modal
    document.getElementById('progress-goal-id').value = goalId;
    document.getElementById('current-value').value = goal.current_value;
    document.getElementById('progress-unit').textContent = goal.unit;
    
    // Update progress preview
    updateProgressPreview();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('progressModal'));
    modal.show();
}

// Update progress preview
function updateProgressPreview() {
    const goalId = document.getElementById('progress-goal-id').value;
    const currentValue = parseFloat(document.getElementById('current-value').value) || 0;
    const goal = healthGoals.find(g => g.id == goalId);
    
    if (goal) {
        const progressPercentage = Math.min(Math.round((currentValue / goal.target_value) * 100), 100);
        const progressBar = document.getElementById('progress-preview');
        
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.textContent = `${progressPercentage}%`;
        }
    }
}

// Handle progress update submission
async function handleProgressUpdate(event) {
    event.preventDefault();
    
    const goalId = document.getElementById('progress-goal-id').value;
    const currentValue = parseFloat(document.getElementById('current-value').value);
    
    try {
        const response = await IntelliMed.api.post(`/api/health-goals/${goalId}/progress`, {
            current_value: currentValue
        });
        
        if (response.success) {
            IntelliMed.showNotification('Progress updated successfully!', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
            modal.hide();
            
            // Reload goals
            await loadHealthGoals();
        } else {
            throw new Error(response.error || 'Failed to update progress');
        }
    } catch (error) {
        console.error('Progress update error:', error);
        IntelliMed.showNotification('Failed to update progress. Please try again.', 'danger');
    }
}

// Generate AI suggestions
async function generateAISuggestions() {
    const suggestionsBtn = document.getElementById('get-suggestions-btn');
    const suggestionsContainer = document.getElementById('ai-suggestions');
    
    try {
        // Show loading state
        suggestionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
        suggestionsBtn.disabled = true;
        
        // Gather user profile information
        const userProfile = {
            age: 30, // Default - in production, this would come from user data
            health_status: 'good',
            fitness_level: 'moderate',
            health_concerns: [],
            preferences: []
        };
        
        const response = await IntelliMed.api.post('/api/generate-health-goals', userProfile);
        
        if (response.success && response.suggestions.length > 0) {
            displayAISuggestions(response.suggestions);
            suggestionsContainer.style.display = 'block';
        } else {
            throw new Error('No suggestions generated');
        }
    } catch (error) {
        console.error('AI suggestions error:', error);
        IntelliMed.showNotification('Failed to generate suggestions. Please try again.', 'danger');
    } finally {
        suggestionsBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Get AI Suggestions';
        suggestionsBtn.disabled = false;
    }
}

// Display AI suggestions
function displayAISuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    if (!container) return;
    
    container.innerHTML = suggestions.map((suggestion, index) => `
        <div class="col-md-6 mb-3">
            <div class="card suggestion-card h-100" onclick="applySuggestion(${index})">
                <div class="card-body">
                    <h6 class="card-title">${suggestion.title}</h6>
                    <p class="card-text small">${suggestion.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${getGoalTypeBadgeColor(suggestion.goal_type)}">
                            ${suggestion.goal_type.replace('-', ' ').toUpperCase()}
                        </span>
                        <small class="text-muted">${suggestion.timeline_days} days</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Store suggestions for later use
    window.currentSuggestions = suggestions;
}

// Apply AI suggestion to form
function applySuggestion(index) {
    const suggestion = window.currentSuggestions[index];
    if (!suggestion) return;
    
    // Fill form with suggestion data
    document.getElementById('goal-type').value = suggestion.goal_type;
    document.getElementById('goal-title').value = suggestion.title;
    document.getElementById('goal-description').value = suggestion.description;
    document.getElementById('target-value').value = suggestion.target_value;
    document.getElementById('goal-unit').value = suggestion.unit;
    
    // Calculate target date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + suggestion.timeline_days);
    document.getElementById('target-date').value = targetDate.toISOString().split('T')[0];
    
    // Update form fields
    updateGoalFormFields();
    
    IntelliMed.showNotification('Suggestion applied! Review and save your goal.', 'success');
}

// Update goal form fields based on type
function updateGoalFormFields() {
    const goalType = document.getElementById('goal-type').value;
    const unitField = document.getElementById('goal-unit');
    const targetField = document.getElementById('target-value');
    
    // Suggest appropriate units and values based on goal type
    const defaults = {
        fitness: { unit: 'minutes', value: 30 },
        nutrition: { unit: 'servings', value: 5 },
        weight: { unit: 'kg', value: 70 },
        wellness: { unit: 'days', value: 30 },
        sleep: { unit: 'hours', value: 8 },
        mental: { unit: 'sessions', value: 10 }
    };
    
    if (defaults[goalType] && !unitField.value) {
        unitField.value = defaults[goalType].unit;
    }
    
    if (defaults[goalType] && !targetField.value) {
        targetField.value = defaults[goalType].value;
    }
}

// Filter goals based on selection
function filterGoals() {
    const activeFilter = document.querySelector('input[name="goalFilter"]:checked').id;
    let filteredGoals = healthGoals;
    
    switch (activeFilter) {
        case 'active-goals':
            filteredGoals = healthGoals.filter(goal => !goal.is_completed);
            break;
        case 'completed-goals-filter':
            filteredGoals = healthGoals.filter(goal => goal.is_completed);
            break;
        default:
            filteredGoals = healthGoals;
    }
    
    displayHealthGoals(filteredGoals);
}

// Update dashboard statistics
function updateDashboardStats() {
    const totalGoalsEl = document.getElementById('total-goals');
    const completedGoalsEl = document.getElementById('completed-goals');
    const avgProgressEl = document.getElementById('avg-progress');
    const streakDaysEl = document.getElementById('streak-days');
    
    const totalGoals = healthGoals.length;
    const completedGoals = healthGoals.filter(goal => goal.is_completed).length;
    const avgProgress = totalGoals > 0 
        ? Math.round(healthGoals.reduce((sum, goal) => sum + goal.progress_percentage, 0) / totalGoals)
        : 0;
    
    if (totalGoalsEl) totalGoalsEl.textContent = totalGoals;
    if (completedGoalsEl) completedGoalsEl.textContent = completedGoals;
    if (avgProgressEl) avgProgressEl.textContent = `${avgProgress}%`;
    if (streakDaysEl) streakDaysEl.textContent = Math.floor(Math.random() * 15) + 1; // Mock streak
}

// Initialize progress chart
function initializeProgressChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;
    
    progressChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Not Started'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#28a745',
                    '#007bff',
                    '#e9ecef'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Update progress chart
function updateProgressChart() {
    if (!progressChart || healthGoals.length === 0) return;
    
    const completed = healthGoals.filter(goal => goal.is_completed).length;
    const inProgress = healthGoals.filter(goal => !goal.is_completed && goal.current_value > 0).length;
    const notStarted = healthGoals.filter(goal => !goal.is_completed && goal.current_value === 0).length;
    
    progressChart.data.datasets[0].data = [completed, inProgress, notStarted];
    progressChart.update();
}

// Get AI coaching advice for specific goal
async function getGoalAdvice(goalId) {
    const goal = healthGoals.find(g => g.id === goalId);
    if (!goal) return;
    
    try {
        // In a real implementation, this would call the AI API
        const mockAdvice = generateMockAdvice(goal);
        
        IntelliMed.showNotification(mockAdvice, 'info', 8000);
        
    } catch (error) {
        console.error('Goal advice error:', error);
        IntelliMed.showNotification('Failed to get coaching advice. Please try again.', 'danger');
    }
}

// Generate mock coaching advice
function generateMockAdvice(goal) {
    const adviceTemplates = {
        fitness: [
            "Try breaking your exercise into smaller 10-minute sessions throughout the day.",
            "Consider adding strength training to complement your cardio routine.",
            "Remember to stay hydrated and get adequate rest for recovery."
        ],
        nutrition: [
            "Focus on adding more colorful vegetables to your meals.",
            "Try meal prepping to stay consistent with your nutrition goals.",
            "Remember that small, consistent changes lead to lasting results."
        ],
        weight: [
            "Aim for gradual, sustainable weight changes of 1-2 pounds per week.",
            "Focus on building healthy habits rather than just the number on the scale.",
            "Track your progress with measurements and how you feel, not just weight."
        ],
        wellness: [
            "Consider incorporating mindfulness or meditation into your daily routine.",
            "Make sure you're getting quality sleep to support your wellness goals.",
            "Connect with friends and family to support your overall wellbeing."
        ]
    };
    
    const templates = adviceTemplates[goal.goal_type] || adviceTemplates.wellness;
    const randomAdvice = templates[Math.floor(Math.random() * templates.length)];
    
    return `💡 Coaching Tip for "${goal.title}": ${randomAdvice}`;
}

// Setup coaching tips display
function setupCoachingTips() {
    updateCoachingTips();
    
    // Refresh tips every 30 seconds
    setInterval(updateCoachingTips, 30000);
}

// Update coaching tips
function updateCoachingTips() {
    const tipsContainer = document.getElementById('coaching-tips');
    if (!tipsContainer || healthGoals.length === 0) {
        if (tipsContainer) {
            tipsContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas fa-lightbulb text-warning me-3"></i>
                    <div>
                        <small class="text-muted">Add some goals to get personalized coaching tips!</small>
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // Get a random active goal for tips
    const activeGoals = healthGoals.filter(goal => !goal.is_completed);
    if (activeGoals.length === 0) {
        tipsContainer.innerHTML = `
            <div class="coaching-tip">
                <i class="fas fa-trophy text-success me-2"></i>
                <strong>Congratulations!</strong> You've completed all your goals! Consider setting new challenges.
            </div>
        `;
        return;
    }
    
    const randomGoal = activeGoals[Math.floor(Math.random() * activeGoals.length)];
    const advice = generateMockAdvice(randomGoal);
    
    tipsContainer.innerHTML = `
        <div class="coaching-tip">
            <div class="d-flex align-items-start">
                <i class="fas fa-brain text-primary me-2 mt-1"></i>
                <div>
                    <strong class="d-block">AI Coaching Tip</strong>
                    <small>${advice}</small>
                </div>
            </div>
        </div>
    `;
}

// Edit goal function
function editGoal(goalId) {
    IntelliMed.showNotification('Goal editing feature coming soon!', 'info');
}

// Delete goal function
function deleteGoal(goalId) {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        IntelliMed.showNotification('Goal deletion feature coming soon!', 'info');
    }
}

// Export functions for global use
window.healthCoach = {
    loadHealthGoals,
    updateGoalProgress,
    generateAISuggestions,
    getGoalAdvice
};
