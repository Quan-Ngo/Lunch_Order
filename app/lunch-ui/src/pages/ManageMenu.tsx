import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { Button } from '@/components/elements/Button';
import CatalogItem from '@/components/CatalogItem';
import { LoadingState } from '@/components/elements/LoadingState';
import { EmptyState } from '@/components/elements/EmptyState';
import { DateWheel, toISODate } from '@/components/elements/DateWheel';
import { RemovalModal } from '@/components/fragments/RemovalModal';
import { SelectFromCatalogModal } from '@/components/fragments/SelectFromCatalogModal';
import { dailyMenuService, staffCatalogService, type Food } from '@/services/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

export default function ManageMenu() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [removalTarget, setRemovalTarget] = useState<{ id: string; name: string; image?: string } | null>(null);

    const { data: isLocked = false } = useQuery({
        queryKey: ['isComplete', selectedDate],
        queryFn: () => dailyMenuService.isDateComplete(selectedDate),
    });

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

    const isLoading = menuLoading;

    const addFoodsMutation = useMutation({
        mutationFn: async (foods: Food[]) => {
            await Promise.all(foods.map((f) => dailyMenuService.addFoodToDate(selectedDate, f.ID)));
            return foods;
        },
        onSuccess: (foods) => {
            toast.success(t('manageMenu.addedCount', { count: foods.length }));
            queryClient.invalidateQueries({ queryKey: ['dailyMenu', selectedDate] });
        },
        onError: (err) => {
            console.error('Failed to add foods:', err);
            toast.error(t('manageMenu.addFailed'));
        },
    });

    const removeFoodMutation = useMutation({
        mutationFn: async (dailyMenuId: string) => {
            const removedEntry = menuEntries.find((entry) => entry.ID === dailyMenuId);
            const removedCatalogId = removedEntry?.catalog?.ID;

            await dailyMenuService.removeFoodFromDate(dailyMenuId);

            if (removedCatalogId) {
                await staffCatalogService.clearCatalogSelectionsByDate(removedCatalogId, selectedDate);
            }
        },
        onSuccess: () => {
            toast.success(t('manageMenu.itemRemoved'));
            queryClient.invalidateQueries({ queryKey: ['dailyMenu', selectedDate] });
        },
        onError: (err) => {
            console.error('Failed to remove food:', err);
            toast.error(t('manageMenu.removeFailed'));
        },
    });

    const handleAddFoods = async (foods: Food[]) => {
        setIsCatalogModalOpen(false);
        await addFoodsMutation.mutateAsync(foods);
    };

    const handleRemoveFood = async (dailyMenuId: string) => {
        await removeFoodMutation.mutateAsync(dailyMenuId);
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
                    disabled={isLocked}
                    icon={<span className="material-icons-outlined">playlist_add</span>}
                    onClick={() => setIsCatalogModalOpen(true)}
                >
                    {t('manageMenu.selectFromCatalog')}
                </Button>
            </PageHeader>


            {/* Locked banner */}
            {isLocked && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-700 font-semibold text-sm">
                    <span className="material-icons text-sm">lock</span>
                    {t('dailyOrders.isLocked')}
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
                            currency: entry.catalog.currency || 'VND',
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
                                        isLocked ? undefined : setRemovalTarget({
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
                variant="food"
            />
        </RootLayout>
    );
}
