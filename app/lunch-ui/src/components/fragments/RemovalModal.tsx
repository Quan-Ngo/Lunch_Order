import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface RemovalItem {
    id: string;
    name: string;
    email?: string;
    image?: string;
}

interface RemovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void>;
    item: RemovalItem | null;
    variant?: 'default' | 'employee';
}

export function RemovalModal({ isOpen, onClose, onConfirm, item, variant = 'default' }: RemovalModalProps) {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    if (!isOpen || !item) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm(item.id);
            onClose();
        } catch (err) {
            console.error('Failed to delete item:', err);
            // alert(t('removalModal.deleteFailed'));
        } finally {
            setIsDeleting(false);
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleBackdropClick}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">

                {/* Header with Icon */}
                <div className="bg-red-50 p-6 flex gap-4 items-center border-b border-red-100">
                    <div className="flex-shrink-0 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-red-100">
                        <span className="material-icons-outlined text-red-500 text-2xl">warning</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 font-display leading-tight">
                            {variant === 'employee' ? t('removalModal.confirmDelete') : t('removalModal.title')}
                        </h3>
                        <p className="text-sm font-medium text-red-500 mt-0.5">
                            {t('removalModal.undoWarning')}
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6">
                    <p className="text-gray-500 font-medium leading-relaxed mb-6">
                        {variant === 'employee' ? t('removalModal.warning') : `${t('removalModal.bodyPrefix')} ${item.name}.`}
                    </p>

                    {/* Employee Card - only shows in employee variant */}
                    {variant === 'employee' && (
                        <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center gap-4 mb-8 border border-gray-200">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10 flex-shrink-0">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xl">{item.name.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate leading-tight text-base mb-1">{item.name}</p>
                                {item.email ? (
                                    <p className="text-sm text-gray-500 font-medium truncate">{item.email}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 font-medium italic">No email provided</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-row justify-center gap-4">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-8 py-2.5 rounded-xl font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {t('removalModal.cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-95 disabled:opacity-50"
                        >
                            {isDeleting ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-icons-outlined text-lg">delete</span>
                            )}
                            {isDeleting ? t('removalModal.confirming') : (variant === 'employee' ? t('removalModal.confirmDelete') : t('removalModal.confirm'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
