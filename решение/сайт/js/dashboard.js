// Логика для страницы аналитики
document.addEventListener('DOMContentLoaded', function() {
    let currentCharts = {};
    let currentFilters = {
        period: 30,
        dataType: 'all'
    };

    // Инициализация дашборда
    function initDashboard() {
        loadMetrics();
        setupEventListeners();
        loadTableData();
        renderTrafficLightsMap();
    }

    // Загрузка и отображение метрик
    function loadMetrics() {
        const accidentsData = DataService.getData('accidents');
        const finesData = DataService.getData('traffic_fines');
        const towingData = DataService.getData('tow_trucks');
        const trafficLightsData = DataService.getData('traffic_lights');

        // Обновление числовых значений
        updateMetric('accidentsCount', accidentsData.length, 'accidentsChange');
        updateMetric('finesCount', 
            finesData.reduce((sum, item) => sum + item.violations_count, 0), 
            'finesChange'
        );
        updateMetric('towingCount', 
            towingData.reduce((sum, item) => sum + item.towed_vehicles, 0), 
            'towingChange'
        );
        updateMetric('trafficLightsCount', 
            trafficLightsData.filter(tl => tl.status === 'working').length, 
            'trafficLightsChange'
        );

        // Построение графиков
        renderCharts(accidentsData, finesData, towingData, trafficLightsData);
    }

    // Обновление отдельной метрики
    function updateMetric(metricId, value, changeId) {
        const metricElement = document.getElementById(metricId);
        const changeElement = document.getElementById(changeId);

        if (metricElement) {
            animateValue(metricElement, 0, value, 1000);
        }

        // Расчет изменения (в реальном приложении нужно сравнивать с предыдущим периодом)
        const change = Math.random() > 0.5 ? Math.random() * 20 : -Math.random() * 10;
        if (changeElement) {
            changeElement.textContent = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
            changeElement.className = `metric-change ${change > 0 ? 'positive' : 'negative'}`;
        }
    }

    // Анимация числовых значений
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Построение графиков с использованием Chart.js
    function renderCharts(accidentsData, finesData, towingData, trafficLightsData) {
        // Уничтожаем предыдущие графики
        Object.values(currentCharts).forEach(chart => chart.destroy());
        currentCharts = {};

        // График ДТП
        const accidentsCtx = document.getElementById('accidentsChart').getContext('2d');
        currentCharts.accidents = new Chart(accidentsCtx, {
            type: 'line',
            data: {
                labels: accidentsData.map(a => new Date(a.date).toLocaleDateString('ru-RU')),
                datasets: [{
                    label: 'Количество ДТП',
                    data: accidentsData.map(a => a.incidents_count),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // График штрафов
        const finesCtx = document.getElementById('finesChart').getContext('2d');
        currentCharts.fines = new Chart(finesCtx, {
            type: 'bar',
            data: {
                labels: finesData.map(f => new Date(f.date).toLocaleDateString('ru-RU')),
                datasets: [{
                    label: 'Количество нарушений',
                    data: finesData.map(f => f.violations_count),
                    backgroundColor: '#3498db'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // График эвакуаций
        const towingCtx = document.getElementById('towingChart').getContext('2d');
        currentCharts.towing = new Chart(towingCtx, {
            type: 'bar',
            data: {
                labels: towingData.map(t => new Date(t.date).toLocaleDateString('ru-RU')),
                datasets: [{
                    label: 'Эвакуировано ТС',
                    data: towingData.map(t => t.towed_vehicles),
                    backgroundColor: '#f39c12'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Круговой график для светофоров
        const statusCount = {
            working: trafficLightsData.filter(tl => tl.status === 'working').length,
            repairing: trafficLightsData.filter(tl => tl.status === 'repairing').length,
            planned: trafficLightsData.filter(tl => tl.status === 'planned').length
        };

        const trafficLightsCtx = document.getElementById('trafficLightsChart').getContext('2d');
        currentCharts.trafficLights = new Chart(trafficLightsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Работают', 'В ремонте', 'Запланированы'],
                datasets: [{
                    data: [statusCount.working, statusCount.repairing, statusCount.planned],
                    backgroundColor: ['#62a744', '#ff9800', '#2196f3']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Загрузка данных в таблицу
    function loadTableData() {
        const tableBody = document.querySelector('#dataTable tbody');
        const accidentsData = DataService.getData('accidents');
        const finesData = DataService.getData('traffic_fines');
        const towingData = DataService.getData('tow_trucks');

        // Объединяем данные по датам
        const allDates = [...new Set([
            ...accidentsData.map(a => a.date),
            ...finesData.map(f => f.date),
            ...towingData.map(t => t.date)
        ])].sort().reverse().slice(0, 10); // Последние 10 дат

        tableBody.innerHTML = allDates.map(date => {
            const accident = accidentsData.find(a => a.date === date) || { incidents_count: 0, injured_count: 0, fatalities_count: 0 };
            const fine = finesData.find(f => f.date === date) || { violations_count: 0 };
            const towing = towingData.find(t => t.date === date) || { towed_vehicles: 0 };

            return `
                <tr>
                    <td>${new Date(date).toLocaleDateString('ru-RU')}</td>
                    <td>${accident.incidents_count}</td>
                    <td>${accident.injured_count}</td>
                    <td>${accident.fatalities_count}</td>
                    <td>${fine.violations_count}</td>
                    <td>${towing.towed_vehicles}</td>
                </tr>
            `;
        }).join('');
    }

    // Визуализация карты светофоров (упрощенная)
    function renderTrafficLightsMap() {
        const trafficLights = DataService.getData('traffic_lights');
        const mapContainer = document.getElementById('trafficMap');
        
        // В реальном приложении здесь была бы интеграция с картами (Яндекс.Карты/Google Maps)
        const mapContent = `
            <div class="map-simulation">
                <h4>Дорожная инфраструктура Смоленска</h4>
                <div class="traffic-lights-list">
                    ${trafficLights.map(tl => `
                        <div class="traffic-light-item ${tl.status}">
                            <span class="status-indicator"></span>
                            <div class="traffic-light-info">
                                <strong>${tl.address}</strong>
                                <span>Тип: ${tl.type}</span>
                                <span>Статус: ${getStatusText(tl.status)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        mapContainer.innerHTML = mapContent;
    }

    function getStatusText(status) {
        const statusMap = {
            'working': 'Работает',
            'repairing': 'В ремонте',
            'planned': 'Запланирован'
        };
        return statusMap[status] || status;
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        document.getElementById('applyFilters').addEventListener('click', function() {
            currentFilters.period = parseInt(document.getElementById('period').value);
            currentFilters.dataType = document.getElementById('dataType').value;
            loadMetrics();
            loadTableData();
        });

        document.getElementById('exportData').addEventListener('click', function() {
            exportToCSV();
        });
    }

    // Экспорт данных в CSV
    function exportToCSV() {
        const accidentsData = DataService.getData('accidents');
        const headers = ['Дата', 'ДТП', 'Пострадавшие', 'Погибшие', 'Нарушения', 'Эвакуации'];
        const csvContent = [
            headers.join(','),
            ...accidentsData.map(item => [
                item.date,
                item.incidents_count,
                item.injured_count,
                item.fatalities_count,
                '0', // Здесь нужно добавить данные о нарушениях
                '0'  // И эвакуациях
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codd-statistics.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Инициализация дашборда при загрузке страницы
    if (document.querySelector('.dashboard-main')) {
        initDashboard();
    }
});