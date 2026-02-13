import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'outline' | 'success' | 'warning';
}

export const Badge = ({ className = '', variant = 'default', children, ...props }: BadgeProps) => {
    const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border-2 border-black";



    // Note: 'bg-accent-green' relies on Tailwind config. If not there, I'll use strict values.
    // In index.css Step 661: --color-accent-green: #10B981;
    // But Tailwind v4 might not auto-generate 'bg-accent-green' utility unless configured or using standard colors.
    // I'll use arbitrary values or standard tailwind colors for safety.

    const safeVariants = {
        default: "bg-[var(--color-primary)] text-black",
        outline: "bg-white text-black",
        success: "bg-emerald-500 text-white",
        warning: "bg-yellow-100 text-yellow-800",
    };

    return (
        <span className={`${baseStyles} ${safeVariants[variant]} ${className}`} {...props}>
            {children}
        </span>
    );
};
