document.addEventListener('DOMContentLoaded', function () {
    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    const navbar = document.querySelector('.navbar');
    
    // Parallax scroll effect - usando requestAnimationFrame para performance
    let ticking = false;
    let navTicking = false;
    
    function updateNavbarHeight() {
        if (!navbar) return;
        const h = Math.ceil(navbar.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--navbar-height', `${h}px`);
    }

    function updateOnScroll() {
        const scrolled = window.pageYOffset;
        if (hero) {
            hero.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
            hero.style.opacity = 1 - scrolled / 800;
        }
        
        ticking = false;
    }
    
    window.addEventListener(
        'scroll',
        () => {
        if (!ticking) {
            window.requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
        },
        { passive: true }
    );

    updateNavbarHeight();
    // Recalcula com fontes carregadas (evita “pular” alinhamento)
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(updateNavbarHeight).catch(() => {});
    }
    window.addEventListener(
        'resize',
        () => {
            if (!navTicking) {
                navTicking = true;
                window.requestAnimationFrame(() => {
                    updateNavbarHeight();
                    navTicking = false;
                });
            }
        },
        { passive: true }
    );

    // Animate contact cards on scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach((card) => {
        observer.observe(card);
    });

    // Add smooth reveal animation for elements
    const revealElements = document.querySelectorAll('.contact-title, .contact-card');
    revealElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
    });
    
    // Inicializa o fundo generativo (Lumen Weave)
    initLumenWeaveBackground();
});

function initLumenWeaveBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduceMotionMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(reduceMotionMq && reduceMotionMq.matches);

    const state = {
        w: 0,
        h: 0,
        dpr: 1,
        minDim: 1,
        tLast: 0,
        running: true,
        pointerX: 0,
        pointerY: 0,
        pointerActive: false,
        pointerVX: 0,
        pointerVY: 0,
        baseHue: 35, // Warm amber/gold hue
        particles: [],
        bursts: []
    };

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // Hash determinístico para (i, j) -> [0, 1)
    function hash2(i, j) {
        let n = (i * 374761393 + j * 668265263) | 0;
        n = (n ^ (n >>> 13)) | 0;
        n = Math.imul(n, 1274126177) | 0;
        n = (n ^ (n >>> 16)) >>> 0;
        return n / 4294967296;
    }

    function fade(t) {
        // 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function noise2(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const u = fade(xf);
        const v = fade(yf);

        const n00 = hash2(xi, yi);
        const n10 = hash2(xi + 1, yi);
        const n01 = hash2(xi, yi + 1);
        const n11 = hash2(xi + 1, yi + 1);

        const x1 = lerp(n00, n10, u);
        const x2 = lerp(n01, n11, u);
        return lerp(x1, x2, v);
    }

    function fbm2(x, y) {
        let sum = 0;
        let amp = 0.55;
        let freq = 1.0;
        for (let o = 0; o < 5; o++) {
            sum += amp * noise2(x * freq, y * freq);
            freq *= 2.0;
            amp *= 0.5;
        }
        return sum;
    }

    function curl2(x, y) {
        // Derivadas numéricas do fbm
        const e = 0.015;
        const n1 = fbm2(x + e, y);
        const n2 = fbm2(x - e, y);
        const a = (n1 - n2) / (2 * e);

        const n3 = fbm2(x, y + e);
        const n4 = fbm2(x, y - e);
        const b = (n3 - n4) / (2 * e);

        // Campo sem divergência (rotaciona gradiente)
        let vx = b;
        let vy = -a;
        const m = Math.hypot(vx, vy) || 1;
        vx /= m;
        vy /= m;
        return { vx, vy };
    }

    function makeParticles(count) {
        const arr = new Array(count);
        for (let i = 0; i < count; i++) {
            arr[i] = {
                x: Math.random() * state.w,
                y: Math.random() * state.h,
                px: 0,
                py: 0,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                hue: (Math.random() * 160) - 80,
                life: Math.random() * 1.0
            };
            arr[i].px = arr[i].x;
            arr[i].py = arr[i].y;
        }
        return arr;
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));

        state.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
        state.w = cssW;
        state.h = cssH;
        state.minDim = Math.max(1, Math.min(cssW, cssH));

        canvas.width = Math.floor(cssW * state.dpr);
        canvas.height = Math.floor(cssH * state.dpr);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        const area = cssW * cssH;
        const base = Math.floor(area / (reduceMotion ? 9000 : 4500));
        const count = clamp(base, reduceMotion ? 220 : 700, reduceMotion ? 420 : 1600);
        state.particles = makeParticles(count);

        // Limpa com um "preto" suave (warm dark)
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(12, 11, 10, 1)';
        ctx.fillRect(0, 0, state.w, state.h);
    }

    function setPointer(x, y, active, vx, vy) {
        state.pointerX = x;
        state.pointerY = y;
        state.pointerActive = active;
        state.pointerVX = vx || 0;
        state.pointerVY = vy || 0;
    }

    function burst(x, y) {
        const hue = 30 + Math.random() * 25; // Warm amber burst
        state.bursts.push({
            x,
            y,
            r: 0,
            hue,
            life: 1
        });
        if (state.bursts.length > 6) state.bursts.shift();
    }

    function drawBursts(dt) {
        if (!state.bursts.length) return;
        for (let i = state.bursts.length - 1; i >= 0; i--) {
            const b = state.bursts[i];
            b.life -= dt * 1.2;
            b.r += dt * state.minDim * 0.9;
            if (b.life <= 0) {
                state.bursts.splice(i, 1);
                continue;
            }

            const alpha = b.life * 0.22;
            const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            g.addColorStop(0, `hsla(${b.hue}, 65%, 65%, ${alpha})`);
            g.addColorStop(0.35, `hsla(${b.hue + 10}, 55%, 55%, ${alpha * 0.6})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawGrain(amount) {
        ctx.globalCompositeOperation = 'source-over';
        // Warm-tinted grain
        ctx.fillStyle = 'rgba(245, 235, 220, 0.015)';
        for (let i = 0; i < amount; i++) {
            const x = Math.random() * state.w;
            const y = Math.random() * state.h;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    function tick(ts) {
        if (!state.running) return;

        const fpsCap = reduceMotion ? 12 : 60;
        const minFrameMs = 1000 / fpsCap;
        if (state.tLast && ts - state.tLast < minFrameMs * 0.92) {
            requestAnimationFrame(tick);
            return;
        }

        const dt = state.tLast ? Math.min(0.033, (ts - state.tLast) / 1000) : 1 / fpsCap;
        state.tLast = ts;

        // Fundo "trailing" - warm dark background
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = reduceMotion ? 'rgba(12, 11, 10, 0.28)' : 'rgba(12, 11, 10, 0.085)';
        ctx.fillRect(0, 0, state.w, state.h);

        const t = ts * 0.00008;
        // Warm amber range: oscillate between 25-45 (golden tones)
        state.baseHue = 35 + Math.sin(ts * 0.0002) * 10;

        const fieldScale = 2.2;
        const fieldStrength = reduceMotion ? 0.42 : 0.7;
        const friction = reduceMotion ? 0.88 : 0.84;
        const speed = reduceMotion ? 0.75 : 1.15;

        const radius = state.minDim * 0.32;
        const swirl = 0.55 * clamp((Math.hypot(state.pointerVX, state.pointerVY) / 1400), 0, 1);

        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = reduceMotion ? 1.0 : 1.15;

        for (let i = 0; i < state.particles.length; i++) {
            const p = state.particles[i];
            p.px = p.x;
            p.py = p.y;

            const sx = (p.x - state.w * 0.5) / state.minDim;
            const sy = (p.y - state.h * 0.5) / state.minDim;
            const c = curl2(sx * fieldScale + t, sy * fieldScale - t * 0.9);

            p.vx = p.vx * friction + c.vx * fieldStrength;
            p.vy = p.vy * friction + c.vy * fieldStrength;

            if (state.pointerActive) {
                const dx = p.x - state.pointerX;
                const dy = p.y - state.pointerY;
                const dist = Math.hypot(dx, dy) + 0.001;
                const k = clamp(1 - dist / radius, 0, 1);
                if (k > 0) {
                    // “lente gravitacional”: puxa e faz girar perto do cursor
                    const ax = (-dx / dist) * (0.22 * k);
                    const ay = (-dy / dist) * (0.22 * k);
                    const tx = (-dy / dist) * (0.35 * k * (0.35 + swirl));
                    const ty = (dx / dist) * (0.35 * k * (0.35 + swirl));
                    p.vx += ax + tx;
                    p.vy += ay + ty;
                }
            }

            p.x += p.vx * (speed * 60 * dt);
            p.y += p.vy * (speed * 60 * dt);

            // Reposiciona suavemente se sair da tela
            const m = 40;
            if (p.x < -m || p.x > state.w + m || p.y < -m || p.y > state.h + m) {
                p.x = Math.random() * state.w;
                p.y = Math.random() * state.h;
                p.px = p.x;
                p.py = p.y;
                p.vx = (Math.random() - 0.5) * 0.2;
                p.vy = (Math.random() - 0.5) * 0.2;
                p.life = 0;
                continue;
            }

            p.life = clamp(p.life + dt * 0.35, 0, 1);

            const vMag = Math.hypot(p.vx, p.vy);
            // Warm amber/gold palette with subtle variation
            const hue = state.baseHue + (p.hue * 0.15) + vMag * 5;
            const sat = 55 + vMag * 8; // More saturated when moving fast
            const light = 58 + vMag * 6;
            const alpha = (reduceMotion ? 0.25 : 0.2) * p.life;
            ctx.strokeStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;

            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }

        drawBursts(dt);
        drawGrain(reduceMotion ? 35 : 120);

        requestAnimationFrame(tick);
    }

    function onVisibility() {
        const hidden = document.hidden;
        state.running = !hidden;
        if (!hidden) {
            state.tLast = 0;
            requestAnimationFrame(tick);
        }
    }

    // Eventos
    let lastPX = 0;
    let lastPY = 0;
    let lastPT = 0;
    window.addEventListener(
        'pointermove',
        (e) => {
            const now = performance.now();
            const dx = e.clientX - lastPX;
            const dy = e.clientY - lastPY;
            const dt = Math.max(1, now - lastPT);
            const vx = (dx / dt) * 1000;
            const vy = (dy / dt) * 1000;
            lastPX = e.clientX;
            lastPY = e.clientY;
            lastPT = now;
            setPointer(e.clientX, e.clientY, true, vx, vy);
        },
        { passive: true }
    );
    window.addEventListener(
        'pointerdown',
        (e) => {
            setPointer(e.clientX, e.clientY, true, state.pointerVX, state.pointerVY);
        },
        { passive: true }
    );
    window.addEventListener(
        'pointerleave',
        () => {
            setPointer(state.pointerX, state.pointerY, false, 0, 0);
        },
        { passive: true }
    );
    window.addEventListener('resize', () => resize(), { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    if (reduceMotionMq && typeof reduceMotionMq.addEventListener === 'function') {
        reduceMotionMq.addEventListener('change', (e) => {
            reduceMotion = Boolean(e.matches);
            resize();
        });
    }

    resize();
    requestAnimationFrame(tick);
}
