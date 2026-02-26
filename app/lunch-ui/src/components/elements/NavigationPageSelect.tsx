import React from 'react';

interface NavigationPageSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const NavigationPageSelect = React.forwardRef<HTMLButtonElement, NavigationPageSelectProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, icon, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-primary text-black border-2 border-black hover:shadow-[var(--shadow-neobrutalism)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:ring-primary",
            secondary: "bg-white text-black border-2 border-black hover:shadow-[var(--shadow-neobrutalism)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:ring-gray-500",
            danger: "bg-red-500 text-white border-2 border-black hover:shadow-[var(--shadow-neobrutalism)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:ring-red-500",
            ghost: "bg-transparent text-text-primary-light hover:bg-gray-100",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-6 py-2.5 text-base",
            lg: "px-8 py-3 text-lg",
        };

        const widthClass = fullWidth ? "w-full" : "";
        const computedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

        return (
            <button ref={ref} className={computedClasses} {...props}>
                {icon && <span className="mr-2 flex items-center">{icon}</span>}
                {children}
            </button>
        );
    }
);

NavigationPageSelect.displayName = "NavigationPageSelect";

