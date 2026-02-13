import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 font-display">
                    {title}
                </h1>
                {description && (
                    <p className="text-gray-600 font-body">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div>
                    {children}
                </div>
            )}
        </div>
    );
}
