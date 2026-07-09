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
        const paras   = [
            document.getElementById('ap0'), 
            document.getElementById('ap1'),
            document.getElementById('ap2'),
            document.getElementById('ap3'),
            document.getElementById('ap4'),
            document.getElementById('ap5')
        ];
        const feats   = container.querySelectorAll('.about-feat-pill');
        const img     = document.getElementById('aboutImg');
        const overlay = document.getElementById('aboutOverlay');
        const progLine = document.getElementById('aboutLine');

        const hLines = container.querySelectorAll('.about-h-line');
        const animEls = [eyebrow, ...hLines, ...paras, ...feats].filter(Boolean);

        function update() {
            if (window.innerWidth <= 768) {
                if (progLine) progLine.style.height = '';
                if (img) img.style.transform = '';
                if (overlay) overlay.style.opacity = '';
                const textContent = container.querySelector('.about-content');
                if (textContent) textContent.style.transform = '';
                animEls.forEach(el => {
                    el.style.opacity = '';
                    el.style.transform = '';
                    if (el.classList.contains('about-h-line')) {
                        const inner = el.querySelector('.about-h-inner');
                        if (inner) inner.style.transform = '';
                    }
                });
                return;
            }

            const rect    = container.getBoundingClientRect();
            const total   = container.offsetHeight - window.innerHeight;
            if (total <= 0) return; 
            
            const scrolled = Math.max(0, -rect.top);
            const p        = Math.max(0, Math.min(1, scrolled / total));

            // Gold progress line grows down the divider
            if (progLine) progLine.style.height = (p * 100) + '%';

            // Image: scale eases down, dark veil lifts
            if (img)     img.style.transform     = `scale(${1.15 - p * 0.15})`;
            if (overlay) overlay.style.opacity   = Math.max(0, 0.8 - p * 1.1);

            // Pure scroll scrub for text elements mapped to 'p' (0 to 1)
            // Phase 1: Text stays still and fades in (p: 0 -> 0.4)
            // Phase 2: Text pans upwards to reveal overflow (p: 0.35 -> 1.0)
            
            const textContent = container.querySelector('.about-content');
            if (textContent) {
                const overflow = Math.max(0, textContent.offsetHeight - window.innerHeight + 200); // 200px padding at bottom
                const panP = Math.max(0, (p - 0.35) / 0.65);
                textContent.style.transform = `translateY(${-overflow * panP}px)`;
            }

            animEls.forEach((el, i) => {
                // Spread the reveals over the first 60% of the scroll
                const startScrub = i * 0.04; 
                const scrubDist = 0.06; 
                
                let elP = 0;
                if (p >= startScrub) {
                    elP = Math.min(1, (p - startScrub) / scrubDist);
                }

                const easeOutQuad = elP * (2 - elP);
                el.style.opacity = easeOutQuad;

                if (el.classList.contains('about-eyebrow')) {
                    el.style.transform = `translateX(${-24 * (1 - easeOutQuad)}px)`;
                } else if (el.classList.contains('about-h-line')) {
                    const inner = el.querySelector('.about-h-inner');
                    if (inner) {
                        inner.style.transform = `translateY(${108 * (1 - easeOutQuad)}%) skewY(${5 * (1 - easeOutQuad)}deg)`;
                    }
                } else if (el.classList.contains('about-feat-pill')) {
                    el.style.transform = `translateX(${28 * (1 - easeOutQuad)}px)`;
                } else {
                    el.style.transform = `translateY(${22 * (1 - easeOutQuad)}px)`;
                }
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
                Object.keys(tracks).forEach(trackId => {
                    const activeClass = trackId === 'track-teljes' ? ' active' : '';
                    html += `<div class="gallery-track${activeClass}" id="${trackId}">`;
                    
                    // Group images by panel inside this track
                    const panels = {};
                    tracks[trackId].forEach(img => {
                        const pNum = img.panel || 1;
                        if (!panels[pNum]) panels[pNum] = [];
                        panels[pNum].push(img);
                    });

                    // Render panels
                    Object.keys(panels).sort().forEach(pNum => {
                        html += `<div class="gallery-panel gallery-panel-${pNum}">`;
                        panels[pNum].forEach(img => {
                            html += `
                                <div class="gi">
                                    <img src="${img.src}" alt="${img.cap || ''}" loading="lazy">
                                    <span class="gi-cap">${img.cap || ''}</span>
                                </div>
                            `;
                        });
                        html += `</div>`;
                    });

                    html += `</div>`;
                });
                
                tracksContainer.innerHTML = html;
                
                // Refresh the NodeList of items now that they are rendered
                if (typeof refreshGalItems === 'function') refreshGalItems();
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

            // Horizontal slide with a deadzone so it doesn't slide immediately
            const trackWidth  = activeTrack.scrollWidth;
            const vw          = window.innerWidth;
            const maxMove     = Math.max(0, trackWidth - vw + 64); // 64px padding allowance

            const slideDeadzone = 0.25; // 25% of sticky scroll is stationary
            const slideP = p < slideDeadzone ? 0 : (p - slideDeadzone) / (1 - slideDeadzone);

            activeTrack.style.transform = `translate3d(${-maxMove * slideP}px, 0, 0)`;

            // Fully scroll driven reveal mapping total viewport-to-viewport scroll
            const revealTotal = galContainer.offsetHeight;
            const revealScrolled = Math.max(0, window.innerHeight - rect.top);
            const revealP = revealTotal > 0 ? Math.min(1, revealScrolled / revealTotal) : 0;

            galItems.forEach((item, i) => {
                let threshold = Math.min(0.95, i * (0.95 / Math.max(1, galItems.length)));
                item.classList.toggle('revealed', revealP >= threshold);
                item.style.transitionDelay = '0s'; // override any previous delays
            });
        }

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;

                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateSlider(btn);

                const targetId = btn.getAttribute('data-target');
                document.querySelectorAll('.gallery-track').forEach(t => {
                    t.classList.remove('active');
                    t.querySelectorAll('.gi').forEach(gi => gi.classList.remove('revealed'));
                });
                
                activeTrack = document.getElementById(targetId);
                if (activeTrack) {
                    activeTrack.classList.add('active');
                    activeTrack.classList.add('animating');
                    galItems = activeTrack.querySelectorAll('.gi');
                    updateGallery();
                    
                    // Reset scroll to start of gallery so it shows the first image
                    const topOffset = galContainer.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top: topOffset, behavior: 'smooth' });
                }
            });
        });

        function refreshGalItems() {
            if (activeTrack) galItems = activeTrack.querySelectorAll('.gi');
            updateGallery();
        }

        // Initialize when data is fetched
        setTimeout(refreshGalItems, 500);

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
            const features = section.querySelectorAll('.dog-feature');
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
            const { data, error } = await window.supabaseClient.from('puppies').select('*').order('display_order', { ascending: false }).order('created_at', { ascending: false });
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
                            ? `<a href="#kapcsolat" class="puppy-cta">Foglald le →</a>`
                            : `<span class="puppy-cta reserved">Már Foglalt</span>`;

                        // Generate tags dynamically
                        let tagsHTML = '';
                        if (p.tags) {
                            p.tags.split(',').forEach(tag => {
                                tagsHTML += `<span class="puppy-tag">${tag.trim()}</span>`;
                            });
                        }

                        let imageUrls = [];
                        if (p.image && p.image.startsWith('[')) {
                            try {
                                imageUrls = JSON.parse(p.image);
                            } catch(e) {
                                imageUrls = [p.image];
                            }
                        } else {
                            imageUrls = [p.image || ''];
                        }
                        let firstImg = imageUrls[0] || '';
                        
                        let sliderControls = '';
                        let dataImagesAttrs = '';
                        if (imageUrls.length > 1) {
                            let dotsHTML = imageUrls.map((_, i) => `<div class="puppy-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
                            dataImagesAttrs = `data-images='${JSON.stringify(imageUrls).replace(/'/g, "&#39;")}' data-index="0"`;
                            sliderControls = `
                                <div class="puppy-slider-nav">
                                    <button class="puppy-slider-btn prev" onclick="changePuppyImage(event, this, -1)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                                    </button>
                                    <button class="puppy-slider-btn next" onclick="changePuppyImage(event, this, 1)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                                    </button>
                                </div>
                                <div class="puppy-dots">${dotsHTML}</div>
                            `;
                        }

                        html += `
                            <div class="puppy-card" ${dataImagesAttrs}>
                                <div class="puppy-img-wrap">
                                    <span class="puppy-age-ghost">${p.agenum || '00'}</span>
                                    ${badgeHTML}
                                    <img src="${firstImg}" class="puppy-main-img" alt="${p.name}" loading="lazy" onerror="this.style.background='#1A1816'">
                                    ${sliderControls}
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
                
                const showMoreWrap = document.getElementById("puppies-show-more");
                if (showMoreWrap && data.length > 4) {
                    showMoreWrap.classList.add("has-more-puppies");
                }
            }
        } catch (e) { console.error("Error fetching puppies:", e); }
    })();

    // Global function for puppy slider
    window.changePuppyImage = function(e, btn, direction) {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.puppy-card');
        if (!card) return;
        
        const imagesStr = card.getAttribute('data-images');
        if (!imagesStr) return;
        
        let images = [];
        try {
            images = JSON.parse(imagesStr);
        } catch(e) { return; }
        
        let currentIndex = parseInt(card.getAttribute('data-index') || '0', 10);
        currentIndex += direction;
        
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;
        
        card.setAttribute('data-index', currentIndex);
        
        const imgEl = card.querySelector('.puppy-main-img');
        if (imgEl) {
            imgEl.src = images[currentIndex];
        }
        
        const dots = card.querySelectorAll('.puppy-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    };

    (function initPuppyCarousel() {
        const track = document.getElementById('puppies-track');
        if (!track) return;
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


    /* ——— DOGS dynamic fetch & render ——— */
    (async function() {
        const track = document.getElementById('dogs-track');
        if (!track) return;

        try {
            if (!window.supabaseClient) throw new Error("Supabase is not configured.");
            const { data, error } = await window.supabaseClient.from('dogs').select('*').order('display_order', { ascending: false }).order('created_at', { ascending: true });
            if (!error && data) {
                let html = '';
                data.forEach((d, index) => {
                    const isLeft = index % 2 === 0;
                    let featureClass = isLeft ? 'dog-feature--left' : 'dog-feature--right';
                    if (index >= 4) {
                        featureClass += ' dog-hidden';
                    }
                    const displayIndex = String(index + 1).padStart(2, '0');
                    
                    let imageUrls = [];
                    if (d.images && d.images.startsWith('[')) {
                        try {
                            imageUrls = JSON.parse(d.images);
                        } catch(e) {
                            imageUrls = [d.images];
                        }
                    } else {
                        imageUrls = [d.images || ''];
                    }
                    let firstImg = imageUrls[0] || 'assets/dog_placeholder.jpg';
                    
                    let sliderControls = '';
                    let dataImagesAttrs = '';
                    if (imageUrls.length > 1) {
                        let dotsHTML = imageUrls.map((_, i) => `<div class="dog-dot ${i === 0 ? 'active' : ''}"></div>`).join('');
                        dataImagesAttrs = `data-images='${JSON.stringify(imageUrls).replace(/'/g, "&#39;")}' data-index="0"`;
                        sliderControls = `
                            <div class="dog-slider-nav">
                                <button class="dog-slider-btn prev" onclick="changeDogImage(event, this, -1)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                                </button>
                                <button class="dog-slider-btn next" onclick="changeDogImage(event, this, 1)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                                </button>
                            </div>
                            <div class="dog-dots">${dotsHTML}</div>
                        `;
                    }

                    html += `
                        <article class="dog-feature ${featureClass}" ${dataImagesAttrs}>
                            <span class="dog-index" aria-hidden="true">${displayIndex}</span>
                            <div class="dog-portrait">
                                <div class="dog-portrait-frame">
                                    <img src="${firstImg}" class="dog-main-img" alt="${d.name}" loading="lazy">
                                    ${sliderControls}
                                    <div class="dog-portrait-overlay"></div>
                                </div>
                                <span class="dog-vert-label" aria-hidden="true">La Perla Piccola</span>
                            </div>
                            <div class="dog-info-card">
                                <div class="dog-info-accent"></div>
                                <div class="dog-info-name">${d.name}</div>
                                <div class="dog-info-subtitle">${d.subtitle || 'Piccolo Levriero Italiano'}</div>
                                <p class="dog-info-desc">${d.description || ''}</p>
                                <div class="dog-info-divider"></div>
                                <div class="dog-info-stats">
                                    <div class="dog-stat">
                                        <span class="dog-stat-label">Született</span>
                                        <span class="dog-stat-value">${d.birth_date || ''}</span>
                                    </div>
                                    ${d.results ? `<div class="dog-stat" style="grid-column: 1 / -1;">
                                        <span class="dog-stat-label">Eredmények</span>
                                        <span class="dog-stat-value">${d.results}</span>
                                    </div>` : ''}
                                </div>
                            </div>
                        </article>
                    `;
                });
                track.innerHTML = html;

                // Trigger a scroll event to immediately evaluate scroll-based reveals for newly added dogs
                window.dispatchEvent(new Event('scroll'));
                
                // Hide the "Show all" button if there are 4 or fewer dogs
                const showAllDogsBtn = document.getElementById("show-all-dogs-btn");
                if (showAllDogsBtn && data.length <= 4) {
                    showAllDogsBtn.parentElement.style.display = "none";
                }
            }
        } catch (e) { console.error("Error fetching dogs:", e); }
    })();

    // Global function for dog slider
    window.changeDogImage = function(e, btn, direction) {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('.dog-feature');
        if (!card) return;
        
        const imagesStr = card.getAttribute('data-images');
        if (!imagesStr) return;
        
        let images = [];
        try {
            images = JSON.parse(imagesStr);
        } catch(e) { return; }
        
        let currentIndex = parseInt(card.getAttribute('data-index') || '0', 10);
        currentIndex += direction;
        
        if (currentIndex < 0) currentIndex = images.length - 1;
        if (currentIndex >= images.length) currentIndex = 0;
        
        card.setAttribute('data-index', currentIndex);
        
        const imgEl = card.querySelector('.dog-main-img');
        if (imgEl) {
            imgEl.src = images[currentIndex];
        }
        
        const dots = card.querySelectorAll('.dog-dot');
        dots.forEach((dot, idx) => {
            if (idx === currentIndex) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    };

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

    /* ——— GENERAL SCROLL REVEALS (Fade Up Scrub) ——— */
    (function() {
        const fadeEls = document.querySelectorAll('.fade-up-scroll');
        if (fadeEls.length === 0) return;

        function updateFades() {
            const vh = window.innerHeight;
            fadeEls.forEach(el => {
                const rect = el.getBoundingClientRect();
                
                // Element starts revealing when its top crosses into the bottom 10% of the viewport
                const startReveal = vh * 0.9;
                // Element is fully revealed when it reaches 65% down the viewport
                const endReveal = vh * 0.65;
                
                let p = 0;
                if (rect.top > startReveal) {
                    p = 0;
                } else if (rect.top < endReveal) {
                    p = 1;
                } else {
                    p = 1 - ((rect.top - endReveal) / (startReveal - endReveal));
                }
                
                // Linear map for smooth, predictable scrolling without jumping at edges
                el.style.opacity = p;
                el.style.transform = `translateY(${40 * (1 - p)}px)`;
            });
        }

        let fadeTicking = false;
        window.addEventListener('scroll', () => {
            if (!fadeTicking) {
                window.requestAnimationFrame(() => {
                    updateFades();
                    fadeTicking = false;
                });
                fadeTicking = true;
            }
        }, { passive: true });
        
        updateFades();
    })();

    /* ——— MOBILE NAV TOGGLE ——— */
    (function() {
        const nav = document.getElementById('nav');
        const hamburger = document.getElementById('navHamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileLinks = document.querySelectorAll('.mm-item, .mm-cta');

        if (hamburger && mobileMenu && nav) {
            hamburger.addEventListener('click', () => {
                nav.classList.toggle('menu-open');
                mobileMenu.classList.toggle('open');
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('menu-open');
                    mobileMenu.classList.remove('open');
                });
            });
        }
    })();

    /* ——— SMOOTH ANCHOR SCROLLING ——— */
    (function() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').substring(1);
                if (!targetId) return;
                
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    let offset = targetElement.getBoundingClientRect().top + window.scrollY;
                    
                    if (targetId === 'rolunk') {
                        // The section itself is sticky. To make the text fully reveal without the nav covering it,
                        // we must jump DEEP into the scroll container's progress.
                        offset += window.innerHeight * 1.2; 
                    } else {
                        // Standard offset for other sections
                        offset -= 120;
                    }
                    
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }
            });
        });
    })();
})();


document.addEventListener("DOMContentLoaded", function() {
    const showAllPuppiesBtn = document.getElementById("show-all-puppies-btn");
    if (showAllPuppiesBtn) {
        showAllPuppiesBtn.addEventListener("click", function() {
            const track = document.getElementById("puppies-track");
            if (track) track.classList.add("show-all-mobile");
            showAllPuppiesBtn.parentElement.style.display = "none";
        });
    }

    const showAllDogsBtn = document.getElementById("show-all-dogs-btn");
    if (showAllDogsBtn) {
        showAllDogsBtn.addEventListener("click", function() {
            const hiddenDogs = document.querySelectorAll(".dog-hidden");
            hiddenDogs.forEach(function(dog) {
                dog.classList.remove("dog-hidden");
            });
            showAllDogsBtn.parentElement.style.display = "none";
            // If there is any scroll-based animation, we trigger a window resize or scroll to recalculate
            window.dispatchEvent(new Event("resize"));
        });
    }
});
