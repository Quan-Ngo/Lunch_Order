import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';
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
                            {t('employees.editModal.title')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-black/60 hover:text-black transition-colors"
                        >
                            <span className="material-icons-outlined text-2xl">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1 uppercase">
                                {t('employees.editModal.fieldName')}
                            </label>
                            <input
                                type="text"
                                placeholder={t('employees.editModal.fieldNamePlaceholder')}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (error) setError(false);
                                }}
                                className={`block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 font-medium bg-white ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                                    }`}
                            />
                            {error && (
                                <p className="mt-1 text-xs text-red-500 font-bold">
                                    {t('employees.editModal.fieldNameError')}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 uppercase">
                                    {t('employees.editModal.fieldStatus')}
                                </label>
                                <button
                                    onClick={() => setStatus(!status)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${status ? 'bg-green-500' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${status ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 uppercase">
                                    {t('employees.editModal.fieldNotification')}
                                </label>
                                <button
                                    onClick={() => setNotification(!notification)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${notification ? 'bg-primary' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notification ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row-reverse gap-3 border-t border-gray-100">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {isSaving ? t('common.saving') : t('employees.editModal.saveChanges')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSaving}
                            className="w-full sm:w-auto"
                        >
                            {t('employees.editModal.cancel')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
