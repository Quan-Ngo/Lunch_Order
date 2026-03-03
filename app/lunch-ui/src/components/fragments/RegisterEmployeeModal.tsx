import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';
import { SearchBar } from '@/components/elements/SearchBar';
import { LoadingState } from '@/components/elements/LoadingState';
import { scimService, type ScimUser, employeeService } from '@/services/api';

interface RegisterEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    existingEmployeeNames: string[];
}

export function RegisterEmployeeModal({ isOpen, onClose, onSuccess, existingEmployeeNames }: RegisterEmployeeModalProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<ScimUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addingUserIds, setAddingUserIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            void fetchUsers();
        } else {
            setSearchTerm('');
            setError(null);
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await scimService.fetchBtpUsers();
            console.log('SCIM users fetched:', data);
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch BTP users:', err);
            setError(t('employees.registerModal.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayName = (user: ScimUser) =>
        user.name?.formatted ||
        `${user.name?.givenName || ''} ${user.name?.familyName || ''}`.trim() ||
        user.userName;

    const filteredUsers = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        return users.filter(user => {
            const displayName = getDisplayName(user);
            const email = user.emails?.[0]?.value || user.userName;
            return displayName.toLowerCase().includes(query) ||
                email.toLowerCase().includes(query) ||
                user.userName.toLowerCase().includes(query);
        });
    }, [users, searchTerm]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleAddUser = async (user: ScimUser) => {
        const displayName = getDisplayName(user);
        setAddingUserIds(prev => new Set(prev).add(user.id));
        try {
            await employeeService.create(displayName);
            onSuccess();
        } catch (err) {
            console.error('Failed to register employee:', err);
        } finally {
            setAddingUserIds(prev => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
                onClick={handleBackdropClick}
            >
                <div className="fixed inset-0 bg-black/60 transition-opacity" aria-hidden="true" />

                <div className="relative inline-block w-full sm:max-w-lg sm:my-8 align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all border border-gray-100">

                    {/* Header */}
                    <div className="bg-primary px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-extrabold text-black font-display uppercase tracking-tight">
                            {t('employees.registerModal.title')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-black/60 hover:text-black transition-colors"
                        >
                            <span className="material-icons-outlined text-2xl">close</span>
                        </button>
                    </div>

                    {/* Search Area */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder={t('employees.registerModal.searchPlaceholder')}
                            className="w-full"
                        />
                    </div>

                    {/* Content List */}
                    <div className="max-h-[400px] min-h-[300px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-12">
                                <LoadingState />
                            </div>
                        ) : error ? (
                            <div className="px-6 py-12 text-center">
                                <span className="material-icons-outlined text-red-500 text-5xl mb-3">error_outline</span>
                                <p className="text-gray-600 font-medium">{error}</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-4"
                                    onClick={fetchUsers}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500 font-medium">
                                <span className="material-icons-outlined text-4xl mb-2">search_off</span>
                                <p>{t('employees.registerModal.noUsers')}</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    const displayName = getDisplayName(user);
                                    const isAlreadyRegistered = existingEmployeeNames.includes(displayName);
                                    const isAdding = addingUserIds.has(user.id);

                                    return (
                                        <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10">
                                                    {displayName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 leading-tight">{displayName}</p>
                                                    <p className="text-sm text-gray-500 font-medium">{user.emails?.[0]?.value || user.userName}</p>
                                                </div>
                                            </div>

                                            <Button
                                                variant={isAlreadyRegistered ? "secondary" : "primary"}
                                                size="sm"
                                                disabled={isAlreadyRegistered || isAdding}
                                                onClick={() => handleAddUser(user)}
                                                className="min-w-[120px]"
                                            >
                                                {isAdding ? t('employees.registerModal.adding') :
                                                    isAlreadyRegistered ? t('employees.registerModal.alreadyRegistered') :
                                                        t('employees.registerModal.add')}
                                            </Button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium font-display">
                            Can't find who you're looking for? Invite by email
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
