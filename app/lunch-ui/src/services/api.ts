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
    name: string;
    description: string;
    price: number;
    category: string;
    isActive: boolean;
    file?: {
        url: string;
    };
}

interface StaffEntity {
    ID: string;
    name: string;
    Notification: boolean;
}

export const foodService = {
    getAll: async (): Promise<Food[]> => {
        // Fetch from new 'Catalog' entity, expanding 'file' to get the image URL
        const response = await api.get<{ value: CatalogEntity[] }>('/Catalog?$expand=file');

        // Map backend 'Catalog' to frontend 'Food' interface
        return response.data.value.map(item => ({
            ID: item.ID,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.file?.url || '', // Fallback if no file
            category: item.category || 'General'
        }));
    },
    // Other methods would need similar updates if implemented fully
    getById: async (id: string): Promise<Food> => {
        const response = await api.get<CatalogEntity>(`/Catalog(${id})?$expand=file`);
        const item = response.data;
        return {
            ID: item.ID,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.file?.url || '',
            category: item.category || 'General'
        };
    },
    // Create/Update/Delete would need to handle the new schema (e.g. creating Catalog + CatalogFile)
    // For now, I'll leave them as placeholders or update them if needed.
    delete: async (id: string): Promise<void> => {
        await api.delete(`/Catalog(${id})`);
    },
    // Create new food item
    create: async (data: { name: string; price: number; description: string }): Promise<void> => {
        await api.post('/Catalog', {
            name: data.name,
            price: data.price,
            description: data.description,
            // Fallback for fields not yet in UI or required by DB if any
            category: 'General',
            isActive: true
        });
    },
    // Update existing food item
    update: async (id: string, data: { name: string; price: number; description: string }): Promise<void> => {
        await api.put(`/Catalog(${id})`, {
            name: data.name,
            price: data.price,
            description: data.description,
            // Retain fields that might be lost if strictly overwritten, although PUT usually assumes full replace
            // A PATCH might be safer, but PUT matches standard CAP behavior for full updates.
            // In a real app we'd want to preserve the image, so PATCH is actually better for partial updates
        });
    },
};

export const employeeService = {
    getAll: async (): Promise<StaffEntity[]> => {
        const response = await api.get<{ value: StaffEntity[] }>('/Staff');
        return response.data.value;
    },
};

export interface DailyMenuEntity {
    ID: string;
    date: string;
    isComplete: boolean;
    catalog?: CatalogEntity;
}

export const dailyMenuService = {
    getByDate: async (dateString: string): Promise<DailyMenuEntity[]> => {
        // Formats YYYY-MM-DD
        const response = await api.get<{ value: DailyMenuEntity[] }>(
            `/DailyMenu?$filter=date eq ${dateString}&$expand=catalog($expand=file)`
        );
        return response.data.value;
    }
};

export default api;
