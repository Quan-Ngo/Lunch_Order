import { type Food } from '@/services/api';
import { Card } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';

interface CatalogItemProps {
    food: Food;
    onEdit: (food: Food) => void;
    onDelete: (food: Food) => void;
}

export default function CatalogItem({ food, onEdit, onDelete }: CatalogItemProps) {
    return (
        <Card className="flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-neobrutalism-lg)]">
            {/* Image Section */}
            <div className="w-full md:w-48 h-48 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg border-2 border-black overflow-hidden relative group">
                {food.image ? (
                    <img
                        src={food.image}
                        alt={food.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="material-icons text-gray-400 text-4xl">restaurant</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 md:hidden">
                    <Badge variant="outline">{food.category}</Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-grow space-y-2 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold font-display text-text-primary-light">
                                {food.name}
                            </h3>
                            <div className="hidden md:block">
                                <Badge variant="warning">{food.category}</Badge>
                            </div>
                        </div>
                        <p className="text-text-secondary-light font-body text-sm line-clamp-2 md:line-clamp-none">
                            {food.description}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="block text-2xl font-black text-black font-display">
                            ${food.price.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEdit(food)}
                        icon={<span className="material-icons-outlined text-sm">edit</span>}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(food)}
                        icon={<span className="material-icons-outlined text-sm">delete</span>}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Card>
    );
}
