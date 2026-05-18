/**
 * LUZ GOMEZ - TIENDA ARTESANAL
 * JavaScript principal - Funcionalidades interactivas
 */

function ensureStoreActionOverlay() {
    let overlay = document.getElementById('storeActionOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'storeActionOverlay';
    overlay.className = 'store-action-overlay';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
        <div class="store-action-card">
            <div class="store-action-spinner" aria-hidden="true"></div>
            <strong class="store-action-title">Cargando</strong>
            <p class="store-action-message" id="storeActionMessage">Un momento...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function setStoreActionOverlay(active, message) {
    const overlay = ensureStoreActionOverlay();
    const label = document.getElementById('storeActionMessage');
    if (label && message) label.textContent = message;
    overlay.classList.toggle('active', active);
    overlay.setAttribute('aria-hidden', active ? 'false' : 'true');
}

async function withStoreBusy(target, message, task) {
    if (target?.dataset?.busy === 'true') return null;
    if (target?.dataset) target.dataset.busy = 'true';
    target?.classList?.add('is-loading');
    target?.setAttribute?.('aria-busy', 'true');
    setStoreActionOverlay(true, message);
    try {
        return await task();
    } catch (error) {
        if (typeof window.lgShowToast === 'function') window.lgShowToast(error.message || 'No se pudo cargar');
        return null;
    } finally {
        setStoreActionOverlay(false);
        target?.classList?.remove('is-loading');
        target?.removeAttribute?.('aria-busy');
        if (target?.dataset) delete target.dataset.busy;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // VARIABLES GLOBALES
    // ==========================================
    const header = document.getElementById('header');
    const menuToggle = document.getElementById('menuToggle');
    const navMobile = document.getElementById('navMobile');
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartClose = document.getElementById('cartClose');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const themeToggle = document.getElementById('themeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    const backToTop = document.getElementById('backToTop');
    const loader = document.getElementById('page-loader');
    const contactForm = document.getElementById('contactForm');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const modal = document.getElementById('quickViewModal');
    const modalClose = document.getElementById('modalClose');
    
    let cart = [];
    let currentSlide = 0;

    // ==========================================
    // LOADER INICIAL
    // ==========================================
    setTimeout(() => {
        loader.classList.add('hidden');
    }, 2200);

    // ==========================================
    // HEADER STICKY AL SCROLL
    // ==========================================
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Botón volver arriba
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==========================================
    // MENÚ HAMBURGUESA
    // ==========================================
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMobile.classList.toggle('active');
        document.body.style.overflow = navMobile.classList.contains('active') ? 'hidden' : '';
    });

    // Cerrar menú al hacer click en un link
    document.querySelectorAll('.nav-mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMobile.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // ==========================================
    // NAVEGACIÓN ACTIVA EN SCROLL
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ==========================================
    // MODO OSCURO / CLARO
    // ==========================================
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // ==========================================
    // CERRAR SESION
    // ==========================================
    function logout() {
        localStorage.removeItem('lg_session');
        window.location.href = '../index.html';
    }

    [logoutBtn, mobileLogoutBtn].forEach(button => {
        if (button) {
            button.addEventListener('click', logout);
        }
    });

    // ==========================================
    // CARRITO DE COMPRAS
    // ==========================================
    function openCart() {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    cartBtn.addEventListener('click', openCart);
    cartClose.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    function addToCart(name, price, img) {
        const existingItem = cart.find(item => item.name === name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name, price: parseFloat(price), img, quantity: 1 });
        }
        
        updateCart();
        showToast(`"${name}" agregado al carrito`);
        
        // Animación del contador
        cartCount.style.animation = 'none';
        setTimeout(() => cartCount.style.animation = '', 10);
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        updateCart();
    }

    function updateCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        cartCount.textContent = totalItems;
        cartTotal.textContent = `$ ${totalPrice.toFixed(2)}`;
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-basket"></i>
                    <p>Tu carrito está vacío</p>
                    <span>¡Agrega productos hermosos!</span>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$ ${item.price.toFixed(2)} x ${item.quantity}</div>
                        <button class="cart-item-remove" onclick="window.removeCartItem(${index})">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Actualizar enlace de WhatsApp con productos
        updateWhatsAppLink(totalPrice);
    }

    function updateWhatsAppLink(total) {
        const checkoutBtn = document.querySelector('.cart-checkout');
        if (cart.length > 0) {
            const itemsList = cart.map(item => `- ${item.name} (x${item.quantity}): $ ${(item.price * item.quantity).toFixed(2)}`).join('%0A');
            const message = `Hola, quiero comprar estos productos:%0A%0A${itemsList}%0A%0ATotal: $ ${total.toFixed(2)}`;
            checkoutBtn.href = `https://wa.me/573213092850?text=${message}`;
        }
    }

    // Exponer función global para eliminar items
    function buildCartMessage(total) {
        const itemsList = cart
            .map(item => `- ${item.name} (x${item.quantity}): $ ${(item.price * item.quantity).toFixed(2)}`)
            .join('\n');
        return `Hola, quiero comprar estos productos:\n\n${itemsList}\n\nTotal: $ ${total.toFixed(2)}`;
    }

    function getCheckoutClient() {
        try {
            const session = JSON.parse(localStorage.getItem('lg_session') || '{}');
            return {
                id: session.id || session.cliente_id || 'CLI_WEB',
                nombre: session.nombre || session.cliente_nombre || 'Cliente web',
                telefono: session.telefono || session.cliente_telefono || 'No registrado'
            };
        } catch (error) {
            return { id: 'CLI_WEB', nombre: 'Cliente web', telefono: 'No registrado' };
        }
    }

    async function saveOrderAndOpenWhatsApp(event) {
        event.preventDefault();
        const checkoutBtn = event.currentTarget;
        if (!cart.length) {
            showToast('Tu carrito esta vacio');
            return;
        }
        if (checkoutBtn.dataset.saving === 'true') return;

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const message = buildCartMessage(total);
        const client = getCheckoutClient();
        const items = cart.map(item => ({
            producto_id: item.producto_id || item.name,
            nombre: item.name,
            cantidad: item.quantity,
            precio_unitario: item.price,
            subtotal: item.price * item.quantity,
            imagen_url: item.img || ''
        }));

        checkoutBtn.dataset.saving = 'true';
        checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando pedido...';

        const result = typeof window.lgDbApi === 'function'
            ? await window.lgDbApi('createPedido', {
                data: {
                    cliente_id: client.id,
                    cliente_nombre: client.nombre,
                    cliente_telefono: client.telefono,
                    items_json: JSON.stringify(items),
                    total,
                    whatsapp_mensaje: message
                }
            })
            : { success: false, error: 'Aun no disponible' };

        checkoutBtn.dataset.saving = 'false';
        checkoutBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Comprar por WhatsApp';

        if (!result.success) {
            showToast(result.error || 'No se pudo guardar el pedido');
            return;
        }

        showToast(`Pedido ${result.data?.id || ''} guardado como pendiente`);
        window.open(`https://wa.me/573213092850?text=${encodeURIComponent(message)}`, '_blank');
        cart = [];
        updateCart();
        closeCart();
    }

    document.querySelector('.cart-checkout')?.addEventListener('click', saveOrderAndOpenWhatsApp);

    window.removeCartItem = (index) => {
        removeFromCart(index);
    };
    window.lgAddToCart = addToCart;
    window.lgShowToast = showToast;

    // Event listeners para botones "Agregar al carrito"
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const name = btn.dataset.name;
            const price = btn.dataset.price;
            const img = btn.dataset.img;
            addToCart(name, price, img);
        });
    });

    // ==========================================
    // FILTROS DE PRODUCTOS
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar botón activo
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            productCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // ==========================================
    // VISTA RÁPIDA (MODAL)
    // ==========================================
    document.querySelectorAll('.quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.product-card');
            const img = '../img/flores.png';
            const category = card.querySelector('.product-category').textContent;
            const name = card.querySelector('.product-name').textContent;
            const price = card.querySelector('.price-current').textContent;
            
            document.getElementById('modalImg').src = img;
            document.getElementById('modalCategory').textContent = category;
            document.getElementById('modalTitle').textContent = name;
            document.getElementById('modalPrice').textContent = price;
            
            // Configurar botón de agregar en modal
            const modalAddBtn = document.getElementById('modalAddToCart');
            const priceValue = parseFloat(price.replace('$ ', ''));
            modalAddBtn.onclick = () => {
                addToCart(name, priceValue, '../img/flores.png');
                modal.classList.remove('active');
            };
            
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // ==========================================
    // TESTIMONIOS SLIDER
    // ==========================================
    const track = document.getElementById('testimonialsTrack');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    function getSlideWidth() {
        return window.innerWidth <= 768 ? 100 : 50;
    }
    
    function updateSlider() {
        if (!track || testimonialCards.length === 0) return;
        const slideWidth = getSlideWidth();
        track.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
    }
    
    nextBtn.addEventListener('click', () => {
        if (testimonialCards.length === 0) return;
        const maxSlides = window.innerWidth <= 768 ? testimonialCards.length - 1 : Math.ceil(testimonialCards.length / 2) - 1;
        currentSlide = currentSlide >= maxSlides ? 0 : currentSlide + 1;
        updateSlider();
    });
    
    prevBtn.addEventListener('click', () => {
        if (testimonialCards.length === 0) return;
        const maxSlides = window.innerWidth <= 768 ? testimonialCards.length - 1 : Math.ceil(testimonialCards.length / 2) - 1;
        currentSlide = currentSlide <= 0 ? maxSlides : currentSlide - 1;
        updateSlider();
    });

    // Auto-slide cada 5 segundos
    setInterval(() => {
        if (testimonialCards.length === 0) return;
        const maxSlides = window.innerWidth <= 768 ? testimonialCards.length - 1 : Math.ceil(testimonialCards.length / 2) - 1;
        currentSlide = currentSlide >= maxSlides ? 0 : currentSlide + 1;
        updateSlider();
    }, 5000);

    // ==========================================
    // TEMPORIZADOR DE PROMOCIONES
    // ==========================================
    function updateTimer() {
        const timerDays = document.getElementById('timerDays');
        const timerHours = document.getElementById('timerHours');
        const timerMinutes = document.getElementById('timerMinutes');
        const timerSeconds = document.getElementById('timerSeconds');
        if (!timerDays || !timerHours || !timerMinutes || !timerSeconds) return;

        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59);
        const diff = endOfDay - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerDays.textContent = String(days).padStart(2, '0');
        timerHours.textContent = String(hours).padStart(2, '0');
        timerMinutes.textContent = String(minutes).padStart(2, '0');
        timerSeconds.textContent = String(seconds).padStart(2, '0');
    }

    if (
        document.getElementById('timerDays') &&
        document.getElementById('timerHours') &&
        document.getElementById('timerMinutes') &&
        document.getElementById('timerSeconds')
    ) {
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    // ==========================================
    // ANIMACIÓN DE NÚMEROS (CONTADORES)
    // ==========================================
    function animateNumbers() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            // Observar cuando el elemento es visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(counter);
        });
    }
    
    animateNumbers();

    // ==========================================
    // ANIMACIONES AL SCROLL (REVEAL)
    // ==========================================
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));

    // ==========================================
    // PARTÍCULAS EN HERO
    // ==========================================
    function createParticles() {
        const container = document.getElementById('heroParticles');
        const particles = ['🌸', '✨', '🌺', '💜', '⭐', '🌷', '💫'];
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.textContent = particles[Math.floor(Math.random() * particles.length)];
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.animationDuration = `${10 + Math.random() * 10}s`;
            particle.style.fontSize = `${1 + Math.random()}rem`;
            container.appendChild(particle);
        }
    }
    
    createParticles();

    // ==========================================
    // FORMULARIO DE CONTACTO
    // ==========================================
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;
        
        // Crear mensaje para WhatsApp
        const whatsappMessage = `Hola, soy ${name}.%0AEmail: ${email}%0ATeléfono: ${phone || 'No especificado'}%0A%0AMensaje: ${message}`;
        const whatsappUrl = `https://wa.me/573213092850?text=${whatsappMessage}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
        
        // Mostrar toast y resetear formulario
        showToast('¡Mensaje enviado! Redirigiendo a WhatsApp...');
        contactForm.reset();
    });

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==========================================
    // BÚSQUEDA DE PRODUCTOS
    // ==========================================
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        productCards.forEach(card => {
            const name = card.querySelector('.product-name').textContent.toLowerCase();
            const category = card.querySelector('.product-category').textContent.toLowerCase();
            
            if (name.includes(query) || category.includes(query)) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });

    // ==========================================
    // EFECTO PARALLAX SUAVE EN IMÁGENES
    // ==========================================
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const parallaxElements = document.querySelectorAll('.about-img-main img');
        
        parallaxElements.forEach(el => {
            const speed = 0.1;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // ==========================================
    // GALERÍA - LIKE ANIMATION
    // ==========================================
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const heart = item.querySelector('.gallery-overlay i');
            heart.style.color = '#F472B6';
            heart.style.transform = 'scale(1.5)';
            setTimeout(() => {
                heart.style.transform = 'scale(1)';
            }, 300);
        });
    });

    // ==========================================
    // EFECTO DE BRILLO EN TARJETAS DE CATEGORÍA
    // ==========================================
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    console.log('✨ Luz Gomez - Tienda Artesanal cargada correctamente');
});

// ==========================================
// DATOS REALES DESDE GOOGLE SHEETS / DRIVE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://script.google.com/macros/s/AKfycbyI1pONadMWJhganMWt4kah4bB4jNHgraJG8S1A_uAGnRHiGdjL_U9tdDhpCEbKNqQ/exec';
    const productsGrid = document.getElementById('productsGrid');
    const filters = document.querySelector('.filters');
    const categoriesGrid = document.querySelector('.categories-grid');
    const galleryGrid = document.querySelector('.gallery-grid');
    const testimonialsTrack = document.getElementById('testimonialsTrack');
    const promoBanner = document.querySelector('.promo-banner');
    const searchInput = document.getElementById('searchInput');
    const state = { products: [], categories: [], filter: 'all', search: '', trends: null, profile: null, favorites: new Set(), recentViews: readRecentViews() };
    const storeClientId = getStoreClientId();

    if (!productsGrid) return;

    productsGrid.innerHTML = pendingState();
    if (categoriesGrid) categoriesGrid.innerHTML = '';
    if (galleryGrid) galleryGrid.innerHTML = '';
    if (testimonialsTrack) testimonialsTrack.innerHTML = '';

    initDatabaseStore();

    async function initDatabaseStore() {
        const [categories, products, promo, testimonials, gallery, trends, profile] = await Promise.all([
            apiCall('getCategorias'),
            apiCall('getProductos', { filters: { pagina: 1, por_pagina: 60 } }),
            apiCall('getPromocionActiva'),
            apiCall('getTestimonios'),
            apiCall('getGaleria'),
            apiCall('getTrendInsights', { clienteId: storeClientId }),
            apiCall('getCustomerProfile', { clienteId: storeClientId })
        ]);

        state.categories = categories.success ? (categories.data || []) : [];
        state.products = products.success ? ((products.data && (products.data.productos || products.data.items)) || []) : [];
        state.trends = trends.success ? trends.data : null;
        state.profile = profile.success ? profile.data : null;
        state.favorites = new Set((state.profile?.favoritos || []).map(product => String(product.id)));

        renderCategories(state.categories);
        renderFilters(state.categories);
        renderProducts();
        renderPromo(promo.success ? promo.data : null);
        renderTestimonials(testimonials.success ? testimonials.data || [] : []);
        renderGallery(gallery.success ? gallery.data || [] : []);
        renderSocialHub();
        renderTrendShelves();
        hydrateHeroFromDatabase();
        document.dispatchEvent(new CustomEvent('lg:content-rendered'));
    }

    async function apiCall(action, params = {}) {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, params })
            });
            if (!response.ok) throw new Error('Aun no disponible');
            return await response.json();
        } catch (error) {
            window.lgShowToast?.(error.message || 'Aun no disponible');
            return { success: false, data: null, error: error.message };
        }
    }
    window.lgDbApi = apiCall;

    function renderCategories(categories) {
        if (!categoriesGrid) return;
        categoriesGrid.innerHTML = categories.length ? categories.map(category => `
            <div class="category-card reveal active" data-category="${esc(category.slug || category.id || '')}">
                <div class="category-img">
                    ${realImage(category.imagen_url, category.nombre)}
                    <div class="category-overlay"></div>
                </div>
                <div class="category-info">
                    <div class="category-icon">${esc(category.icono || '✨')}</div>
                    <h3>${esc(category.nombre)}</h3>
                    <p>${esc(category.descripcion || 'Coleccion disponible')}</p>
                    <span class="category-count">${Number(category.productos_count || 0)} productos</span>
                </div>
            </div>
        `).join('') : emptyState();

        categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                state.filter = card.dataset.category || 'all';
                syncFilterButtons();
                renderProducts();
                document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function renderFilters(categories) {
        if (!filters) return;
        filters.innerHTML = `
            <button class="filter-btn active" data-filter="all">Todos</button>
            ${categories.map(category => `<button class="filter-btn" data-filter="${esc(category.slug || category.id || '')}">${esc(category.nombre)}</button>`).join('')}
        `;
        filters.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                state.filter = button.dataset.filter || 'all';
                syncFilterButtons();
                renderProducts();
            });
        });
    }

    function syncFilterButtons() {
        filters?.querySelectorAll('.filter-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === state.filter);
        });
    }

    function renderProducts() {
        const query = state.search.trim().toLowerCase();
        const visible = state.products.filter(product => {
            const matchesCategory = state.filter === 'all' || product.categoria_slug === state.filter || product.categoria_id === state.filter;
            const matchesSearch = !query || String(product.nombre || '').toLowerCase().includes(query) || String(product.categoria_nombre || '').toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });

        productsGrid.innerHTML = visible.length ? visible.map(productCard).join('') : emptyState();
        productsGrid.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                window.lgAddToCart?.(button.dataset.name, button.dataset.price, button.dataset.img);
            });
        });
        productsGrid.querySelectorAll('[data-favorite-product]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                toggleProductFavorite(button.dataset.favoriteProduct, button);
            });
        });
        document.dispatchEvent(new CustomEvent('lg:content-rendered'));
    }

    function productCard(product) {
        const image = productImage(product);
        const price = Number(product.precio || 0);
        const oldPrice = Number(product.precio_antiguo || 0);
        const video = productVideo(product);
        const trend = trendForProduct(product.id);
        const labels = trendLabels(product, trend);
        const favorite = state.favorites.has(String(product.id || ''));
        return `
            <div class="product-card reveal active" data-category="${esc(product.categoria_slug || product.categoria_id || '')}" data-product-id="${esc(product.id || '')}" data-product-image="${esc(image)}" data-video-source="${esc(video)}" data-comment-count="${Number(product.resenas_count || 0)}" data-has-video="${video ? 'true' : 'false'}">
                <div class="trend-badge-stack">
                    ${labels.map(label => `<span class="trend-badge">${esc(label)}</span>`).join('')}
                </div>
                <div class="product-img">
                    ${video ? mediaElement({ tipo: 'video', video_direct_url: video, imagen_url: image, titulo: product.nombre }, true) : realImage(image, product.nombre)}
                    <div class="product-actions">
                        <button class="product-action-btn add-to-cart" data-name="${esc(product.nombre)}" data-price="${price}" data-img="${esc(image)}" aria-label="Agregar al carrito">
                            <i class="fas fa-shopping-bag"></i>
                        </button>
                        <a href="https://wa.me/573213092850?text=${encodeURIComponent(`Hola, quiero el producto ${product.nombre || ''}`)}" class="product-action-btn" target="_blank" aria-label="Comprar por WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                        <button class="product-action-btn quick-view" aria-label="Ver producto">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="product-action-btn wishlist-static ${favorite ? 'saved' : ''}" type="button" data-favorite-product="${esc(product.id || '')}" aria-label="Guardar favorito" aria-pressed="${favorite ? 'true' : 'false'}">
                            <i class="${favorite ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-meta-row">
                        <span class="product-category">${esc(product.categoria_nombre || 'Producto')}</span>
                        ${video ? '<span class="media-chip"><i class="fas fa-play"></i> Video</span>' : ''}
                    </div>
                    <h3 class="product-name">${esc(product.nombre || 'Producto sin nombre')}</h3>
                    <div class="product-price">
                        <span class="price-current">$ ${money(price)}</span>
                        ${oldPrice > 0 ? `<span class="price-old">$ ${money(oldPrice)}</span>` : ''}
                    </div>
                    <div class="product-rating">${stars(product.rating || 5)} <span>(${Number(product.resenas_count || 0)})</span></div>
                    <div class="trend-signal-row">
                        <span><i class="fas fa-heart"></i> ${Number(trend?.reactions || 0)}</span>
                        <span><i class="fas fa-bookmark"></i> ${Number(trend?.favorites || 0)}</span>
                        <span><i class="fas fa-eye"></i> ${Number(trend?.views || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPromo(promo) {
        if (!promoBanner) return;
        if (!promo) {
            promoBanner.innerHTML = emptyState();
            return;
        }
        promoBanner.innerHTML = `
            <div class="promo-content">
                <span class="promo-tag">Oferta activa</span>
                <h2 class="promo-title">${esc(promo.titulo || 'Promocion especial')}</h2>
                <p class="promo-desc">${esc(promo.descripcion || '')}</p>
                <a href="https://wa.me/573213092850?text=${encodeURIComponent('Hola, quiero aprovechar la promocion')}" class="btn btn-primary btn-large" target="_blank">
                    <i class="fab fa-whatsapp"></i> Aprovechar Oferta
                </a>
            </div>
            <div class="promo-image">
                ${realImage(promo.imagen_url, promo.titulo)}
                <div class="promo-float">-${Number(promo.descuento_porcentaje || 0)}%</div>
            </div>
        `;
    }

    function renderTestimonials(testimonials) {
        if (!testimonialsTrack) return;
        testimonialsTrack.innerHTML = testimonials.length ? testimonials.map(item => `
            <div class="testimonial-card social-surface-card" data-social-target="testimonio" data-social-id="${esc(item.id || item.cliente_nombre || '')}">
                <div class="testimonial-stars">${stars(item.calificacion || 5)}</div>
                <p>${esc(item.texto || '')}</p>
                <div class="testimonial-author">
                    ${realImage(item.imagen_url, item.cliente_nombre)}
                    <div>
                        <h4>${esc(item.cliente_nombre || 'Cliente')}</h4>
                        <span>${esc(item.cliente_ciudad || 'Colombia')}</span>
                    </div>
                </div>
            </div>
        `).join('') : emptyState();
        document.querySelector('.testimonials-nav')?.removeAttribute('style');
        document.dispatchEvent(new CustomEvent('lg:content-rendered'));
    }

    function renderGallery(items) {
        if (!galleryGrid) return;
        galleryGrid.innerHTML = items.length ? items.map((item, index) => `
            <div class="gallery-item social-surface-card ${index === 0 ? 'large' : index === 5 ? 'wide' : ''}" data-social-target="galeria" data-social-id="${esc(item.id || item.titulo || index)}">
                ${mediaElement(item)}
                <div class="gallery-overlay">
                    <i class="${item.tipo === 'video' ? 'fas fa-play' : 'fas fa-heart'}"></i>
                    <span>${esc(item.titulo || 'Galeria')}</span>
                    <small>${esc(item.categoria_galeria || 'Inspiracion del dia')}</small>
                </div>
            </div>
        `).join('') : '';
        document.dispatchEvent(new CustomEvent('lg:content-rendered'));
    }

    function renderSocialHub() {
        if (document.querySelector('.social-hub')) return;
        const productsSection = document.querySelector('.products .container');
        if (!productsSection) return;
        productsSection.insertAdjacentHTML('beforeend', `
            <div class="social-hub reveal active" data-social-target="publicacion" data-social-id="feed-tendencias">
                <div>
                    <span class="section-tag">Tendencias sociales</span>
                    <h3>Lo que mas esta enamorando hoy</h3>
                    <p>Reacciona a la tienda, descubre favoritos y siente el catalogo como una comunidad viva.</p>
                </div>
                <div class="social-hub-metrics">
                    <span><b data-hub-products>${state.products.length}</b> productos</span>
                    <span><b>Top</b> destacados</span>
                    <span><b>Live</b> reacciones</span>
                </div>
            </div>
        `);
    }

    function renderTrendShelves() {
        const productsSection = document.querySelector('.products .container');
        if (!productsSection || document.querySelector('.trend-shelves')) return;
        const top = state.trends?.top || [];
        const loved = state.trends?.mas_amados || top;
        productsSection.insertAdjacentHTML('afterbegin', `
            <div class="trend-shelves reveal active" id="tendencias">
                <div class="section-header compact">
                    <span class="section-tag">Tendencias vivas</span>
                    <h2 class="section-title">Lo que mas se esta moviendo</h2>
                    <p class="section-desc">Ranking creado con reacciones, comentarios, favoritos, pedidos y vistas recientes.</p>
                </div>
                <div class="trend-strip">
                    ${top.slice(0, 4).map(item => trendCard(item)).join('') || '<div class="trend-empty">Cuando haya actividad, aqui apareceran los favoritos de la comunidad.</div>'}
                </div>
                <div class="mini-trend-grid">
                    ${(state.trends?.insights || []).map(text => `<span><i class="fas fa-wand-magic-sparkles"></i>${esc(text)}</span>`).join('')}
                    ${loved.slice(0, 2).map(item => `<span><i class="fas fa-heart"></i>${esc(item.nombre)} tiene energia social</span>`).join('')}
                </div>
            </div>
        `);
    }

    function trendCard(item) {
        const product = item.producto || {};
        return `
            <article class="trend-card" data-trend-product="${esc(product.id || item.producto_id || '')}">
                ${realImage(product.imagen_url, item.nombre)}
                <div>
                    <strong>${esc(item.nombre || product.nombre || 'Producto')}</strong>
                    <span>${esc((item.labels || ['Trending'])[0])}</span>
                </div>
                <b>${Number(item.score || 0)}</b>
            </article>
        `;
    }

    function renderProfileHub() {
        const contactSection = document.querySelector('#contacto') || document.querySelector('.contact') || document.querySelector('.footer');
        if (!contactSection || document.querySelector('.profile-hub')) return;
        const profile = state.profile || {};
        const cliente = profile.cliente || {};
        const favs = profile.favoritos || [];
        contactSection.insertAdjacentHTML('beforebegin', `
            <section class="profile-hub" id="perfil">
                <div class="container profile-shell">
                    <div class="profile-card">
                        <div class="profile-avatar">${esc(String(cliente.nombre || 'Cliente').trim().slice(0, 1).toUpperCase() || 'L')}</div>
                        <div>
                            <span class="section-tag">Mi perfil</span>
                            <h2>${esc(cliente.nombre || 'Cliente Luz Gomez')}</h2>
                            <p>${esc(profile.nivel || 'Nueva amiga de Luz')} · ${Number(profile.puntos || 0)} puntos</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <span><b>${favs.length}</b> favoritos</span>
                        <span><b>${(profile.pedidos || []).length}</b> pedidos</span>
                        <span><b>${(profile.comentarios || []).length}</b> comentarios</span>
                        <span><b>${(profile.reacciones || []).length}</b> reacciones</span>
                    </div>
                    <div class="saved-products">
                        <div class="saved-head">
                            <h3>Tus favoritos</h3>
                            <span>Guardado para despues</span>
                        </div>
                        <div class="saved-strip" id="savedStrip">
                            ${favs.length ? favs.slice(0, 8).map(product => `
                                <button type="button" data-saved-jump="${esc(product.id)}">
                                    ${realImage(product.imagen_url, product.nombre)}
                                    <span>${esc(product.nombre)}</span>
                                </button>
                            `).join('') : '<p>Guarda productos con el corazon para verlos aqui.</p>'}
                        </div>
                    </div>
                </div>
            </section>
        `);
        document.querySelectorAll('[data-saved-jump]').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelector(`[data-product-id="${CSS.escape(button.dataset.savedJump)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        });
    }

    function hydrateHeroFromDatabase() {
        const first = state.products.find(product => productImage(product));
        if (!first) return;
        const heroImg = document.querySelector('.hero-img-wrapper img');
        if (heroImg) {
            heroImg.src = productImage(first);
            heroImg.alt = first.nombre || 'Producto Luz Gomez';
        }
    }

    function productImage(product) {
        return product.imagen_url || product.thumbnail_url || '';
    }

    function productVideo(product) {
        return product.video_direct_url || product.video_url || product.video_drive_id || '';
    }

    function mediaElement(item, autoplay = false) {
        const video = item.video_direct_url || item.video_url || item.video_drive_id || '';
        const isVideo = String(item.tipo || '').toLowerCase() === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(video) || Boolean(video && !item.imagen_url);
        if (isVideo && video) {
            return `
                <div class="premium-video">
                    <video src="${esc(resolveDriveMedia(video))}" poster="${esc(item.imagen_url || '')}" ${autoplay ? 'autoplay muted loop' : ''} muted playsinline controls preload="metadata"></video>
                    <span class="video-pill"><i class="fas fa-play"></i> Video</span>
                </div>
            `;
        }
        return realImage(item.imagen_url, item.titulo);
    }

    function resolveDriveMedia(value) {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const match = raw.match(/[-\w]{25,}/);
        if (raw.includes('drive.google.com') && match) return `https://drive.google.com/uc?export=download&id=${match[0]}`;
        if (!raw.startsWith('http') && match) return `https://drive.google.com/uc?export=download&id=${match[0]}`;
        return raw;
    }

    function realImage(src, alt) {
        return src
            ? `<img src="${esc(src)}" alt="${esc(alt || 'Imagen')}" loading="lazy">`
            : `<div class="db-image-missing"><i class="fas fa-clock"></i><span>Aun no disponible</span></div>`;
    }

    function pendingState() {
        return emptyState();
    }

    function emptyState() {
        return '<div class="db-empty-state"><i class="fas fa-clock"></i><p>Aun no disponible</p></div>';
    }

    function stars(value) {
        const rating = Math.max(0, Math.min(5, Math.round(Number(value || 5))));
        return Array.from({ length: 5 }, (_, index) => `<i class="${index < rating ? 'fas' : 'far'} fa-star"></i>`).join('');
    }

    function money(value) {
        return Number(value || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function getStoreClientId() {
        try {
            const session = JSON.parse(localStorage.getItem('lg_session') || '{}');
            if (session.id || session.cliente_id) return session.id || session.cliente_id;
        } catch (error) {}
        let id = localStorage.getItem('lg_social_client_id');
        if (!id) {
            id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem('lg_social_client_id', id);
        }
        return id;
    }

    function readRecentViews() {
        try {
            return JSON.parse(localStorage.getItem('lg_recent_views') || '[]');
        } catch (error) {
            return [];
        }
    }

    function saveRecentView(productId) {
        if (!productId) return;
        state.recentViews = [productId, ...state.recentViews.filter(id => id !== productId)].slice(0, 12);
        localStorage.setItem('lg_recent_views', JSON.stringify(state.recentViews));
        apiCall('recordProductView', { data: { producto_id: productId, cliente_id: storeClientId } });
    }
    window.lgSaveRecentView = saveRecentView;

    function trendForProduct(productId) {
        return (state.trends?.top || []).concat(state.trends?.mas_amados || [], state.trends?.favoritos || [])
            .find(item => String(item.producto_id || item.producto?.id) === String(productId));
    }

    function trendLabels(product, trend) {
        const labels = trend?.labels?.length ? trend.labels.slice(0, 2) : [];
        if (product.badge && labels.indexOf(product.badge) === -1) labels.unshift(product.badge);
        if (state.recentViews.includes(String(product.id)) && labels.indexOf('Visto recientemente') === -1) labels.push('Visto recientemente');
        return labels.slice(0, 3);
    }

    async function toggleProductFavorite(productId, button) {
        if (!productId) return;
        const active = !state.favorites.has(String(productId));
        if (active) state.favorites.add(String(productId));
        else state.favorites.delete(String(productId));
        updateFavoriteButtons(productId, active);
        button?.classList.add('bump');
        setTimeout(() => button?.classList.remove('bump'), 360);
        const result = await apiCall('toggleFavorite', { data: { producto_id: productId, cliente_id: storeClientId } });
        if (!result.success) {
            if (active) state.favorites.delete(String(productId));
            else state.favorites.add(String(productId));
            updateFavoriteButtons(productId, !active);
        }
        const profile = await apiCall('getCustomerProfile', { clienteId: storeClientId });
        if (profile.success) {
            state.profile = profile.data;
            state.favorites = new Set((state.profile?.favoritos || []).map(product => String(product.id)));
        }
    }

    function updateFavoriteButtons(productId, active) {
        document.querySelectorAll(`[data-favorite-product="${CSS.escape(String(productId))}"]`).forEach(button => {
            button.classList.toggle('saved', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            const icon = button.querySelector('i');
            if (icon) icon.className = active ? 'fas fa-heart' : 'far fa-heart';
        });
    }

    searchInput?.addEventListener('input', event => {
        state.search = event.target.value;
        renderProducts();
    });
});

// ==========================================
// MEJORAS VISUALES PREMIUM - SOLO FRONTEND
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const cartBtnStatic = document.getElementById('cartBtn');
    const contactFormStatic = document.getElementById('contactForm');
    const searchInputStatic = document.getElementById('searchInput');
    const visualState = {
        reactions: JSON.parse(localStorage.getItem('lg_static_reactions') || '{}'),
        lightboxIndex: 0
    };

    function easeOutExpo(x) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    function saveStaticReactions() {
        localStorage.setItem('lg_static_reactions', JSON.stringify(visualState.reactions));
    }

    // Fly-to-cart: clona la imagen y la lleva al icono del carrito.
    function flyToCartFromButton(button) {
        const card = button.closest('.product-card') || button.closest('.modal-content');
        const img = card?.querySelector('img') || document.querySelector('.product-card img');
        if (!img || !cartBtnStatic) return;
        const start = img.getBoundingClientRect();
        const end = cartBtnStatic.getBoundingClientRect();
        const clone = img.cloneNode();
        clone.className = 'fly-clone';
        clone.style.left = `${start.left}px`;
        clone.style.top = `${start.top}px`;
        document.body.appendChild(clone);
        const startTime = performance.now();
        const duration = 720;
        function frame(now) {
            const progress = Math.min(1, (now - startTime) / duration);
            const eased = easeOutExpo(progress);
            const x = start.left + (end.left - start.left) * eased;
            const y = start.top + (end.top - start.top) * eased - Math.sin(progress * Math.PI) * 120;
            clone.style.transform = `translate(${x - start.left}px, ${y - start.top}px) scale(${1 - progress * 0.55}) rotate(${progress * 18}deg)`;
            clone.style.opacity = String(1 - progress * 0.35);
            if (progress < 1) requestAnimationFrame(frame);
            else clone.remove();
        }
        requestAnimationFrame(frame);
    }

    document.querySelectorAll('.add-to-cart, #modalAddToCart').forEach(btn => {
        btn.addEventListener('click', () => flyToCartFromButton(btn), true);
    });

    // Tilt 3D: las cards siguen suavemente al cursor.
    document.querySelectorAll('.category-card, .product-card').forEach(card => {
        card.classList.add('tilt-card');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-8px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Magnetic buttons: botones principales responden a la cercania del cursor.
    if (!window.matchMedia('(hover: none)').matches) {
        document.querySelectorAll('.btn-primary').forEach(btn => btn.classList.add('magnetic-btn'));
        document.addEventListener('mousemove', (e) => {
            document.querySelectorAll('.magnetic-btn').forEach(btn => {
                const rect = btn.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                const distance = Math.hypot(dx, dy);
                btn.style.transform = distance < 80 ? `translate(${dx * 0.06}px, ${dy * 0.06}px)` : '';
            });
        });
    }

    // Cursor personalizado con punto y aro suavizado.
    if (!window.matchMedia('(hover: none)').matches) {
        const dot = document.createElement('div');
        const circle = document.createElement('div');
        dot.className = 'cursor-dot';
        circle.className = 'cursor-circle';
        document.body.append(dot, circle);
        let x = 0, y = 0, cx = 0, cy = 0;
        document.addEventListener('mousemove', (e) => {
            x = e.clientX;
            y = e.clientY;
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
        });
        function loop() {
            cx += (x - cx) * 0.18;
            cy += (y - cy) * 0.18;
            circle.style.left = `${cx}px`;
            circle.style.top = `${cy}px`;
            requestAnimationFrame(loop);
        }
        loop();
    }

    // Typewriter visual para subtitulo del hero.
    const heroDesc = document.querySelector('.hero-desc');
    if (heroDesc) {
        const text = heroDesc.textContent.trim();
        heroDesc.textContent = '';
        heroDesc.classList.add('typewriter-css');
        let index = 0;
        function tick() {
            heroDesc.textContent = text.slice(0, index);
            index += 1;
            if (index <= text.length) setTimeout(tick, 18);
            else setTimeout(() => heroDesc.classList.remove('typewriter-css'), 900);
        }
        setTimeout(tick, 600);
    }

    // Intersection observer con stagger para hijos.
    const premiumObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active', 'stagger');
            premiumObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.products-grid, .categories-grid, .gallery-grid, .contact-grid').forEach(el => premiumObserver.observe(el));

    // Lightbox premium con teclado.
    function openLightbox(index) {
        const items = Array.from(document.querySelectorAll('.gallery-item img'));
        if (!items.length) return;
        visualState.lightboxIndex = (index + items.length) % items.length;
        const img = items[visualState.lightboxIndex];
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-premium';
        overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Cerrar"><i class="fas fa-times"></i></button>
            <button class="lightbox-prev" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>
            <div class="lightbox-loading" data-lightbox-loading>
                <div class="lightbox-spinner" aria-hidden="true"></div>
                <span>Cargando imagen...</span>
            </div>
            <img src="${img.src}" alt="${img.alt || 'Galeria Luz Gomez'}" style="opacity:0">
            <button class="lightbox-next" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>
        `;
        document.body.appendChild(overlay);
        const preview = overlay.querySelector('img');
        const loading = overlay.querySelector('[data-lightbox-loading]');
        const showImage = () => {
            if (loading) loading.remove();
            if (preview) preview.style.opacity = '1';
        };
        if (preview?.complete) showImage();
        else {
            preview?.addEventListener('load', showImage, { once: true });
            preview?.addEventListener('error', showImage, { once: true });
        }
        overlay.querySelector('.lightbox-close').addEventListener('click', () => overlay.remove());
        overlay.querySelector('.lightbox-prev').addEventListener('click', () => { overlay.remove(); openLightbox(visualState.lightboxIndex - 1); });
        overlay.querySelector('.lightbox-next').addEventListener('click', () => { overlay.remove(); openLightbox(visualState.lightboxIndex + 1); });
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    }
    function bindGalleryLightbox() {
        document.querySelectorAll('.gallery-item img').forEach((img, index) => {
            const item = img.closest('.gallery-item');
            if (!item || item.dataset.lightboxReady) return;
            item.dataset.lightboxReady = 'true';
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.addEventListener('click', event => {
                if (event.target.closest('button, a, input, textarea, select, .reaction-row, .product-social')) return;
                openLightbox(index);
            });
            item.addEventListener('keydown', event => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openLightbox(index);
            });
        });
    }
    window.bindGalleryLightbox = bindGalleryLightbox;
    bindGalleryLightbox();
    document.addEventListener('keydown', e => {
        const box = document.querySelector('.lightbox-premium');
        if (!box) return;
        if (e.key === 'Escape') box.remove();
        if (e.key === 'ArrowLeft') { box.remove(); openLightbox(visualState.lightboxIndex - 1); }
        if (e.key === 'ArrowRight') { box.remove(); openLightbox(visualState.lightboxIndex + 1); }
    });

    // Reacciones visuales para comentarios o testimonios.
    document.querySelectorAll('.comment, .testimonial-card').forEach((block, index) => {
        if (block.dataset.reactionsReady) return;
        block.dataset.reactionsReady = 'true';
        const key = block.textContent.trim().slice(0, 64) || `static-${index}`;
        const current = visualState.reactions[key] || {};
        const selected = current.__selected || '';
        block.insertAdjacentHTML('beforeend', `
            <div class="reaction-row">
                ${['❤️','😍','🙌','💯','😮'].map(emoji => `<button class="reaction-btn ${selected === emoji ? 'active' : ''}" type="button" data-reaction="${emoji}" data-key="${key}" aria-pressed="${selected === emoji ? 'true' : 'false'}"><span>${emoji}</span><b>${current[emoji] || 0}</b></button>`).join('')}
            </div>
        `);
    });
    document.addEventListener('click', e => {
        const reaction = e.target.closest('.reaction-btn');
        if (!reaction) return;
        const key = reaction.dataset.key;
        const emoji = reaction.dataset.reaction;
        visualState.reactions[key] = visualState.reactions[key] || {};
        const group = visualState.reactions[key];
        const previous = group.__selected || '';
        if (previous === emoji) {
            group[emoji] = Math.max(0, Number(group[emoji] || 0) - 1);
            group.__selected = '';
        } else {
            if (previous) group[previous] = Math.max(0, Number(group[previous] || 0) - 1);
            group[emoji] = Number(group[emoji] || 0) + 1;
            group.__selected = emoji;
        }
        saveStaticReactions();
        reaction.closest('.reaction-row')?.querySelectorAll('.reaction-btn').forEach(button => {
            const active = button.dataset.reaction === group.__selected;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.querySelector('b').textContent = group[button.dataset.reaction] || 0;
        });
        reaction.classList.add('bump');
        setTimeout(() => reaction.classList.remove('bump'), 350);
    });

    // Feedback visual de busqueda con debounce.
    function debounce(fn, wait) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
    }
    searchInputStatic?.addEventListener('input', debounce(() => {
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.add('notification-slide-in');
            setTimeout(() => card.classList.remove('notification-slide-in'), 360);
        });
    }, 180));

    // Blur-up para imagenes.
    document.querySelectorAll('img[loading="lazy"], .product-card img, .gallery-item img').forEach(img => {
        if (img.complete) img.classList.add('blur-up-loaded');
        else img.addEventListener('load', () => img.classList.add('blur-up-loaded'), { once: true });
    });

    // Flip-clock para numeros del timer cuando cambian.
    ['timerDays', 'timerHours', 'timerMinutes', 'timerSeconds'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        let oldValue = el.textContent;
        setInterval(() => {
            if (el.textContent === oldValue) return;
            oldValue = el.textContent;
            el.classList.remove('flip');
            void el.offsetWidth;
            el.classList.add('flip');
        }, 1000);
    });

    // Confetti de celebracion para envio del formulario.
    function confettiBurst() {
        const colors = ['#8B5CF6', '#D946EF', '#F472B6', '#FCD34D', '#10B981'];
        for (let i = 0; i < 32; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = colors[i % colors.length];
            piece.style.animationDelay = `${Math.random() * 0.25}s`;
            piece.style.transform = `rotate(${Math.random() * 180}deg)`;
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 2100);
        }
    }
    contactFormStatic?.addEventListener('submit', confettiBurst);

    // Ripple global para botones.
    document.addEventListener('click', e => {
        const button = e.target.closest('.btn, .icon-btn, .product-action, .cart-close');
        if (!button) return;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
    });
});

// ==========================================
// TIENDA SOCIAL INTERACTIVA - PRODUCTOS Y COMENTARIOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('quickViewModal');
    const modalClose = document.getElementById('modalClose');
    const productsGrid = document.getElementById('productsGrid');
    const reactionEmojis = ['❤️', '👍', '😂', '😮', '🔥', '😍', '😢', '😡', '👏', '🤯'];
    const commentEmojis = ['❤️', '👍', '😂', '😮', '🔥', '😍', '😢', '😡', '👏', '🤯'];
    let activeProduct = null;
    let activeImageIndex = 0;

    const socialState = readState();
    const socialClientId = getSocialClientId();

    function getSocialClientId() {
        try {
            const session = JSON.parse(localStorage.getItem('lg_session') || '{}');
            if (session.id || session.cliente_id) return session.id || session.cliente_id;
        } catch (error) {}
        let id = localStorage.getItem('lg_social_client_id');
        if (!id) {
            id = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            localStorage.setItem('lg_social_client_id', id);
        }
        return id;
    }

    function readState() {
        try {
            return JSON.parse(localStorage.getItem('lg_social_store') || '{}');
        } catch (error) {
            return {};
        }
    }

    function saveState() {
        localStorage.setItem('lg_social_store', JSON.stringify(socialState));
    }

    function emptyReactionCounts(list = reactionEmojis) {
        return list.reduce((counts, emoji) => {
            counts[emoji] = 0;
            return counts;
        }, {});
    }

    function text(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function resolveSocialDriveMedia(value) {
        const raw = String(value || '').trim();
        const match = raw.match(/[-\w]{25,}/);
        if (!raw) return '';
        if (raw.includes('drive.google.com') && match) return `https://drive.google.com/uc?export=download&id=${match[0]}`;
        if (!raw.startsWith('http') && match) return `https://drive.google.com/uc?export=download&id=${match[0]}`;
        return raw;
    }

    function productKeyFromName(name) {
        return String(name || 'producto')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'producto';
    }

    function getProductState(key) {
        if (!socialState[key]) {
            socialState[key] = {
                userReaction: '',
                reactions: emptyReactionCounts(),
                comments: []
            };
            saveState();
        }
        const cleanedCounts = { ...emptyReactionCounts(), ...(socialState[key].reactions || {}) };
        socialState[key].reactions = cleanedCounts;
        if (socialState[key].userReaction && cleanedCounts[socialState[key].userReaction] === undefined) {
            socialState[key].userReaction = '';
        }
        socialState[key].comments = (socialState[key].comments || []).filter(comment => !String(comment.id || '').includes('-seed-'));
        return socialState[key];
    }

    function getCardData(card) {
        const name = card.querySelector('.product-name')?.textContent.trim() || 'Producto Luz Gomez';
        const productId = card.dataset.productId || '';
        const key = productId || productKeyFromName(name);
        const image = card.dataset.productImage || card.querySelector('.product-img img')?.getAttribute('src') || '';
        const video = card.dataset.videoSource || '';
        const category = card.querySelector('.product-category')?.textContent.trim() || 'Coleccion';
        const price = card.querySelector('.price-current')?.textContent.trim() || '$ 0.00';
        const oldPrice = card.querySelector('.price-old')?.textContent.trim() || '';
        const badge = card.querySelector('.product-badge')?.textContent.trim() || '';
        const rating = card.querySelector('.product-rating')?.innerHTML || '';
        return {
            key,
            productId,
            name,
            image,
            images: [image].filter(Boolean),
            video,
            category,
            price,
            oldPrice,
            badge,
            rating,
            card
        };
    }

    function reactionTotal(productState) {
        return Object.values(productState.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    }

    function commentTotal(productState) {
        return Math.max(productState.comments?.length || 0, Number(productState.databaseCommentCount || 0));
    }

    function topReactions(productState) {
        return Object.entries(productState.reactions || {})
            .filter(([, count]) => Number(count) > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([emoji]) => emoji);
    }

    function renderReactionStack(productState) {
        const top = topReactions(productState);
        return top.length ? top.map(emoji => `<span>${emoji}</span>`).join('') : '<span>❤️</span>';
    }

    function applyReactionSummary(productState, summary) {
        if (!summary) return;
        productState.reactions = { ...emptyReactionCounts(), ...(summary.counts || {}) };
        productState.userReaction = summary.userReaction || productState.userReaction || '';
    }

    async function syncProductReactionSummary(key) {
        if (!key || typeof window.lgDbApi !== 'function') return;
        const result = await window.lgDbApi('getReactionsForTargets', {
            targets: [{ target_type: 'producto', target_id: key }],
            clienteId: socialClientId
        });
        const summary = result.success ? result.data?.[`producto:${key}`] : null;
        if (!summary) return;
        applyReactionSummary(getProductState(key), summary);
        saveState();
        refreshCardSocial(key);
        if (activeProduct?.key === key) renderModalSocialSummary(activeProduct);
    }

    async function syncVisibleProductReactions() {
        if (typeof window.lgDbApi !== 'function') return;
        const keys = Array.from(document.querySelectorAll('.product-card[data-product-key]'))
            .map(card => card.dataset.productKey)
            .filter(Boolean);
        const unique = [...new Set(keys)];
        if (!unique.length) return;
        const result = await window.lgDbApi('getReactionsForTargets', {
            targets: unique.map(key => ({ target_type: 'producto', target_id: key })),
            clienteId: socialClientId
        });
        if (!result.success || !result.data) return;
        unique.forEach(key => {
            applyReactionSummary(getProductState(key), result.data[`producto:${key}`]);
            refreshCardSocial(key);
        });
        saveState();
    }

    function enhanceProductCards() {
        document.querySelectorAll('.product-card').forEach(card => {
            if (card.dataset.socialReady) return;
            card.dataset.socialReady = 'true';
            const data = getCardData(card);
            const productState = getProductState(data.key);
            productState.databaseCommentCount = Number(card.dataset.commentCount || 0);
            card.dataset.productKey = data.key;
            card.addEventListener('mousemove', event => {
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
                card.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
            });

            const productInfo = card.querySelector('.product-info');
            if (!productInfo) return;
            productInfo.insertAdjacentHTML('beforeend', `
                <div class="product-social" data-social-for="${data.key}">
                    <div class="social-proof">
                        <span class="reaction-stack">${renderReactionStack(productState)}</span>
                        <span><b data-product-reaction-total>${reactionTotal(productState)}</b> reacciones</span>
                        <span><b data-product-comment-total>${commentTotal(productState)}</b> comentarios</span>
                    </div>
                    <div class="product-social-actions">
                        <button class="social-action product-heart-quick ${productState.userReaction === '❤️' ? 'active' : ''}" type="button" data-product-quick-heart aria-pressed="${productState.userReaction === '❤️' ? 'true' : 'false'}">
                            <i class="${productState.userReaction === '❤️' ? 'fas' : 'far'} fa-heart"></i> Me encanta
                        </button>
                        <span class="product-reaction-wrap" style="position:relative;">
                            <button class="social-action product-react-toggle ${productState.userReaction ? 'active' : ''}" type="button" aria-pressed="${productState.userReaction ? 'true' : 'false'}">
                                <span>${productState.userReaction || '❤️'}</span> Reaccionar
                            </button>
                            <span class="reaction-popover" role="menu">
                                ${reactionEmojis.map(emoji => `<button class="reaction-option" type="button" data-product-reaction="${emoji}" aria-label="Reaccionar ${emoji}">${emoji}</button>`).join('')}
                            </span>
                        </span>
                        <button class="social-action product-comment-open" type="button"><i class="fas fa-comment"></i> Comentar</button>
                    </div>
                </div>
            `);
            const socialBox = productInfo.querySelector('.product-social:last-child');
            socialBox?.querySelector('.product-react-toggle')?.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                socialBox.querySelector('.reaction-popover')?.classList.toggle('active');
            });
            socialBox?.querySelector('[data-product-quick-heart]')?.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                setProductReaction(data.key, '❤️', event.currentTarget);
            });
            socialBox?.querySelectorAll('[data-product-reaction]').forEach(button => {
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setProductReaction(data.key, button.dataset.productReaction, button);
                    button.closest('.reaction-popover')?.classList.remove('active');
                });
            });
            socialBox?.querySelector('.product-comment-open')?.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                openSocialModal(card, true);
            });
        });
    }

    function refreshCardSocial(key) {
        const productState = getProductState(key);
        document.querySelectorAll(`[data-social-for="${key}"]`).forEach(box => {
            box.querySelector('.reaction-stack').innerHTML = renderReactionStack(productState);
            box.querySelector('[data-product-reaction-total]').textContent = reactionTotal(productState);
            box.querySelector('[data-product-comment-total]').textContent = commentTotal(productState);
            const toggle = box.querySelector('.product-react-toggle');
            toggle.classList.toggle('active', Boolean(productState.userReaction));
            toggle.setAttribute('aria-pressed', productState.userReaction ? 'true' : 'false');
            toggle.querySelector('span').textContent = productState.userReaction || '❤️';
            const heart = box.querySelector('.product-heart-quick');
            if (heart) {
                const liked = productState.userReaction === '❤️';
                heart.classList.toggle('active', liked);
                heart.setAttribute('aria-pressed', liked ? 'true' : 'false');
                heart.querySelector('i').className = `${liked ? 'fas' : 'far'} fa-heart`;
            }
        });
    }

    async function setProductReaction(key, emoji, origin) {
        const productState = getProductState(key);
        if (productState.userReaction === emoji) {
            productState.reactions[emoji] = Math.max(0, Number(productState.reactions[emoji] || 0) - 1);
            productState.userReaction = '';
        } else {
            if (productState.userReaction) {
                const old = productState.userReaction;
                productState.reactions[old] = Math.max(0, Number(productState.reactions[old] || 0) - 1);
            }
            productState.reactions[emoji] = Number(productState.reactions[emoji] || 0) + 1;
            productState.userReaction = emoji;
            floatReaction(emoji, origin);
        }
        saveState();
        refreshCardSocial(key);
        if (activeProduct?.key === key) renderModalSocialSummary(activeProduct);
        if (typeof window.lgDbApi === 'function') {
            const result = await window.lgDbApi('reactToTarget', {
                data: {
                    target_type: 'producto',
                    target_id: key,
                    cliente_id: socialClientId,
                    emoji
                }
            });
            if (result.success && result.data) {
                applyReactionSummary(productState, result.data);
                saveState();
                refreshCardSocial(key);
                if (activeProduct?.key === key) renderModalSocialSummary(activeProduct);
            }
        }
    }

    function floatReaction(emoji, origin) {
        if (!origin) return;
        const rect = origin.getBoundingClientRect();
        for (let i = 0; i < 4; i++) {
            const item = document.createElement('span');
            item.className = 'floating-reaction';
            item.textContent = emoji;
            item.style.left = `${rect.left + rect.width / 2}px`;
            item.style.top = `${rect.top + rect.height / 2}px`;
            item.style.setProperty('--float-x', `${(Math.random() - .5) * 70}px`);
            item.style.animationDelay = `${i * 45}ms`;
            document.body.appendChild(item);
            setTimeout(() => item.remove(), 1050);
        }
    }

    async function openSocialModal(card, focusComments = false) {
        return withStoreBusy(card, 'Cargando producto...', () => renderSocialModal(card, focusComments));
    }

    async function renderSocialModal(card, focusComments = false) {
        activeProduct = getCardData(card);
        activeImageIndex = 0;
        window.lgSaveRecentView?.(activeProduct.productId || activeProduct.key);
        await hydrateProductFromDatabase(activeProduct);
        const productState = getProductState(activeProduct.key);
        modal.querySelector('.modal-content').classList.add('social-product-modal');
        modal.querySelector('.modal-body').innerHTML = `
            <div class="social-modal-gallery">
                <div class="social-modal-main" id="socialModalMain">
                    ${activeProduct.video ? `<video src="${text(resolveSocialDriveMedia(activeProduct.video))}" poster="${text(activeProduct.images[0] || '')}" controls playsinline preload="metadata" id="modalVideo"></video>` : (activeProduct.images[0] ? `<img src="${text(activeProduct.images[0])}" alt="${text(activeProduct.name)}" id="modalImg">` : '<div class="db-image-missing"><i class="fas fa-clock"></i><span>Aun no disponible</span></div>')}
                    <span class="zoom-hint"><i class="fas fa-search-plus"></i> Click para zoom</span>
                </div>
                <div class="social-thumbs">
                    ${activeProduct.video ? `<button class="social-thumb active" type="button" data-video-thumb="${text(activeProduct.video)}"><span class="video-thumb-icon"><i class="fas fa-play"></i></span></button>` : ''}
                    ${activeProduct.images.map((src, index) => `<button class="social-thumb ${index === 0 ? 'active' : ''}" type="button" data-thumb-index="${index}"><img src="${text(src)}" alt="${text(activeProduct.name)} ${index + 1}"></button>`).join('')}
                </div>
            </div>
            <div class="social-modal-info">
                <span class="modal-category">${text(activeProduct.category)}</span>
                <h3 class="modal-title" id="modalTitle">${text(activeProduct.name)}</h3>
                <div class="modal-price">${text(activeProduct.price)} ${activeProduct.oldPrice ? `<span class="price-old">${text(activeProduct.oldPrice)}</span>` : ''}</div>
                <p class="modal-desc">${text(activeProduct.description || 'Aun no disponible')}</p>
                <div class="modal-desc-grid">
                    <span><strong>Entrega</strong> Coordinada por WhatsApp</span>
                    <span><strong>Origen</strong> Hecho en Colombia</span>
                    <span><strong>Atencion</strong> Personalizada</span>
                </div>
                <div class="modal-social-summary" id="modalSocialSummary"></div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="modalSocialAdd"><i class="fas fa-shopping-bag"></i> Agregar al Carrito</button>
                    <a href="https://wa.me/573213092850?text=${encodeURIComponent(`Hola, quiero comprar ${activeProduct.name}`)}" class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i> Comprar por WhatsApp
                    </a>
                </div>
                <div class="comments-panel" id="commentsPanel">
                    <div class="comments-title">
                        <h4><i class="fas fa-comments"></i> Comentarios</h4>
                        <span>${commentTotal(productState)} conversaciones</span>
                    </div>
                    <div class="comment-list" id="modalComments"></div>
                    ${commentFormTemplate(activeProduct.key)}
                </div>
            </div>
        `;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        bindModalInteractions();
        renderModalSocialSummary(activeProduct);
        renderComments(activeProduct.key);
        if (focusComments) setTimeout(() => document.getElementById('commentsPanel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 80);
    }

    async function hydrateProductFromDatabase(product) {
        if (!product?.productId || typeof window.lgDbApi !== 'function') return;
        const result = await window.lgDbApi('getProductoById', { id: product.productId });
        if (!result.success || !result.data) return;
        const dbProduct = result.data;
        product.description = dbProduct.descripcion || product.description || '';
        const dbImages = [
            dbProduct.imagen_url,
            ...(dbProduct.imagenes_extra || []).map(image => image.url)
        ].filter((src, index, list) => src && list.indexOf(src) === index);
        if (dbImages.length) product.images = dbImages;
        product.video = dbProduct.video_direct_url || dbProduct.video_url || product.video || '';
        const productState = getProductState(product.key);
        applyReactionSummary(productState, dbProduct.reaction_summary);
        productState.comments = mapDatabaseComments(dbProduct.comentarios || []);
        await syncProductReactionSummary(product.key);
    }

    function mapDatabaseComments(comments) {
        const mapped = [];
        comments.forEach(comment => {
            const id = comment.id || `db-${mapped.length}`;
            mapped.push({
                id,
                author: comment.cliente_nombre || 'Cliente',
                body: comment.comentario || '',
                createdAt: new Date(comment.fecha || Date.now()).getTime(),
                parentId: comment.parent_id || '',
                userReaction: comment.reaction_summary?.userReaction || '',
                reactions: { ...emptyReactionCounts(commentEmojis), ...(comment.reaction_summary?.counts || {}) }
            });
            if (comment.respuesta_admin) {
                mapped.push({
                    id: `${id}-respuesta`,
                    author: 'Luz Gomez',
                    body: comment.respuesta_admin,
                    createdAt: new Date(comment.fecha_respuesta || comment.fecha || Date.now()).getTime(),
                    parentId: id,
                    userReaction: '',
                    reactions: emptyReactionCounts(commentEmojis)
                });
            }
        });
        return mapped;
    }

    function renderModalSocialSummary(product) {
        const summary = document.getElementById('modalSocialSummary');
        if (!summary || !product) return;
        const productState = getProductState(product.key);
        summary.innerHTML = `
            <div class="social-proof">
                <span class="reaction-stack">${renderReactionStack(productState)}</span>
                <span><b>${reactionTotal(productState)}</b> personas reaccionaron</span>
                <span><b>${commentTotal(productState)}</b> comentarios</span>
            </div>
            <div class="social-row">
                ${reactionEmojis.map(emoji => `<button class="social-action ${productState.userReaction === emoji ? 'active' : ''}" type="button" data-modal-reaction="${emoji}" aria-pressed="${productState.userReaction === emoji ? 'true' : 'false'}">${emoji} <span>${productState.reactions[emoji] || 0}</span></button>`).join('')}
            </div>
        `;
        summary.querySelectorAll('[data-modal-reaction]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                setProductReaction(product.key, button.dataset.modalReaction, button);
            });
        });
    }

    function commentReactionTotal(comment) {
        return Object.values(comment?.reactions || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    }

    function commentFormTemplate(key, parentId = '') {
        return `
            <form class="${parentId ? 'comment-form reply-form' : 'comment-form'}" data-comment-form="${key}" data-parent-id="${parentId}">
                <div class="emoji-strip compact-emoji-picker">
                    <button class="emoji-picker-toggle" type="button" data-emoji-picker-toggle aria-label="Abrir emojis">
                        <span>😊</span>
                    </button>
                    <div class="emoji-picker-popover" role="menu">
                        ${commentEmojis.map(emoji => `<button type="button" role="menuitem" data-insert-emoji="${emoji}">${emoji}</button>`).join('')}
                    </div>
                </div>
                <textarea name="comment" placeholder="${parentId ? 'Escribe una respuesta...' : 'Comparte tu opinion o pregunta por este producto...'}" required></textarea>
                <button class="btn btn-primary" type="submit"><i class="fas fa-paper-plane"></i> Enviar</button>
            </form>
        `;
    }

    function renderComments(key) {
        const list = document.getElementById('modalComments');
        if (!list) return;
        const productState = getProductState(key);
        const roots = productState.comments.filter(comment => !comment.parentId);
        list.innerHTML = roots.map(comment => renderCommentTree(productState, comment)).join('');
        list.querySelectorAll('[data-comment-reaction-toggle]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                button.closest('.comment-reaction-wrap')?.querySelector('.reaction-popover')?.classList.toggle('active');
            });
        });
        list.querySelectorAll('[data-comment-reaction]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                const comment = button.closest('[data-comment-id]');
                setCommentReaction(comment?.dataset.commentId, button.dataset.commentReaction, button);
                button.closest('.reaction-popover')?.classList.remove('active');
            });
        });
        list.querySelectorAll('[data-reply-open]').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                button.closest('.social-comment')?.querySelector('.reply-form')?.classList.toggle('active');
            });
        });
        const titleCount = document.querySelector('.comments-title span');
        if (titleCount) titleCount.textContent = `${commentTotal(productState)} conversaciones`;
    }

    function renderCommentTree(productState, comment) {
        const replies = productState.comments.filter(item => item.parentId === comment.id);
        return `
            ${commentTemplate(comment)}
            ${replies.map(reply => commentTemplate(reply, true)).join('')}
        `;
    }

    function commentTemplate(comment, isReply = false) {
        const initials = String(comment.author || 'Cliente').trim().slice(0, 1).toUpperCase() || 'C';
        const activeEmoji = comment.userReaction || '❤️';
        const activeLabel = comment.userReaction ? activeEmoji : 'Reaccionar';
        const total = commentReactionTotal(comment);
        return `
            <article class="social-comment ${isReply ? 'reply' : ''}" data-comment-id="${text(comment.id)}">
                <div class="social-comment-head">
                    <span class="social-avatar">${text(initials)}</span>
                    <div class="social-comment-meta">
                        <strong>${text(comment.author || 'Cliente')}</strong>
                        <time>${relativeTime(comment.createdAt)}</time>
                    </div>
                </div>
                <p>${text(comment.body)}</p>
                <div class="social-row">
                    <span class="comment-reaction-wrap">
                        <button class="social-action comment-reaction-toggle ${comment.userReaction ? 'active' : ''}" type="button" data-comment-reaction-toggle aria-pressed="${comment.userReaction ? 'true' : 'false'}">
                            <span>${activeLabel}</span>
                            <b>${total}</b>
                        </button>
                        <span class="reaction-popover compact comment-reaction-popover" role="menu">
                            ${commentEmojis.map(emoji => `<button class="reaction-option ${comment.userReaction === emoji ? 'active' : ''}" type="button" role="menuitem" data-comment-reaction="${emoji}" aria-label="Reaccionar ${emoji}">${emoji}<small>${comment.reactions?.[emoji] || 0}</small></button>`).join('')}
                        </span>
                    </span>
                    <button class="social-action" type="button" data-reply-open><i class="fas fa-reply"></i> Responder</button>
                </div>
                ${commentFormTemplate(activeProduct?.key || '', comment.id)}
            </article>
        `;
    }

    function relativeTime(value) {
        const diff = Date.now() - Number(value || Date.now());
        const minutes = Math.max(1, Math.round(diff / 60000));
        if (minutes < 60) return `Hace ${minutes} min`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `Hace ${hours} h`;
        return `Hace ${Math.round(hours / 24)} d`;
    }

    async function addComment(key, body, parentId = '') {
        const productState = getProductState(key);

        if (!activeProduct?.productId || typeof window.lgDbApi !== 'function') {
            productState.comments.push({
                id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                parentId,
                author: 'Cliente web',
                body,
                createdAt: Date.now(),
                userReaction: '',
                reactions: emptyReactionCounts(commentEmojis)
            });
            saveState();
            refreshCardSocial(key);
            renderModalSocialSummary(activeProduct);
            renderComments(key);
            window.lgShowToast?.(parentId ? 'Respuesta guardada' : 'Comentario guardado');
            return true;
        }
        const created = await window.lgDbApi('createComentario', {
            data: {
                producto_id: activeProduct.productId,
                cliente_id: 'WEB',
                cliente_nombre: 'Cliente web',
                calificacion: 5,
                comentario: body,
                parent_id: parentId
            }
        });
        if (!created.success) {
            window.lgShowToast?.(created.error || 'No se pudo guardar el comentario');
            return false;
        }
        setStoreActionOverlay(true, 'Actualizando comentarios...');
        await hydrateProductFromDatabase(activeProduct);
        saveState();
        refreshCardSocial(key);
        renderModalSocialSummary(activeProduct);
        renderComments(key);
        window.lgShowToast?.('Comentario guardado');
        return true;
    }

    async function setCommentReaction(commentId, emoji, origin) {
        if (!activeProduct) return;
        const productState = getProductState(activeProduct.key);
        const comment = productState.comments.find(item => item.id === commentId);
        if (!comment) return;
        comment.reactions = comment.reactions || {};
        if (comment.userReaction === emoji) {
            comment.reactions[emoji] = Math.max(0, Number(comment.reactions[emoji] || 0) - 1);
            comment.userReaction = '';
        } else {
            if (comment.userReaction) {
                const old = comment.userReaction;
                comment.reactions[old] = Math.max(0, Number(comment.reactions[old] || 0) - 1);
            }
            comment.reactions[emoji] = Number(comment.reactions[emoji] || 0) + 1;
            comment.userReaction = emoji;
            floatReaction(emoji, origin);
        }
        saveState();
        renderComments(activeProduct.key);
        if (typeof window.lgDbApi === 'function' && commentId && !String(commentId).startsWith('local-')) {
            const result = await window.lgDbApi('reactToTarget', {
                data: {
                    target_type: 'comentario',
                    target_id: commentId,
                    cliente_id: socialClientId,
                    emoji
                }
            });
            if (result.success && result.data) {
                comment.reactions = { ...emptyReactionCounts(commentEmojis), ...(result.data.counts || {}) };
                comment.userReaction = result.data.userReaction || '';
                saveState();
                renderComments(activeProduct.key);
            }
        }
    }

    function getSurfaceState(type, id) {
        const key = `${type}:${id}`;
        if (!socialState[key]) {
            socialState[key] = { userReaction: '', reactions: emptyReactionCounts(), comments: [] };
        }
        socialState[key].reactions = { ...emptyReactionCounts(), ...(socialState[key].reactions || {}) };
        return socialState[key];
    }

    function renderUniversalSocial(type, id) {
        const state = getSurfaceState(type, id);
        return `
            <div class="universal-social" data-universal-social="${text(`${type}:${id}`)}">
                <div class="reaction-stack">${renderReactionStack(state)}</div>
                <button class="social-action universal-toggle ${state.userReaction ? 'active' : ''}" type="button" data-universal-toggle aria-pressed="${state.userReaction ? 'true' : 'false'}">
                    <span>${state.userReaction || '❤️'}</span> <b data-universal-total>${reactionTotal(state)}</b>
                </button>
                <div class="reaction-popover compact" role="menu">
                    ${reactionEmojis.map(emoji => `<button class="reaction-option" type="button" data-universal-reaction="${emoji}" aria-label="Reaccionar ${emoji}">${emoji}</button>`).join('')}
                </div>
            </div>
        `;
    }

    function refreshUniversalSurface(type, id) {
        const state = getSurfaceState(type, id);
        document.querySelectorAll('[data-universal-social]').forEach(box => {
            if (box.dataset.universalSocial !== `${type}:${id}`) return;
            box.querySelector('.reaction-stack').innerHTML = renderReactionStack(state);
            box.querySelector('[data-universal-total]').textContent = reactionTotal(state);
            const toggle = box.querySelector('[data-universal-toggle]');
            toggle.classList.toggle('active', Boolean(state.userReaction));
            toggle.setAttribute('aria-pressed', state.userReaction ? 'true' : 'false');
            toggle.querySelector('span').textContent = state.userReaction || '❤️';
        });
    }

    function enhanceSocialSurfaces() {
        document.querySelectorAll('[data-social-target][data-social-id]').forEach(surface => {
            if (surface.dataset.surfaceReady) return;
            const type = surface.dataset.socialTarget;
            const id = surface.dataset.socialId;
            if (!type || !id) return;
            surface.dataset.surfaceReady = 'true';
            surface.insertAdjacentHTML('beforeend', renderUniversalSocial(type, id));
            const socialBox = surface.querySelector('.universal-social:last-child');
            socialBox?.querySelector('[data-universal-toggle]')?.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                socialBox.querySelector('.reaction-popover')?.classList.toggle('active');
            });
            socialBox?.querySelectorAll('[data-universal-reaction]').forEach(button => {
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    setUniversalReaction(surface, button.dataset.universalReaction, button);
                    button.closest('.reaction-popover')?.classList.remove('active');
                });
            });
        });
        syncUniversalSurfaces();
    }

    async function syncUniversalSurfaces() {
        if (typeof window.lgDbApi !== 'function') return;
        const targets = Array.from(document.querySelectorAll('[data-social-target][data-social-id]'))
            .map(surface => ({ target_type: surface.dataset.socialTarget, target_id: surface.dataset.socialId }))
            .filter(target => target.target_type && target.target_id);
        const unique = [...new Map(targets.map(target => [`${target.target_type}:${target.target_id}`, target])).values()];
        if (!unique.length) return;
        const result = await window.lgDbApi('getReactionsForTargets', { targets: unique, clienteId: socialClientId });
        if (!result.success || !result.data) return;
        unique.forEach(target => {
            const state = getSurfaceState(target.target_type, target.target_id);
            applyReactionSummary(state, result.data[`${target.target_type}:${target.target_id}`]);
            refreshUniversalSurface(target.target_type, target.target_id);
        });
        saveState();
    }

    async function setUniversalReaction(surface, emoji, origin) {
        const type = surface?.dataset.socialTarget;
        const id = surface?.dataset.socialId;
        if (!type || !id) return;
        const state = getSurfaceState(type, id);
        if (state.userReaction === emoji) {
            state.reactions[emoji] = Math.max(0, Number(state.reactions[emoji] || 0) - 1);
            state.userReaction = '';
        } else {
            if (state.userReaction) state.reactions[state.userReaction] = Math.max(0, Number(state.reactions[state.userReaction] || 0) - 1);
            state.reactions[emoji] = Number(state.reactions[emoji] || 0) + 1;
            state.userReaction = emoji;
            floatReaction(emoji, origin);
        }
        saveState();
        refreshUniversalSurface(type, id);
        if (typeof window.lgDbApi === 'function') {
            const result = await window.lgDbApi('reactToTarget', {
                data: { target_type: type, target_id: id, cliente_id: socialClientId, emoji }
            });
            if (result.success && result.data) {
                applyReactionSummary(state, result.data);
                saveState();
                refreshUniversalSurface(type, id);
            }
        }
    }

    function bindModalInteractions() {
        document.querySelectorAll('[data-video-thumb]').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.social-thumb').forEach(item => item.classList.remove('active'));
                button.classList.add('active');
                const main = document.getElementById('socialModalMain');
                if (main) {
                    main.innerHTML = `<video src="${text(resolveSocialDriveMedia(button.dataset.videoThumb))}" poster="${text(activeProduct.images[0] || '')}" controls playsinline preload="metadata" id="modalVideo"></video><span class="zoom-hint"><i class="fas fa-play"></i> Video del producto</span>`;
                    main.classList.remove('zoomed');
                }
            });
        });
        document.querySelectorAll('[data-thumb-index]').forEach(button => {
            button.addEventListener('click', () => {
                activeImageIndex = Number(button.dataset.thumbIndex);
                document.querySelectorAll('.social-thumb').forEach(item => item.classList.remove('active'));
                button.classList.add('active');
                const main = document.getElementById('socialModalMain');
                if (main) {
                    main.innerHTML = `<img src="${text(activeProduct.images[activeImageIndex])}" alt="${text(activeProduct.name)}" id="modalImg"><span class="zoom-hint"><i class="fas fa-search-plus"></i> Click para zoom</span>`;
                    main.classList.remove('zoomed');
                }
            });
        });

        const main = document.getElementById('socialModalMain');
        main?.addEventListener('click', () => main.classList.toggle('zoomed'));
        main?.addEventListener('mousemove', event => {
            const img = main.querySelector('img');
            if (!img) return;
            const rect = main.getBoundingClientRect();
            img.style.transformOrigin = `${((event.clientX - rect.left) / rect.width) * 100}% ${((event.clientY - rect.top) / rect.height) * 100}%`;
        });

        document.getElementById('modalSocialAdd')?.addEventListener('click', () => {
            activeProduct.card.querySelector('.add-to-cart')?.click();
            closeSocialModal();
        });
    }

    function closeSocialModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.addEventListener('click', event => {
        if (event.target.closest('[data-product-reaction], [data-modal-reaction], [data-comment-reaction], [data-comment-reaction-toggle], [data-universal-reaction], [data-universal-toggle], [data-product-quick-heart], .product-react-toggle, .product-comment-open, [data-reply-open]')) {
            return;
        }

        const quick = event.target.closest('.quick-view, .static-detail-link');
        if (quick) {
            const card = quick.closest('.product-card');
            if (card) {
                event.preventDefault();
                event.stopImmediatePropagation();
                openSocialModal(card, quick.classList.contains('static-detail-link'));
                return;
            }
        }

        const cardClick = event.target.closest('.product-card');
        if (cardClick && !event.target.closest('button, a, input, textarea, select, .product-social')) {
            openSocialModal(cardClick, false);
            return;
        }

        const toggle = event.target.closest('.product-react-toggle');
        if (toggle) {
            const popover = toggle.closest('.product-reaction-wrap')?.querySelector('.reaction-popover');
            popover?.classList.toggle('active');
            return;
        }

        const quickHeart = event.target.closest('[data-product-quick-heart]');
        if (quickHeart) {
            const card = quickHeart.closest('.product-card');
            if (!card) return;
            setProductReaction(card.dataset.productKey, '❤️', quickHeart);
            return;
        }

        const productReaction = event.target.closest('[data-product-reaction]');
        if (productReaction) {
            const card = productReaction.closest('.product-card');
            if (!card) return;
            setProductReaction(card.dataset.productKey, productReaction.dataset.productReaction, productReaction);
            productReaction.closest('.reaction-popover')?.classList.remove('active');
            return;
        }

        const commentOpen = event.target.closest('.product-comment-open');
        if (commentOpen) {
            const card = commentOpen.closest('.product-card');
            if (card) openSocialModal(card, true);
            return;
        }

        const modalReaction = event.target.closest('[data-modal-reaction]');
        if (modalReaction && activeProduct) {
            setProductReaction(activeProduct.key, modalReaction.dataset.modalReaction, modalReaction);
            return;
        }

        const commentReaction = event.target.closest('[data-comment-reaction]');
        if (commentReaction) {
            const comment = commentReaction.closest('[data-comment-id]');
            setCommentReaction(comment?.dataset.commentId, commentReaction.dataset.commentReaction, commentReaction);
            return;
        }

        const replyOpen = event.target.closest('[data-reply-open]');
        if (replyOpen) {
            replyOpen.closest('.social-comment')?.querySelector('.reply-form')?.classList.toggle('active');
            return;
        }

        const universalToggle = event.target.closest('[data-universal-toggle]');
        if (universalToggle) {
            universalToggle.closest('.universal-social')?.querySelector('.reaction-popover')?.classList.toggle('active');
            return;
        }

        const universalReaction = event.target.closest('[data-universal-reaction]');
        if (universalReaction) {
            const surface = universalReaction.closest('[data-social-target][data-social-id]');
            setUniversalReaction(surface, universalReaction.dataset.universalReaction, universalReaction);
            universalReaction.closest('.reaction-popover')?.classList.remove('active');
            return;
        }

        const emojiToggle = event.target.closest('[data-emoji-picker-toggle]');
        if (emojiToggle) {
            emojiToggle.closest('.emoji-strip')?.classList.toggle('active');
            return;
        }

        const emoji = event.target.closest('[data-insert-emoji]');
        if (emoji) {
            const form = emoji.closest('form');
            const textarea = form?.querySelector('textarea');
            if (textarea) {
                textarea.value = `${textarea.value}${emoji.dataset.insertEmoji}`;
                textarea.focus();
            }
            emoji.closest('.emoji-strip')?.classList.remove('active');
        }
    }, true);

    document.addEventListener('submit', event => {
        const form = event.target.closest('[data-comment-form]');
        if (!form) return;
        event.preventDefault();
        const textarea = form.querySelector('textarea');
        const body = textarea?.value.trim();
        if (!body) return;
        withStoreBusy(form, form.dataset.parentId ? 'Subiendo respuesta...' : 'Subiendo comentario...', async () => {
            const saved = await addComment(form.dataset.commentForm, body, form.dataset.parentId || '');
            if (saved && textarea) textarea.value = '';
        });
    });

    modalClose?.addEventListener('click', closeSocialModal);
    modal?.addEventListener('click', event => {
        if (event.target === modal) closeSocialModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal?.classList.contains('active')) closeSocialModal();
    });

    enhanceProductCards();
    enhanceSocialSurfaces();
    setTimeout(syncVisibleProductReactions, 250);
    if (productsGrid) {
        new MutationObserver(() => {
            enhanceProductCards();
            enhanceSocialSurfaces();
            syncVisibleProductReactions();
        }).observe(productsGrid, { childList: true, subtree: true });
    }
    document.addEventListener('lg:content-rendered', () => {
        enhanceProductCards();
        enhanceSocialSurfaces();
        syncVisibleProductReactions();
        window.bindGalleryLightbox?.();
    });
});

// ==========================================
// MEJORAS ESPECIFICAS PARA tienda.html
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const storySlides = Array.from(document.querySelectorAll('.tienda-story-slide'));
    const storyBars = Array.from(document.querySelectorAll('.tienda-story-progress span'));
    let storyIndex = 0;

    function setStory(index) {
        if (!storySlides.length) return;
        storyIndex = (index + storySlides.length) % storySlides.length;
        storySlides.forEach((slide, i) => slide.classList.toggle('active', i === storyIndex));
        storyBars.forEach((bar, i) => bar.style.setProperty('--progress', i === storyIndex ? '100%' : '0%'));
    }

    setStory(0);
    if (storySlides.length) setInterval(() => setStory(storyIndex + 1), 5200);

    const categoriesGrid = document.querySelector('.categories-grid');
    document.getElementById('categoryPrev')?.addEventListener('click', () => {
        categoriesGrid?.scrollBy({ left: -320, behavior: 'smooth' });
    });
    document.getElementById('categoryNext')?.addEventListener('click', () => {
        categoriesGrid?.scrollBy({ left: 320, behavior: 'smooth' });
    });

    document.getElementById('cartContinue')?.addEventListener('click', () => {
        document.getElementById('cartSidebar')?.classList.remove('active');
        document.getElementById('cartOverlay')?.classList.remove('active');
        document.body.style.overflow = '';
    });

    function staticCartTotal() {
        const raw = document.getElementById('cartTotal')?.textContent || '0';
        return Number(raw.replace(/[^\d.]/g, '')) || 0;
    }

    function updateStaticShipping() {
        const city = (document.getElementById('staticShippingCity')?.value || '').trim().toLowerCase();
        const estimate = document.getElementById('staticShippingEstimate');
        const bar = document.getElementById('staticShippingBar');
        const total = staticCartTotal();
        const goal = 180;
        const progress = Math.min(100, Math.round((total / goal) * 100));
        bar?.style.setProperty('--ship-progress', `${progress}%`);
        if (!estimate) return;
        if (!city) {
            estimate.textContent = 'Escribe tu ciudad para estimar el envio';
            return;
        }
        const local = ['bogota', 'bogotá', 'medellin', 'medellín', 'cali'].some(name => city.includes(name));
        const cost = total >= goal ? 0 : (local ? 9 : 15);
        const left = Math.max(0, goal - total);
        estimate.textContent = cost === 0
            ? 'Envio gratis desbloqueado'
            : `Envio aprox. $ ${cost.toFixed(2)} · faltan $ ${left.toFixed(2)} para gratis`;
    }

    document.getElementById('staticShippingCity')?.addEventListener('input', updateStaticShipping);
    new MutationObserver(updateStaticShipping).observe(document.getElementById('cartTotal') || document.body, {
        childList: true,
        characterData: true,
        subtree: true
    });
    updateStaticShipping();

    document.querySelectorAll('.variant-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.parentElement.querySelectorAll('.variant-chip').forEach(item => item.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    document.querySelectorAll('.product-actions').forEach(actions => {
        if (actions.querySelector('.wishlist-static')) return;
        const button = document.createElement('button');
        button.className = 'product-action-btn wishlist-static';
        button.type = 'button';
        button.title = 'Guardar favorito';
        button.innerHTML = '<i class="far fa-heart"></i>';
        actions.appendChild(button);
        button.addEventListener('click', () => {
            const icon = button.querySelector('i');
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
            button.classList.add('bump');
            setTimeout(() => button.classList.remove('bump'), 350);
        });
    });

    document.querySelectorAll('.product-card').forEach(card => {
        if (card.querySelector('.static-detail-link')) return;
        const quickView = card.querySelector('.quick-view');
        if (!quickView) return;
        const link = document.createElement('button');
        link.className = 'static-detail-link';
        link.type = 'button';
        link.innerHTML = '<i class="fas fa-comments"></i> Ver detalle';
        link.addEventListener('click', () => quickView.click());
        card.appendChild(link);
    });
});




