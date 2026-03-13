import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'odata/v4/lunch',
});

// ─────────────────────────────────────────────
// CSRF Token Handling (required by SAP Approuter)
// ─────────────────────────────────────────────
let csrfToken: string | null = null;

const fetchCsrfToken = async (): Promise<string> => {
    try {
        const response = await api.head('/', {
            headers: {
                'x-csrf-token': 'fetch',
                'x-requested-with': 'XMLHttpRequest'
            }
        });
        return response.headers['x-csrf-token'] || '';
    } catch (err) {
        console.warn('[CSRF] Fetch failed, returning empty string:', err);
        return '';
    }
};

api.interceptors.request.use(async (config) => {
    const mutatingMethods: string[] = ['post', 'put', 'patch', 'delete'];
    if (mutatingMethods.includes(config.method || '')) {
        if (!csrfToken) {
            try {
                csrfToken = await fetchCsrfToken();
            } catch (err) {
                console.warn('[CSRF] Failed to fetch token, proceeding without it:', err);
            }
        }
        if (csrfToken) {
            config.headers['x-csrf-token'] = csrfToken;
        }
    }
    return config;
});

// If a request fails with 403, the token may have expired — refetch and retry once
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 403 &&
            !originalRequest._csrfRetry
        ) {
            originalRequest._csrfRetry = true;
            try {
                csrfToken = await fetchCsrfToken();
                originalRequest.headers['x-csrf-token'] = csrfToken;
                return api(originalRequest);
            } catch (retryErr) {
                return Promise.reject(retryErr);
            }
        }
        return Promise.reject(error);
    }
);

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
        ID: string;
        url: string;
    };
}

export interface StaffEntity {
    ID: string;
    name: string;
    email?: string;
    notification: boolean;
    status: boolean;
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
    toggleActive: async (id: string, isActive: boolean): Promise<void> => {
        await api.patch(`/Catalog(${id})`, { isActive });
    },
    uploadImage: async (catalogId: string, file: File): Promise<void> => {
        // Step 1: Delete existing CatalogFile for this catalog item if any
        try {
            const existing = await api.get<{ value: { ID: string }[] }>(`/CatalogFile?$filter=catalog_ID eq ${catalogId}`);
            for (const f of existing.data.value) {
                await api.delete(`/CatalogFile(${f.ID})`);
            }
        } catch {
            // Ignore if no existing file
        }
        // Step 2: Create metadata record
        const response = await api.post('/CatalogFile', {
            catalog_ID: catalogId,
            mediaType: file.type,
            url: '',
        });
        const fileId = response.data.ID;
        // Step 3: PUT binary content
        await api.put(`/CatalogFile(${fileId})/content`, file, {
            headers: { 'Content-Type': file.type },
        });
        // Step 4: Persist the content URL into the url field so $expand=file returns it
        const contentUrl = `/odata/v4/lunch/CatalogFile(${fileId})/content`;
        await api.patch(`/CatalogFile(${fileId})`, { url: contentUrl });
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
    setStatus: async (id: string, status: boolean): Promise<void> => {
        await api.patch(`/Staff(${id})`, { status });
    },
    create: async (name: string, email?: string): Promise<void> => {
        await api.post('/Staff', { name, email: email || '', status: true, notification: true });
    },
    update: async (id: string, data: { name: string; status: boolean; notification: boolean }): Promise<void> => {
        await api.patch(`/Staff(${id})`, data);
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(`/Staff(${id})`);
    },
};

// ─────────────────────────────────────────────
// DailyMenu Service
// ─────────────────────────────────────────────
export interface DailyMenuEntity {
    ID: string;
    date: string;
    isComplete: boolean;
    catalogs?: Array<CatalogEntity & { file?: { url: string } }>;
    note?: string;
}

export const dailyMenuService = {
    /** Get all menu items for a given date */
    getByDate: async (dateString: string): Promise<DailyMenuEntity[]> => {
        const response = await api.get<{ value: DailyMenuEntity[] }>(
            `/DailyMenu?$filter=date eq '${dateString}'&$expand=catalogs($expand=file)`
        );
        return response.data.value;
    },

    /** Add a food item to a day's menu */
    addFoodToDate: async (dateString: string, catalogId: string): Promise<void> => {
        const response = await api.get<{ value: DailyMenuEntity[] }>(
            `/DailyMenu?$filter=date eq '${dateString}'`
        );
        let menuId = response.data.value[0]?.ID;

        if (!menuId) {
            const createRes = await api.post('/DailyMenu', { date: dateString, isComplete: false });
            menuId = createRes.data.ID;
        }

        await api.patch(`/Catalog(${catalogId})`, { dailyMenu_ID: menuId });
    },

    /** Remove a food item from a day's menu */
    removeFoodFromDate: async (catalogId: string): Promise<void> => {
        await api.patch(`/Catalog(${catalogId})`, { dailyMenu_ID: null });
    },

    /** Update note on a daily menu entry */
    updateNote: async (id: string, note: string): Promise<void> => {
        await api.patch(`/DailyMenu(${id})`, { note });
    },

    /** Create a note-only daily menu entry */
    createNote: async (dateString: string, note: string): Promise<void> => {
        await api.post('/DailyMenu', { date: dateString, note, isComplete: false });
    },

    /** Confirm menu: marks complete AND sends email notifications to eligible staff */
    markCompleteByDate: async (dateString: string): Promise<void> => {
        await api.post('/confirmMenu', { date: dateString });
    },

    /** Check if any entry for a date is marked complete */
    isDateComplete: async (dateString: string): Promise<boolean> => {
        const response = await api.get<{ value: DailyMenuEntity[] }>(
            `/DailyMenu?$filter=date eq '${dateString}'`
        );
        return response.data.value.some((e) => e.isComplete === true);
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

    /** Get all orders for a catalog item on a specific date */
    getByCatalogAndDate: async (catalogId: string, date: string): Promise<StaffCatalogEntity[]> => {
        const filter = `Catalog_ID eq '${catalogId}' and date eq '${date}'`;
        const response = await api.get<{ value: StaffCatalogEntity[] }>(
            `/StaffCatalog?$filter=${encodeURIComponent(filter)}`
        );
        return response.data.value;
    },

    /**
     * Clear all selections for a catalog item on a date.
     * Catalog_ID is part of the key, so "set to null" is represented by deleting those rows.
     */
    clearCatalogSelectionsByDate: async (catalogId: string, date: string): Promise<void> => {
        const orders = await staffCatalogService.getByCatalogAndDate(catalogId, date);
        await Promise.all(
            orders.map((order) => staffCatalogService.deleteOrder(order.Staff_ID, order.Catalog_ID, date))
        );
    },
};

// ─────────────────────────────────────────────
// DailyOrderBill Service
// ─────────────────────────────────────────────
export interface DailyOrderBillEntity {
    ID: string;
    date: string;
    fileName: string;
    mediaType: string;
}

export const billService = {
    /** Get all bills for a specific date */
    getByDate: async (dateString: string): Promise<DailyOrderBillEntity[]> => {
        const response = await api.get<{ value: DailyOrderBillEntity[] }>(
            `/DailyOrderBill?$filter=date eq '${dateString}'`
        );
        return response.data.value;
    },

    /** Upload a bill file (two-step: create record, then PUT content) */
    upload: async (dateString: string, file: File): Promise<void> => {
        // Step 1: Create the metadata record
        const response = await api.post('/DailyOrderBill', {
            date: dateString,
            fileName: file.name,
            mediaType: file.type,
        });
        const billId = response.data.ID;

        // Step 2: PUT the binary content directly
        await api.put(`/DailyOrderBill(${billId})/content`, file, {
            headers: {
                'Content-Type': file.type,
            },
        });
    },

    /** Delete a bill */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/DailyOrderBill(${id})`);
    },

    /** Get content URL for displaying a bill */
    getContentUrl: (id: string): string => {
        return `/odata/v4/lunch/DailyOrderBill(${id})/content`;
    },
};

export default api;

export interface ScimUser {
    id: string;
    userName: string;
    name?: {
        givenName?: string;
        familyName?: string;
        formatted?: string;
    };
    emails?: { value: string; primary?: boolean }[];
    active: boolean;
}

export interface ScimUsersResponse {
    totalResults: number;
    Resources: ScimUser[];
}

export const scimService = {
    /** 
     * Fetch users securely via CAP backend.
     * This avoids CORS issues on the frontend and keeps credentials secure on the backend.
     */
    fetchBtpUsers: async (): Promise<ScimUser[]> => {
        try {
            // Call the custom OData function on the backend
            const response = await api.get<{ value: string }>('/getBtpUsers()');

            // OData functions return the result in a 'value' property
            const dataStr = response.data.value;
            if (!dataStr) return [];

            // Backend returns a JSON string, so we parse it
            const parsedData = JSON.parse(dataStr);

            console.log('DEBUG: scimService.fetchBtpUsers from backend:', parsedData);

            // Handle different possible response structures from SCIM/Identity API
            if (Array.isArray(parsedData)) return parsedData;
            if (parsedData.Resources && Array.isArray(parsedData.Resources)) return parsedData.Resources;
            if (parsedData.resources && Array.isArray(parsedData.resources)) return parsedData.resources;
            if (parsedData.value && Array.isArray(parsedData.value)) return parsedData.value;

            return [];
        } catch (error: any) {
            console.error('fetchBtpUsers failed:', error.response?.status, error.response?.data || error.message);
            throw error;
        }
    },
};


