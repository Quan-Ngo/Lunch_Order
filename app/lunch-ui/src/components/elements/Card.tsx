import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', noPadding = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`bg-white border-2 border-black shadow-[var(--shadow-neobrutalism)] rounded-xl overflow-hidden ${noPadding ? '' : 'p-4'} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
