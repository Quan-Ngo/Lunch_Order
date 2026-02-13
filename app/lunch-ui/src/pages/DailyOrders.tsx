import Navbar from '@/components/Navbar';

export default function DailyOrders() {
    return (
        <div className="font-body bg-background-light text-gray-800 min-h-screen flex flex-col pattern-bg">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2 font-display">
                    Daily Orders
                </h1>
                <p className="text-gray-600 font-body">Daily orders dashboard will appear here.</p>
            </main>
        </div>
    );
}
