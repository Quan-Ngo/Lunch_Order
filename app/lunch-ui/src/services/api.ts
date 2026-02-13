import axios from 'axios';

const api = axios.create({
    baseURL: '/odata/v4/lunch',
});

// Interface used by the UI (keeps the display consistent)
export interface Food {
    ID: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
}

// Interface from the backend (matches new CDS model)
interface CatalogEntity {
    ID: string;
    Name: string;
    Description: string;
    Price: number;
    Category: string;
    isActive: boolean;
    file?: {
        url: string;
    };
}

interface StaffEntity {
    ID: string;
    Name: string;
    Notification: boolean;
}

export const foodService = {
    getAll: async (): Promise<Food[]> => {
        // Fetch from new 'Catalog' entity, expanding 'file' to get the image URL
        const response = await api.get<{ value: CatalogEntity[] }>('/Catalog?$expand=file');

        // Map backend 'Catalog' to frontend 'Food' interface
        return response.data.value.map(item => ({
            ID: item.ID,
            name: item.Name,
            description: item.Description || '',
            price: item.Price,
            image: item.file?.url || '', // Fallback if no file
            category: item.Category || 'General'
        }));
    },
    // Other methods would need similar updates if implemented fully
    getById: async (id: string): Promise<Food> => {
        const response = await api.get<CatalogEntity>(`/Catalog(${id})?$expand=file`);
        const item = response.data;
        return {
            ID: item.ID,
            name: item.Name,
            description: item.Description || '',
            price: item.Price,
            image: item.file?.url || '',
            category: item.Category || 'General'
        };
    },
    // Create/Update/Delete would need to handle the new schema (e.g. creating Catalog + CatalogFile)
    // For now, I'll leave them as placeholders or update them if needed.
    delete: async (id: string): Promise<void> => {
        await api.delete(`/Catalog(${id})`);
    },
};

export const employeeService = {
    getAll: async (): Promise<StaffEntity[]> => {
        const response = await api.get<{ value: StaffEntity[] }>('/Staff');
        return response.data.value;
    },
};

export default api;
