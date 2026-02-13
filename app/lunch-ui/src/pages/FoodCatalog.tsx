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
import { foodService } from '@/services/api';

export default function FoodCatalog() {
    const { foods, isLoading, error, refetch } = useFoods();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const handleEdit = (food: any) => {
        console.info('Edit food:', food.name);
    };

    const handleDelete = (food: any) => {
        console.info('Delete food:', food.name);
    };

    const handleSave = async (data: FoodFormData) => {
        try {
            await foodService.create({
                name: data.name,
                price: parseFloat(data.price),
                description: data.description,
            });
            // Refresh list
            await refetch();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Failed to create food:', err);
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
                    onClick={() => setIsModalOpen(true)}
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
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </RootLayout>
    );
}
