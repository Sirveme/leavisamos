/**
 * CCPL - Sistema completo
 * Hojas + Luciérnagas + Mariposas + Menú + Modales
 */

console.log('🌿 CCPL Script iniciando...');

(function() {
    'use strict';

    /* DEBUG: Verificar que canvas existe */
    window.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('amazonCanvas');
        console.log('Canvas encontrado:', canvas ? 'SÍ ✓' : 'NO ✗');
        if (canvas) {
            console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
        }
    });

    /* ==========================================
       MENU FUNCTIONS
       ========================================== */
    window.toggleMenu = function() {
        const overlay = document.getElementById('menuOverlay');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeMenu = function() {
        const overlay = document.getElementById('menuOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMenu();
        }
    };

    window.focusSearch = function() {
        const searchWrapper = document.getElementById('searchWrapper');
        const searchInput = document.getElementById('searchInput');
        if (searchWrapper && searchInput) {
            searchWrapper.classList.add('active');
            setTimeout(() => searchInput.focus(), 300);
            closeMenu();
        }
    };
    /* ==========================================
       DAY/NIGHT CYCLE SYSTEM
       ========================================== */
    class DayNightCycle {
        constructor() {
            this.currentPeriod = this.getCurrentPeriod();
            this.transitionProgress = 0;
            this.isTransitioning = false;
            
            this.init();
        }

        getCurrentPeriod() {
            const hour = new Date().getHours();
            
            if (hour >= 5 && hour < 7) return 'dawn';      // 5am-7am
            if (hour >= 7 && hour < 17) return 'day';      // 7am-5pm
            if (hour >= 17 && hour < 19) return 'dusk';    // 5pm-7pm
            return 'night';                                  // 7pm-5am
        }

        getPeriodConfig(period) {
            const configs = {
                dawn: {
                    background: {
                        colors: ['rgba(26, 77, 46, 0.75)', 'rgba(255, 152, 0, 0.4)', 'rgba(108, 92, 231, 0.6)'],
                        description: 'Verde selva → Naranja amanecer → Púrpura'
                    },
                    leaves: {
                        count: { desktop: 15, mobile: 10 },
                        colors: ['#1a4d2e', '#2ecc71', '#ff9800', '#6c5ce7'],
                        opacity: [0.6, 0.8],
                        speed: 0.4
                    },
                    fireflies: {
                        count: { desktop: 8, mobile: 5 },
                        brightness: 0.5,
                        active: true
                    },
                    butterflies: {
                        count: { desktop: 2, mobile: 1 },
                        active: true
                    }
                },
                day: {
                    background: {
                        colors: ['rgba(13, 59, 33, 0.85)', 'rgba(30, 90, 61, 0.75)', 'rgba(42, 77, 124, 0.7)'],
                        description: 'Verde selva profundo → Verde medio → Azul amazónico'
                    },
                    leaves: {
                        count: { desktop: 20, mobile: 12 },
                        colors: ['#1a4d2e', '#2ecc71', '#7bed9f', '#6c5ce7', '#27ae60'],
                        opacity: [0.7, 0.9],
                        speed: 0.5
                    },
                    fireflies: {
                        count: { desktop: 0, mobile: 0 },
                        brightness: 0,
                        active: false
                    },
                    butterflies: {
                        count: { desktop: 3, mobile: 2 },
                        active: true
                    }
                },
                dusk: {
                    background: {
                        colors: ['rgba(42, 20, 50, 0.85)', 'rgba(255, 87, 34, 0.5)', 'rgba(108, 92, 231, 0.7)'],
                        description: 'Morado oscuro → Naranja atardecer → Púrpura'
                    },
                    leaves: {
                        count: { desktop: 15, mobile: 10 },
                        colors: ['#6c5ce7', '#ff5722', '#8e44ad', '#2ecc71'],
                        opacity: [0.6, 0.8],
                        speed: 0.3
                    },
                    fireflies: {
                        count: { desktop: 12, mobile: 8 },
                        brightness: 0.7,
                        active: true
                    },
                    butterflies: {
                        count: { desktop: 1, mobile: 0 },
                        active: true
                    }
                },
                night: {
                    background: {
                        colors: ['rgba(10, 31, 20, 0.95)', 'rgba(26, 58, 46, 0.9)', 'rgba(52, 31, 151, 0.85)'],
                        description: 'Casi negro verdoso → Verde oscuro → Morado profundo'
                    },
                    leaves: {
                        count: { desktop: 12, mobile: 8 },
                        colors: ['#7bed9f', '#a78bfa', '#6ee7b7', '#c084fc'],
                        opacity: [0.5, 0.7],
                        speed: 0.3
                    },
                    fireflies: {
                        count: { desktop: 20, mobile: 12 },
                        brightness: 1.0,
                        active: true
                    },
                    butterflies: {
                        count: { desktop: 0, mobile: 0 },
                        active: false
                    }
                }
            };
            
            return configs[period];
        }

        init() {
            this.updateBackground();
            this.checkPeriodically();
        }

        updateBackground() {
            const config = this.getPeriodConfig(this.currentPeriod);
            const gradient = document.querySelector('.hero-gradient');
            
            if (gradient) {
                gradient.style.background = `linear-gradient(135deg, 
                    ${config.background.colors[0]} 0%, 
                    ${config.background.colors[1]} 50%, 
                    ${config.background.colors[2]} 100%)`;
            }
        }

        checkPeriodically() {
            setInterval(() => {
                const newPeriod = this.getCurrentPeriod();
                if (newPeriod !== this.currentPeriod) {
                    console.log(`Period changed: ${this.currentPeriod} → ${newPeriod}`);
                    this.currentPeriod = newPeriod;
                    this.updateBackground();
                    
                    // Notify Amazon effect to update
                    if (window.amazonEffectInstance) {
                        window.amazonEffectInstance.updateForPeriod(newPeriod);
                    }
                }
            }, 60000); // Check every minute
        }
    }

    /* ==========================================
       AMAZON RAINFOREST EFFECT WITH DAY/NIGHT
       ========================================== */
    class AmazonEffect {
        constructor(canvas, dayNightCycle) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d', { alpha: true });
            this.dayNightCycle = dayNightCycle;
            this.leaves = [];
            this.fireflies = [];
            this.butterflies = [];
            this.wind = { x: 0, strength: 0, nextGust: Date.now() + 3000 };
            this.animationId = null;
            
            this.init();
            this.bindEvents();
        }

        init() {
            this.resize();
            this.updateForPeriod(this.dayNightCycle.currentPeriod);
            this.animate();
        }

        updateForPeriod(period) {
            const config = this.dayNightCycle.getPeriodConfig(period);
            const isMobile = window.innerWidth < 768;
            
            // Update leaves
            const leafCount = isMobile ? config.leaves.count.mobile : config.leaves.count.desktop;
            this.createLeaves(leafCount, config.leaves.colors, config.leaves.opacity, config.leaves.speed);
            
            // Update fireflies
            if (config.fireflies.active) {
                const fireflyCount = isMobile ? config.fireflies.count.mobile : config.fireflies.count.desktop;
                this.createFireflies(fireflyCount, config.fireflies.brightness);
            } else {
                this.fireflies = [];
            }
            
            // Update butterflies
            if (config.butterflies.active) {
                const butterflyCount = isMobile ? config.butterflies.count.mobile : config.butterflies.count.desktop;
                this.createButterflies(butterflyCount);
            } else {
                this.butterflies = [];
            }
            
            console.log(`Updated for ${period}:`, {
                leaves: leafCount,
                fireflies: config.fireflies.active ? (isMobile ? config.fireflies.count.mobile : config.fireflies.count.desktop) : 0,
                butterflies: config.butterflies.active ? (isMobile ? config.butterflies.count.mobile : config.butterflies.count.desktop) : 0
            });
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

        getLeafShape(type) {
            switch(type) {
                case 'elongated':
                    return { width: 15, height: 30, curve: 0.6 };
                case 'round':
                    return { width: 20, height: 20, curve: 1 };
                case 'pointed':
                    return { width: 18, height: 25, curve: 0.4 };
                case 'fern':
                    return { width: 25, height: 20, curve: 0.8, segments: 3 };
                default:
                    return { width: 18, height: 25, curve: 0.5 };
            }
        }

        createLeaves(count, colors, opacityRange, speedMultiplier) {
            const types = ['elongated', 'round', 'pointed', 'fern'];
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.leaves = [];
            for (let i = 0; i < count; i++) {
                const type = types[Math.floor(Math.random() * types.length)];
                const shape = this.getLeafShape(type);
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                this.leaves.push({
                    x: Math.random() * width,
                    y: Math.random() * height - height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() * 0.5 + 0.3) * speedMultiplier,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    type: type,
                    shape: shape,
                    color: color,
                    opacity: Math.random() * (opacityRange[1] - opacityRange[0]) + opacityRange[0],
                    sway: Math.random() * 2,
                    swaySpeed: Math.random() * 0.02 + 0.01,
                    swayOffset: Math.random() * Math.PI * 2
                });
            }
        }

        createFireflies(count, baseBrightness) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.fireflies = [];
            for (let i = 0; i < count; i++) {
                this.fireflies.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 2 + 1.5,
                    brightness: Math.random() * baseBrightness,
                    fadeSpeed: Math.random() * 0.02 + 0.01,
                    fadeDirection: Math.random() > 0.5 ? 1 : -1,
                    color: Math.random() > 0.7 ? '#ffd700' : '#7bed9f',
                    glowSize: Math.random() * 15 + 12,
                    maxBrightness: baseBrightness
                });
            }
        }

        createButterflies(count) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.butterflies = [];
            for (let i = 0; i < count; i++) {
                this.butterflies.push({
                    x: Math.random() * width,
                    y: Math.random() * height * 0.7, // Upper portion
                    vx: Math.random() * 1 + 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 8 + 12,
                    wingAngle: 0,
                    wingSpeed: Math.random() * 0.15 + 0.1,
                    color: '#00d2ff', // Morpho blue
                    flutter: 0
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
                for (let i = 0; i < shape.segments; i++) {
                    const offsetX = (i - 1) * 8;
                    this.ctx.fillStyle = leaf.color;
                    this.ctx.beginPath();
                    this.ctx.ellipse(offsetX, 0, 6, 10, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                this.ctx.fillStyle = leaf.color;
                this.ctx.beginPath();
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
                
                // Vein (nervadura)
                if (Math.random() > 0.6) {
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
            const gradient = this.ctx.createRadialGradient(
                firefly.x, firefly.y, 0,
                firefly.x, firefly.y, firefly.glowSize
            );
            
            const alpha = firefly.brightness * 0.8;
            gradient.addColorStop(0, firefly.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba('));
            gradient.addColorStop(0.3, firefly.color.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba').replace('#', 'rgba('));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(firefly.x, firefly.y, firefly.glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = firefly.color;
            this.ctx.globalAlpha = firefly.brightness;
            this.ctx.beginPath();
            this.ctx.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }

        drawButterfly(butterfly) {
            this.ctx.save();
            this.ctx.translate(butterfly.x, butterfly.y);
            
            // Wing flapping
            butterfly.wingAngle += butterfly.wingSpeed;
            const wingOpen = Math.sin(butterfly.wingAngle) * 0.5 + 0.5;
            
            // Left wing
            this.ctx.fillStyle = butterfly.color;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.ellipse(-butterfly.size * 0.3, 0, butterfly.size * wingOpen, butterfly.size * 1.2, -0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Right wing
            this.ctx.beginPath();
            this.ctx.ellipse(butterfly.size * 0.3, 0, butterfly.size * wingOpen, butterfly.size * 1.2, 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Body
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(-2, -butterfly.size, 4, butterfly.size * 2);
            
            this.ctx.restore();
        }

        updateLeaf(leaf) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            leaf.swayOffset += leaf.swaySpeed;
            const swayX = Math.sin(leaf.swayOffset) * leaf.sway;
            
            leaf.x += leaf.vx + swayX + this.wind.x;
            leaf.y += leaf.vy;
            leaf.rotation += leaf.rotationSpeed;
            
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
            
            firefly.x += firefly.vx;
            firefly.y += firefly.vy;
            
            firefly.brightness += firefly.fadeSpeed * firefly.fadeDirection;
            
            if (firefly.brightness >= firefly.maxBrightness) {
                firefly.brightness = firefly.maxBrightness;
                firefly.fadeDirection = -1;
            } else if (firefly.brightness <= 0.1) {
                firefly.brightness = 0.1;
                firefly.fadeDirection = 1;
            }
            
            if (Math.random() < 0.02) {
                firefly.vx = (Math.random() - 0.5) * 0.3;
                firefly.vy = (Math.random() - 0.5) * 0.3;
            }
            
            if (firefly.x < 0) firefly.x = width;
            if (firefly.x > width) firefly.x = 0;
            if (firefly.y < 0) firefly.y = height;
            if (firefly.y > height) firefly.y = 0;
        }

        updateButterfly(butterfly) {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            butterfly.flutter += 0.1;
            butterfly.vy = Math.sin(butterfly.flutter) * 0.3;
            
            butterfly.x += butterfly.vx;
            butterfly.y += butterfly.vy;
            
            if (butterfly.x > width + 50) {
                butterfly.x = -50;
                butterfly.y = Math.random() * height * 0.7;
            }
        }

        updateWind() {
            const now = Date.now();
            
            if (now > this.wind.nextGust) {
                this.wind.strength = Math.random() * 2 - 1;
                this.wind.nextGust = now + (Math.random() * 5000 + 3000);
            }
            
            this.wind.x += (this.wind.strength - this.wind.x) * 0.02;
        }

        animate() {
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            
            this.ctx.clearRect(0, 0, width, height);
            
            this.updateWind();
            
            this.leaves.forEach(leaf => {
                this.updateLeaf(leaf);
                this.drawLeaf(leaf);
            });
            
            this.butterflies.forEach(butterfly => {
                this.updateButterfly(butterfly);
                this.drawButterfly(butterfly);
            });
            
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
                    this.updateForPeriod(this.dayNightCycle.currentPeriod);
                }, 250);
            });

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
       UTILITY FUNCTIONS
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
       MODAL SYSTEM
       ========================================== */
    const modalData = {
        reactivacion: {
            title: '🎉 Reactiva tu colegiatura',
            content: `
                <p class="modal-text">¡Bienvenido de vuelta! El Colegio de Contadores Públicos de Loreto te invita a reactivar tu colegiatura y ser parte de nuestra comunidad profesional.</p>
                
                <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #1a4d2e; margin: 1.5rem 0;">
                    <h3 style="color: #1a4d2e; margin-bottom: 0.5rem;">💰 Cuota Mensual: S/. 20</h3>
                    <p style="color: #333; margin: 0;">La cuota más accesible del país para mantenerte activo y habilitado.</p>
                </div>
                
                <h3 style="color: #1a4d2e; margin: 1.5rem 0 1rem;">Beneficios al reactivar:</h3>
                <ul style="color: #333; line-height: 1.8; padding-left: 1.5rem;">
                    <li>Certificado de habilidad válido</li>
                    <li>Acceso a capacitaciones gratuitas</li>
                    <li>Asesoría profesional</li>
                    <li>Descuentos en eventos</li>
                    <li>Red de networking profesional</li>
                    <li>Reconocimiento en el 60° aniversario</li>
                </ul>
                
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="https://wa.me/51979169813?text=Hola,%20quiero%20reactivar%20mi%20colegiatura" 
                       target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); 
                              color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; 
                              font-weight: 700; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
                        💬 Contactar por WhatsApp
                    </a>
                </div>
            `
        },
        certificado: {
            title: '📄 Certificado de Habilidad',
            content: `
                <p class="modal-text">El Certificado de Habilidad es el documento que acredita tu condición de contador público hábil y te permite ejercer tu profesión.</p>
                
                <h3 style="color: #1a4d2e; margin: 1.5rem 0 1rem;">Requisitos:</h3>
                <ul style="color: #333; line-height: 1.8; padding-left: 1.5rem;">
                    <li>Estar al día en el pago de cuotas mensuales</li>
                    <li>No tener sanciones vigentes</li>
                    <li>Haber actualizado tus datos</li>
                </ul>
                
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #d4af37;">
                    <h3 style="color: #856404; margin-bottom: 0.5rem;">⚡ Emisión inmediata</h3>
                    <p style="color: #856404; margin: 0;">Una vez verificado tu estado de cuenta, tu certificado estará listo en minutos.</p>
                </div>
                
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="https://wa.me/51979169813?text=Necesito%20mi%20certificado%20de%20habilidad" 
                       target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #1a4d2e 0%, #2d7a4f 100%); 
                              color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; 
                              font-weight: 700; box-shadow: 0 4px 12px rgba(26, 77, 46, 0.3);">
                        Solicitar Certificado
                    </a>
                </div>
            `
        },
        pagos: {
            title: '💳 Realizar Pago',
            content: `
                <p class="modal-text">Mantente al día con tu cuota mensual de S/. 20 y disfruta de todos los beneficios de estar colegiado.</p>
                
                <h3 style="color: #1a4d2e; margin: 1.5rem 0 1rem;">Métodos de pago:</h3>
                
                <div style="display: grid; gap: 1rem; margin: 1.5rem 0;">
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 2px solid #dee2e6;">
                        <h4 style="color: #1a4d2e; margin-bottom: 0.5rem;">🏦 Transferencia Bancaria</h4>
                        <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">BCP - Cuenta Corriente Soles</p>
                        <p style="color: #333; font-weight: 700; font-family: monospace;">123-456789-0-12</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; border: 2px solid #dee2e6;">
                        <h4 style="color: #1a4d2e; margin-bottom: 0.5rem;">📱 Yape / Plin</h4>
                        <p style="color: #333; font-weight: 700; font-family: monospace;">979 169 813</p>
                    </div>
                </div>
                
                <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #1a4d2e;">
                    <p style="color: #1a4d2e; margin: 0; font-weight: 600;">📸 Envía tu voucher por WhatsApp al +51 979 169 813</p>
                </div>
                
                <div style="margin-top: 2rem; text-align: center;">
                    <a href="https://wa.me/51979169813?text=Hola,%20quiero%20pagar%20mi%20cuota" 
                       target="_blank"
                       style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); 
                              color: #000; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; 
                              font-weight: 700; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);">
                        Enviar Voucher
                    </a>
                </div>
            `
        },
        voice: {
            title: '🎤 Comando de Voz',
            content: `
                <div style="text-align: center; padding: 2rem 0;">
                    <div style="width: 120px; height: 120px; margin: 0 auto 2rem; 
                                background: linear-gradient(135deg, #1a4d2e 0%, #2d7a4f 100%);
                                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                                box-shadow: 0 8px 32px rgba(26, 77, 46, 0.3);">
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" y1="19" x2="12" y2="23"/>
                            <line x1="8" y1="23" x2="16" y2="23"/>
                        </svg>
                    </div>
                    
                    <h3 style="color: #1a4d2e; margin-bottom: 1rem;">Próximamente disponible</h3>
                    <p style="color: #666; margin-bottom: 2rem;">Podrás interactuar con el sistema usando tu voz</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
                    <h4 style="color: #1a4d2e; margin-bottom: 1rem;">Ejemplos de comandos:</h4>
                    <ul style="color: #666; line-height: 2; list-style: none; padding: 0;">
                        <li>🔍 "Buscar contador Juan Pérez"</li>
                        <li>💰 "¿Cuánto debo?"</li>
                        <li>📄 "Descargar mi certificado"</li>
                        <li>📞 "Horario de atención"</li>
                        <li>❓ "Preguntas frecuentes"</li>
                    </ul>
                </div>
                
                <p style="text-align: center; color: #999; font-size: 0.875rem; margin-top: 2rem;">
                    Esta función estará disponible en la Fase 2 del desarrollo
                </p>
            `
        }
    };

    window.openModal = function(type) {
        const overlay = document.getElementById('modalOverlay');
        const content = document.getElementById('modalContent');
        const data = modalData[type];
        
        if (!data) return;
        
        content.innerHTML = `
            <h2 class="modal-title">${data.title}</h2>
            ${data.content}
        `;
        
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    /* ==========================================
       SEARCH SYSTEM
       ========================================== */
    const searchToggle = document.getElementById('searchToggle');
    const searchWrapper = document.getElementById('searchWrapper');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    // Mock data - Replace with real API call
    const contadores = [
        { name: 'Juan Carlos Pérez García', status: 'Hábil', cpp: '00123' },
        { name: 'María Elena Rodríguez López', status: 'Hábil', cpp: '00456' },
        { name: 'Carlos Alberto Vargas Ruiz', status: 'Inhábil', cpp: '00789' },
        { name: 'Ana Patricia Flores Castro', status: 'Hábil', cpp: '01012' },
        { name: 'Roberto Miguel Sánchez Torres', status: 'Hábil', cpp: '01345' }
    ];

    searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        searchWrapper.classList.toggle('active');
        if (searchWrapper.classList.contains('active')) {
            searchInput.focus();
        }
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (query.length < 2) {
            searchResults.classList.remove('has-results');
            searchResults.innerHTML = '';
            return;
        }
        
        const results = contadores.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.cpp.includes(query)
        );
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #666;">
                    No se encontraron resultados
                </div>
            `;
            searchResults.classList.add('has-results');
            return;
        }
        
        searchResults.innerHTML = results.map(c => `
            <div class="search-result-item">
                <div class="search-result-name">${c.name}</div>
                <div class="search-result-status">
                    CPP: ${c.cpp} • 
                    <span style="color: ${c.status === 'Hábil' ? '#1a4d2e' : '#c41e3a'}; font-weight: 600;">
                        ${c.status}
                    </span>
                </div>
            </div>
        `).join('');
        
        searchResults.classList.add('has-results');
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchToggle.contains(e.target) && !searchWrapper.contains(e.target)) {
            searchWrapper.classList.remove('active');
            searchResults.classList.remove('has-results');
        }
    });

    /* ==========================================
       LOGO EASTER EGG
       ========================================== */
    let logoClickCount = 0;
    let logoClickTimer = null;

    document.getElementById('heroLogo').addEventListener('click', () => {
        logoClickCount++;
        
        if (logoClickTimer) {
            clearTimeout(logoClickTimer);
        }
        
        if (logoClickCount === 5) {
            openModal('reactivacion');
            logoClickCount = 0;
        } else {
            logoClickTimer = setTimeout(() => {
                logoClickCount = 0;
            }, 2000);
        }
    });

    /* ==========================================
       NOTIFICATION BADGE
       ========================================== */
    // Show notification after 3 seconds (example)
    setTimeout(() => {
        const badge = document.getElementById('notificationBadge');
        badge.classList.add('active');
        
        badge.addEventListener('click', () => {
            openModal('reactivacion');
            badge.classList.remove('active');
        });
    }, 3000);

    /* ==========================================
       INITIALIZATION
       ========================================== */
    function init() {
        requestAnimationFrame(() => {
            // Initialize day/night cycle
            const dayNightCycle = new DayNightCycle();
            
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
                window.amazonEffectInstance = new AmazonEffect(amazonCanvas, dayNightCycle);
            }

            new Navbar();
            new ScrollAnimations();
            initSmoothScroll();
            initLazyLoading();
            initStatsCounter();
            
            // Log current period
            const hour = new Date().getHours();
            console.log(`🌿 CCPL Amazon Effect initialized at ${hour}:00 - Period: ${dayNightCycle.currentPeriod}`);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.CCPL = {
        AmazonEffect,
        DayNightCycle,
        ScrollAnimations,
        Navbar
    };

})();

// Funciones para top bar
window.openSearchModal = function() {
    document.getElementById('searchModal').classList.add('active');
    setTimeout(() => document.getElementById('searchInputModal').focus(), 300);
};

window.closeSearchModal = function() {
    document.getElementById('searchModal').classList.remove('active');
};

// Cerrar modal búsqueda con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const searchModal = document.getElementById('searchModal');
        if (searchModal) searchModal.classList.remove('active');
    }
});