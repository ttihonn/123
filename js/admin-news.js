// Логика управления новостями в админ-панели
document.addEventListener('DOMContentLoaded', function() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    initNewsManagement();
});

let currentPage = 1;
const newsPerPage = 10;
let currentNews = [];
let filteredNews = [];

function initNewsManagement() {
    loadNewsTable();
    setupNewsEventListeners();
    updateUserInfo();
}

function updateUserInfo() {
    const user = AuthService.getCurrentUser();
    if (user) {
        document.getElementById('currentUsername').textContent = `👤 ${user.username} (${user.role})`;
    }
}

function loadNewsTable() {
    const news = DataService.getData('news');
    const users = DataService.getData('users');
    
    // Сортируем новости по дате (сначала новые)
    currentNews = news.sort((a, b) => new Date(b.date) - new Date(a.date));
    filteredNews = [...currentNews];
    
    applyFiltersAndPagination();
    updateNewsStats();
}

function applyFiltersAndPagination() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchTerm = document.getElementById('newsSearch').value.toLowerCase();
    const sortBy = document.getElementById('sortBy').value;
    
    // Применяем фильтры
    let filtered = currentNews.filter(item => {
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'published' && item.is_published) ||
                            (statusFilter === 'draft' && !item.is_published);
        
        const matchesSearch = !searchTerm || 
                            item.title.toLowerCase().includes(searchTerm) ||
                            item.content.toLowerCase().includes(searchTerm);
        
        return matchesStatus && matchesSearch;
    });
    
    // Применяем сортировку
    switch (sortBy) {
        case 'oldest':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'title':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        default: // newest
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    filteredNews = filtered;
    renderNewsTable();
}

function renderNewsTable() {
    const tableBody = document.getElementById('newsTableBody');
    const users = DataService.getData('users');
    
    // Пагинация
    const totalPages = Math.ceil(filteredNews.length / newsPerPage);
    const startIndex = (currentPage - 1) * newsPerPage;
    const endIndex = startIndex + newsPerPage;
    const pageNews = filteredNews.slice(startIndex, endIndex);
    
    if (pageNews.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <div class="no-data-content">
                        <span>📰</span>
                        <p>Новости не найдены</p>
                        <small>Попробуйте изменить фильтры или добавить новую новость</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = pageNews.map(item => {
            const author = users.find(u => u.id === item.author_id);
            const authorName = author ? author.username : 'Неизвестен';
            const shortContent = item.content.length > 100 ? 
                item.content.substring(0, 100) + '...' : item.content;
            
            return `
                <tr>
                    <td>
                        <div class="news-title-cell">
                            <strong>${item.title}</strong>
                            <small>${shortContent}</small>
                        </div>
                    </td>
                    <td>${new Date(item.date).toLocaleDateString('ru-RU')}</td>
                    <td>
                        <span class="status-badge ${item.is_published ? 'published' : 'draft'}">
                            ${item.is_published ? '✅ Опубликовано' : '📝 Черновик'}
                        </span>
                        ${item.is_featured ? '<span class="featured-badge">⭐</span>' : ''}
                    </td>
                    <td>${authorName}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="editNews(${item.id})" 
                                    title="Редактировать">✏️</button>
                            <button class="btn-small btn-delete" onclick="deleteNews(${item.id})" 
                                    title="Удалить">🗑️</button>
                            <button class="btn-small btn-toggle" onclick="toggleNewsStatus(${item.id})" 
                                    title="${item.is_published ? 'Снять с публикации' : 'Опубликовать'}">
                                ${item.is_published ? '👁️' : '📤'}
                            </button>
                            <button class="btn-small btn-preview" onclick="previewNewsItem(${item.id})" 
                                    title="Предпросмотр">👀</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updatePagination();
}

function updateNewsStats() {
    const total = currentNews.length;
    const published = currentNews.filter(n => n.is_published).length;
    const drafts = total - published;
    
    document.getElementById('totalNews').textContent = total;
    document.getElementById('publishedNews').textContent = published;
    document.getElementById('draftNews').textContent = drafts;
    document.getElementById('totalRecords').textContent = filteredNews.length;
    document.getElementById('shownRecords').textContent = 
        Math.min(filteredNews.length, currentPage * newsPerPage);
}

function updatePagination() {
    const totalPages = Math.ceil(filteredNews.length / newsPerPage);
    
    document.getElementById('pageInfo').textContent = `Страница ${currentPage} из ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredNews.length / newsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderNewsTable();
    }
}

function setupNewsEventListeners() {
    // Обновление таблицы
    document.getElementById('refreshNews').addEventListener('click', function() {
        loadNewsTable();
        showNotification('Список новостей обновлен', 'success');
    });
    
    // Обработка формы новости
    document.getElementById('newsForm').addEventListener('submit', handleNewsSubmit);
    
    // Закрытие модальных окон
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'newsModal') {
                closeNewsModal();
            } else if (modal.id === 'previewModal') {
                closePreviewModal();
            }
        });
    });
    
    // Счетчик символов
    document.getElementById('newsContent').addEventListener('input', function() {
        const charCount = this.value.length;
        document.getElementById('charCount').textContent = charCount;
        
        if (charCount > 10000) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '';
        }
    });
    
    // Поиск при нажатии Enter
    document.getElementById('newsSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchNews();
        }
    });
}

function searchNews() {
    currentPage = 1;
    applyFiltersAndPagination();
}

function filterNews() {
    currentPage = 1;
    applyFiltersAndPagination();
}

function sortNews() {
    applyFiltersAndPagination();
}

function showNewsForm(newsId = null) {
    const modal = document.getElementById('newsModal');
    const form = document.getElementById('newsForm');
    const title = document.getElementById('newsModalTitle');
    
    // Сбрасываем счетчик символов
    document.getElementById('charCount').textContent = '0';
    
    if (newsId) {
        // Редактирование существующей новости
        title.textContent = 'Редактировать новость';
        const news = DataService.getData('news').find(n => n.id === newsId);
        if (news) {
            document.getElementById('newsTitle').value = news.title;
            document.getElementById('newsContent').value = news.content;
            document.getElementById('charCount').textContent = news.content.length;
            document.getElementById('newsImage').value = news.image_url || '';
            
            // Форматируем дату для datetime-local
            const date = new Date(news.date);
            const formattedDate = date.toISOString().substring(0, 16);
            document.getElementById('newsDate').value = formattedDate;
            
            document.getElementById('newsPublished').checked = news.is_published;
            document.getElementById('newsFeatured').checked = news.is_featured || false;
            
            form.dataset.editingId = newsId;
        }
    } else {
        // Создание новой новости
        title.textContent = 'Добавить новость';
        form.reset();
        document.getElementById('newsDate').value = new Date().toISOString().substring(0, 16);
        document.getElementById('newsPublished').checked = true;
        delete form.dataset.editingId;
    }
    
    modal.style.display = 'block';
}

function closeNewsModal() {
    document.getElementById('newsModal').style.display = 'none';
    document.getElementById('newsForm').reset();
    document.getElementById('charCount').textContent = '0';
}

function handleNewsSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const content = formData.get('content');
    
    // Проверка длины контента
    if (content.length > 10000) {
        showNotification('Слишком длинный текст новости (максимум 10,000 символов)', 'error');
        return;
    }
    
    const newsData = {
        title: formData.get('title'),
        content: content,
        image_url: formData.get('image_url'),
        date: formData.get('date'),
        is_published: formData.get('is_published') === 'on',
        is_featured: formData.get('is_featured') === 'on',
        author_id: AuthService.getCurrentUser().id
    };
    
    try {
        if (event.target.dataset.editingId) {
            // Обновление существующей новости
            DataService.updateItem('news', parseInt(event.target.dataset.editingId), newsData);
            showNotification('Новость успешно обновлена', 'success');
        } else {
            // Создание новой новости
            DataService.addItem('news', newsData);
            showNotification('Новость успешно создана', 'success');
        }
        
        closeNewsModal();
        loadNewsTable();
    } catch (error) {
        showNotification('Ошибка при сохранении новости', 'error');
        console.error(error);
    }
}

function editNews(id) {
    showNewsForm(id);
}

function deleteNews(id) {
    if (confirm('Вы уверены, что хотите удалить эту новость? Это действие нельзя отменить.')) {
        DataService.deleteItem('news', id);
        showNotification('Новость удалена', 'success');
        loadNewsTable();
    }
}

function toggleNewsStatus(id) {
    const news = DataService.getData('news').find(n => n.id === id);
    if (news) {
        DataService.updateItem('news', id, {
            is_published: !news.is_published
        });
        showNotification(`Новость ${!news.is_published ? 'опубликована' : 'перемещена в черновики'}`, 'success');
        loadNewsTable();
    }
}

function previewNews() {
    const formData = new FormData(document.getElementById('newsForm'));
    const previewContent = `
        <article class="news-article">
            <header class="news-header">
                <h1>${formData.get('title') || 'Заголовок новости'}</h1>
                <div class="news-meta">
                    <time>${new Date(formData.get('date') || new Date()).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</time>
                    <span class="news-status">${formData.get('is_published') === 'on' ? 'Опубликовано' : 'Черновик'}</span>
                </div>
            </header>
            
            ${formData.get('image_url') ? `
                <div class="news-image">
                    <img src="${formData.get('image_url')}" alt="${formData.get('title')}" 
                         onerror="this.style.display='none'">
                </div>
            ` : ''}
            
            <div class="news-content">
                <p>${formData.get('content') || 'Содержание новости...'}</p>
            </div>
            
            <footer class="news-footer">
                <p><strong>Автор:</strong> ${AuthService.getCurrentUser().username}</p>
            </footer>
        </article>
    `;
    
    document.getElementById('newsPreview').innerHTML = previewContent;
    document.getElementById('previewModal').style.display = 'block';
}

function previewNewsItem(id) {
    const news = DataService.getData('news').find(n => n.id === id);
    const users = DataService.getData('users');
    const author = users.find(u => u.id === news.author_id);
    
    if (news) {
        const previewContent = `
            <article class="news-article">
                <header class="news-header">
                    <h1>${news.title}</h1>
                    <div class="news-meta">
                        <time>${new Date(news.date).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</time>
                        <span class="news-status">${news.is_published ? 'Опубликовано' : 'Черновик'}</span>
                        ${news.is_featured ? '<span class="featured-badge">⭐ Важная новость</span>' : ''}
                    </div>
                </header>
                
                ${news.image_url ? `
                    <div class="news-image">
                        <img src="${news.image_url}" alt="${news.title}" 
                             onerror="this.style.display='none'">
                    </div>
                ` : ''}
                
                <div class="news-content">
                    <p>${news.content}</p>
                </div>
                
                <footer class="news-footer">
                    <p><strong>Автор:</strong> ${author ? author.username : 'Неизвестен'}</p>
                    <p><strong>Статус:</strong> ${news.is_published ? 'Опубликована' : 'Черновик'}</p>
                </footer>
            </article>
        `;
        
        document.getElementById('newsPreview').innerHTML = previewContent;
        document.getElementById('previewModal').style.display = 'block';
    }
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

function closePreviewModalAndSave() {
    closePreviewModal();
    // Фокус на форму редактирования
    document.getElementById('newsModal').style.display = 'block';
}

// Закрытие модальных окон при клике вне их
window.addEventListener('click', function(event) {
    const newsModal = document.getElementById('newsModal');
    const previewModal = document.getElementById('previewModal');
    
    if (event.target === newsModal) {
        closeNewsModal();
    }
    if (event.target === previewModal) {
        closePreviewModal();
    }
});

// Глобальные функции для вызова из HTML
window.showNewsForm = showNewsForm;
window.searchNews = searchNews;
window.filterNews = filterNews;
window.sortNews = sortNews;
window.changePage = changePage;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.toggleNewsStatus = toggleNewsStatus;
window.previewNews = previewNews;
window.previewNewsItem = previewNewsItem;
window.closeNewsModal = closeNewsModal;
window.closePreviewModal = closePreviewModal;
window.closePreviewModalAndSave = closePreviewModalAndSave;
// Управление данными
document.addEventListener('DOMContentLoaded', function() {
    initializeDataPage();
    loadInitialData();
});

function initializeDataPage() {
    // Установка текущей даты обновления
    document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('ru-RU');
    
    // Обработчики кнопок
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            window.location.href = '../index.html';
        }
    });
}

function loadDataType() {
    const select = document.getElementById('dataTypeSelect');
    const type = select.value;
    
    // Показать загрузку
    showLoading();
    
    // Имитация загрузки данных
    setTimeout(() => {
        loadDataByType(type);
        hideLoading();
    }, 1000);
}

function loadDataByType(type) {
    const dataMap = {
        'accidents': 'ДТП и аварии',
        'fines': 'Штрафы и нарушения',
        'towing': 'Эвакуация ТС',
        'traffic': 'Дорожное движение',
        'infrastructure': 'Инфраструктура'
    };
    
    // Обновление заголовка
    document.querySelector('.admin-content h3').textContent = 
        `📊 Данные: ${dataMap[type]} - Смоленская область`;
    
    // Здесь будет реальная загрузка данных по API
    console.log('Загрузка данных типа:', type);
}

function importOfficialData() {
    showNotification('Загрузка данных с серверов ГИБДД...', 'info');
    
    // Имитация импорта данных
    setTimeout(() => {
        const newRecords = Math.floor(Math.random() * 50) + 10;
        const total = parseInt(document.getElementById('totalRecords').textContent) + newRecords;
        document.getElementById('totalRecords').textContent = total.toLocaleString();
        
        showNotification(`Успешно импортировано ${newRecords} новых записей`, 'success');
        updateDataFreshness();
    }, 3000);
}

function exportData() {
    const type = document.getElementById('dataTypeSelect').value;
    const filename = `данные_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    showNotification(`Экспорт данных в файл ${filename}...`, 'info');
    
    setTimeout(() => {
        showNotification('Данные успешно экспортированы', 'success');
    }, 2000);
}

function updateDataFreshness() {
    const now = new Date();
    const updateTime = now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    document.getElementById('lastUpdate').textContent = now.toLocaleDateString('ru-RU');
    document.querySelector('.stat-info small').textContent = updateTime;
    
    // Сброс таймера актуальности
    document.getElementById('dataFreshness').textContent = '0 минут';
    startFreshnessTimer();
}

function startFreshnessTimer() {
    let minutes = 0;
    setInterval(() => {
        minutes++;
        document.getElementById('dataFreshness').textContent = 
            minutes === 1 ? '1 минута' : `${minutes} минут`;
    }, 60000);
}

function showLoading() {
    // Реализация индикатора загрузки
    const loader = document.createElement('div');
    loader.id = 'dataLoader';
    loader.innerHTML = '🔄 Загрузка данных...';
    loader.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('dataLoader');
    if (loader) {
        loader.remove();
    }
}

function showNotification(message, type) {
    // Та же функция уведомлений, что и в дашборде
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'info' ? '#3498db' : '#e74c3c'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Инициализация при загрузке
function loadInitialData() {
    startFreshnessTimer();
}