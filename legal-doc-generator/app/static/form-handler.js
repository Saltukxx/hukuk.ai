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
        if (analysis.relevant_laws && analysis.relevant_laws.length > 0) {
            const lawList = document.getElementById('relevantLaws');
            if (lawList) {
                lawList.innerHTML = '';
                analysis.relevant_laws.forEach(law => {
                    const li = document.createElement('li');
                    li.className = 'law-item';
                    li.innerHTML = `<span class="law-title">${law.title}</span>: ${law.content}`;
                    lawList.appendChild(li);
                });
            }
        }
        
        // Display relevant decisions if available
        if (analysis.relevant_decisions && analysis.relevant_decisions.length > 0) {
            const decisionList = document.getElementById('relevantDecisions');
            if (decisionList) {
                decisionList.innerHTML = '';
                analysis.relevant_decisions.forEach(decision => {
                    const li = document.createElement('li');
                    li.className = 'decision-item';
                    li.innerHTML = `<span class="decision-court">${decision.court}</span> - 
                                    <span class="decision-number">${decision.number}</span>: 
                                    ${decision.content}`;
                    decisionList.appendChild(li);
                });
            }
        }
        
        // Display recommendations if available
        if (analysis.recommendations) {
            const legalAnalysis = document.getElementById('legalAnalysis');
            if (legalAnalysis) {
                legalAnalysis.innerHTML = analysis.recommendations;
            }
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
 * Display the analysis results in the UI
 */
function displayAnalysisResults(result, category, description) {
    // Show the result container
    const resultContainer = document.getElementById('result');
    if (resultContainer) {
        resultContainer.style.display = 'block';
    }
    
    // Set the category badge
    const categoryBadge = document.getElementById('analysis-category');
    if (categoryBadge) {
        categoryBadge.textContent = category.toUpperCase();
    }
    
    // Set the description in the analysis content
    const analysisContent = document.getElementById('analysis-content');
    if (analysisContent) {
        analysisContent.innerHTML = `<p><strong>Olay Özeti:</strong> ${description}</p>`;
    }
    
    // Process the analysis data if available
    if (result.analysis) {
        // Display relevant laws
        const relevantLaws = document.getElementById('relevantLaws');
        if (relevantLaws && result.analysis.relevant_laws) {
            relevantLaws.innerHTML = '';
            
            result.analysis.relevant_laws.forEach(law => {
                const li = document.createElement('li');
                li.className = 'law-item';
                li.innerHTML = `<strong>${law.title}</strong>: ${law.content}`;
                relevantLaws.appendChild(li);
            });
        }
        
        // Display relevant decisions
        const relevantDecisions = document.getElementById('relevantDecisions');
        if (relevantDecisions && result.analysis.relevant_decisions) {
            relevantDecisions.innerHTML = '';
            
            result.analysis.relevant_decisions.forEach(decision => {
                const li = document.createElement('li');
                li.className = 'decision-item';
                li.innerHTML = `<strong>${decision.court} - ${decision.number}</strong>: ${decision.content}`;
                relevantDecisions.appendChild(li);
            });
        }
        
        // Display legal recommendations
        const legalAnalysis = document.getElementById('legalAnalysis');
        if (legalAnalysis && result.analysis.recommendations) {
            legalAnalysis.innerHTML = result.analysis.recommendations;
        }
    } else {
        // If no analysis data is available, show a message
        const analysisResults = document.getElementById('analysis-results');
        if (analysisResults) {
            analysisResults.innerHTML = '<p class="text-muted">Detaylı analiz verisi bulunamadı.</p>';
        }
    }
    
    // Scroll to the results section
    resultContainer.scrollIntoView({ behavior: 'smooth' });
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
            
            // Show error alert
            alert('Hata: ' + error.message);
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
window.displayAnalysisResults = function(analysisData) {
    console.log('Displaying analysis results:', analysisData);

    // Check if we have analysis data
    if (!analysisData) {
        console.warn('No analysis data provided');
        return;
    }

    try {
        // Display relevant laws
        const relevantLawsContainer = document.getElementById('relevantLaws');
        if (relevantLawsContainer && analysisData.relevant_laws) {
            relevantLawsContainer.innerHTML = '';
            
            if (analysisData.relevant_laws.length === 0) {
                relevantLawsContainer.innerHTML = '<li class="list-group-item">Olay örgüsü için ilgili kanun maddesi bulunamadı.</li>';
            } else {
                analysisData.relevant_laws.forEach(law => {
                    const lawItem = document.createElement('li');
                    lawItem.className = 'list-group-item';
                    
                    const lawTitle = document.createElement('h6');
                    lawTitle.className = 'mb-1 text-primary';
                    lawTitle.textContent = law.title;
                    
                    const lawContent = document.createElement('p');
                    lawContent.className = 'mb-0';
                    lawContent.textContent = law.content;
                    
                    lawItem.appendChild(lawTitle);
                    lawItem.appendChild(lawContent);
                    relevantLawsContainer.appendChild(lawItem);
                });
            }
        }
        
        // Display relevant court decisions
        const relevantDecisionsContainer = document.getElementById('relevantDecisions');
        if (relevantDecisionsContainer && analysisData.relevant_decisions) {
            relevantDecisionsContainer.innerHTML = '';
            
            if (analysisData.relevant_decisions.length === 0) {
                relevantDecisionsContainer.innerHTML = '<li class="list-group-item">Olay örgüsü için ilgili Yargıtay kararı bulunamadı.</li>';
            } else {
                analysisData.relevant_decisions.forEach(decision => {
                    const decisionItem = document.createElement('li');
                    decisionItem.className = 'list-group-item';
                    
                    const decisionHeader = document.createElement('div');
                    decisionHeader.className = 'mb-1';
                    
                    const courtName = document.createElement('span');
                    courtName.className = 'text-secondary';
                    courtName.textContent = decision.court;
                    
                    const decisionNumber = document.createElement('span');
                    decisionNumber.className = 'badge bg-secondary ms-2';
                    decisionNumber.textContent = decision.number;
                    
                    decisionHeader.appendChild(courtName);
                    decisionHeader.appendChild(decisionNumber);
                    
                    const decisionContent = document.createElement('p');
                    decisionContent.className = 'mb-0';
                    decisionContent.textContent = decision.content;
                    
                    decisionItem.appendChild(decisionHeader);
                    decisionItem.appendChild(decisionContent);
                    relevantDecisionsContainer.appendChild(decisionItem);
                });
            }
        }
        
        // Display recommendations
        const legalAnalysisContainer = document.getElementById('legalAnalysis');
        if (legalAnalysisContainer && analysisData.recommendations) {
            // Use innerHTML for recommendations as they are already in HTML format
            legalAnalysisContainer.innerHTML = analysisData.recommendations;
        }
        
        // Make sure the entire analysis section is visible
        const analysisResults = document.getElementById('analysis-results');
        if (analysisResults) {
            analysisResults.style.display = 'block';
            
            // Ensure any AOS animations don't interfere with visibility
            analysisResults.setAttribute('data-aos-once', 'true');
            analysisResults.style.opacity = '1';
            analysisResults.style.visibility = 'visible';
        }
        
        // Scroll to the results section
        const resultSection = document.getElementById('result');
        if (resultSection) {
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } catch (error) {
        console.error('Error displaying analysis results:', error);
    }
};

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