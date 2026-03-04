import { type Food } from '@/services/api';
import { Card } from '@/components/elements/Card';
import { Button } from '@/components/elements/Button';
import { formatCurrency } from '@/config/currency';
import { ToggleActiveButton } from '@/components/elements/ToggleActiveButton';
import { useTranslation } from 'react-i18next';

interface CatalogItemProps {
    food: Food;
    onEdit: (food: Food) => void;
    onDelete: (food: Food) => void;
    onToggleActive?: (food: Food) => void;
    showEdit?: boolean;
}

export default function CatalogItem({ food, onEdit, onDelete, onToggleActive, showEdit = true }: CatalogItemProps) {
    const { t } = useTranslation();

    return (
        <Card className={`flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[var(--shadow-neobrutalism-lg)] ${!food.isActive ? 'bg-gray-50 border-gray-300' : ''}`}>
            {/* Image Section */}
            <div className="w-full md:w-48 h-48 md:h-32 flex-shrink-0 bg-gray-100 rounded-lg border-2 border-black overflow-hidden relative group">
                {food.image ? (
                    <img
                        src={food.image}
                        alt={food.name}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!food.isActive ? 'grayscale opacity-60' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="material-icons text-gray-400 text-4xl">restaurant</span>
                    </div>
                )}

                {/* Active/Inactive badge overlay */}
                {!food.isActive && (
                    <div className="absolute top-2 left-2 bg-gray-800/80 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        {t('catalog.inactive')}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-grow space-y-2 w-full">
                <div className="flex justify-between items-start">
                    <div className={!food.isActive ? 'opacity-60' : ''}>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold font-display text-text-primary-light">
                                {food.name}
                            </h3>
                            {/* Active/Inactive badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                                ${food.isActive
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : 'bg-gray-100 text-gray-500 border-gray-300'
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${food.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                {food.isActive ? t('catalog.active') : t('catalog.inactive')}
                            </span>
                        </div>
                        <p className="text-text-secondary-light font-body text-sm line-clamp-2 md:line-clamp-none">
                            {food.description}
                        </p>
                    </div>
                    <div className={`text-right ${!food.isActive ? 'opacity-60' : ''}`}>
                        <span className="block text-2xl font-black text-black font-display">
                            {formatCurrency(food.price)}
                        </span>
                    </div>
                </div>

                {/* Actions - always fully visible */}
                <div className="flex justify-end gap-3 pt-2">
                    {onToggleActive && (
                        <ToggleActiveButton
                            isActive={food.isActive}
                            onToggle={() => onToggleActive(food)}
                        />
                    )}
                    {showEdit && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEdit(food)}
                            icon={<span className="material-icons-outlined text-sm">edit</span>}
                        >
                            {t('catalog.edit')}
                        </Button>
                    )}
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onDelete(food)}
                        icon={<span className="material-icons-outlined text-sm">delete</span>}
                    >
                        {t('catalog.delete')}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
