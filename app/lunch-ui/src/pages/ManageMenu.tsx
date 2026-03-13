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

    const dailyMenu = rawMenuEntries[0];
    const rawCatalogs = dailyMenu?.catalogs || [];

    // Deduplicate and filter active items
    const seen = new Set<string>();
    const menuEntries = rawCatalogs.filter((catalog) => {
        if (catalog && catalog.isActive && !seen.has(catalog.ID)) {
            seen.add(catalog.ID);
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
        mutationFn: async (catalogId: string) => {
            await dailyMenuService.removeFoodFromDate(catalogId);
            await staffCatalogService.clearCatalogSelectionsByDate(catalogId, selectedDate);
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

    const completeMenuMutation = useMutation({
        mutationFn: () => dailyMenuService.markCompleteByDate(selectedDate),
        onSuccess: () => {
            toast.success(t('manageMenu.menuCompleted', { defaultValue: 'Menu marked as complete!' }));
            queryClient.invalidateQueries({ queryKey: ['dailyMenu', selectedDate] });
            queryClient.invalidateQueries({ queryKey: ['isComplete', selectedDate] });
        },
        onError: (err) => {
            console.error('Failed to complete menu:', err);
            toast.error(t('manageMenu.completeFailed', { defaultValue: 'Failed to complete menu.' }));
        },
    });

    const handleAddFoods = async (foods: Food[]) => {
        setIsCatalogModalOpen(false);
        await addFoodsMutation.mutateAsync(foods);
    };

    const handleRemoveFood = async (catalogId: string) => {
        await removeFoodMutation.mutateAsync(catalogId);
    };

    const handleCompleteMenu = async () => {
        if (isLocked || menuEntries.length === 0) return;
        await completeMenuMutation.mutateAsync();
    };

    const existingCatalogIds = menuEntries.map((c) => c.ID);

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
                <>
                    <div className="flex flex-col gap-3">
                        {menuEntries.map((catalog) => {
                            const catalogFood: Food = {
                                ID: catalog.ID,
                                name: catalog.name,
                                description: catalog.description || '',
                                price: catalog.price,
                                image: catalog.file?.url || '',
                                category: catalog.category || 'General',
                                isActive: catalog.isActive,
                            };

                            return (
                                <div
                                    key={catalog.ID}
                                    className="group"
                                >
                                    <CatalogItem
                                        food={catalogFood}
                                        onEdit={() => { }}
                                        onDelete={() =>
                                            isLocked ? undefined : setRemovalTarget({
                                                id: catalog.ID,
                                                name: catalog.name,
                                                image: catalog.file?.url || undefined,
                                            })
                                        }
                                        showEdit={false}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Confirm Menu button - inline below items */}
                    {!isLocked && (
                        <div className="flex justify-end mt-6">
                            <button
                                id="btn-complete-menu"
                                onClick={handleCompleteMenu}
                                disabled={completeMenuMutation.isPending}
                                className={`
                                    group flex items-center gap-2 px-6 py-3
                                    rounded-full border-[3px] border-black
                                    bg-primary text-black font-black text-sm uppercase tracking-widest
                                    shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]
                                    transition-all duration-150
                                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                    disabled:opacity-60 disabled:cursor-wait
                                `}
                            >
                                <span>
                                    {completeMenuMutation.isPending
                                        ? t('manageMenu.completing', { defaultValue: 'Confirming...' })
                                        : t('manageMenu.completeMenu', { defaultValue: 'Confirm Menu' })}
                                </span>
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-primary transition-transform group-hover:scale-110">
                                    <span className="material-icons text-sm">
                                        {completeMenuMutation.isPending ? 'hourglass_empty' : 'done'}
                                    </span>
                                </span>
                            </button>
                        </div>
                    )}
                </>
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
