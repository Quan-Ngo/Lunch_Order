import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';

interface ToggleActiveButtonProps {
    isActive: boolean;
    onToggle?: () => void;
    onActivate?: () => void;
    onDeactivate?: () => void;
    activeLabel?: string;
    inactiveLabel?: string;
    size?: 'sm' | 'md';
    disabled?: boolean;
    className?: string;
}

export function ToggleActiveButton({
    isActive,
    onToggle,
    onActivate,
    onDeactivate,
    activeLabel,
    inactiveLabel,
    size = 'sm',
    disabled,
    className,
}: ToggleActiveButtonProps) {
    const { t } = useTranslation();
    const handleClick = () => {
        if (onToggle) {
            onToggle();
            return;
        }
        if (isActive) onDeactivate?.();
        else onActivate?.();
    };
    const label = isActive
        ? (activeLabel ?? t('catalog.active'))
        : (inactiveLabel ?? t('catalog.inactive'));

    return (
        <Button
            variant="secondary"
            size={size}
            disabled={disabled}
            className={`${isActive
                ? 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                : 'bg-orange-50 border-orange-400 text-orange-600 hover:bg-orange-100'
            } ${className ?? ''}`}
            onClick={handleClick}
            icon={
                <span className="material-icons-outlined text-sm">
                    {isActive ? 'toggle_on' : 'toggle_off'}
                </span>
            }
        >
            {label}
        </Button>
    );
}
