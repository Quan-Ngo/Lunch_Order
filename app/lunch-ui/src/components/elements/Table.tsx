import React from 'react';

export interface ColumnDef<T> {
    header: string;
    key?: keyof T;
    render?: (row: T) => React.ReactNode;
    className?: string; // e.g. "col-span-5" or "w-1/3 text-right"
}

interface TableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    title?: string;
    keyExtractor: (row: T) => string | number;
    className?: string;
    onRowClick?: (row: T) => void;
}

export function Table<T>({ columns, data, title, keyExtractor, className = '', onRowClick }: TableProps<T>) {
    // We use a CSS grid approach to match the DailyOrders look, 
    // or standard table. The DailyOrders mockup used a grid 12 cols.
    // To make it generic but retain the grid look, we rely on the `className` 
    // property of each column to define grid spans (like col-span-5).

    return (
        <div className={`bg-white border text-gray-800 border-gray-200 rounded-xl overflow-hidden ${className}`}>
            {title && (
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-extrabold font-display">{title}</h2>
                </div>
            )}

            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-bold uppercase text-gray-500 tracking-wider border-b border-gray-200">
                {columns.map((col, idx) => (
                    <span key={idx} className={col.className}>
                        {col.header}
                    </span>
                ))}
            </div>

            {/* Body */}
            <div>
                {data.map((row) => (
                    <div
                        key={keyExtractor(row)}
                        onClick={() => onRowClick?.(row)}
                        className={`grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-gray-100 last:border-b-0 transition-colors 
                            ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                        {columns.map((col, idx) => {
                            let cellContent: React.ReactNode;
                            if (col.render) {
                                cellContent = col.render(row);
                            } else if (col.key) {
                                cellContent = row[col.key] as React.ReactNode;
                            } else {
                                cellContent = null;
                            }

                            return (
                                <div key={idx} className={col.className}>
                                    {cellContent}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
