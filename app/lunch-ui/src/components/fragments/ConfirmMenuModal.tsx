import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

interface ConfirmMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (opens: string, closes: string) => void;
    isPending?: boolean;
}

export function ConfirmMenuModal({ isOpen, onClose, onConfirm, isPending }: ConfirmMenuModalProps) {
    const { t } = useTranslation();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [orderOpens, setOrderOpens] = useState(`${today}T09:00`);
    const [orderCloses, setOrderCloses] = useState(`${today}T11:00`);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!orderOpens || !orderCloses) {
            toast.error(t('manageMenu.missingDates', { defaultValue: 'Please fill in both dates.' }));
            return;
        }

        const openDate = new Date(orderOpens);
        const closeDate = new Date(orderCloses);

        if (openDate >= closeDate) {
            toast.error(t('manageMenu.invalidDates', { defaultValue: 'Order opens date must be before closes date.' }));
            return;
        }

        // Pass directly without timezone interference, API takes string, we format as ISO
        onConfirm(openDate.toISOString(), closeDate.toISOString());
    };

    return (
        <div aria-labelledby="confirm-menu-title" aria-modal="true" className="fixed inset-0 z-[100] overflow-y-auto" role="dialog">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                <div aria-hidden="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
                <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full border-2 border-gray-300 rounded-xl">
                    <div className="bg-primary border-b-2 border-gray-200 p-6">
                        <h3 className="text-3xl font-black text-black uppercase italic tracking-tighter" id="confirm-menu-title">
                            Confirm Menu
                        </h3>
                    </div>
                    <div className="px-8 py-8 space-y-8 bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-black text-black dark:text-white mb-2 uppercase tracking-wider" htmlFor="order-opens">
                                    Order Opens
                                </label>
                                <input
                                    className="block w-full border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm py-3 px-4 font-bold bg-white dark:bg-gray-700 dark:text-white"
                                    id="order-opens"
                                    type="datetime-local"
                                    value={orderOpens}
                                    onChange={(e) => setOrderOpens(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-black dark:text-white mb-2 uppercase tracking-wider" htmlFor="order-closes">
                                    Order Closes
                                </label>
                                <input
                                    className="block w-full border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm py-3 px-4 font-bold bg-white dark:bg-gray-700 dark:text-white"
                                    id="order-closes"
                                    type="datetime-local"
                                    value={orderCloses}
                                    onChange={(e) => setOrderCloses(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 items-start p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-primary rounded-lg">
                            <span className="material-icons-outlined text-yellow-600 dark:text-yellow-400">info</span>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                Employees will receive a notification when the order opens.
                            </p>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4 border-t-2 border-gray-200">
                        <button
                            className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-black uppercase tracking-widest border-2 border-black rounded-lg shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            onClick={handleConfirm}
                            disabled={isPending}
                        >
                            {isPending ? 'Confirming...' : 'Confirm'}
                        </button>
                        <button
                            className="w-full sm:w-auto px-8 py-4 bg-transparent text-black dark:text-white font-black uppercase tracking-widest border-2 border-gray-400 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
