document.addEventListener("DOMContentLoaded", () => {
    const hasGsap = typeof gsap !== 'undefined';
    const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
    let lenis = null;

    if (hasGsap && hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Lenis smooth scroll
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 0.95,
            smoothTouch: false,
            touchMultiplier: 1.7,
            infinite: false,
        });

        if (hasScrollTrigger) {
            lenis.on('scroll', ScrollTrigger.update);
        }

        if (hasGsap) {
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        }
    }

    // 2. Scroll progress bar
    const scrollProgress = document.querySelector('.scroll-progress');
    const updateScrollProgress = () => {
        if (!scrollProgress) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };
    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    // 2B. Minimal custom cursor with trailing ring
    const cursor = document.querySelector('.custom-cursor');
    const cursorTrail = document.querySelector('.cursor-trail');
    const cursorTargets = 'a, button, .atelier-card, .team-member, .register-card, .contact-card';

    if (window.matchMedia('(pointer: fine)').matches && cursor && cursorTrail) {
        document.body.classList.add('cursor-ready');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let dotX = mouseX, dotY = mouseY;
        let trailX = mouseX, trailY = mouseY;

        document.addEventListener('mousemove', (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
            cursor.classList.add('visible');
            cursorTrail.classList.add('visible');
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            cursor.classList.remove('visible');
            cursorTrail.classList.remove('visible');
        });

        document.addEventListener('mouseover', (event) => {
            if (event.target.closest(cursorTargets)) {
                cursor.classList.add('hover');
                cursorTrail.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (event) => {
            if (event.target.closest(cursorTargets)) {
                cursor.classList.remove('hover');
                cursorTrail.classList.remove('hover');
            }
        });

        const renderCursor = () => {
            dotX += (mouseX - dotX) * 0.35;
            dotY += (mouseY - dotY) * 0.35;
            trailX += (mouseX - trailX) * 0.14;
            trailY += (mouseY - trailY) * 0.14;

            cursor.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            cursorTrail.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%)`;

            requestAnimationFrame(renderCursor);
        };

        renderCursor();
    }

    // 2C. Cursor text label (shows on elements with data-cursor-text)
    const cursorText = document.querySelector('.cursor-text');

    if (window.matchMedia('(pointer: fine)').matches && cursorText) {
        let textX = window.innerWidth / 2;
        let textY = window.innerHeight / 2;
        let curX = textX, curY = textY;

        document.addEventListener('mousemove', (event) => {
            textX = event.clientX;
            textY = event.clientY;
        }, { passive: true });

        document.addEventListener('mouseover', (event) => {
            const target = event.target.closest('[data-cursor-text]');
            if (target) {
                cursorText.textContent = target.getAttribute('data-cursor-text');
                cursorText.classList.add('visible');
            }
        });

        document.addEventListener('mouseout', (event) => {
            if (event.target.closest('[data-cursor-text]')) {
                cursorText.classList.remove('visible');
            }
        });

        const renderCursorText = () => {
            curX += (textX - curX) * 0.2;
            curY += (textY - curY) * 0.2;
            cursorText.style.transform = `translate3d(${curX}px, ${curY - 42}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(renderCursorText);
        };
        renderCursorText();
    }

    // 2D. Glowing spotlight that follows the pointer inside each block
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.atelier-card, .competition-card, .pricing-card').forEach(block => {
            block.addEventListener('pointermove', (event) => {
                const rect = block.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                block.style.setProperty('--spot-x', `${x}%`);
                block.style.setProperty('--spot-y', `${y}%`);
            });
        });
    }

    // 2E. Team scene touch and hover handlers
    const teamScene = document.getElementById('teamScene');
    const cursorTextEl = document.querySelector('.cursor-text');
    let activeTouchTarget = null;
    let activeTouchZone = null;

    const showTouchLabel = (zone) => {
        if (!cursorTextEl) return;
        const rect = zone.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        cursorTextEl.textContent = zone.getAttribute('data-cursor-text') || '';
        cursorTextEl.style.transform = `translate3d(${x}px, ${y - 18}px, 0) translate(-50%, -50%)`;
        cursorTextEl.classList.add('visible');
    };

    const hideTouchLabel = () => {
        if (cursorTextEl) cursorTextEl.classList.remove('visible');
    };

    document.querySelectorAll('.hitzone').forEach(zone => {
        const targetId = zone.getAttribute('data-target');
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target) return;

        zone.addEventListener('mouseenter', () => {
            target.classList.add('hovered');
        });
        zone.addEventListener('mouseleave', () => {
            target.classList.remove('hovered');
        });

        zone.addEventListener('touchstart', (event) => {
            event.stopPropagation();
            if (activeTouchTarget && activeTouchTarget !== target) {
                activeTouchTarget.classList.remove('hovered');
            }
            const alreadyActive = target.classList.contains('hovered');
            target.classList.toggle('hovered', !alreadyActive);

            if (alreadyActive) {
                activeTouchTarget = null;
                activeTouchZone = null;
                hideTouchLabel();
            } else {
                activeTouchTarget = target;
                activeTouchZone = zone;
                showTouchLabel(zone);
            }
        }, { passive: true });
    });

    if (teamScene) {
        document.addEventListener('touchstart', (event) => {
            if (!activeTouchTarget) return;
            if (teamScene.contains(event.target) && event.target.closest('.hitzone')) return;
            activeTouchTarget.classList.remove('hovered');
            activeTouchTarget = null;
            activeTouchZone = null;
            hideTouchLabel();
        }, { passive: true });
    }

    // 3. Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    const updateNavbar = () => {
        if (!navbar) return;
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    // 4. Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    const closeMobileMenu = () => {
        if (!hamburger || !mobileMenu) return;
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        if (lenis) lenis.start();
    };

    const openMobileMenu = () => {
        if (!hamburger || !mobileMenu) return;
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
        if (lenis) lenis.stop();
    };

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu();
        });
        mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMobileMenu();
        });
    }

    // 4B. 3D Card Tilt Effect on Category Cards
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.atelier-card, .competition-card, .pricing-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width/2;
                const y = e.clientY - rect.top - rect.height/2;
                card.style.transform = `translateY(-8px) rotateY(${x * 0.04}deg) rotateX(${-y * 0.04}deg)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = `translateY(0) rotateY(0) rotateX(0)`;
            });
        });
    }

    if (!hasGsap) {
        const loader = document.querySelector('.page-loader');
        if (loader) loader.style.display = 'none';
        document.querySelectorAll('.fade-up, .fade-up-scroll, .paint-splash').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }

    // 5. Page loader fade-out + hero entrance
    const loader = document.querySelector('.page-loader');
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (loader) {
        tl.to(loader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => { loader.style.display = 'none'; }
        }, "+=0.1");
    }

    tl.to('.fade-up', {
        y: 0,
        opacity: 1,
        duration: 0.95,
        stagger: 0.12,
        ease: "power3.out"
    }, "-=0.5");

    tl.fromTo('.nav-link, .logo',
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power2.out" },
        "-=0.6"
    );

    if (!hasScrollTrigger) return;

    // 6. Fade-up-on-scroll elements
    document.querySelectorAll('.fade-up-scroll').forEach(el => {
        gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
                trigger: el,
                start: "top 88%",
                once: true
            }
        });
    });

    // 7. Grid staggers
    document.querySelectorAll('.ateliers-grid, .team-grid, .register-grid, .contact-grid, .competitions-list, .pricing-grid').forEach(grid => {
        const cards = grid.children;
        if (!cards.length) return;
        gsap.fromTo(cards,
            { y: 36, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.85,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: grid,
                    start: "top 85%",
                    once: true
                }
            }
        );
    });

    // 8. Gold divider draw-in
    document.querySelectorAll('.gold-divider').forEach(divider => {
        gsap.fromTo(divider,
            { scaleY: 0 },
            {
                scaleY: 1,
                duration: 1.1,
                ease: "power3.inOut",
                scrollTrigger: { trigger: divider, start: "top 85%", once: true }
            }
        );
    });

    // 9. Paint splash reveal
    document.querySelectorAll('.paint-splash').forEach((splash, i) => {
        gsap.to(splash, {
            opacity: 1,
            scale: 1,
            duration: 1.4,
            ease: "power2.out",
            scrollTrigger: {
                trigger: splash.closest('section') || splash,
                start: "top 70%",
                once: true
            },
            onComplete: () => {
                gsap.to(splash, {
                    y: "+=12",
                    rotation: "+=3",
                    duration: 4 + Math.random() * 3,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                });
            }
        });
    });

    // 9B. Custom momentum items staggered scroll reveal
    const momentumStrip = document.querySelector('.momentum-strip');
    if (momentumStrip) {
        gsap.fromTo('.momentum-item',
            { y: 35, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.9,
                stagger: 0.12,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: momentumStrip,
                    start: "top 85%",
                    once: true
                }
            }
        );
    }

    // 9C. Founder blocks scroll animation
    document.querySelectorAll('.founder-block').forEach((block) => {
        gsap.fromTo(block,
            { opacity: 0, y: 55 },
            {
                opacity: 1,
                y: 0,
                duration: 1.25,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: block,
                    start: "top 85%",
                    once: true
                }
            }
        );
    });

    // 10. Team photo scene reveal
    const scene = document.getElementById('teamScene');
    if (scene) {
        gsap.fromTo(scene,
            { opacity: 0, scale: 0.97 },
            {
                opacity: 1,
                scale: 1,
                duration: 1.3,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: scene,
                    start: "top 82%",
                    once: true
                }
            }
        );
    }

    // 10B. Strolling Canvas scroll-triggered animation
    const strollingCanvas = document.getElementById('strollingCanvas');
    if (strollingCanvas && hasGsap && hasScrollTrigger) {
        gsap.fromTo(strollingCanvas, 
            { 
                y: 120, 
                rotationX: 25, 
                rotationY: -15, 
                rotationZ: -4, 
                opacity: 0,
                scale: 0.92
            },
            {
                y: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                opacity: 1,
                scale: 1,
                duration: 1.6,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '.strolling-canvas-section',
                    start: "top 80%",
                    once: true
                }
            }
        );
    }

    // 11. Registration form handler
    // Native HTML form redirection enabled (JavaScript submit listener removed).
});