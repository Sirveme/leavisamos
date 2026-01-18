/**
 * CCPL - Colegio de Contadores Públicos de Loreto
 * Modern JavaScript with Performance Optimization
 */

(function() {
    'use strict';

    /* ==========================================
       PARTICLES ANIMATION - Ultra Optimized
       ========================================== */
    class ParticlesAnimation {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: true });
            this.particles = [];
            this.particleCount = this.getParticleCount();
            this.mouse = { x: 0, y: 0, radius: 150 };
            this.animationId = null;
            
            this.init();
            this.bindEvents();
        }

        getParticleCount() {
            const width = window.innerWidth;
            if (width > 1920) return 80;
            if (width > 1024) return 60;
            if (width > 768) return 40;
            return 30;
        }

        init() {
            this.resize();
            this.createParticles();
            this.animate();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticles() {
            this.particles = [];
            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2
                });
            }
        }

        drawParticle(particle) {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.fill();
        }

        connectParticles(p1, p2, distance) {
            const maxDistance = 150;
            if (distance < maxDistance) {
                const opacity = (1 - distance / maxDistance) * 0.3;
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        }

        updateParticle(particle) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Mouse interaction
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                particle.vx -= Math.cos(angle) * force * 0.2;
                particle.vy -= Math.sin(angle) * force * 0.2;
            }

            // Boundary check
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

            // Velocity dampening
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw particles
            this.particles.forEach((particle, i) => {
                this.updateParticle(particle);
                this.drawParticle(particle);

                // Connect nearby particles
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = particle.x - p2.x;
                    const dy = particle.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        this.connectParticles(particle, p2, distance);
                    }
                }
            });

            this.animationId = requestAnimationFrame(() => this.animate());
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.particleCount = this.getParticleCount();
                this.createParticles();
            });

            this.canvas.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            this.canvas.addEventListener('mouseleave', () => {
                this.mouse.x = 0;
                this.mouse.y = 0;
            });
        }

        destroy() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }
        }
    }

    /* ==========================================
       COUNTER ANIMATION
       ========================================== */
    function animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = Math.floor(target);
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    /* ==========================================
       SCROLL ANIMATIONS
       ========================================== */
    class ScrollAnimations {
        constructor() {
            this.elements = document.querySelectorAll('[data-animate]');
            this.options = {
                root: null,
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animate-in');
                            this.observer.unobserve(entry.target);
                        }
                    });
                }, this.options);

                this.elements.forEach(el => this.observer.observe(el));
            } else {
                // Fallback for older browsers
                this.elements.forEach(el => el.classList.add('animate-in'));
            }
        }
    }

    /* ==========================================
       NAVBAR FUNCTIONALITY
       ========================================== */
    class Navbar {
        constructor() {
            this.navbar = document.getElementById('navbar');
            this.navToggle = document.getElementById('navToggle');
            this.navMenu = document.getElementById('navMenu');
            this.navLinks = document.querySelectorAll('.nav-link');
            
            this.init();
        }

        init() {
            this.handleScroll();
            this.bindEvents();
        }

        handleScroll() {
            let lastScroll = 0;
            
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > 100) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
                
                lastScroll = currentScroll;
            });
        }

        bindEvents() {
            // Mobile menu toggle
            this.navToggle.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.toggleMenuIcon();
            });

            // Close menu when clicking a link
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.navMenu.classList.contains('active')) {
                        this.navMenu.classList.remove('active');
                        this.toggleMenuIcon();
                    }
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.navbar.contains(e.target) && this.navMenu.classList.contains('active')) {
                    this.navMenu.classList.remove('active');
                    this.toggleMenuIcon();
                }
            });
        }

        toggleMenuIcon() {
            const spans = this.navToggle.querySelectorAll('span');
            spans[0].style.transform = this.navMenu.classList.contains('active') 
                ? 'rotate(45deg) translateY(8px)' 
                : 'none';
            spans[1].style.opacity = this.navMenu.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = this.navMenu.classList.contains('active') 
                ? 'rotate(-45deg) translateY(-8px)' 
                : 'none';
        }
    }

    /* ==========================================
       SMOOTH SCROLL
       ========================================== */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /* ==========================================
       LAZY LOADING IMAGES
       ========================================== */
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /* ==========================================
       STATS COUNTER
       ========================================== */
    function initStatsCounter() {
        const statNumbers = document.querySelectorAll('.stat-number[data-count]');
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        const target = parseInt(entry.target.getAttribute('data-count'));
                        animateCounter(entry.target, target);
                        entry.target.classList.add('counted');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            statNumbers.forEach(stat => observer.observe(stat));
        } else {
            // Fallback
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                stat.textContent = target;
            });
        }
    }

    /* ==========================================
       PERFORMANCE OPTIMIZATION
       ========================================== */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /* ==========================================
       INITIALIZATION
       ========================================== */
    function init() {
        // Initialize particles animation
        const particlesCanvas = document.getElementById('particlesCanvas');
        if (particlesCanvas) {
            new ParticlesAnimation(particlesCanvas);
        }

        // Initialize navbar
        new Navbar();

        // Initialize scroll animations
        new ScrollAnimations();

        // Initialize smooth scroll
        initSmoothScroll();

        // Initialize lazy loading
        initLazyLoading();

        // Initialize stats counter
        initStatsCounter();

        // Performance logging (remove in production)
        if (window.performance) {
            window.addEventListener('load', () => {
                const perfData = window.performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`Page loaded in ${pageLoadTime}ms`);
            });
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ==========================================
       EXPORT FOR EXTERNAL USE (if needed)
       ========================================== */
    window.CCPL = {
        ParticlesAnimation,
        ScrollAnimations,
        Navbar
    };

})();