// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initHeader();
    initModals();
    initBottomNav();
    initVoiceSearch();
    initScrollAnimations();
});

// Header scroll behavior
function initHeader() {
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });

    // Menu button
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            // TODO: Implementar menú móvil si se requiere
            console.log('Menu clicked');
        });
    }
}

// Modals
function initModals() {
    const modals = {
        consultas: document.getElementById('consultasModal'),
        directivos: document.getElementById('directivosModal'),
        transparencia: null // Se puede agregar después
    };

    // Abrir modales desde botones de navegación
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalName = btn.getAttribute('data-modal');
            if (modals[modalName]) {
                openModal(modals[modalName]);
            }
        });
    });

    // Botón consultas
    const consultasBtn = document.getElementById('consultasBtn');
    if (consultasBtn) {
        consultasBtn.addEventListener('click', () => {
            openModal(modals.consultas);
        });
    }

    // Cerrar modales
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Cerrar al hacer clic en overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            closeAllModals();
        });
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// Bottom Navigation
function initBottomNav() {
    const reactivateBtn = document.getElementById('reactivateBtn');
    
    if (reactivateBtn) {
        reactivateBtn.addEventListener('click', () => {
            // Scroll suave a sección de reactivación o redirigir
            const reactivateSection = document.getElementById('reactivate');
            if (reactivateSection) {
                reactivateSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Redirigir a página de reactivación
                window.location.href = '/colegiados/';
            }
        });
    }

    // Destacar botón activo según scroll
    const navItems = document.querySelectorAll('.nav-item');
    window.addEventListener('scroll', () => {
        const scrollPos = window.pageYOffset;
        
        navItems.forEach(item => {
            item.classList.remove('active');
        });
    });
}

// Voice Search
function initVoiceSearch() {
    const voiceBtn = document.getElementById('voiceBtn');
    const searchInput = document.querySelector('.search-input');
    
    if (!voiceBtn || !searchInput) return;

    // Verificar si el navegador soporta reconocimiento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.log('Reconocimiento de voz no soportado');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('active');
        recognition.start();
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.classList.remove('active');
        
        // Procesar búsqueda
        processSearch(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        voiceBtn.classList.remove('active');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('active');
    };

    // Quick queries
    document.querySelectorAll('.query-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.textContent;
            searchInput.value = query;
            processSearch(query);
        });
    });

    // Enter en input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processSearch(searchInput.value);
        }
    });
}

function processSearch(query) {
    console.log('Procesando búsqueda:', query);
    
    // Aquí iría la lógica de búsqueda con HTMX
    // Por ahora, simulamos un resultado
    
    const searchResults = {
        'estado de colegiatura': '/consulta-de-habilidad/',
        'requisitos para colegiarse': '/colegiados/',
        'alquiler de ambientes': '/alquiler-de-ambientes/',
        'próximos eventos': '/#eventos',
        'comunicados recientes': '/#comunicados',
        'directivos actuales': '/consejo-directivo/'
    };

    const queryLower = query.toLowerCase();
    
    for (const [key, url] of Object.entries(searchResults)) {
        if (queryLower.includes(key)) {
            window.location.href = url;
            return;
        }
    }
    
    // Si no hay coincidencia exacta, mostrar resultados generales
    alert(`Buscando: "${query}"`);
}

// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observar elementos que queremos animar
    document.querySelectorAll('.stat-card, .service-card').forEach(el => {
        observer.observe(el);
    });
}

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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

// Parallax effect para hero (si se usa hero-parallax)
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-layer');
    
    parallaxElements.forEach((el, index) => {
        const speed = (index + 1) * 0.2;
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Particle animation para hero-particles
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 100;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        
        draw() {
            ctx.fillStyle = `rgba(212, 175, 55, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Conectar partículas cercanas
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 * (1 - distance / 100)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Llamar a initParticles si existe el canvas
if (document.getElementById('particlesCanvas')) {
    initParticles();
}

// Performance: Lazy loading para imágenes
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});

// Utility: Detectar si es móvil
function isMobile() {
    return window.innerWidth <= 768;
}

// Utility: Formatear números
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Exportar funciones útiles para HTMX
window.ccplUtils = {
    openModal,
    closeAllModals,
    processSearch,
    isMobile,
    formatNumber
};