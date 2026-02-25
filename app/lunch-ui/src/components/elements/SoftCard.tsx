import React from 'react';

interface SoftCardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export const SoftCard = React.forwardRef<HTMLDivElement, SoftCardProps>(
    ({ className = '', noPadding = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`bg-white border text-gray-800 border-gray-200 rounded-xl overflow-hidden ${noPadding ? '' : 'p-4'} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

SoftCard.displayName = "SoftCard";
