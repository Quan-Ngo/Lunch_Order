import React from 'react';
import Navbar from '@/components/Navbar';

interface RootLayoutProps {
    children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
    return (
        <div className="font-body bg-background-light text-gray-800 min-h-screen flex flex-col pattern-bg">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
                {children}
            </main>
        </div>
    );
}
