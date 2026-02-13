import { useQuery } from '@tanstack/react-query';
import { foodService, type Food } from '@/services/api';
import Navbar from '@/components/Navbar';
import CatalogItem from '@/components/CatalogItem';

export default function FoodCatalog() {
    const { data: foods, isLoading, error } = useQuery<Food[]>({
        queryKey: ['foods'],
        queryFn: foodService.getAll,
    });

    const handleEdit = (food: Food) => {
        console.info('Edit food:', food.name);
    };

    const handleDelete = (food: Food) => {
        console.info('Delete food:', food.name);
    };

    return (
        <div className="font-body bg-background-light text-gray-800 min-h-screen flex flex-col pattern-bg">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 font-display">
                            Food Catalog
                        </h1>
                        <p className="text-gray-600 font-body">
                            Manage your delicious offerings for the team.
                        </p>
                    </div>
                    <button className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-bold text-black transition-all duration-200 bg-primary border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:shadow-[var(--shadow-neobrutalism)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                        <span className="material-icons-outlined mr-2">add_circle</span>
                        Add New Food
                    </button>
                </div>

                {/* Food List */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                        <span className="material-icons text-red-500 text-4xl mb-2">error</span>
                        <p className="text-red-700 font-medium">Failed to load food items. Is the backend running?</p>
                        <p className="text-red-500 text-sm mt-1">Run <code className="bg-red-100 px-2 py-0.5 rounded">cds watch</code> in the project root.</p>
                    </div>
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
                    <div className="text-center py-20">
                        <span className="material-icons text-gray-300 text-6xl mb-4">restaurant</span>
                        <p className="text-gray-500 text-lg">No food items yet. Add your first dish!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
