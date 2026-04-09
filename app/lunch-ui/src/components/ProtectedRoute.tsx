import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { currentUser, isLoadingUser } = useAuth();

    if (isLoadingUser) {
        return null;
    }

    const userRole: UserRole = currentUser?.role ?? 'staff';

    if (!allowedRoles.includes(userRole)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
