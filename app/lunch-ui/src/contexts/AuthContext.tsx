import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type StaffEntity } from '@/services/api';
import api from '@/services/api';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
    role: UserRole;
    staff?: StaffEntity; // populated when role === 'staff'
}

interface AuthContextType {
    currentUser: AuthUser | null;
    setCurrentUser: (user: AuthUser | null) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        api.get<{ value: string }>('/userInfo()')
            .then((res) => {
                const info = JSON.parse(res.data.value);
                setCurrentUser({ role: info.role as UserRole });
            })
            .catch((err) => {
                console.warn('[AuthContext] Failed to fetch userInfo, defaulting to staff:', err);
                setCurrentUser({ role: 'staff' });
            })
            .finally(() => setIsLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
