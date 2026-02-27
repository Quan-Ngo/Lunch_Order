import { useState, useEffect, useCallback } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { Button } from '@/components/elements/Button';
import CatalogItem from '@/components/CatalogItem';
import { LoadingState } from '@/components/elements/LoadingState';
import { EmptyState } from '@/components/elements/EmptyState';
import { DateWheel, toISODate } from '@/components/elements/DateWheel';
import { RemovalModal } from '@/components/fragments/RemovalModal';
import { SelectFromCatalogModal } from '@/components/fragments/SelectFromCatalogModal';
import { dailyMenuService, type DailyMenuEntity, type Food } from '@/services/api';

export default function ManageMenu() {
    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
    const [menuEntries, setMenuEntries] = useState<DailyMenuEntity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [removalTarget, setRemovalTarget] = useState<{ id: string; name: string; image?: string } | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const loadMenu = useCallback(async () => {
        setIsLoading(true);
        setFeedback(null);
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

    useEffect(() => {
        loadMenu();
    }, [loadMenu]);

    const handleAddFoods = async (foods: Food[]) => {
        setIsCatalogModalOpen(false);
        setFeedback(null);
        try {
            await Promise.all(
                foods.map((f) => dailyMenuService.addFoodToDate(selectedDate, f.ID))
            );
            setFeedback({
                type: 'success',
                text: `Added ${foods.length} item${foods.length > 1 ? 's' : ''} to the menu!`,
            });
            await loadMenu();
        } catch (err) {
            console.error('Failed to add foods:', err);
            setFeedback({ type: 'error', text: 'Failed to add items. Please try again.' });
        }
    };

    const handleRemoveFood = async (dailyMenuId: string) => {
        try {
            await dailyMenuService.removeFoodFromDate(dailyMenuId);

            setFeedback({ type: 'success', text: 'Item removed from the menu.' });
            await loadMenu();
        } catch (err) {
            console.error('Failed to remove food:', err);
            setFeedback({ type: 'error', text: 'Failed to remove item. Please try again.' });
            throw err;
        }
    };

    const existingCatalogIds = menuEntries
        .map((e) => e.catalog?.ID)
        .filter((id): id is string => !!id);

    return (
        <RootLayout>
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

            <div className="mb-6">
                <DateWheel selected={selectedDate} onChange={setSelectedDate} />
            </div>

            {!isLoading && menuEntries.length > 0 && (
                <p className="text-sm text-gray-500 mb-4 font-medium">
                    <span className="material-icons text-sm align-middle mr-1 text-primary-hover">restaurant_menu</span>
                    {menuEntries.length} item{menuEntries.length !== 1 ? 's' : ''} on the menu
                </p>
            )}

            {isLoading ? (
                <LoadingState />
            ) : menuEntries.length === 0 ? (
                <EmptyState
                    icon="restaurant_menu"
                    message="No food on the menu for this day yet. Click 'Select from Catalog' to add some!"
                />
            ) : (
                <div className="flex flex-col gap-3">
                    {menuEntries.map((entry) => {
                        if (!entry.catalog) return null;

                        const catalogFood: Food = {
                            ID: entry.catalog.ID,
                            name: entry.catalog.name,
                            description: entry.catalog.description || '',
                            price: entry.catalog.price,
                            image: entry.catalog.file?.url || '',
                            category: entry.catalog.category || 'General',
                            isActive: entry.catalog.isActive,
                        };

                        return (
                            <div
                                key={entry.ID}
                                className="group"
                            >
                                <CatalogItem
                                    food={catalogFood}
                                    onEdit={() => { }}
                                    onDelete={() =>
                                        setRemovalTarget({
                                            id: entry.ID,
                                            name: entry.catalog?.name || 'Unknown',
                                            image: entry.catalog?.file?.url || undefined,
                                        })
                                    }
                                    showEdit={false}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            <SelectFromCatalogModal
                isOpen={isCatalogModalOpen}
                onClose={() => setIsCatalogModalOpen(false)}
                onAccept={handleAddFoods}
                existingCatalogIds={existingCatalogIds}
            />

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
