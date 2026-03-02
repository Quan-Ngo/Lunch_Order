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
import { FoodModal, type FoodFormData } from '@/components/fragments/FoodModal';
import { RemovalModal, type RemovalItem } from '@/components/fragments/RemovalModal';
import { foodService, type Food } from '@/services/api';

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
    const { foods, isLoading, error, refetch } = useFoods();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [removalTarget, setRemovalTarget] = useState<RemovalItem | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const filteredFoods = useMemo(() => {
        if (!foods) return [];
        const query = normalize(searchTerm);
        if (!query) return foods;

        const terms = query.split(/\s+/).filter(Boolean);
        return foods.filter((food) =>
            terms.every((term) =>
                fuzzyFieldMatch(food.name, term) || fuzzyFieldMatch(food.description, term)
            )
        );
    }, [foods, searchTerm]);

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
        await foodService.delete(id);
        await refetch();
    };

    const handleToggleActive = async (food: Food) => {
        try {
            await foodService.toggleActive(food.ID, !food.isActive);
            await refetch();
        } catch (err) {
            console.error('Failed to toggle active status:', err);
        }
    };

    const handleSave = async (data: FoodFormData) => {
        try {
            if (editingFood) {
                // PATCH allows partial updates so we don't accidentally wipe out the image or category 
                // if we are only sending name, price, description in an update
                await foodService.update(editingFood.ID, {
                    name: data.name,
                    price: parseFloat(data.price),
                    description: data.description,
                });
            } else {
                await foodService.create({
                    name: data.name,
                    price: parseFloat(data.price),
                    description: data.description,
                });
            }
            // Refresh list
            await refetch();
            setIsModalOpen(false);
            setEditingFood(null);
        } catch (err) {
            console.error('Failed to save food:', err);
            // Optionally show error to user (e.g., alert or toast)
            alert(t('catalog.saveFailed'));
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
                <div className="relative w-full md:w-1/3">
                    <span className="material-icons-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        search
                    </span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('catalog.searchHint')}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        aria-label={t('catalog.searchHint')}
                    />
                </div>
            </SoftCard>

            {isLoading && <LoadingState />}

            {error && (
                <ErrorState
                    message={t('catalog.errorMessage')}
                    description={
                        <>
                            {t('catalog.errorDescription')}
                        </>
                    }
                />
            )}

            {foods && filteredFoods.length > 0 && (
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
            )}

            {foods && foods.length === 0 && (
                <EmptyState
                    icon="restaurant"
                    message={t('catalog.empty')}
                />
            )}

            {foods && foods.length > 0 && filteredFoods.length === 0 && (
                <EmptyState
                    icon="search_off"
                    message="No dishes match your search."
                />
            )}

            <FoodModal
                isOpen={isModalOpen}
                mode={editingFood ? 'edit' : 'create'}
                initialData={
                    editingFood
                        ? {
                            name: editingFood.name,
                            price: editingFood.price.toString(),
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
            />
        </RootLayout>
    );
}
