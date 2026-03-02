import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';

interface ToggleActiveButtonProps {
    isActive: boolean;
    onToggle?: () => void;
    onActivate?: () => void;
    onDeactivate?: () => void;
    size?: 'sm' | 'md';
    disabled?: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
    className?: string;
}

export function ToggleActiveButton({
    isActive,
    onToggle,
    onActivate,
    onDeactivate,
    size = 'sm',
    disabled,
    activeLabel,
    inactiveLabel,
    className,
}: ToggleActiveButtonProps) {
    const { t } = useTranslation();
    const handleClick = () => {
        if (isActive && onDeactivate) {
            onDeactivate();
            return;
        }

        if (!isActive && onActivate) {
            onActivate();
            return;
        }

        onToggle?.();
    };

    return (
        <Button
            variant="secondary"
            size={size}
            disabled={disabled}
            className={`${isActive ? 'bg-green-300 hover:bg-green-400' : ''} ${className ?? ''}`.trim()}
            onClick={handleClick}
            icon={
                <span className="material-icons-outlined text-sm">
                    {isActive ? 'toggle_on' : 'toggle_off'}
                </span>
            }
        >
            {isActive ? (activeLabel ?? t('catalog.deactivate')) : (inactiveLabel ?? t('catalog.activate'))}
        </Button>
    );
}
