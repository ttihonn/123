// Логика для страницы проектов
document.addEventListener('DOMContentLoaded', function() {
    initProjectsPage();
});

function initProjectsPage() {
    loadProjects();
    setupEventListeners();
}

function loadProjects() {
    const projects = DataService.getData('projects').filter(p => p.public);
    displayProjects(projects);
}

function displayProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p class="no-projects">На данный момент нет активных проектов.</p>';
        return;
    }

    projectsList.innerHTML = projects.map(project => {
        const progress = calculateProgress(project);
        const statusText = getStatusText(project.status);
        
        return `
            <div class="project-card" data-status="${project.status}">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <span class="project-status ${project.status}">${statusText}</span>
                </div>
                <div class="project-dates">
                    <span>Начало: ${new Date(project.start_date).toLocaleDateString('ru-RU')}</span>
                    <span>Завершение: ${new Date(project.end_date).toLocaleDateString('ru-RU')}</span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span>${progress}%</span>
                </div>
                <div class="project-timeline">
                    <div class="timeline-item ${progress >= 0 ? 'active' : ''}">
                        <span class="timeline-dot"></span>
                        <span class="timeline-label">Планирование</span>
                    </div>
                    <div class="timeline-item ${progress >= 50 ? 'active' : ''}">
                        <span class="timeline-dot"></span>
                        <span class="timeline-label">Реализация</span>
                    </div>
                    <div class="timeline-item ${progress >= 100 ? 'active' : ''}">
                        <span class="timeline-dot"></span>
                        <span class="timeline-label">Завершение</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusText(status) {
    const statusMap = {
        'planned': 'Запланирован',
        'in_progress': 'В процессе',
        'completed': 'Завершен'
    };
    return statusMap[status] || status;
}

function calculateProgress(project) {
    if (project.status === 'completed') return 100;
    if (project.status === 'planned') return 0;
    
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const now = new Date();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / totalDuration) * 100);
}

function setupEventListeners() {
    // Фильтрация проектов
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterProjects(filter);
        });
    });
}

function filterProjects(filter) {
    const projects = DataService.getData('projects').filter(p => p.public);
    let filteredProjects = projects;

    if (filter !== 'all') {
        filteredProjects = projects.filter(project => project.status === filter);
    }

    displayProjects(filteredProjects);
}