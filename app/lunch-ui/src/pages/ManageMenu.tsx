import { useState, useEffect, useCallback } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { Button } from '@/components/elements/Button';
import { LoadingState } from '@/components/elements/LoadingState';
import { EmptyState } from '@/components/elements/EmptyState';
import { DateWheel, toISODate } from '@/components/elements/DateWheel';
import { RemovalModal } from '@/components/fragments/RemovalModal';
import { SelectFromCatalogModal } from '@/components/fragments/SelectFromCatalogModal';
import { dailyMenuService, type DailyMenuEntity, type Food } from '@/services/api';

// ─── Menu Item Card ─────────────────────────────────────────────────────────────

interface MenuItemCardProps {
    entry: DailyMenuEntity;
    onRemove: () => void;
}

function MenuItemCard({ entry, onRemove }: MenuItemCardProps) {
    const catalog = entry.catalog;
    if (!catalog) return null;

    const imageUrl = catalog.file?.url || '';

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all group">
            {/* Image */}
            <div className="flex-shrink-0 h-20 w-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-100">
                {imageUrl ? (
                    <img src={imageUrl} alt={catalog.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <span className="material-icons text-gray-400 text-2xl">restaurant</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
                <p className="font-bold text-gray-900 font-display text-lg truncate">{catalog.name}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{catalog.description || 'No description'}</p>
                {catalog.category && (
                    <span className="inline-block mt-1.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                        {catalog.category}
                    </span>
                )}
            </div>

            {/* Price */}
            <div className="flex-shrink-0 text-right">
                <span className="text-2xl font-black font-display text-gray-900">
                    ${catalog.price.toFixed(2)}
                </span>
            </div>

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                title="Remove from menu"
            >
                <span className="material-icons">close</span>
            </button>
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ManageMenu() {
    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
    const [menuEntries, setMenuEntries] = useState<DailyMenuEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [removalTarget, setRemovalTarget] = useState<{ id: string; name: string; image?: string } | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ─── Data Loading ───────────────────────────────────────────────────────────

    const loadMenu = useCallback(async () => {
        setIsLoading(true);
        setFeedback(null);
        try {
            const entries = await dailyMenuService.getByDate(selectedDate);
            setMenuEntries(entries.filter((e) => e.catalog)); // only entries with an associated catalog
        } catch (err) {
            console.error('Failed to load menu:', err);
            setMenuEntries([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const handleAddFoods = async (foods: Food[]) => {
        setIsCatalogModalOpen(false);
        setFeedback(null);
        try {
            await Promise.all(
                foods.map((f) => dailyMenuService.addFoodToDate(selectedDate, f.ID))
            );
            setFeedback({
                type: 'success',
                text: `✅ Added ${foods.length} item${foods.length > 1 ? 's' : ''} to the menu!`,
            });
            await loadMenu();
        } catch (err) {
            console.error('Failed to add foods:', err);
            setFeedback({ type: 'error', text: '❌ Failed to add items. Please try again.' });
        }
    };

    const handleRemoveFood = async (dailyMenuId: string) => {
        try {
            await dailyMenuService.removeFoodFromDate(dailyMenuId);
            setFeedback({ type: 'success', text: '✅ Item removed from the menu.' });
            await loadMenu();
        } catch (err) {
            console.error('Failed to remove food:', err);
            setFeedback({ type: 'error', text: '❌ Failed to remove item. Please try again.' });
            throw err; // rethrow for RemovalModal's catch
        }
    };

    const existingCatalogIds = menuEntries
        .map((e) => e.catalog?.ID)
        .filter((id): id is string => !!id);

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <RootLayout>
            {/* Header */}
            <PageHeader
                title="Weekly Planner"
                description="Plan the daily menu for your team."
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">playlist_add</span>}
                    onClick={() => setIsCatalogModalOpen(true)}
                >
                    Select from Catalog
                </Button>
            </PageHeader>

            {/* Feedback message */}
            {feedback && (
                <div
                    className={`mb-4 px-4 py-3 rounded-xl border-2 font-semibold text-sm
                        ${feedback.type === 'success'
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'bg-red-50 border-red-400 text-red-700'
                        }`}
                >
                    {feedback.text}
                </div>
            )}

            {/* Date Timeline */}
            <div className="mb-6">
                <DateWheel selected={selectedDate} onChange={setSelectedDate} />
            </div>

            {/* Item count */}
            {!isLoading && menuEntries.length > 0 && (
                <p className="text-sm text-gray-500 mb-4 font-medium">
                    <span className="material-icons text-sm align-middle mr-1 text-primary-hover">restaurant_menu</span>
                    {menuEntries.length} item{menuEntries.length !== 1 ? 's' : ''} on the menu
                </p>
            )}

            {/* Content */}
            {isLoading ? (
                <LoadingState />
            ) : menuEntries.length === 0 ? (
                <EmptyState
                    icon="restaurant_menu"
                    message="No food on the menu for this day yet. Click 'Select from Catalog' to add some!"
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {menuEntries.map((entry) => (
                        <MenuItemCard
                            key={entry.ID}
                            entry={entry}
                            onRemove={() =>
                                setRemovalTarget({
                                    id: entry.ID,
                                    name: entry.catalog?.name || 'Unknown',
                                    image: entry.catalog?.file?.url || undefined,
                                })
                            }
                        />
                    ))}
                </div>
            )}

            {/* Select from Catalog Modal */}
            <SelectFromCatalogModal
                isOpen={isCatalogModalOpen}
                onClose={() => setIsCatalogModalOpen(false)}
                onAccept={handleAddFoods}
                existingCatalogIds={existingCatalogIds}
            />

            {/* Remove Confirmation Modal */}
            <RemovalModal
                isOpen={removalTarget !== null}
                onClose={() => setRemovalTarget(null)}
                onConfirm={handleRemoveFood}
                item={removalTarget}
                contextText="from today's menu"
            />
        </RootLayout>
    );
}
