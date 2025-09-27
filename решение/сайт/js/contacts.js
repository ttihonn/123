// js/contacts.js
document.addEventListener('DOMContentLoaded', function() {
    initContactsPage();
});

function initContactsPage() {
    setupEventListeners();
    initFormValidation();
    setupThemeToggle();
}

function setupEventListeners() {
    // Обработка формы обратной связи
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFeedbackSubmit();
        });
    }

    // Обработка файлов
    const fileInput = document.getElementById('attachment');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Инициализация мобильного меню
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
}

function initFormValidation() {
    const form = document.getElementById('feedbackForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.getAttribute('name');
    
    clearFieldError(field);
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Это поле обязательно для заполнения');
        return false;
    }
    
    switch(fieldName) {
        case 'email':
            if (!isValidEmail(value)) {
                showFieldError(field, 'Введите корректный email адрес');
                return false;
            }
            break;
        case 'phone':
            if (value && !isValidPhone(value)) {
                showFieldError(field, 'Введите корректный номер телефона');
                return false;
            }
            break;
        case 'message':
            if (value.length < 10) {
                showFieldError(field, 'Сообщение должно содержать не менее 10 символов');
                return false;
            }
            break;
    }
    
    return true;
}

function showFieldError(field, message) {
    field.style.borderColor = 'var(--accent-color)';
    
    let errorElement = field.parentNode.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.cssText = `
        color: var(--accent-color);
        font-size: 0.8rem;
        margin-top: 0.25rem;
    `;
}

function clearFieldError(field) {
    field.style.borderColor = '';
    
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^(\+7|8)[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function handleFileSelect(event) {
    const files = event.target.files;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    for (let file of files) {
        if (file.size > maxSize) {
            showNotification(`Файл "${file.name}" превышает максимальный размер 10MB`, 'error');
            event.target.value = '';
            return;
        }
        
        if (!allowedTypes.includes(file.type)) {
            showNotification(`Файл "${file.name}" имеет недопустимый формат`, 'error');
            event.target.value = '';
            return;
        }
    }
    
    if (files.length > 0) {
        showNotification(`Добавлено файлов: ${files.length}`, 'success');
    }
}

function handleFeedbackSubmit() {
    const form = document.getElementById('feedbackForm');
    const formData = new FormData(form);
    
    // Валидация всех полей
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    
    // Имитация отправки на сервер
    setTimeout(() => {
        const feedback = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone') || 'Не указан',
            subject: formData.get('subject'),
            message: formData.get('message'),
            date: new Date().toLocaleString('ru-RU'),
            attachments: []
        };
        
        // Обработка файлов
        const fileInput = document.getElementById('attachment');
        if (fileInput.files.length > 0) {
            feedback.attachments = Array.from(fileInput.files).map(file => ({
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type
            }));
        }
        
        // Сохраняем в localStorage (в реальном приложении здесь был бы AJAX запрос)
        const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
        feedbacks.push({ ...feedback, id: Date.now(), status: 'new' });
        localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
        
        // Показываем уведомление об успехе
        showNotification('Ваше сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.', 'success');
        
        // Очищаем форму
        form.reset();
        
        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Показываем сводку
        showFeedbackSummary(feedback);
        
    }, 2000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showFeedbackSummary(feedback) {
    console.log('Отправленное обращение:', feedback);
    // Здесь можно добавить дополнительную логику, например, отправку на email
}

function showNotification(message, type = 'info') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
    
    // Закрытие по клику
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
}

function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    nav.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const icon = this.querySelector('i');
            if (document.body.classList.contains('dark-theme')) {
                icon.className = 'fas fa-sun';
                localStorage.setItem('theme', 'dark');
            } else {
                icon.className = 'fas fa-moon';
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Восстанавливаем тему из localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }
}