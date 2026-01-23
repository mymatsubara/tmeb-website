document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const heroContent = hero?.querySelector('.hero-content') || null;
    const cursorLens = document.querySelector('.cursor-lens');

    const reduceMotionMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reduceMotion = Boolean(reduceMotionMq && reduceMotionMq.matches);

    const hasFinePointer = Boolean(window.matchMedia?.('(pointer: fine)').matches);
    const hasHover = Boolean(window.matchMedia?.('(hover: hover)').matches);

    // -----------------------------
    // Layout: altura do navbar
    // -----------------------------
    let navTicking = false;
    function updateNavbarHeight() {
        if (!navbar) return;
        const h = Math.ceil(navbar.getBoundingClientRect().height);
        document.documentElement.style.setProperty('--navbar-height', `${h}px`);
    }

    updateNavbarHeight();
    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(updateNavbarHeight).catch(() => {});
    }
    window.addEventListener(
        'resize',
        () => {
            if (navTicking) return;
            navTicking = true;
            window.requestAnimationFrame(() => {
                updateNavbarHeight();
                layoutHScroll();
                navTicking = false;
            });
        },
        { passive: true }
    );

    // -----------------------------
    // Reveal por IntersectionObserver
    // -----------------------------
    const revealEls = Array.from(document.querySelectorAll('.reveal'));
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
        );
        revealEls.forEach((el) => io.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-visible'));
    }

    // -----------------------------
    // Tilt 3D + shine (cards/botões)
    // -----------------------------
    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
    }

    function setupPointerShine(el) {
        if (!el || reduceMotion || !hasFinePointer) return;
        let rafId = 0;
        let lastX = 0;
        let lastY = 0;
        let hovering = false;

        function apply() {
            rafId = 0;
            const r = el.getBoundingClientRect();
            const px = clamp((lastX - r.left) / Math.max(1, r.width), 0, 1);
            const py = clamp((lastY - r.top) / Math.max(1, r.height), 0, 1);
            el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
            el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
            if (!hovering) return;
        }

        function onMove(e) {
            hovering = true;
            lastX = e.clientX;
            lastY = e.clientY;
            if (!rafId) rafId = window.requestAnimationFrame(apply);
        }
        function onLeave() {
            hovering = false;
            el.style.setProperty('--mx', `50%`);
            el.style.setProperty('--my', `40%`);
        }

        el.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerleave', onLeave, { passive: true });
    }

    function setupTilt(el) {
        if (!el || reduceMotion || !hasFinePointer || !hasHover) return;
        let rafId = 0;
        let lastX = 0;
        let lastY = 0;
        let active = false;

        function apply() {
            rafId = 0;
            if (!active) return;
            const r = el.getBoundingClientRect();
            const px = clamp((lastX - r.left) / Math.max(1, r.width), 0, 1);
            const py = clamp((lastY - r.top) / Math.max(1, r.height), 0, 1);

            const ry = (px - 0.5) * 14; // deg
            const rx = (0.5 - py) * 10; // deg

            el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
            el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
            el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
            el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
        }

        function onEnter(e) {
            active = true;
            lastX = e.clientX;
            lastY = e.clientY;
            if (!rafId) rafId = window.requestAnimationFrame(apply);
        }
        function onMove(e) {
            lastX = e.clientX;
            lastY = e.clientY;
            if (!rafId) rafId = window.requestAnimationFrame(apply);
        }
        function onLeave() {
            active = false;
            el.style.setProperty('--rx', `0deg`);
            el.style.setProperty('--ry', `0deg`);
            el.style.setProperty('--mx', `50%`);
            el.style.setProperty('--my', `35%`);
        }

        el.addEventListener('pointerenter', onEnter, { passive: true });
        el.addEventListener('pointermove', onMove, { passive: true });
        el.addEventListener('pointerleave', onLeave, { passive: true });
    }

    document.querySelectorAll('[data-tilt]').forEach((el) => setupTilt(el));
    document.querySelectorAll('.btn').forEach((el) => setupPointerShine(el));

    // -----------------------------
    // Cursor lens
    // -----------------------------
    if (cursorLens && !reduceMotion && hasFinePointer) {
        let lensRaf = 0;
        let lx = 0;
        let ly = 0;
        function applyLens() {
            lensRaf = 0;
            cursorLens.style.setProperty('--lens-x', `${lx.toFixed(2)}px`);
            cursorLens.style.setProperty('--lens-y', `${ly.toFixed(2)}px`);
            cursorLens.style.opacity = '1';
        }
        window.addEventListener(
            'pointermove',
            (e) => {
                lx = e.clientX;
                ly = e.clientY;
                if (!lensRaf) lensRaf = window.requestAnimationFrame(applyLens);
            },
            { passive: true }
        );
        window.addEventListener(
            'pointerleave',
            () => {
                cursorLens.style.opacity = '0';
            },
            { passive: true }
        );
    }

    // -----------------------------
    // Scroll controller (capítulos + hscroll + parallax suave)
    // -----------------------------
    const expSection = document.querySelector('[data-sticky-section="experience"]');
    const expScenes = expSection ? Array.from(expSection.querySelectorAll('.scene')) : [];
    const expDots = expSection ? Array.from(expSection.querySelectorAll('.dot')) : [];

    const hSection = document.querySelector('[data-hscroll-section]');
    const hViewport = hSection ? hSection.querySelector('.hscroll-viewport') : null;
    const hTrack = hSection ? hSection.querySelector('.hscroll-track') : null;
    let hMaxX = 0;

    function stickyProgress(section) {
        const start = section.offsetTop;
        const end = start + section.offsetHeight - window.innerHeight;
        if (end <= start) return 0;
        return clamp((window.scrollY - start) / (end - start), 0, 1);
    }

    function layoutHScroll() {
        if (!hSection || !hViewport || !hTrack) return;
        hMaxX = Math.max(0, hTrack.scrollWidth - hViewport.clientWidth);
        // 1px extra evita “pulo” no final em alguns browsers
        hSection.style.height = `${Math.ceil(window.innerHeight + hMaxX + 1)}px`;
    }

    layoutHScroll();

    let scrollRaf = 0;
    function updateOnScroll() {
        scrollRaf = 0;
        const scrolled = window.scrollY || window.pageYOffset || 0;

        // Parallax leve no conteúdo do hero (evita deslocar a seção inteira)
        if (!reduceMotion && heroContent) {
            const y = scrolled * 0.12;
            heroContent.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
            heroContent.style.opacity = String(clamp(1 - scrolled / 1050, 0, 1));
        } else if (heroContent) {
            heroContent.style.transform = '';
            heroContent.style.opacity = '';
        }

        // Capítulos (experience)
        if (expSection && expScenes.length) {
            const p = stickyProgress(expSection);
            expSection.style.setProperty('--exp-p', String(p));
            expSection.style.setProperty('--exp-pct', `${(p * 100).toFixed(2)}%`);

            expSection.style.setProperty('--portal-scale', (0.75 + p * 0.65).toFixed(3));
            expSection.style.setProperty('--portal-rot', `${(p * 180).toFixed(2)}deg`);
            expSection.style.setProperty('--portal-turn', `${p.toFixed(4)}turn`);
            expSection.style.setProperty('--portal-shift', `${(-12 * p).toFixed(2)}px`);

            const segMax = Math.max(1, expScenes.length - 1);
            const seg = p * segMax; // 0..(n-1)
            const active = clamp(Math.round(seg), 0, expScenes.length - 1);
            expDots.forEach((d) => {
                const i = Number(d.getAttribute('data-dot') || '0');
                d.classList.toggle('is-active', i === active);
            });

            for (let i = 0; i < expScenes.length; i++) {
                const scene = expScenes[i];
                const d = Math.abs(seg - i);
                const fade = clamp(1 - d, 0, 1); // crossfade linear entre cenas vizinhas
                const op = Math.pow(fade, 1.35);
                const y = (i - seg) * 28;
                const s = 0.985 + op * 0.02;
                scene.style.opacity = op.toFixed(3);
                scene.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${s.toFixed(3)})`;
                scene.style.pointerEvents = op > 0.35 ? 'auto' : 'none';
            }
        }

        // Horizontal scroll (cases)
        if (hSection && hMaxX > 0) {
            const p = stickyProgress(hSection);
            hSection.style.setProperty('--hscroll-p', String(p));
            hSection.style.setProperty('--hscroll-pct', `${(p * 100).toFixed(2)}%`);
            hSection.style.setProperty('--hscroll-x', `${(-p * hMaxX).toFixed(2)}px`);
        } else if (hSection) {
            hSection.style.setProperty('--hscroll-p', '0');
            hSection.style.setProperty('--hscroll-pct', '0%');
            hSection.style.setProperty('--hscroll-x', '0px');
        }
    }

    function onScroll() {
        if (scrollRaf) return;
        scrollRaf = window.requestAnimationFrame(updateOnScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateOnScroll();

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
        baseHue: 215,
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

        // Limpa com um “preto” suave
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(10, 10, 15, 1)';
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
        const hue = (state.baseHue + 40 + Math.random() * 80) % 360;
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
            g.addColorStop(0, `hsla(${b.hue}, 95%, 70%, ${alpha})`);
            g.addColorStop(0.35, `hsla(${b.hue + 30}, 95%, 60%, ${alpha * 0.6})`);
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
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

        // Fundo “trailing”
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = reduceMotion ? 'rgba(10, 10, 15, 0.28)' : 'rgba(10, 10, 15, 0.085)';
        ctx.fillRect(0, 0, state.w, state.h);

        const t = ts * 0.00008;
        state.baseHue = (215 + ts * 0.003) % 360;

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
            const hue = (state.baseHue + p.hue + vMag * 18) % 360;
            const alpha = (reduceMotion ? 0.22 : 0.18) * p.life;
            ctx.strokeStyle = `hsla(${hue}, 92%, 66%, ${alpha})`;

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
            burst(e.clientX, e.clientY);
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
