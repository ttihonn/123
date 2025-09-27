// Логика админ-панели
document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    if (!AuthService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    // Проверка прав доступа
    const user = AuthService.getCurrentUser();
    if (user.role !== 'admin' && user.role !== 'editor') {
        alert('Недостаточно прав для доступа к админ-панели');
        window.location.href = '../index.html';
        return;
    }

    initAdminPanel();
});

function initAdminPanel() {
    loadAdminStats();
    setupAdminEventListeners();
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000); // Обновлять время каждую минуту
}

// Загрузка статистики для админ-панели
function loadAdminStats() {
    const news = DataService.getData('news');
    const trafficLights = DataService.getData('traffic_lights');
    const users = DataService.getData('users');
    
    // Подсчет общего количества записей во всех таблицах
    let totalRecords = 0;
    const tables = ['news', 'traffic_fines', 'tow_trucks', 'traffic_lights', 'accidents', 'projects', 'services', 'documents', 'vacancies'];
    tables.forEach(table => {
        totalRecords += DataService.getData(table).length;
    });

    // Обновление счетчиков
    document.getElementById('newsCount').textContent = news.filter(n => n.is_published).length;
    document.getElementById('trafficLightsCount').textContent = trafficLights.filter(tl => tl.status === 'working').length;
    document.getElementById('dataRecordsCount').textContent = totalRecords;
    document.getElementById('usersCount').textContent = users.length;
    document.getElementById('currentUsername').textContent = `👤 ${user.username} (${user.role})`;

    // Системная информация (заглушки)
    document.getElementById('dbRecords').textContent = totalRecords;
    document.getElementById('dbSize').textContent = (totalRecords * 0.1).toFixed(1) + ' MB';
    document.getElementById('responseTime').textContent = '25ms';
    document.getElementById('activeSessions').textContent = '1';
}

// Настройка обработчиков событий
function setupAdminEventListeners() {
    // Выход из системы
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            AuthService.logout();
            window.location.href = '../index.html';
        }
    });

    // Обновление данных
    document.getElementById('refreshData').addEventListener('click', function() {
        loadAdminStats();
        showNotification('Данные обновлены', 'success');
    });

    // Закрытие модального окна
    document.querySelector('.close').addEventListener('click', closeModal);
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('dataModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Обработка формы
    document.getElementById('dataForm').addEventListener('submit', handleFormSubmit);
}

// Обновление текущего времени
function updateCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        `Текущее время: ${now.toLocaleTimeString('ru-RU')}`;
}

// Показать модальное окно для добавления данных
function showDataForm(dataType) {
    const modal = document.getElementById('dataModal');
    const formFields = document.getElementById('formFields');
    const modalTitle = document.getElementById('modalTitle');
    
    // Генерация полей формы в зависимости от типа данных
    formFields.innerHTML = generateFormFields(dataType);
    modalTitle.textContent = getModalTitle(dataType);
    
    modal.style.display = 'block';
    document.getElementById('dataForm').dataset.type = dataType;
}

// Генерация полей формы
function generateFormFields(dataType) {
    const fields = {
        traffic_lights: [
            { name: 'address', label: 'Адрес', type: 'text', required: true },
            { name: 'type', label: 'Тип', type: 'select', options: ['пешеходный', 'транспортный', 'реверсивный'], required: true },
            { name: 'installation_date', label: 'Дата установки', type: 'date', required: true },
            { name: 'status', label: 'Статус', type: 'select', options: ['working', 'repairing', 'planned'], required: true },
            { name: 'latitude', label: 'Широта', type: 'number', step: '0.000001', required: true },
            { name: 'longitude', label: 'Долгота', type: 'number', step: '0.000001', required: true }
        ],
        news: [
            { name: 'title', label: 'Заголовок', type: 'text', required: true },
            { name: 'content', label: 'Содержание', type: 'textarea', required: true },
            { name: 'image_url', label: 'URL изображения', type: 'text' },
            { name: 'is_published', label: 'Опубликовано', type: 'checkbox' }
        ]
    };

    const fieldConfig = fields[dataType] || [];
    
    return fieldConfig.map(field => `
        <div class="form-group">
            <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
            ${generateFieldHTML(field)}
        </div>
    `).join('');
}

function generateFieldHTML(field) {
    switch (field.type) {
        case 'select':
            return `
                <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                    <option value="">Выберите...</option>
                    ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            `;
        case 'textarea':
            return `<textarea id="${field.name}" name="${field.name}" rows="4" ${field.required ? 'required' : ''}></textarea>`;
        case 'checkbox':
            return `<input type="checkbox" id="${field.name}" name="${field.name}">`;
        default:
            return `<input type="${field.type}" id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''}>`;
    }
}

function getModalTitle(dataType) {
    const titles = {
        traffic_lights: 'Добавить светофор',
        news: 'Добавить новость',
        accidents: 'Добавить запись о ДТП',
        traffic_fines: 'Добавить данные о штрафах'
    };
    return titles[dataType] || 'Добавить данные';
}

// Обработка отправки формы
function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const dataType = event.target.dataset.type;
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Добавление дополнительных полей
    const user = AuthService.getCurrentUser();
    data.author_id = user.id;
    data.date = new Date().toISOString().split('T')[0];

    try {
        DataService.addItem(dataType, data);
        showNotification('Данные успешно сохранены', 'success');
        closeModal();
        loadAdminStats(); // Обновляем статистику
    } catch (error) {
        showNotification('Ошибка при сохранении данных', 'error');
        console.error(error);
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('dataModal').style.display = 'none';
    document.getElementById('dataForm').reset();
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;

    // Стили для уведомления
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 1rem;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
    `;

    document.body.appendChild(notification);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Функция для страницы управления новостями
function loadNewsManagement() {
    const news = DataService.getData('news');
    const tableBody = document.querySelector('.admin-table tbody');
    
    if (tableBody) {
        tableBody.innerHTML = news.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>${new Date(item.date).toLocaleDateString('ru-RU')}</td>
                <td>${item.is_published ? '✅ Опубликовано' : '📝 Черновик'}</td>
                <td>
                    <button class="btn-small btn-edit" onclick="editNews(${item.id})">✏️</button>
                    <button class="btn-small btn-delete" onclick="deleteNews(${item.id})">🗑️</button>
                </td>
            </tr>
        `).join('');
    }
}

function editNews(id) {
    const news = DataService.getData('news').find(n => n.id === id);
    if (news) {
        // Заполняем форму редактирования
        showDataForm('news');
        // Здесь должен быть код для заполнения формы данными
    }
}

function deleteNews(id) {
    if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        DataService.deleteItem('news', id);
        loadNewsManagement();
        showNotification('Новость удалена', 'success');
    }
}