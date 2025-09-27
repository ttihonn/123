// app.js - Основной файл приложения
class CoddApp {
    constructor() {
        this.currentTheme = 'light';
        this.accidentData = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.initCharts();
        this.initMap();
        this.setupSmoothScrolling();
    }

    setupEventListeners() {
        // Переключение темы
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Мобильное меню
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Обновление карты
        document.getElementById('refreshMapData').addEventListener('click', () => {
            this.refreshMapData();
        });

        // Фильтры карты
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterClick(e.target);
            });
        });

        // Плавная прокрутка
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.body.setAttribute('data-theme', this.currentTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    toggleMobileMenu() {
        const nav = document.querySelector('.nav-list');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    }

    async loadData() {
        // Мок-данные, имитирующие реальную статистику
        this.accidentData = {
            summary: {
                totalAccidents: 247,
                fatalAccidents: 8,
                injuredAccidents: 189,
                damageCost: 156.7,
                totalViolations: 15432,
                speedViolations: 8234,
                redLightViolations: 2891,
                parkingViolations: 4307,
                safetyImprovement: 12.5,
                savedLives: 3,
                preventedAccidents: 28,
                newCameras: 15
            },
            trends: {
                accidentsChange: -8.2,
                violationsChange: -5.7
            },
            monthlyData: {
                labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
                currentYear: [28, 24, 26, 22, 25, 28, 31, 29, 23, 20, 18, 15],
                previousYear: [32, 29, 31, 28, 30, 33, 36, 34, 28, 25, 22, 19]
            },
            typesData: {
                labels: ['Столкновение', 'Наезд', 'Опрокидывание', 'Падение', 'Прочие'],
                data: [45, 25, 12, 10, 8]
            },
            mapData: this.generateMapData()
        };

        this.updateStatistics();
        this.animateCounters();
    }

    updateStatistics() {
        const data = this.accidentData.summary;
        const trends = this.accidentData.trends;

        // Обновление основных показателей
        this.updateCounter('totalAccidents', data.totalAccidents);
        this.updateCounter('fatalAccidents', data.fatalAccidents);
        this.updateCounter('injuredAccidents', data.injuredAccidents);
        this.updateCounter('damageCost', data.damageCost, ' млн ₽');
        this.updateCounter('totalViolations', data.totalViolations);
        this.updateCounter('speedViolations', data.speedViolations);
        this.updateCounter('redLightViolations', data.redLightViolations);
        this.updateCounter('parkingViolations', data.parkingViolations);
        this.updateCounter('safetyImprovement', data.safetyImprovement, '%');
        this.updateCounter('savedLives', data.savedLives);
        this.updateCounter('preventedAccidents', data.preventedAccidents);
        this.updateCounter('newCameras', data.newCameras);

        // Превью на герое
        this.updateCounter('previewAccidents', data.totalAccidents);
        this.updateCounter('previewDecrease', Math.abs(trends.accidentsChange), '%');

        // Обновление трендов
        this.updateTrend('accidentsTrend', trends.accidentsChange);
        this.updateTrend('violationsTrend', trends.violationsChange);
    }

    updateCounter(elementId, value, suffix = '') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value.toLocaleString() + suffix;
        }
    }

    updateTrend(elementId, change) {
        const element = document.getElementById(elementId);
        if (element) {
            const isPositive = change < 0;
            const icon = element.querySelector('i');
            const text = element.querySelector('span');
            
            icon.className = isPositive ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
            element.className = `trend ${isPositive ? 'positive' : 'negative'}`;
            text.textContent = `${isPositive ? '' : '+'}${change}% к прошлому году`;
        }
    }

    animateCounters() {
        const counters = document.querySelectorAll('.stat-value');
        counters.forEach(counter => {
            this.animateValue(counter);
        });
    }

    animateValue(element, duration = 2000) {
        const start = 0;
        const end = parseInt(element.textContent.replace(/\D/g, ''));
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const value = Math.floor(progress * end);
            element.textContent = value.toLocaleString() + (element.textContent.replace(/[0-9]/g, '') || '');

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    initCharts() {
        this.createAccidentsChart();
        this.createTypesChart();
    }

    createAccidentsChart() {
        const ctx = document.getElementById('accidentsChartCanvas').getContext('2d');
        const data = this.accidentData.monthlyData;

        this.charts.accidents = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '2024 год',
                        data: data.currentYear,
                        borderColor: '#62a744',
                        backgroundColor: 'rgba(98, 167, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: '2023 год',
                        data: data.previousYear,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4,
                        borderDash: [5, 5],
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createTypesChart() {
        const ctx = document.getElementById('typesChartCanvas').getContext('2d');
        const data = this.accidentData.typesData;

        this.charts.types = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        '#62a744',
                        '#3498db',
                        '#e74c3c',
                        '#f39c12',
                        '#9b59b6'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    initMap() {
        this.renderHeatMap();
        this.renderDistrictsList();
        this.renderTopAccidents();
    }

    generateMapData() {
        // Генерация мок-данных для карты
        const districts = [
            'Смоленск', 'Вязьма', 'Рославль', 'Ярцево', 'Сафоново', 
            'Гагарин', 'Десногорск', 'Починок', 'Дорогобуж', 'Ельня'
        ];

        return districts.map(district => ({
            name: district,
            accidents: Math.floor(Math.random() * 50) + 10,
            fatal: Math.floor(Math.random() * 5) + 1,
            injured: Math.floor(Math.random() * 30) + 5,
            coordinates: {
                x: Math.random() * 80 + 10,
                y: Math.random() * 80 + 10
            }
        }));
    }

    renderHeatMap() {
        const map = document.getElementById('heatMap');
        const data = this.accidentData.mapData;

        // Очищаем предыдущие точки
        map.querySelectorAll('.accident-point').forEach(point => point.remove());

        data.forEach(item => {
            const point = document.createElement('div');
            point.className = 'accident-point';
            point.style.left = `${item.coordinates.x}%`;
            point.style.top = `${item.coordinates.y}%`;
            point.style.width = `${Math.max(10, item.accidents / 2)}px`;
            point.style.height = `${Math.max(10, item.accidents / 2)}px`;
            point.style.backgroundColor = this.getColorByIntensity(item.accidents);
            point.style.opacity = Math.min(0.8, item.accidents / 100);

            point.setAttribute('data-district', item.name);
            point.setAttribute('data-accidents', item.accidents);
            point.setAttribute('data-fatal', item.fatal);
            point.setAttribute('data-injured', item.injured);

            point.addEventListener('mouseenter', (e) => this.showMapTooltip(e, item));
            point.addEventListener('mouseleave', () => this.hideMapTooltip());

            map.appendChild(point);
        });
    }

    getColorByIntensity(intensity) {
        if (intensity > 40) return '#e74c3c';
        if (intensity > 25) return '#f39c12';
        if (intensity > 15) return '#3498db';
        return '#62a744';
    }

    showMapTooltip(event, data) {
        const tooltip = document.getElementById('mapTooltip');
        if (!tooltip) return;

        tooltip.innerHTML = `
            <strong>${data.name}</strong><br>
            ДТП: ${data.accidents}<br>
            Погибшие: ${data.fatal}<br>
            Пострадавшие: ${data.injured}
        `;

        tooltip.style.left = `${event.pageX + 15}px`;
        tooltip.style.top = `${event.pageY + 15}px`;
        tooltip.style.opacity = '1';
    }

    hideMapTooltip() {
        const tooltip = document.getElementById('mapTooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }

    renderDistrictsList() {
        const container = document.getElementById('districtsList');
        const data = this.accidentData.mapData;

        container.innerHTML = data.map(item => `
            <div class="district-item" data-district="${item.name}">
                <span class="district-name">${item.name}</span>
                <span class="district-count">${item.accidents}</span>
            </div>
        `).join('');

        // Добавляем обработчики событий
        container.querySelectorAll('.district-item').forEach(item => {
            item.addEventListener('click', () => {
                this.highlightDistrict(item.dataset.district);
            });
        });
    }

    renderTopAccidents() {
        const container = document.getElementById('topAccidents');
        const data = [...this.accidentData.mapData]
            .sort((a, b) => b.accidents - a.accidents)
            .slice(0, 5);

        container.innerHTML = data.map((item, index) => `
            <div class="accident-item">
                <div class="accident-rank">${index + 1}</div>
                <div class="accident-info">
                    <div class="accident-location">${item.name}</div>
                    <div class="accident-count">${item.accidents} ДТП</div>
                </div>
            </div>
        `).join('');
    }

    highlightDistrict(districtName) {
        // Снимаем выделение со всех точек
        document.querySelectorAll('.accident-point').forEach(point => {
            point.style.transform = 'scale(1)';
        });

        // Выделяем выбранный район
        const targetPoint = document.querySelector(`.accident-point[data-district="${districtName}"]`);
        if (targetPoint) {
            targetPoint.style.transform = 'scale(1.5)';
            targetPoint.style.zIndex = '10';
        }
    }

    handleFilterClick(button) {
        const parent = button.closest('.filter-buttons');
        const period = button.dataset.period;
        const type = button.dataset.type;

        // Убираем активный класс у всех кнопок в группе
        parent.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Добавляем активный класс нажатой кнопке
        button.classList.add('active');

        // Применяем фильтры
        this.applyFilters(period, type);
    }

    applyFilters(period, type) {
        // Здесь будет логика фильтрации данных
        console.log('Applying filters:', period, type);
        this.refreshMapData();
    }

    refreshMapData() {
        // Показываем индикатор загрузки
        const refreshBtn = document.getElementById('refreshMapData');
        const originalHtml = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
        refreshBtn.disabled = true;

        // Имитация загрузки данных
        setTimeout(() => {
            this.accidentData.mapData = this.generateMapData();
            this.renderHeatMap();
            this.renderDistrictsList();
            this.renderTopAccidents();

            // Восстанавливаем кнопку
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить данные';
            refreshBtn.disabled = false;
        }, 1000);
    }

    setupSmoothScrolling() {
        // Дополнительная логика плавной прокрутки
        const headerHeight = document.querySelector('.header').offsetHeight;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Параллакс эффект для героя
            if (document.querySelector('.hero')) {
                const hero = document.querySelector('.hero');
                hero.style.transform = `translateY(${scrollY * 0.5}px)`;
            }

            // Появление элементов при скролле
            this.handleScrollAnimations();
        });
    }

    handleScrollAnimations() {
        const elements = document.querySelectorAll('.stat-card, .chart-container, .service-card');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    window.coddApp = new CoddApp();
    
    // Добавляем анимации появления
    const animatedElements = document.querySelectorAll('.stat-card, .chart-container, .service-card');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Запускаем анимации после небольшой задержки
    setTimeout(() => {
        window.coddApp.handleScrollAnimations();
    }, 100);
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});