/**
 * Hukuk.AI - Form Handling Script
 * This file contains specific handlers for form submission
 * and is designed to be loaded before the main script
 */

// Add this at the very top of the file to ensure it runs first
console.log('Form handler script is loading');

// Create a global variable to track initialization state
window.formHandlerInitialized = false;

// IMMEDIATELY expose key functions to global scope to prevent "not found" errors
(function() {
    console.log('Initializing form handler functions immediately');
    
    // Directly expose the implementation as a global function for inline handlers
    window._handleAIFormSubmit = function(event) {
        console.log('Form submit handler triggered', event);
        
        try {
            if (event) {
                event.preventDefault();
            }
            
            // Get form data from the correct form
            const aiForm = document.getElementById('aiForm');
            if (!aiForm) {
                console.error('AI Form not found');
                window._showMessage('error', 'Form not found. Please refresh the page and try again.');
                return;
            }
            
            // Get template data
            const templateSelect = document.getElementById('templateSelect');
            const categorySelect = document.getElementById('categorySelect');
            const caseDescription = document.getElementById('caseDescription');
            
            if (!templateSelect || !categorySelect || !caseDescription) {
                console.error('Required form fields not found');
                window._showMessage('error', 'Required form fields not found. Please refresh the page and try again.');
                return;
            }
            
            const templateName = templateSelect.value;
            const category = categorySelect.value;
            const description = caseDescription.value;
            
            if (!templateName || !category || !description) {
                window._showMessage('error', 'Lütfen tüm zorunlu alanları doldurun.');
                return;
            }
            
            try {
                // Show loading indicator - moved this here after validations
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'flex';
                } else {
                    console.warn('Loading indicator element not found');
                }
                
                // Get template specific fields
                const templateData = {};
                const templateFieldsContainer = document.getElementById(templateName + 'Fields');
                if (templateFieldsContainer) {
                    const inputs = templateFieldsContainer.querySelectorAll('input, textarea, select');
                    inputs.forEach(input => {
                        let fieldName = input.id;
                        if (fieldName.endsWith('_' + templateName)) {
                            fieldName = fieldName.replace('_' + templateName, '');
                        }
                        templateData[fieldName] = input.value;
                    });
                }
                
                // Prepare the JSON data
                const jsonData = {
                    template_name: templateName,
                    case_description: description,
                    case_category: category,
                    template_data: templateData,
                    metadata: {
                        source: 'form_submit',
                        created_at: new Date().toISOString()
                    }
                };
                
                console.log('Sending data:', jsonData);
                
                // Send the request to the API
                fetch('/api/documents/ai-generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('API request failed with status ' + response.status);
                    }
                    return response.json();
                })
                .then(result => {
                    console.log('API Response:', result);
                    
                    // Hide loading indicator
                    const loadingIndicator = document.getElementById('loadingIndicator');
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                    
                    // Show result
                    const resultDiv = document.getElementById('result');
                    if (resultDiv) {
                        resultDiv.style.display = 'block';
                    }
                    
                    // Set download link
                    const downloadLink = document.getElementById('downloadLink');
                    if (downloadLink) {
                        if (result.id) {
                            downloadLink.href = '/documents/' + result.id + '/download';
                            downloadLink.style.display = 'inline-block';
                        }
                    }
                    
                    // Show analysis if available
                    if (result.analysis || result.metadata) {
                        // Display analysis results
                        const analysisContainer = document.getElementById('analysis-container');
                        if (analysisContainer) {
                            analysisContainer.style.display = 'block';
                            
                            // Set analysis category
                            const analysisCategory = document.getElementById('analysis-category');
                            if (analysisCategory) {
                                analysisCategory.textContent = category.toUpperCase();
                            }
                            
                            // Set analysis content
                            const analysisContent = document.getElementById('analysis-content');
                            if (analysisContent) {
                                analysisContent.innerHTML = `<p>Olay özeti: ${description}</p>`;
                            }
                            
                            // Call the display function
                            if (typeof window.displayAnalysisResults === 'function') {
                                window.displayAnalysisResults(result.analysis || {});
                            }
                        }
                    }
                    
                    // Show success message
                    window._showMessage('success', 'Belgeniz başarıyla oluşturuldu.');
                })
                .catch(error => {
                    console.error('Error:', error);
                    
                    // Hide loading indicator
                    const loadingIndicator = document.getElementById('loadingIndicator');
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                    
                    // Show error message
                    window._showMessage('error', error.message || 'Belge oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
                });
            } catch (globalError) {
                console.error('Global error in handleAIFormSubmit:', globalError);
                window._showMessage('error', 'İşlem sırasında beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyip tekrar deneyin.');
                
                // Make sure loading indicator is hidden in case of error
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            }
        } catch (outerError) {
            console.error('Outer error in handleAIFormSubmit:', outerError);
            alert('Critical error: ' + outerError.message);
        }
    };

    // Directly expose the showMessage function globally as well
    window._showMessage = function(type, message) {
        try {
            console.log(`Showing ${type} message: ${message}`);
            
            // Create a dismissable alert if it doesn't exist
            let alertContainer = document.getElementById('alertContainer');
            
            if (!alertContainer) {
                alertContainer = document.createElement('div');
                alertContainer.id = 'alertContainer';
                alertContainer.style.position = 'fixed';
                alertContainer.style.top = '80px';
                alertContainer.style.right = '20px';
                alertContainer.style.zIndex = '9999';
                alertContainer.style.minWidth = '300px';
                alertContainer.style.maxWidth = '500px';
                document.body.appendChild(alertContainer);
            }
            
            // Create the alert element
            const alertElement = document.createElement('div');
            alertElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade`;
            alertElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            alertElement.style.marginBottom = '10px';
            
            // Create and append strong element
            const strongElement = document.createElement('strong');
            strongElement.textContent = type === 'error' ? 'Hata' : 'Başarılı';
            alertElement.appendChild(strongElement);
            
            // Append text node
            alertElement.appendChild(document.createTextNode(': ' + message));
            
            // Create and append close button
            const closeButton = document.createElement('button');
            closeButton.type = 'button';
            closeButton.className = 'btn-close';
            closeButton.setAttribute('aria-label', 'Close');
            alertElement.appendChild(closeButton);
            
            // Add event listener for close button
            closeButton.addEventListener('click', function() {
                alertElement.classList.remove('show');
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.remove();
                    }
                }, 150);
            });
            
            // Add the alert to the container
            alertContainer.appendChild(alertElement);
            
            // Make sure it appears with animation
            setTimeout(() => {
                alertElement.classList.add('show');
            }, 10);
            
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                if (alertElement && alertElement.parentNode) { // Check if element is still in the DOM
                    alertElement.classList.remove('show');
                    setTimeout(() => {
                        if (alertElement && alertElement.parentNode) { // Check again before removing
                            alertElement.remove();
                        }
                    }, 150);
                }
            }, 5000);
        } catch (error) {
            console.error('Error showing message:', error);
            alert((type === 'error' ? 'Error: ' : 'Success: ') + message);
        }
    };
    
    // Immediately make functions available globally without waiting for DOMContentLoaded
    window.handleAIFormSubmit = window._handleAIFormSubmit;
    window.showMessage = window._showMessage;
    
    // A simplified displayAnalysisResults function in case the main one isn't loaded
    window.displayAnalysisResults = function(analysis) {
        console.log('Displaying analysis results:', analysis);
        
        // Get the container element
        const resultsContainer = document.getElementById('analysis-results');
        if (!resultsContainer) {
            console.warn('Analysis results container not found');
            return;
        }
        
        // Clear previous content
        resultsContainer.innerHTML = '';
        
        // Check if we have data to display
        if (!analysis || 
            ((!analysis.relevant_laws || analysis.relevant_laws.length === 0) && 
             (!analysis.relevant_decisions || analysis.relevant_decisions.length === 0) &&
             !analysis.recommendations)) {
            console.warn('No analysis data to display');
            resultsContainer.innerHTML = '<p class="text-muted">Detaylı analiz sonuçları bulunamadı, ancak belgeniz oluşturuldu.</p>';
            
            // Make sure that even if we don't have analysis data, we still show the result
            const resultDiv = document.getElementById('result');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }
            
            // Make sure the download button is visible
            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink) {
                downloadLink.style.display = 'inline-block';
            }
            
            return;
        }
        
        // Display relevant laws if available
        const relevantLaws = document.getElementById('relevantLaws');
        if (relevantLaws) {
            relevantLaws.innerHTML = '';
            relevantLaws.style.backgroundColor = 'white';
            relevantLaws.style.color = '#333';
            
            if (!analysis || !analysis.relevant_laws || analysis.relevant_laws.length === 0) {
                relevantLaws.innerHTML = '<li class="list-group-item" style="background-color: white; color: #666;">Olay örgüsü için ilgili kanun maddesi bulunamadı.</li>';
            } else {
                console.log('Displaying relevant laws:', analysis.relevant_laws);
                analysis.relevant_laws.forEach(law => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item law-item';
                    
                    // Get title and content from law object
                    const title = law.title || 'Kanun';
                    const content = law.description || law.content || 'İçerik bulunamadı';
                    
                    // Create a more attractive layout for law items
                    li.innerHTML = `
                        <div class="law-item-content">
                            <h4 class="law-title"><i class="fas fa-book me-2"></i>${title}</h4>
                            <div class="law-description">${content}</div>
                            ${law.url ? `<a href="${law.url}" target="_blank" class="law-link mt-2 d-inline-block"><i class="fas fa-external-link-alt me-1"></i> Kanun Metnine Git</a>` : ''}
                        </div>
                    `;
                    relevantLaws.appendChild(li);
                });
            }
        } else {
            console.error('Relevant laws container not found');
        }
        
        // Display relevant decisions if available
        const relevantDecisions = document.getElementById('relevantDecisions');
        if (relevantDecisions) {
            relevantDecisions.innerHTML = '';
            relevantDecisions.style.backgroundColor = 'white';
            relevantDecisions.style.color = '#333';
            
            if (!analysis || !analysis.relevant_decisions || analysis.relevant_decisions.length === 0) {
                relevantDecisions.innerHTML = '<li class="list-group-item" style="background-color: white; color: #666;">Olay örgüsü için ilgili Yargıtay kararı bulunamadı.</li>';
            } else {
                console.log('Displaying relevant decisions:', analysis.relevant_decisions);
                analysis.relevant_decisions.forEach(decision => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item decision-item';
                    
                    // Get details from decision object
                    let caseNumber = decision.case_number || decision.number || 'Belirsiz';
                    let date = decision.date || '';
                    let content = decision.summary || decision.content || 'İçerik bulunamadı';
                    let court = decision.court || 'Yargıtay';
                    
                    // Create a more attractive layout for decision items
                    li.innerHTML = `
                        <div class="decision-item-content">
                            <h4 class="decision-title"><i class="fas fa-gavel me-2"></i>${court}</h4>
                            <div class="decision-meta">
                                <span class="case-number badge bg-light text-dark me-2">${caseNumber}</span>
                                ${date ? `<span class="decision-date badge bg-light text-dark"><i class="far fa-calendar-alt me-1"></i>${date}</span>` : ''}
                            </div>
                            <div class="decision-summary mt-2">${content}</div>
                        </div>
                    `;
                    relevantDecisions.appendChild(li);
                });
            }
        } else {
            console.error('Relevant decisions container not found');
        }
        
        // Display recommendations if available
        const legalAnalysis = document.getElementById('legalAnalysis');
        if (legalAnalysis) {
            legalAnalysis.style.backgroundColor = 'white';
            legalAnalysis.style.color = '#333';
            
            if (!analysis || !analysis.recommendations) {
                legalAnalysis.innerHTML = '<div class="alert alert-warning" style="background-color: #fff9e6!important; color: #663c00!important; border-color: #ffcc66!important;">Analiz önerileri bulunamadı.</div>';
            } else {
                console.log('Displaying recommendations:', analysis.recommendations);
                // Use innerHTML for recommendations as they are already in HTML format or convert to HTML
                if (typeof analysis.recommendations === 'string') {
                    // If it's a string, check if it appears to have HTML formatting
                    if (analysis.recommendations.includes('<p>') || analysis.recommendations.includes('<li>')) {
                        legalAnalysis.innerHTML = analysis.recommendations;
                    } else {
                        // If it's plain text, format it nicely
                        const formattedRecommendations = analysis.recommendations
                            .split('\n')
                            .filter(line => line.trim() !== '')
                            .map(line => {
                                // Check if line starts with a number (like "1. Something")
                                if (/^\d+\./.test(line.trim())) {
                                    return `<div class="recommendation-item"><i class="fas fa-check-circle text-success me-2"></i>${line.trim()}</div>`;
                                } else {
                                    return `<p>${line.trim()}</p>`;
                                }
                            })
                            .join('');
                        
                        legalAnalysis.innerHTML = formattedRecommendations;
                    }
                } else if (Array.isArray(analysis.recommendations)) {
                    let html = '<div class="recommendations-list">';
                    analysis.recommendations.forEach(rec => {
                        html += `<div class="recommendation-item"><i class="fas fa-check-circle text-success me-2"></i>${rec}</div>`;
                    });
                    html += '</div>';
                    legalAnalysis.innerHTML = html;
                } else {
                    legalAnalysis.innerHTML = JSON.stringify(analysis.recommendations);
                }
            }
        } else {
            console.error('Legal analysis container not found');
        }
    };
    
    // Set the initialization flag
    window.formHandlerInitialized = true;
    console.log('Form handler functions registered globally');
})();

// Initialize form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up form event handlers');
    setupFormEventHandlers();
});

// Function to set up form event handlers
function setupFormEventHandlers() {
    console.log('Setting up form event handlers');
    
    // Direct button click handler - try multiple ways to find the button
    const submitButton = document.getElementById('aiSubmitButton');
    
    if (submitButton) {
        console.log('Found submit button by ID:', submitButton);
        
        // Remove any existing handlers to avoid duplicates
        const newButton = submitButton.cloneNode(true);
        if (submitButton.parentNode) {
            submitButton.parentNode.replaceChild(newButton, submitButton);
        }
        
        // Attach the new handler directly with a click listener
        newButton.addEventListener('click', function(event) {
            console.log('CLICK DETECTED: Submit button clicked directly');
            
            try {
                // Validate form
                const aiForm = document.getElementById('aiForm');
                if (aiForm) {
                    // Add was-validated class to show validation feedback
                    aiForm.classList.add('was-validated');
                    
                    // Check if form is valid
                    if (aiForm.checkValidity()) {
                        console.log('Form is valid, calling handleAIFormSubmit');
                        // If valid, call the handler directly
                        window._handleAIFormSubmit(event);
                    } else {
                        console.log('Form validation failed');
                        // If not valid, show a message
                        window._showMessage('error', 'Lütfen gerekli tüm alanları doldurun.');
                    }
                } else {
                    console.error('AI Form not found');
                }
            } catch (e) {
                console.error('Error in click handler:', e);
            }
        });
        
        // Also attach using onclick attribute as a backup
        newButton.onclick = function(event) {
            console.log('CLICK DETECTED: Submit button onclick attribute triggered');
            try {
                // Validate form
                const aiForm = document.getElementById('aiForm');
                if (aiForm) {
                    // Add was-validated class to show validation feedback
                    aiForm.classList.add('was-validated');
                    
                    // Check if form is valid
                    if (aiForm.checkValidity()) {
                        console.log('Form is valid (onclick), calling handleAIFormSubmit');
                        // If valid, call the handler
                        window._handleAIFormSubmit(event);
                    } else {
                        console.log('Form validation failed (onclick)');
                        // If not valid, show a message
                        window._showMessage('error', 'Lütfen gerekli tüm alanları doldurun.');
                    }
                } else {
                    console.error('AI Form not found (onclick)');
                }
            } catch (e) {
                console.error('Error in onclick handler:', e);
            }
            return false; // Prevent default behavior
        };
        
        console.log('Successfully attached both event handlers to the submit button');
    } else {
        console.error('Submit button not found by ID. Trying to find by class/type...');
        
        // Try finding the button by other means
        const submitButtons = document.querySelectorAll('button[type="button"].btn-primary');
        let foundButton = false;
        
        submitButtons.forEach(button => {
            if (button.textContent.includes('Belge Oluştur') || button.innerHTML.includes('Belge Oluştur')) {
                console.log('Found submit button by text content');
                foundButton = true;
                
                // Attach click event
                button.addEventListener('click', function(event) {
                    console.log('CLICK DETECTED: Submit button found by text');
                    
                    try {
                        // Validate form
                        const aiForm = document.getElementById('aiForm');
                        if (aiForm) {
                            // Add was-validated class to show validation feedback
                            aiForm.classList.add('was-validated');
                            
                            // Check if form is valid
                            if (aiForm.checkValidity()) {
                                console.log('Form is valid, calling handleAIFormSubmit');
                                // If valid, call the handler
                                window._handleAIFormSubmit(event);
                            } else {
                                console.log('Form validation failed');
                                // If not valid, show a message
                                window._showMessage('error', 'Lütfen gerekli tüm alanları doldurun.');
                            }
                        } else {
                            console.error('AI Form not found');
                        }
                    } catch (e) {
                        console.error('Error in click handler:', e);
                    }
                });
            }
        });
        
        if (!foundButton) {
            console.error('Could not find the submit button by any means');
        }
    }
    
    // Also attach to form submit event as a backup
    const aiForm = document.getElementById('aiForm');
    if (aiForm) {
        console.log('Found AI form, attaching submit handler');
        
        aiForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('FORM SUBMIT DETECTED: Form submit event triggered');
            
            try {
                // Add was-validated class to show validation feedback
                aiForm.classList.add('was-validated');
                
                // Check if form is valid
                if (aiForm.checkValidity()) {
                    console.log('Form is valid (submit), calling handleAIFormSubmit');
                    // If valid, call the handler
                    window._handleAIFormSubmit(event);
                } else {
                    console.log('Form validation failed (submit)');
                    // If not valid, show a message
                    window._showMessage('error', 'Lütfen gerekli tüm alanları doldurun.');
                }
            } catch (e) {
                console.error('Error in submit handler:', e);
            }
            
            return false; // Prevent default form submission
        });
        
        // Also try attaching directly to the form's onsubmit attribute
        aiForm.onsubmit = function(event) {
            event.preventDefault();
            console.log('FORM SUBMIT DETECTED: Form onsubmit attribute triggered');
            
            try {
                // Add was-validated class to show validation feedback
                aiForm.classList.add('was-validated');
                
                // Check if form is valid
                if (aiForm.checkValidity()) {
                    console.log('Form is valid (onsubmit), calling handleAIFormSubmit');
                    // If valid, call the handler
                    window._handleAIFormSubmit(event);
                } else {
                    console.log('Form validation failed (onsubmit)');
                    // If not valid, show a message
                    window._showMessage('error', 'Lütfen gerekli tüm alanları doldurun.');
                }
            } catch (e) {
                console.error('Error in onsubmit handler:', e);
            }
            
            return false; // Prevent default form submission
        };
    } else {
        console.error('AI Form not found for attaching submit event');
    }
    
    console.log('Form event handlers setup complete');
}

// Simplified form handling with no global state dependencies
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up event handlers');
    
    // Find the submit button
    const simpleApiButton = document.getElementById('simpleApiButton');
    if (simpleApiButton) {
        console.log('Found simple API button, attaching handler');
        
        // Attach click handler
        simpleApiButton.addEventListener('click', handleSimpleApiSubmit);
    } else {
        console.error('Simple API button not found');
    }
    
    // Set up template selector to show appropriate fields
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            // Hide all template fields first
            const templateFields = document.querySelectorAll('.templateFields');
            templateFields.forEach(field => {
                field.style.display = 'none';
            });
            
            // Show the selected template's fields
            const selectedTemplate = templateSelect.value;
            if (selectedTemplate) {
                const selectedFields = document.getElementById(selectedTemplate + 'Fields');
                if (selectedFields) {
                    selectedFields.style.display = 'block';
                }
            }
        });
    }
});

/**
 * Handle API form submission
 */
function handleSimpleApiSubmit(event) {
    event.preventDefault();
    console.log('Simple API submit handler triggered');
    
    try {
        // Show an initial alert for debugging
        alert('Simple API button clicked - starting form submission');
        
        // Validate form inputs
        const templateSelect = document.getElementById('templateSelect');
        const categorySelect = document.getElementById('categorySelect');
        const caseDescription = document.getElementById('caseDescription');
        
        console.log('Form elements found:', {
            templateSelect: !!templateSelect,
            categorySelect: !!categorySelect,
            caseDescription: !!caseDescription
        });
        
        if (!templateSelect || !categorySelect || !caseDescription) {
            showMessage('error', 'Form fields not found');
            return;
        }
        
        const templateName = templateSelect.value;
        const category = categorySelect.value;
        const description = caseDescription.value;
        
        console.log('Form values:', {templateName, category, description: description.substring(0, 50) + '...'});
        
        if (!templateName) {
            showMessage('error', 'Lütfen bir belge tipi seçin');
            return;
        }
        
        if (!category) {
            showMessage('error', 'Lütfen bir hukuk alanı seçin');
            return;
        }
        
        if (!description) {
            showMessage('error', 'Lütfen olay örgüsünü açıklayın');
            return;
        }
        
        // Form is valid, proceed with submission
        alert('Form validation passed - preparing API request');
        
        // Show the loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        // Collect template specific data
        const templateData = {};
        const templateFieldsContainer = document.getElementById(templateName + 'Fields');
        if (templateFieldsContainer) {
            const inputs = templateFieldsContainer.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                let fieldName = input.id;
                if (fieldName.endsWith('_' + templateName)) {
                    fieldName = fieldName.replace('_' + templateName, '');
                }
                templateData[fieldName] = input.value;
            });
        }
        
        // Prepare the API request data
        const requestData = {
            template_name: templateName,
            case_description: description,
            case_category: category,
            template_data: templateData,
            metadata: {
                source: 'simplified_api',
                created_at: new Date().toISOString()
            }
        };
        
        console.log('Sending API request with data:', JSON.stringify(requestData, null, 2));
        
        // Make the API call
        fetch('/api/documents/ai-generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('Received API response with status:', response.status);
            
            if (!response.ok) {
                throw new Error('API request failed with status ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log('API Response parsed:', result);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Alert with success and a summary of the result
            alert('API call successful! Document ID: ' + (result.document_id || 'Not provided'));
            
            // Display the results
            displayAnalysisResults(result, category, description);
            
            // Show success message
            showMessage('success', 'Hukuki analiz başarıyla tamamlandı');
        })
        .catch(error => {
            console.error('API Error:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show error message with alert for debugging
            alert('API Error: ' + error.message);
            showMessage('error', 'Analiz yapılırken bir hata oluştu: ' + error.message);
        });
    } catch (error) {
        console.error('Unexpected error in handleSimpleApiSubmit:', error);
        alert('Kritik hata: ' + error.message);
    }
}

/**
 * Display the analysis results in the UI - Fixed version that ensures visibility
 */
function displayAnalysisResults(result, category, description) {
    // Hide loading overlay
    document.getElementById('loading-overlay').style.display = 'none';

    // Get the analysis container
    const analysisContainer = document.getElementById('analysis-container');
    
    // Set the category badge
    document.getElementById('category-badge').innerHTML = `<i class="fas fa-tag me-2"></i>${category}`;
    
    // Clear previous results
    document.getElementById('analysis-content').innerHTML = '';
    document.getElementById('relevantLaws').innerHTML = '';
    document.getElementById('relevantDecisions').innerHTML = '';
    document.getElementById('recommendationsList').innerHTML = '';
    
    // Analysis summary
    const analysisSummary = result.summary || description;
    document.getElementById('analysis-summary').innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> ${analysisSummary}
        </div>`;
    
    // Analysis content
    if (result.analysis && result.analysis.length > 0) {
        document.getElementById('analysis-content').innerHTML = result.analysis;
    }

    // Relevant laws
    if (result.relevant_laws && result.relevant_laws.length > 0) {
        const lawsList = document.getElementById('relevantLaws');
        
        result.relevant_laws.forEach(law => {
            const lawItem = document.createElement('div');
            lawItem.className = 'law-item';
            
            const lawTitle = document.createElement('div');
            lawTitle.className = 'law-title';
            lawTitle.innerHTML = `<i class="fas fa-gavel"></i> ${law.title || 'İlgili Kanun'}`;
            
            const lawDescription = document.createElement('div');
            lawDescription.className = 'law-description';
            lawDescription.textContent = law.description || law.text || law;
            
            lawItem.appendChild(lawTitle);
            lawItem.appendChild(lawDescription);
            
            // Add law link if available
            if (law.link) {
                const lawLink = document.createElement('a');
                lawLink.className = 'law-link mt-2 d-inline-block';
                lawLink.href = law.link;
                lawLink.target = '_blank';
                lawLink.innerHTML = `<i class="fas fa-external-link-alt"></i> Kanunu Görüntüle`;
                lawItem.appendChild(lawLink);
            }
            
            lawsList.appendChild(lawItem);
        });
    } else {
        document.getElementById('relevantLaws').innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> İlgili kanun maddesi bulunamadı.</div>';
    }

    // Relevant decisions
    if (result.relevant_decisions && result.relevant_decisions.length > 0) {
        const decisionsList = document.getElementById('relevantDecisions');
        
        result.relevant_decisions.forEach(decision => {
            const decisionItem = document.createElement('div');
            decisionItem.className = 'decision-item';
            
            const decisionTitle = document.createElement('div');
            decisionTitle.className = 'decision-title';
            decisionTitle.innerHTML = `<i class="fas fa-balance-scale"></i> ${decision.title || 'İlgili Karar'}`;
            
            const decisionMeta = document.createElement('div');
            decisionMeta.className = 'decision-meta';
            
            // Add case number if available
            if (decision.case_number) {
                const caseNumber = document.createElement('div');
                caseNumber.className = 'case-number';
                caseNumber.innerHTML = `<i class="fas fa-hashtag"></i> ${decision.case_number}`;
                decisionMeta.appendChild(caseNumber);
            }
            
            // Add decision date if available
            if (decision.date) {
                const decisionDate = document.createElement('div');
                decisionDate.className = 'decision-date';
                decisionDate.innerHTML = `<i class="fas fa-calendar-alt"></i> ${decision.date}`;
                decisionMeta.appendChild(decisionDate);
            }
            
            // Add court name if available
            if (decision.court) {
                const courtName = document.createElement('div');
                courtName.className = 'court-name';
                courtName.innerHTML = `<i class="fas fa-university"></i> ${decision.court}`;
                decisionMeta.appendChild(courtName);
            }
            
            const decisionSummary = document.createElement('div');
            decisionSummary.className = 'decision-summary';
            decisionSummary.textContent = decision.summary || decision.text || decision;
            
            decisionItem.appendChild(decisionTitle);
            decisionItem.appendChild(decisionMeta);
            decisionItem.appendChild(decisionSummary);
            
            // Add decision link if available
            if (decision.link) {
                const decisionLink = document.createElement('a');
                decisionLink.className = 'decision-link mt-2 d-inline-block';
                decisionLink.href = decision.link;
                decisionLink.target = '_blank';
                decisionLink.innerHTML = `<i class="fas fa-external-link-alt"></i> Kararı Görüntüle`;
                decisionItem.appendChild(decisionLink);
            }
            
            decisionsList.appendChild(decisionItem);
        });
    } else {
        document.getElementById('relevantDecisions').innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> İlgili karar bulunamadı.</div>';
    }

    // Recommendations
    if (result.recommendations && (result.recommendations.length > 0 || typeof result.recommendations === 'string')) {
        const recommendationsList = document.getElementById('recommendationsList');
        
        if (typeof result.recommendations === 'string') {
            const recommendationItem = document.createElement('div');
            recommendationItem.className = 'recommendation-item';
            recommendationItem.innerHTML = `<i class="fas fa-lightbulb"></i> ${result.recommendations}`;
            recommendationsList.appendChild(recommendationItem);
        } else {
            result.recommendations.forEach(recommendation => {
                const recommendationItem = document.createElement('div');
                recommendationItem.className = 'recommendation-item';
                
                // Handle if recommendation is an object or a string
                if (typeof recommendation === 'object') {
                    recommendationItem.innerHTML = `<i class="fas fa-lightbulb"></i> ${recommendation.text || JSON.stringify(recommendation)}`;
                } else {
                    recommendationItem.innerHTML = `<i class="fas fa-lightbulb"></i> ${recommendation}`;
                }
                
                recommendationsList.appendChild(recommendationItem);
            });
        }
    } else {
        document.getElementById('recommendationsList').innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i> Öneri bulunamadı.</div>';
    }

    // Show download section if document_text exists
    if (result.document_text) {
        document.getElementById('downloadSection').style.display = 'block';
        
        // Set up download button
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result.document_text));
        downloadLink.setAttribute('download', `Hukuki_Belge_${new Date().toISOString().slice(0,10)}.txt`);
    } else {
        document.getElementById('downloadSection').style.display = 'none';
    }

    // Show the analysis container
    analysisContainer.style.display = 'block';
    
    // Select the first tab
    const tabEl = document.querySelector('button[data-bs-target="#analysis-tab-pane"]');
    if (tabEl) {
        const tab = new bootstrap.Tab(tabEl);
        tab.show();
    }
    
    // Scroll to analysis container
    analysisContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Show a message to the user
 */
function showMessage(type, message) {
    console.log(`Showing ${type} message: ${message}`);
    
    try {
        // Create a container for the alert if it doesn't exist
        let alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alertContainer';
            alertContainer.style.position = 'fixed';
            alertContainer.style.top = '80px';
            alertContainer.style.right = '20px';
            alertContainer.style.zIndex = '9999';
            alertContainer.style.minWidth = '300px';
            alertContainer.style.maxWidth = '500px';
            document.body.appendChild(alertContainer);
        }
        
        // Create the alert element
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`;
        alertElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        alertElement.style.marginBottom = '10px';
        
        // Add the title
        const strongElement = document.createElement('strong');
        strongElement.textContent = type === 'error' ? 'Hata' : 'Başarılı';
        alertElement.appendChild(strongElement);
        
        // Add the message
        alertElement.appendChild(document.createTextNode(': ' + message));
        
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        alertElement.appendChild(closeButton);
        
        // Add to container
        alertContainer.appendChild(alertElement);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 150);
        }, 5000);
    } catch (error) {
        console.error('Error showing message:', error);
        alert((type === 'error' ? 'Error: ' : 'Success: ') + message);
    }
}

// Direct click handlers that don't depend on any other code
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up direct click handlers');
    
    // Basic click handler for the simple button
    document.getElementById('simpleApiButton')?.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Simple API button clicked via direct handler');
        directApiSubmit();
    });
    
    // Add a direct click handler for the test button
    document.getElementById('testButton')?.addEventListener('click', function() {
        console.log('Test button clicked via direct event listener');
        alert('Test button works via direct event listener!');
    });
    
    // Add a direct click handler for the main button
    document.getElementById('aiSubmitButton')?.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('AI Submit button clicked via direct handler');
        directApiSubmit();
    });
    
    console.log('Direct click handlers setup complete');
});

// New simplified submit function that doesn't depend on any other code
function directApiSubmit() {
    console.log('directApiSubmit function called');
    
    try {
        // Show an alert to confirm the function is running
        alert('Starting form submission');
        
        // Get the form fields directly
        const templateName = document.getElementById('templateSelect')?.value;
        const category = document.getElementById('categorySelect')?.value;
        const description = document.getElementById('caseDescription')?.value;
        
        // Validate form inputs
        if (!templateName) {
            alert('Lütfen bir belge tipi seçin');
            return;
        }
        
        if (!category) {
            alert('Lütfen bir hukuk alanı seçin');
            return;
        }
        
        if (!description) {
            alert('Lütfen olay örgüsünü açıklayın');
            return;
        }
        
        // Show loading message
        alert('Form doğrulandı, API isteği gönderiliyor...');
        
        // Show the loading indicator if it exists
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        // Collect template specific data
        const templateData = {};
        const templateFieldsContainer = document.getElementById(templateName + 'Fields');
        if (templateFieldsContainer) {
            const inputs = templateFieldsContainer.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                let fieldName = input.id;
                if (fieldName.endsWith('_' + templateName)) {
                    fieldName = fieldName.replace('_' + templateName, '');
                }
                templateData[fieldName] = input.value;
            });
        }
        
        // Prepare the request data
        const requestData = {
            template_name: templateName,
            case_description: description,
            case_category: category,
            template_data: templateData,
            metadata: {
                source: 'direct_submit',
                created_at: new Date().toISOString()
            }
        };
        
        console.log('Sending API request with data:', requestData);
        
        // Make the API call
        fetch('/api/documents/ai-generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('Received API response with status:', response.status);
            
            if (!response.ok) {
                throw new Error('API request failed with status ' + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log('API Response parsed:', result);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show success alert
            alert('Belge başarıyla oluşturuldu! Sonuçlar görüntüleniyor.');
            
            // Show the result container
            const resultContainer = document.getElementById('result');
            if (resultContainer) {
                resultContainer.style.display = 'block';
                
                // Scroll to the results section
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Set up the download link
            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink && result.document_id) {
                console.log('Setting up download link with document ID:', result.document_id);
                downloadLink.href = '/documents/' + result.document_id + '/download';
                downloadLink.style.display = 'inline-block';
            }
            
            // Display analysis results
            displaySimpleAnalysisResults(result, category, description);
        })
        .catch(error => {
            console.error('API Error:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Show error message with alert for debugging
            alert('API Error: ' + error.message);
            showMessage('error', 'Analiz yapılırken bir hata oluştu: ' + error.message);
        });
    } catch (error) {
        console.error('Error in directApiSubmit:', error);
        alert('Beklenmeyen bir hata oluştu: ' + error.message);
    }
}

// Simple function to display analysis results
function displaySimpleAnalysisResults(result, category, description) {
    console.log('Displaying simple analysis results');
    
    try {
        // Show the result container
        const resultContainer = document.getElementById('result');
        if (resultContainer) {
            resultContainer.style.display = 'block';
            
            // Scroll to the results section
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        }

        // Set up the download link
        const downloadLink = document.getElementById('downloadLink');
        if (downloadLink) {
            console.log('Setting up download link with document ID:', result.document_id);
            if (result.document_id) {
                downloadLink.href = '/documents/' + result.document_id + '/download';
                downloadLink.style.display = 'inline-block';
            } else {
                console.error('No document_id found in the API response', result);
            }
        }
        
        // Set the category badge
        const categoryBadge = document.getElementById('analysis-category');
        if (categoryBadge) {
            categoryBadge.textContent = category.toUpperCase();
        }
        
        // Set the description
        const analysisContent = document.getElementById('analysis-content');
        if (analysisContent) {
            analysisContent.innerHTML = `<p><strong>Olay Özeti:</strong> ${description}</p>`;
        }
        
        // Display laws if available
        if (result.analysis && result.analysis.relevant_laws) {
            const lawsList = document.getElementById('relevantLaws');
            if (lawsList) {
                lawsList.innerHTML = '';
                result.analysis.relevant_laws.forEach(law => {
                    const li = document.createElement('li');
                    li.className = 'law-item';
                    li.innerHTML = `<strong>${law.title}</strong>: ${law.content}`;
                    lawsList.appendChild(li);
                });
            }
        }
        
        // Display court decisions if available
        if (result.analysis && result.analysis.relevant_decisions) {
            const decisionsList = document.getElementById('relevantDecisions');
            if (decisionsList) {
                decisionsList.innerHTML = '';
                result.analysis.relevant_decisions.forEach(decision => {
                    const li = document.createElement('li');
                    li.className = 'decision-item';
                    li.innerHTML = `<strong>${decision.court} - ${decision.number}</strong>: ${decision.content}`;
                    decisionsList.appendChild(li);
                });
            }
        }
        
        // Display recommendations if available
        if (result.analysis && result.analysis.recommendations) {
            const legalAnalysis = document.getElementById('legalAnalysis');
            if (legalAnalysis) {
                legalAnalysis.innerHTML = result.analysis.recommendations;
            }
        }
    } catch (error) {
        console.error('Error displaying analysis results:', error);
        alert('Analiz sonuçları görüntülenirken hata oluştu: ' + error.message);
    }
}

// Function to display analysis results
window.displayAnalysisResults = displayAnalysisResults;

// Add this button click event
document.addEventListener('DOMContentLoaded', function() {
    // Fix the buttons
    const aiSubmitButton = document.getElementById('aiSubmitButton');
    if (aiSubmitButton) {
        aiSubmitButton.onclick = function(event) {
            console.log("AI Submit button clicked");
            window._handleAIFormSubmit(event);
        };
    }
    
    const simpleApiButton = document.getElementById('simpleApiButton');
    if (simpleApiButton) {
        simpleApiButton.onclick = function(event) {
            console.log("Simple API button clicked");
            window._handleAIFormSubmit(event);
        };
    }
    
    console.log('Form handler finished setup');
});

// Helper function to add sections to the analysis results
function addSection(container, title, content) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'mb-4';
    
    const sectionTitle = document.createElement('h4');
    sectionTitle.className = 'text-lg font-medium mb-2';
    sectionTitle.textContent = title;
    sectionDiv.appendChild(sectionTitle);
    
    if (content) {
        const sectionContent = document.createElement('div');
        sectionContent.className = 'text-gray-700';
        sectionContent.innerHTML = content;
        sectionDiv.appendChild(sectionContent);
    }
    
    container.appendChild(sectionDiv);
    return sectionDiv;
}

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const documentForm = document.getElementById('documentForm');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loadingText = document.getElementById('loadingText');
    const caseSummary = document.getElementById('caseSummary');
    const charCount = document.getElementById('charCount');
    const analysisContainer = document.getElementById('analysis-container');
    const downloadLink = document.getElementById('downloadLink');
    const resultSection = document.getElementById('result');
    
    // Initialize character counter for textarea
    if (caseSummary && charCount) {
        caseSummary.addEventListener('input', function() {
            const currentLength = this.value.length;
            charCount.textContent = currentLength;
            
            // Visual feedback based on length
            if (currentLength > 1500) {
                charCount.classList.add('text-warning');
                charCount.classList.remove('text-danger', 'text-success');
            } else if (currentLength > 1900) {
                charCount.classList.add('text-danger');
                charCount.classList.remove('text-warning', 'text-success');
            } else if (currentLength > 50) {
                charCount.classList.add('text-success');
                charCount.classList.remove('text-warning', 'text-danger');
            } else {
                charCount.classList.remove('text-success', 'text-warning', 'text-danger');
            }
        });
    }
    
    // Form submission handling
    if (documentForm) {
        documentForm.addEventListener('submit', function(event) {
            event.preventDefault();
            event.stopPropagation();
            
            // Validate the form
            if (this.checkValidity()) {
                handleFormSubmission();
            }
            
            // Add validation classes
            this.classList.add('was-validated');
        });
    }
    
    // Handle form submission and mock API request
    function handleFormSubmission() {
        // Show loading state
        submitText.style.display = 'none';
        loadingText.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        // Add animation to button
        submitBtn.classList.add('processing');
        
        // Simulate API call with timeout (for demo purposes)
        setTimeout(function() {
            submitText.style.display = 'inline-block';
            loadingText.style.display = 'none';
            submitBtn.disabled = false;
            submitBtn.classList.remove('processing');
            
            // Show analysis results
            showAnalysisResults();
        }, 2500);
    }
    
    // Show analysis results section
    function showAnalysisResults() {
        // Get form values for mock display
        const clientName = document.getElementById('clientName').value;
        const documentType = document.getElementById('documentType').value;
        const caseDescription = document.getElementById('caseSummary').value;
        
        // Determine case category based on document type (just for demo)
        let category;
        switch(documentType) {
            case 'dava_dilekce':
                category = 'Hukuk Davası';
                break;
            case 'ihtarname':
                category = 'Sözleşme Hukuku';
                break;
            case 'sulh_teklifi':
                category = 'Alternatif Uyuşmazlık Çözümü';
                break;
            case 'temyiz_dilekce':
                category = 'Temyiz Süreci';
                break;
            case 'bilirkisi_itiraz':
                category = 'Bilirkişi İtirazı';
                break;
            default:
                category = 'Genel Hukuk';
        }
        
        // Set mock analysis data
        document.getElementById('category-badge').innerHTML = `<i class="fas fa-tag me-2"></i>${category}`;
        document.getElementById('analysis-content').innerHTML = 
            `<p>${clientName} tarafından sunulan ve ${caseDescription.substring(0, 100)}... ile ilgili olay analiz edilmiştir.</p>`;
        
        // Populate tabs with mock data
        populateAnalysisTabs();
        
        // Show the analysis container with animation
        analysisContainer.style.display = 'block';
        
        // Add slide-down animation class
        analysisContainer.classList.add('animate__animated', 'animate__fadeInUp');
        
        // Scroll to analysis container
        setTimeout(() => {
            analysisContainer.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 300);
        
        // Show download section
        setTimeout(() => {
            document.getElementById('downloadSection').style.display = 'block';
            const downloadLink = document.getElementById('downloadLink');
            if (downloadLink) {
                downloadLink.style.display = 'inline-flex';
                
                // Set the download link (mock)
                downloadLink.href = '#'; // In a real app, this would point to the generated document
                downloadLink.setAttribute('download', 'hukuki_belge.docx');
            }
        }, 1500);
    }
    
    // Populate analysis tabs with mock data
    function populateAnalysisTabs() {
        // Laws tab content
        document.getElementById('relevantLaws').innerHTML = `
            <div class="law-item">
                <div class="law-title"><i class="fas fa-gavel"></i> Türk Borçlar Kanunu Madde 112</div>
                <div class="law-description">Borçlu, borcunu hiç veya gereği gibi ifa etmezse, alacaklının bundan doğan zararını gidermekle yükümlüdür.</div>
                <a href="#" class="law-link mt-2 d-inline-block">
                    <i class="fas fa-external-link-alt"></i> Kanunu Görüntüle
                </a>
            </div>
            <div class="law-item">
                <div class="law-title"><i class="fas fa-gavel"></i> Türk Medeni Kanunu Madde 2</div>
                <div class="law-description">Herkes, haklarını kullanırken ve borçlarını yerine getirirken dürüstlük kurallarına uymak zorundadır. Bir hakkın açıkça kötüye kullanılmasını hukuk düzeni korumaz.</div>
                <a href="#" class="law-link mt-2 d-inline-block">
                    <i class="fas fa-external-link-alt"></i> Kanunu Görüntüle
                </a>
            </div>
            <div class="law-item">
                <div class="law-title"><i class="fas fa-gavel"></i> Hukuk Muhakemeleri Kanunu Madde 119</div>
                <div class="law-description">Dava dilekçesinde bulunması gereken hususlar detaylı olarak açıklanmıştır.</div>
                <a href="#" class="law-link mt-2 d-inline-block">
                    <i class="fas fa-external-link-alt"></i> Kanunu Görüntüle
                </a>
            </div>
        `;
        
        // Decisions tab content
        document.getElementById('relevantDecisions').innerHTML = `
            <div class="decision-item">
                <div class="decision-title"><i class="fas fa-balance-scale"></i> Yargıtay 13. Hukuk Dairesi Kararı</div>
                <div class="decision-meta">
                    <div class="case-number"><i class="fas fa-hashtag"></i> 2019/4267 E., 2019/11584 K.</div>
                    <div class="decision-date"><i class="fas fa-calendar-alt"></i> 21.11.2019</div>
                    <div class="court-name"><i class="fas fa-university"></i> Yargıtay 13. HD</div>
                </div>
                <div class="decision-summary">Sözleşmenin ihlali halinde tazminat sorumluluğunun kapsamı ve şartlarına ilişkin karar.</div>
                <a href="#" class="decision-link mt-2 d-inline-block law-link">
                    <i class="fas fa-external-link-alt"></i> Kararı Görüntüle
                </a>
            </div>
            <div class="decision-item">
                <div class="decision-title"><i class="fas fa-balance-scale"></i> Yargıtay 4. Hukuk Dairesi Kararı</div>
                <div class="decision-meta">
                    <div class="case-number"><i class="fas fa-hashtag"></i> 2018/5421 E., 2019/2134 K.</div>
                    <div class="decision-date"><i class="fas fa-calendar-alt"></i> 24.09.2019</div>
                    <div class="court-name"><i class="fas fa-university"></i> Yargıtay 4. HD</div>
                </div>
                <div class="decision-summary">Haksız fiilden doğan tazminat taleplerinin değerlendirme kriterleri hakkında içtihat.</div>
                <a href="#" class="decision-link mt-2 d-inline-block law-link">
                    <i class="fas fa-external-link-alt"></i> Kararı Görüntüle
                </a>
            </div>
        `;
        
        // Recommendations tab content
        document.getElementById('recommendationsList').innerHTML = `
            <div class="recommendation-item">
                <i class="fas fa-lightbulb"></i> Dilekçenizde olayı kronolojik olarak anlatmanız faydalı olacaktır.
            </div>
            <div class="recommendation-item">
                <i class="fas fa-lightbulb"></i> Taleplerinizi net ve açık bir şekilde belirtmelisiniz.
            </div>
            <div class="recommendation-item">
                <i class="fas fa-lightbulb"></i> Dava değerini mutlaka dilekçenizde belirtmelisiniz.
            </div>
            <div class="recommendation-item">
                <i class="fas fa-lightbulb"></i> Dilekçenize eklediğiniz belgeleri "EKLER" bölümünde numaralı şekilde listelemeyi unutmayınız.
            </div>
        `;

        // Set the analysis summary
        document.getElementById('analysis-summary').innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> Bu davada sözleşme ihlali nedeniyle hak talep edilmektedir. Borçlar Kanunu'nun ilgili maddeleri ve emsal Yargıtay kararları doğrultusunda talebinizin değerlendirilmesi gerekmektedir.
            </div>
        `;
    }
    
    // Add floating animations to input labels
    const formControls = document.querySelectorAll('.form-control, .form-select');
    formControls.forEach(element => {
        // Check initial value to keep label floating if prefilled
        if (element.value) {
            element.classList.add('has-value');
        }
        
        // Handle input events
        element.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
        
        // Handle focus/blur for style changes
        element.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        element.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            if (!this.value) {
                this.classList.remove('has-value');
            }
        });
    });
});

/**
 * Handle document form submission and analyze the content to determine the appropriate category
 */
function handleDocumentFormSubmit(event) {
    if (event) {
        event.preventDefault();
    }
    
    console.log('Document form submitted');
    
    // Get form elements
    const clientName = document.getElementById('clientName');
    const documentType = document.getElementById('documentType');
    const caseSummary = document.getElementById('caseSummary');
    
    if (!clientName || !documentType || !caseSummary) {
        console.error('Required form fields not found');
        showMessage('error', 'Required form fields not found. Please refresh the page and try again.');
        return;
    }
    
    // Validate input
    if (!clientName.value || !documentType.value || !caseSummary.value) {
        showMessage('error', 'Lütfen tüm zorunlu alanları doldurun.');
        return;
    }
    
    // Validate the case summary length
    if (caseSummary.value.length < 100) {
        showMessage('warning', 'Lütfen en az 100 karakter içeren bir olay özeti girin. Daha detaylı bir açıklama, yapay zeka analizinin daha doğru olmasını sağlar.');
        return;
    }
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    // Improved document type to case category mapping
    const documentToCategoryMap = {
        // Contract law documents
        'dava_dilekce': 'borçlar_hukuku',
        'ihtarname': 'borçlar_hukuku',
        'uzlaşma_teklifi': 'borçlar_hukuku',
        'bilirkisi_itiraz': 'borçlar_hukuku',
        'itiraz_dilekce': 'borçlar_hukuku',
        
        // Family law documents
        'aile_hukuku_dilekce': 'aile_hukuku',
        'boşanma_davası': 'aile_hukuku',
        'nafaka_davası': 'aile_hukuku',
        'velayet_davası': 'aile_hukuku',
        
        // Labor law documents
        'is_hukuku_dilekce': 'iş_hukuku',
        'iş_davası': 'iş_hukuku',
        'işe_iade': 'iş_hukuku',
        
        // Commercial law documents
        'ticaret_hukuku_dilekce': 'ticaret_hukuku',
        
        // Criminal law documents
        'ceza_davası': 'ceza_hukuku',
        'temyiz_dilekce': 'ceza_hukuku',
        
        // Default to contract law if not found
        'default': 'borçlar_hukuku'
    };
    
    // First, get the category from the document type mapping or use the default
    let category = documentToCategoryMap[documentType.value] || documentToCategoryMap['default'];
    console.log(`Initial category based on document type (${documentType.value}): ${category}`);
    
    // Convert to lowercase for case-insensitive matching
    const lowerCaseSummary = caseSummary.value.toLowerCase();
    
    // Enhanced keyword lists for better detection
    
    // Family law keywords with higher specificity
    const familyLawKeywords = [
        'boşan', 'eş', 'evli', 'nafaka', 'velayet', 'çocuk', 'aile', 'evlilik',
        'nikah', 'şiddet', 'mal paylaşımı', 'mehir', 'ayrılık', 'akrabalık',
        'ev içi şiddet', 'aile içi şiddet', 'domestic violence', 'fiziksel şiddet',
        'psikolojik şiddet', 'eşim', 'karım', 'kocam', 'çocuklarım',
        'nafaka', 'babalık', 'annelik', 'tanıma', 'nişan', 'soy bağı',
        'evlilik birliği', 'boşanma davası', 'anlaşmalı boşanma', 'çekişmeli boşanma'
    ];
    
    // Labor law keywords
    const laborLawKeywords = [
        'işçi', 'işveren', 'maaş', 'tazminat', 'iş sözleşmesi', 'ücret', 'mesai',
        'mobbing', 'sigorta', 'işten çıkarma', 'ihbar', 'kıdem', 'işyeri',
        'işe iade', 'fazla çalışma', 'mesai ücreti', 'sgk', 'sigortasız çalışma',
        'iş kazası', 'meslek hastalığı', 'sendika', 'grev', 'lokavt'
    ];
    
    // Criminal law keywords
    const criminalLawKeywords = [
        'suç', 'ceza', 'hapis', 'hırsızlık', 'dolandırıcılık', 'cinsel', 'yaralama',
        'kasten', 'taksirle', 'kaçakçılık', 'uyuşturucu', 'silah', 'tutuklu',
        'mahkum', 'sabıka', 'cezaevi', 'mağdur', 'sanık', 'şüpheli', 'delil',
        'beraat', 'darp', 'tehdit', 'hakaret', 'savcı', 'ifade', 'sorgulama'
    ];
    
    // Consumer law keywords
    const consumerLawKeywords = [
        'tüketici', 'ayıplı mal', 'iade', 'değişim', 'garanti', 'satış',
        'alışveriş', 'sipariş', 'ürün', 'hizmet', 'abonelik', 'fatura',
        'cayma hakkı', 'mesafeli satış'
    ];
    
    // Check for keywords in the case summary
    let keywordFound = false;
    
    // Check for family law content
    if (familyLawKeywords.some(keyword => lowerCaseSummary.includes(keyword))) {
        category = 'aile_hukuku';
        keywordFound = true;
        console.log('Case summary contains family law keywords. Setting category to aile_hukuku.');
    } 
    // Only check the next category if we haven't found a match yet
    else if (laborLawKeywords.some(keyword => lowerCaseSummary.includes(keyword))) {
        category = 'iş_hukuku';
        keywordFound = true;
        console.log('Case summary contains labor law keywords. Setting category to iş_hukuku.');
    } 
    // Only check the next category if we haven't found a match yet
    else if (criminalLawKeywords.some(keyword => lowerCaseSummary.includes(keyword))) {
        category = 'ceza_hukuku';
        keywordFound = true;
        console.log('Case summary contains criminal law keywords. Setting category to ceza_hukuku.');
    }
    // Only check the next category if we haven't found a match yet
    else if (consumerLawKeywords.some(keyword => lowerCaseSummary.includes(keyword))) {
        category = 'tüketici_hukuku';
        keywordFound = true;
        console.log('Case summary contains consumer law keywords. Setting category to tüketici_hukuku.');
    }
    
    // Special handling for domestic violence cases
    const domesticViolenceIndicators = [
        'şiddet', 'darp', 'dövmek', 'tehdit', 'hakaret', 'ev içi şiddet', 
        'aile içi şiddet', 'fiziksel şiddet', 'psikolojik şiddet', 
        'silah', 'bıçak', 'yaralamak', 'döv'
    ];
    
    if (domesticViolenceIndicators.some(keyword => lowerCaseSummary.includes(keyword)) && 
        familyLawKeywords.some(keyword => lowerCaseSummary.includes(keyword))) {
        category = 'aile_hukuku';
        keywordFound = true;
        console.log('Case summary contains domestic violence indicators. Setting category to aile_hukuku.');
    }
    
    console.log(`Final category determination: ${category} (keyword detected: ${keywordFound})`);
    console.log(`Case summary (first 100 chars): ${caseSummary.value.substring(0, 100)}...`);
    
    // Prepare API request data
    const requestData = {
        template_name: documentType.value,
        case_description: caseSummary.value,
        case_category: category,
        template_data: {
            client_name: clientName.value,
            document_type: documentType.value
        },
        metadata: {
            source: 'document_form',
            created_at: new Date().toISOString(),
            category: category,
            description: documentType.options[documentType.selectedIndex].text
        }
    };
    
    // Send API request
    fetch('/api/documents/ai-generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API request failed with status ' + response.status);
        }
        return response.json();
    })
    .then(result => {
        console.log('API Response:', result);
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Extract relevant data from result
        const category = (result.metadata && result.metadata.category) ? 
            result.metadata.category : requestData.case_category;
            
        const description = (result.metadata && result.metadata.description) ?
            result.metadata.description : requestData.metadata.description;
        
        // Display analysis results
        displayAnalysisResults(result, category, caseSummary.value);
        
        // Show success message
        if (result.analysis && result.analysis.relevant_laws && result.analysis.relevant_decisions) {
            const lawsCount = result.analysis.relevant_laws.length;
            const decisionsCount = result.analysis.relevant_decisions.length;
            
            if (lawsCount > 0 && decisionsCount > 0) {
                showMessage('success', `Analiz tamamlandı: ${lawsCount} kanun maddesi ve ${decisionsCount} yargı kararı bulundu.`);
            } else {
                showMessage('warning', 'Analiz yapıldı ancak yeterli sonuç bulunamadı. Lütfen daha detaylı bir olay özeti girin.');
            }
        } else {
            showMessage('warning', 'Analiz sonuçlarında eksiklik var. Lütfen daha detaylı bir olay özeti girin.');
        }
    })
    .catch(error => {
        console.error('Error during API request:', error);
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Show error message
        showMessage('error', 'Belge oluşturulurken bir hata oluştu: ' + error.message);
    });
}

// Then add this to the document loaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Get the document form
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        console.log('Found document form, attaching submit handler');
        documentForm.addEventListener('submit', handleDocumentFormSubmit);
    } else {
        console.error('Document form not found');
    }
    
    // ... existing code ...
}); 