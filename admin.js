document.addEventListener('DOMContentLoaded', () => {

    // --- State & DOM ---
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const puppyTableBody = document.getElementById('puppy-table-body');
    const btnAddPuppy = document.getElementById('btn-add-puppy');
    const modal = document.getElementById('puppy-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const puppyForm = document.getElementById('puppy-form');
    const modalTitle = document.getElementById('modal-title');

    // Form inputs
    const pId = document.getElementById('puppy-id');
    const pName = document.getElementById('p-name');
    const pDate = document.getElementById('p-date');
    const pAgeLabel = document.getElementById('p-age-label');
    const pAgeNum = document.getElementById('p-age-num');
    const pStatus = document.getElementById('p-status');
    const pImage = document.getElementById('p-image');
    const pImageFile = document.getElementById('p-image-file');
    const pDesc = document.getElementById('p-desc');
    const pTags = document.getElementById('p-tags');

    const sortSelect = document.getElementById('sort-select');

    // Initial default data if localStorage is empty
    const defaultPuppies = [
        { id: '1', name: 'Hazel Alom', date: '2025. Február', ageLabel: '13 Hetes', ageNum: '13', status: 'available', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=900&auto=format&fit=crop', desc: 'Csodálatos, vidám temperamentű kölyök, kiemelkedő vonalakból. Vörös-fawn színű kislány, szocializált, gyerekbarát.', tags: 'Kislány, Vörös-Fawn, FCI Pedigré' },
        { id: '2', name: 'Bella Alom', date: '2025. Március', ageLabel: '10 Hetes', ageNum: '10', status: 'reserved', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=900&auto=format&fit=crop', desc: 'Rendkívül elegáns, kék-szürke kisfiú, kiváló fajtajelleggel. Baranya Megye Legjobb Kölyök Díj szüleinek ivadéka.', tags: 'Kisfiú, Kék-Szürke, FCI Pedigré' },
        { id: '3', name: 'Luna Alom', date: '2025. Május', ageLabel: '8 Hetes', ageNum: '8', status: 'available', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=900&auto=format&fit=crop', desc: 'Játékos, hihetetlenül okos fekete kisfiú. Családi környezetben, rengeteg szeretettel nevelkedik.', tags: 'Kisfiú, Fekete, FCI Pedigré' },
        { id: '4', name: 'Mokka Alom', date: '2025. Január', ageLabel: '12 Hetes', ageNum: '12', status: 'reserved', image: 'https://images.unsplash.com/photo-1537151608804-ea2f1ea21a60?q=80&w=900&auto=format&fit=crop', desc: 'Szelíd, bújós isabella kislány. Gyönyörű felépítésű, kiállítási potenciállal rendelkező egyed.', tags: 'Kislány, Isabella, FCI Pedigré' },
        { id: '5', name: 'Stella Alom', date: '2024. December', ageLabel: '14 Hetes', ageNum: '14', status: 'available', image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=900&auto=format&fit=crop', desc: 'Nyugodt, elegáns mozgású kék kisfiú. Már szobatisztaságra előnevelt, pórázhoz szoktatott.', tags: 'Kisfiú, Kék, FCI Pedigré' }
    ];

    let puppies = [];

    async function loadPuppies() {
        try {
            const { data, error } = await window.supabaseClient.from('puppies').select('*').order('display_order', { ascending: true }).order('created_at', { ascending: false });
            if (error) throw error;
            puppies = data || [];
            renderTable();
        } catch (err) {
            console.error("Error loading puppies:", err);
            // Optionally, we could show an error UI to the user
        }
    }

    // --- Authentication ---
    function checkAuth() {
        if (sessionStorage.getItem('admin_logged_in') === 'true') {
            loginView.style.display = 'none';
            dashboardView.style.display = 'flex';
            renderTable();
        } else {
            loginView.style.display = 'flex';
            dashboardView.style.display = 'none';
        }
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (email === 'kemenyadam1017@gmail.com' && password === 'Valami123') {
            sessionStorage.setItem('admin_logged_in', 'true');
            loginError.style.display = 'none';
            checkAuth();
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_logged_in');
        checkAuth();
    });

    // --- CRUD Logic ---
    function getSortedPuppies() {
        const val = sortSelect.value;
        const sorted = [...puppies];
        if (val === 'default') {
            sorted.sort((a, b) => {
                const aOrder = a.display_order || 0;
                const bOrder = b.display_order || 0;
                if (aOrder !== bOrder) return aOrder - bOrder;
                return new Date(b.created_at) - new Date(a.created_at);
            });
        } else if (val === 'name-asc') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else if (val === 'name-desc') {
            sorted.sort((a, b) => b.name.localeCompare(a.name));
        } else if (val === 'age-asc') {
            sorted.sort((a, b) => parseInt(a.agenum || 0) - parseInt(b.agenum || 0));
        } else if (val === 'age-desc') {
            sorted.sort((a, b) => parseInt(b.agenum || 0) - parseInt(a.agenum || 0));
        }
        return sorted;
    }

    sortSelect.addEventListener('change', renderTable);

    function renderTable() {
        puppyTableBody.innerHTML = '';
        const sortedPuppies = getSortedPuppies();
        
        sortedPuppies.forEach((p, index) => {
            let statusBadge = '';
            if (p.status === 'available') statusBadge = '<span class="status-badge status-available">Elérhető</span>';
            else if (p.status === 'reserved') statusBadge = '<span class="status-badge status-reserved">Foglalt</span>';
            else statusBadge = '<span class="status-badge status-planned">Tervezett</span>';

            let moveButtons = '';
            if (sortSelect.value === 'default') {
                const isFirst = index === 0;
                const isLast = index === sortedPuppies.length - 1;
                moveButtons = `
                    <button class="btn-icon" ${isFirst ? 'disabled style="opacity:0.3"' : ''} onclick="movePuppyUp('${p.id}')">⬆️</button>
                    <button class="btn-icon" ${isLast ? 'disabled style="opacity:0.3"' : ''} onclick="movePuppyDown('${p.id}')">⬇️</button>
                `;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${p.image}" class="table-img" alt="${p.name}"></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.agelabel} <br><small style="color:var(--muted)">${p.date}</small></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="action-btns">
                        ${moveButtons}
                        <button class="btn-icon" onclick="editPuppy('${p.id}')">Szerkesztés</button>
                        <button class="btn-icon btn-delete" onclick="deletePuppy('${p.id}')">Törlés</button>
                    </div>
                </td>
            `;
            puppyTableBody.appendChild(tr);
        });
    }

    // Modal helpers
    function openModal() { modal.style.display = 'flex'; }
    function closeModal() { modal.style.display = 'none'; puppyForm.reset(); }

    btnAddPuppy.addEventListener('click', () => {
        modalTitle.textContent = 'Új Kölyök Hozzáadása';
        pId.value = '';
        openModal();
    });

    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    function getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    puppyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let finalImage = pImage.value;
        // If a file was selected, convert it to Base64 (takes precedence over URL)
        if (pImageFile.files && pImageFile.files[0]) {
            try {
                finalImage = await getBase64(pImageFile.files[0]);
            } catch (err) {
                console.error("Hiba a kép beolvasásakor:", err);
            }
        }

        // Fallback placeholder if empty
        if (!finalImage) {
            finalImage = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=900&auto=format&fit=crop';
        }

        const newPuppy = {
            name: pName.value,
            date: pDate.value,
            agelabel: pAgeLabel.value,
            agenum: pAgeNum.value,
            status: pStatus.value,
            image: finalImage,
            desc: pDesc.value,
            tags: pTags.value
        };

        try {
            if (pId.value) {
                // Edit existing
                const { error } = await window.supabaseClient.from('puppies').update(newPuppy).eq('id', pId.value);
                if (error) throw error;
            } else {
                // Add new (put at end of list)
                const maxOrder = puppies.reduce((max, p) => Math.max(max, p.display_order || 0), 0);
                newPuppy.display_order = maxOrder + 10;
                
                const { error } = await window.supabaseClient.from('puppies').insert([newPuppy]);
                if (error) throw error;
            }
            await loadPuppies(); // Refresh table
            closeModal();
        } catch (err) {
            console.error("Error saving puppy:", err);
            alert("Hiba történt a mentés során.");
        }
    });

    // Make functions globally available for inline onclick
    window.editPuppy = function(id) {
        const p = puppies.find(x => x.id === id);
        if (!p) return;
        
        modalTitle.textContent = 'Kölyök Szerkesztése';
        pId.value = p.id;
        pName.value = p.name;
        pDate.value = p.date;
        pAgeLabel.value = p.agelabel;
        pAgeNum.value = p.agenum;
        pStatus.value = p.status;
        pImage.value = p.image;
        pDesc.value = p.desc;
        pTags.value = p.tags;

        openModal();
    };

    window.deletePuppy = async function(id) {
        if (confirm('Biztosan törölni szeretné ezt a kölyköt?')) {
            try {
                const { error } = await window.supabaseClient.from('puppies').delete().eq('id', id);
                if (error) throw error;
                await loadPuppies();
            } catch (err) {
                console.error("Hiba törléskor:", err);
            }
        }
    };

    // Reordering Logic
    async function ensureDisplayOrder() {
        const needsInit = puppies.every(p => !p.display_order || p.display_order === 0);
        if (needsInit) {
            const sorted = getSortedPuppies();
            for (let i = 0; i < sorted.length; i++) {
                sorted[i].display_order = (i + 1) * 10;
                await window.supabaseClient.from('puppies').update({ display_order: sorted[i].display_order }).eq('id', sorted[i].id);
            }
        }
    }

    window.movePuppyUp = async function(id) {
        await ensureDisplayOrder();
        const sorted = getSortedPuppies();
        const idx = sorted.findIndex(p => p.id === id);
        if (idx <= 0) return;
        
        const current = sorted[idx];
        const prev = sorted[idx - 1];
        
        const temp = current.display_order;
        current.display_order = prev.display_order;
        prev.display_order = temp;

        renderTable(); // Update UI immediately for responsiveness

        await Promise.all([
            window.supabaseClient.from('puppies').update({ display_order: current.display_order }).eq('id', current.id),
            window.supabaseClient.from('puppies').update({ display_order: prev.display_order }).eq('id', prev.id)
        ]);
        await loadPuppies(); // Refresh full state
    };

    window.movePuppyDown = async function(id) {
        await ensureDisplayOrder();
        const sorted = getSortedPuppies();
        const idx = sorted.findIndex(p => p.id === id);
        if (idx < 0 || idx >= sorted.length - 1) return;
        
        const current = sorted[idx];
        const next = sorted[idx + 1];
        
        const temp = current.display_order;
        current.display_order = next.display_order;
        next.display_order = temp;

        renderTable();

        await Promise.all([
            window.supabaseClient.from('puppies').update({ display_order: current.display_order }).eq('id', current.id),
            window.supabaseClient.from('puppies').update({ display_order: next.display_order }).eq('id', next.id)
        ]);
        await loadPuppies();
    };

    // --- Sidebar Navigation ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item:not([disabled])');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const viewId = btn.getAttribute('data-view');
            dashboardSections.forEach(sec => sec.style.display = 'none');
            document.getElementById(viewId).style.display = 'block';

            if (viewId === 'gallery-view') {
                setTimeout(updateAdminGallerySlider, 50);
            }
        });
    });

    // ==========================================
    // GALLERY MANAGEMENT LOGIC
    // ==========================================
    
    // Default gallery data matching the main site
    const defaultGalleryData = {
        'track-teljes': [
            { id: 'g1', src: '01.jpg', cap: 'Elegancia', panel: 1 },
            { id: 'g2', src: '02.jpg', cap: 'Melegség', panel: 1 },
            { id: 'g3', src: '03.jpg', cap: 'Sebesség', panel: 1 },
            { id: 'g4', src: '04.jpg', cap: 'Lélek', panel: 1 },
            { id: 'g5', src: '05.jpg', cap: 'Szabadság', panel: 1 },
            { id: 'g6', src: '06.jpg', cap: 'Futás', panel: 2 },
            { id: 'g7', src: '07.jpg', cap: 'Karakter', panel: 2 },
            { id: 'g8', src: '08.jpg', cap: 'Derű', panel: 2 },
            { id: 'g9', src: '09.jpg', cap: 'Arány', panel: 2 }
        ],
        'track-kiallitas': [
            { id: 'k1', src: '01.jpg', cap: 'Elegancia', panel: 1 },
            { id: 'k2', src: '02.jpg', cap: 'Melegség', panel: 1 },
            { id: 'k3', src: '03.jpg', cap: 'Sebesség', panel: 1 },
            { id: 'k4', src: '04.jpg', cap: 'Lélek', panel: 1 },
            { id: 'k5', src: '05.jpg', cap: 'Szabadság', panel: 1 },
            { id: 'k6', src: '06.jpg', cap: 'Futás', panel: 2 },
            { id: 'k7', src: '07.jpg', cap: 'Karakter', panel: 2 },
            { id: 'k8', src: '08.jpg', cap: 'Derű', panel: 2 },
            { id: 'k9', src: '09.jpg', cap: 'Arány', panel: 2 }
        ]
    };

    let galleryData = { 'track-teljes': [], 'track-kiallitas': [] };

    async function loadGallery() {
        try {
            // Sort by created_at to maintain stable ordering matching the UI layout expectations
            const { data, error } = await window.supabaseClient.from('gallery').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            
            galleryData = { 'track-teljes': [], 'track-kiallitas': [] };
            
            if (data && data.length > 0) {
                data.forEach(row => {
                    if (galleryData[row.track_id]) {
                        galleryData[row.track_id].push({
                            id: row.id,
                            src: row.src,
                            cap: row.cap,
                            panel: Number(row.panel)
                        });
                    }
                });
            }
            renderAdminGallery();
        } catch (err) {
            console.error("Error loading gallery:", err);
        }
    }

    const adminGalleryTracks = document.getElementById('adminGalleryTracks');
    let activeGalleryTrackId = 'track-teljes';

    function renderAdminGallery() {
        adminGalleryTracks.innerHTML = '';
        
        ['track-teljes', 'track-kiallitas'].forEach(trackId => {
            const trackDiv = document.createElement('div');
            trackDiv.className = `gallery-track ${trackId === activeGalleryTrackId ? 'active' : ''}`;
            trackDiv.id = `admin-${trackId}`;

            const images = galleryData[trackId];

            let html = `<div class="gallery-panel">`;
            
            images.forEach(img => {
                html += `
                    <div class="gi" onclick="openGalleryModal('${trackId}', '${img.id}')">
                        <img src="${img.src}" loading="lazy" alt="${img.cap}">
                        <span class="gi-cap">${img.cap}</span>
                    </div>
                `;
            });
            
            html += `</div>`;

            trackDiv.innerHTML = html;
            adminGalleryTracks.appendChild(trackDiv);
        });
    }

    // Toggle Buttons for Gallery
    const adminGalleryBtns = document.querySelectorAll('#adminGalleryToggle .gt-btn');
    const adminGtSlider = document.getElementById('adminGtSlider');

    function updateAdminGallerySlider() {
        const activeBtn = document.querySelector('#adminGalleryToggle .gt-btn.active');
        if (activeBtn && adminGtSlider) {
            adminGtSlider.style.width = activeBtn.offsetWidth + 'px';
            adminGtSlider.style.left = activeBtn.offsetLeft + 'px';
        }
    }

    adminGalleryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            adminGalleryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateAdminGallerySlider();

            activeGalleryTrackId = btn.getAttribute('data-target');
            document.querySelectorAll('#adminGalleryTracks .gallery-track').forEach(t => t.classList.remove('active'));
            document.getElementById(`admin-${activeGalleryTrackId}`).classList.add('active');
        });
    });

    setTimeout(updateAdminGallerySlider, 100);

    // Gallery Modal Logic
    const galleryModal = document.getElementById('gallery-modal');
    const btnCloseGalleryModal = document.getElementById('btn-close-gallery-modal');
    const btnCancelGalleryModal = document.getElementById('btn-cancel-gallery-modal');
    const galleryForm = document.getElementById('gallery-form');
    
    const gTrackId = document.getElementById('g-track-id');
    const gImageId = document.getElementById('g-image-id');
    const gPreviewImg = document.getElementById('g-preview-img');
    const gImageFile = document.getElementById('g-image-file');
    const gImageUrl = document.getElementById('g-image');
    const gCaption = document.getElementById('g-caption');

    window.openGalleryModal = function(trackId, imageId) {
        const trackArr = galleryData[trackId];
        const imgObj = trackArr.find(x => x.id === imageId);
        if (!imgObj) return;

        gTrackId.value = trackId;
        gImageId.value = imageId;
        gPreviewImg.src = imgObj.src;
        gImageUrl.value = imgObj.src.startsWith('data:') ? '' : imgObj.src; 
        gCaption.value = imgObj.cap;
        gImageFile.value = ''; 

        galleryModal.style.display = 'flex';
    };

    function closeGalleryModal() {
        galleryModal.style.display = 'none';
        galleryForm.reset();
    }

    btnCloseGalleryModal.addEventListener('click', closeGalleryModal);
    btnCancelGalleryModal.addEventListener('click', closeGalleryModal);

    gImageUrl.addEventListener('input', () => {
        if (gImageUrl.value) gPreviewImg.src = gImageUrl.value;
    });

    gImageFile.addEventListener('change', async () => {
        if (gImageFile.files && gImageFile.files[0]) {
            try {
                const base64 = await getBase64(gImageFile.files[0]);
                gPreviewImg.src = base64;
            } catch (err) {
                console.error("Preview fail:", err);
            }
        }
    });

    galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let finalImage = gPreviewImg.src; // Use whatever is in the preview currently
        const imageId = gImageId.value;
        
        try {
            const { error } = await window.supabaseClient.from('gallery').update({
                src: finalImage,
                cap: gCaption.value
            }).eq('id', imageId);
            
            if (error) throw error;
            await loadGallery();
            closeGalleryModal();
        } catch (err) {
            console.error("Error updating gallery:", err);
            alert("Hiba történt a mentés során.");
        }
    });

    // Initialize both views
    loadPuppies();
    loadGallery();
    checkAuth();
});
