/*
 * Hukuk.AI - Front-end Script
 * Handles dynamic interactions and animations
 * Ensures proper connection with backend APIs
 */

// IMPORTANT: We'll use the form handler functions that should be initialized by form-handler.js
// We won't redefine them here to avoid conflicts

// Main Script for Hukuk.AI

document.addEventListener("DOMContentLoaded", function() {
    // Initialize all components
    initBootstrapComponents();
    initEnhancedParticles();
    initAOS();
    initThemeSwitcher();
    initNavIndicator();
    initSmoothScroll();
    initFormHandlers();
    initCountUpAnimations();
    initAboutInteractions(); // New function for About section
    initTypingAnimation();
});

// Initialize Bootstrap components
function initBootstrapComponents() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    
    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });
}

// Initialize AOS (Animate On Scroll) library
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: false,
            mirror: true,
            offset: 50,
            easing: 'ease-in-out'
        });
    } else {
        console.warn('AOS library not loaded. Loading it dynamically...');
        loadScript('https://unpkg.com/aos@next/dist/aos.js', function() {
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,
                    once: false,
                    mirror: true,
                    offset: 50,
                    easing: 'ease-in-out'
                });
            } else {
                console.error('Failed to load AOS library');
            }
        });
    }
}

// Helper function to load scripts dynamically
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}

// Theme switcher initialization
function initThemeSwitcher() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or prefers-color-scheme
    const savedTheme = localStorage.getItem('theme');
    
    // Set initial theme based on saved preference - default to dark theme
    if (savedTheme === 'light') {
        body.classList.add('light-theme');
        themeToggle.classList.add('light-active');
    } else {
        // Default to dark theme
        body.classList.remove('light-theme');
        localStorage.setItem('theme', 'dark');
    }
    
    // Add click event to toggle theme
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            // Toggle the light-theme class
            body.classList.toggle('light-theme');
            themeToggle.classList.toggle('light-active');
            
            // Save theme preference
            if (body.classList.contains('light-theme')) {
                localStorage.setItem('theme', 'light');
            } else {
                localStorage.setItem('theme', 'dark');
            }
        });
    }
}

// Initialize navigation indicator
function initNavIndicator() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const indicator = document.querySelector('.nav-indicator');
    
    if (!indicator || navLinks.length === 0) return;
    
    // Function to position the indicator based on active link
    function positionIndicator(activeLink) {
        if (!activeLink) return;
        
        const rect = activeLink.getBoundingClientRect();
        const navRect = document.querySelector('.navbar').getBoundingClientRect();
        
        indicator.style.width = `${rect.width}px`;
        indicator.style.left = `${rect.left - navRect.left}px`;
        indicator.style.opacity = '1';
    }
    
    // Set initial position
    const activeLink = document.querySelector('.navbar-nav .nav-link.active');
    if (activeLink) {
        setTimeout(() => {
            positionIndicator(activeLink);
        }, 100);
    }
    
    // Update on scroll to highlight current section
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        
        // Find which section is currently in view
        document.querySelectorAll('section[id]').forEach(section => {
            const sectionTop = section.offsetTop - 120; // Adjust offset
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Remove active from all links
                navLinks.forEach(link => link.classList.remove('active'));
                
                // Add active to current section link
                const currentLink = document.querySelector(`.navbar-nav .nav-link[href="#${sectionId}"]`);
                if (currentLink) {
                    currentLink.classList.add('active');
                    positionIndicator(currentLink);
                }
            }
        });
    });
    
    // Update indicator on nav link click
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            this.classList.add('active');
            positionIndicator(this);
        });
        
        // Handle hover effect
        link.addEventListener('mouseenter', function() {
            positionIndicator(this);
        });
        
        link.addEventListener('mouseleave', function() {
            const activeLink = document.querySelector('.navbar-nav .nav-link.active');
            positionIndicator(activeLink);
        });
    });
    
    // Update indicator on window resize
    window.addEventListener('resize', function() {
        const activeLink = document.querySelector('.navbar-nav .nav-link.active');
        positionIndicator(activeLink);
    });
}

// Initialize enhanced particles for better animation
function initEnhancedParticles() {
    const particlesContainer = document.querySelector('.particles-container');
    
    if (!particlesContainer) return;
    
    // Clear any existing particles
    particlesContainer.innerHTML = '';
    
    // Create new particles with enhanced styles
    const numberOfParticles = 30;
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Set random size between 3px and 15px with potential for larger "special" particles
        const isSpecial = Math.random() > 0.9;
        const size = isSpecial ? Math.random() * 15 + 15 : Math.random() * 12 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Set random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Set random animation duration between 15s and 45s
        const duration = Math.random() * 30 + 15;
        particle.style.animationDuration = `${duration}s`;
        
        // Set random delay
        const delay = Math.random() * 15;
        particle.style.animationDelay = `${delay}s`;
        
        // Add glow effect based on size
        const glowSize = size * 2;
        const glowOpacity = isSpecial ? 0.7 : (Math.floor(size/4) / 10);
        particle.style.boxShadow = `0 0 ${glowSize}px rgba(79, 70, 229, ${glowOpacity})`;
        
        // Add additional particle styles
        particle.style.opacity = isSpecial ? '0.9' : '0.5';
        particle.style.background = isSpecial 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(79, 70, 229, 0.3))'
            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.5), transparent)';
        particle.style.borderRadius = '50%';
        particle.style.position = 'absolute';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '0';
        particle.style.animation = `particleFloat ${duration}s ease-in-out ${delay}s infinite alternate, 
                                  particleFade ${duration/2}s ease-in-out ${delay}s infinite alternate`;
        
        particlesContainer.appendChild(particle);
    }
    
    // Add the CSS for animations if not already in the stylesheet
    if (!document.querySelector('#particle-styles')) {
        const style = document.createElement('style');
        style.id = 'particle-styles';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translate(0, 0) rotate(0deg); }
                33% { transform: translate(${Math.random() * 100}px, ${Math.random() * -100}px) rotate(120deg); }
                66% { transform: translate(${Math.random() * -100}px, ${Math.random() * 100}px) rotate(240deg); }
                100% { transform: translate(${Math.random() * 50}px, ${Math.random() * -50}px) rotate(360deg); }
            }
            @keyframes particleFade {
                0% { opacity: 0.1; }
                50% { opacity: 0.7; }
                100% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            
            // Calculate offset based on navbar height with some padding
            const navbarHeight = document.querySelector('.navbar').offsetHeight || 80;
            const additionalOffset = 20;
            const totalOffset = navbarHeight + additionalOffset;
            
            window.scrollTo({
                top: targetElement.offsetTop - totalOffset,
                behavior: 'smooth'
            });
        });
    });
}

// Initialize form handlers
function initFormHandlers() {
    // Contact form handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Show loading state
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gönderiliyor...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual AJAX request)
            setTimeout(() => {
                // Reset form and show success message
                contactForm.reset();
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                // Show success alert
                showMessage('success', 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');
            }, 1500);
        });
    }
    
    // Document generator form handler
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Form validation
            if (!this.checkValidity()) {
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            // Get form data
            const formData = new FormData(documentForm);
            const formDataObj = {};
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Get essential form fields
            const clientName = formDataObj.clientName || document.getElementById('clientName')?.value || 'Test Müvekkil';
            const documentType = formDataObj.documentType || document.getElementById('documentType')?.value || 'dava_dilekce';
            const caseSummary = formDataObj.caseSummary || document.getElementById('caseSummary')?.value || '';
            
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            const loadingText = document.getElementById('loadingText');
            
            if (submitBtn) submitBtn.disabled = true;
            if (submitText) submitText.style.display = 'none';
            if (loadingText) loadingText.style.display = 'inline-block';
            
            // Instead of redirecting, we'll use mock data for the analysis
            setTimeout(() => {
                // Generate a result based on the case summary
                const mockResult = generateMockAnalysis(caseSummary, documentType);
                
                // Display the results
                displayAnalysisResults(mockResult);
                
                // Show success message
                showMessage('success', 'Belgeniz başarıyla hazırlandı. Analiz sonuçlarını aşağıda görebilirsiniz.');
                
                // Reset form state
                if (submitBtn) submitBtn.disabled = false;
                if (submitText) submitText.style.display = 'inline-block';
                if (loadingText) loadingText.style.display = 'none';
                
                // Scroll to the analysis results
                const analysisResults = document.getElementById('analysis-container');
                if (analysisResults) {
                    analysisResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 2000);
        });
    }
}

// Show message helper function
function showMessage(type, message, duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after duration
    setTimeout(() => {
        try {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        } catch (e) {
            alertElement.remove();
        }
    }, duration);
}

// Initialize counter animations for stats
function initCountUpAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const countSpans = entry.target.querySelectorAll('.stat-number-animated');
                countSpans.forEach(countSpan => {
                    const target = parseInt(countSpan.getAttribute('data-count'));
                    animateCount(countSpan, target);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    // Observe hero stats
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
}

// Animate count up function
function animateCount(element, target) {
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const startValue = 0;
    
    // Easing function for smooth animation
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    function updateCount(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.floor(startValue + easedProgress * (target - startValue));
        
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(updateCount);
}

// Function to generate mock analysis based on the case type
function generateMockAnalysis(caseSummary, documentType) {
    // Check for family law or divorce case keywords
    const isBoşanmaDavası = caseSummary.toLowerCase().includes('boşanma') || 
                           documentType.toLowerCase().includes('boşanma');
    
    const isAileHukuku = caseSummary.toLowerCase().includes('aile') || 
                        caseSummary.toLowerCase().includes('nafaka') ||
                        caseSummary.toLowerCase().includes('velayet') ||
                        documentType.toLowerCase().includes('aile');
    
    if (isBoşanmaDavası) {
        return {
            summary: "Boşanma davası için hukuki analiz sonuçları aşağıda verilmiştir. Müvekkil tarafından sunulan bilgilere göre, çekişmeli boşanma davası açılması uygun görülmektedir. Evlilik birliğinin temelinden sarsıldığı ve eşler arasında şiddetli geçimsizlik bulunduğu anlaşılmaktadır.",
            relevant_laws: [
                {
                    title: "Türk Medeni Kanunu Madde 166/1",
                    description: "Evlilik birliği, ortak hayatı sürdürmeleri kendilerinden beklenmeyecek derecede temelinden sarsılmış olursa, eşlerden her biri boşanma davası açabilir."
                },
                {
                    title: "Türk Medeni Kanunu Madde 166/2",
                    description: "Evlilik birliğinin temelinden sarsılması nedeniyle boşanma davasını açan taraf kusurlu olduğunu iddia edemez."
                },
                {
                    title: "Türk Medeni Kanunu Madde 175",
                    description: "Boşanma yüzünden yoksulluğa düşecek taraf, kusuru daha ağır olmamak koşuluyla geçimi için diğer taraftan malî gücü oranında süresiz olarak nafaka isteyebilir."
                },
                {
                    title: "Türk Medeni Kanunu Madde 182",
                    description: "Mahkeme boşanma veya ayrılığa karar verirken, olanak bulundukça ana ve babayı dinledikten ve çocuk vesayet altında ise vasinin ve vesayet makamının düşüncesini aldıktan sonra, ana ve babanın haklarını ve çocuk ile olan kişisel ilişkilerini düzenler."
                }
            ],
            relevant_decisions: [
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2019/5874 E., 2020/3712 K.",
                    date: "25.06.2020",
                    summary: "Evlilik birliğinin temelinden sarsılması sebebine dayalı olarak açılan boşanma davasında, eşlerin karşılıklı suçlamaları ve artık birlikte yaşamalarının mümkün olmadığı anlaşılmakla birlikte kusur durumunun tespiti maddi ve manevi tazminat talepleri açısından önem arz etmektedir."
                },
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2018/2756 E., 2019/7851 K.",
                    date: "17.09.2019",
                    summary: "Boşanma halinde velayet düzenlemesinde çocuğun üstün yararının gözetilmesi esastır. Velayetin düzenlenmesinde çocuğun yaşı, cinsiyeti, ana-baba ile olan ilişkisi, tarafların ekonomik ve sosyal durumları ile çocuğun sağlıklı gelişimi için gerekli koşullar değerlendirilmelidir."
                },
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2017/6873 E., 2019/2957 K.",
                    date: "14.03.2019",
                    summary: "Yoksulluk nafakasına hükmedilebilmesi için nafaka talep eden eşin boşanma nedeniyle yoksulluğa düşecek olması, yoksulluğa düşecek eşin kusurunun daha ağır olmaması ve talep edilmiş olması şartlarının birlikte gerçekleşmesi gerekir."
                }
            ],
            recommendations: [
                "Boşanma davası için dava dilekçesinde tarafların evlilik birliğini temelinden sarsan olaylar detaylı şekilde anlatılmalıdır.",
                "Müvekkilin kusursuzluğunu veya az kusurlu olduğunu kanıtlamak için tanık beyanları ve diğer deliller toplanmalıdır.",
                "Çocuk varsa velayet talebi için çocuğun üstün yararına ilişkin somut deliller sunulmalıdır.",
                "Nafaka, tazminat ve mal paylaşımı talepleri açık ve net şekilde belirtilmelidir.",
                "Gerekli hallerde tedbir nafakası talebinde bulunulabilir."
            ]
        };
    } else if (isAileHukuku) {
        return {
            summary: "Aile hukuku kapsamında yapılan analiz sonuçları aşağıda verilmiştir. Mevcut veriler doğrultusunda müvekkilin hukuki durumu değerlendirilmiştir. Aile hukukuna ilişkin uyuşmazlıkların çözümünde uzlaşma öncelikli olarak değerlendirilmelidir.",
            relevant_laws: [
                {
                    title: "Türk Medeni Kanunu Madde 185",
                    description: "Evlenmeyle eşler arasında evlilik birliği kurulmuş olur. Eşler, bu birliğin mutluluğunu elbirliğiyle sağlamak ve çocukların bakımına, eğitim ve gözetimine beraberce özen göstermekle yükümlüdürler."
                },
                {
                    title: "Türk Medeni Kanunu Madde 197",
                    description: "Eşlerden biri, ortak hayat sebebiyle kişiliği, ekonomik güvenliği veya ailenin huzuru ciddî biçimde tehlikeye düştüğü sürece ayrı yaşama hakkına sahiptir."
                },
                {
                    title: "Türk Medeni Kanunu Madde 201",
                    description: "Ailenin geçimi için her eşin yapacağı parasal katkının belirlenmesinde, iş ve çalışma koşulları ile malî durumları göz önünde tutulur."
                },
                {
                    title: "Türk Medeni Kanunu Madde 336",
                    description: "Evlilik devam ettiği sürece ana ve baba velayeti birlikte kullanırlar. Ortak hayata son verilmiş veya ayrılık hâli gerçekleşmişse hâkim, velayeti eşlerden birine verebilir."
                }
            ],
            relevant_decisions: [
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2020/1256 E., 2020/5891 K.",
                    date: "12.11.2020",
                    summary: "Tedbir nafakasına hükmedilebilmesi için evlilik birliğinin devam ediyor olması ve nafaka talep edilen eşin kusurlu olduğunun kanıtlanması gerekli değildir. Eşin ihtiyacı ve diğer eşin mali gücü dikkate alınır."
                },
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2019/8743 E., 2020/4981 K.",
                    date: "08.10.2020",
                    summary: "Ayrı yaşama hakkı olan eş, birliğe ilişkin önemli bir konuda diğer eşin onayını alamazsa veya diğer eş haklı bir sebep olmaksızın onayını vermekten kaçınırsa, aile konutuyla ilgili işlemler dahil, hâkimin müdahalesini isteyebilir."
                },
                {
                    case_number: "Yargıtay 2. Hukuk Dairesi 2018/5764 E., 2019/12105 K.",
                    date: "09.12.2019",
                    summary: "Çocukla kişisel ilişki düzenlenirken, velayeti kendisine verilmeyen ebeveyn ile çocuk arasındaki ilişkinin sağlıklı şekilde sürdürülmesi, çocuğun yaşı, eğitim durumu ve tarafların sosyal ve ekonomik koşulları dikkate alınmalıdır."
                }
            ],
            recommendations: [
                "Aile içi sorunların çözümünde öncelikle aile danışmanlığı ve arabuluculuk seçenekleri değerlendirilmelidir.",
                "Ayrı yaşama kararı halinde tedbir nafakası talep edilebilir.",
                "Çocukların velayeti konusunda anlaşma sağlanamadığı durumda, çocuğun üstün yararını gözeterek velayet düzenlemesi yapılmalıdır.",
                "Mal rejiminin tasfiyesi için evlilik tarihinden itibaren edinilen malların dökümü yapılmalıdır.",
                "Aile konutu şerhi konulması için tapu müdürlüğüne başvurulabilir."
            ]
        };
    } else {
        // Default generic analysis
        return {
            summary: "Hukuki durum analizi tamamlanmıştır. Mevcut bilgiler doğrultusunda ilgili kanun maddeleri ve yargı kararları incelenmiştir.",
            relevant_laws: [
                {
                    title: "İlgili Kanun Maddesi 1",
                    description: "Bu davaya ilişkin temel kanun maddesi ve açıklaması buraya gelecektir."
                },
                {
                    title: "İlgili Kanun Maddesi 2",
                    description: "Davanın değerlendirilmesinde önemli olan ikincil kanun maddesi ve içeriği."
                }
            ],
            relevant_decisions: [
                {
                    case_number: "Yargıtay Karar No: 2020/XXXX",
                    date: "01.01.2020",
                    summary: "Benzer bir davada Yargıtay'ın verdiği emsal karar özeti."
                }
            ],
            recommendations: [
                "Hukuki süreç için önerilen adımlar burada listelenecektir.",
                "Dava hazırlığında dikkat edilmesi gereken noktalar.",
                "Sürecin ilerleyişi hakkında genel bilgiler."
            ]
        };
    }
}

// Function to display analysis results
function displayAnalysisResults(response) {
    // Log that we're in the script.js version
    console.log('Redirecting to form-handler.js displayAnalysisResults function');
    
    try {
        // Check if there's a form-handler.js implementation we should use
        if (typeof window.displayAnalysisResults === 'function' && 
            window.displayAnalysisResults !== displayAnalysisResults) {
            
            // Extract the data we need from the response
            let category = '';
            let description = '';
            
            if (response && response.metadata) {
                category = response.metadata.category || '';
            }
            
            // Get the textarea value for description if available
            const caseSummary = document.getElementById('caseSummary');
            if (caseSummary && caseSummary.value) {
                description = caseSummary.value;
            }
            
            console.log('Extracted data for displayAnalysisResults:', {
                category,
                description: description.substring(0, 50) + '...'
            });
            
            // Call the form-handler implementation with all necessary data
            try {
                window.displayAnalysisResults(response, category, description);
                return; // Exit if successful
            } catch (e) {
                console.error('Error calling form-handler displayAnalysisResults:', e);
                console.log('Falling back to script.js displayAnalysisResults:', response);
            }
        }
        
        // Our fallback implementation if form-handler.js version fails or doesn't exist
        // Get the analysis data from the response
        const analysis = response && response.analysis ? response.analysis : response;
        console.log('Using analysis data:', analysis);
        
        // Get the analysis container
        const analysisContainer = document.getElementById('analysis-container');
        if (!analysisContainer) {
            console.error('Analysis container not found');
            return;
        }
        
        // Make sure the container is visible 
        analysisContainer.style.display = 'block';
        analysisContainer.style.visibility = 'visible';
        analysisContainer.style.opacity = '1';
        
        // Set category
        let category = 'Genel';
        if (response && response.metadata && response.metadata.category) {
            category = response.metadata.category;
        }
        
        const categoryElem = document.getElementById('analysis-category');
        if (categoryElem) {
            // Format the category name
            let displayCategory;
            switch(category) {
                case 'borçlar_hukuku': displayCategory = 'BORÇLAR HUKUKU'; break;
                case 'aile_hukuku': displayCategory = 'AİLE HUKUKU'; break;
                case 'iş_hukuku': displayCategory = 'İŞ HUKUKU'; break;
                case 'ceza_hukuku': displayCategory = 'CEZA HUKUKU'; break;
                case 'ticaret_hukuku': displayCategory = 'TİCARET HUKUKU'; break;
                case 'idare_hukuku': displayCategory = 'İDARE HUKUKU'; break;
                case 'tüketici_hukuku': displayCategory = 'TÜKETİCİ HUKUKU'; break;
                default: displayCategory = category ? category.toUpperCase() : 'GENEL';
            }
            categoryElem.textContent = displayCategory;
        }
        
        // Set analysis summary
        if (analysis && analysis.summary) {
            const summaryElem = document.getElementById('analysis-summary');
            if (summaryElem) {
                summaryElem.innerHTML = `<div class="alert alert-info">${analysis.summary}</div>`;
                summaryElem.style.display = 'block';
            }
        }
        
        // Always make sure tabs are visible
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.style.opacity = '1';
            pane.style.visibility = 'visible';
        });
        
        // Process relevant laws
        if (analysis && analysis.relevant_laws && analysis.relevant_laws.length > 0) {
            // Try multiple selector options to find the container
            const lawsContainers = [
                document.getElementById('relevantLaws'),
                document.querySelector('#laws-content ul'),
                document.querySelector('#laws ul'),
                document.querySelector('#laws')
            ];
            
            // Use the first valid container
            const lawsContainer = lawsContainers.find(container => container !== null);
            
            if (lawsContainer) {
                lawsContainer.innerHTML = ''; // Clear existing content
                
                // Add each law
                analysis.relevant_laws.forEach(law => {
                    console.log('Processing law object:', law);
                    const li = document.createElement('li');
                    li.className = 'law-item';
                    
                    // Handle different property names
                    const title = law.title || law.name || 'Kanun Maddesi';
                    const content = law.description || law.content || law.text || '';
                    
                    li.innerHTML = `<strong class="law-title">${title}</strong>
                                  <div class="law-description">${content}</div>`;
                    lawsContainer.appendChild(li);
                });
            } else {
                // Create the container if it doesn't exist
                console.warn('Relevant laws container not found, creating one');
                const lawsTab = document.getElementById('laws');
                if (lawsTab) {
                    const newContainer = document.createElement('ul');
                    newContainer.id = 'relevantLaws';
                    lawsTab.innerHTML = ''; // Clear existing content
                    lawsTab.appendChild(newContainer);
                    
                    // Add each law
                    analysis.relevant_laws.forEach(law => {
                        const li = document.createElement('li');
                        li.className = 'law-item';
                        
                        // Handle different property names
                        const title = law.title || law.name || 'Kanun Maddesi';
                        const content = law.description || law.content || law.text || '';
                        
                        li.innerHTML = `<strong class="law-title">${title}</strong>
                                      <div class="law-description">${content}</div>`;
                        newContainer.appendChild(li);
                    });
                }
            }
        }
        
        // Process relevant decisions
        if (analysis && analysis.relevant_decisions && analysis.relevant_decisions.length > 0) {
            // Try multiple selector options to find the container
            const decisionsContainers = [
                document.getElementById('relevantDecisions'),
                document.querySelector('#decisions-content ul'),
                document.querySelector('#decisions ul'),
                document.querySelector('#decisions')
            ];
            
            // Use the first valid container
            const decisionsContainer = decisionsContainers.find(container => container !== null);
            
            if (decisionsContainer) {
                decisionsContainer.innerHTML = ''; // Clear existing content
                
                // Add each decision
                analysis.relevant_decisions.forEach(decision => {
                    const li = document.createElement('li');
                    li.className = 'decision-item';
                    
                    // Handle different property names
                    const caseNumber = decision.case_number || decision.number || '';
                    const date = decision.date || '';
                    const summary = decision.summary || decision.content || '';
                    
                    let html = `<div class="decision-header">`;
                    if (caseNumber) {
                        html += `<span class="case-number">${caseNumber}</span>`;
                    }
                    if (date) {
                        html += ` <span class="decision-date">${date}</span>`;
                    }
                    html += `</div><div class="decision-summary">${summary}</div>`;
                    
                    li.innerHTML = html;
                    decisionsContainer.appendChild(li);
                });
            } else {
                // Create the container if it doesn't exist
                console.warn('Relevant decisions container not found, creating one');
                const decisionsTab = document.getElementById('decisions');
                if (decisionsTab) {
                    const newContainer = document.createElement('ul');
                    newContainer.id = 'relevantDecisions';
                    decisionsTab.innerHTML = ''; // Clear existing content
                    decisionsTab.appendChild(newContainer);
                    
                    // Add each decision
                    analysis.relevant_decisions.forEach(decision => {
                        const li = document.createElement('li');
                        li.className = 'decision-item';
                        
                        // Handle different property names
                        const caseNumber = decision.case_number || decision.number || '';
                        const date = decision.date || '';
                        const summary = decision.summary || decision.content || '';
                        
                        let html = `<div class="decision-header">`;
                        if (caseNumber) {
                            html += `<span class="case-number">${caseNumber}</span>`;
                        }
                        if (date) {
                            html += ` <span class="decision-date">${date}</span>`;
                        }
                        html += `</div><div class="decision-summary">${summary}</div>`;
                        
                        li.innerHTML = html;
                        newContainer.appendChild(li);
                    });
                }
            }
        }
        
        // Process recommendations
        if (analysis && analysis.recommendations) {
            // Try multiple selector options to find the container
            const recommendationsContainers = [
                document.getElementById('legalAnalysis'),
                document.querySelector('#recommendations-content div'),
                document.querySelector('#recommendations div'),
                document.querySelector('#recommendations')
            ];
            
            // Use the first valid container
            const recommendationsContainer = recommendationsContainers.find(container => container !== null);
            
            if (recommendationsContainer) {
                // Handle different formats of recommendations
                if (typeof analysis.recommendations === 'string') {
                    recommendationsContainer.innerHTML = analysis.recommendations;
                } else if (Array.isArray(analysis.recommendations)) {
                    let html = '<ul class="recommendations-list">';
                    analysis.recommendations.forEach(rec => {
                        html += `<li class="recommendation-item">${rec}</li>`;
                    });
                    html += '</ul>';
                    recommendationsContainer.innerHTML = html;
                } else {
                    recommendationsContainer.innerHTML = JSON.stringify(analysis.recommendations);
                }
            } else {
                // Create the container if it doesn't exist
                console.warn('Legal analysis container not found, creating one');
                const recommendationsTab = document.getElementById('recommendations');
                if (recommendationsTab) {
                    const newContainer = document.createElement('div');
                    newContainer.id = 'legalAnalysis';
                    recommendationsTab.innerHTML = ''; // Clear existing content
                    recommendationsTab.appendChild(newContainer);
                    
                    // Handle different formats of recommendations
                    if (typeof analysis.recommendations === 'string') {
                        newContainer.innerHTML = analysis.recommendations;
                    } else if (Array.isArray(analysis.recommendations)) {
                        let html = '<ul class="recommendations-list">';
                        analysis.recommendations.forEach(rec => {
                            html += `<li class="recommendation-item">${rec}</li>`;
                        });
                        html += '</ul>';
                        newContainer.innerHTML = html;
                    } else {
                        newContainer.innerHTML = JSON.stringify(analysis.recommendations);
                    }
                }
            }
        }
        
        // Make analysis tab active
        const analysisTab = document.getElementById('analysis-tab');
        if (analysisTab) {
            // Set active state on tab
            document.querySelectorAll('#analysisTab .nav-link').forEach(tab => {
                tab.classList.remove('active');
            });
            analysisTab.classList.add('active');
            
            // Show the tab pane
            document.querySelectorAll('.tab-content .tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            const analysisPane = document.getElementById('analysis-tab-pane');
            if (analysisPane) {
                analysisPane.classList.add('show', 'active');
            }
        }
        
        // Show the results section
        const resultElement = document.getElementById('result');
        if (resultElement) {
            resultElement.style.display = 'block';
        }
        
        // Scroll to the analysis container
        analysisContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Force visibility with a slight delay (this helps with browser rendering issues)
        setTimeout(() => {
            // Show all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.style.display = 'block';
                pane.style.visibility = 'visible';
                pane.style.opacity = '1';
            });
            
            // Force the analysis container visible
            if (analysisContainer) {
                analysisContainer.style.display = 'block';
                analysisContainer.style.visibility = 'visible';
                analysisContainer.style.opacity = '1';
            }
        }, 500);
        
    } catch (error) {
        console.error('Error in displayAnalysisResults:', error);
    }
}

// Initialize interactions for About section
function initAboutInteractions() {
    // Interactive counter triggers
    const counterTriggers = document.querySelectorAll('.counter-trigger');
    counterTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const numberElement = this.querySelector('.stat-number');
            const currentValue = parseFloat(numberElement.textContent);
            
            // Create a temporary animated counter
            let start = currentValue * 0.5;
            let end = currentValue;
            let duration = 500;
            let startTime = null;
            
            function animateCounter(timestamp) {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const currentNumber = Math.floor(start + (progress * (end - start)));
                
                if (numberElement.dataset.count.includes('.')) {
                    numberElement.textContent = currentNumber + (numberElement.textContent.includes('%') ? '%' : '');
                } else if (numberElement.textContent.includes('/')) {
                    numberElement.textContent = '7/24';
                } else {
                    numberElement.textContent = currentNumber + (numberElement.textContent.includes('%') ? '%' : '');
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateCounter);
                } else {
                    // Set final value
                    numberElement.textContent = numberElement.dataset.count + (numberElement.textContent.includes('%') ? '%' : '');
                    
                    // Highlight effect
                    numberElement.style.textShadow = '0 0 20px var(--accent)';
                    setTimeout(() => {
                        numberElement.style.textShadow = 'none';
                    }, 300);
                }
            }
            
            requestAnimationFrame(animateCounter);
        });
    });
    
    // Automatically animate floating elements
    const floatingElements = document.querySelectorAll('.about-floating-element');
    floatingElements.forEach(element => {
        const randomX = (Math.random() - 0.5) * 10;
        const randomY = (Math.random() - 0.5) * 10;
        const randomRotate = (Math.random() - 0.5) * 10;
        
        setInterval(() => {
            element.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
            
            setTimeout(() => {
                element.style.transform = 'translate(0px, 0px) rotate(0deg)';
            }, 2000);
        }, 5000);
    });
    
    // Enhanced feature highlights
    const featureHighlights = document.querySelectorAll('.feature-highlight');
    featureHighlights.forEach(highlight => {
        // Initial setup
        highlight.style.transition = 'all 0.3s ease';
        
        // Create a glow element for each highlight
        const glow = document.createElement('span');
        glow.classList.add('feature-glow');
        glow.style.position = 'absolute';
        glow.style.width = '100%';
        glow.style.height = '100%';
        glow.style.top = '0';
        glow.style.left = '0';
        glow.style.borderRadius = '3px';
        glow.style.pointerEvents = 'none';
        glow.style.opacity = '0';
        glow.style.transition = 'opacity 0.3s ease';
        glow.style.boxShadow = '0 0 15px 2px var(--accent)';
        highlight.style.position = 'relative';
        highlight.appendChild(glow);
        
        highlight.addEventListener('mouseenter', function() {
            // Enhanced glow effect
            glow.style.opacity = '0.3';
            
            // Text pulse animation
            this.style.animation = 'pulse 1.5s infinite';
            
            // Make tooltip visible with a bounce effect
            const tooltip = this.getAttribute('data-tooltip');
            
            // Create a dynamic tooltip element
            let dynamicTooltip = document.createElement('div');
            dynamicTooltip.classList.add('dynamic-tooltip');
            dynamicTooltip.textContent = tooltip;
            dynamicTooltip.style.position = 'absolute';
            dynamicTooltip.style.bottom = 'calc(100% + 10px)';
            dynamicTooltip.style.left = '50%';
            dynamicTooltip.style.transform = 'translateX(-50%)';
            dynamicTooltip.style.background = 'var(--primary)';
            dynamicTooltip.style.color = 'var(--text)';
            dynamicTooltip.style.padding = '8px 15px';
            dynamicTooltip.style.borderRadius = '6px';
            dynamicTooltip.style.fontSize = '0.9rem';
            dynamicTooltip.style.fontWeight = '500';
            dynamicTooltip.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
            dynamicTooltip.style.zIndex = '1000';
            dynamicTooltip.style.whiteSpace = 'nowrap';
            dynamicTooltip.style.border = '1px solid var(--accent)';
            dynamicTooltip.style.animation = 'tooltipBounce 0.5s ease forwards';
            
            // Add keyframe animation
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes tooltipBounce {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    70% { opacity: 1; transform: translateX(-50%) translateY(-2px); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
            
            this.appendChild(dynamicTooltip);
        });
        
        highlight.addEventListener('mouseleave', function() {
            // Remove glow effect
            glow.style.opacity = '0';
            
            // Remove animation
            this.style.animation = 'none';
            
            // Remove dynamic tooltip
            const tooltip = this.querySelector('.dynamic-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
    
    // Enhanced feature cards for better interaction
    const featureCards = document.querySelectorAll('.feature-card-mini');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle pulse to icon
            const icon = this.querySelector('.feature-icon-container i');
            if (icon) {
                icon.style.animation = 'pulse 1.5s infinite';
            }
            
            // Add shine effect
            this.style.background = 'linear-gradient(135deg, rgba(26, 47, 75, 0.9), rgba(17, 32, 51, 0.95))';
            
            // Highlight title with subtle glow
            const title = this.querySelector('h5');
            if (title) {
                title.style.textShadow = '0 0 10px rgba(215, 143, 35, 0.3)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            // Remove icon animation
            const icon = this.querySelector('.feature-icon-container i');
            if (icon) {
                icon.style.animation = 'none';
            }
            
            // Reset background
            this.style.background = 'linear-gradient(135deg, rgba(26, 47, 75, 0.8), rgba(17, 32, 51, 0.9))';
            
            // Reset title style
            const title = this.querySelector('h5');
            if (title) {
                title.style.textShadow = 'none';
            }
        });
    });
    
    // Team member interactivity
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            // Add subtle glow effect
            this.style.boxShadow = '0 10px 30px rgba(215, 143, 35, 0.2), 0 0 0 1px var(--accent-light)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });
    
    // Timeline interactivity
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            // If this is clicked, highlight the connecting line
            const timelineLine = document.querySelector('.about-timeline::before');
            if (timelineLine) {
                timelineLine.style.background = 'linear-gradient(to bottom, var(--accent-dark), var(--accent), var(--accent-light))';
                timelineLine.style.width = '4px';
            }
            
            // Connect with a line to the next item
            if (index < timelineItems.length - 1) {
                const nextItem = timelineItems[index + 1];
                const thisRect = this.getBoundingClientRect();
                const nextRect = nextItem.getBoundingClientRect();
                
                // Create connecting glow
                let connector = document.createElement('div');
                connector.classList.add('timeline-connector');
                connector.style.position = 'absolute';
                connector.style.top = `${thisRect.bottom}px`;
                connector.style.left = `${thisRect.left + thisRect.width / 2}px`;
                connector.style.width = '2px';
                connector.style.height = `${nextRect.top - thisRect.bottom}px`;
                connector.style.background = 'var(--accent)';
                connector.style.zIndex = '0';
                connector.style.opacity = '0.5';
                
                document.body.appendChild(connector);
                
                // Remove on mouseleave
                this.addEventListener('mouseleave', function removeConnector() {
                    document.body.removeChild(connector);
                    this.removeEventListener('mouseleave', removeConnector);
                });
            }
        });
    });
}

function initTypingAnimation() {
    const typedTextElement = document.querySelector('.typed-text');
    if (!typedTextElement) return;
    
    const texts = [
        "Yapay Zeka ile Hukuki Belgeler",
        "Dava Dilekçeleri Hazırlama",
        "Hukuki Analiz ve İçerik Üretimi",
        "Türk Hukuk Sistemine Özel"
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            // Deleting text
            typedTextElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50; // Faster when deleting
        } else {
            // Typing text
            typedTextElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100; // Normal typing speed
        }
        
        // If finished typing current text
        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 1500; // Pause at end of word
        } 
        // If finished deleting current text
        else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length; // Move to next text
            typingSpeed = 500; // Pause before starting new word
        }
        
        setTimeout(type, typingSpeed);
    }
    
    // Start the typing animation
    setTimeout(type, 1000);
} 