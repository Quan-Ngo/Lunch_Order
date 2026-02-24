import { useState } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Table } from '@/components/elements/Table';

// --- Mock Data ---
const MOCK_ORDERS = [
    {
        id: '1',
        name: 'Big Block Cook Burger',
        description: 'Extra cheese requested by 3',
        unitPrice: 12.50,
        qty: 24,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCuups2s3au2YGIifn-Mz0rgCLcEGrkWGUSLwGKkyMhUP7GFGmy5vsAKWlm0XybnBYCc1fDnjJnlxtUTN04Vnm2wjQhSBfBKD6xSTBM3WuH970K48CMLQzkq8YnDR9USJV7jU6egrIx4e-WW-gze0wbbLPair4Fh-8iRFFkfB4miCFBdQyO_SeRkUsgxKY5YOKC0wKFHviWf9KcDUQHT82eCPZSxfBGqcO7B5I8bdMS-QHbwULuYHIsBLBjNpLCIsHzsXeuDW0HyPY',
    },
    {
        id: '2',
        name: 'Fresh Garden Salad',
        description: 'Vegan Option',
        unitPrice: 8.00,
        qty: 15,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt3YW5xgtV-Spkk6yQmDxb8ZZUUvX1CRP7h1XMLkb5zqC1wJIUbeNaTNcCxr_N7CRg_q5uNsipAuwjsQtjd68B0YTVIub1TvU_tvH7tY_LIT252pNNuM5Mpxs_QAOd0dzFEaekp1nj6Op2jzObchZTtHWipQT08U7qCJ41T8x9ynBd7hvYBu2F8xDBCHJhqYIxWT1CrsEzJ8HbApne7ZuYxt17qdFcBYf5xWKHGpfAQ7iWwuVcRbShg6c2C9fwfS4oKbam44vJ6eo',
    },
    {
        id: '3',
        name: 'QK Confectionary Cake',
        description: 'Dessert Special',
        unitPrice: 5.00,
        qty: 10,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_5TdRttYl0sI_uTboWbWLfNxqigUHCcT9pTWTG9DPWV2Sw-nfDHcwVrix4RRQeAQ1fu7GRlBQuTXTTU5UMPRLLg-PZzzoKVYS_Qr9KD7tlup6auvE3dbN1VxidNEakph9aPaK0e4uOpt9v-_prAJs_13cWAC0u6RE2eRVqOEG3csARFpcM7H6vlrGFPp00VvIUQexKIAy1UByODNc1jEuVIqCKtaXecrKlmleDlfepcXdDgAJEdE_0_aihUl8kF32PYA0ejRe3Tk',
    },
    {
        id: '4',
        name: 'Dim Sum Platter',
        description: 'Shared Plate',
        unitPrice: 0.50,
        qty: 5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbzhUjWuNQ-Hqd5DMPYponjBakYrCDT14nkEHQi6LZ9tpQTghSa9P3XQKfZBSBbhzqy0iUmuw_wMLmCmUaPQIn3BfXzsIOUbfQnaYx_0ELwRY9lmjjNof6Qc9lWrmUsDpd6gJ5wIBgKl-iQ0JQlshaU10fN2T3RmswfxwtBW8oSIZ3Rc63JwPQPb9bdIyzENl9Tynr-Iy9rL_IGk3Y061oOCDJM9D70F-EwVD52P7kYvMJQZvKvIZBY_IvP7HKycqhqudem3kUxx4',
    },
];

function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

export default function DailyOrders() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date(2023, 9, 24)); // Oct 24, 2023
    const [orderNote, setOrderNote] = useState<string>('');

    const subtotal: number = MOCK_ORDERS.reduce((sum, o) => sum + o.unitPrice * o.qty, 0);
    const tax: number = subtotal * 0.1;
    const deliveryFee: number = 5.75;
    const total: number = subtotal + tax + deliveryFee;
    const totalQty: number = MOCK_ORDERS.reduce((sum, o) => sum + o.qty, 0);

    const handlePrevDay = () => {
        const prev: Date = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    };

    const handleNextDay = () => {
        const next: Date = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    };

    const dateString: string = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <RootLayout>
            <PageHeader
                title="Daily Orders"
                description="Manage and track today's office lunch orders efficiently."
            >
                {/* Date Navigator */}
                <div className="flex items-center gap-3 border-2 border-black rounded-lg px-4 py-2 bg-white shadow-[var(--shadow-neobrutalism-sm)]">
                    <button
                        onClick={handlePrevDay}
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label="Previous day"
                    >
                        <span className="material-icons-outlined text-xl">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="material-icons-outlined text-lg text-gray-500">calendar_today</span>
                        <span className="font-bold text-sm">{dateString}</span>
                    </div>
                    <button
                        onClick={handleNextDay}
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label="Next day"
                    >
                        <span className="material-icons-outlined text-xl">chevron_right</span>
                    </button>
                </div>
            </PageHeader>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* === LEFT COLUMN (2/3) === */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Total Order Value */}
                    <SoftCard className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">Total Order Value</p>
                            <p className="text-4xl font-extrabold text-black font-display">{formatCurrency(total)}</p>
                        </div>
                        <Badge className="text-base px-4 py-2 rounded-full">{totalQty}</Badge>
                    </SoftCard>

                    {/* Order Details Table */}
                    <Table
                        title="Order Details"
                        data={MOCK_ORDERS}
                        keyExtractor={(row) => row.id}
                        columns={[
                            {
                                header: 'Item',
                                className: 'col-span-5',
                                render: (order) => (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={order.image}
                                            alt={order.name}
                                            className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                        />
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{order.name}</p>
                                            <p className="text-xs text-gray-500">{order.description}</p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                header: 'Unit Price',
                                className: 'col-span-3 text-right text-sm font-medium text-gray-600',
                                render: (order) => formatCurrency(order.unitPrice),
                            },
                            {
                                header: 'Qty',
                                className: 'col-span-2 flex justify-center',
                                render: (order) => <Badge>{order.qty}</Badge>,
                            },
                            {
                                header: 'Subtotal',
                                className: 'col-span-2 text-right text-sm font-bold text-gray-900',
                                render: (order) => formatCurrency(order.unitPrice * order.qty),
                            }
                        ]}
                    />

                    {/* Order Notes */}
                    <SoftCard>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons-outlined text-primary text-xl">edit_note</span>
                            <h2 className="text-lg font-extrabold font-display">Order Notes</h2>
                        </div>
                        <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Add any special instructions for the restaurant, delivery details, or dietary restriction alerts here..."
                            rows={4}
                            className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary resize-none bg-white"
                        />
                        <div className="flex justify-end mt-3">
                            <Button variant="secondary" size="sm">Save Note</Button>
                        </div>
                    </SoftCard>
                </div>

                {/* === RIGHT COLUMN (1/3) === */}
                <div className="flex flex-col gap-6">

                    {/* Receipt / Bill */}
                    <SoftCard noPadding>
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-extrabold font-display">Receipt / Bill</h2>
                        </div>
                        <div className="p-4">
                            {/* Receipt Image Placeholder */}
                            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg h-48 flex items-center justify-center mb-4">
                                <span className="material-icons-outlined text-amber-400 text-5xl">receipt_long</span>
                            </div>

                            {/* Uploaded File Info */}
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <span className="material-icons-outlined text-gray-400">attach_file</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">Le_Klub_Oct24_Page1.jpg</p>
                                    <p className="text-xs text-gray-500">Uploaded 12:45 PM</p>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="material-icons-outlined text-sm">more_vert</span>
                                </button>
                            </div>

                            {/* Upload More */}
                            <button className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 border-2 border-dashed border-gray-300 rounded-lg py-2.5 hover:border-gray-400 transition-colors">
                                <span className="material-icons-outlined text-base">cloud_upload</span>
                                Upload more pages
                            </button>
                        </div>
                    </SoftCard>

                    {/* Summary */}
                    <SoftCard>
                        <h2 className="text-lg font-extrabold font-display mb-4">Summary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax (10%)</span>
                                <span className="font-medium">{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Delivery Fee</span>
                                <span className="font-medium">{formatCurrency(deliveryFee)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between">
                                <span className="font-extrabold text-base">Total</span>
                                <span className="font-extrabold text-base text-primary">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </SoftCard>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            icon={<span className="material-icons-outlined">download</span>}
                        >
                            Export to PDF
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            icon={<span className="material-icons-outlined">check_circle</span>}
                        >
                            Mark as Complete
                        </Button>
                    </div>

                    {/* Footer note */}
                    <p className="text-xs text-gray-400 text-center">
                        Orders lock automatically at 11:30 AM
                    </p>
                </div>
            </div>
        </RootLayout>
    );
}
