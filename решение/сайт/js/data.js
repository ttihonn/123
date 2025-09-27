// Мок-данные для инициализации
const mockData = {
    users: [
        {
            id: 1,
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            username: 'editor',
            password: 'editor123',
            role: 'editor',
            created_at: new Date().toISOString()
        }
    ],
    
    traffic_fines: [
        {
            id: 1,
            date: '2024-01-15',
            violations_count: 245,
            penalty_count: 198,
            total_amount: 1250000,
            public_amount: 894000,
            region: 'Смоленск'
        }
    ],
    
    tow_trucks: [
        {
            id: 1,
            date: '2024-01-15',
            trucks_count: 12,
            trips_count: 45,
            towed_vehicles: 38,
            revenue: 456000,
            public_revenue: 342000
        }
    ],
    
    traffic_lights: [
        {
            id: 1,
            address: 'ул. Ленина, 15',
            type: 'пешеходный',
            installation_date: '2023-05-10',
            status: 'working',
            latitude: 54.782635,
            longitude: 32.045251
        }
    ],
    
    accidents: [
        {
            id: 1,
            date: '2024-01-15',
            incidents_count: 8,
            injured_count: 3,
            fatalities_count: 0,
            location: 'пр-т Гагарина'
        }
    ],
    
    projects: [
        {
            id: 1,
            name: 'Модернизация светофоров в центре города',
            description: 'Установка интеллектуальных светофорных объектов',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            status: 'in_progress',
            public: true
        }
    ],
    
    news: [
        {
            id: 1,
            title: 'Внедрение новой системы фотовидеофиксации',
            content: 'ЦОДД запускает современную систему контроля дорожного движения...',
            date: '2024-01-15T10:00:00',
            image_url: '/images/news1.jpg',
            is_published: true,
            author_id: 1
        }
    ],
    
    services: [
        {
            id: 1,
            name: 'Оформление парковочного разрешения',
            description: 'Получение резидентского парковочного места',
            price: 0,
            is_public: true
        }
    ]
};

// Инициализация данных в localStorage
function initializeData() {
    for (const [key, value] of Object.entries(mockData)) {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }
}

// Функции для работы с данными
class DataService {
    static getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    static setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    static addItem(key, item) {
        const data = this.getData(key);
        const newItem = {
            ...item,
            id: Date.now() // Простой способ генерации ID
        };
        data.push(newItem);
        this.setData(key, data);
        return newItem;
    }

    static updateItem(key, id, updates) {
        const data = this.getData(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.setData(key, data);
            return data[index];
        }
        return null;
    }

    static deleteItem(key, id) {
        const data = this.getData(key);
        const filteredData = data.filter(item => item.id !== id);
        this.setData(key, filteredData);
        return filteredData;
    }
}

// Аутентификация
class AuthService {
    static login(username, password) {
        const users = DataService.getData('users');
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    }

    static logout() {
        localStorage.removeItem('currentUser');
    }

    static getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    static isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    static hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
});