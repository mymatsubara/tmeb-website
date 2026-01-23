// Smooth scroll behavior
document.addEventListener('DOMContentLoaded', function() {
    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    
    // Parallax scroll effect - usando requestAnimationFrame para performance
    let ticking = false;
    
    function updateOnScroll() {
        const scrolled = window.pageYOffset;
        if (hero) {
            hero.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
            hero.style.opacity = 1 - scrolled / 800;
        }
        
        ticking = false;
    }
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }, { passive: true });

    // Add interactive particles on mouse move
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Create subtle cursor trail effect
        if (Math.random() > 0.95) {
            createParticle(mouseX, mouseY);
        }
    });

    function createParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.background = 'rgba(99, 102, 241, 0.5)';
        particle.style.borderRadius = '50%';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        particle.style.transition = 'all 0.5s ease-out';
        document.body.appendChild(particle);

        setTimeout(() => {
            particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`;
            particle.style.opacity = '0';
        }, 10);

        setTimeout(() => {
            particle.remove();
        }, 500);
    }

    // Animate contact cards on scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

    const contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(card => {
        observer.observe(card);
    });

    // Add smooth reveal animation for elements
    const revealElements = document.querySelectorAll('.contact-title, .contact-card');
    revealElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
    });
    
    // Initialize circuit energy animation
    initCircuitEnergy();
    
    // Add dynamic circuit glow effect - otimizado com requestAnimationFrame
    const circuitPaths = document.querySelectorAll('.circuit-path');
    let lastUpdate = 0;
    
    function updateCircuitGlow(timestamp) {
        if (timestamp - lastUpdate > 2000) {
            circuitPaths.forEach((path, index) => {
                const randomOpacity = 0.2 + Math.random() * 0.3;
                path.style.strokeOpacity = randomOpacity;
            });
            lastUpdate = timestamp;
        }
        requestAnimationFrame(updateCircuitGlow);
    }
    
    requestAnimationFrame(updateCircuitGlow);
});

// Circuit energy animation
function initCircuitEnergy() {
    const svg = document.querySelector('.circuit-svg');
    if (!svg) return;
    
    // Otimizar SVG para performance
    svg.style.willChange = 'transform';
    svg.style.transform = 'translateZ(0)';
    
    const paths = [
        { d: 'M0,200 Q200,100 400,200 T800,200 L1200,200 Q1400,300 1600,200 T1920,200', color: '#06b6d4' },
        { d: 'M0,600 Q300,500 600,600 T1200,600 L1600,600', color: '#6366f1' },
        { d: 'M200,0 L200,300 Q400,200 600,300 T1000,300 L1000,600', color: '#8b5cf6' },
        { d: 'M1600,400 Q1800,300 1920,400', color: '#06b6d4' },
        { d: 'M0,900 Q400,800 800,900 T1600,900 L1920,900', color: '#6366f1' }
    ];
    
    const energyGroup = document.querySelector('.energy-particles');
    if (!energyGroup) return;
    
    // Clear existing particles
    energyGroup.innerHTML = '';
    
    // Create energy particles for each path
    paths.forEach((pathData, index) => {
        for (let i = 0; i < 3; i++) {
            const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            particle.setAttribute('class', 'energy-particle');
            particle.setAttribute('r', '4');
            particle.setAttribute('fill', pathData.color);
            particle.setAttribute('opacity', '0.9');
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('id', `energy-path-${index}-${i}`);
            path.setAttribute('d', pathData.d);
            path.setAttribute('fill', 'none');
            path.setAttribute('visibility', 'hidden');
            
            let defs = svg.querySelector('defs');
            if (!defs) {
                defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                svg.appendChild(defs);
            }
            defs.appendChild(path);
            
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
            animate.setAttribute('dur', `${3 + Math.random() * 2}s`);
            animate.setAttribute('repeatCount', 'indefinite');
            animate.setAttribute('begin', `${i * 0.5 + index * 0.3}s`);
            animate.setAttribute('calcMode', 'linear');
            
            const mpath = document.createElementNS('http://www.w3.org/2000/svg', 'mpath');
            mpath.setAttribute('href', `#energy-path-${index}-${i}`);
            animate.appendChild(mpath);
            particle.appendChild(animate);
            
            energyGroup.appendChild(particle);
        }
    });
}
