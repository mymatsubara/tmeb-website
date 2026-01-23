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
    
    // Inicializa o fundo inspirado em Minecraft
    initMinecraftBackground();
});

function initMinecraftBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduceMotionMq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduceMotion = Boolean(reduceMotionMq && reduceMotionMq.matches);

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    function smoothstep(t) {
        const x = clamp(t, 0, 1);
        return x * x * (3 - 2 * x);
    }

    function hash01(n) {
        // hash determinístico -> [0, 1)
        let x = n | 0;
        x = (x ^ (x >>> 16)) | 0;
        x = Math.imul(x, 0x7feb352d) | 0;
        x = (x ^ (x >>> 15)) | 0;
        x = Math.imul(x, 0x846ca68b) | 0;
        x = (x ^ (x >>> 16)) >>> 0;
        return x / 4294967296;
    }

    function noise1D(x) {
        const xi = Math.floor(x);
        const t = x - xi;
        const a = hash01(xi);
        const b = hash01(xi + 1);
        return lerp(a, b, smoothstep(t));
    }

    function fbm1D(x) {
        let sum = 0;
        let amp = 0.55;
        let freq = 1;
        for (let o = 0; o < 4; o++) {
            sum += amp * noise1D(x * freq);
            freq *= 2;
            amp *= 0.5;
        }
        return sum;
    }

    function mixRgb(a, b, t) {
        return {
            r: Math.round(lerp(a.r, b.r, t)),
            g: Math.round(lerp(a.g, b.g, t)),
            b: Math.round(lerp(a.b, b.b, t))
        };
    }

    function rgbStr(c) {
        return `rgb(${c.r}, ${c.g}, ${c.b})`;
    }

    function rgbaStr(c, a) {
        return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
    }

    // Paleta “Minecraft-like” (original, sem assets)
    const SKY_DAY_TOP = { r: 92, g: 180, b: 246 };
    const SKY_DAY_BOT = { r: 210, g: 238, b: 255 };
    const SKY_NIGHT_TOP = { r: 6, g: 8, b: 20 };
    const SKY_NIGHT_BOT = { r: 12, g: 18, b: 40 };
    const SKY_DUSK = { r: 86, g: 52, b: 126 };

    const GRASS = { r: 60, g: 165, b: 80 };
    const GRASS_DARK = { r: 44, g: 132, b: 66 };
    const DIRT = { r: 139, g: 92, b: 52 };
    const DIRT_DARK = { r: 108, g: 70, b: 40 };
    const STONE = { r: 120, g: 124, b: 132 };
    const STONE_DARK = { r: 92, g: 96, b: 104 };
    const BEDROCK = { r: 44, g: 46, b: 52 };
    const SAND = { r: 214, g: 196, b: 132 };
    const WATER = { r: 45, g: 110, b: 220 };
    const WATER_DARK = { r: 30, g: 80, b: 180 };
    const WOOD = { r: 170, g: 124, b: 76 };
    const WOOD_DARK = { r: 132, g: 96, b: 58 };
    const LEAVES = { r: 46, g: 140, b: 74 };
    const LEAVES_DARK = { r: 34, g: 108, b: 58 };

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
        px: 0,
        block: 6,
        pix: null,
        pixCtx: null,
        stars: [],
        clouds: [],
        breakFx: [],
        broken: new Set(),
        renderBaseCol: 0,
        renderXOffset: 0,
        renderRows: 0,
        renderSeaRowFromTop: 0,
        renderPx: 0
    };

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
        ctx.imageSmoothingEnabled = false;

        // Render em baixa resolução pra manter “pixel art”
        const targetW = clamp(Math.floor(cssW / (reduceMotion ? 5 : 4)), 220, 420);
        const targetH = Math.max(140, Math.floor(targetW * (cssH / cssW)));
        state.simW = targetW;
        state.simH = targetH;

        // tamanho do “bloco” em pixels da simulação
        state.block = clamp(Math.round(targetW / 72), 5, 8);
        state.px = state.block;

        state.pix = document.createElement('canvas');
        state.pix.width = targetW;
        state.pix.height = targetH;
        state.pixCtx = state.pix.getContext('2d', { alpha: false });
        state.pixCtx.imageSmoothingEnabled = false;

        // Quebras são dependentes da grade atual; ao redimensionar, reseta.
        state.broken = new Set();
        state.breakFx = [];

        // estrelas fixas (noite)
        const starCount = reduceMotion ? 90 : 140;
        state.stars = new Array(starCount);
        for (let i = 0; i < starCount; i++) {
            state.stars[i] = {
                x: Math.random(),
                y: Math.random() * 0.6,
                a: 0.25 + Math.random() * 0.75,
                tw: 0.8 + Math.random() * 2.2,
                ph: Math.random() * Math.PI * 2
            };
        }

        // nuvens “blocadas”
        const cloudCount = reduceMotion ? 4 : 6;
        state.clouds = new Array(cloudCount);
        for (let i = 0; i < cloudCount; i++) {
            state.clouds[i] = {
                x: Math.random(),
                y: Math.random() * 0.28,
                w: 10 + Math.floor(Math.random() * 14),
                h: 3 + Math.floor(Math.random() * 3),
                sp: (0.5 + Math.random() * 1.1) * (reduceMotion ? 0.35 : 0.6),
                a: 0.5 + Math.random() * 0.4
            };
        }
    }

    function drawSky(p, dayAmt, twilightAmt) {
        // gradiente vertical “pixelado”
        const topBase = mixRgb(SKY_NIGHT_TOP, SKY_DAY_TOP, dayAmt);
        const botBase = mixRgb(SKY_NIGHT_BOT, SKY_DAY_BOT, dayAmt);
        const top = mixRgb(topBase, SKY_DUSK, twilightAmt * 0.7);
        const bot = mixRgb(botBase, SKY_DUSK, twilightAmt * 0.35);

        for (let y = 0; y < state.simH; y++) {
            const t = y / Math.max(1, state.simH - 1);
            const c = mixRgb(top, bot, t);
            p.fillStyle = rgbStr(c);
            p.fillRect(0, y, state.simW, 1);
        }
    }

    function terrainSurfaceBlocks(worldCol, rows, seaRowFromTop) {
        // retorna y do topo do terreno em “blocos” (0 em cima)
        const n = fbm1D(worldCol * 0.055);
        const n2 = fbm1D(worldCol * 0.012) * 0.65;
        const h = clamp(n * 0.7 + n2 * 0.3, 0, 1);

        const minGroundBlocksFromBottom = Math.floor(rows * 0.25);
        const maxGroundBlocksFromBottom = Math.floor(rows * 0.58);
        const groundBlocks = Math.floor(lerp(minGroundBlocksFromBottom, maxGroundBlocksFromBottom, h));
        let yTop = rows - groundBlocks;

        // suaviza perto da “praia”
        const beach = seaRowFromTop + 1;
        if (yTop > beach) {
            yTop = Math.min(rows - 2, yTop + Math.floor((yTop - beach) * 0.15));
        }
        return clamp(yTop, 0, rows - 2);
    }

    function blockKey(worldCol, by) {
        return `${worldCol}:${by}`;
    }

    function isBroken(worldCol, by) {
        return state.broken.has(blockKey(worldCol, by));
    }

    function drawBlock(p, x, y, size, base, dark, speckKey) {
        p.fillStyle = rgbStr(base);
        p.fillRect(x, y, size, size);

        // highlight topo/esquerda + sombra baixo/direita (efeito “voxel”)
        p.fillStyle = rgbaStr({ r: 255, g: 255, b: 255 }, 0.10);
        p.fillRect(x, y, size, 1);
        p.fillRect(x, y, 1, size);

        p.fillStyle = rgbaStr({ r: 0, g: 0, b: 0 }, 0.12);
        p.fillRect(x, y + size - 1, size, 1);
        p.fillRect(x + size - 1, y, 1, size);

        // “textura” determinística (2 pixels)
        const r1 = hash01(speckKey);
        const r2 = hash01(speckKey + 1337);
        const ox1 = (r1 * (size - 2) + 1) | 0;
        const oy1 = (r2 * (size - 2) + 1) | 0;
        p.fillStyle = rgbaStr(dark, 0.22);
        p.fillRect(x + ox1, y + oy1, 1, 1);
        const ox2 = (hash01(speckKey + 42) * (size - 2) + 1) | 0;
        const oy2 = (hash01(speckKey + 99) * (size - 2) + 1) | 0;
        p.fillRect(x + ox2, y + oy2, 1, 1);
    }

    function drawCloud(p, cloud, dayAmt) {
        // nuvem em blocos (só aparece bem no dia)
        const alpha = cloud.a * clamp(dayAmt * 1.2, 0, 1);
        if (alpha <= 0.02) return;

        const px = state.px;
        const x0 = Math.floor(cloud.x * state.simW);
        const y0 = Math.floor(cloud.y * state.simH);
        p.fillStyle = `rgba(255,255,255,${alpha})`;

        for (let r = 0; r < cloud.h; r++) {
            const rowW = cloud.w - Math.floor(Math.abs(r - cloud.h * 0.45) * 1.4);
            const sx = x0 + (r % 2) * px;
            p.fillRect(sx, y0 + r * px, rowW * px, px);
        }
        // sombra suave
        p.fillStyle = `rgba(0,0,0,${alpha * 0.10})`;
        p.fillRect(x0 + px, y0 + cloud.h * px, (cloud.w - 2) * px, px);
    }

    function drawSelection(p) {
        if (!state.pointerActive) return;
        const px = state.px;
        const sx = (state.pointerX / Math.max(1, state.w)) * state.simW;
        const sy = (state.pointerY / Math.max(1, state.h)) * state.simH;
        const x = Math.floor(sx / px) * px;
        const y = Math.floor(sy / px) * px;

        p.save();
        p.strokeStyle = 'rgba(255,255,255,0.55)';
        p.lineWidth = 1;
        p.strokeRect(x + 0.5, y + 0.5, px - 1, px - 1);
        // cantos
        p.strokeStyle = 'rgba(0,0,0,0.35)';
        p.beginPath();
        p.moveTo(x + 1, y + 3);
        p.lineTo(x + 1, y + 1);
        p.lineTo(x + 3, y + 1);
        p.moveTo(x + px - 2, y + 3);
        p.lineTo(x + px - 2, y + 1);
        p.lineTo(x + px - 4, y + 1);
        p.moveTo(x + 1, y + px - 4);
        p.lineTo(x + 1, y + px - 2);
        p.lineTo(x + 3, y + px - 2);
        p.moveTo(x + px - 2, y + px - 4);
        p.lineTo(x + px - 2, y + px - 2);
        p.lineTo(x + px - 4, y + px - 2);
        p.stroke();
        p.restore();
    }

    function spawnBreakFx() {
        const sx = (state.pointerX / Math.max(1, state.w)) * state.simW;
        const sy = (state.pointerY / Math.max(1, state.h)) * state.simH;
        const px = state.px;
        const cx = Math.floor(sx / px) * px + px * 0.5;
        const cy = Math.floor(sy / px) * px + px * 0.5;
        const count = reduceMotion ? 6 : 12;
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 12 + Math.random() * 26;
            state.breakFx.push({
                x: cx,
                y: cy,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 8,
                life: 0.9 + Math.random() * 0.4
            });
        }
        if (state.breakFx.length > 120) state.breakFx.splice(0, state.breakFx.length - 120);
    }

    function breakBlockAtPointer() {
        const px = state.renderPx || state.px;
        const rows = state.renderRows;
        const seaRowFromTop = state.renderSeaRowFromTop;
        const baseCol = state.renderBaseCol;
        const xOffset = state.renderXOffset;

        if (!px || !rows) return false;
        if (!Number.isFinite(baseCol) || !Number.isFinite(xOffset)) return false;

        const simX = (state.pointerX / Math.max(1, state.w)) * state.simW;
        const simY = (state.pointerY / Math.max(1, state.h)) * state.simH;

        const colInView = Math.floor((simX - xOffset) / px);
        const worldCol = baseCol + colInView;
        const by = Math.floor(simY / px);

        if (by < 0 || by >= rows) return false;

        // Só quebra bloco de terreno “visível” (terra/grama/pedra) — evita quebrar água/sky.
        const surfBlockY = terrainSurfaceBlocks(worldCol, rows, seaRowFromTop);
        if (surfBlockY > seaRowFromTop) return false; // abaixo do mar (submerso)
        if (by < surfBlockY) return false; // céu/ar (ou árvore)
        if (by >= rows - 1) return false; // bedrock não quebra

        const k = blockKey(worldCol, by);
        if (state.broken.has(k)) return false;
        state.broken.add(k);
        return true;
    }

    function tick(ts) {
        if (!state.running) return;

        const fpsCap = reduceMotion ? 12 : 60;
        const minFrameMs = 1000 / fpsCap;
        if (state.tLast && ts - state.tLast < minFrameMs * 0.9) {
            requestAnimationFrame(tick);
            return;
        }

        const dt = state.tLast ? Math.min(0.033, (ts - state.tLast) / 1000) : 1 / fpsCap;
        state.tLast = ts;

        const p = state.pixCtx;
        if (!p) {
            requestAnimationFrame(tick);
            return;
        }

        // ciclo dia/noite ~ 80s
        const cycle = (ts * 0.000012) % 1;
        const phase = cycle * Math.PI * 2;
        const dayAmt = clamp(Math.sin(phase) * 0.5 + 0.5, 0, 1);
        const twilightAmt = clamp(1 - Math.abs(Math.sin(phase)) * 2.2, 0, 1);
        const nightAmt = 1 - dayAmt;

        drawSky(p, dayAmt, twilightAmt);

        // estrelas à noite
        if (nightAmt > 0.08) {
            const a = clamp((nightAmt - 0.08) / 0.92, 0, 1);
            p.save();
            p.globalCompositeOperation = 'screen';
            for (let i = 0; i < state.stars.length; i++) {
                const s = state.stars[i];
                const tw = 0.7 + 0.3 * Math.sin(s.ph + ts * 0.001 * s.tw);
                const alpha = s.a * tw * a;
                const x = Math.floor(s.x * state.simW);
                const y = Math.floor(s.y * state.simH);
                p.fillStyle = `rgba(255,255,255,${alpha})`;
                p.fillRect(x, y, 1, 1);
                if (!reduceMotion && alpha > 0.6 && (i % 9 === 0)) {
                    p.fillStyle = `rgba(180,220,255,${alpha * 0.25})`;
                    p.fillRect(x - 1, y, 1, 1);
                    p.fillRect(x + 1, y, 1, 1);
                }
            }
            p.restore();
        }

        // sol/lua em pixel art
        const sunX = lerp(-0.12, 1.12, cycle) * state.simW;
        const sunY = (0.22 - Math.sin(phase) * 0.12) * state.simH;
        const r = Math.max(4, Math.floor(state.simW * 0.02));
        p.save();
        p.globalCompositeOperation = 'screen';
        if (dayAmt > 0.12) {
            p.fillStyle = `rgba(255,245,210,${clamp(dayAmt, 0, 1)})`;
            p.beginPath();
            p.arc(sunX, sunY, r, 0, Math.PI * 2);
            p.fill();
        } else {
            p.fillStyle = `rgba(220,235,255,${clamp(nightAmt, 0, 1) * 0.9})`;
            p.beginPath();
            p.arc(sunX, sunY, r, 0, Math.PI * 2);
            p.fill();
        }
        p.restore();

        // nuvens (movem devagar)
        for (let i = 0; i < state.clouds.length; i++) {
            const c = state.clouds[i];
            c.x += (c.sp * dt) / Math.max(1, state.simW / 100);
            if (c.x > 1.25) {
                c.x = -0.25;
                c.y = Math.random() * 0.28;
            }
            drawCloud(p, c, dayAmt);
        }

        // terreno “scrollando”
        const px = state.px;
        const block = state.block;
        const cols = Math.ceil(state.simW / px) + 2;
        const rows = Math.ceil(state.simH / px) + 2;

        const scroll = ts * (reduceMotion ? 0.00014 : 0.00022); // blocos por ms
        const baseCol = Math.floor(scroll);
        const frac = scroll - baseCol;
        const xOffset = -frac * px;

        const seaBlocksFromBottom = Math.floor(rows * 0.30);
        const seaRowFromTop = rows - seaBlocksFromBottom;

        // Parâmetros atuais (usados para mapear clique -> bloco)
        state.renderBaseCol = baseCol;
        state.renderXOffset = xOffset;
        state.renderRows = rows;
        state.renderSeaRowFromTop = seaRowFromTop;
        state.renderPx = px;

        // água ao fundo (se houver)
        const waterTopY = seaRowFromTop * px;
        p.fillStyle = rgbaStr(WATER_DARK, 0.55);
        p.fillRect(0, waterTopY, state.simW, state.simH - waterTopY);

        // desenha colunas
        const treeCooldown = Math.max(5, Math.floor(cols / 10));
        let lastTree = -99999;

        for (let i = 0; i < cols; i++) {
            const worldCol = baseCol + i;
            const x = (i * px + xOffset) | 0;
            if (x > state.simW + px || x < -px) continue;

            const surfBlockY = terrainSurfaceBlocks(worldCol, rows, seaRowFromTop);
            const surfY = surfBlockY * px;

            // se abaixo do mar: desenha “água” por cima
            if (surfBlockY > seaRowFromTop) {
                // água até o nível do mar (com “ondas”)
                const wave = Math.sin(ts * 0.003 + worldCol * 0.35) * 1.2;
                const yWave = (waterTopY + wave) | 0;
                p.fillStyle = rgbaStr(WATER, 0.55);
                p.fillRect(x, yWave, px, state.simH - yWave);
                // praia/sand no fundo
                for (let by = surfBlockY; by < Math.min(rows, surfBlockY + 2); by++) {
                    if (isBroken(worldCol, by)) continue;
                    drawBlock(p, x, by * px, px, SAND, DIRT_DARK, worldCol * 8191 + by * 131);
                }
                for (let by = surfBlockY + 2; by < rows; by++) {
                    const depth = by - surfBlockY;
                    if (isBroken(worldCol, by)) continue;
                    if (by >= rows - 1) {
                        drawBlock(p, x, by * px, px, BEDROCK, BEDROCK, worldCol * 8191 + by * 131);
                    } else if (depth < 5) {
                        drawBlock(p, x, by * px, px, DIRT, DIRT_DARK, worldCol * 8191 + by * 131);
                    } else {
                        drawBlock(p, x, by * px, px, STONE, STONE_DARK, worldCol * 8191 + by * 131);
                    }
                }
                continue;
            }

            // terra/grama
            for (let by = surfBlockY; by < rows; by++) {
                const depth = by - surfBlockY;
                const key = worldCol * 8191 + by * 131;

                if (isBroken(worldCol, by)) continue;
                if (by >= rows - 1) {
                    drawBlock(p, x, by * px, px, BEDROCK, BEDROCK, key);
                } else if (depth === 0) {
                    drawBlock(p, x, by * px, px, GRASS, GRASS_DARK, key);
                } else if (depth < 4) {
                    drawBlock(p, x, by * px, px, DIRT, DIRT_DARK, key);
                } else {
                    drawBlock(p, x, by * px, px, STONE, STONE_DARK, key);
                }
            }

            // árvores ocasionais
            const canTree = (worldCol - lastTree) > treeCooldown;
            const treeRnd = hash01(worldCol * 97 + 12345);
            const treeOk = canTree && treeRnd > 0.92 && surfBlockY < seaRowFromTop - 2 && surfBlockY > 2;
            if (treeOk) {
                lastTree = worldCol;
                const trunkH = 3 + Math.floor(hash01(worldCol * 11 + 7) * 3);
                const trunkX = x;
                for (let tby = 1; tby <= trunkH; tby++) {
                    const by = surfBlockY - tby;
                    if (!isBroken(worldCol, by)) {
                        drawBlock(p, trunkX, by * px, px, WOOD, WOOD_DARK, worldCol * 9001 + tby);
                    }
                }
                const crown = 2 + Math.floor(hash01(worldCol * 19 + 3) * 2);
                for (let oy = -crown; oy <= crown; oy++) {
                    for (let ox = -crown; ox <= crown; ox++) {
                        const d = Math.abs(ox) + Math.abs(oy);
                        if (d > crown + 1) continue;
                        const ok = hash01(worldCol * 133 + (ox + 9) * 31 + (oy + 9) * 101) > 0.22;
                        if (!ok) continue;
                        const leafWorldCol = worldCol + ox;
                        const bx = trunkX + ox * px;
                        const by = surfBlockY - trunkH - 1 + oy;
                        if (bx < -px || bx > state.simW + px) continue;
                        if (by < 0 || by * px > state.simH) continue;
                        if (isBroken(leafWorldCol, by)) continue;
                        drawBlock(p, bx, by * px, px, LEAVES, LEAVES_DARK, worldCol * 7001 + ox * 17 + oy * 29);
                    }
                }
            }
        }

        // efeito de “quebra” (clique)
        if (state.breakFx.length) {
            for (let i = state.breakFx.length - 1; i >= 0; i--) {
                const b = state.breakFx[i];
                b.life -= dt * 1.35;
                if (b.life <= 0) {
                    state.breakFx.splice(i, 1);
                    continue;
                }
                b.vy += 65 * dt;
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                p.fillStyle = `rgba(255,255,255,${clamp(b.life, 0, 1) * 0.75})`;
                p.fillRect(b.x | 0, b.y | 0, 1, 1);
            }
        }

        // seleção do “bloco” no cursor
        drawSelection(p);

        // desenha para o canvas principal (sem smoothing pra manter pixel art)
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, state.w, state.h);
        ctx.drawImage(state.pix, 0, 0, state.w, state.h);
        ctx.restore();

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

    let lastPX = 0;
    let lastPY = 0;
    let lastPT = 0;

    window.addEventListener(
        'pointermove',
        (e) => {
            const now = performance.now();
            const dx = e.clientX - lastPX;
            const dy = e.clientY - lastPY;
            const dtt = Math.max(1, now - lastPT);
            lastPX = e.clientX;
            lastPY = e.clientY;
            lastPT = now;

            state.pointerX = e.clientX;
            state.pointerY = e.clientY;
            state.pointerActive = true;
            state.pointerSpeed = Math.hypot(dx, dy) / dtt * 1000;
        },
        { passive: true }
    );

    window.addEventListener(
        'pointerdown',
        (e) => {
            state.pointerX = e.clientX;
            state.pointerY = e.clientY;
            state.pointerActive = true;
            if (breakBlockAtPointer()) {
                spawnBreakFx();
            }
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
