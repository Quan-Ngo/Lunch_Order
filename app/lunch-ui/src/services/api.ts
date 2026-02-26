import axios from 'axios';

const api = axios.create({
    baseURL: '/odata/v4/lunch',
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

// Interface used by the UI (keeps the display consistent)
export interface Food {
    ID: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    isActive: boolean;
}

// Interface from the backend (matches CDS model)
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

export interface StaffEntity {
    ID: string;
    name: string;
    notification: boolean;
}

// ─────────────────────────────────────────────
// Food / Catalog Service
// ─────────────────────────────────────────────
export const foodService = {
    getAll: async (): Promise<Food[]> => {
        const response = await api.get<{ value: CatalogEntity[] }>('/Catalog?$expand=file');
        return response.data.value.map(item => ({
            ID: item.ID,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.file?.url || '',
            category: item.category || 'General',
            isActive: item.isActive,
        }));
    },
    getById: async (id: string): Promise<Food> => {
        const response = await api.get<CatalogEntity>(`/Catalog(${id})?$expand=file`);
        const item = response.data;
        return {
            ID: item.ID,
            name: item.name,
            description: item.description || '',
            price: item.price,
            image: item.file?.url || '',
            category: item.category || 'General',
            isActive: item.isActive,
        };
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/Catalog(${id})`);
    },
    create: async (data: { name: string; price: number; description: string }): Promise<void> => {
        await api.post('/Catalog', {
            name: data.name,
            price: data.price,
            description: data.description,
            category: 'General',
            isActive: true,
        });
    },
    update: async (id: string, data: { name: string; price: number; description: string }): Promise<void> => {
        await api.put(`/Catalog(${id})`, {
            name: data.name,
            price: data.price,
            description: data.description,
        });
    },
};

// ─────────────────────────────────────────────
// Employee / Staff Service
// ─────────────────────────────────────────────
export const employeeService = {
    getAll: async (): Promise<StaffEntity[]> => {
        const response = await api.get<{ value: StaffEntity[] }>('/Staff');
        return response.data.value;
    },
};

// ─────────────────────────────────────────────
// DailyMenu Service
// ─────────────────────────────────────────────
export interface DailyMenuEntity {
    ID: string;
    date: string;
    isComplete: boolean;
    catalog?: CatalogEntity & { file?: { url: string } };
    catalog_ID?: string;
    note?: string;
}

export const dailyMenuService = {
    /** Get all menu items for a given date */
    getByDate: async (dateString: string): Promise<DailyMenuEntity[]> => {
        const response = await api.get<{ value: DailyMenuEntity[] }>(
            `/DailyMenu?$filter=date eq '${dateString}'&$expand=catalog($expand=file)`
        );
        return response.data.value;
    },

    /** Add a food item to a day's menu */
    addFoodToDate: async (dateString: string, catalogId: string): Promise<void> => {
        await api.post('/DailyMenu', {
            date: dateString,
            catalog_ID: catalogId,
            isComplete: false,
        });
    },

    /** Remove a food item from a day's menu */
    removeFoodFromDate: async (dailyMenuId: string): Promise<void> => {
        await api.delete(`/DailyMenu(${dailyMenuId})`);
    },

    /** Update note on a daily menu entry */
    updateNote: async (id: string, note: string): Promise<void> => {
        await api.patch(`/DailyMenu(${id})`, { note });
    },

    /** Create a note-only daily menu entry */
    createNote: async (dateString: string, note: string): Promise<void> => {
        await api.post('/DailyMenu', { date: dateString, note, isComplete: false });
    },
};

// ─────────────────────────────────────────────
// Statistics Services
// ─────────────────────────────────────────────
export interface DailyCatalogStatistics {
    OrderDate: string;
    CatalogID: string;
    CatalogName: string;
    CatalogPrice: number;
    CatalogDescription: string;
    OrderCount: number;
    SubTotal: number;
}

export const statisticsService = {
    getByDate: async (dateString: string): Promise<DailyCatalogStatistics[]> => {
        const response = await api.get<{ value: DailyCatalogStatistics[] }>(
            `/DailyCatalogStatistics?$filter=OrderDate eq '${dateString}'`
        );
        return response.data.value;
    },
};

export interface DailyOrderSummary {
    OrderDate: string;
    TotalOrders: number;
    TotalAmount: number;
}

export const summaryService = {
    getByDate: async (dateString: string): Promise<DailyOrderSummary | null> => {
        const response = await api.get<{ value: DailyOrderSummary[] }>(
            `/DailyOrderSummary?$filter=OrderDate eq '${dateString}'`
        );
        return response.data.value[0] || null;
    },
};

// ─────────────────────────────────────────────
// StaffCatalog / Order Service
// ─────────────────────────────────────────────
export interface StaffCatalogEntity {
    Staff_ID: string;
    Catalog_ID: string;
    date: string; // YYYY-MM-DD
    staff?: StaffEntity;
    catalog?: {
        ID: string;
        name: string;
        description: string;
        price: number;
        category: string;
        isActive: boolean;
        file?: { url: string };
    };
}

export const staffCatalogService = {
    /** Get today's order for a given staff member */
    getForStaffAndDate: async (staffId: string, date: string): Promise<StaffCatalogEntity | null> => {
        const filter = `Staff_ID eq ${staffId} and date eq '${date}'`;
        const response = await api.get<{ value: StaffCatalogEntity[] }>(
            `/StaffCatalog?$filter=${encodeURIComponent(filter)}&$expand=catalog($expand=file)`
        );
        return response.data.value[0] ?? null;
    },

    /** Create a new order */
    createOrder: async (staffId: string, catalogId: string, date: string): Promise<void> => {
        await api.post('/StaffCatalog', {
            Staff_ID: staffId,
            Catalog_ID: catalogId,
            date: date,
        });
    },

    /** Delete an order (composite key: Staff_ID + Catalog_ID + date) */
    deleteOrder: async (staffId: string, catalogId: string, date: string): Promise<void> => {
        await api.delete(
            `/StaffCatalog(Staff_ID=${staffId},Catalog_ID=${catalogId},date='${date}')`
        );
    },
};

export default api;

