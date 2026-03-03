import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';

interface ToggleActiveButtonProps {
    isActive: boolean;
    onToggle: () => void;
    size?: 'sm' | 'md';
    disabled?: boolean;
}

export function ToggleActiveButton({ isActive, onToggle, size = 'sm', disabled }: ToggleActiveButtonProps) {
    const { t } = useTranslation();

    return (
        <Button
            variant="secondary"
            size={size}
            disabled={disabled}
            className={isActive
                ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                : 'bg-orange-50 border-orange-400 text-orange-600 hover:bg-orange-100'
            }
            onClick={onToggle}
            icon={
                <span className="material-icons-outlined text-sm">
                    {isActive ? 'toggle_on' : 'toggle_off'}
                </span>
            }
        >
            {isActive ? t('catalog.active') : t('catalog.inactive')}
        </Button>
    );
}
