import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type StaffEntity } from '@/services/api';
import api from '@/services/api';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
    role: UserRole;
    name?: string;
    email?: string;
    displayName?: string;
    staff?: StaffEntity;
}

interface AuthContextType {
    currentUser: AuthUser | null;
    isLoadingUser: boolean;
    setCurrentUser: (user: AuthUser | null) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const loadAuthData = async () => {
            try {
                // 1. Fetch user role
                let role: UserRole = 'staff';
                try {
                    const roleRes = await api.get<{ value: string }>('/userInfo()');
                    const info = JSON.parse(roleRes.data.value);
                    role = info.role as UserRole;
                } catch (err) {
                    console.warn('[AuthContext] Failed to fetch userInfo, defaulting to staff:', err);
                }

                if (!isMounted) return;

                // 2. Fetch current user + matched staff profile (resolved server-side)
                let staff: StaffEntity | undefined;
                let resolvedName: string | undefined;
                let resolvedEmail: string | undefined;
                let resolvedDisplayName: string | undefined;
                try {
                    const response = await api.get<{
                        name: string;
                        email: string;
                        firstname: string;
                        lastname: string;
                        displayName: string;
                        scopes: string;
                        staff?: StaffEntity | null;
                    }>('/getCurrentUser()');
                    const userData = response.data;
                    resolvedName = userData.name;
                    resolvedEmail = userData.email;
                    resolvedDisplayName = userData.displayName;
                    staff = userData.staff ?? undefined;
                    if (!staff) {
                        console.warn('[Auth] No matching staff profile found for portal user:', userData);
                    }
                } catch (error) {
                    console.error('[Auth] Failed to resolve current user profile:', error);
                }

                if (!isMounted) return;

                if (staff || role === 'admin') {
                    setCurrentUser({
                        role,
                        name: resolvedName,
                        email: resolvedEmail,
                        displayName: resolvedDisplayName,
                        staff,
                    });
                } else {
                    console.warn('[Auth] Not admin and no staff profile, setting user to null');
                    setCurrentUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingUser(false);
                }
            }
        };

        void loadAuthData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, isLoadingUser, setCurrentUser, isLoading: isLoadingUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

