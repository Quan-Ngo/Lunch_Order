import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { billService, dailyMenuService, employeeService, staffCatalogService } from '@/services/api';
import { type QuickOrderItem, QuickOrderSidebar } from '@/components/elements/QuickOrderSidebar';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

function areStringArraysEqual(a: string[], b: string[]) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => value === b[index]);
}

function toCurrencyNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
}

const getQuickOrderHistorySelectedTabKey = (staffId: string) =>
    `quick-order-history:selected-tab:${staffId}`;

export default function QuickOrderHistory() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedQuickOrderId, setSelectedQuickOrderId] = useState<string | null>(null);
    const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [isEditingChoice, setIsEditingChoice] = useState(true);
    const staffId = currentUser?.staff?.ID || '';

    useEffect(() => {
        if (!staffId) return;

        const savedQuickOrderId = sessionStorage.getItem(getQuickOrderHistorySelectedTabKey(staffId));
        if (savedQuickOrderId) {
            setSelectedQuickOrderId((prev) => prev ?? savedQuickOrderId);
        }
    }, [staffId]);

    const { data: invitedQuickOrders = [], refetch: refetchInvitedQuickOrders } = useQuery({
        queryKey: ['invitedQuickOrders', staffId],
        queryFn: () => dailyMenuService.getInvitedQuickOrdersByStaff(staffId),
        enabled: !!staffId,
        refetchOnMount: 'always',
    });
    const { data: staffMembers = [] } = useQuery({
        queryKey: ['staffMembersForQuickOrderHistory'],
        queryFn: employeeService.getAll,
        refetchOnMount: 'always',
    });

    useEffect(() => {
        if (!staffId) return;
        void queryClient.invalidateQueries({ queryKey: ['invitedQuickOrders', staffId] });
        void refetchInvitedQuickOrders();
    }, [location.key, queryClient, refetchInvitedQuickOrders, staffId]);

    useEffect(() => {
        if (!staffId) return;
        void refetchInvitedQuickOrders();
    }, [refetchInvitedQuickOrders, staffId]);

    useEffect(() => {
        if (!invitedQuickOrders.length) {
            setSelectedQuickOrderId(null);
            setSelectedCatalogIds([]);
            return;
        }

        if (!selectedQuickOrderId || !invitedQuickOrders.some((menu) => menu.ID === selectedQuickOrderId)) {
            const fallbackQuickOrderId = invitedQuickOrders[0].ID;
            setSelectedQuickOrderId(fallbackQuickOrderId);
            if (staffId) {
                sessionStorage.setItem(getQuickOrderHistorySelectedTabKey(staffId), fallbackQuickOrderId);
            }
        }
    }, [invitedQuickOrders, selectedQuickOrderId, staffId]);

    const formatSidebarDate = (date: string) => {
        if (!date) return '';

        const now = new Date();
        const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 10);

        if (date === localToday) return 'TODAY';

        return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
        }).toUpperCase();
    };

    const mapStatus = (status: 'open' | 'close' | 'complete'): QuickOrderItem['status'] => {
        if (status === 'complete') return 'COMPLETED';
        if (status === 'close') return 'CLOSED';
        return 'OPEN';
    };

    const getDetailStatusStyle = (status: QuickOrderItem['status']) => {
        const base = 'border-[3px] border-[#0c0f0f] px-5 py-1.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-extrabold text-lg uppercase rounded-lg inline-block italic';
        switch (status) {
            case 'COMPLETED':
                return `bg-[#4ade80] text-white ${base}`;
            case 'CLOSED':
                return `bg-[#f95630] text-[#520c00] ${base}`;
            case 'OPEN':
            default:
                return `bg-[#ffd709] text-[#0c0f0f] ${base}`;
        }
    };

    const historyItems: QuickOrderItem[] = invitedQuickOrders.map((menu, index) => {
        const itemCount = menu.catalogs?.length ?? 0;
        return {
            id: menu.ID,
            date: formatSidebarDate(menu.date),
            status: mapStatus(menu.status),
            title: menu.name || 'UNTITLED MENU',
            details: `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}`,
            isActive: selectedQuickOrderId ? menu.ID === selectedQuickOrderId : index === 0,
        };
    });

    const selectedQuickOrder =
        invitedQuickOrders.find((menu) => menu.ID === selectedQuickOrderId) ??
        invitedQuickOrders[0] ??
        null;
    const creatorIdentity = selectedQuickOrder?.createdBy?.trim().toLowerCase() || '';
    const creatorDisplayName =
        staffMembers.find((staff) => staff.email?.trim().toLowerCase() === creatorIdentity)?.name ||
        (creatorIdentity && currentUser?.name?.trim().toLowerCase() === creatorIdentity
            ? currentUser.staff?.name
            : undefined) ||
        selectedQuickOrder?.createdBy ||
        'Quick order';

    const selectedCatalogs = selectedQuickOrder?.catalogs ?? [];

    const { data: currentStaffOrders = [], refetch: refetchCurrentStaffOrders } = useQuery({
        queryKey: ['quickOrderHistoryStaffOrders', staffId, selectedQuickOrder?.ID, selectedQuickOrder?.date],
        queryFn: () => staffCatalogService.getAllForStaffAndDate(staffId, selectedQuickOrder!.date, selectedQuickOrder!.ID),
        enabled: !!staffId && !!selectedQuickOrder?.date && !!selectedQuickOrder?.ID,
        refetchOnMount: 'always',
    });

    const { data: quickOrderBills = [], refetch: refetchQuickOrderBills } = useQuery({
        queryKey: ['quickOrderHistoryBills', selectedQuickOrder?.ID],
        queryFn: () => billService.getByDailyMenu(selectedQuickOrder!.ID),
        enabled: !!selectedQuickOrder?.ID,
        refetchOnMount: 'always',
    });

    const selectedCatalogIdSet = new Set(selectedCatalogs.map((catalog) => catalog.ID));
    const savedMenuOrders = currentStaffOrders.filter((order) => selectedCatalogIdSet.has(order.Catalog_ID));
    const hasSavedChoice = savedMenuOrders.length > 0;
    const savedCatalogIds = savedMenuOrders.map((order) => order.Catalog_ID).sort();
    const savedComment = savedMenuOrders[0]?.note?.trim() ?? '';
    const isQuickOrderOpen = selectedQuickOrder?.status === 'open';
    const canModifyChoice = isQuickOrderOpen && (!hasSavedChoice || isEditingChoice);
    const lockedSectionClass = !canModifyChoice ? 'bg-[#eef0f2]' : '';
    const lockedTitleClass = !canModifyChoice ? 'text-[#6b7280]' : '';
    const lockedTextClass = !canModifyChoice ? 'text-[#6b7280]' : '';
    const selectedOptionCatalogs = selectedCatalogs.filter((catalog) => selectedCatalogIds.includes(catalog.ID));
    const totalSelectionAmount = selectedOptionCatalogs.reduce(
        (sum, catalog) => sum + toCurrencyNumber(catalog.price),
        0
    );
    const totalSelectionCurrency = selectedOptionCatalogs[0]?.currency || selectedCatalogs[0]?.currency || 'VND';
    const hasSelectionChanged = !areStringArraysEqual(savedCatalogIds, [...selectedCatalogIds].sort());
    const hasCommentChanged = savedComment !== comment.trim();
    const hasPendingChoiceChanges = hasSelectionChanged || hasCommentChanged;

    useEffect(() => {
        if (!staffId || !selectedQuickOrder?.ID || !selectedQuickOrder?.date) return;
        void queryClient.invalidateQueries({
            queryKey: ['quickOrderHistoryStaffOrders', staffId, selectedQuickOrder.ID, selectedQuickOrder.date],
        });
        void refetchCurrentStaffOrders();
    }, [location.key, queryClient, refetchCurrentStaffOrders, selectedQuickOrder?.ID, selectedQuickOrder?.date, staffId]);

    useEffect(() => {
        if (!selectedQuickOrder?.ID) return;
        void queryClient.invalidateQueries({
            queryKey: ['quickOrderHistoryBills', selectedQuickOrder.ID],
        });
        void refetchQuickOrderBills();
    }, [location.key, queryClient, refetchQuickOrderBills, selectedQuickOrder?.ID]);

    useEffect(() => {
        if (!staffId || !selectedQuickOrder?.ID || !selectedQuickOrder?.date) return;
        void refetchCurrentStaffOrders();
    }, [refetchCurrentStaffOrders, selectedQuickOrder?.ID, selectedQuickOrder?.date, staffId]);

    useEffect(() => {
        if (!selectedQuickOrder?.ID) return;
        void refetchQuickOrderBills();
    }, [refetchQuickOrderBills, selectedQuickOrder?.ID]);

    useEffect(() => {
        if (!selectedQuickOrder || !staffId) {
            setSelectedCatalogIds((prev) => (prev.length ? [] : prev));
            setComment((prev) => (prev ? '' : prev));
            return;
        }

        const menuCatalogIds = new Set(selectedCatalogs.map((catalog) => catalog.ID));
        const existingOrder = currentStaffOrders.find(
            (order) => order.Catalog_ID && menuCatalogIds.has(order.Catalog_ID)
        );
        const nextSelectedCatalogIds = currentStaffOrders
            .filter((order) => order.Catalog_ID && menuCatalogIds.has(order.Catalog_ID))
            .map((order) => order.Catalog_ID);
        const nextComment = existingOrder?.note ?? '';

        setSelectedCatalogIds((prev) =>
            areStringArraysEqual(prev, nextSelectedCatalogIds) ? prev : nextSelectedCatalogIds
        );
        setComment((prev) => (prev === nextComment ? prev : nextComment));
    }, [currentStaffOrders, selectedCatalogs, selectedQuickOrder, staffId]);

    useEffect(() => {
        setIsEditingChoice(!hasSavedChoice);
    }, [hasSavedChoice, selectedQuickOrder?.ID]);

    const confirmChoiceMutation = useMutation({
        mutationFn: async () => {
            if (!selectedQuickOrder) throw new Error('No quick order selected');
            if (!staffId) throw new Error('No current user found');

            const menuCatalogIds = new Set(selectedCatalogs.map((catalog) => catalog.ID));
            const existingMenuOrders = currentStaffOrders.filter((order) => menuCatalogIds.has(order.Catalog_ID));
            const nextSelectedIds = new Set(selectedCatalogIds);

            await Promise.all(
                existingMenuOrders
                    .filter((order) => !nextSelectedIds.has(order.Catalog_ID))
                    .map((order) => staffCatalogService.deleteOrder(order.Staff_ID, order.Catalog_ID, order.DailyMenu_ID, order.date))
            );

            await Promise.all(
                selectedCatalogIds.map(async (catalogId) => {
                    const existingSelectedOrder = existingMenuOrders.find((order) => order.Catalog_ID === catalogId);
                    if (existingSelectedOrder) {
                        await staffCatalogService.updateOrderNote(staffId, catalogId, selectedQuickOrder.ID, selectedQuickOrder.date, comment.trim());
                    } else {
                        await staffCatalogService.createOrder(staffId, catalogId, selectedQuickOrder.ID, selectedQuickOrder.date, comment.trim());
                    }
                })
            );
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ['quickOrderHistoryStaffOrders', staffId, selectedQuickOrder?.ID, selectedQuickOrder?.date],
            });
            await queryClient.refetchQueries({
                queryKey: ['quickOrderHistoryStaffOrders', staffId, selectedQuickOrder?.ID, selectedQuickOrder?.date],
                exact: true,
            });
            setIsEditingChoice(false);
            toast.success('Choice saved successfully');
        },
        onError: (error: any) => {
            const backendMessage =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to save your choice';
            toast.error(backendMessage);
        },
    });

    return (
        <div className="bg-[#f6f6f6] font-body text-[#2d2f2f] min-h-screen flex flex-col overflow-x-hidden">
            <Navbar />
            <main className="flex-grow flex flex-col md:flex-row overflow-hidden h-[calc(100vh-80px)]">
                <QuickOrderSidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    title={<>QUICK ORDER<br />HISTORY</>}
                    collapsedIcon="history"
                    collapsedTitle="HISTORY"
                    items={historyItems}
                    onItemClick={(item) => {
                        setSelectedCatalogIds([]);
                        setComment('');
                        setIsEditingChoice(true);
                        setSelectedQuickOrderId(item.id);
                        if (staffId) {
                            sessionStorage.setItem(getQuickOrderHistorySelectedTabKey(staffId), item.id);
                        }
                    }}
                />

                <section className="flex-1 bg-[#f6f6f6] overflow-y-auto relative p-6 md:p-8 transition-all duration-300">
                    {selectedQuickOrder ? (
                        <>
                            <PageHeader
                                title={selectedQuickOrder.name || 'QUICK ORDER'}
                                description={
                                    <div className="inline-flex items-center gap-2 bg-[#0c0f0f] text-[#ffffff] px-3 py-1.5 rounded-full mt-2">
                                        <span className="material-icons-outlined text-[10px]">person</span>
                                        <span className="font-headline font-bold text-[10px] uppercase tracking-wider">
                                            {creatorDisplayName}
                                        </span>
                                    </div>
                                }
                            >
                                <div className="flex flex-col items-end gap-3">
                                    <div className={getDetailStatusStyle(mapStatus(selectedQuickOrder.status))}>
                                        {mapStatus(selectedQuickOrder.status)}
                                    </div>
                                </div>
                            </PageHeader>

                            <div className="flex flex-col lg:flex-row gap-6">
                        <div className="min-w-0 flex flex-col gap-6 lg:flex-[0_0_68%]">
                            <SoftCard className={`border-[#0c0f0f] overflow-visible p-4 lg:p-5 transition-colors ${lockedSectionClass}`}>
                                <h4 className={`font-display font-extrabold text-base uppercase mb-3 flex items-center gap-2 ${lockedTitleClass}`}>
                                    <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[10px]">01</span>
                                    Select Option
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {selectedCatalogs.length > 0 ? (
                                        selectedCatalogs.map((catalog) => (
                                            <button
                                                key={catalog.ID}
                                                className={`w-full px-3 py-2 flex flex-col items-start gap-0.5 transition-all rounded-lg border-2 text-left ${
                                                    !canModifyChoice
                                                        ? selectedCatalogIds.includes(catalog.ID)
                                                            ? 'bg-[#ffd709] border-[#0c0f0f] shadow-[2px_2px_0px_#0c0f0f] opacity-80 cursor-not-allowed'
                                                            : 'bg-[#ffffff] border-[#acadad] cursor-not-allowed'
                                                        : selectedCatalogIds.includes(catalog.ID)
                                                        ? 'bg-[#ffd709] border-[#0c0f0f] shadow-[2px_2px_0px_#0c0f0f]'
                                                        : 'bg-[#ffffff] border-[#acadad] hover:border-[#0c0f0f] hover:shadow-[2px_2px_0px_#0c0f0f]'
                                                }`}
                                                type="button"
                                                disabled={!canModifyChoice}
                                                onClick={() => {
                                                    setSelectedCatalogIds((prev) =>
                                                        prev.includes(catalog.ID)
                                                            ? prev.filter((id) => id !== catalog.ID)
                                                            : [...prev, catalog.ID]
                                                    );
                                                }}
                                            >
                                                <span className={`font-headline font-bold text-xs uppercase ${!canModifyChoice && selectedCatalogIds.includes(catalog.ID) ? 'italic' : selectedCatalogIds.includes(catalog.ID) ? 'italic' : ''}`}>
                                                    {catalog.name || 'Untitled item'}
                                                </span>
                                                <span className={`font-body text-[11px] font-bold ${!canModifyChoice && selectedCatalogIds.includes(catalog.ID) ? 'opacity-80' : selectedCatalogIds.includes(catalog.ID) ? 'opacity-70' : 'text-[#5a5c5c]'}`}>
                                                    {catalog.currency || 'VND'} {toCurrencyNumber(catalog.price).toFixed(2)}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className={`col-span-full border-2 border-dashed border-[#acadad] rounded-lg px-4 py-6 text-center ${!canModifyChoice ? 'bg-[#f3f4f6]' : ''}`}>
                                            <span className={`font-headline font-bold text-xs uppercase ${lockedTextClass || 'text-[#5a5c5c]'}`}>
                                                No menu items found
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </SoftCard>

                            <SoftCard className={`border-[#0c0f0f] p-4 lg:p-5 overflow-visible transition-colors ${lockedSectionClass}`}>
                                <h4 className={`font-display font-extrabold text-base uppercase mb-3 flex items-center gap-2 ${lockedTitleClass}`}>
                                    <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[10px]">03</span>
                                    Add Comments
                                </h4>
                                <textarea
                                    className={`w-full h-20 neo-input p-2.5 text-sm resize-none placeholder:text-[#acadad] ${!canModifyChoice ? 'bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db] cursor-not-allowed' : ''}`}
                                    placeholder="Add special requests or notes for the kitchen..."
                                    value={comment}
                                    disabled={!canModifyChoice}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </SoftCard>

                            <div className="pt-4 border-t-2 border-dashed border-[#dbdddd]">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <span className="font-headline font-bold text-[10px] uppercase tracking-widest text-[#5a5c5c] block mb-1">Total Selection</span>
                                        <div className="font-display font-extrabold text-3xl text-[#0c0f0f]">
                                            {totalSelectionCurrency} {totalSelectionAmount.toFixed(2)}
                                        </div>
                                    </div>
                                    <span className="font-body text-[10px] text-[#5a5c5c] font-medium">Incl. service &amp; taxes</span>
                                </div>
                                {hasSavedChoice && !isEditingChoice ? (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        className="py-4 text-base"
                                        onClick={() => setIsEditingChoice(true)}
                                        disabled={!isQuickOrderOpen}
                                    >
                                        Edit Choice
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        size="lg"
                                        className="py-4 text-base"
                                        onClick={() => confirmChoiceMutation.mutate()}
                                        disabled={
                                            !isQuickOrderOpen ||
                                            confirmChoiceMutation.isPending ||
                                            !hasPendingChoiceChanges
                                        }
                                    >
                                        Confirm Choice
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 flex flex-col gap-4 lg:flex-[0_0_32%]">
                            <h4 className="font-display font-extrabold text-lg uppercase flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">02</span>
                                Bill
                            </h4>
                            <SoftCard className="w-full max-w-full border-[#0c0f0f] p-3 text-center transition-colors group relative overflow-visible flex flex-col gap-2">
                                {selectedQuickOrder?.isShare ? (
                                    <>
                                        {quickOrderBills.length > 0 && (
                                            <div className="absolute top-[-10px] right-[-10px] z-10">
                                                <Badge className="bg-[#a03a0f] text-white px-2 py-0.5 border-2 border-[#0c0f0f] text-[7px] tracking-widest sticker-rotate-right">Verified</Badge>
                                            </div>
                                        )}
                                        {quickOrderBills.length > 0 ? (
                                            quickOrderBills[0].mediaType.startsWith('image/') ? (
                                                <a
                                                    href={billService.getContentUrl(quickOrderBills[0].ID)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <img
                                                        alt={quickOrderBills[0].fileName}
                                                        className="w-[85%] mx-auto h-auto max-h-[300px] object-contain rounded-lg filter grayscale contrast-125 border border-dashed border-[#e4e4e7] p-1 bg-white"
                                                        src={billService.getContentUrl(quickOrderBills[0].ID)}
                                                    />
                                                </a>
                                            ) : (
                                                <a
                                                    href={billService.getContentUrl(quickOrderBills[0].ID)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-[85%] mx-auto h-[220px] rounded-lg border-2 border-dashed border-[#e4e4e7] bg-white flex flex-col items-center justify-center gap-2 text-[#0c0f0f] hover:border-[#0c0f0f] transition-colors"
                                                >
                                                    <span className="material-icons-outlined text-5xl">picture_as_pdf</span>
                                                    <span className="font-headline font-bold text-[11px] uppercase px-4 break-all">
                                                        {quickOrderBills[0].fileName}
                                                    </span>
                                                </a>
                                            )
                                        ) : (
                                            <div className="w-[85%] mx-auto h-[220px] rounded-lg border-2 border-dashed border-[#e4e4e7] bg-white flex flex-col items-center justify-center gap-2 text-[#5a5c5c]">
                                                <span className="material-icons-outlined text-5xl">receipt_long</span>
                                                <span className="font-headline font-bold text-[11px] uppercase">
                                                    No bill uploaded
                                                </span>
                                            </div>
                                        )}
                                        <div className="mt-2 border-t-2 border-dashed border-[#e4e4e7] pt-2">
                                            <div className="flex justify-between font-headline font-bold text-[10px] uppercase">
                                                <span>Total</span>
                                                <span>{totalSelectionCurrency} {totalSelectionAmount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="min-h-[260px] flex flex-col items-center justify-center gap-3 px-4 text-center">
                                        <span className="material-icons-outlined text-5xl text-[#5a5c5c]">money_off</span>
                                        <span className="font-headline font-bold text-xs uppercase text-[#0c0f0f]">
                                            Bill sharing is disabled
                                        </span>
                                        <span className="font-body text-[11px] text-[#5a5c5c] max-w-[220px]">
                                            This quick order does not share the bill, so receipt details are hidden.
                                        </span>
                                    </div>
                                )}
                            </SoftCard>
                        </div>
                            </div>
                        </>
                    ) : null}
                </section>
            </main>
        </div>
    );
}
