import { useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RootLayout } from '@/layouts/RootLayout';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { Table } from '@/components/elements/Table';
import { formatPriceLabel } from '@/config/currency';
import { useFormatters } from '@/hooks/useFormatters';
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
    const { formatPriceLabel: fmtPriceLabel, formatDate } = useFormatters();
    const [selectedDate, setSelectedDate] = useState<string>(toISODate(new Date()));
    const [orderNote, setOrderNote] = useState<string>('');
    const [showSavedText, setShowSavedText] = useState<boolean>(false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState<boolean>(false);
    const [billCarouselIndex, setBillCarouselIndex] = useState<number>(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [deleteBillTarget, setDeleteBillTarget] = useState<string | null>(null);
    const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState<boolean>(false);
    const [supplierEmail, setSupplierEmail] = useState<string>('');

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isEmailValid = isValidEmail(supplierEmail);
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
            queryClient.invalidateQueries({ queryKey: ['bills', formattedDate] });
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
        mutationFn: () => dailyMenuService.completeOrder(formattedDate),
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

    const sendOrderMutation = useMutation({
        mutationFn: ({ date, email }: { date: string; email: string }) =>
            dailyMenuService.sendOrderToSupplier(date, email),
        onSuccess: () => {
            setIsSendEmailModalOpen(false);
            setSupplierEmail('');
            toast.success('Email sent to supplier successfully.');
        },
        onError: (error) => {
            console.error('Failed to send order to supplier:', error);
            toast.error('Failed to send email to supplier');
        },
    });

    const isLoading = statsLoading || catalogLoading || summaryLoading || dailyMenuLoading || billsLoading;

    const orders = orderStats.map((stat) => {
        const catalogItem = catalogItems.find(c => c.ID === stat.CatalogID);
        return {
            id: stat.CatalogID,
            name: stat.CatalogName,
            description: stat.CatalogDescription,
            unitPrice: stat.CatalogPrice,
            currency: stat.CatalogCurrency || catalogItem?.currency || 'VND',
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
    const dateString = formatDate(selectedDate);

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
                formatPriceLabel(order.unitPrice, order.currency || 'VND', i18n.language),
                order.qty.toString(),
                formatPriceLabel(order.subtotal, order.currency || 'VND', i18n.language),
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
                    formatPriceLabel(total, orders[0]?.currency || 'VND', i18n.language),
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
                            <p className="text-4xl font-extrabold text-black font-display">{fmtPriceLabel(total, orders[0]?.currency || 'VND')}</p>
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
                                    render: (order) => fmtPriceLabel(order.unitPrice, order.currency),
                                },
                                {
                                    header: t('dailyOrders.table.qty'),
                                    className: 'col-span-2 flex justify-center',
                                    render: (order) => <Badge>{order.qty}</Badge>,
                                },
                                {
                                    header: t('dailyOrders.table.tableSubtotal'),
                                    className: 'col-span-3 sm:col-span-2 text-right text-xs sm:text-sm font-bold text-gray-900',
                                    render: (order) => fmtPriceLabel(order.subtotal, order.currency),
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
                            {/* Bill Images Carousel */}
                            {bills.length > 0 ? (
                                <div className="mb-4">
                                    {/* Image carousel for image bills */}
                                    {bills.some(b => b.mediaType.startsWith('image/')) && (() => {
                                        const imageBills = bills.filter(b => b.mediaType.startsWith('image/'));
                                        const currentIndex = Math.min(billCarouselIndex, imageBills.length - 1);
                                        const currentBill = imageBills[currentIndex];
                                        return (
                                            <div className="relative rounded-xl border-2 border-gray-200 overflow-hidden mb-3 bg-gray-50">
                                                {/* Image - landscape format */}
                                                <div
                                                    className="w-full aspect-video relative overflow-hidden cursor-zoom-in"
                                                    onClick={() => {
                                                        const imageBillsForClick = bills.filter(b => b.mediaType.startsWith('image/'));
                                                        const clickedIdx = imageBillsForClick.findIndex(b => b.ID === currentBill.ID);
                                                        setLightboxIndex(clickedIdx >= 0 ? clickedIdx : 0);
                                                    }}
                                                    title="Click to enlarge"
                                                >
                                                    <img
                                                        src={billService.getContentUrl(currentBill.ID)}
                                                        alt={currentBill.fileName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Lock overlay when locked */}
                                                    {isLocked && (
                                                        <div className="absolute inset-0 bg-black/5" />
                                                    )}
                                                </div>
                                                {/* Arrows - only if multiple images */}
                                                {imageBills.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => setBillCarouselIndex((currentIndex - 1 + imageBills.length) % imageBills.length)}
                                                            className="absolute left-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors drop-shadow-md"
                                                        >
                                                            <span className="material-icons text-4xl font-thin">chevron_left</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setBillCarouselIndex((currentIndex + 1) % imageBills.length)}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors drop-shadow-md"
                                                        >
                                                            <span className="material-icons text-4xl">chevron_right</span>
                                                        </button>
                                                        {/* Dot indicators */}
                                                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                                                            {imageBills.map((_, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => setBillCarouselIndex(idx)}
                                                                    className={`w-2.5 h-2.5 rounded-full transition-all border border-black/20 ${idx === currentIndex
                                                                        ? 'bg-primary scale-125 shadow-sm'
                                                                        : 'bg-primary/40 hover:bg-primary/70'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}
                                    {/* File list for all bills */}
                                    <div className="space-y-2">
                                        {bills.map((bill) => (
                                            <div key={bill.ID} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                                                <span className="material-icons-outlined text-gray-400 text-lg">attach_file</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{bill.fileName}</p>
                                                    <p className="text-xs text-gray-500">{t('dailyOrders.uploaded')}</p>
                                                </div>
                                                <button
                                                    onClick={() => setDeleteBillTarget(bill.ID)}
                                                    disabled={isLocked}
                                                    className={`transition-colors ${isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                                                    title={t('catalog.delete')}
                                                >
                                                    <span className="material-icons-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
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
                            variant="primary"
                            fullWidth
                            icon={<span className="material-icons-outlined">email</span>}
                            onClick={() => setIsSendEmailModalOpen(true)}
                        >
                            {t('dailyOrders.sendEmailToSupplier', 'Send email to supplier')}
                        </Button>
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
                        ) : bills.length === 0 ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-700 text-sm font-medium">
                                <span className="material-icons-outlined text-base">receipt_long</span>
                                <span>{t('dailyOrders.uploadBillFirst', 'Upload a bill before marking complete')}</span>
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

            {/* ── Bill Image Lightbox ───────────────────────────────────────── */}
            {lightboxIndex !== null && (() => {
                const imageBills = bills.filter(b => b.mediaType.startsWith('image/'));
                const safeIndex = Math.min(lightboxIndex, imageBills.length - 1);
                const currentBill = imageBills[safeIndex];
                if (!currentBill) return null;
                return (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Close button */}
                        <button
                            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center transition-colors z-10"
                            onClick={() => setLightboxIndex(null)}
                        >
                            <span className="material-icons">close</span>
                        </button>

                        {/* Counter */}
                        {imageBills.length > 1 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-bold bg-black/40 px-3 py-1 rounded-full">
                                {safeIndex + 1} / {imageBills.length}
                            </div>
                        )}

                        {/* Left arrow */}
                        {imageBills.length > 1 && (
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors drop-shadow-lg z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((safeIndex - 1 + imageBills.length) % imageBills.length); }}
                            >
                                <span className="material-icons leading-none" style={{ fontSize: '5rem', lineHeight: 1 }}>chevron_left</span>
                            </button>
                        )}

                        {/* Image */}
                        <img
                            src={billService.getContentUrl(currentBill.ID)}
                            alt={currentBill.fileName}
                            className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Right arrow */}
                        {imageBills.length > 1 && (
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-hover transition-colors drop-shadow-lg z-10"
                                onClick={(e) => { e.stopPropagation(); setLightboxIndex((safeIndex + 1) % imageBills.length); }}
                            >
                                <span className="material-icons leading-none" style={{ fontSize: '5rem', lineHeight: 1 }}>chevron_right</span>
                            </button>
                        )}

                        {/* Dot indicators */}
                        {imageBills.length > 1 && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                                {imageBills.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                                        className={`w-3 h-3 rounded-full transition-all border border-black/20 ${idx === safeIndex
                                            ? 'bg-primary scale-125 shadow-sm'
                                            : 'bg-primary/40 hover:bg-primary/70'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
            {/* ── Delete Bill Confirmation Modal ───────────────────────────── */}
            {deleteBillTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setDeleteBillTarget(null)}
                >
                    <div
                        className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-red-100 border-2 border-red-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-icons text-red-500 text-2xl">delete_forever</span>
                            </div>
                            <h3 className="text-xl font-black font-display mb-2">{t('dailyOrders.deleteBillTitle', 'Delete Receipt?')}</h3>
                            <p className="text-gray-500 text-sm">{t('dailyOrders.deleteBillDesc', 'This action cannot be undone.')}</p>
                        </div>
                        <div className="flex border-t-2 border-black">
                            <button
                                onClick={() => setDeleteBillTarget(null)}
                                className="flex-1 px-4 py-3 font-bold text-sm hover:bg-gray-50 transition-colors border-r-2 border-black"
                            >
                                {t('manageMenu.cancel', 'Cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    deleteBillMutation.mutate(deleteBillTarget);
                                    setDeleteBillTarget(null);
                                }}
                                disabled={deleteBillMutation.isPending}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-70"
                            >
                                {t('catalog.delete', 'Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Send Email to Supplier Modal ──────────────────────────────── */}
            {isSendEmailModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsSendEmailModalOpen(false)}
                >
                    {/* Outer wrapper — positions the floating header relative to the card */}
                    <div
                        className="relative w-full max-w-[453px] mx-4 mt-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Floating yellow title badge — sits above the card, overflow-hidden prevents text spill */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[80%] z-10 overflow-hidden">
                            <div className="bg-primary border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 text-center">
                                <h3 className="text-base font-black uppercase tracking-tight font-display">
                                    {t('dailyOrders.sendEmailModal.title', 'Send Order to Supplier')}
                                </h3>
                            </div>
                        </div>

                        {/* X close button — direct child of outer wrapper, z-30 always above badge z-10 */}
                        <button
                            onClick={() => setIsSendEmailModalOpen(false)}
                            className="absolute top-2 right-3 z-30 text-black hover:opacity-60 transition-opacity"
                        >
                            <span className="material-icons text-xl">close</span>
                        </button>

                        {/* White modal card */}
                        <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] pt-10">

                            {/* Modal Body */}
                            <div className="px-6 pb-6 pt-2 flex flex-col gap-4">
                                {/* Email Input */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-800 mb-2">
                                        {t('dailyOrders.sendEmailModal.supplierEmailLabel', 'Supplier Email')}
                                    </label>
                                    <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-3 transition-colors ${supplierEmail === ''
                                        ? 'border-gray-300 bg-white'
                                        : isEmailValid
                                            ? 'border-green-400 bg-green-50'
                                            : 'border-red-400 bg-red-50'
                                        }`}>
                                        <span className={`material-icons-outlined text-base ${supplierEmail === ''
                                            ? 'text-gray-400'
                                            : isEmailValid
                                                ? 'text-green-500'
                                                : 'text-red-400'
                                            }`}>email</span>
                                        <input
                                            type="email"
                                            value={supplierEmail}
                                            onChange={(e) => setSupplierEmail(e.target.value)}
                                            placeholder={t('dailyOrders.sendEmailModal.emailPlaceholder', 'Enter supplier email...')}
                                            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400"
                                            autoFocus
                                        />
                                        {supplierEmail !== '' && (
                                            <span className={`material-icons text-base ${isEmailValid ? 'text-green-500' : 'text-red-400'
                                                }`}>
                                                {isEmailValid ? 'check_circle' : 'cancel'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                        {t('dailyOrders.sendEmailModal.hint', 'Requires a valid email address to send')}
                                    </p>
                                </div>

                                {/* Send Button */}
                                <button
                                    disabled={!isEmailValid || sendOrderMutation.isPending}
                                    onClick={() => {
                                        sendOrderMutation.mutate({ date: formattedDate, email: supplierEmail });
                                    }}
                                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest border-2 transition-all ${isEmailValid && !sendOrderMutation.isPending
                                        ? 'bg-primary border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer'
                                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {sendOrderMutation.isPending
                                        ? t('dailyOrders.sendEmailModal.sending', 'Sending...')
                                        : t('dailyOrders.sendEmailModal.sendButton', 'Send Order')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </RootLayout>
    );
}
