import { createContext, useContext, useState, type ReactNode } from 'react';
import { type StaffEntity } from '@/services/api';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
    role: UserRole;
    staff?: StaffEntity; // populated when role === 'staff'
}

interface AuthContextType {
    currentUser: AuthUser | null;
    setCurrentUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    return (
        <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
