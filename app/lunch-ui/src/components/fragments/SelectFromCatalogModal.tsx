import { useState, useEffect } from 'react';
import { Button } from '@/components/elements/Button';
import { FoodModal, type FoodFormData } from '@/components/fragments/FoodModal';
import { useFormatters } from '@/hooks/useFormatters';
import { foodService, type Food } from '@/services/api';
import { useTranslation } from 'react-i18next';

// ─── Props ──────────────────────────────────────────────────────────────────────

interface SelectFromCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: (selectedFoods: Food[]) => void;
    /** IDs of catalog items already on the day's menu */
    existingCatalogIds: string[];
}

// ─── Component ──────────────────────────────────────────────────────────────────

export function SelectFromCatalogModal({
    isOpen,
    onClose,
    onAccept,
    existingCatalogIds,
}: SelectFromCatalogModalProps) {
    const { t } = useTranslation();
    const { formatPriceLabel } = useFormatters();
    const [catalogItems, setCatalogItems] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('All');

    // Fetch active catalog items when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setSearchTerm('');
            setSelectedIds(new Set());
            foodService
                .getAll()
                .then((items) => setCatalogItems(items.filter((f) => f.isActive)))
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // ─── Derived Data ───────────────────────────────────────────────────────────

    const categories = ['All', ...Array.from(new Set(catalogItems.map((f) => f.category)))];

    const filteredItems = catalogItems.filter((food) => {
        const matchesSearch =
            !searchTerm ||
            food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            food.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'All' || food.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const alreadyOnMenu = new Set(existingCatalogIds);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const toggleItem = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleAccept = () => {
        const newItems = catalogItems.filter(
            (f) => selectedIds.has(f.ID) && !alreadyOnMenu.has(f.ID)
        );
        onAccept(newItems);
    };

    const handleAddNewFood = async (data: FoodFormData) => {
        try {
            await foodService.create({
                name: data.name,
                price: parseFloat(data.price),
                currency: data.currency,
                description: data.description,
            });
            const items = await foodService.getAll();
            setCatalogItems(items.filter((f) => f.isActive));
            setIsFoodModalOpen(false);
        } catch (err) {
            console.error('Failed to add food to catalog:', err);
            alert(t('selectCatalogModal.addFailed'));
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isFoodModalOpen) {
            onClose();
        }
    };

    const newSelectionsCount = Array.from(selectedIds).filter((id) => !alreadyOnMenu.has(id)).length;

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <div
                className="fixed inset-0 z-50 overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="select-catalog-title"
            >
                <div
                    className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
                    onClick={handleBackdropClick}
                >
                    <div className="fixed inset-0 bg-black/60 transition-opacity" aria-hidden="true" />

                    {/* Modal panel */}
                    <div className="relative inline-block w-full sm:max-w-xl sm:my-8 align-bottom sm:align-middle bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all border-2 border-black">
                        {/* Header */}
                        <div className="bg-primary border-b-2 border-black p-5">
                            <div className="flex justify-between items-center">
                                <h3
                                    id="select-catalog-title"
                                    className="text-xl font-extrabold text-black uppercase tracking-tight font-display"
                                >
                                    {t('selectCatalogModal.title')}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-black/60 hover:text-black transition-colors"
                                    aria-label={t('selectCatalogModal.closeAriaLabel')}
                                >
                                    <span className="material-icons-outlined text-2xl">close</span>
                                </button>
                            </div>

                            {/* Search bar */}
                            <div className="mt-3 relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder={t('selectCatalogModal.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border-2 border-black rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                />
                            </div>
                        </div>

                        {/* Category tabs */}
                        {categories.length > 1 && (
                            <div className="flex gap-1 px-5 pt-4 overflow-x-auto no-scrollbar">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveTab(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border-2
                                            ${activeTab === cat
                                                ? 'bg-primary border-black shadow-[var(--shadow-neobrutalism-sm)]'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-800'
                                            }`}
                                    >
                                        {t(`categories.${cat}`, cat)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Item List */}
                        <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 text-sm">
                                    <span className="material-icons text-4xl text-gray-300 mb-2 block">lunch_dining</span>
                                    {t('selectCatalogModal.noItems')}
                                </div>
                            ) : (
                                filteredItems.map((food) => {
                                    const isOnMenu = alreadyOnMenu.has(food.ID);
                                    const isChecked = isOnMenu || selectedIds.has(food.ID);

                                    return (
                                        <button
                                            key={food.ID}
                                            onClick={() => !isOnMenu && toggleItem(food.ID)}
                                            disabled={isOnMenu}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                                                ${isOnMenu
                                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                    : isChecked
                                                        ? 'border-black bg-primary/20 shadow-[var(--shadow-neobrutalism-sm)]'
                                                        : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div
                                                className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-all
                                                    ${isChecked
                                                        ? 'bg-primary border-black'
                                                        : 'border-gray-300 bg-white'
                                                    }`}
                                            >
                                                {isChecked && (
                                                    <span className="material-icons text-black text-xs">check</span>
                                                )}
                                            </div>

                                            {/* Image */}
                                            <div className="flex-shrink-0 h-10 w-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                                                {food.image ? (
                                                    <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <span className="material-icons text-gray-400 text-sm">restaurant</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-grow min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{food.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{food.description}</p>
                                            </div>

                                            {/* Price */}
                                            <span className="flex-shrink-0 font-black text-sm font-display">
                                                {formatPriceLabel(food.price, food.currency)}
                                            </span>

                                            {/* Already on menu badge */}
                                            {isOnMenu && (
                                                <span className="flex-shrink-0 text-[10px] font-bold text-gray-400 uppercase">
                                                    {t('selectCatalogModal.added')}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t-2 border-gray-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                            {/* Add new food shortcut */}
                            <button
                                onClick={() => setIsFoodModalOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-black transition-colors"
                            >
                                <span className="material-icons text-lg">add_circle_outline</span>
                                {t('selectCatalogModal.addNewFood')}
                            </button>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={onClose}>
                                    {t('selectCatalogModal.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleAccept}
                                    disabled={newSelectionsCount === 0}
                                >
                                    {t('selectCatalogModal.add')}{newSelectionsCount > 0 ? ` (${newSelectionsCount})` : ''}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested FoodModal for creating new catalog items */}
            <FoodModal
                isOpen={isFoodModalOpen}
                onClose={() => setIsFoodModalOpen(false)}
                onSave={handleAddNewFood}
                mode="create"
            />
        </>
    );
}
