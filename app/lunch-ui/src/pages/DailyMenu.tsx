import { useState, useEffect, useCallback } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { LoadingState } from '@/components/elements/LoadingState';
import { EmptyState } from '@/components/elements/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import {
    dailyMenuService,
    staffCatalogService,
    type DailyMenuEntity,
    type StaffCatalogEntity,
} from '@/services/api';
import { useTranslation } from 'react-i18next';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getDateRange(): Date[] {
    const today = new Date();
    const days: Date[] = [];
    for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        days.push(d);
    }
    return days;
}

function toISODate(d: Date): string {
    return d.toISOString().split('T')[0];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Category → badge color mapping
const CATEGORY_COLORS: Record<string, string> = {
    Healthy: 'bg-green-500',
    Vegan: 'bg-emerald-600',
    Popular: 'bg-red-500',
    General: 'bg-blue-500',
    Comfort: 'bg-orange-500',
    Seafood: 'bg-cyan-600',
    Salad: 'bg-green-600',
    Pizza: 'bg-red-600',
    Burger: 'bg-amber-600',
    Ramen: 'bg-orange-600',
    Bowl: 'bg-teal-600',
};

function getCategoryBg(category: string) {
    return CATEGORY_COLORS[category] || 'bg-gray-500';
}

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

function DateTimeline({ selected, onChange }: { selected: string; onChange: (d: string) => void }) {
    const { t } = useTranslation();
    const days = getDateRange();
    const today = toISODate(new Date());
    const selDate = new Date(selected + 'T00:00:00');
    const monthName = selDate.toLocaleString('default', { month: 'long' });
    const monthLabel = `${monthName} ${selDate.getFullYear()}`;

    // Navigate one day back/forward
    const shiftDay = (delta: number) => {
        const d = new Date(selected + 'T00:00:00');
        d.setDate(d.getDate() + delta);
        onChange(toISODate(d));
    };

    return (
        <div className="mb-24">
            {/* Header row: month label + prev/next */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-500 text-base">calendar_today</span>
                    <span className="text-sm font-semibold text-gray-600">{monthLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => shiftDay(-1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-colors text-gray-600 text-sm font-bold"
                    >‹</button>
                    <button
                        onClick={() => shiftDay(1)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-100 transition-colors text-gray-600 text-sm font-bold"
                    >›</button>
                </div>
            </div>

            {/* Day tiles */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 mt-4 items-center">
                {days.map((d) => {
                    const iso = toISODate(d);
                    const isSelected = iso === selected;
                    const isToday = iso === today;
                    return (
                        <div key={iso} className="flex flex-col items-center relative flex-shrink-0">
                            {/* TODAY pill - floats above the card */}
                            {isToday && (
                                <span className="absolute -top-5 bg-black text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full z-10 whitespace-nowrap">
                                    {t('dailyMenu.today')}
                                </span>
                            )}
                            <button
                                onClick={() => onChange(iso)}
                                className={`flex flex-col items-center justify-center rounded-2xl border-2 transition-all font-body
                                    ${isSelected
                                        ? 'w-16 h-20 bg-primary border-black border-[3px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                        : 'w-12 h-14 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`font-semibold uppercase ${isSelected ? 'text-[10px] text-gray-700' : 'text-[9px] text-gray-400'}`}>
                                    {DAY_LABELS[d.getDay()]}
                                </span>
                                <span className={`font-black leading-tight ${isSelected ? 'text-2xl text-black' : 'text-lg text-gray-600'}`}>
                                    {d.getDate()}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Food Card (Full-bleed image, gradient overlay, text on image) ──────────────

interface FoodCardProps {
    entry: DailyMenuEntity;
    index: number;
    isSelected: boolean;
    isSaved: boolean;
    onSelect: () => void;
}

function FoodCard({ entry, index, isSelected, isSaved, onSelect }: FoodCardProps) {
    const { t } = useTranslation();
    const catalog = entry.catalog;
    if (!catalog) return null;

    const imageUrl = catalog.file?.url || '';
    const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
    const isHighlighted = isSelected || isSaved;

    return (
        <div
            onClick={onSelect}
            className={`relative flex-shrink-0 w-[200px] sm:w-[220px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 group
                ${isHighlighted
                    ? 'border-[3px] border-primary shadow-[var(--shadow-neobrutalism)] -translate-y-2 scale-[1.02]'
                    : 'border-[3px] border-transparent hover:-translate-y-1 hover:shadow-lg'
                }`}
        >
            {/* Checkmark */}
            {isHighlighted && (
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

                {/* Category badges - bottom area above text */}
                <div className="absolute bottom-[90px] left-3 flex flex-wrap gap-1.5 z-10">
                    {catalog.category && (
                        <span className={`${getCategoryBg(catalog.category)} text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full`}>
                            {t(`categories.${catalog.category}`, catalog.category)}
                        </span>
                    )}
                </div>

                {/* Text overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                    <h3 className="font-black font-display text-white text-base leading-tight mb-1 drop-shadow-md">
                        {catalog.name.toUpperCase()}
                    </h3>
                    <p className="text-white/70 text-[11px] leading-snug line-clamp-2 mb-2">
                        {catalog.description || 'A delicious meal option.'}
                    </p>

                    {/* Price + icons row */}
                    <div className="flex items-center justify-between">
                        <span className="text-primary font-black text-sm drop-shadow-sm">
                            ${catalog.price.toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-icons text-white text-[11px]">favorite_border</span>
                            </span>
                            <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-icons text-white text-[11px]">share</span>
                            </span>
                        </div>
                    </div>
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
    const [menuEntries, setMenuEntries] = useState<DailyMenuEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(null);
    const [savedOrder, setSavedOrder] = useState<StaffCatalogEntity | null>(null);
    const [isActioning, setIsActioning] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isStaff = currentUser?.role === 'staff' && !!currentUser.staff;
    const staffId = currentUser?.staff?.ID;

    // ─── Data Loading ───────────────────────────────────────────────────────────

    const loadMenu = useCallback(async () => {
        setIsLoading(true);
        try {
            const entries = await dailyMenuService.getByDate(selectedDate);
            setMenuEntries(entries.filter((e) => e.catalog));
        } catch (err) {
            console.error('Failed to load menu:', err);
            setMenuEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    const loadExistingOrder = useCallback(async () => {
        if (!isStaff || !staffId) {
            setSavedOrder(null);
            setSelectedCatalogId(null);
            return;
        }
        try {
            const order = await staffCatalogService.getForStaffAndDate(staffId, selectedDate);
            setSavedOrder(order);
            setSelectedCatalogId(order?.Catalog_ID ?? null);
        } catch {
            setSavedOrder(null);
            setSelectedCatalogId(null);
        }
    }, [isStaff, staffId, selectedDate]);

    useEffect(() => {
        setFeedback(null);
        loadMenu();
        loadExistingOrder();
    }, [loadMenu, loadExistingOrder]);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const handleSelect = (catalogId: string) => {
        if (!currentUser) return; // must be logged in
        if (savedOrder?.Catalog_ID === catalogId) {
            // clicking the saved item unselects it
            setSelectedCatalogId(null);
            return;
        }
        setSelectedCatalogId((prev) => (prev === catalogId ? null : catalogId));
        setFeedback(null);
    };

    const handleConfirmOrder = async () => {
        if (!staffId || !selectedCatalogId) return;
        setIsActioning(true);
        setFeedback(null);
        try {
            if (savedOrder) {
                await staffCatalogService.deleteOrder(staffId, savedOrder.Catalog_ID, selectedDate);
            }
            await staffCatalogService.createOrder(staffId, selectedCatalogId, selectedDate);
            setFeedback({ type: 'success', text: t('dailyMenu.orderConfirmed') });
            await loadExistingOrder();
        } catch (err) {
            console.error('Failed to confirm order:', err);
            setFeedback({ type: 'error', text: t('dailyMenu.orderFailed') });
        } finally {
            setIsActioning(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!staffId || !savedOrder) return;
        setIsActioning(true);
        setFeedback(null);
        try {
            await staffCatalogService.deleteOrder(staffId, savedOrder.Catalog_ID, selectedDate);
            setSavedOrder(null);
            setSelectedCatalogId(null);
            setFeedback({ type: 'success', text: t('dailyMenu.orderCancelled') });
        } catch (err) {
            console.error('Failed to cancel order:', err);
            setFeedback({ type: 'error', text: t('dailyMenu.cancelFailed') });
        } finally {
            setIsActioning(false);
        }
    };

    // Is the current selection new (not yet saved)?
    const hasUnsavedSelection = !!currentUser && !!selectedCatalogId && selectedCatalogId !== savedOrder?.Catalog_ID;

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
            <DateTimeline selected={selectedDate} onChange={(d) => { setSelectedDate(d); setFeedback(null); }} />

            {/* Feedback message */}
            {feedback && (
                <div
                    className={`mb-5 px-4 py-3 rounded-xl border-2 font-semibold text-sm
                        ${feedback.type === 'success'
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-red-50 border-red-400 text-red-700'
                        }`}
                >
                    {feedback.text}
                </div>
            )}

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
                    <div className="flex gap-4 overflow-x-auto no-scrollbar mt-28 pt-8 pb-8 px-2">
                        {menuEntries.map((entry, i) => {
                            const catalogId = entry.catalog?.ID;
                            if (!catalogId) return null;
                            const isSaved = savedOrder?.Catalog_ID === catalogId;
                            const isSelected = selectedCatalogId === catalogId && !isSaved;

                            return (
                                <FoodCard
                                    key={entry.ID}
                                    entry={entry}
                                    index={i}
                                    isSelected={isSelected}
                                    isSaved={isSaved}
                                    onSelect={() => handleSelect(catalogId)}
                                />
                            );
                        })}
                    </div>

                    {/* Floating Confirm Order button - Always visible */}
                    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
                        <button
                            onClick={handleConfirmOrder}
                            disabled={isActioning || !hasUnsavedSelection}
                            className={`group flex items-center gap-4 px-10 py-5 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform font-black text-2xl border-4 border-black uppercase tracking-tighter 
                                ${(!hasUnsavedSelection || isActioning)
                                    ? 'bg-gray-300 text-gray-500 opacity-80 cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-primary hover:bg-primary-hover text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                        >
                            <span>{isActioning ? t('dailyMenu.saving') : t('dailyMenu.confirmOrder')}</span>
                            <span className={`material-icons text-3xl transition-transform ${(!hasUnsavedSelection || isActioning) ? '' : 'group-hover:translate-x-1'}`}>
                                arrow_forward
                            </span>
                        </button>
                    </div>
                </>
            )}
        </RootLayout>
    );
}
