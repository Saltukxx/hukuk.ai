/*
 * Hukuk.AI - Front-end Script
 * Handles dynamic interactions and animations
 * Ensures proper connection with backend APIs
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS library for scroll animations
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: false,
        mirror: true
    });

    // Handle preloader
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1500);

    // Initialize neural network animation
    initializeNeuralNetworkAnimation();

    // Initialize form handling
    initializeFormHandling();

    // Smooth scrolling for navigation links
    initializeSmoothScrolling();

    // Template form handling
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const templateName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            showTemplateForm(templateName);
        });
    });
});

// Neural network animation
function initializeNeuralNetworkAnimation() {
    // Only run if GSAP is available
    if (typeof gsap !== 'undefined') {
        const nodes = document.querySelectorAll('.node');
        if (nodes.length) {
            // Create connections between nodes using SVG
            const neuralNetwork = document.querySelector('.neural-network');
            if (neuralNetwork) {
                const svgNS = 'http://www.w3.org/2000/svg';
                const svg = document.createElementNS(svgNS, 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';
                svg.style.pointerEvents = 'none';
                neuralNetwork.appendChild(svg);

                // Create random connections between nodes
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        if (Math.random() > 0.5) { // Only create some connections
                            const line = document.createElementNS(svgNS, 'line');
                            line.setAttribute('stroke', 'var(--primary-color)');
                            line.setAttribute('stroke-width', '1');
                            line.setAttribute('stroke-opacity', '0.2');
                            svg.appendChild(line);

                            // Animate the connection line
                            gsap.to(line, {
                                duration: Math.random() * 2 + 1,
                                attr: { 'stroke-opacity': 0.5 },
                                repeat: -1,
                                yoyo: true
                            });

                            // Position the line based on node positions
                            const updateLine = () => {
                                const rect1 = nodes[i].getBoundingClientRect();
                                const rect2 = nodes[j].getBoundingClientRect();
                                const containerRect = neuralNetwork.getBoundingClientRect();

                                const x1 = rect1.left + rect1.width / 2 - containerRect.left;
                                const y1 = rect1.top + rect1.height / 2 - containerRect.top;
                                const x2 = rect2.left + rect2.width / 2 - containerRect.left;
                                const y2 = rect2.top + rect2.height / 2 - containerRect.top;

                                line.setAttribute('x1', x1);
                                line.setAttribute('y1', y1);
                                line.setAttribute('x2', x2);
                                line.setAttribute('y2', y2);
                            };

                            // Initial position
                            updateLine();

                            // Update on resize
                            window.addEventListener('resize', updateLine);
                        }
                    }
                }
            }
        }
    }
}

// Smooth scrolling for navigation
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Scroll to element with smooth behavior
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // Offset for navbar
                    behavior: 'smooth'
                });

                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
}

// Form handling
function initializeFormHandling() {
    // Template selection handling
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            document.querySelectorAll('.templateFields').forEach(field => {
                field.style.display = 'none';
            });
            
            const selectedTemplate = this.value;
            if (selectedTemplate) {
                const fieldsDiv = document.getElementById(`${selectedTemplate}Fields`);
                if (fieldsDiv) {
                    fieldsDiv.style.display = 'block';
                }
            }
        });
    }
    
    // Form submission
    const aiForm = document.getElementById('aiForm');
    if (aiForm) {
        aiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous results
            document.getElementById('result').style.display = 'none';
            document.getElementById('relevantLaws').innerHTML = '';
            document.getElementById('relevantDecisions').innerHTML = '';
            document.getElementById('legalAnalysis').innerHTML = '';
            
            // Show loading animation
            document.getElementById('loading').style.display = 'block';
            
            // Get form data
            const templateName = document.getElementById('templateSelect').value;
            const category = document.getElementById('categorySelect').value;
            const caseDescription = document.getElementById('caseDescription').value;
            
            // Collect template data based on selected template type
            let templateData = {};
            
            if (templateName === 'dilekce') {
                templateData = {
                    kurum: document.getElementById('kurum').value,
                    konu: document.getElementById('konu').value,
                    ad_soyad: document.getElementById('ad_soyad').value
                    // Note: 'icerik' field will be filled by AI
                };
            } else if (templateName === 'ihtarname') {
                templateData = {
                    gonderen: document.getElementById('gonderen').value,
                    alici: document.getElementById('alici').value,
                    konu: document.getElementById('konu_ihtarname').value,
                    ad_soyad: document.getElementById('ad_soyad_ihtarname').value
                    // Note: 'icerik' and 'sonuc_talep' fields will be filled by AI
                };
            } else if (templateName === 'dava_dilekce') {
                templateData = {
                    mahkeme: document.getElementById('mahkeme').value,
                    dava_turu: document.getElementById('dava_turu').value,
                    davaci: document.getElementById('davaci').value,
                    davali: document.getElementById('davali').value,
                    konu: document.getElementById('konu_dava').value,
                    deger: document.getElementById('deger').value,
                    deliller: ["Delil 1", "Delil 2"], // Example
                    davaci_ad_soyad: document.getElementById('davaci_ad_soyad').value
                    // Note: 'aciklamalar', 'hukuki_sebepler', and 'sonuc_talep' fields will be filled by AI
                };
            }
            
            // API request data
            const requestData = {
                template_name: templateName,
                template_data: templateData,
                case_description: caseDescription,
                case_category: category
            };
            
            console.log("Sending data:", requestData);
            
            // First analyze the case
            fetch('/analyze-case', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    case_description: caseDescription,
                    case_category: category
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(analysisData => {
                console.log("Analysis result:", analysisData);
                
                // Save analysis results in window object to use when processing document generation response
                window.currentAnalysis = analysisData;
                
                // Now generate the document
                return fetch('/generate-ai-enhanced', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("API response:", data);
                
                // Hide loading animation
                document.getElementById('loading').style.display = 'none';
                
                // Show result - make sure it's visible and properly styled
                const resultElement = document.getElementById('result');
                resultElement.style.display = 'block';
                
                // Remove any previous animations that might be interfering
                resultElement.classList.remove('animate__animated', 'animate__fadeIn');
                void resultElement.offsetWidth; // Force reflow
                
                // Add entrance animation with a slight delay to ensure display:block takes effect first
                setTimeout(() => {
                    resultElement.classList.add('animate__animated', 'animate__fadeIn');
                }, 50);
                
                // Update result message
                document.getElementById('resultMessage').textContent = 'Belgeniz başarıyla oluşturuldu.';
                document.getElementById('downloadLink').href = data.download_url;
                
                // Ensure the result container is completely visible
                document.getElementById('result').style.opacity = '1';
                document.getElementById('result').style.visibility = 'visible';
                
                // Show analysis results from the API
                if (window.currentAnalysis) {
                    displayAnalysisResults(window.currentAnalysis);
                } else {
                    console.warn("Analysis results not found in window object");
                    // Create a simple fallback if analysis data is missing
                    document.getElementById('relevantLaws').innerHTML = '<li>Analiz sonuçları gösterilemiyor</li>';
                    document.getElementById('relevantDecisions').innerHTML = '<li>Analiz sonuçları gösterilemiyor</li>';
                    document.getElementById('legalAnalysis').innerHTML = '<p>Analiz içeriği gösterilemiyor</p>';
                }
                
                // Scroll to results with a delay to ensure everything is rendered
                setTimeout(() => {
                    resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 200);
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('loading').style.display = 'none';
                
                // Show error message
                const resultElement = document.getElementById('result');
                resultElement.style.display = 'block';
                resultElement.innerHTML = `
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-circle"></i> Hata!</h5>
                        <p>İşlem sırasında bir hata oluştu: ${error.message}</p>
                        <button class="btn btn-outline-danger mt-2" onclick="document.getElementById('aiForm').scrollIntoView({behavior: 'smooth'})">
                            <i class="fas fa-redo"></i> Tekrar Dene
                        </button>
                    </div>
                `;
            });
        });
    }
}

// Show template form based on selection
function showTemplateForm(templateName) {
    // Hide all template fields
    document.querySelectorAll('.templateFields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Set the template selection dropdown
    document.getElementById('templateSelect').value = templateName;
    
    // Show the fields for selected template
    const fieldsDiv = document.getElementById(`${templateName}Fields`);
    if (fieldsDiv) {
        fieldsDiv.style.display = 'block';
    }
    
    // Scroll to AI section
    document.getElementById('ai').scrollIntoView({behavior: 'smooth'});
    
    // Highlight the form with animation
    const formContainer = document.querySelector('.ai-form-container');
    formContainer.classList.add('highlight-form');
    setTimeout(() => {
        formContainer.classList.remove('highlight-form');
    }, 1500);
}

// Display analysis results
function displayAnalysisResults(analysis) {
    console.log("Displaying analysis results:", analysis);
    
    // Ensure analysis data is available
    if (!analysis) {
        console.error("No analysis data provided");
        return;
    }
    
    // Show relevant laws
    const lawsElement = document.getElementById('relevantLaws');
    if (!lawsElement) {
        console.error("Element with ID 'relevantLaws' not found");
        return;
    }
    
    let lawsHtml = '';
    if (analysis.relevant_laws && analysis.relevant_laws.length > 0) {
        analysis.relevant_laws.forEach(law => {
            lawsHtml += `
                <li class="animate__animated animate__fadeInLeft">
                    <strong>${law.name || 'İsimsiz Kanun'} - ${law.law_no || 'No belirtilmemiş'}</strong>: 
                    ${law.content ? law.content.substring(0, 100) + '...' : 'İçerik bulunamadı'}
                </li>
            `;
        });
    } else {
        lawsHtml = '<li>İlgili kanun bulunamadı</li>';
    }
    lawsElement.innerHTML = lawsHtml;
    
    // Show relevant court decisions
    const decisionsElement = document.getElementById('relevantDecisions');
    if (!decisionsElement) {
        console.error("Element with ID 'relevantDecisions' not found");
        return;
    }
    
    let decisionsHtml = '';
    if (analysis.relevant_decisions && analysis.relevant_decisions.length > 0) {
        analysis.relevant_decisions.forEach(decision => {
            decisionsHtml += `
                <li class="animate__animated animate__fadeInRight">
                    <strong>Yargıtay ${decision.chamber || 'Belirtilmemiş'}</strong> - 
                    ${decision.decision_no || 'No belirtilmemiş'}, ${decision.decision_date || 'Tarih belirtilmemiş'}: 
                    ${decision.subject || 'Konu belirtilmemiş'}
                </li>
            `;
        });
    } else {
        decisionsHtml = '<li>İlgili Yargıtay kararı bulunamadı</li>';
    }
    decisionsElement.innerHTML = decisionsHtml;
    
    // Show legal analysis with formatting
    const analysisElement = document.getElementById('legalAnalysis');
    if (!analysisElement) {
        console.error("Element with ID 'legalAnalysis' not found");
        return;
    }
    
    // Handle different analysis response formats
    let analysisText = "";
    if (typeof analysis.analysis === 'string') {
        analysisText = analysis.analysis;
    } else if (analysis.analysis && typeof analysis.analysis.analysis === 'string') {
        analysisText = analysis.analysis.analysis;
    } else if (analysis.analysis && typeof analysis.analysis === 'object') {
        analysisText = JSON.stringify(analysis.analysis);
    } else {
        analysisText = "Hukuki analiz metni bulunamadı.";
    }
    
    // Convert newlines to <br> tags
    analysisText = analysisText.replace(/\n/g, '<br>');
    
    // Highlight section headers
    analysisText = analysisText.replace(/I\. OLAYIN ÖZETİ/g, '<h4 class="mt-3 animate__animated animate__fadeIn">I. OLAYIN ÖZETİ</h4>');
    analysisText = analysisText.replace(/II\. İLGİLİ KANUN MADDELERİ/g, '<h4 class="mt-3 animate__animated animate__fadeIn">II. İLGİLİ KANUN MADDELERİ</h4>');
    analysisText = analysisText.replace(/III\. İLGİLİ YARGITAY KARARLARI/g, '<h4 class="mt-3 animate__animated animate__fadeIn">III. İLGİLİ YARGITAY KARARLARI</h4>');
    analysisText = analysisText.replace(/IV\. HUKUKİ DEĞERLENDİRME/g, '<h4 class="mt-3 animate__animated animate__fadeIn">IV. HUKUKİ DEĞERLENDİRME</h4>');
    analysisText = analysisText.replace(/V\. SONUÇ VE TAVSİYELER/g, '<h4 class="mt-3 animate__animated animate__fadeIn">V. SONUÇ VE TAVSİYELER</h4>');
    
    // Highlight legal references
    analysisText = analysisText.replace(/(\b(TMK|TBK|TCK|İK|HMK|TTK|TKHK|İYUK|HUMK|İİK)\s+\d+\/?\d*)/g, '<span class="badge bg-primary">$1</span>');
    analysisText = analysisText.replace(/([mM]adde\s+\d+\/?\d*)/g, '<span class="badge bg-secondary">$1</span>');
    analysisText = analysisText.replace(/(Yargıtay\s+\d+\.\s+(Hukuk|Ceza)\s+Dairesi\s+\d+\/\d+)/g, '<span class="badge bg-info">$1</span>');
    
    // Add animation to the entire content
    analysisElement.innerHTML = `
        <div class="legal-analysis-content animate__animated animate__fadeIn">
            ${analysisText}
        </div>
    `;
    
    console.log("Analysis results displayed successfully");
}

// Update active menu based on scroll position
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            document.querySelector(`.navbar-nav .nav-link[href="#${sectionId}"]`)?.classList.add('active');
        } else {
            document.querySelector(`.navbar-nav .nav-link[href="#${sectionId}"]`)?.classList.remove('active');
        }
    });
});

// Add CSS animation class for highlight effect
const style = document.createElement('style');
style.textContent = `
    @keyframes highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(58, 54, 224, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(58, 54, 224, 0); }
        100% { box-shadow: 0 0 0 0 rgba(58, 54, 224, 0); }
    }
    
    .highlight-form {
        animation: highlight-pulse 1.5s ease-out;
    }
`;
document.head.appendChild(style); 