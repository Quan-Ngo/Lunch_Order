import { useTranslation } from 'react-i18next';
import type { StaffCatalogEntity } from '@/services/api';

interface StaffListModalProps {
    isOpen: boolean;
    onClose: () => void;
    catalogName: string;
    staffOrders: StaffCatalogEntity[];
}

export function StaffListModal({ isOpen, onClose, catalogName, staffOrders }: StaffListModalProps) {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
            <div 
                className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-primary px-6 py-4 border-b-4 border-black flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2">
                        <span className="material-icons text-black">groups</span>
                        <h3 className="text-lg font-black uppercase tracking-tight font-display text-black">
                            {t('dailyOrders.orderedBy', 'Ordered By')}: {catalogName}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-black hover:opacity-70 transition-opacity">
                        <span className="material-icons">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                    <ul className="space-y-3">
                        {staffOrders.length === 0 ? (
                            <li className="text-gray-500 italic text-center py-8">
                                {t('dailyOrders.noStaffOrdered', 'No one has ordered this item yet.')}
                            </li>
                        ) : (
                            staffOrders.map((order, idx) => (
                                <li key={order.staff?.ID || idx} className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-black transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden group-hover:bg-primary/20 transition-colors">
                                        {order.staff?.name ? order.staff.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{order.staff?.name || 'Unknown Staff'}</p>
                                        <p className="text-xs text-gray-500 truncate">{order.staff?.email || 'No email provided'}</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-gray-200 rounded-md text-gray-500">
                                            {t('dailyOrders.staffBadge', 'Staff')}
                                        </span>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-2 bg-white border-2 border-black font-bold rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                    >
                        {t('common.close', 'Close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
