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
    initLiquidInkBackground();
});

function initLiquidInkBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduceMotionMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(reduceMotionMq && reduceMotionMq.matches);

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const mix = (a, b, t) => a + (b - a) * t;

    // Paleta (cores da marca)
    const C0 = { r: 10, g: 10, b: 15 }; // fundo
    const C1 = { r: 99, g: 102, b: 241 }; // primary
    const C2 = { r: 139, g: 92, b: 246 }; // secondary
    const C3 = { r: 6, g: 182, b: 212 }; // accent

    const state = {
        w: 0,
        h: 0,
        dpr: 1,
        running: true,
        tLast: 0,
        pointerX: 0,
        pointerY: 0,
        pointerActive: false,
        pointerSpeed: 0,
        simW: 0,
        simH: 0,
        u0: null,
        v0: null,
        u1: null,
        v1: null,
        off: null,
        offCtx: null,
        img: null
    };

    function palette(t) {
        // t em [0,1] -> gradiente (C1 -> C2 -> C3), com base no fundo
        const tt = clamp(t, 0, 1);
        let a, b, k;
        if (tt < 0.5) {
            a = C1;
            b = C2;
            k = tt * 2;
        } else {
            a = C2;
            b = C3;
            k = (tt - 0.5) * 2;
        }
        const r = mix(a.r, b.r, k);
        const g = mix(a.g, b.g, k);
        const bch = mix(a.b, b.b, k);
        // mistura leve com o fundo pra ficar “ink in water”
        const base = 0.18;
        return {
            r: mix(C0.r, r, 1 - base),
            g: mix(C0.g, g, 1 - base),
            b: mix(C0.b, bch, 1 - base)
        };
    }

    function seedInk() {
        const { simW: w, simH: h } = state;
        const u0 = state.u0;
        const v0 = state.v0;
        if (!u0 || !v0) return;

        u0.fill(1);
        v0.fill(0);

        // ruído inicial sutil
        for (let i = 0; i < v0.length; i++) {
            v0[i] = (Math.random() - 0.5) * 0.002;
        }

        // alguns “pontos” de tinta
        const spots = reduceMotion ? 2 : 4;
        for (let s = 0; s < spots; s++) {
            const cx = Math.floor(w * (0.25 + Math.random() * 0.5));
            const cy = Math.floor(h * (0.25 + Math.random() * 0.5));
            const rad = Math.floor(Math.min(w, h) * (reduceMotion ? 0.045 : 0.06));
            for (let y = -rad; y <= rad; y++) {
                const yy = cy + y;
                if (yy < 1 || yy >= h - 1) continue;
                for (let x = -rad; x <= rad; x++) {
                    const xx = cx + x;
                    if (xx < 1 || xx >= w - 1) continue;
                    if (x * x + y * y > rad * rad) continue;
                    const idx = xx + yy * w;
                    v0[idx] = 0.85;
                    u0[idx] = 0.15;
                }
            }
        }
    }

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));

        state.dpr = clamp(window.devicePixelRatio || 1, 1, 2);
        state.w = cssW;
        state.h = cssH;

        canvas.width = Math.floor(cssW * state.dpr);
        canvas.height = Math.floor(cssH * state.dpr);
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;

        // Simulação em baixa resolução (performance)
        const maxW = reduceMotion ? 260 : 380;
        const minW = 180;
        const targetW = clamp(Math.floor(cssW / (reduceMotion ? 4.8 : 3.2)), minW, maxW);
        const targetH = Math.max(120, Math.floor(targetW * (cssH / cssW)));

        state.simW = targetW;
        state.simH = targetH;

        state.u0 = new Float32Array(targetW * targetH);
        state.v0 = new Float32Array(targetW * targetH);
        state.u1 = new Float32Array(targetW * targetH);
        state.v1 = new Float32Array(targetW * targetH);

        state.off = document.createElement('canvas');
        state.off.width = targetW;
        state.off.height = targetH;
        state.offCtx = state.off.getContext('2d', { alpha: true });
        state.img = state.offCtx.createImageData(targetW, targetH);

        seedInk();
    }

    function sampleBilinear(field, x, y, w, h) {
        // clamp nas bordas
        const xx = clamp(x, 0, w - 1);
        const yy = clamp(y, 0, h - 1);
        const x0 = xx | 0;
        const y0 = yy | 0;
        const x1 = x0 < w - 1 ? x0 + 1 : x0;
        const y1 = y0 < h - 1 ? y0 + 1 : y0;
        const tx = xx - x0;
        const ty = yy - y0;

        const i00 = x0 + y0 * w;
        const i10 = x1 + y0 * w;
        const i01 = x0 + y1 * w;
        const i11 = x1 + y1 * w;

        const a = field[i00];
        const b = field[i10];
        const c = field[i01];
        const d = field[i11];

        const ab = a + (b - a) * tx;
        const cd = c + (d - c) * tx;
        return ab + (cd - ab) * ty;
    }

    function tick(ts) {
        if (!state.running) return;

        const fpsCap = reduceMotion ? 12 : 45;
        const minFrameMs = 1000 / fpsCap;
        if (state.tLast && ts - state.tLast < minFrameMs * 0.92) {
            requestAnimationFrame(tick);
            return;
        }

        const dt = state.tLast ? Math.min(0.05, (ts - state.tLast) / 1000) : 1 / fpsCap;
        state.tLast = ts;

        const w = state.simW;
        const h = state.simH;
        let uRead = state.u0;
        let vRead = state.v0;
        let uWrite = state.u1;
        let vWrite = state.v1;

        if (!w || !h || !uRead || !vRead || !uWrite || !vWrite) {
            requestAnimationFrame(tick);
            return;
        }

        // Gray-Scott + advecção simples (“tinta líquida”)
        const Du = 0.16;
        const Dv = 0.08;
        const F0 = 0.035;
        const K0 = 0.062;

        const steps = reduceMotion ? 1 : 2;
        const advect = (reduceMotion ? 0.55 : 0.85) * 18 * dt; // “força” do fluxo
        const flow = reduceMotion ? 0.8 : 1.25;
        const t = ts * 0.00025;

        const px = (state.pointerX / Math.max(1, state.w)) * w;
        const py = (state.pointerY / Math.max(1, state.h)) * h;
        const brushR = (reduceMotion ? 10 : 14) + clamp(state.pointerSpeed * 0.004, 0, 22);
        const brushR2 = brushR * brushR;
        const brushInk = reduceMotion ? 0.12 : 0.18;

        for (let s = 0; s < steps; s++) {
            for (let y = 0; y < h; y++) {
                const yW = y * w;
                const yN = (y > 0 ? (y - 1) : y) * w;
                const yS = (y < h - 1 ? (y + 1) : y) * w;

                const ny = (y / Math.max(1, h)) - 0.5;
                for (let x = 0; x < w; x++) {
                    const idx = x + yW;

                    const xW = x > 0 ? x - 1 : x;
                    const xE = x < w - 1 ? x + 1 : x;

                    // Laplaciano (9 amostras)
                    const uC = uRead[idx];
                    const vC = vRead[idx];

                    const uLap =
                        -uC +
                        0.2 * (uRead[x + yN] + uRead[x + yS] + uRead[xW + yW] + uRead[xE + yW]) +
                        0.05 * (uRead[xW + yN] + uRead[xE + yN] + uRead[xW + yS] + uRead[xE + yS]);

                    const vLap =
                        -vC +
                        0.2 * (vRead[x + yN] + vRead[x + yS] + vRead[xW + yW] + vRead[xE + yW]) +
                        0.05 * (vRead[xW + yN] + vRead[xE + yN] + vRead[xW + yS] + vRead[xE + yS]);

                    // Campo de fluxo barato (trig) + toque do cursor (swirl)
                    const nx = (x / Math.max(1, w)) - 0.5;
                    const a = Math.sin((nx * 3.4 + t) * 2.0) + Math.cos((ny * 4.1 - t) * 1.7);
                    let vx = Math.cos(a * 2.1) * flow;
                    let vy = Math.sin(a * 1.9) * flow;

                    if (state.pointerActive) {
                        const dx = x - px;
                        const dy = y - py;
                        const d2 = dx * dx + dy * dy;
                        const k = d2 < brushR2 ? (1 - d2 / brushR2) : 0;
                        if (k > 0) {
                            // rotação em torno do cursor (vórtice)
                            const inv = 1 / (Math.sqrt(d2) + 0.001);
                            vx += (-dy * inv) * (2.2 * k);
                            vy += (dx * inv) * (2.2 * k);
                        }
                    }

                    // Advecção só do “dye” (v)
                    const vA = sampleBilinear(vRead, x - vx * advect, y - vy * advect, w, h);

                    // Pequena variação lenta do feed/kill (parece mais “orgânico”)
                    const F = F0 + 0.006 * Math.sin((nx + t) * 2.2) * Math.cos((ny - t) * 1.7);
                    const K = K0 + 0.004 * Math.cos((nx - t) * 2.0);

                    const uvv = uC * vA * vA;
                    let u = uC + (Du * uLap - uvv + F * (1 - uC)) * 1.15;
                    let v = vA + (Dv * vLap + uvv - (F + K) * vA) * 1.15;

                    // Injeção de tinta no ponteiro
                    if (state.pointerActive) {
                        const dx = x - px;
                        const dy = y - py;
                        const d2 = dx * dx + dy * dy;
                        if (d2 < brushR2) {
                            const k = (1 - d2 / brushR2);
                            v = clamp(v + brushInk * k, 0, 1);
                            u = clamp(u - 0.12 * k, 0, 1);
                        }
                    }

                    uWrite[idx] = clamp(u, 0, 1);
                    vWrite[idx] = clamp(v, 0, 1);
                }
            }

            // Ping-pong (local)
            const tu = uRead;
            uRead = uWrite;
            uWrite = tu;
            const tv = vRead;
            vRead = vWrite;
            vWrite = tv;
        }

        // Persistir buffers finais no state
        state.u0 = uRead;
        state.v0 = vRead;
        state.u1 = uWrite;
        state.v1 = vWrite;

        // Render: sim -> offscreen -> canvas (com glow)
        const offCtx = state.offCtx;
        const img = state.img;
        const data = img.data;
        const v = state.v0;

        for (let i = 0, p = 0; i < v.length; i++, p += 4) {
            // “tinta”: realça valores médios (fica mais líquido)
            const ink = clamp(Math.pow(clamp(v[i] * 1.35, 0, 1), 0.72), 0, 1);
            const col = palette(ink);
            const a = clamp(ink * 1.25, 0, 1);

            data[p] = col.r * a;
            data[p + 1] = col.g * a;
            data[p + 2] = col.b * a;
            data[p + 3] = clamp(255 * a, 0, 255);
        }

        offCtx.putImageData(img, 0, 0);

        ctx.clearRect(0, 0, state.w, state.h);

        // Glow suave
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = reduceMotion ? 'blur(8px) saturate(130%)' : 'blur(14px) saturate(150%)';
        ctx.globalAlpha = reduceMotion ? 0.7 : 0.85;
        ctx.drawImage(state.off, 0, 0, state.w, state.h);
        ctx.restore();

        // Pass principal
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.globalAlpha = 0.95;
        ctx.drawImage(state.off, 0, 0, state.w, state.h);
        ctx.restore();

        // Grain bem sutil (textura)
        if (!reduceMotion) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            for (let i = 0; i < 80; i++) {
                ctx.fillRect(Math.random() * state.w, Math.random() * state.h, 1, 1);
            }
            ctx.restore();
        }

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

    // Eventos de ponteiro (mouse/toque)
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
            lastPX = e.clientX;
            lastPY = e.clientY;
            lastPT = now;

            state.pointerX = e.clientX;
            state.pointerY = e.clientY;
            state.pointerActive = true;
            state.pointerSpeed = Math.hypot(dx, dy) / dt * 1000;
        },
        { passive: true }
    );

    window.addEventListener(
        'pointerdown',
        (e) => {
            state.pointerX = e.clientX;
            state.pointerY = e.clientY;
            state.pointerActive = true;
            state.pointerSpeed = Math.max(state.pointerSpeed, 900);
        },
        { passive: true }
    );

    window.addEventListener(
        'pointerleave',
        () => {
            state.pointerActive = false;
            state.pointerSpeed = 0;
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
