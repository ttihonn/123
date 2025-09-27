// Инициализация карты ДТП Смоленской области
document.addEventListener('DOMContentLoaded', function() {
    // Координаты центра Смоленской области
    const smolenskCenter = [54.7826, 32.0453];
    
    // Инициализация карты
    const map = L.map('accidentsMap').setView(smolenskCenter, 10);
    
    // Добавление слоя карты
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Создание кластеризации маркеров
    const markersCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true
    });
    
    // Данные по районам Смоленской области
    const districts = [
        { id: 1, name: "Смоленск", center: [54.7826, 32.0453], bounds: [[54.75, 31.95], [54.82, 32.15]] },
        { id: 2, name: "Вяземский", center: [55.2110, 34.2951], bounds: [[55.18, 34.25], [55.24, 34.35]] },
        { id: 3, name: "Рославльский", center: [53.9500, 32.8500], bounds: [[53.92, 32.80], [53.98, 32.90]] },
        { id: 4, name: "Сафоновский", center: [55.1000, 33.2500], bounds: [[55.07, 33.20], [55.13, 33.30]] },
        { id: 5, name: "Ярцевский", center: [55.0667, 32.6833], bounds: [[55.03, 32.63], [55.10, 32.73]] },
        { id: 6, name: "Гагаринский", center: [55.5500, 35.0000], bounds: [[55.52, 34.95], [55.58, 35.05]] },
        { id: 7, name: "Дорогобужский", center: [54.9167, 33.3167], bounds: [[54.88, 33.26], [54.95, 33.36]] },
        { id: 8, name: "Ельнинский", center: [54.5667, 33.1667], bounds: [[54.53, 33.11], [54.60, 33.21]] }
    ];
    
    // Генерация фиктивных данных о ДТП
    function generateAccidentData() {
        const accidents = [];
        const severityTypes = ['fatal', 'injured', 'property'];
        const severityLabels = {
            'fatal': 'С погибшими',
            'injured': 'С пострадавшими', 
            'property': 'Материальный ущерб'
        };
        
        districts.forEach(district => {
            // Генерация 5-15 ДТП для каждого района
            const accidentCount = Math.floor(Math.random() * 10) + 5;
            
            for (let i = 0; i < accidentCount; i++) {
                // Случайное смещение от центра района
                const latOffset = (Math.random() - 0.5) * 0.1;
                const lngOffset = (Math.random() - 0.5) * 0.1;
                
                const severity = severityTypes[Math.floor(Math.random() * severityTypes.length)];
                
                accidents.push({
                    id: `${district.id}-${i}`,
                    district: district.name,
                    lat: district.center[0] + latOffset,
                    lng: district.center[1] + lngOffset,
                    severity: severity,
                    severityLabel: severityLabels[severity],
                    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    vehicles: Math.floor(Math.random() * 3) + 1,
                    participants: Math.floor(Math.random() * 5) + 1,
                    description: `ДТП в ${district.name} районе`
                });
            }
        });
        
        return accidents;
    }
    
    let accidentData = generateAccidentData();
    
    // Функция для отображения ДТП на карте
    function displayAccidentsOnMap(accidents) {
        // Очистка предыдущих маркеров
        markersCluster.clearLayers();
        
        accidents.forEach(accident => {
            // Определение цвета маркера в зависимости от тяжести ДТП
            let markerColor;
            switch(accident.severity) {
                case 'fatal':
                    markerColor = 'red';
                    break;
                case 'injured':
                    markerColor = 'orange';
                    break;
                case 'property':
                    markerColor = 'blue';
                    break;
                default:
                    markerColor = 'gray';
            }
            
            // Создание иконки маркера
            const accidentIcon = L.divIcon({
                className: `accident-marker severity-${accident.severity}`,
                html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            
            // Создание маркера
            const marker = L.marker([accident.lat, accident.lng], { icon: accidentIcon });
            
            // Добавление всплывающей подсказки
            marker.bindPopup(`
                <div class="accident-popup">
                    <h4>ДТП в ${accident.district} районе</h4>
                    <p><strong>Тяжесть:</strong> ${accident.severityLabel}</p>
                    <p><strong>Дата:</strong> ${accident.date.toLocaleDateString()}</p>
                    <p><strong>Участников:</strong> ${accident.participants}</p>
                    <p><strong>Транспортных средств:</strong> ${accident.vehicles}</p>
                </div>
            `);
            
            // Добавление маркера в кластер
            markersCluster.addLayer(marker);
        });
        
        // Добавление кластера на карту
        map.addLayer(markersCluster);
    }
    
    // Инициализация отображения ДТП
    displayAccidentsOnMap(accidentData);
    
    // Заполнение списка районов
    const districtsList = document.getElementById('districtsList');
    districts.forEach(district => {
        const districtItem = document.createElement('div');
        districtItem.className = 'district-item';
        districtItem.textContent = district.name;
        districtItem.dataset.districtId = district.id;
        
        districtItem.addEventListener('click', function() {
            // Удаление активного класса у всех элементов
            document.querySelectorAll('.district-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Добавление активного класса к выбранному элементу
            this.classList.add('active');
            
            // Центрирование карты на выбранном районе
            map.setView(district.center, 12);
            
            // Обновление статистики по району
            updateDistrictStats(district.id);
        });
        
        districtsList.appendChild(districtItem);
    });
    
    // Функция обновления статистики по району
    function updateDistrictStats(districtId) {
        const district = districts.find(d => d.id === districtId);
        const districtAccidents = accidentData.filter(a => a.district === district.name);
        
        const fatalCount = districtAccidents.filter(a => a.severity === 'fatal').length;
        const injuredCount = districtAccidents.filter(a => a.severity === 'injured').length;
        const propertyCount = districtAccidents.filter(a => a.severity === 'property').length;
        const totalCount = districtAccidents.length;
        
        // Расчет изменений по сравнению с предыдущим периодом
        const change = Math.floor(Math.random() * 20) - 10;
        const changeClass = change >= 0 ? 'negative' : 'positive';
        const changeSymbol = change >= 0 ? '+' : '';
        
        const statsHTML = `
            <div class="stat-item">
                <span>Всего ДТП:</span>
                <span class="stat-value">${totalCount}</span>
            </div>
            <div class="stat-item">
                <span>С погибшими:</span>
                <span class="stat-value">${fatalCount}</span>
            </div>
            <div class="stat-item">
                <span>С пострадавшими:</span>
                <span class="stat-value">${injuredCount}</span>
            </div>
            <div class="stat-item">
                <span>Материальный ущерб:</span>
                <span class="stat-value">${propertyCount}</span>
            </div>
            <div class="stat-item">
                <span>Изменение за период:</span>
                <span class="stat-value ${changeClass}">${changeSymbol}${change}%</span>
            </div>
        `;
        
        document.getElementById('districtStats').innerHTML = statsHTML;
    }
    
    // Заполнение топа аварийных участков
    function updateTopAccidents() {
        // Группировка ДТП по районам для определения самых аварийных
        const districtStats = {};
        
        accidentData.forEach(accident => {
            if (!districtStats[accident.district]) {
                districtStats[accident.district] = 0;
            }
            districtStats[accident.district]++;
        });
        
        // Сортировка районов по количеству ДТП
        const sortedDistricts = Object.entries(districtStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        const topAccidentsHTML = sortedDistricts.map(([district, count], index) => {
            const severityClass = count > 15 ? 'severity-fatal' : 
                                count > 10 ? 'severity-injured' : 'severity-property';
            
            return `
                <div class="accident-item">
                    <span class="accident-severity ${severityClass}">${index + 1}</span>
                    <strong>${district}</strong>
                    <span style="float: right;">${count} ДТП</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('topAccidents').innerHTML = topAccidentsHTML;
    }
    
    updateTopAccidents();
    
    // Обработчики для фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Удаление активного класса у всех кнопок в группе
            const parent = this.parentElement;
            parent.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            
            // Добавление активного класса к нажатой кнопке
            this.classList.add('active');
            
            // Применение фильтров
            applyFilters();
        });
    });
    
    // Функция применения фильтров
    function applyFilters() {
        const period = document.querySelector('.filter-btn[data-period].active').dataset.period;
        const type = document.querySelector('.filter-btn[data-type].active').dataset.type;
        
        // Фильтрация данных (в реальном приложении здесь был бы запрос к API)
        let filteredData = [...accidentData];
        
        // Фильтрация по типу ДТП
        if (type !== 'all') {
            filteredData = filteredData.filter(accident => accident.severity === type);
        }
        
        // Фильтрация по периоду (упрощенная имитация)
        if (period === 'week') {
            // Оставляем только ДТП за последнюю неделю
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            filteredData = filteredData.filter(accident => accident.date > weekAgo);
        } else if (period === 'month') {
            // Оставляем только ДТП за последний месяц
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filteredData = filteredData.filter(accident => accident.date > monthAgo);
        }
        // Для квартала и года оставляем все данные в демо-версии
        
        // Обновление отображения на карте
        displayAccidentsOnMap(filteredData);
        
        // Обновление топа аварийных участков
        updateTopAccidents();
    }
    
    // Обработчик кнопки обновления данных
    document.getElementById('refreshMapData').addEventListener('click', function() {
        // Показ индикатора загрузки
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
        this.disabled = true;
        
        // Имитация загрузки новых данных
        setTimeout(() => {
            // Генерация новых данных
            accidentData = generateAccidentData();
            
            // Применение текущих фильтров к новым данным
            applyFilters();
            
            // Восстановление кнопки
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Обновить данные';
            this.disabled = false;
            
            // Показать уведомление об успешном обновлении
            showNotification('Данные успешно обновлены', 'success');
        }, 1500);
    });
    
    // Функция показа уведомлений
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 4px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Добавление стилей для анимации уведомлений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Адаптация карты при изменении размера окна
    window.addEventListener('resize', function() {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    });
});
// Управление легендой интенсивности ДТП
document.getElementById('legendToggle').addEventListener('click', function() {
    const legend = document.getElementById('mapLegend');
    const icon = this.querySelector('i');
    
    legend.classList.toggle('collapsed');
    
    if (legend.classList.contains('collapsed')) {
        icon.className = 'fas fa-chevron-down';
        this.title = 'Развернуть легенду';
    } else {
        icon.className = 'fas fa-chevron-up';
        this.title = 'Свернуть легенду';
    }
});

// Автоматическое скрытие легенды при бездействии
let legendTimeout;
function resetLegendTimeout() {
    clearTimeout(legendTimeout);
    const legend = document.getElementById('mapLegend');
    legend.classList.remove('collapsed');
    
    legendTimeout = setTimeout(() => {
        if (!legend.matches(':hover')) {
            legend.classList.add('collapsed');
            document.getElementById('legendToggle').querySelector('i').className = 'fas fa-chevron-down';
        }
    }, 5000); // Скрыть через 5 секунд бездействия
}

// Сброс таймера при взаимодействии с картой
map.on('mousemove click zoomstart', resetLegendTimeout);

// Показ легенды при наведении
document.getElementById('mapLegend').addEventListener('mouseenter', function() {
    clearTimeout(legendTimeout);
    this.classList.remove('collapsed');
});

// Инициализация таймера
resetLegendTimeout();