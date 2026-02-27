import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Table } from '@/components/elements/Table';
import { statisticsService, foodService, summaryService, dailyMenuService } from '@/services/api';

// --- Helper Functions ---

function formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
}

function toISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function DailyOrders() {
    const { t, i18n } = useTranslation();
    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
    const [orderNote, setOrderNote] = useState<string>('');
    const [showSavedText, setShowSavedText] = useState<boolean>(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const formattedDate = selectedDate;

    const { data: orderStats = [], isLoading: statsLoading } = useQuery({
        queryKey: ['orderStatistics', formattedDate],
        queryFn: () => statisticsService.getByDate(formattedDate)
    });

    const { data: catalogItems = [], isLoading: catalogLoading } = useQuery({
        queryKey: ['catalog'],
        queryFn: foodService.getAll
    });

    const { data: summary, isLoading: summaryLoading } = useQuery({
        queryKey: ['orderSummary', formattedDate],
        queryFn: () => summaryService.getByDate(formattedDate)
    });

    const { data: dailyMenus = [], isLoading: dailyMenuLoading } = useQuery({
        queryKey: ['dailyMenu', formattedDate],
        queryFn: () => dailyMenuService.getByDate(formattedDate)
    });

    useEffect(() => {
        if (dailyMenus.length > 0) {
            const menuWithNote = dailyMenus.find(m => m.note);
            setOrderNote(menuWithNote?.note || '');
        } else {
            setOrderNote('');
        }
    }, [dailyMenus]);

    const saveNoteMutation = useMutation({
        mutationFn: async (note: string) => {
            if (dailyMenus.length > 0) {
                await dailyMenuService.updateNote(dailyMenus[0].ID, note);
            } else {
                await dailyMenuService.createNote(formattedDate, note);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dailyMenu', formattedDate] });
            setShowSavedText(true);
            setTimeout(() => {
                setShowSavedText(false);
            }, 3000);
        },
        onError: (error) => {
            console.error('Failed to save note:', error);
            setShowSavedText(false);
        }
    });

    const isLoading = statsLoading || catalogLoading || summaryLoading || dailyMenuLoading;

    const orders = orderStats.map((stat) => {
        const catalogItem = catalogItems.find(c => c.ID === stat.CatalogID);
        return {
            id: stat.CatalogID,
            name: stat.CatalogName,
            description: stat.CatalogDescription,
            unitPrice: stat.CatalogPrice,
            qty: stat.OrderCount,
            image: catalogItem?.image || 'https://via.placeholder.com/150',
            subtotal: stat.SubTotal
        };
    });

    const subtotal: number = summary?.TotalAmount || 0;
    const total: number = subtotal;
    const totalQty: number = summary?.TotalOrders || 0;
    const totalQtyDigits = String(totalQty).length;
    const totalQtyTextClass =
        totalQtyDigits >= 4 ? 'text-[0.65rem]' :
            totalQtyDigits === 3 ? 'text-[0.8rem]' :
                totalQtyDigits === 2 ? 'text-[0.9rem]' :
                    'text-[1rem]';
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const dateString = dateObj.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const openDatePicker = () => {
        const input = dateInputRef.current;
        if (!input) return;
        const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
        if (pickerInput.showPicker) {
            pickerInput.showPicker();
            return;
        }
        input.click();
    };

    return (
        <RootLayout>
            <PageHeader
                title={t('dailyOrders.title')}
                description={t('dailyOrders.description')}
            >
                <div className="flex items-center gap-3 border-2 border-black rounded-lg px-4 py-2 bg-white shadow-[var(--shadow-neobrutalism-sm)]">
                    <button
                        type="button"
                        onClick={openDatePicker}
                        className="text-gray-600 hover:text-black transition-colors"
                        aria-label={t('dailyOrders.datePickerAria', 'Open date picker')}
                    >
                        <span className="material-icons-outlined text-xl">calendar_today</span>
                    </button>
                    <span className="font-bold text-sm">{dateString}</span>
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                            if (e.target.value) setSelectedDate(e.target.value);
                        }}
                        className="sr-only"
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                </div>
            </PageHeader>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* === LEFT COLUMN (2/3) === */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Total Order Value */}
                    <SoftCard className="flex items-center justify-between border-gray-900">
                        <div>
                            <p className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-1">{t('dailyOrders.totalOrderValue')}</p>
                            <p className="text-4xl font-extrabold text-black font-display">{formatCurrency(total)}</p>
                        </div>
                        <Badge className={`${totalQtyTextClass} w-12 h-12 p-0 rounded-full flex items-center justify-center`}>{totalQty}</Badge>
                    </SoftCard>

                    {/* Order Details Table */}
                    {isLoading ? (
                        <SoftCard>
                            <p className="text-gray-500 text-center py-10">{t('dailyOrders.loadingOrders')}</p>
                        </SoftCard>
                    ) : orders.length === 0 ? (
                        <SoftCard>
                            <p className="text-gray-500 text-center py-10">{t('dailyOrders.noOrders')}</p>
                        </SoftCard>
                    ) : (
                        <Table
                            title={t('dailyOrders.orderDetails')}
                            data={orders}
                            keyExtractor={(row) => row.id}
                            columns={[
                                {
                                    header: t('dailyOrders.table.item'),
                                    className: 'col-span-4 sm:col-span-5',
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
                                    header: t('dailyOrders.table.unitPrice'),
                                    className: 'col-span-3 text-center text-xs sm:text-sm font-medium text-gray-600',
                                    render: (order) => formatCurrency(order.unitPrice),
                                },
                                {
                                    header: t('dailyOrders.table.qty'),
                                    className: 'col-span-2 flex justify-center',
                                    render: (order) => <Badge>{order.qty}</Badge>,
                                },
                                {
                                    header: t('dailyOrders.table.tableSubtotal'),
                                    className: 'col-span-3 sm:col-span-2 text-right text-xs sm:text-sm font-bold text-gray-900',
                                    render: (order) => formatCurrency(order.subtotal),
                                }
                            ]}
                        />
                    )}

                    {/* Order Notes */}
                    <SoftCard className="border-gray-900">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-icons-outlined text-primary text-xl">edit_note</span>
                            <h2 className="text-lg font-extrabold font-display">{t('dailyOrders.orderNotes')}</h2>
                        </div>
                        <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder={t('dailyOrders.notesPlaceholder')}
                            rows={4}
                            className="w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary resize-none bg-white"
                        />
                        <div className="flex justify-end mt-3 items-center gap-3">
                            {showSavedText && (
                                <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-fade-in">
                                    <span className="material-icons-outlined text-sm">check_circle</span>
                                    {t('dailyOrders.noteSaved')}
                                </span>
                            )}
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => saveNoteMutation.mutate(orderNote)}
                                disabled={saveNoteMutation.isPending}
                            >
                                {saveNoteMutation.isPending ? t('dailyOrders.saving') : t('dailyOrders.saveNote')}
                            </Button>
                        </div>
                    </SoftCard>
                </div>

                {/* === RIGHT COLUMN (1/3) === */}
                <div className="flex flex-col gap-6">

                    {/* Receipt / Bill */}
                    <SoftCard noPadding>
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-lg font-extrabold font-display">{t('dailyOrders.receipt')}</h2>
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
                                    <p className="text-xs text-gray-500">{t('dailyOrders.uploaded')}</p>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <span className="material-icons-outlined text-sm">more_vert</span>
                                </button>
                            </div>

                            {/* Upload More */}
                            <button className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 border-2 border-dashed border-gray-300 rounded-lg py-2.5 hover:border-gray-400 transition-colors">
                                <span className="material-icons-outlined text-base">cloud_upload</span>
                                {t('dailyOrders.uploadMore')}
                            </button>
                        </div>
                    </SoftCard>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            icon={<span className="material-icons-outlined">download</span>}
                        >
                            {t('dailyOrders.exportPdf')}
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            icon={<span className="material-icons-outlined">check_circle</span>}
                        >
                            {t('dailyOrders.markComplete')}
                        </Button>
                    </div>

                    {/* Footer note */}
                    {/*<p className="text-xs text-gray-400 text-center">
                        {t('dailyOrders.ordersLockNotice')}
                    </p>*/}
                </div>
            </div>
        </RootLayout>
    );
}
