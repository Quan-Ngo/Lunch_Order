import { useState } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { useFoods } from '@/hooks/useFoods';
import CatalogItem from '@/components/CatalogItem';
import { Button } from '@/components/elements/Button';
import { PageHeader } from '@/components/elements/PageHeader';
import { LoadingState } from '@/components/elements/LoadingState';
import { ErrorState } from '@/components/elements/ErrorState';
import { EmptyState } from '@/components/elements/EmptyState';
import { FoodModal, type FoodFormData } from '@/components/fragments/FoodModal';
import { RemovalModal, type RemovalItem } from '@/components/fragments/RemovalModal';
import { foodService, type Food } from '@/services/api';

export default function FoodCatalog() {
    const { foods, isLoading, error, refetch } = useFoods();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingFood, setEditingFood] = useState<Food | null>(null);
    const [removalTarget, setRemovalTarget] = useState<RemovalItem | null>(null);

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
            alert('Failed to save food. check console for details.');
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
                    onClick={handleOpenCreateModal}
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
                contextText="from the food catalog"
            />
        </RootLayout>
    );
}
