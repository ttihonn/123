// Оптимизированный интерактивный код
class InteractiveManager {
    constructor() {
        this.isScrolling = false;
        this.scrollTimer = null;
        this.observers = [];
        this.cache = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.preloadCriticalResources();
    }

    setupEventListeners() {
        // Делегирование событий для производительности
        document.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('mouseover', this.handleHover.bind(this));
        document.addEventListener('touchstart', this.handleTouch.bind(this), { passive: true });
        
        // Оптимизированный скролл
        document.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
        
        // Клавиатурная навигация
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    handleClick(event) {
        const target = event.target.closest('[data-action]') || 
                      event.target.closest('.interactive') ||
                      event.target.closest('[data-scroll]');

        if (!target) return;

        event.preventDefault();

        const action = target.dataset.action;
        const scrollTarget = target.dataset.scroll;
        const modal = target.dataset.modal;

        if (action) {
            this.executeAction(action, target);
        } else if (scrollTarget) {
            this.smoothScrollTo(scrollTarget);
        } else if (modal) {
            this.openModal(modal);
        }
    }

    handleHover(event) {
        const target = event.target.closest('.interactive');
        if (!target) return;

        // Прелоадим контент при ховере
        this.preloadContent(target);
    }

    handleTouch(event) {
        // Оптимизация для тач-устройств
        const target = event.target;
        if (target.classList.contains('interactive')) {
            target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                target.style.transform = '';
            }, 150);
        }
    }

    handleScroll() {
        if (!this.isScrolling) {
            this.isScrolling = true;
            requestAnimationFrame(this.updateScroll.bind(this));
        }
    }

    updateScroll() {
        // Ленивая загрузка и анимации при скролле
        this.checkVisibility();
        this.updateParallax();
        this.isScrolling = false;
    }

    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.lazyLoad(entry.target);
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        // Наблюдаем за элементами с ленивой загрузкой
        document.querySelectorAll('.lazy, [data-lazy]').forEach(el => {
            this.intersectionObserver.observe(el);
        });
    }

    lazyLoad(element) {
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.classList.add('loaded');
        }
        
        if (element.dataset.bg) {
            element.style.backgroundImage = `url(${element.dataset.bg})`;
        }

        element.classList.remove('lazy');
    }

    animateElement(element) {
        element.style.animation = 'fadeInUp 0.6s ease-out forwards';
    }

    setupSmoothScrolling() {
        // Нативная плавная прокрутка уже включена в CSS
        // Добавляем кастомное поведение для якорей
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    smoothScrollTo(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            const offset = 100; // Отступ для фиксированной шапки
            const targetPosition = target.offsetTop - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Фокус на модальное окно для доступности
            modal.setAttribute('aria-hidden', 'false');
            modal.focus();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    executeAction(action, element) {
        const actions = {
            'refresh-map': () => this.refreshMap(),
            'export-data': () => this.exportData(element.dataset.format),
            'filter-stats': () => this.filterStatistics(element.dataset.filter),
            'toggle-theme': () => this.toggleTheme()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    refreshMap() {
        const map = document.getElementById('heatMap');
        const btn = document.getElementById('refreshMap');
        
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        }

        // Имитация обновления данных
        setTimeout(() => {
            this.generateHeatMap();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить';
            }
        }, 1000);
    }

    generateHeatMap() {
        const map = document.getElementById('heatMap');
        if (!map) return;

        // Генерация тепловой карты на основе данных
        const data = this.getMockAccidentData();
        this.renderHeatMap(data);
    }

    getMockAccidentData() {
        // Мок-данные для демонстрации
        return [
            { x: 100, y: 150, intensity: 0.8, type: 'fatal' },
            { x: 200, y: 300, intensity: 0.6, type: 'injured' },
            { x: 350, y: 200, intensity: 0.9, type: 'fatal' },
            // ... больше данных
        ];
    }

    renderHeatMap(data) {
        const map = document.getElementById('heatMap');
        const tooltip = document.getElementById('mapTooltip');
        
        // Очищаем предыдущую карту
        map.querySelectorAll('.accident-point').forEach(point => point.remove());

        data.forEach(point => {
            const dot = document.createElement('div');
            dot.className = `accident-point ${point.type}`;
            dot.style.left = `${point.x}px`;
            dot.style.top = `${point.y}px`;
            dot.style.transform = `scale(${point.intensity})`;
            
            dot.addEventListener('mouseenter', (e) => {
                this.showTooltip(e, point);
            });
            
            dot.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            map.appendChild(dot);
        });
    }

    showTooltip(event, point) {
        const tooltip = document.getElementById('mapTooltip');
        if (!tooltip) return;

        const typeText = point.type === 'fatal' ? 'С погибшими' : 'С пострадавшими';
        tooltip.innerHTML = `
            <strong>ДТП</strong><br>
            Тип: ${typeText}<br>
            Интенсивность: ${Math.round(point.intensity * 100)}%
        `;
        
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.style.opacity = '1';
    }

    hideTooltip() {
        const tooltip = document.getElementById('mapTooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    preloadCriticalResources() {
        // Прелоад критических ресурсов
        const critical = [
            'js/real-statistics.js',
            'https://cdn.jsdelivr.net/npm/chart.js'
        ];

        critical.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.js') ? 'script' : 'style';
            document.head.appendChild(link);
        });
    }

    preloadContent(element) {
        // Прелоад контента при ховере
        const contentToPreload = element.dataset.preload;
        if (contentToPreload && !this.cache.has(contentToPreload)) {
            fetch(contentToPreload)
                .then(response => response.text())
                .then(data => {
                    this.cache.set(contentToPreload, data);
                });
        }
    }

    checkVisibility() {
        // Проверка видимости элементов для ленивой загрузки
        const elements = document.querySelectorAll('.lazy:not(.loaded)');
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight + 100) {
                this.lazyLoad(el);
            }
        });
    }

    updateParallax() {
        // Простой параллакс эффект
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    }

    handleKeydown(event) {
        // Клавиатурная навигация
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        if (event.key === 'Tab') {
            this.handleTabNavigation(event);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    handleTabNavigation(event) {
        // Улучшенная навигация Tab для доступности
        const modals = document.querySelectorAll('.modal[style*="display: block"]');
        if (modals.length > 0) {
            const currentModal = modals[0];
            const focusable = currentModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                last.focus();
                event.preventDefault();
            } else if (!event.shiftKey && document.activeElement === last) {
                first.focus();
                event.preventDefault();
            }
        }
    }
}

// Инициализация при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.interactiveManager = new InteractiveManager();
    
    // Предзагрузка данных
    if (window.realStatistics) {
        window.realStatistics.preloadData();
    }
});

// Оптимизация для медленных соединений
if ('connection' in navigator) {
    const connection = navigator.connection;
    if (connection.saveData) {
        // Режим экономии данных
        document.documentElement.classList.add('save-data');
    }
}