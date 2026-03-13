import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { employeeService, type StaffEntity } from '@/services/api';
import api from '@/services/api';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
    role: UserRole;
    staff?: StaffEntity;
}

interface PortalCurrentUser {
    firstname?: string;
    lastname?: string;
    name?: string;
    email?: string;
    displayName?: string;
}

interface AuthContextType {
    currentUser: AuthUser | null;
    isLoadingUser: boolean;
    setCurrentUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalize = (value?: string): string => value?.trim().toLowerCase() ?? '';

function buildPortalDisplayName(user: PortalCurrentUser): string {
    const fullName = `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim();
    return fullName || user.displayName || '';
}

function resolvePortalEmail(user: PortalCurrentUser): string {
    if (user.email) return user.email;
    if (user.name?.includes('@')) return user.name;
    return '';
}

function matchStaff(portalUser: PortalCurrentUser, staffList: StaffEntity[]): StaffEntity | undefined {
    const email = normalize(resolvePortalEmail(portalUser));
    const displayName = normalize(buildPortalDisplayName(portalUser));
    const principalName = normalize(portalUser.name);

    return staffList.find((staff) => {
        const staffEmail = normalize(staff.email);
        const staffName = normalize(staff.name);

        return (
            (!!email && staffEmail === email) ||
            (!!displayName && staffName === displayName) ||
            (!!principalName && staffName === principalName)
        );
    });
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;

        const loadCurrentUser = async () => {
            try {
                const response = await api.get<{ value: string }>('/getCurrentUser()');
                const portalUser = JSON.parse(response.data.value) as PortalCurrentUser;
                const staffList = await employeeService.getAll();
                const matchedStaff = matchStaff(portalUser, staffList);

                if (!isMounted) return;

                if (matchedStaff) {
                    setCurrentUser({ role: 'staff', staff: matchedStaff });
                } else {
                    console.warn('[Auth] No matching staff profile found for portal user:', portalUser);
                    setCurrentUser(null);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('[Auth] Failed to resolve current user:', error);
                setCurrentUser(null);
            } finally {
                if (isMounted) {
                    setIsLoadingUser(false);
                }
            }
        };

        void loadCurrentUser();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, isLoadingUser, setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
