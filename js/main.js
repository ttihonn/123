// Основная логика главной страницы
document.addEventListener('DOMContentLoaded', function() {
    // Анимация счетчиков
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start);
            }
        }, 16);
    }

    // Загрузка данных для главной страницы
    function loadHomePageData() {
        const trafficLights = DataService.getData('traffic_lights');
        const projects = DataService.getData('projects').filter(p => p.public);
        const news = DataService.getData('news').filter(n => n.is_published).slice(0, 3);

        // Обновляем счетчики
        animateCounter(document.getElementById('trafficLightsCount'), trafficLights.length);
        animateCounter(document.getElementById('projectsCount'), projects.length);
        
        // Расчет снижения аварийности (упрощенный)
        const accidents = DataService.getData('accidents');
        if (accidents.length > 1) {
            const recent = accidents.slice(-1)[0].incidents_count;
            const previous = accidents.slice(-2)[0].incidents_count;
            const reduction = Math.round(((previous - recent) / previous) * 100);
            animateCounter(document.getElementById('accidentsReduction'), reduction);
        } else {
            document.getElementById('accidentsReduction').textContent = '15';
        }

        // Загрузка последних новостей
        const newsContainer = document.getElementById('newsPreview');
        if (newsContainer) {
            newsContainer.innerHTML = news.map(item => `
                <div class="news-card">
                    <div class="news-date">${new Date(item.date).toLocaleDateString('ru-RU')}</div>
                    <h3>${item.title}</h3>
                    <p>${item.content.substring(0, 100)}...</p>
                </div>
            `).join('');
        }
    }

    // Мобильное меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Проверка аутентификации для админ-ссылок
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!AuthService.isAuthenticated()) {
                e.preventDefault();
                const username = prompt('Введите логин:');
                const password = prompt('Введите пароль:');
                const user = AuthService.login(username, password);
                if (user) {
                    window.location.href = this.href;
                } else {
                    alert('Неверные учетные данные');
                }
            }
        });
    });

    // Загрузка данных для главной страницы
    if (document.querySelector('.hero')) {
        loadHomePageData();
    }
});