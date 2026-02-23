import { useState } from 'react';
import { Button } from '../elements/Button';

export interface RemovalItem {
    id: string;
    name: string;
    image?: string;
}

interface RemovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (id: string) => Promise<void>;
    item: RemovalItem | null;
    contextText?: string;
}

export function RemovalModal({ isOpen, onClose, onConfirm, item, contextText }: RemovalModalProps) {
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    if (!isOpen || !item) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm(item.id);
            onClose();
        } catch (err) {
            console.error('Failed to delete item:', err);
            alert('Failed to delete item. Check console for details.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all border border-slate-200">
                {/* Hero Image */}
                <div className="h-40 w-full relative">
                    {item.image ? (
                        <img
                            alt={`${item.name} to remove`}
                            className="w-full h-full object-cover"
                            src={item.image}
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="material-icons-outlined text-gray-400 text-5xl">restaurant</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-80" />
                </div>

                {/* Body */}
                <div className="px-6 pb-6 pt-2 text-center">
                    {/* Floating Delete Icon */}
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4 -mt-10 relative z-10 border-4 border-white">
                        <span className="material-symbols-outlined text-3xl">delete_outline</span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">Remove Item?</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        This will remove{' '}
                        <span className="font-semibold text-slate-700">{item.name}</span>
                        {contextText && (
                            <span className="font-medium"> {contextText}</span>
                        )}
                        .
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="danger"
                            fullWidth
                            onClick={handleConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Removing...' : 'Confirm Remove'}
                        </Button>
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={onClose}
                            disabled={isDeleting}
                            className="text-slate-500 hover:text-slate-800"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
