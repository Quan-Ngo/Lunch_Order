import React from 'react';


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, icon, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

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

        // Combine classes - utilizing simple string concatenation for now as I don't have clsx/tailwind-merge installed in this file specifically yet, but the user has 'clsx' and 'tailwind-merge' in dependencies (Step 410).
        // I should probably create a utility for 'cn' if I want to be robust. 
        // For now, I'll just concat.

        const computedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`;

        return (
            <button ref={ref} className={computedClasses} {...props}>
                {icon && <span className="mr-2 flex items-center">{icon}</span>}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";
