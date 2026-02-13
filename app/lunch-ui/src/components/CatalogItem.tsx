import type { Food } from '@/services/api';

interface CatalogItemProps {
    food: Food;
    onEdit?: (food: Food) => void;
    onDelete?: (food: Food) => void;
}

export default function CatalogItem({ food, onEdit, onDelete }: CatalogItemProps) {
    return (
        <div className="bg-card-light rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group le-klub-card flex items-stretch h-32 md:h-28">
            {/* Image */}
            <div className="relative w-32 md:w-40 shrink-0 overflow-hidden">
                <img
                    alt={food.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    src={food.image}
                />
            </div>

            {/* Content */}
            <div className="p-3 md:p-4 flex-grow flex items-center gap-4">
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight font-body">
                            {food.name}
                        </h3>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                            {food.category}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 max-w-md font-body">
                        {food.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 font-body">
                        <span className="text-xl font-extrabold text-gray-900">
                            ${food.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-2">
                    <button
                        className="bg-gray-50 p-2 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                        title="Edit"
                        onClick={() => onEdit?.(food)}
                    >
                        <span className="material-icons-outlined text-xl">edit</span>
                    </button>
                    <button
                        className="bg-gray-50 p-2 rounded-lg text-red-600 hover:bg-red-600 hover:text-white transition-all"
                        title="Delete"
                        onClick={() => onDelete?.(food)}
                    >
                        <span className="material-icons-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
