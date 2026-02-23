import { useState } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { useFoods } from '@/hooks/useFoods';
import CatalogItem from '@/components/CatalogItem';
import { Button } from '@/components/elements/Button';
import { PageHeader } from '@/components/elements/PageHeader';
import { LoadingState } from '@/components/elements/LoadingState';
import { ErrorState } from '@/components/elements/ErrorState';
import { EmptyState } from '@/components/elements/EmptyState';
import { CreateFoodModal, type FoodFormData } from '@/components/fragments/CreateFoodModal';
import { RemovalModal, type RemovalItem } from '@/components/fragments/RemovalModal';
import { foodService, type Food } from '@/services/api';

export default function FoodCatalog() {
    const { foods, isLoading, error, refetch } = useFoods();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [removalTarget, setRemovalTarget] = useState<RemovalItem | null>(null);

    const handleEdit = (food: Food) => {
        console.info('Edit food:', food.name);
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

    const handleSave = async (data: FoodFormData) => {
        try {
            await foodService.create({
                name: data.name,
                price: parseFloat(data.price),
                description: data.description,
            });
            await refetch();
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error('Failed to create food:', err);
            alert('Failed to save food. Check console for details.');
        }
    };

    return (
        <RootLayout>
            <PageHeader
                title="Food Catalog"
                description="Manage your delicious offerings for the team."
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">add_circle</span>}
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    Add New Food
                </Button>
            </PageHeader>

            {isLoading && <LoadingState />}

            {error && (
                <ErrorState
                    message="Failed to load food items. Is the backend running?"
                    description={
                        <>
                            Run <code className="bg-red-100 px-2 py-0.5 rounded">cds watch</code> in the project root.
                        </>
                    }
                />
            )}

            {foods && (
                <div className="flex flex-col gap-4">
                    {foods.map((food) => (
                        <CatalogItem
                            key={food.ID}
                            food={food}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {foods && foods.length === 0 && (
                <EmptyState
                    icon="restaurant"
                    message="No food items yet. Add your first dish!"
                />
            )}

            <CreateFoodModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleSave}
            />

            <RemovalModal
                isOpen={removalTarget !== null}
                onClose={() => setRemovalTarget(null)}
                onConfirm={handleConfirmDelete}
                item={removalTarget}
                contextText="from the food catalog"
            />
        </RootLayout>
    );
}
