import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Table } from '@/components/elements/Table';
import { formatCurrency } from '@/config/currency';
import { statisticsService, foodService, summaryService, dailyMenuService, billService } from '@/services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Helper Functions ---

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
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const billInputRef = useRef<HTMLInputElement>(null);
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

    const { data: bills = [], isLoading: billsLoading } = useQuery({
        queryKey: ['bills', formattedDate],
        queryFn: () => billService.getByDate(formattedDate)
    });

    const { data: isLocked = false } = useQuery({
        queryKey: ['isComplete', formattedDate],
        queryFn: () => dailyMenuService.isDateComplete(formattedDate),
    });

    const uploadBillMutation = useMutation({
        mutationFn: (file: File) => billService.upload(formattedDate, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills', formattedDate] });
        },
        onError: (error) => {
            console.error('Failed to upload bill:', error);
        }
    });

    const deleteBillMutation = useMutation({
        mutationFn: (id: string) => billService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bills', formattedDate] });
        },
        onError: (error) => {
            console.error('Failed to delete bill:', error);
        }
    });

    const markCompleteMutation = useMutation({
        mutationFn: () => dailyMenuService.markCompleteByDate(formattedDate),
        onSuccess: () => {
            setIsCompleteModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['isComplete', formattedDate] });
        },
        onError: (error) => {
            console.error('Failed to mark complete:', error);
        }
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

    const isLoading = statsLoading || catalogLoading || summaryLoading || dailyMenuLoading || billsLoading;

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

    const handleExportPdf = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Load Roboto font to support Vietnamese characters
        try {
            // Fetch raw TTF Roboto font
            const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf');
            const buffer = await response.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = window.btoa(binary);

            // Register font for both normal and bold styles
            // (autoTable uses fontStyle:'bold' in head/foot, so we need bold registered too)
            doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
            doc.setFont('Roboto', 'normal');
        } catch (error) {
            console.error('Failed to load font for PDF:', error);
            doc.setFont('helvetica', 'normal');
        }

        // Title
        doc.setFontSize(20);
        // doc.setFont('helvetica', 'bold'); -> Roboto normal for title to keep it simple since we only loaded normal weight, or we can just use normal and bigger size
        doc.text(t('dailyOrders.pdfTitle'), pageWidth / 2, 20, { align: 'center' });

        // Date
        doc.setFontSize(12);
        doc.text(`${t('dailyOrders.pdfDate')}: ${dateString}`, pageWidth / 2, 30, { align: 'center' });

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 35, pageWidth - 14, 35);

        // Table
        if (orders.length > 0) {
            const tableData = orders.map((order) => [
                order.name,
                formatCurrency(order.unitPrice),
                order.qty.toString(),
                formatCurrency(order.subtotal),
            ]);

            autoTable(doc, {
                startY: 40,
                head: [[
                    t('dailyOrders.table.item'),
                    t('dailyOrders.table.unitPrice'),
                    t('dailyOrders.table.qty'),
                    t('dailyOrders.table.tableSubtotal'),
                ]],
                body: tableData,
                foot: [[
                    t('dailyOrders.total'),
                    '',
                    totalQty.toString(),
                    formatCurrency(total),
                ]],
                theme: 'grid',
                headStyles: { fillColor: [255, 214, 0], textColor: [0, 0, 0], fontStyle: 'bold', font: 'Roboto' },
                footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', font: 'Roboto' },
                styles: { fontSize: 10, font: 'Roboto' },
            });
        } else {
            doc.setFontSize(11);
            doc.text(t('dailyOrders.noOrders'), pageWidth / 2, 50, { align: 'center' });
        }

        // Notes section
        if (orderNote) {
            const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
            doc.setFontSize(12);
            doc.text(t('dailyOrders.orderNotes') + ':', 14, finalY + 15);
            doc.setFontSize(10);
            const splitNotes = doc.splitTextToSize(orderNote, pageWidth - 28);
            doc.text(splitNotes, 14, finalY + 23);
        }

        doc.save(`lunch-order-${selectedDate}.pdf`);
    };

    return (
        <RootLayout>
            <PageHeader
                title={t('dailyOrders.title')}
                description={t('dailyOrders.description')}
            >
                <div className="flex items-center gap-1 border-2 border-black rounded-lg px-2 py-1.5 bg-white shadow-[var(--shadow-neobrutalism-sm)]">
                    <button
                        type="button"
                        onClick={() => {
                            const d = new Date(`${selectedDate}T00:00:00`);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(toISODate(d));
                        }}
                        className="text-gray-400 hover:text-black transition-colors p-1 flex items-center justify-center rounded hover:bg-gray-100"
                        title={t('catalog.previousLine', 'Previous day')}
                    >
                        <span className="material-icons-outlined text-xl leading-none">chevron_left</span>
                    </button>

                    <button
                        type="button"
                        onClick={openDatePicker}
                        className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded transition-colors"
                        aria-label={t('dailyOrders.datePickerAria', 'Open date picker')}
                    >
                        <span className="material-icons-outlined text-xl text-gray-600">calendar_today</span>
                        <span className="font-bold text-sm select-none">{dateString}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const d = new Date(`${selectedDate}T00:00:00`);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(toISODate(d));
                        }}
                        className="text-gray-400 hover:text-black transition-colors p-1 flex items-center justify-center rounded hover:bg-gray-100"
                        title={t('catalog.nextLine', 'Next day')}
                    >
                        <span className="material-icons-outlined text-xl leading-none">chevron_right</span>
                    </button>

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
                            disabled={isLocked}
                            className={`w-full border-2 border-gray-200 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary resize-none ${isLocked ? 'bg-gray-100 cursor-not-allowed opacity-70' : 'bg-white'}`}
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
                                disabled={saveNoteMutation.isPending || isLocked}
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
                            {/* Uploaded Bills */}
                            {bills.length > 0 ? (
                                <div className="space-y-3 mb-4">
                                    {bills.map((bill) => (
                                        <div key={bill.ID}>
                                            {/* Bill Image Preview */}
                                            {bill.mediaType.startsWith('image/') && (
                                                <div className="rounded-lg border-2 border-gray-200 overflow-hidden mb-2">
                                                    <img
                                                        src={billService.getContentUrl(bill.ID)}
                                                        alt={bill.fileName}
                                                        className="w-full h-auto max-h-64 object-contain bg-gray-50"
                                                    />
                                                </div>
                                            )}
                                            {/* File Info */}
                                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <span className="material-icons-outlined text-gray-400">attach_file</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{bill.fileName}</p>
                                                    <p className="text-xs text-gray-500">{t('dailyOrders.uploaded')}</p>
                                                </div>
                                                <button
                                                    onClick={() => deleteBillMutation.mutate(bill.ID)}
                                                    disabled={deleteBillMutation.isPending || isLocked}
                                                    className={`transition-colors ${isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                                                    title={t('catalog.delete')}
                                                >
                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Empty state placeholder */
                                <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg h-32 flex flex-col items-center justify-center mb-4">
                                    <span className="material-icons-outlined text-amber-400 text-4xl">receipt_long</span>
                                    <p className="text-xs text-amber-500 mt-1 font-medium">{t('dailyOrders.noBills')}</p>
                                </div>
                            )}

                            {/* Upload button */}
                            <input
                                ref={billInputRef}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                disabled={isLocked}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        uploadBillMutation.mutate(file);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={() => billInputRef.current?.click()}
                                disabled={uploadBillMutation.isPending || isLocked}
                                className={`w-full flex items-center justify-center gap-2 text-sm font-bold border-2 border-dashed rounded-lg py-2.5 transition-colors ${isLocked
                                    ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-gray-800 border-gray-300 hover:border-gray-400'
                                    }`}
                            >
                                <span className="material-icons-outlined text-base">cloud_upload</span>
                                {uploadBillMutation.isPending ? t('dailyOrders.uploading') : t('dailyOrders.uploadMore')}
                            </button>
                        </div>
                    </SoftCard>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            icon={<span className="material-icons-outlined">download</span>}
                            onClick={handleExportPdf}
                        >
                            {t('dailyOrders.exportPdf')}
                        </Button>
                        {isLocked ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-50 border-2 border-green-300 text-green-700 font-semibold text-sm">
                                <span className="material-icons text-sm">lock</span>
                                {t('dailyOrders.isLocked')}
                            </div>
                        ) : (
                            <Button
                                variant="primary"
                                fullWidth
                                disabled={markCompleteMutation.isPending}
                                icon={<span className="material-icons-outlined">check_circle</span>}
                                onClick={() => setIsCompleteModalOpen(true)}
                            >
                                {markCompleteMutation.isPending ? t('dailyOrders.markCompleting') : t('dailyOrders.markComplete')}
                            </Button>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Confirm Complete Modal ─────────────────────────────────────── */}
            {isCompleteModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsCompleteModalOpen(false)}
                >
                    <div
                        className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between bg-primary px-6 py-4 border-b-4 border-black">
                            <div className="flex items-center gap-2">
                                <span className="material-icons text-black">verified</span>
                                <h3 className="text-lg font-black uppercase tracking-tight font-display">
                                    {t('dailyOrders.completeModal.title')}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsCompleteModalOpen(false)}
                                className="text-black hover:opacity-70 transition-opacity"
                            >
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5">
                            <div className="flex gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl mb-6">
                                <span className="material-icons text-amber-500 flex-shrink-0 mt-0.5">warning</span>
                                <p className="text-sm font-semibold text-gray-800">
                                    {t('dailyOrders.completeModal.body')}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCompleteModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border-2 border-black font-bold text-sm uppercase tracking-tight hover:bg-gray-100 transition-colors"
                                >
                                    {t('dailyOrders.completeModal.cancel')}
                                </button>
                                <button
                                    onClick={() => markCompleteMutation.mutate()}
                                    disabled={markCompleteMutation.isPending}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary border-2 border-black font-bold text-sm uppercase tracking-tight hover:bg-primary-hover transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {markCompleteMutation.isPending ? t('dailyOrders.markCompleting') : t('dailyOrders.completeModal.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </RootLayout>
    );
}
