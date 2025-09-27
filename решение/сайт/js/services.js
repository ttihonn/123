// Логика для страницы услуг
document.addEventListener('DOMContentLoaded', function() {
    initServicesPage();

    function initServicesPage() {
        setupEventListeners();
        loadServices();
    }

    function loadServices() {
        const services = DataService.getData('services').filter(s => s.is_public);
        // Можно использовать для динамического отображения услуг, если нужно
    }

    function setupEventListeners() {
        // Обработка модального окна
        const modal = document.getElementById('serviceModal');
        const closeBtn = modal.querySelector('.close');

        closeBtn.addEventListener('click', closeModal);
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Обработка отправки формы
        document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
    }

    window.openServiceModal = function(serviceType) {
        const modal = document.getElementById('serviceModal');
        const modalTitle = document.getElementById('modalTitle');
        const additionalFields = document.getElementById('additionalFields');

        // Устанавливаем заголовок в зависимости от типа услуги
        const titles = {
            'parking': 'Заявление на парковочное разрешение',
            'appeal': 'Жалоба на штраф',
            'traffic-light': 'Заявка на установку светофора'
        };

        modalTitle.textContent = titles[serviceType] || 'Заявление на услугу';

        // Генерируем дополнительные поля в зависимости от типа услуги
        additionalFields.innerHTML = generateAdditionalFields(serviceType);

        modal.style.display = 'block';
        document.getElementById('serviceForm').dataset.serviceType = serviceType;
    }

    function generateAdditionalFields(serviceType) {
        const fields = {
            'parking': `
                <div class="form-group">
                    <label for="carNumber">Государственный номер автомобиля *</label>
                    <input type="text" id="carNumber" required>
                </div>
                <div class="form-group">
                    <label for="address">Адрес проживания *</label>
                    <input type="text" id="address" required>
                </div>
                <div class="form-group">
                    <label for="documents">Прикрепить документы (PDF, JPG)</label>
                    <input type="file" id="documents" multiple accept=".pdf,.jpg,.jpeg,.png">
                </div>
            `,
            'appeal': `
                <div class="form-group">
                    <label for="fineNumber">Номер постановления *</label>
                    <input type="text" id="fineNumber" required>
                </div>
                <div class="form-group">
                    <label for="fineDate">Дата нарушения *</label>
                    <input type="date" id="fineDate" required>
                </div>
                <div class="form-group">
                    <label for="explanation">Объяснение обстоятельств *</label>
                    <textarea id="explanation" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="evidence">Доказательства (фото, видео)</label>
                    <input type="file" id="evidence" multiple accept=".pdf,.jpg,.jpeg,.png,.mp4">
                </div>
            `,
            'traffic-light': `
                <div class="form-group">
                    <label for="location">Местоположение предлагаемого светофора *</label>
                    <input type="text" id="location" required>
                </div>
                <div class="form-group">
                    <label for="reason">Обоснование необходимости *</label>
                    <textarea id="reason" rows="3" required></textarea>
                </div>
                <div class="form-group">
                    <label for="photos">Фотографии места</label>
                    <input type="file" id="photos" multiple accept=".jpg,.jpeg,.png">
                </div>
            `
        };

        return fields[serviceType] || '';
    }

    function handleServiceSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const serviceType = e.target.dataset.serviceType;

        // Собираем данные формы
        const application = {
            type: serviceType,
            name: formData.get('applicantName'),
            email: formData.get('applicantEmail'),
            phone: formData.get('applicantPhone'),
            message: formData.get('message'),
            date: new Date().toISOString(),
            status: 'new'
        };

        // Добавляем дополнительные поля в зависимости от типа услуги
        const additionalData = {};
        const additionalFields = e.target.querySelectorAll('#additionalFields input, #additionalFields textarea, #additionalFields select');
        additionalFields.forEach(field => {
            if (field.type === 'file') {
                // Обработка файлов (в реальном приложении - загрузка на сервер)
                if (field.files.length > 0) {
                    additionalData[field.id] = Array.from(field.files).map(file => file.name);
                }
            } else {
                additionalData[field.id] = field.value;
            }
        });

        application.additionalData = additionalData;

        // Сохраняем заявление (в реальном приложении - отправка на сервер)
        const applications = JSON.parse(localStorage.getItem('serviceApplications') || '[]');
        applications.push({ ...application, id: Date.now() });
        localStorage.setItem('serviceApplications', JSON.stringify(applications));

        // Показываем уведомление
        showNotification('Ваше заявление успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        
        // Закрываем модальное окно и очищаем форму
        closeModal();
        e.target.reset();
    }

    function closeModal() {
        document.getElementById('serviceModal').style.display = 'none';
    }

    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 1rem;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
});