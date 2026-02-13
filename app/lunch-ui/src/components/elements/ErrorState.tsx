import React from 'react';

interface ErrorStateProps {
    message?: string;
    description?: React.ReactNode;
}

export function ErrorState({ message = "Something went wrong", description }: ErrorStateProps) {
    return (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
            <span className="material-icons text-red-500 text-4xl mb-2">error</span>
            <p className="text-red-700 font-medium">{message}</p>
            {description && (
                <div className="text-red-500 text-sm mt-1">
                    {description}
                </div>
            )}
        </div>
    );
}
