/**
 * LUZ GOMEZ - TIENDA ARTESANAL
 * JavaScript principal - Funcionalidades interactivas
 */

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
    window.removeCartItem = (index) => {
        removeFromCart(index);
    };

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
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 23, 59, 59);
        const diff = endOfDay - now;
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        document.getElementById('timerDays').textContent = String(days).padStart(2, '0');
        document.getElementById('timerHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('timerMinutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('timerSeconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);

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
        const parallaxElements = document.querySelectorAll('.hero-img-wrapper img, .about-img-main img');
        
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




