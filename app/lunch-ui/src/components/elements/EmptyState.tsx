import React from 'react';

interface EmptyStateProps {
    icon?: string;
    message?: string;
    children?: React.ReactNode;
}

export function EmptyState({ icon = "info", message = "No items found", children }: EmptyStateProps) {
    return (
        <div className="text-center py-20">
            <span className="material-icons text-gray-300 text-6xl mb-4">{icon}</span>
            <p className="text-gray-500 text-lg">{message}</p>
            {children}
        </div>
    );
}
