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
    const [pendingAdditions, setPendingAdditions] = useState<Food[]>([]);

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
    const menuEntries: Food[] = rawCatalogs
        .filter((catalog) => {
            if (catalog && catalog.isActive && !seen.has(catalog.ID)) {
                seen.add(catalog.ID);
                return true;
            }
            return false;
        })
        .map((catalog) => ({
            ID: catalog.ID,
            name: catalog.name,
            description: catalog.description || '',
            price: catalog.price,
            image: catalog.file?.url || '',
            category: catalog.category || 'General',
            isActive: catalog.isActive,
        }));

    // Merge existing entries with pending additions (avoid duplicates)
    const allMenuEntries: Food[] = [];
    const seenIds = new Set<string>();
    [...menuEntries, ...pendingAdditions].forEach((item) => {
        if (!seenIds.has(item.ID)) {
            seenIds.add(item.ID);
            allMenuEntries.push(item);
        }
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
            setPendingAdditions([]);
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
            toast.success(t('manageMenu.menuCompleted'));
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
        setPendingAdditions((prev) => [...prev, ...foods]);
    };

    const handleRemoveFood = async (catalogId: string) => {
        await removeFoodMutation.mutateAsync(catalogId);
    };

    const handleCompleteMenu = async () => {
        if (isLocked || allMenuEntries.length === 0) return;
        // Persist new selections to the DB before notifying staff
        if (pendingAdditions.length > 0) {
            await addFoodsMutation.mutateAsync(pendingAdditions);
        }
        await completeMenuMutation.mutateAsync();
    };

    const existingCatalogIds = menuEntries.map((c) => c.ID);
    // ...existing code...

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

        <div className="mb-6 pb-28">
                <DateWheel selected={selectedDate} onChange={setSelectedDate} />
            </div>

            {!isLoading && menuEntries.length > 0 && (
                <p className="text-sm text-gray-500 mb-4 font-medium">
                    <span className="material-icons text-sm align-middle mr-1 text-primary-hover">restaurant_menu</span>
                    {t('manageMenu.itemCount', { count: allMenuEntries.length })}
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
                        {allMenuEntries.map((catalog) => (
                            <div key={catalog.ID} className="group">
                                <CatalogItem
                                    food={catalog}
                                    onEdit={() => { }}
                                    onDelete={() =>
                                        isLocked ? undefined : setRemovalTarget({
                                            id: catalog.ID,
                                            name: catalog.name,
                                            image: catalog.image || undefined,
                                        })
                                    }
                                    showEdit={false}
                                />
                            </div>
                        ))}
                    </div>
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

            {/* Sticky footer confirm button */}
            {!isLocked && menuEntries.length > 0 && (
                <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
                    <button
                        id="btn-complete-menu"
                        onClick={handleCompleteMenu}
                        disabled={completeMenuMutation.isPending}
                        className={`group flex items-center gap-4 px-10 py-5 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform origin-bottom-right scale-[0.75] font-bold text-2xl border-4 border-black uppercase tracking-tighter 
                            ${completeMenuMutation.isPending
                                ? 'bg-primary text-black opacity-85 cursor-wait'
                                : 'bg-primary hover:bg-primary-hover text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                    >
                        <span>{completeMenuMutation.isPending ? t('manageMenu.completing', { defaultValue: 'Confirming...' }) : t('manageMenu.completeMenu', { defaultValue: 'Confirm Menu' })}</span>
                        <span className={`material-icons text-3xl transition-transform ${completeMenuMutation.isPending ? '' : 'group-hover:translate-x-1'}`}>
                            arrow_forward
                        </span>
                    </button>
                </div>
            )}
        </RootLayout>
    );
}
