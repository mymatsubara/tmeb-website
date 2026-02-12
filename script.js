/**
 * TMEB Consulting — Minimal Interactions
 * Clean, purposeful JavaScript. No bloat.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll reveal for contact section
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe contact blocks for staggered reveal
    document.querySelectorAll('.contact-block, .contact-cta').forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`;
        revealOnScroll.observe(el);
    });

    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        .is-visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Magnetic effect on CTA button
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('mousemove', (e) => {
            const rect = ctaButton.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            ctaButton.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });

        ctaButton.addEventListener('mouseleave', () => {
            ctaButton.style.transform = 'translate(0, 0)';
        });
    }

    // Parallax on hero glow
    let ticking = false;
    window.addEventListener('mousemove', (e) => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const hero = document.querySelector('.hero');
            if (hero) {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;
                hero.style.setProperty('--mouse-x', `${x}px`);
                hero.style.setProperty('--mouse-y', `${y}px`);
            }
            ticking = false;
        });
    }, { passive: true });

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('.contact-block, .contact-cta').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.transition = 'none';
        });
    }
});
