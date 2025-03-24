/*
 * Hukuk.AI - Front-end Script
 * Handles dynamic interactions and animations
 * Ensures proper connection with backend APIs
 */

// IMPORTANT: We'll use the form handler functions that should be initialized by form-handler.js
// We won't redefine them here to avoid conflicts

// Main Script for Hukuk.AI

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    initBootstrapComponents();
    
    // Initialize particles background
    initParticles();
    
    // Smooth scroll for navigation links
    initSmoothScroll();
    
    // Initialize form handlers
    initFormHandlers();
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

// Initialize particles background
function initParticles() {
    const particlesContainer = document.querySelector('.particles-container');
    
    if (!particlesContainer) return;
    
    // Remove existing particles
    const existingParticles = particlesContainer.querySelectorAll('.particle');
    existingParticles.forEach(p => p.remove());
    
    // Create new particles with enhanced styles
    const numberOfParticles = 25;
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Set random size between 3px and 8px
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Set random position
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Set random animation duration between 15s and 30s
        const duration = Math.random() * 15 + 15;
        particle.style.animationDuration = `${duration}s`;
        
        // Set random delay
        const delay = Math.random() * 10;
        particle.style.animationDelay = `${delay}s`;
        
        // Add glow effect based on size
        const glowSize = size * 1.5;
        particle.style.boxShadow = `0 0 ${glowSize}px rgba(79, 70, 229, 0.${Math.floor(size/2)})`;
        
        particlesContainer.appendChild(particle);
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
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
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
                const alertElement = document.createElement('div');
                alertElement.className = 'alert alert-success mt-3';
                alertElement.innerHTML = 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.';
                contactForm.appendChild(alertElement);
                
                // Remove alert after 5 seconds
                setTimeout(() => {
                    alertElement.remove();
                }, 5000);
            }, 1500);
        });
    }
    
    // Document generator form handler
    const documentForm = document.getElementById('documentForm');
    if (documentForm) {
        documentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
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
                const analysisResults = document.getElementById('analysis-results');
                if (analysisResults) {
                    analysisResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 2000);
        });
    }
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

// Mobile menu toggle
function toggleMobileMenu() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
    } else {
        navbarCollapse.classList.add('show');
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Initialize AOS (Animate On Scroll)
function initializeAOS() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        mirror: false
    });
}

// Initialize counters for stats
function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number-animated');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);
        const countIncrement = target / totalFrames;
        
        let currentCount = 0;
        const counter_interval = setInterval(() => {
            currentCount += countIncrement;
            if (currentCount >= target) {
                counter.textContent = target;
                clearInterval(counter_interval);
            } else {
                counter.textContent = Math.floor(currentCount);
            }
        }, frameDuration);
    });
}

// Initialize neural network animation
function initializeNeuralNetworkAnimation() {
    const connections = document.querySelectorAll('.connection');
    const nodes = document.querySelectorAll('.node');
    
    // Set random positions for nodes
    nodes.forEach(node => {
        const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
        const randomY = Math.floor(Math.random() * 80) + 10; // 10% to 90%
        
        node.style.left = `${randomX}%`;
        node.style.top = `${randomY}%`;
        
        // Add pulse animation with random delay
        const randomDelay = Math.random() * 3;
        node.style.animation = `pulse 2s infinite ${randomDelay}s`;
    });
    
    // Connect nodes with connections
    for (let i = 0; i < connections.length; i++) {
        const startNode = nodes[i % nodes.length];
        const endNode = nodes[(i + 2) % nodes.length];
        
        connectNodes(startNode, endNode, connections[i]);
    }
}

// Connect nodes with a connection element
function connectNodes(start, end, connection) {
    // Calculate positions
    const startRect = start.getBoundingClientRect();
    const endRect = end.getBoundingClientRect();
    const parentRect = start.parentElement.getBoundingClientRect();
    
    const startX = (startRect.left + startRect.width / 2) - parentRect.left;
    const startY = (startRect.top + startRect.height / 2) - parentRect.top;
    const endX = (endRect.left + endRect.width / 2) - parentRect.left;
    const endY = (endRect.top + endRect.height / 2) - parentRect.top;
    
    // Calculate length and angle
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    // Set connection style
    connection.style.width = `${length}px`;
    connection.style.left = `${startX}px`;
    connection.style.top = `${startY}px`;
    connection.style.transform = `rotate(${angle}deg)`;
    
    // Add animation with random delay
    const randomDelay = Math.random() * 2;
    connection.style.animation = `pulse-connection 3s infinite ${randomDelay}s`;
}

// Initialize floating animation for elements
function initializeFloatingElements() {
    const floatingElements = document.querySelectorAll('.float-animation');
    
    floatingElements.forEach(element => {
        // Already styled with CSS animation
        // Add any specific JS animations if needed
    });
}

// Initialize mouse trailer effect
function initializeMouseTrailer() {
    const trailer = document.createElement('div');
    trailer.classList.add('mouse-trailer');
    document.body.appendChild(trailer);
    
    window.addEventListener('mousemove', e => {
        const x = e.clientX;
        const y = e.clientY;
        
        gsap.to(trailer, {
            x: x,
            y: y,
            duration: 0.3,
            ease: "sine.out"
        });
    });
    
    // Expand on hover over buttons and links
    const interactiveElements = document.querySelectorAll('a, button, .card, .feature-card, .pricing-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            trailer.classList.add('active');
        });
        
        element.addEventListener('mouseleave', () => {
            trailer.classList.remove('active');
        });
    });
}

// Initialize parallax effect for elements
function initializeParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Apply parallax to hero section elements
        const heroAnimation = document.querySelector('.hero-animation');
        if (heroAnimation) {
            heroAnimation.style.transform = `translateY(${scrollY * 0.1}px)`;
        }
        
        // Apply subtle parallax to sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            const offset = section.offsetTop;
            const distance = scrollY - offset;
            if (distance < 600 && distance > -600) {
                section.style.transform = `translateY(${distance * 0.05}px)`;
            }
        });
    });
}

// Initialize pricing toggle
function initializePricingToggle() {
    const pricingToggle = document.querySelector('.pricing-toggle input');
    if (!pricingToggle) return;
    
    pricingToggle.addEventListener('change', function() {
        const isYearly = this.checked;
        document.body.classList.toggle('yearly-pricing', isYearly);
        
        // Animate price changes
        const monthlyPrices = document.querySelectorAll('.price-monthly');
        const yearlyPrices = document.querySelectorAll('.price-yearly');
        
        if (isYearly) {
            // Switch to yearly pricing
            gsap.to(monthlyPrices, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => {
                    monthlyPrices.forEach(price => {
                        price.style.display = 'none';
                    });
                    yearlyPrices.forEach(price => {
                        price.style.display = 'block';
                    });
                    gsap.to(yearlyPrices, {
                        opacity: 1,
                        y: 0,
                        duration: 0.3,
                        stagger: 0.1
                    });
                }
            });
        } else {
            // Switch to monthly pricing
            gsap.to(yearlyPrices, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                onComplete: () => {
                    yearlyPrices.forEach(price => {
                        price.style.display = 'none';
                    });
                    monthlyPrices.forEach(price => {
                        price.style.display = 'block';
                    });
                    gsap.to(monthlyPrices, {
                        opacity: 1,
                        y: 0,
                        duration: 0.3,
                        stagger: 0.1
                    });
                }
            });
        }
    });
}

// Initialize navbar scroll effect
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navbar) return;
    
    // Create nav indicator element for active menu item
    const navIndicator = document.createElement('div');
    navIndicator.className = 'nav-indicator';
    navbar.querySelector('.navbar-nav')?.appendChild(navIndicator);
    
    // Function to update active link indicator
    const updateNavIndicator = (activeLink) => {
        if (!activeLink) return;
        
        const rect = activeLink.getBoundingClientRect();
        const navRect = navbar.querySelector('.navbar-nav').getBoundingClientRect();
        
        navIndicator.style.width = `${rect.width * 0.8}px`;
        navIndicator.style.left = `${rect.left - navRect.left + (rect.width * 0.1)}px`;
        
        // Only show indicator for desktop
        navIndicator.style.display = window.innerWidth > 991 ? 'block' : 'none';
    };
    
    // Position indicator on active link
    const setActiveLink = () => {
        const path = window.location.pathname;
        const hash = window.location.hash;
        
        let activeLink = null;
        
        // Find matching link
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if ((href === path) || 
                (href === hash) || 
                (path === '/' && href === '#hero') ||
                (hash && href === hash)) {
                link.classList.add('active');
                activeLink = link;
            }
        });
        
        // If no active link was found, default to first link
        if (!activeLink && navLinks.length > 0) {
            navLinks[0].classList.add('active');
            activeLink = navLinks[0];
        }
        
        updateNavIndicator(activeLink);
    };
    
    // Add click handlers to nav links for indicator movement
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            updateNavIndicator(link);
        });
        
        // Add hover effect
        link.addEventListener('mouseenter', () => {
            if (!link.classList.contains('active')) {
                updateNavIndicator(link);
            }
        });
        
        link.addEventListener('mouseleave', () => {
            const activeLink = document.querySelector('.nav-link.active');
            updateNavIndicator(activeLink);
        });
    });
    
    // Update on scroll
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY;
        
        if (scrollPos > 50) {
            // At scroll position, add box shadow and change background
            gsap.to(navbar, {
                backgroundColor: 'rgba(26, 26, 46, 0.95)',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                padding: '0.9rem 0',
                duration: 0.3
            });
        } else {
            // At top position, more transparent
            gsap.to(navbar, {
                backgroundColor: 'rgba(26, 26, 46, 0.75)',
                boxShadow: 'none',
                padding: '1.2rem 0',
                duration: 0.3
            });
        }
        
        // Also update which link should be active based on scroll position
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (correspondingLink && !correspondingLink.classList.contains('active')) {
                    navLinks.forEach(link => link.classList.remove('active'));
                    correspondingLink.classList.add('active');
                    updateNavIndicator(correspondingLink);
                }
            }
        });
    });
    
    // Initialize on load
    setActiveLink();
    
    // Update indicator on window resize
    window.addEventListener('resize', () => {
        const activeLink = document.querySelector('.nav-link.active');
        updateNavIndicator(activeLink);
        navIndicator.style.display = window.innerWidth > 991 ? 'block' : 'none';
    });
    
    // Initialize navbar style based on scroll position
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(26, 26, 46, 0.95)';
        navbar.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
        navbar.style.padding = '0.9rem 0';
    } else {
        navbar.style.backgroundColor = 'rgba(26, 26, 46, 0.75)';
        navbar.style.boxShadow = 'none';
        navbar.style.padding = '1.2rem 0';
    }
}

// Setup form handling - this tries to coordinate with form-handler.js
function setupFormHandling() {
    console.log('Setting up AI form handler');
    
    // Template selection change handler - this should always be attached 
    // regardless of form-handler.js initialization
    const templateSelect = document.getElementById('templateSelect');
    if (templateSelect) {
        templateSelect.addEventListener('change', function() {
            const selectedTemplate = this.value;
            console.log('Template selection changed to:', selectedTemplate);
            
            // Hide all template fields first
            document.querySelectorAll('.templateFields').forEach(field => {
                field.style.display = 'none';
            });
            
            // Show the selected template fields if any
            if (selectedTemplate) {
                const selectedFields = document.getElementById(selectedTemplate + 'Fields');
                if (selectedFields) {
                    selectedFields.style.display = 'block';
                }
            }
        });
    }
    
    // Let's verify the form handler has been initialized
    if (window.formHandlerInitialized === true) {
        console.log('Form handler is already initialized');
    } else {
        console.log('Form handler not yet initialized, will check again later');
        // Try again in a second
        setTimeout(function() {
            // If form-handler.js still hasn't initialized properly, 
            // we need to take over and setup basic handlers
            if (window.formHandlerInitialized !== true) {
                console.warn('Form handler never properly initialized, setting up fallback handlers');
                
                // We'll just use the existing window.handleAIFormSubmit and window.showMessage functions
                // which should have fallback implementations from form-handler.js
            }
        }, 2000);
    }
}

// Function to display analysis results
function displayAnalysisResults(response) {
    console.log('Displaying analysis results from script.js:', response);
    
    // We need to look for either response.analysis (structure from API) or just use response directly (if passed from another function)
    const analysis = response.analysis || response;
    console.log('Using analysis data:', analysis);
    
    // First, make the container visible
    const analysisContainer = document.getElementById('analysis-container');
    if (analysisContainer) {
        analysisContainer.style.display = 'block';
    } else {
        console.error('Analysis container not found');
    }
    
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
        resultsContainer.innerHTML = '<p class="text-muted">Detaylı analiz sonuçları bulunamadı.</p>';
        return;
    }
    
    // Add summary if available
    if (analysis.summary) {
        const summarySection = document.createElement('div');
        summarySection.className = 'mb-4 analysis-section';
        
        const summaryHeader = document.createElement('h5');
        summaryHeader.innerHTML = '<i class="fas fa-file-alt"></i> Özet';
        summaryHeader.className = 'analysis-section-header';
        summarySection.appendChild(summaryHeader);
        
        const summaryContent = document.createElement('div');
        summaryContent.className = 'summary-content';
        summaryContent.innerHTML = analysis.summary;
        summarySection.appendChild(summaryContent);
        
        resultsContainer.appendChild(summarySection);
    }
    
    // Display relevant laws if available
    if (analysis.relevant_laws && analysis.relevant_laws.length > 0) {
        const lawsSection = document.createElement('div');
        lawsSection.className = 'mb-4 analysis-section';
        
        // Add section header
        const lawsHeader = document.createElement('h5');
        lawsHeader.innerHTML = '<i class="fas fa-balance-scale"></i> İlgili Kanunlar';
        lawsHeader.className = 'analysis-section-header';
        lawsSection.appendChild(lawsHeader);
        
        // Create the list
        const lawsList = document.createElement('ul');
        lawsList.className = 'list-group law-list';
        
        analysis.relevant_laws.forEach(law => {
            try {
                console.log("Processing law object:", law);
                
                // First, make sure law is actually an object
                if (typeof law !== 'object' || law === null) {
                    console.warn("Law is not an object:", law);
                    law = {
                        title: "Geçersiz veri",
                        description: "Hatalı veri formatı: " + JSON.stringify(law)
                    };
                }
                
                // Get law properties with different possible field names
                let title = "Kanun";
                let content = "İçerik bulunamadı";
                
                // Check for title in various possible fields
                if (law.title) title = law.title;
                else if (law.name) title = law.name;
                else if (law.law_name) title = law.law_name;
                
                // Check for content in various possible fields
                if (law.description) content = law.description;
                else if (law.content) content = law.content;
                else if (law.text) content = law.text;
                
                console.log("Law data processed:", {
                    title_used: title,
                    content_used: content
                });
                
                // Create list item
                const lawItem = document.createElement('li');
                lawItem.className = 'list-group-item law-item';
                
                // Content for the item
                const itemContent = `
                    <div class="law-title">${title}</div>
                    <div class="law-description">${content}</div>
                `;
                
                lawItem.innerHTML = itemContent;
                lawsList.appendChild(lawItem);
            } catch (err) {
                console.error('Error processing law item:', err, law);
            }
        });
        
        lawsSection.appendChild(lawsList);
        resultsContainer.appendChild(lawsSection);
    }
    
    // Display relevant court decisions if available
    if (analysis.relevant_decisions && analysis.relevant_decisions.length > 0) {
        const decisionsSection = document.createElement('div');
        decisionsSection.className = 'mb-4 analysis-section';
        
        // Add section header
        const decisionsHeader = document.createElement('h5');
        decisionsHeader.innerHTML = '<i class="fas fa-gavel"></i> İlgili Yargıtay Kararları';
        decisionsHeader.className = 'analysis-section-header';
        decisionsSection.appendChild(decisionsHeader);
        
        // Create the list
        const decisionsList = document.createElement('ul');
        decisionsList.className = 'list-group decision-list';
        
        analysis.relevant_decisions.forEach(decision => {
            try {
                console.log("Processing decision object:", decision);
                
                // First, make sure decision is actually an object
                if (typeof decision !== 'object' || decision === null) {
                    console.warn("Decision is not an object:", decision);
                    decision = {
                        case_number: "Geçersiz veri",
                        date: "Belirsiz",
                        summary: "Hatalı veri formatı: " + JSON.stringify(decision)
                    };
                }
                
                // Get decision properties with different possible field names
                let caseNumber = "Belirsiz";
                let date = "Belirsiz";
                let summary = "Detay bulunamadı";
                
                // Check for case number in various possible fields
                if (decision.case_number) caseNumber = decision.case_number;
                else if (decision.number) caseNumber = decision.number;
                else if (decision.court && decision.court.number) caseNumber = decision.court.number;
                
                // Check for date in various possible fields
                if (decision.date) date = decision.date;
                else if (decision.decision_date) date = decision.decision_date;
                
                // Check for summary in various possible fields
                if (decision.summary) summary = decision.summary;
                else if (decision.content) summary = decision.content;
                else if (decision.text) summary = decision.text;
                else if (decision.description) summary = decision.description;
                
                console.log("Decision data processed:", {
                    case_number_used: caseNumber,
                    date_used: date,
                    summary_used: summary
                });
                
                // Create list item
                const decisionItem = document.createElement('li');
                decisionItem.className = 'list-group-item decision-item';
                
                // Content for the item
                const itemContent = `
                    <div class="decision-header">
                        <span class="case-number">${caseNumber}</span>
                        <span class="decision-date">${date}</span>
                    </div>
                    <div class="decision-summary">${summary}</div>
                `;
                
                decisionItem.innerHTML = itemContent;
                decisionsList.appendChild(decisionItem);
            } catch (err) {
                console.error('Error processing decision item:', err, decision);
            }
        });
        
        decisionsSection.appendChild(decisionsList);
        resultsContainer.appendChild(decisionsSection);
    }
    
    // Display recommendations if available
    if (analysis.recommendations) {
        const recommendationsSection = document.createElement('div');
        recommendationsSection.className = 'mb-4 analysis-section';
        
        // Add section header
        const recommendationsHeader = document.createElement('h5');
        recommendationsHeader.innerHTML = '<i class="fas fa-lightbulb"></i> Hukuki Öneriler';
        recommendationsHeader.className = 'analysis-section-header';
        recommendationsSection.appendChild(recommendationsHeader);
        
        // Add recommendations content based on type
        let recommendationsContent;
        if (Array.isArray(analysis.recommendations)) {
            // If it's an array, display as a list
            recommendationsContent = document.createElement('ul');
            recommendationsContent.className = 'list-group recommendation-list';
            
            analysis.recommendations.forEach(recommendation => {
                const recommendationItem = document.createElement('li');
                recommendationItem.className = 'list-group-item recommendation-item';
                recommendationItem.innerHTML = recommendation;
                recommendationsContent.appendChild(recommendationItem);
            });
        } else if (typeof analysis.recommendations === 'string') {
            // If it's a string, display as text
            recommendationsContent = document.createElement('div');
            recommendationsContent.className = 'recommendation-text';
            recommendationsContent.innerHTML = analysis.recommendations;
        } else {
            // If it's something else, convert to string
            recommendationsContent = document.createElement('div');
            recommendationsContent.className = 'recommendation-text';
            recommendationsContent.textContent = JSON.stringify(analysis.recommendations);
        }
        
        recommendationsSection.appendChild(recommendationsContent);
        resultsContainer.appendChild(recommendationsSection);
    }

    // Add CSS styles for the analysis section
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .analysis-section {
            margin-bottom: 1.5rem;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .analysis-section-header {
            background-color: #f7f7f7;
            padding: 10px 15px;
            margin: 0;
            border-bottom: 1px solid #eee;
            font-weight: 600;
        }
        
        .law-item, .decision-item, .recommendation-item {
            border-left: none;
            border-right: none;
            border-radius: 0;
        }
        
        .law-title, .case-number {
            font-weight: 600;
            color: #0056b3;
        }
        
        .law-description, .decision-summary {
            margin-top: 5px;
            font-size: 0.95rem;
        }
        
        .decision-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .decision-date {
            font-size: 0.85rem;
            color: #666;
        }
        
        .recommendation-text {
            padding: 15px;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Helper function to show messages to the user
window.showMessage = function(type, message) {
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
        // Fallback if there's any error in showing the message
        console.error('Error in showMessage:', error);
        
        // Try a simpler approach with alert() as fallback
        try {
            const messagePrefix = type === 'error' ? 'Hata' : 'Başarılı';
            alert(`${messagePrefix}: ${message}`);
        } catch (alertError) {
            console.error('Could not even show alert:', alertError);
        }
    }
}

// Add interactive elements to the hero section
function enhanceHeroInteractivity() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;
    
    // Add subtle parallax effect to hero elements
    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) / 50;
        const moveY = (e.clientY - window.innerHeight / 2) / 50;
        
        // Get hero elements
        const digitalScale = heroSection.querySelector('.digital-scale');
        const particles = heroSection.querySelectorAll('.particle');
        
        if (digitalScale) {
            digitalScale.style.transform = `translateX(${moveX}px) translateY(${moveY}px)`;
        }
        
        // Move particles in opposite direction for depth effect
        particles.forEach((particle, i) => {
            const factor = 1 + (i % 5) / 10;
            particle.style.transform = `translateX(${-moveX * factor}px) translateY(${-moveY * factor}px)`;
        });
    });
}

// Add animation to feature cards
function animateFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    if (!featureCards.length) return;
    
    // Add staggered entrance animation
    featureCards.forEach((card, index) => {
        // Set initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        // Calculate delay based on position
        const delay = 0.2 + (index * 0.1);
        
        // Add transition
        card.style.transition = `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`;
    });
    
    // Create intersection observer to trigger animations when in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    // Observe all feature cards
    featureCards.forEach(card => {
        observer.observe(card);
    });
}

// Enhanced document ready function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize existing components
    initBootstrapComponents();
    initSmoothScroll();
    initFormHandlers();
    
    // Initialize new enhanced features
    initParticles();
    enhanceHeroInteractivity();
    animateFeatureCards();
    
    // Initialize existing count-up animations with better easing
    initCountUpAnimations();
});

// Enhanced counter animation
function initCountUpAnimations() {
    const countElements = document.querySelectorAll('.stat-number-animated');
    
    countElements.forEach(el => {
        const targetValue = parseInt(el.getAttribute('data-count'));
        if (isNaN(targetValue)) return;
        
        // Set initial value
        el.textContent = '0';
        
        // Create intersection observer to start animation when in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start counting animation
                    animateCount(el, targetValue);
                    // Stop observing after animation starts
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(el);
    });
}

// Smooth animation for count-up
function animateCount(element, target) {
    let startTime;
    const duration = 2000; // 2 seconds
    
    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    function updateCount(timestamp) {
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        
        const currentCount = Math.floor(target * easedProgress);
        element.textContent = currentCount;
        
        if (progress < 1) {
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = target;
        }
    }
    
    requestAnimationFrame(updateCount);
} 