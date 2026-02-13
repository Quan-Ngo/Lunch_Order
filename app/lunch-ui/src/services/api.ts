import axios from 'axios';

const api = axios.create({
    baseURL: '/odata/v4/lunch',
});

export interface Food {
    ID: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

export interface Employee {
    ID: string;
    name: string;
    email: string;
    department: string;
}

export const foodService = {
    getAll: async (): Promise<Food[]> => {
        const response = await api.get('/Food');
        return response.data.value;
    },
    getById: async (id: string): Promise<Food> => {
        const response = await api.get(`/Food(${id})`);
        return response.data;
    },
    create: async (food: Omit<Food, 'ID'>): Promise<Food> => {
        const response = await api.post('/Food', food);
        return response.data;
    },
    update: async (id: string, food: Partial<Food>): Promise<Food> => {
        const response = await api.patch(`/Food(${id})`, food);
        return response.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/Food(${id})`);
    },
};

export const employeeService = {
    getAll: async (): Promise<Employee[]> => {
        const response = await api.get('/Employees');
        return response.data.value;
    },
};

export default api;
