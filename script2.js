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

    /* ——— GALLERY dynamic fetch & reveal ——— */
    (async function() {
        const galContainer = document.getElementById('galeria');
        const toggleWrapper= document.getElementById('galleryToggle');
        const slider       = document.getElementById('gtSlider');
        const toggleBtns   = document.querySelectorAll('.gt-btn');
        const tracksContainer = document.getElementById('galleryTracksContainer');

        if (!tracksContainer) return;

        // Fetch gallery from Supabase
        try {
            if (!window.supabaseClient) throw new Error("Supabase is not configured.");
            const { data, error } = await window.supabaseClient.from('gallery').select('*').order('created_at', { ascending: true });
            if (!error && data) {
                const tracks = { 'track-teljes': [], 'track-kiallitas': [] };
                data.forEach(img => {
                    if (tracks[img.track_id]) tracks[img.track_id].push(img);
                });

                let html = '';
                ['track-teljes', 'track-kiallitas'].forEach((trackId, idx) => {
                    let activeClass = idx === 0 ? 'active' : '';
                    html += `<div class="gallery-track ${activeClass}" id="${trackId}">`;
                    html += `<div class="gallery-panel">`;
                    tracks[trackId].forEach(img => {
                        html += `
                            <div class="gi">
                                <img src="${img.src}" alt="${img.cap}" loading="lazy">
                                <span class="gi-cap">${img.cap}</span>
                            </div>
                        `;
                    });
                    html += `</div></div>`;
                });
                tracksContainer.innerHTML = html;
            }
        } catch (e) { console.error("Error fetching gallery:", e); }

        let activeTrack    = document.querySelector('.gallery-track.active');
        let galItems       = activeTrack ? activeTrack.querySelectorAll('.gi') : [];

        function updateSlider(btn) {
            if (!slider || !btn) return;
            slider.style.width = btn.offsetWidth + 'px';
            slider.style.left  = btn.offsetLeft + 'px';
        }

        const initialBtn = document.querySelector('.gt-btn.active');
        if (initialBtn) setTimeout(() => updateSlider(initialBtn), 100);

        function updateGallery() {
            if (!galContainer || !activeTrack) return;
            const rect        = galContainer.getBoundingClientRect();
            const totalScroll = galContainer.offsetHeight - window.innerHeight;
            const scrolled    = Math.max(0, -rect.top);
            const p           = totalScroll > 0 ? Math.min(1, scrolled / totalScroll) : 0;

            galItems.forEach((item, i) => {
                // simple staggered reveal
                let threshold = Math.min(0.8, i * 0.05);
                item.classList.toggle('revealed', p >= threshold);
            });
        }

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;

                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSlider(btn);

                const targetId = btn.getAttribute('data-target');
                document.querySelectorAll('.gallery-track').forEach(t => t.classList.remove('active'));
                
                activeTrack = document.getElementById(targetId);
                if (activeTrack) {
                    activeTrack.classList.add('active');
                    galItems = activeTrack.querySelectorAll('.gi');
                    
                    activeTrack.classList.add('animating');

                    // Force instant update for the newly active track
                    updateGallery();
                }
            });
        });

        window.addEventListener('scroll', updateGallery, { passive: true });
        updateGallery();
    })();

    /* ——— AGARAINK bidirectional scroll reveal ——— */
    (function() {
        const section = document.getElementById('agaraink');
        if (!section) return;

        const diagLine    = section.querySelector('.dogs-diagonal-line');
        const hInners     = section.querySelectorAll('.dogs-h-inner');
        const intro       = section.querySelector('.dogs-intro');
        const features    = section.querySelectorAll('.dog-feature');

        function updateDogs() {
            const rect   = section.getBoundingClientRect();
            const vh     = window.innerHeight;
            // p = 0 when section top hits bottom of viewport, 1 when section bottom hits top
            const total  = section.offsetHeight + vh;
            const scrolled = Math.max(0, vh - rect.top);
            const p      = Math.min(1, scrolled / total);

            // Diagonal line grows in from 0 → visible
            if (diagLine) diagLine.classList.toggle('in', p > 0.02);

            // Headline lines — staggered
            hInners.forEach((el, i) => {
                el.classList.toggle('in', p > 0.04 + i * 0.03);
            });

            // Intro paragraph
            if (intro) intro.classList.toggle('in', p > 0.06);

            // Per-feature reveals (portrait + info card elements)
            features.forEach((feature, fi) => {
                const fRect   = feature.getBoundingClientRect();
                const fEnter  = Math.max(0, vh - fRect.top);
                const fTotal  = feature.offsetHeight + vh;
                const fp      = Math.min(1, fEnter / fTotal);

                const isVisible = fp > 0.1;

                feature.querySelector('.dog-index')
                    ?.classList.toggle('in', fp > 0.05);
                feature.querySelector('.dog-portrait-frame')
                    ?.classList.toggle('in', fp > 0.12);
                feature.querySelector('.dog-info-accent')
                    ?.classList.toggle('in', fp > 0.18);
                feature.querySelector('.dog-info-name')
                    ?.classList.toggle('in', fp > 0.22);
                feature.querySelector('.dog-info-divider')
                    ?.classList.toggle('in', fp > 0.26);

                feature.querySelectorAll('.dog-stat').forEach((el, i) => {
                    el.classList.toggle('in', fp > 0.30 + i * 0.04);
                });
                feature.querySelectorAll('.dog-info-tag').forEach((el, i) => {
                    el.classList.toggle('in', fp > 0.38 + i * 0.04);
                });
            });

            // CTA row
            const ctaRow = section.querySelector('.dogs-cta-row');
            if (ctaRow) ctaRow.classList.toggle('in', p > 0.75);
        }

        window.addEventListener('scroll', updateDogs, { passive: true });
        updateDogs();
    })();

    /* ——— PUPPIES Carousel ——— */
    (async function() {
        const track = document.getElementById('puppies-track');
        if (!track) return;

        // Fetch puppies from Supabase
        try {
            if (!window.supabaseClient) throw new Error("Supabase is not configured.");
            const { data, error } = await window.supabaseClient.from('puppies').select('*').order('created_at', { ascending: false });
            if (!error && data) {
                let html = '';
                data.forEach(p => {
                    let statusClass = p.status === 'available' ? 'status-available' : p.status === 'reserved' ? 'status-reserved' : '';
                    let statusDot = `<div class="status-dot"></div>`;
                    let statusText = p.status === 'available' ? 'Elérhető' : p.status === 'reserved' ? 'Foglalt' : 'Tervezett';
                    
                    if (p.status === 'planned') {
                        html += `
                            <div class="puppy-card planned">
                                <div class="planned-inner">
                                    <div class="planned-icon">🐾</div>
                                    <div class="planned-title">${p.name || 'Tervezett Alom'}</div>
                                    <p class="planned-sub">${p.desc || 'Kövesd oldalunkat az első bejelentésért.'}</p>
                                    <a href="#kapcsolat" class="btn-pill-gold" style="margin-top:0.5rem;font-size:0.68rem;">Előjegyezz →</a>
                                </div>
                            </div>
                        `;
                    } else {
                        let badgeHTML = `<div class="puppy-status ${statusClass}">${statusDot}${statusText}</div>`;
                        let ctaHTML = p.status === 'available' 
                            ? `<a href="#kapcsolat" class="puppy-cta">Foglalja le →</a>`
                            : `<span class="puppy-cta reserved">Már Foglalt</span>`;

                        // Generate tags dynamically
                        let tagsHTML = '';
                        if (p.tags) {
                            p.tags.split(',').forEach(tag => {
                                tagsHTML += `<span class="puppy-tag">${tag.trim()}</span>`;
                            });
                        }

                        html += `
                            <div class="puppy-card">
                                <div class="puppy-img-wrap">
                                    <span class="puppy-age-ghost">${p.agenum || '00'}</span>
                                    ${badgeHTML}
                                    <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.background='#1A1816'">
                                </div>
                                <div class="puppy-body">
                                    <div class="puppy-litter">${p.name} · ${p.date || ''}</div>
                                    <div class="puppy-name">${p.name}</div>
                                    <div class="puppy-age-label">${p.agelabel || ''}</div>
                                    <p class="puppy-desc">${p.desc}</p>
                                    <div class="puppy-meta">${tagsHTML}</div>
                                    ${ctaHTML}
                                </div>
                            </div>
                        `;
                    }
                });
                track.innerHTML = html;
            }
        } catch (e) { console.error("Error fetching puppies:", e); }

        const btnPrev = document.querySelector('.p-prev');
        const btnNext = document.querySelector('.p-next');
        if (!btnPrev || !btnNext) return;

        function getScrollAmount() {
            const card = track.querySelector('.puppy-card');
            if (card) {
                const style = window.getComputedStyle(track);
                const gap = parseFloat(style.gap) || 0;
                return card.offsetWidth + gap;
            }
            return 300;
        }

        btnNext.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
    })();

    /* ——— FAQ accordion & scroll reveal ——— */
    (function() {
        const section = document.getElementById('gyik');
        if (!section) return;

        // Accordion click logic
        const faqItems = section.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const header = item.querySelector('.faq-item-header');
            if (header) {
                header.addEventListener('click', () => {
                    const isOpen = item.classList.contains('open');
                    // Close others
                    faqItems.forEach(i => i.classList.remove('open'));
                    item.classList.toggle('open', !isOpen);
                });
            }
        });

        // Scroll reveal logic
        const hInners = section.querySelectorAll('.faq-h-inner');
        const decor   = section.querySelector('.faq-decor');

        function updateFaq() {
            const rect   = section.getBoundingClientRect();
            const vh     = window.innerHeight;
            // p = 0 when section top hits bottom of viewport, 1 when section bottom hits top
            const total  = section.offsetHeight + vh;
            const scrolled = Math.max(0, vh - rect.top);
            const p      = Math.min(1, scrolled / total);

            // Headline lines — staggered
            hInners.forEach((el, i) => {
                el.classList.toggle('in', p > 0.05 + i * 0.05);
            });

            // Decor elements
            if (decor) decor.classList.toggle('in', p > 0.15);

            // Per-item reveals based on viewport entry
            faqItems.forEach((item) => {
                const iRect  = item.getBoundingClientRect();
                const iEnter = Math.max(0, vh - iRect.top);
                // Reveal when 80px into the viewport
                item.classList.toggle('in', iEnter > 80);
            });
        }

        window.addEventListener('scroll', updateFaq, { passive: true });
        updateFaq();
    })();

})();
