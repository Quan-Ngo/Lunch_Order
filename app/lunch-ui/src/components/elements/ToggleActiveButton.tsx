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
            className={isActive ? 'bg-green-300 hover:bg-green-400' : ''}
            onClick={onToggle}
            icon={
                <span className="material-icons-outlined text-sm">
                    {isActive ? 'toggle_on' : 'toggle_off'}
                </span>
            }
        >
            {isActive ? t('catalog.deactivate') : t('catalog.activate')}
        </Button>
    );
}
