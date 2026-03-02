import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootLayout } from '@/layouts/RootLayout';
import { LoadingState } from '@/components/elements/LoadingState';
import { EmptyState } from '@/components/elements/EmptyState';
import { DateWheel, toISODate } from '@/components/elements/DateWheel';
import { useAuth } from '@/contexts/AuthContext';
import {
    dailyMenuService,
    staffCatalogService,
    type DailyMenuEntity,
} from '@/services/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

// Card accent colors - cycle through these for visual variety
const CARD_ACCENTS = [
    { bg: 'from-green-600/80 to-green-900/90', ring: 'ring-green-400' },
    { bg: 'from-red-600/80 to-red-900/90', ring: 'ring-red-400' },
    { bg: 'from-amber-600/80 to-amber-900/90', ring: 'ring-amber-400' },
    { bg: 'from-cyan-600/80 to-cyan-900/90', ring: 'ring-cyan-400' },
    { bg: 'from-purple-600/80 to-purple-900/90', ring: 'ring-purple-400' },
    { bg: 'from-rose-600/80 to-rose-900/90', ring: 'ring-rose-400' },
];

// ─── Date Timeline ──────────────────────────────────────────────────────────────

interface FoodCardProps {
    entry: DailyMenuEntity;
    index: number;
    isSelected: boolean;
    onSelect: () => void;
}

function FoodCard({ entry, index, isSelected, onSelect }: FoodCardProps) {
    const catalog = entry.catalog;
    if (!catalog) return null;

    const imageUrl = catalog.file?.url || '';
    const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
    return (
        <div
            onClick={onSelect}
            className={`relative flex-shrink-0 w-[200px] sm:w-[220px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group
                ${isSelected
                    ? 'border-[3px] border-primary shadow-[var(--shadow-neobrutalism)] -translate-y-2 scale-[1.02]'
                    : 'border-[3px] border-transparent hover:-translate-y-1 hover:shadow-lg'
                }`}
        >
            {/* Checkmark */}
            {isSelected && (
                <div className="absolute top-4 right-4 z-30 bg-primary text-black rounded-full p-2 shadow-lg border-2 border-black flex items-center justify-center">
                    <span className="material-icons font-bold text-lg">check</span>
                </div>
            )}

            {/* Card content - full image background */}
            <div className="relative h-[280px] sm:h-[300px] w-full">
                {/* Background Image */}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={catalog.name}
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                        <span className="material-icons text-white/60 text-6xl">restaurant</span>
                    </div>
                )}

                {/* Gradient overlay at bottom */}
                <div className={`absolute inset-0 bg-gradient-to-t ${accent.bg} from-black/90 via-transparent to-transparent`} />

                {/* Text overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <h3 className="font-black font-display text-white text-base leading-tight mb-1 drop-shadow-md">
                        {catalog.name.toUpperCase()}
                    </h3>
                    <p className="text-white/70 text-[11px] leading-snug line-clamp-2 mb-2">
                        {catalog.description || 'A delicious meal option.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function DailyMenu() {
    const { currentUser } = useAuth();
    const { t } = useTranslation();

    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));

    const isStaff = currentUser?.role === 'staff' && !!currentUser.staff;
    const staffId = currentUser?.staff?.ID;
    const queryClient = useQueryClient();

    const { data: isLocked = false } = useQuery({
        queryKey: ['isComplete', selectedDate],
        queryFn: () => dailyMenuService.isDateComplete(selectedDate),
    });

    // ─── Data Loading via React Query ───────────────────────────────────────────

    const { data: rawMenuEntries = [], isFetching: menuLoading } = useQuery({
        queryKey: ['dailyMenu', selectedDate],
        queryFn: () => dailyMenuService.getByDate(selectedDate),
    });

    // Deduplicate and filter active items
    const seen = new Set<string>();
    const menuEntries = rawMenuEntries.filter((e) => {
        if (e.catalog && e.catalog.isActive && !seen.has(e.catalog.ID)) {
            seen.add(e.catalog.ID);
            return true;
        }
        return false;
    });

    const { data: savedOrder = null } = useQuery({
        queryKey: ['staffOrder', staffId, selectedDate],
        queryFn: () =>
            isStaff && staffId
                ? staffCatalogService.getForStaffAndDate(staffId, selectedDate)
                : Promise.resolve(null),
        enabled: isStaff && !!staffId,
    });

    const isLoading = menuLoading;

    // Sync selectedCatalogId from saved order
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);

    // When savedOrder or date changes, sync tick UI
    const savedCatalogId = savedOrder?.Catalog_ID ?? null;

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const handleSelect = (catalogId: string) => {
        if (!isStaff || isLocked) return;
        setSelectedCatalogId((prev) => (prev === catalogId ? null : catalogId));
    };

    const confirmMutation = useMutation({
        mutationFn: async (catalogId: string | null) => {
            if (!staffId) throw new Error('No staffId');
            if (savedOrder) {
                await staffCatalogService.deleteOrder(staffId, savedOrder.Catalog_ID, selectedDate);
            }
            if (catalogId) {
                await staffCatalogService.createOrder(staffId, catalogId, selectedDate);
            }
        },
        onSuccess: (_, catalogId) => {
            const catalogItem = menuEntries.find(m => m.catalog?.ID === catalogId)?.catalog;
            const itemName = catalogItem?.name || t('dailyMenu.foodItem');
            if (catalogId) {
                toast.success(t('dailyMenu.orderSuccessToast', { itemName, date: selectedDate }));
            }
            queryClient.invalidateQueries({ queryKey: ['staffOrder', staffId, selectedDate] });
        },
        onError: () => {
            setSelectedCatalogId(savedCatalogId);
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!staffId || !savedOrder) return;
            await staffCatalogService.deleteOrder(staffId, savedOrder.Catalog_ID, selectedDate);
        },
        onSuccess: () => {
            setSelectedCatalogId(null);
            queryClient.invalidateQueries({ queryKey: ['staffOrder', staffId, selectedDate] });
        },
    });

    const isActioning = confirmMutation.isPending || cancelMutation.isPending;

    const handleConfirmOrder = async () => {
        if (isActioning || isLocked) return;
        if (!staffId) return;
        if (savedCatalogId === selectedCatalogId) return;
        await confirmMutation.mutateAsync(selectedCatalogId);
    };

    const handleCancelOrder = async () => {
        if (!staffId || !savedOrder || isLocked) return;
        await cancelMutation.mutateAsync();
    };

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <RootLayout>
            {/* Hero Header */}
            <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-4xl">🍕</span>
                    <h1 className="text-4xl sm:text-5xl font-black font-display text-gray-900 leading-tight">
                        {t('dailyMenu.title')} <span className="text-primary-hover italic relative inline-block scribble-underline">{t('dailyMenu.titleHighlight')}</span>
                    </h1>
                    <span className="text-4xl">🥑</span>
                </div>
                <p className="text-gray-500 font-body text-sm">
                    {t('dailyMenu.subtitle')}
                </p>
            </div>

            {/* Date Timeline */}
            <DateWheel
                selected={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                todayLabel={t('dailyMenu.today')}
                className="mb-6"
            />

            {/* Content */}
            {isLoading ? (
                <LoadingState />
            ) : menuEntries.length === 0 ? (
                <EmptyState
                    icon="restaurant_menu"
                    message={t('dailyMenu.noMeals')}
                />
            ) : (
                <>
                    {/* Locked banner */}
                    {isLocked && (
                        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-700 font-semibold text-sm">
                            <span className="material-icons text-sm">lock</span>
                            {t('dailyOrders.isLocked')}
                        </div>
                    )}

                    {/* Saved order badge */}
                    {savedOrder && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                            <span className="material-icons text-sm text-accent-green">check_circle</span>
                            {t('dailyMenu.currentOrder')} <strong className="text-gray-900">{savedOrder.catalog?.name ?? '…'}</strong>
                            <button
                                onClick={handleCancelOrder}
                                disabled={isActioning}
                                className="ml-2 text-xs text-red-500 hover:text-red-700 font-semibold underline underline-offset-2 disabled:opacity-50"
                            >
                                {t('dailyMenu.cancel')}
                            </button>
                        </div>
                    )}

                    {/* Food Cards - horizontal scrollable row */}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar mt-1 pt-8 pb-8 px-2">
                        {menuEntries.map((entry, i) => {
                            const catalogId = entry.catalog?.ID;
                            if (!catalogId) return null;
                            const isSelected = selectedCatalogId === catalogId;

                            return (
                                <FoodCard
                                    key={entry.ID}
                                    entry={entry}
                                    index={i}
                                    isSelected={isSelected}
                                    onSelect={() => handleSelect(catalogId)}
                                />
                            );
                        })}
                    </div>

                    {/* Floating Confirm Order button - Always visible */}
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
                        <button
                            onClick={handleConfirmOrder}
                            className={`group flex items-center gap-4 px-10 py-5 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform origin-bottom-right scale-[0.75] font-bold text-2xl border-4 border-black uppercase tracking-tighter 
                                ${(isActioning)
                                    ? 'bg-primary text-black opacity-85 cursor-wait'
                                    : 'bg-primary hover:bg-primary-hover text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                        >
                            <span>{isActioning ? t('dailyMenu.saving') : t('dailyMenu.confirmOrder')}</span>
                            <span className={`material-icons text-3xl transition-transform ${(isActioning) ? '' : 'group-hover:translate-x-1'}`}>
                                arrow_forward
                            </span>
                        </button>
                    </div>
                </>
            )}
        </RootLayout>
    );
}


