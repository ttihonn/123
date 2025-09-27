// Логика для страницы новостей
document.addEventListener('DOMContentLoaded', function() {
    const newsPerPage = 6;
    let currentPage = 1;
    let filteredNews = [];

    initNewsPage();

    function initNewsPage() {
        loadNews();
        setupEventListeners();
    }

    function loadNews() {
        const allNews = DataService.getData('news')
            .filter(news => news.is_published)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredNews = allNews;
        displayNews(currentPage);
        setupPagination(allNews.length);
    }

    function displayNews(page) {
        const newsList = document.getElementById('newsList');
        const startIndex = (page - 1) * newsPerPage;
        const endIndex = startIndex + newsPerPage;
        const newsToShow = filteredNews.slice(startIndex, endIndex);

        newsList.innerHTML = newsToShow.map(news => `
            <article class="news-article">
                <div class="news-date">${new Date(news.date).toLocaleDateString('ru-RU')}</div>
                <h2>${news.title}</h2>
                <p>${news.content.substring(0, 200)}...</p>
                <a href="#" class="read-more" data-id="${news.id}">Читать далее</a>
            </article>
        `).join('');

        // Добавляем обработчики для кнопок "Читать далее"
        document.querySelectorAll('.read-more').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const newsId = parseInt(this.dataset.id);
                showNewsDetail(newsId);
            });
        });
    }

    function showNewsDetail(newsId) {
        const news = DataService.getData('news').find(n => n.id === newsId);
        if (news) {
            // Создаем модальное окно для показа полной новости
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>${news.title}</h2>
                    <div class="news-date">${new Date(news.date).toLocaleDateString('ru-RU')}</div>
                    <div class="news-content">${news.content}</div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.style.display = 'block';

            // Обработчик закрытия модального окна
            modal.querySelector('.close').addEventListener('click', () => {
                modal.remove();
            });

            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    }

    function setupPagination(totalNews) {
        const totalPages = Math.ceil(totalNews / newsPerPage);
        const pagination = document.getElementById('pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        if (currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage - 1}">Назад</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${currentPage + 1}">Вперед</button>`;
        }

        pagination.innerHTML = paginationHTML;

        // Добавляем обработчики для кнопок пагинации
        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentPage = parseInt(this.dataset.page);
                displayNews(currentPage);
                setupPagination(filteredNews.length);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function setupEventListeners() {
        // Поиск
        document.getElementById('newsSearch').addEventListener('input', function(e) {
            filterNews();
        });

        // Фильтр по году
        document.getElementById('newsYear').addEventListener('change', function(e) {
            filterNews();
        });
    }

    function filterNews() {
        const searchTerm = document.getElementById('newsSearch').value.toLowerCase();
        const yearFilter = document.getElementById('newsYear').value;

        const allNews = DataService.getData('news')
            .filter(news => news.is_published)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        filteredNews = allNews.filter(news => {
            const matchesSearch = news.title.toLowerCase().includes(searchTerm) || 
                                 news.content.toLowerCase().includes(searchTerm);
            const matchesYear = !yearFilter || news.date.startsWith(yearFilter);
            
            return matchesSearch && matchesYear;
        });

        currentPage = 1;
        displayNews(currentPage);
        setupPagination(filteredNews.length);
    }
});