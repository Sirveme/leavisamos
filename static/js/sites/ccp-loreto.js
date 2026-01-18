/**
 * CCPL - Colegio de Contadores Públicos de Loreto
 * Amazon Rainforest Effect: Hojas + Luciérnagas
 * Inspired by Iquitos, Loreto - Amazonía Peruana
 */

(function() {
    'use strict';

    /* ==========================================
       AMAZON RAINFOREST ANIMATION
       ========================================== */
    class AmazonEffect {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: true });
            this.leaves = [];
            this.fireflies = [];
            this.leafCount = this.getLeafCount();
            this.fireflyCount = this.getFireflyCount();
            this.wind = { x: 0, strength: 0, nextGust: Date.now() + 3000 };
            this.animationId = null;
            
            this.init();
            this.bindEvents();
        }

        getLeafCount() {
            const width = window.innerWidth;
            if (width > 1920) return 20;
            if (width > 1024) return 15;
            if (width > 768) return 12;
            return 10;
        }

        getFireflyCount() {
            const width = window.innerWidth;
            if (width > 1024) return 12;
            if (width > 768) return 8;
            return 6;
        }

        init() {
            this.resize();
            this.createLeaves();
            this.createFireflies();
            this.animate();
        }

        resize() {
            const hero = document.querySelector('.hero');
            const width = hero ? hero.offsetWidth : window.innerWidth;
            const height = hero ? hero.offsetHeight : window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.ctx.scale(dpr, dpr);
        }

        // Leaf shapes (organic forms)
        getLeafShape(type) {
            switch(type) {
                case 'elongated': // Hoja alargada tipo helecho
                    return { width: 15, height: 30, curve: 0.6 };
                case 'round': // Hoja redonda
                    return { width: 20, height: 20, curve: 1 };
                case 'pointed': // Hoja puntiaguda
                    return { width: 18, height: 25, curve: 0.4 };
                case 'fern': // Tipo helecho compuesto
                    return { width: 25, height: 20, curve: 0.8, segments: 3 };
                default:
                    return { width: 18, height: 25, curve: 0.5 };
            }
        }

        // Amazon color palette
        getLeafColor() {
            const colors = [
                '#1a4d2e', // Verde oscuro selva
                '#2ecc71', // Verde esmeralda
                '#7bed9f', // Verde lima
                '#6c5ce7', // Púrpura amazónico
                '#341f97', // Morado profundo
                '#27ae60', // Verde intermedio
                '#8e44ad', // Morado claro
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        createLeaves() {
            const types = ['elongated', 'round', 'pointed', 'fern'];
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.leaves = [];
            for (let i = 0; i < this.leafCount; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const shape = this.getLeafShape(type);
                
                this.leaves.push({
                    x: Math.random() * width,
                    y: Math.random() * height - height, // Start above screen
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: Math.random() * 0.5 + 0.3, // Fall speed
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    type: type,
                    shape: shape,
                    color: this.getLeafColor(),
                    opacity: Math.random() * 0.3 + 0.6,
                    sway: Math.random() * 2, // Horizontal sway
                    swaySpeed: Math.random() * 0.02 + 0.01,
                    swayOffset: Math.random() * Math.PI * 2
                });
            }
        }

        createFireflies() {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.fireflies = [];
            for (let i = 0; i < this.fireflyCount; i++) {
                this.fireflies.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 1,
                    brightness: Math.random(),
                    fadeSpeed: Math.random() * 0.02 + 0.01,
                    fadeDirection: Math.random() > 0.5 ? 1 : -1,
                    color: Math.random() > 0.7 ? '#ffd700' : '#7bed9f', // Dorado o verde
                    glowSize: Math.random() * 15 + 10
                });
            }
        }

        drawLeaf(leaf) {
            this.ctx.save();
            this.ctx.translate(leaf.x, leaf.y);
            this.ctx.rotate(leaf.rotation);
            this.ctx.globalAlpha = leaf.opacity;
            
            const shape = leaf.shape;
            
            if (leaf.type === 'fern') {
                // Hoja compuesta tipo helecho
                for (let i = 0; i < shape.segments; i++) {
                    const offsetX = (i - 1) * 8;
                    this.ctx.fillStyle = leaf.color;
                    this.ctx.beginPath();
                    this.ctx.ellipse(offsetX, 0, 6, 10, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // Hoja simple
                this.ctx.fillStyle = leaf.color;
                this.ctx.beginPath();
                
                // Forma orgánica usando curvas
                this.ctx.moveTo(0, -shape.height / 2);
                this.ctx.bezierCurveTo(
                    shape.width / 2, -shape.height / 2 * shape.curve,
                    shape.width / 2, shape.height / 2 * shape.curve,
                    0, shape.height / 2
                );
                this.ctx.bezierCurveTo(
                    -shape.width / 2, shape.height / 2 * shape.curve,
                    -shape.width / 2, -shape.height / 2 * shape.curve,
                    0, -shape.height / 2
                );
                this.ctx.closePath();
                this.ctx.fill();
                
                // Nervadura central (ocasional)
                if (Math.random() > 0.7) {
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -shape.height / 2);
                    this.ctx.lineTo(0, shape.height / 2);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        }

        drawFirefly(firefly) {
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                firefly.x, firefly.y, 0,
                firefly.x, firefly.y, firefly.glowSize
            );
            
            const alpha = firefly.brightness * 0.6;
            gradient.addColorStop(0, firefly.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
            gradient.addColorStop(0.5, firefly.color.replace(')', `, ${alpha * 0.3})`).replace('rgb', 'rgba'));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(firefly.x, firefly.y, firefly.glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Núcleo brillante
            this.ctx.fillStyle = firefly.color;
            this.ctx.globalAlpha = firefly.brightness;
            this.ctx.beginPath();
            this.ctx.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        updateLeaf(leaf) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            // Sway motion (balanceo horizontal)
            leaf.swayOffset += leaf.swaySpeed;
            const swayX = Math.sin(leaf.swayOffset) * leaf.sway;
            
            // Update position with wind
            leaf.x += leaf.vx + swayX + this.wind.x;
            leaf.y += leaf.vy;
            
            // Rotation
            leaf.rotation += leaf.rotationSpeed;
            
            // Reset when out of bounds
            if (leaf.y > height + 50) {
                leaf.y = -50;
                leaf.x = Math.random() * width;
            }
            
            if (leaf.x < -50) leaf.x = width + 50;
            if (leaf.x > width + 50) leaf.x = -50;
        }

        updateFirefly(firefly) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            // Update position
            firefly.x += firefly.vx;
            firefly.y += firefly.vy;
            
            // Fade in/out
            firefly.brightness += firefly.fadeSpeed * firefly.fadeDirection;
            
            if (firefly.brightness >= 1) {
                firefly.brightness = 1;
                firefly.fadeDirection = -1;
            } else if (firefly.brightness <= 0.1) {
                firefly.brightness = 0.1;
                firefly.fadeDirection = 1;
            }
            
            // Random direction change
            if (Math.random() < 0.02) {
                firefly.vx = (Math.random() - 0.5) * 0.3;
                firefly.vy = (Math.random() - 0.5) * 0.3;
            }
            
            // Wrap around
            if (firefly.x < 0) firefly.x = width;
            if (firefly.x > width) firefly.x = 0;
            if (firefly.y < 0) firefly.y = height;
            if (firefly.y > height) firefly.y = 0;
        }

        updateWind() {
            const now = Date.now();
            
            // Wind gust every 3-8 seconds
            if (now > this.wind.nextGust) {
                this.wind.strength = Math.random() * 2 - 1;
                this.wind.nextGust = now + (Math.random() * 5000 + 3000);
            }
            
            // Smooth wind transition
            this.wind.x += (this.wind.strength - this.wind.x) * 0.02;
        }

        animate() {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.ctx.clearRect(0, 0, width, height);
            
            // Update wind
            this.updateWind();
            
            // Draw and update leaves
            this.leaves.forEach(leaf => {
                this.updateLeaf(leaf);
                this.drawLeaf(leaf);
            });
            
            // Draw and update fireflies
            this.fireflies.forEach(firefly => {
                this.updateFirefly(firefly);
                this.drawFirefly(firefly);
            });
            
            this.animationId = requestAnimationFrame(() => this.animate());
        }

        bindEvents() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.resize();
                    this.leafCount = this.getLeafCount();
                    this.fireflyCount = this.getFireflyCount();
                    this.createLeaves();
                    this.createFireflies();
                }, 250);
            });

            // Pause when tab not visible (save resources)
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                } else {
                    if (!this.animationId) {
                        this.animate();
                    }
                }
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
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > 100) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }
            });
        }

        bindEvents() {
            this.navToggle.addEventListener('click', () => {
                this.navMenu.classList.toggle('active');
                this.toggleMenuIcon();
            });

            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.navMenu.classList.contains('active')) {
                        this.navMenu.classList.remove('active');
                        this.toggleMenuIcon();
                    }
                });
            });

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
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                stat.textContent = target;
            });
        }
    }

    /* ==========================================
       INITIALIZATION
       ========================================== */
    function init() {
        requestAnimationFrame(() => {
            // Initialize Amazon effect
            const amazonCanvas = document.getElementById('amazonCanvas');
            if (amazonCanvas) {
                const hero = document.querySelector('.hero');
                if (hero) {
                    const dpr = window.devicePixelRatio || 1;
                    const width = hero.offsetWidth;
                    const height = hero.offsetHeight;
                    
                    amazonCanvas.width = width * dpr;
                    amazonCanvas.height = height * dpr;
                    amazonCanvas.style.width = width + 'px';
                    amazonCanvas.style.height = height + 'px';
                }
                new AmazonEffect(amazonCanvas);
            }

            new Navbar();
            new ScrollAnimations();
            initSmoothScroll();
            initLazyLoading();
            initStatsCounter();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.CCPL = {
        AmazonEffect,
        ScrollAnimations,
        Navbar
    };

})();