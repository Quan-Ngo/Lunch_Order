import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type StaffEntity } from '@/services/api';

interface EditEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, data: { name: string; status: boolean; notification: boolean }) => Promise<void>;
    employee: StaffEntity | null;
}

export function EditEmployeeModal({ isOpen, onClose, onSave, employee }: EditEmployeeModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState<string>('');
    const [status, setStatus] = useState<boolean>(true);
    const [notification, setNotification] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && employee) {
            setName(employee.name || '');
            setStatus(employee.status);
            setNotification(employee.notification);
            setError(false);
        }
    }, [isOpen, employee]);

    if (!isOpen || !employee) return null;

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(true);
            return;
        }

        setIsSaving(true);
        try {
            await onSave(employee.ID, { name, status, notification });
            onClose();
        } catch (err) {
            console.error('Failed to update employee:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transform transition-all overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b-2 border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-black dark:text-white font-display">
                        {t('employees.editModal.title')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <span className="material-icons-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-2 uppercase tracking-wide">
                            {t('employees.editModal.fieldName')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons-outlined text-lg">person</span>
                            <input
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-primary transition-colors font-medium outline-none ${error ? 'border-red-500' : 'border-gray-200 dark:border-zinc-700'
                                    }`}
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (error) setError(false);
                                }}
                                placeholder={t('employees.editModal.fieldNamePlaceholder')}
                            />
                        </div>
                        {error && (
                            <p className="mt-1 text-xs text-red-500 font-bold pl-1">
                                {t('employees.editModal.fieldNameError')}
                            </p>
                        )}
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-bold text-black dark:text-white mb-2 uppercase tracking-wide">
                            {t('employees.editModal.fieldStatus')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons-outlined text-lg">toggle_on</span>
                            <select
                                className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-primary transition-colors font-medium appearance-none cursor-pointer outline-none"
                                value={status ? 'active' : 'inactive'}
                                onChange={(e) => setStatus(e.target.value === 'active')}
                            >
                                <option value="active">{t('employees.status.active') || 'Active'}</option>
                                <option value="inactive">{t('employees.status.inactive') || 'Inactive'}</option>
                            </select>
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons-outlined pointer-events-none">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Footer - Large Yellow Button */}
                <div className="p-6 pt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="w-full py-4 bg-primary text-black font-bold text-lg rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:translate-y-1 hover:shadow-none transition-all duration-200 uppercase tracking-wide active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {isSaving ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                {t('common.saving')}
                            </span>
                        ) : t('employees.editModal.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
}
