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
import { dailyMenuService, staffCatalogService, type DailyMenuEntity, type Food } from '@/services/api';
import { useTranslation } from 'react-i18next';

export default function ManageMenu() {
    const { t } = useTranslation();
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

            const seen = new Set<string>();
            const uniqueEntries = entries.filter((e) => {
                if (e.catalog && !seen.has(e.catalog.ID)) {
                    seen.add(e.catalog.ID);
                    return true;
                }
                return false;
            });

            setMenuEntries(uniqueEntries);
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
                text: t('manageMenu.addedCount', { count: foods.length }),
            });
            await loadMenu();
        } catch (err) {
            console.error('Failed to add foods:', err);
            setFeedback({ type: 'error', text: t('manageMenu.addFailed') });
        }
    };

    const handleRemoveFood = async (dailyMenuId: string) => {
        try {
            const removedEntry = menuEntries.find((entry) => entry.ID === dailyMenuId);
            const removedCatalogId = removedEntry?.catalog?.ID;

            await dailyMenuService.removeFoodFromDate(dailyMenuId);

            if (removedCatalogId) {
                await staffCatalogService.clearCatalogSelectionsByDate(removedCatalogId, selectedDate);
            }

            setFeedback({ type: 'success', text: t('manageMenu.itemRemoved') });
            await loadMenu();
        } catch (err) {
            console.error('Failed to remove food:', err);
            setFeedback({ type: 'error', text: t('manageMenu.removeFailed') });
            throw err;
        }
    };

    const existingCatalogIds = menuEntries
        .map((e) => e.catalog?.ID)
        .filter((id): id is string => !!id);

    return (
        <RootLayout>
            <PageHeader
                title={t('manageMenu.title')}
                description={t('manageMenu.description')}
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">playlist_add</span>}
                    onClick={() => setIsCatalogModalOpen(true)}
                >
                    {t('manageMenu.selectFromCatalog')}
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
                    {t('manageMenu.itemCount', { count: menuEntries.length })}
                </p>
            )}

            {isLoading ? (
                <LoadingState />
            ) : menuEntries.length === 0 ? (
                <EmptyState
                    icon="restaurant_menu"
                    message={t('manageMenu.emptyMenu')}
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
                contextText={t('manageMenu.fromTodaysMenu')}
            />
        </RootLayout>
    );
}
