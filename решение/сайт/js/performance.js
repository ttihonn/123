// Оптимизация производительности
class PerformanceOptimizer {
    constructor() {
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.setupPerformanceMonitoring();
        this.optimizeAnimations();
        this.setupResourceMonitoring();
    }

    setupPerformanceMonitoring() {
        // Мониторинг Core Web Vitals
        if ('PerformanceObserver' in window) {
            this.observeLargestContentfulPaint();
            this.observeCumulativeLayoutShift();
            this.observeFirstInputDelay();
        }

        // Мониторинг памяти
        if ('memory' in performance) {
            this.monitorMemoryUsage();
        }
    }

    observeLargestContentfulPaint() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.set('lcp', lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    observeCumulativeLayoutShift() {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.metrics.set('cls', clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
    }

    optimizeAnimations() {
        // Оптимизация анимаций с requestAnimationFrame
        this.animationFrame = null;
        
        // Отложенная инициализация тяжелых анимаций
        setTimeout(() => {
            this.initializeHeavyAnimations();
        }, 1000);
    }

    initializeHeavyAnimations() {
        // Инициализация только когда страница готова
        if (document.readyState === 'complete') {
            this.startBackgroundAnimations();
        } else {
            window.addEventListener('load', () => {
                this.startBackgroundAnimations();
            });
        }
    }

    startBackgroundAnimations() {
        const animate = () => {
            // Легковесные фоновые анимации
            this.updateParticleEffects();
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        // Запускаем только если страница видима
        if (document.visibilityState === 'visible') {
            this.animationFrame = requestAnimationFrame(animate);
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                cancelAnimationFrame(this.animationFrame);
            } else {
                this.animationFrame = requestAnimationFrame(animate);
            }
        });
    }

    setupResourceMonitoring() {
        // Мониторинг загрузки ресурсов
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (entry.duration > 1000) {
                    console.warn('Медленный ресурс:', entry.name, entry.duration);
                }
            });
        });
        observer.observe({ entryTypes: ['resource'] });
    }

    monitorMemoryUsage() {
        setInterval(() => {
            const memory = performance.memory;
            const used = memory.usedJSHeapSize / 1048576;
            const limit = memory.jsHeapSizeLimit / 1048576;
            
            if (used > limit * 0.8) {
                this.cleanupMemory();
            }
        }, 30000);
    }

    cleanupMemory() {
        // Очистка кэша и тяжелых объектов
        if (window.interactiveManager) {
            window.interactiveManager.cache.clear();
        }
        
        // Принудительный сбор мусора (если доступен)
        if (window.gc) {
            window.gc();
        }
    }

    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
}

// Инициализация оптимизатора
document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimizer = new PerformanceOptimizer();
});

// Service Worker для кэширования
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}