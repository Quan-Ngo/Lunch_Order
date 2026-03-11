import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RootLayout } from '@/layouts/RootLayout';
import { useFoods } from '@/hooks/useFoods';
import CatalogItem from '@/components/CatalogItem';
import { Button } from '@/components/elements/Button';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { LoadingState } from '@/components/elements/LoadingState';
import { ErrorState } from '@/components/elements/ErrorState';
import { EmptyState } from '@/components/elements/EmptyState';
import { SearchBar } from '@/components/elements/SearchBar';
import { FoodModal, type FoodFormData } from '@/components/fragments/FoodModal';
import { RemovalModal, type RemovalItem } from '@/components/fragments/RemovalModal';
import { foodService, type Food } from '@/services/api';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

const normalize = (value: string): string => value.toLowerCase().trim();

const isSubsequence = (needle: string, haystack: string): boolean => {
    if (!needle) return true;
    let needleIndex = 0;
    for (let i = 0; i < haystack.length && needleIndex < needle.length; i += 1) {
        if (haystack[i] === needle[needleIndex]) {
            needleIndex += 1;
        }
    }
    return needleIndex === needle.length;
};

const fuzzyFieldMatch = (field: string, term: string): boolean => {
    const normalizedField = normalize(field);
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) return true;
    return normalizedField.includes(normalizedTerm) || isSubsequence(normalizedTerm, normalizedField);
};

export default function FoodCatalog() {
    const { t } = useTranslation();
    const { foods, isLoading, error } = useFoods();
    const queryClient = useQueryClient();
    const invalidateFoods = () => queryClient.invalidateQueries({ queryKey: ['foods'] });
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [removalTarget, setRemovalTarget] = useState<RemovalItem | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filteredFoods = useMemo(() => {
        if (!foods) return [];
        let list = foods;

        // Apply active/inactive filter
        if (activeFilter === 'active') list = list.filter(f => f.isActive);
        else if (activeFilter === 'inactive') list = list.filter(f => !f.isActive);

        // Apply search filter
        const query = normalize(searchTerm);
        if (!query) return list;
        const terms = query.split(/\s+/).filter(Boolean);
        return list.filter((food) =>
            terms.every((term) =>
                fuzzyFieldMatch(food.name, term) || fuzzyFieldMatch(food.description, term)
            )
        );
    }, [foods, searchTerm, activeFilter]);

    const handleEdit = (food: Food) => {
        setEditingFood(food);
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingFood(null);
        setIsModalOpen(true);
    };

    const handleDelete = (food: Food) => {
        setRemovalTarget({
            id: food.ID,
            name: food.name,
            image: food.image || undefined,
        });
    };

    const handleConfirmDelete = async (id: string) => {
        try {
            await foodService.delete(id);
            invalidateFoods(); // fire-and-forget
            toast.success(`"${removalTarget?.name}" deleted successfully!`);
        } catch {
            toast.error(`Failed to delete "${removalTarget?.name}".`);
        }
    };

    const handleToggleActive = async (food: Food) => {
        try {
            await foodService.toggleActive(food.ID, !food.isActive);
            invalidateFoods(); // fire-and-forget
            toast.success(
                food.isActive
                    ? t('catalog.deactivatedSuccess', `"${food.name}" deactivated.`)
                    : t('catalog.activatedSuccess', `"${food.name}" activated.`)
            );
        } catch (err) {
            console.error('Failed to toggle active status:', err);
            toast.error(t('catalog.toggleFailed', 'Failed to update status.'));
        }
    };

    const handleSave = async (data: FoodFormData) => {
        try {
            const parsedPrice = parseFloat(data.price);
            if (editingFood) {
                await foodService.update(editingFood.ID, {
                    name: data.name,
                    price: parsedPrice,
                    currency: data.currency,
                    description: data.description,
                });
                if (data.image) {
                    await foodService.uploadImage(editingFood.ID, data.image);
                }
            } else {
                await foodService.create({
                    name: data.name,
                    price: parsedPrice,
                    currency: data.currency,
                    description: data.description,
                });
                if (data.image) {
                    const allFoods = await foodService.getAll();
                    const newFood = allFoods.find(f => f.name === data.name);
                    if (newFood) {
                        await foodService.uploadImage(newFood.ID, data.image);
                    }
                }
            }
            invalidateFoods();
            setIsModalOpen(false);
            setEditingFood(null);
            toast.success(
                editingFood
                    ? `"${editingFood.name}" updated successfully!`
                    : `"${data.name}" added successfully!`
            );
        } catch (err) {
            console.error('Failed to save food:', err);
            toast.error(t('catalog.saveFailed'));
        }
    };

    return (
        <RootLayout>
            <PageHeader
                title={t('catalog.title')}
                description={t('catalog.description')}
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">add_circle</span>}
                    onClick={handleOpenCreateModal}
                >
                    {t('catalog.addNew')}
                </Button>
            </PageHeader>

            <SoftCard className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {/* Active filter tabs - left, neobrutalism style */}
                    <div className="flex gap-2">
                        {(['all', 'active', 'inactive'] as const).map((f) => {
                            const count = f === 'all'
                                ? (foods?.length ?? 0)
                                : f === 'active'
                                    ? (foods?.filter(x => x.isActive).length ?? 0)
                                    : (foods?.filter(x => !x.isActive).length ?? 0);
                            const isSelected = activeFilter === f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border-2 border-black transition-all duration-150 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${isSelected
                                        ? 'bg-primary text-black'
                                        : 'bg-white text-black hover:bg-gray-50'
                                        }`}
                                >
                                    {f === 'active' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                                    {f === 'inactive' && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                                    {f === 'all' ? t('catalog.all', 'All') : f === 'active' ? t('catalog.active') : t('catalog.inactive')}
                                    <span className="ml-0.5 text-[10px] font-semibold bg-black/10 px-1.5 py-0.5 rounded-full">
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {/* Search bar - right */}
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={t('catalog.searchHint')}
                        className="flex-1"
                    />
                </div>
            </SoftCard>



            {isLoading && <LoadingState />
            }

            {
                error && (
                    <ErrorState
                        message={t('catalog.errorMessage')}
                        description={
                            <>
                                {t('catalog.errorDescription')}
                            </>
                        }
                    />
                )
            }

            {
                foods && filteredFoods.length > 0 && (
                    <div className="flex flex-col gap-4">
                        {filteredFoods.map((food) => (
                            <CatalogItem
                                key={food.ID}
                                food={food}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                )
            }

            {
                foods && foods.length === 0 && (
                    <EmptyState
                        icon="restaurant"
                        message={t('catalog.empty')}
                    />
                )
            }

            {
                foods && foods.length > 0 && filteredFoods.length === 0 && (
                    <EmptyState
                        icon="search_off"
                        message="No dishes match your search."
                    />
                )
            }

            <FoodModal
                isOpen={isModalOpen}
                mode={editingFood ? 'edit' : 'create'}
                initialData={
                    editingFood
                        ? {
                            name: editingFood.name,
                            price: editingFood.price.toString(),
                            currency: editingFood.currency,
                            description: editingFood.description,
                        }
                        : null
                }
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingFood(null);
                }}
                onSave={handleSave}
            />

            <RemovalModal
                isOpen={removalTarget !== null}
                onClose={() => setRemovalTarget(null)}
                onConfirm={handleConfirmDelete}
                item={removalTarget}
                contextText={t('catalog.removalContext')}
                variant="food"
            />
        </RootLayout >
    );
}
