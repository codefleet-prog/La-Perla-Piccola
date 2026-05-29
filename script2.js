(function() {
    'use strict';

    /* ——— LOADER ——— */
    const loader = document.getElementById('loader');

    // Trigger intro animations on the very next paint
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            loader.classList.add('animate');
        });
    });

    // Exit after 2 s — curtains split open (transition: 0.85s)
    setTimeout(() => {
        loader.classList.add('done');
        setTimeout(() => loader.remove(), 1200);

        // Wait for curtains to fully part, then start hero reveals
        const heroRight = document.getElementById('heroRight');
        const wrap1 = document.getElementById('hwlWrap1');
        const wrap2 = document.getElementById('hwlWrap2');

        function bladeReveal(wrap, delay) {
            if (!wrap) return;
            setTimeout(() => {
                wrap.classList.add('blade-a');         // blade sweeps in (0.52s)
                setTimeout(() => {
                    wrap.classList.remove('blade-a');
                    wrap.classList.add('blade-b');     // blade exits right (0.52s)
                }, 540);
            }, delay);
        }

        setTimeout(() => {
            // Blade reveal: line 1 first, line 2 staggered 280ms later
            bladeReveal(wrap1, 0);
            bladeReveal(wrap2, 280);

            // Right column: tag pill → desc → CTA, CSS handles stagger via transition-delay
            if (heroRight) heroRight.classList.add('revealed');

            // After CTA reveal completes, strip its transition-delay so hover is instant
            setTimeout(() => {
                const cta = document.querySelector('.hero-cta-pill');
                if (cta) cta.style.transitionDelay = '0s';
            }, 1200); // 600ms delay + 550ms transition + buffer

            // Start ambient float after all reveals are done
            // Blade on wrap2 finishes at 280 + 540 + 520 ≈ 1340ms; add buffer → 1800ms
            setTimeout(() => {
                const wordmark = document.getElementById('heroWordmark');
                if (wordmark) wordmark.classList.add('floating');
                if (heroRight) heroRight.classList.add('floating');
            }, 1800);

        }, 950); // 950 ms ≈ curtain transition (0.85 s) + small buffer

    }, 2000);

    /* ——— NAV scroll style ——— */
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    /* ——— STATS: reveal is CSS scroll-driven; counter fires once via JS ——— */
    (function() {
        const statNums    = document.querySelectorAll('.stat-num[data-count]');
        const statsSection = document.querySelector('.stats-section');
        let counted = false;

        const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;

        function animateCounter(el) {
            const target   = parseInt(el.dataset.count, 10);
            const suffix   = el.dataset.suffix || '';
            const duration = target >= 1000 ? 1800 : 1200;
            const start    = performance.now();
            function tick(now) {
                const p     = Math.min((now - start) / duration, 1);
                const value = Math.round(ease(p) * target);
                el.innerHTML = value + '<span style="color:var(--gold)">' + suffix + '</span>';
                if (p < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        // Fire counter when the section is fully inside the viewport (ratio ≥ 0.95),
        // matching the CSS contain-phase start so the counter begins as the
        // blocks animate in — not before they're visible.
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].intersectionRatio >= 0.7 && !counted) {
                counted = true;
                statNums.forEach(el => animateCounter(el));
                observer.disconnect();
            }
        }, { threshold: 0.7 });

        if (statsSection) observer.observe(statsSection);
    })();

    /* ——— Nav text slide-up hover setup ——— */
    document.querySelectorAll('.nav-links a').forEach(a => {
        const text = a.textContent.trim();
        a.dataset.text = text;
        a.innerHTML = '<span class="nav-text">' + text + '</span>';
    });

    /* ——— ABOUT pinned scroll reveal ——— */
    (function() {
        const container = document.getElementById('rolunk');
        if (!container) return;

        const eyebrow = document.getElementById('aboutEyebrow');
        const hInners = [
            document.getElementById('ahl0'),
            document.getElementById('ahl1'),
            document.getElementById('ahl2')
        ];
        const paras   = [document.getElementById('ap0'), document.getElementById('ap1')];
        const feats   = container.querySelectorAll('.about-feat-pill');
        const img     = document.getElementById('aboutImg');
        const overlay = document.getElementById('aboutOverlay');
        const progLine = document.getElementById('aboutLine');

        function update() {
            const rect    = container.getBoundingClientRect();
            const total   = container.offsetHeight - window.innerHeight;
            if (total <= 0) return; // mobile fallback — already revealed via CSS
            const scrolled = Math.max(0, -rect.top);
            const p        = Math.min(1, scrolled / total);

            // Gold progress line grows down the divider
            if (progLine) progLine.style.height = (p * 100) + '%';

            // Image: scale eases down, dark veil lifts
            if (img)     img.style.transform     = `scale(${1.15 - p * 0.15})`;
            if (overlay) overlay.style.opacity   = Math.max(0, 0.8 - p * 1.1);

            // Eyebrow slides in
            if (eyebrow) eyebrow.classList.toggle('in', p >= 0.04);

            // Headline lines wipe up, staggered
            hInners.forEach((el, i) => {
                if (el) el.classList.toggle('in', p >= 0.08 + i * 0.1);
            });

            // Paragraphs fade up
            paras.forEach((el, i) => {
                if (el) el.classList.toggle('in', p >= 0.35 + i * 0.13);
            });

            // Feature pills slide in from right
            feats.forEach((el, i) => {
                el.classList.toggle('in', p >= 0.58 + i * 0.07);
            });
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    })();

    /* ——— HERO parallax ——— */
    const heroBg2 = document.getElementById('heroBg2');
    window.addEventListener('scroll', () => {
        if (!heroBg2) return;
        if (window.scrollY < window.innerHeight * 1.5) {
            heroBg2.style.transform = `translateY(${window.scrollY * 0.28}px)`;
        }
    }, { passive: true });

    /* ——— GALLERY scroll-driven reveal + filmstrip slide ——— */
    (function() {
        const galContainer = document.getElementById('galeria');
        const galTrack     = document.getElementById('galleryTrack');
        const galItems     = document.querySelectorAll('.gi');

        // Scroll progress thresholds for each of the 9 images
        // Items 1-5: reveal in first ~40% of scroll
        // Items 6-9: reveal in last ~30% of scroll
        // Track slides between ~45% and ~60%
        // Image 6 starts revealing mid-slide so it's already appearing as panel 1 exits
        const REVEAL_AT = [0.05, 0.12, 0.19, 0.26, 0.33, 0.50, 0.58, 0.66, 0.74];
        const SLIDE_START = 0.42;
        const SLIDE_END   = 0.60;

        // Ease-in-out for the slide (cubic)
        function easeInOut(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function updateGallery() {
            if (!galContainer) return;
            const rect        = galContainer.getBoundingClientRect();
            const totalScroll = galContainer.offsetHeight - window.innerHeight;
            const scrolled    = Math.max(0, -rect.top);
            const p           = totalScroll > 0 ? Math.min(1, scrolled / totalScroll) : 0;

            // Reveal each image at its threshold
            galItems.forEach((item, i) => {
                item.classList.toggle('revealed', p >= (REVEAL_AT[i] || 1));
            });

            // Slide the track leftward between SLIDE_START and SLIDE_END
            if (galTrack) {
                const rawSlide = Math.max(0, Math.min(1, (p - SLIDE_START) / (SLIDE_END - SLIDE_START)));
                const easedSlide = easeInOut(rawSlide);
                // Slide distance = panel 1 width + gap (2rem = 32px)
                const panel1 = galTrack.querySelector('.gallery-panel-1');
                const slideDistance = panel1 ? panel1.offsetWidth + 32 : 0;
                galTrack.style.transform = `translateX(${-easedSlide * slideDistance}px)`;
            }
        }

        window.addEventListener('scroll', updateGallery, { passive: true });
        updateGallery();
    })();

})();
