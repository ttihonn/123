// Логика управления данными в админ-панели
document.addEventListener('DOMContentLoaded', function() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }

    initDataManagement();
});

let currentDataType = 'traffic_fines';
let currentPage = 1;
const recordsPerPage = 10;

function initDataManagement() {
    loadDataTable();
    setupDataEventListeners();
}

function setupDataEventListeners() {
    // Изменение типа данных
    document.getElementById('dataTypeSelect').addEventListener('change', function(e) {
        currentDataType = e.target.value;
        currentPage = 1;
        loadDataTable();
    });
    
    // Пагинация
    document.getElementById('prevPage').addEventListener('click', prevPage);
    document.getElementById('nextPage').addEventListener('click', nextPage);
    
    // Обработка формы данных
    document.getElementById('dataForm').addEventListener('submit', handleDataSubmit);
    
    // Закрытие модального окна
    document.querySelector('#dataModal .close').addEventListener('click', closeDataModal);
}

function loadDataTable() {
    const data = DataService.getData(currentDataType);
    const tableHead = document.getElementById('dataTableHead');
    const tableBody = document.getElementById('dataTableBody');
    
    // Обновляем заголовок и описание
    updateTableInfo();
    
    // Генерируем заголовки таблицы
    if (data.length > 0) {
        const headers = Object.keys(data[0]).filter(key => 
            !['id', 'author_id'].includes(key) && 
            !key.includes('total_') && 
            !key.includes('public_')
        );
        
        tableHead.innerHTML = `
            <tr>
                ${headers.map(header => 
                    `<th>${getFieldLabel(header)}</th>`
                ).join('')}
                <th>Действия</th>
            </tr>
        `;
    }
    
    // Пагинация
    const totalPages = Math.ceil(data.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    // Заполняем таблицу данными
    tableBody.innerHTML = pageData.map(item => `
        <tr>
            ${Object.keys(item).filter(key => 
                !['id', 'author_id'].includes(key) && 
                !key.includes('total_') && 
                !key.includes('public_')
            ).map(key => {
                let value = item[key];
                if (key.includes('date')) {
                    value = new Date(value).toLocaleDateString('ru-RU');
                } else if (key.includes('amount') || key.includes('revenue')) {
                    value = new Intl.NumberFormat('ru-RU').format(value);
                }
                return `<td>${value}</td>`;
            }).join('')}
            <td>
                <button class="btn-small btn-edit" onclick="editDataItem(${item.id})" title="Редактировать">✏️</button>
                <button class="btn-small btn-delete" onclick="deleteDataItem(${item.id})" title="Удалить">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    // Обновляем пагинацию
    updatePagination(data.length, totalPages);
}

function updateTableInfo() {
    const titles = {
        'traffic_fines': 'Данные о штрафах',
        'tow_trucks': 'Данные об эвакуации',
        'traffic_lights': 'Реестр светофоров',
        'accidents': 'Данные о ДТП',
        'projects': 'Проекты ЦОДД'
    };
    
    const descriptions = {
        'traffic_fines': 'Управление статистикой дорожных штрафов',
        'tow_trucks': 'Управление данными об эвакуации транспорта',
        'traffic_lights': 'Реестр светофорных объектов и их состояний',
        'accidents': 'Статистика дорожно-транспортных происшествий',
        'projects': 'Управление проектами и их статусами'
    };
    
    document.getElementById('dataTableTitle').textContent = titles[currentDataType] || 'Данные';
    document.getElementById('dataTableDescription').textContent = descriptions[currentDataType] || 'Управление данными';
}

function getFieldLabel(fieldName) {
    const labels = {
        'date': 'Дата',
        'violations_count': 'Количество нарушений',
        'penalty_count': 'Количество штрафов',
        'public_amount': 'Сумма штрафов',
        'region': 'Регион',
        'trucks_count': 'Количество эвакуаторов',
        'trips_count': 'Количество рейсов',
        'towed_vehicles': 'Эвакуировано ТС',
        'public_revenue': 'Доход',
        'address': 'Адрес',
        'type': 'Тип',
        'installation_date': 'Дата установки',
        'status': 'Статус',
        'latitude': 'Широта',
        'longitude': 'Долгота',
        'incidents_count': 'Количество ДТП',
        'injured_count': 'Пострадавшие',
        'fatalities_count': 'Погибшие',
        'location': 'Местоположение',
        'name': 'Название',
        'description': 'Описание',
        'start_date': 'Дата начала',
        'end_date': 'Дата окончания',
        'public': 'Публичный'
    };
    
    return labels[fieldName] || fieldName;
}

function updatePagination(totalRecords, totalPages) {
    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('pageInfo').textContent = `Страница ${currentPage} из ${totalPages}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadDataTable();
    }
}

function nextPage() {
    const data = DataService.getData(currentDataType);
    const totalPages = Math.ceil(data.length / recordsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        loadDataTable();
    }
}

function showDataForm(itemId = null) {
    const modal = document.getElementById('dataModal');
    const form = document.getElementById('dataForm');
    const title = document.getElementById('dataModalTitle');
    const formFields = document.getElementById('formFields');
    
    if (itemId) {
        // Редактирование существующей записи
        title.textContent = 'Редактировать данные';
        const item = DataService.getData(currentDataType).find(d => d.id === itemId);
        if (item) {
            formFields.innerHTML = generateFormFields(item);
            form.dataset.editingId = itemId;
        }
    } else {
        // Создание новой записи
        title.textContent = 'Добавить данные';
        formFields.innerHTML = generateFormFields();
        delete form.dataset.editingId;
    }
    
    modal.style.display = 'block';
}

function generateFormFields(existingData = null) {
    const fieldConfigs = {
        'traffic_fines': [
            { name: 'date', label: 'Дата', type: 'date', required: true },
            { name: 'violations_count', label: 'Количество нарушений', type: 'number', required: true },
            { name: 'penalty_count', label: 'Количество штрафов', type: 'number', required: true },
            { name: 'public_amount', label: 'Сумма штрафов', type: 'number', step: '0.01', required: true },
            { name: 'region', label: 'Регион', type: 'text', required: true }
        ],
        'tow_trucks': [
            { name: 'date', label: 'Дата', type: 'date', required: true },
            { name: 'trucks_count', label: 'Количество эвакуаторов', type: 'number', required: true },
            { name: 'trips_count', label: 'Количество рейсов', type: 'number', required: true },
            { name: 'towed_vehicles', label: 'Эвакуировано ТС', type: 'number', required: true },
            { name: 'public_revenue', label: 'Доход', type: 'number', step: '0.01', required: true }
        ],
        'traffic_lights': [
            { name: 'address', label: 'Адрес', type: 'text', required: true },
            { name: 'type', label: 'Тип', type: 'select', options: ['пешеходный', 'транспортный', 'реверсивный'], required: true },
            { name: 'installation_date', label: 'Дата установки', type: 'date', required: true },
            { name: 'status', label: 'Статус', type: 'select', options: ['working', 'repairing', 'planned'], required: true },
            { name: 'latitude', label: 'Широта', type: 'number', step: '0.000001', required: true },
            { name: 'longitude', label: 'Долгота', type: 'number', step: '0.000001', required: true }
        ],
        'accidents': [
            { name: 'date', label: 'Дата', type: 'date', required: true },
            { name: 'incidents_count', label: 'Количество ДТП', type: 'number', required: true },
            { name: 'injured_count', label: 'Пострадавшие', type: 'number', required: true },
            { name: 'fatalities_count', label: 'Погибшие', type: 'number', required: true },
            { name: 'location', label: 'Местоположение', type: 'text', required: true }
        ],
        'projects': [
            { name: 'name', label: 'Название', type: 'text', required: true },
            { name: 'description', label: 'Описание', type: 'textarea', required: true },
            { name: 'start_date', label: 'Дата начала', type: 'date', required: true },
            { name: 'end_date', label: 'Дата окончания', type: 'date', required: true },
            { name: 'status', label: 'Статус', type: 'select', options: ['planned', 'in_progress', 'completed'], required: true },
            { name: 'public', label: 'Публичный проект', type: 'checkbox' }
        ]
    };
    
    const fields = fieldConfigs[currentDataType] || [];
    
    return fields.map(field => {
        let value = existingData ? existingData[field.name] : '';
        let fieldHTML = '';
        
        switch (field.type) {
            case 'select':
                fieldHTML = `
                    <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                        <option value="">Выберите...</option>
                        ${field.options.map(opt => 
                            `<option value="${opt}" ${value === opt ? 'selected' : ''}>${getFieldLabel(opt)}</option>`
                        ).join('')}
                    </select>
                `;
                break;
            case 'textarea':
                fieldHTML = `<textarea id="${field.name}" name="${field.name}" rows="4" ${field.required ? 'required' : ''}>${value || ''}</textarea>`;
                break;
            case 'checkbox':
                fieldHTML = `<input type="checkbox" id="${field.name}" name="${field.name}" ${value ? 'checked' : ''}>`;
                break;
            default:
                fieldHTML = `<input type="${field.type}" id="${field.name}" name="${field.name}" value="${value || ''}" ${field.required ? 'required' : ''} ${field.step ? `step="${field.step}"` : ''}>`;
        }
        
        return `
            <div class="form-group">
                <label for="${field.name}">${field.label}${field.required ? ' *' : ''}</label>
                ${fieldHTML}
            </div>
        `;
    }).join('');
}

function closeDataModal() {
    document.getElementById('dataModal').style.display = 'none';
    document.getElementById('dataForm').reset();
}

function handleDataSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (key === 'public') {
            data[key] = true;
        } else {
            data[key] = value;
        }
    }
    
    // Для checkbox, если не отмечен
    if (!formData.has('public')) {
        data['public'] = false;
    }
    
    try {
        if (event.target.dataset.editingId) {
            // Обновление существующей записи
            DataService.updateItem(currentDataType, parseInt(event.target.dataset.editingId), data);
            showNotification('Данные успешно обновлены', 'success');
        } else {
            // Создание новой записи
            DataService.addItem(currentDataType, data);
            showNotification('Данные успешно добавлены', 'success');
        }
        
        closeDataModal();
        loadDataTable();
    } catch (error) {
        showNotification('Ошибка при сохранении данных', 'error');
        console.error(error);
    }
}

function editDataItem(id) {
    showDataForm(id);
}

function deleteDataItem(id) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        DataService.deleteItem(currentDataType, id);
        showNotification('Запись удалена', 'success');
        loadDataTable();
    }
}

function exportData() {
    const data = DataService.getData(currentDataType);
    const headers = Object.keys(data[0] || {}).filter(key => 
        !key.includes('total_') && !key.includes('public_')
    );
    
    const csvContent = [
        headers.join(','),
        ...data.map(item => 
            headers.map(header => 
                `"${item[header] || ''}"`
            ).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDataType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Данные экспортированы в CSV', 'success');
}

// Закрытие модального окна при клике вне его
window.addEventListener('click', function(event) {
    const modal = document.getElementById('dataModal');
    if (event.target === modal) {
        closeDataModal();
    }
});