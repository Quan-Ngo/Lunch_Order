import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';
import { type QuickOrderItem, QuickOrderSidebar } from '@/components/elements/QuickOrderSidebar';
import { AddInvitationModal } from '@/components/fragments/AddInvitationModal';
import { CURRENCY_OPTIONS } from '@/config/currency';
import { billService, dailyMenuService, employeeService, foodService, menuInviteStaffService, staffCatalogService, type CatalogEntity, type StaffEntity } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { exportOrderPdf } from '@/utils/exportOrderPdf';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';

type QuickOrderMenuItem = {
    id?: string;
    name: string;
    price: string;
    currency: string;
};

const EMPTY_MENU_ITEM: QuickOrderMenuItem = { name: '', price: '0.00', currency: 'VND' };
const MENU_ITEMS_PER_PAGE = 5;

const normalizeMenuItem = (item: QuickOrderMenuItem) => ({
    id: item.id,
    name: item.name.trim(),
    currency: item.currency || 'VND',
    price: item.price.trim(),
});

const serializeMenuItem = (item: QuickOrderMenuItem) => {
    const normalized = normalizeMenuItem(item);
    return `${normalized.id || 'new'}|${normalized.name}|${normalized.currency}|${normalized.price}`;
};

const toCurrencyNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

export default function QuickOrderManagement() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [menuItems, setMenuItems] = useState<QuickOrderMenuItem[]>([EMPTY_MENU_ITEM]);
    const [isExtractingMenu, setIsExtractingMenu] = useState(false);
    const [isSavingQuickOrder, setIsSavingQuickOrder] = useState(false);
    const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isSavingInvites, setIsSavingInvites] = useState(false);
    const [selectedQuickOrderId, setSelectedQuickOrderId] = useState<string | null>(null);
    const [selectedMenuPage, setSelectedMenuPage] = useState(1);
    const [selectedMenuName, setSelectedMenuName] = useState('');
    const [selectedIsShareBill, setSelectedIsShareBill] = useState(true);
    const [selectedMenuItems, setSelectedMenuItems] = useState<QuickOrderMenuItem[]>([EMPTY_MENU_ITEM]);
    const [invitedStaff, setInvitedStaff] = useState<StaffEntity[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditingQuickMenu, setIsEditingQuickMenu] = useState(false);
    const [menuName, setMenuName] = useState('');
    const [isShareBill, setIsShareBill] = useState(true);
    const [additionalCost, setAdditionalCost] = useState('0');
    const [additionalCostCurrency, setAdditionalCostCurrency] = useState('VND');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scanMenuInputRef = useRef<HTMLInputElement>(null);
    const billInputRef = useRef<HTMLInputElement>(null);
    const currentStaffId = currentUser?.staff?.ID || '';
    const creatorIdentities = Array.from(
        new Set(
            [
                currentUser?.staff?.email?.trim().toLowerCase(),
                currentUser?.email?.trim().toLowerCase(),
                currentUser?.name?.trim(),
            ].filter((value): value is string => Boolean(value))
        )
    );

    const { data: quickOrders = [] } = useQuery({
        queryKey: ['quickOrders', ...creatorIdentities],
        queryFn: () => dailyMenuService.getQuickOrdersByCreator(creatorIdentities),
        enabled: creatorIdentities.length > 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const selectedQuickOrder =
        quickOrders.find((menu) => menu.ID === selectedQuickOrderId) ??
        quickOrders[0] ??
        null;
    const isSelectedOrderClosed = selectedQuickOrder?.status === 'close';
    const isSelectedOrderCompleted = selectedQuickOrder?.status === 'complete';
    const isQuickMenuEditable = isEditingQuickMenu;
    const ensureCreatorInvited = (staffList: StaffEntity[]) => {
        const uniqueStaff = Array.from(new Map(staffList.map((staff) => [staff.ID, staff])).values());
        if (!currentStaffId) return uniqueStaff;

        const hasCreator = uniqueStaff.some((staff) => staff.ID === currentStaffId);
        if (hasCreator) return uniqueStaff;

        const creatorStaff = activeStaff.find((staff) => staff.ID === currentStaffId) ?? currentUser?.staff;
        return creatorStaff ? [...uniqueStaff, creatorStaff] : uniqueStaff;
    };

    const syncSelectedQuickOrderState = (order: (typeof quickOrders)[number] | null) => {
        if (!order) {
            setSelectedMenuName('');
            setSelectedIsShareBill(true);
            setSelectedMenuItems([{ ...EMPTY_MENU_ITEM }]);
            setAdditionalCost('0');
            setAdditionalCostCurrency('VND');
            setInvitedStaff([]);
            setSelectedMenuPage(1);
            return;
        }

        setSelectedMenuName(order.name || '');
        setSelectedIsShareBill(order.isShare ?? true);
        setAdditionalCost(order.additionalCost?.toString?.() || '0');
        setAdditionalCostCurrency(order.additionalCostCurrency || 'VND');
        setSelectedMenuItems(
            order.catalogs?.length
                ? order.catalogs.map((catalog) => ({
                    id: catalog.ID,
                    name: catalog.name || '',
                    currency: catalog.currency || 'VND',
                    price: catalog.price?.toString?.() || '0.00',
                }))
                : [{ ...EMPTY_MENU_ITEM }]
        );
        setInvitedStaff(
            ensureCreatorInvited(
                order.menuInvites
                    ?.map((invite) => invite.staff)
                    .filter((staff): staff is StaffEntity => Boolean(staff)) ?? []
            )
        );
        setSelectedMenuPage(1);
    };

    const { data: activeStaff = [] } = useQuery({
        queryKey: ['activeStaff'],
        queryFn: employeeService.getAll,
        select: (staff) => staff.filter((employee) => employee.status),
    });

    const { data: bills = [] } = useQuery({
        queryKey: ['quickOrderBills', selectedQuickOrder?.ID],
        queryFn: () => billService.getByDailyMenu(selectedQuickOrder!.ID),
        enabled: !!selectedQuickOrder?.ID,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const { data: selectedQuickOrderStaffCatalogs = [] } = useQuery({
        queryKey: ['quickOrderStaffCatalogs', selectedQuickOrder?.ID],
        queryFn: () => staffCatalogService.getForDailyMenu(selectedQuickOrder!.ID),
        enabled: !!selectedQuickOrder?.ID,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    const isEveryoneInvited =
        activeStaff.length > 0 &&
        activeStaff.every((employee) => invitedStaff.some((invited) => invited.ID === employee.ID));

    const choicesConfirmedCount = new Set(
        selectedQuickOrderStaffCatalogs.map((order) => order.Staff_ID)
    ).size;
    const totalConfirmedAmount = selectedQuickOrderStaffCatalogs.reduce(
        (sum, order) => sum + toCurrencyNumber(order.catalog?.price),
        0
    );
    const additionalCostAmount = toCurrencyNumber(additionalCost);
    const totalConfirmedCurrency =
        selectedQuickOrderStaffCatalogs[0]?.catalog?.currency ||
        selectedQuickOrder?.catalogs?.[0]?.currency ||
        'VND';
    const totalDisplayedAmount = totalConfirmedAmount + additionalCostAmount;
    const totalDisplayedCurrency =
        additionalCostAmount > 0
            ? additionalCostCurrency || totalConfirmedCurrency
            : totalConfirmedCurrency;

    const uploadBillMutation = useMutation({
        mutationFn: (file: File) => {
            if (!selectedQuickOrder?.date || !selectedQuickOrder?.ID) throw new Error('No quick order selected');
            return billService.upload(selectedQuickOrder.date, file, selectedQuickOrder.ID);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quickOrderBills', selectedQuickOrder?.ID] });
            toast.success('Bill uploaded successfully');
        },
        onError: (error: any) => {
            const backendMessage =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to upload bill';
            toast.error(backendMessage);
        }
    });

    const deleteBillMutation = useMutation({
        mutationFn: (billId: string) => billService.delete(billId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quickOrderBills', selectedQuickOrder?.ID] });
            toast.success('Bill deleted successfully');
        },
        onError: (error: any) => {
            const backendMessage =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to delete bill';
            toast.error(backendMessage);
        }
    });

    const completeQuickOrderMutation = useMutation({
        mutationFn: async () => {
            if (!selectedQuickOrder) throw new Error('No quick order selected');
            return dailyMenuService.updateStatus(selectedQuickOrder.ID, 'complete');
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['quickOrders'] });
            if (selectedQuickOrder?.ID) {
                await queryClient.invalidateQueries({ queryKey: ['quickOrderStaffCatalogs', selectedQuickOrder.ID] });
            }
            toast.success('Quick order completed successfully.');
        },
        onError: (error: any) => {
            const backendMessage =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to complete quick order';
            toast.error(backendMessage);
        },
    });

    const addMenuItem = () => {
        setMenuItems([...menuItems, { ...EMPTY_MENU_ITEM }]);
    };

    const removeMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const updateMenuItem = (index: number, field: keyof QuickOrderMenuItem, value: string) => {
        setMenuItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const addSelectedMenuItem = () => {
        setSelectedMenuItems((prev) => {
            const nextItems = [...prev, { ...EMPTY_MENU_ITEM }];
            setSelectedMenuPage(Math.ceil(nextItems.length / MENU_ITEMS_PER_PAGE));
            return nextItems;
        });
    };

    const removeSelectedMenuItem = (indexToRemove: number) => {
        setSelectedMenuItems((prev) => {
            const nextItems = prev.filter((_, itemIndex) => itemIndex !== indexToRemove);
            const safeItems = nextItems.length > 0 ? nextItems : [{ ...EMPTY_MENU_ITEM }];
            setSelectedMenuPage((currentPage) =>
                Math.min(currentPage, Math.max(1, Math.ceil(safeItems.length / MENU_ITEMS_PER_PAGE)))
            );
            return safeItems;
        });
    };

    const extractMenuItemsFromFile = async (
        file: File,
        target: 'modal' | 'selected'
    ) => {
        setIsExtractingMenu(true);
        const loadingToastId = toast.loading('Extracting menu items...');

        try {
            const extractedItems = await foodService.extractMenuFromImage(file);
            if (extractedItems.length === 0) {
                toast.update(loadingToastId, {
                    render: 'No items extracted',
                    type: 'info',
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            const mappedItems = extractedItems.map((item) => ({
                name: item.name || '',
                price: item.price?.toString?.() || '0.00',
                currency: 'VND',
            }));

            if (target === 'modal') {
                setMenuItems(mappedItems);
            } else {
                setSelectedMenuItems((prev) => {
                    const hasOnlyEmptyRow =
                        prev.length === 1 &&
                        !prev[0].name.trim() &&
                        (!prev[0].price.trim() || prev[0].price.trim() === '0.00') &&
                        prev[0].currency === 'VND';

                    const nextItems = hasOnlyEmptyRow ? mappedItems : [...prev, ...mappedItems];
                    setSelectedMenuPage(Math.max(1, Math.ceil(nextItems.length / MENU_ITEMS_PER_PAGE)));
                    return nextItems;
                });
            }

            toast.update(loadingToastId, {
                render: `Extracted ${extractedItems.length} item(s) successfully`,
                type: 'success',
                isLoading: false,
                autoClose: 3000,
            });
        } catch (err: any) {
            const backendMessage =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to extract menu';

            toast.update(loadingToastId, {
                render: backendMessage,
                type: 'error',
                isLoading: false,
                autoClose: 5000,
            });
        } finally {
            setIsExtractingMenu(false);
        }
    };

    const handleMenuUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleMenuFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await extractMenuItemsFromFile(file, 'modal');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSelectedMenuScanClick = () => {
        scanMenuInputRef.current?.click();
    };

    const handleSelectedMenuScanChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await extractMenuItemsFromFile(file, 'selected');
        if (scanMenuInputRef.current) scanMenuInputRef.current.value = '';
    };

    const resetQuickOrderModal = () => {
        setMenuName('');
        setIsShareBill(true);
        setMenuItems([{ ...EMPTY_MENU_ITEM }]);
        setAdditionalCost('0');
        setAdditionalCostCurrency('VND');
    };

    const getTodayISODate = () => {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const formatSidebarDate = (date: string) => {
        if (!date) return '';
        if (date === getTodayISODate()) return 'TODAY';

        const parsed = new Date(`${date}T00:00:00`);
        return parsed.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    };

    const mapStatus = (status: 'open' | 'close' | 'complete'): QuickOrderItem['status'] => {
        if (status === 'complete') return 'COMPLETED';
        if (status === 'close') return 'CLOSED';
        return 'OPEN';
    };

    const managementItems: QuickOrderItem[] = quickOrders.map((menu, index) => {
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

    useEffect(() => {
        if (creatorIdentities.length === 0) return;
        void queryClient.invalidateQueries({ queryKey: ['quickOrders'] });
    }, [creatorIdentities.length, location.key, queryClient]);

    useEffect(() => {
        if (!selectedQuickOrder?.ID) return;
        void queryClient.invalidateQueries({ queryKey: ['quickOrderStaffCatalogs', selectedQuickOrder.ID] });
    }, [location.key, queryClient, selectedQuickOrder?.ID]);

    useEffect(() => {
        if (!selectedQuickOrder?.ID) return;
        void queryClient.invalidateQueries({ queryKey: ['quickOrderBills', selectedQuickOrder.ID] });
    }, [location.key, queryClient, selectedQuickOrder?.ID]);

    useEffect(() => {
        if (!quickOrders.length) {
            setSelectedQuickOrderId(null);
            syncSelectedQuickOrderState(null);
            setIsEditingQuickMenu(false);
            return;
        }

        if (!selectedQuickOrderId || !quickOrders.some((menu) => menu.ID === selectedQuickOrderId)) {
            setSelectedQuickOrderId(quickOrders[0].ID);
        }
    }, [quickOrders, selectedQuickOrderId]);

    useEffect(() => {
        if (!selectedQuickOrder) {
            syncSelectedQuickOrderState(null);
            setIsEditingQuickMenu(false);
            return;
        }

        if (!isQuickMenuEditable) {
            syncSelectedQuickOrderState(selectedQuickOrder);
        }
    }, [selectedQuickOrder, isQuickMenuEditable]);

    const totalSelectedMenuPages = Math.max(1, Math.ceil(selectedMenuItems.length / MENU_ITEMS_PER_PAGE));
    const paginatedSelectedMenuItems = selectedMenuItems.slice(
        (selectedMenuPage - 1) * MENU_ITEMS_PER_PAGE,
        selectedMenuPage * MENU_ITEMS_PER_PAGE
    );
    const selectedMenuItemNameCounts = selectedMenuItems.reduce<Record<string, number>>((acc, item) => {
        const normalizedName = item.name.trim().toLowerCase();
        if (!normalizedName) return acc;
        acc[normalizedName] = (acc[normalizedName] || 0) + 1;
        return acc;
    }, {});

    const handleConfirmQuickOrder = async () => {
        const trimmedMenuName = menuName.trim();
        const validItems = menuItems.filter(
            (item) => item.name.trim() && item.price.trim() && !Number.isNaN(parseFloat(item.price))
        );

        if (!trimmedMenuName) {
            toast.error('Menu Name is required');
            return;
        }

        if (validItems.length === 0) {
            toast.error('Please add at least one valid menu item');
            return;
        }

        setIsSavingQuickOrder(true);
        try {
            const createdQuickOrderId = await dailyMenuService.createQuickOrder(getTodayISODate(), {
                menuName: trimmedMenuName,
                isShare: isShareBill,
                additionalCost: toCurrencyNumber(additionalCost),
                additionalCostCurrency,
                creatorStaffId: currentStaffId,
                items: validItems,
            });
            setSelectedQuickOrderId(createdQuickOrderId);
            await queryClient.invalidateQueries({ queryKey: ['quickOrders'] });
            toast.success('Quick order created successfully');
            setShowModal(false);
            resetQuickOrderModal();
        } catch (err: any) {
            const backendMessage =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to create quick order';
            toast.error(backendMessage);
        } finally {
            setIsSavingQuickOrder(false);
        }
    };

    const handleToggleOrderStatus = async () => {
        if (!selectedQuickOrder) {
            toast.info('Please select a quick order first');
            return;
        }

        if (selectedQuickOrder.status === 'complete') {
            toast.info('Completed orders cannot be reopened.');
            return;
        }

        setIsUpdatingOrderStatus(true);
        try {
            const nextStatus = isSelectedOrderClosed ? 'open' : 'close';
            await dailyMenuService.updateStatus(selectedQuickOrder.ID, nextStatus);
            await queryClient.invalidateQueries({ queryKey: ['quickOrders'] });
            toast.success(
                nextStatus === 'close'
                    ? 'Order closed successfully.'
                    : 'Order reopened for editing.'
            );
        } catch (err: any) {
            const backendMessage =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to update quick order status';
            toast.error(backendMessage);
        } finally {
            setIsUpdatingOrderStatus(false);
        }
    };

    const handleCompleteQuickOrder = () => {
        if (!selectedQuickOrder) {
            toast.info('Please select a quick order first');
            return;
        }

        if (bills.length === 0) {
            toast.info('Upload bill to complete the order.');
            return;
        }

        if (selectedQuickOrder.status === 'complete') {
            toast.info('This quick order is already completed.');
            return;
        }

        if (selectedQuickOrder.status !== 'close') {
            toast.info('Close the order before marking it complete.');
            return;
        }

        completeQuickOrderMutation.mutate();
    };

    const handleExportPdf = async () => {
        if (!selectedQuickOrder) {
            toast.info('Please select a quick order first');
            return;
        }

        setIsExportingPdf(true);
        try {
            const selectedCatalogIds = new Set((selectedQuickOrder.catalogs ?? []).map((catalog) => catalog.ID));
            const staffCatalogsForDate = await staffCatalogService.getForDate(selectedQuickOrder.date);
            const quickOrderStaffCatalogs = staffCatalogsForDate.filter(
                (staffCatalog) => staffCatalog.catalog?.ID && selectedCatalogIds.has(staffCatalog.catalog.ID)
            );

            const aggregatedOrders = new Map<string, {
                name: string;
                unitPrice: number;
                qty: number;
                subtotal: number;
                currency: string;
            }>();

            for (const staffCatalog of quickOrderStaffCatalogs) {
                const catalog = staffCatalog.catalog;
                if (!catalog) continue;

                const key = `${catalog.ID}-${catalog.currency}-${catalog.price}`;
                const existing = aggregatedOrders.get(key);

                if (existing) {
                    existing.qty += 1;
                    existing.subtotal = existing.qty * existing.unitPrice;
                } else {
                    const unitPrice = toCurrencyNumber(catalog.price);
                    aggregatedOrders.set(key, {
                        name: catalog.name || 'Unknown',
                        unitPrice,
                        qty: 1,
                        subtotal: unitPrice,
                        currency: catalog.currency || 'VND',
                    });
                }
            }

            const exportRows = Array.from(aggregatedOrders.values()).sort((a, b) => a.name.localeCompare(b.name));
            const grandTotal = exportRows.reduce((sum, item) => sum + item.subtotal, 0);
            const totalQty = exportRows.reduce((sum, item) => sum + item.qty, 0);
            const sanitizedMenuName = (selectedMenuName.trim() || selectedQuickOrder.name || 'quick-order')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'D')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                || 'quick-order';

            await exportOrderPdf({
                title: selectedMenuName.trim() || 'Quick Order',
                dateLabel: selectedQuickOrder.date,
                fileName: `quick-order-${selectedQuickOrder.date}-${sanitizedMenuName}.pdf`,
                orders: exportRows,
                totalQty,
                total: grandTotal,
                language: 'en',
                labels: {
                    date: 'Date',
                    item: 'Item',
                    unitPrice: 'Unit Price',
                    qty: 'Qty',
                    subtotal: 'Subtotal',
                    total: 'Total',
                    noOrders: 'No items found',
                    notes: 'Notes',
                },
                staffCatalogs: quickOrderStaffCatalogs,
                staffBreakdownTitle: 'Recipient Breakdown',
            });
        } catch (error) {
            console.error('Failed to export PDF:', error);
            toast.error('Failed to export PDF');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleSaveInvites = async () => {
        if (!selectedQuickOrder) {
            toast.info('Please select a quick order first');
            return;
        }

        const trimmedMenuName = selectedMenuName.trim();
        const normalizedMenuItems = selectedMenuItems
            .map(normalizeMenuItem)
            .filter((item) => item.name || item.price);

        if (!trimmedMenuName) {
            toast.error('Menu Name is required');
            return;
        }

        if (normalizedMenuItems.length === 0) {
            toast.error('Please keep at least one valid menu item');
            return;
        }

        const invalidMenuItem = normalizedMenuItems.find(
            (item) => !item.name || !item.price || Number.isNaN(Number.parseFloat(item.price))
        );
        if (invalidMenuItem) {
            toast.error('Please complete all menu item names and prices before saving');
            return;
        }

        const existingCatalogs: CatalogEntity[] = selectedQuickOrder.catalogs ?? [];
        const existingMenuSignatures = existingCatalogs
            .map((catalog) =>
                serializeMenuItem({
                    id: catalog.ID,
                    name: catalog.name || '',
                    currency: catalog.currency || 'VND',
                    price: catalog.price?.toString?.() || '0.00',
                })
            )
            .sort();
        const nextMenuSignatures = normalizedMenuItems
            .map((item) =>
                serializeMenuItem({
                    id: item.id,
                    name: item.name,
                    currency: item.currency,
                    price: item.price,
                })
            )
            .sort();
        const existingInviteIds = Array.from(
            new Set(
                (selectedQuickOrder.menuInvites ?? [])
                    .map((invite) => invite.Staff_ID)
                    .filter(Boolean)
            )
        ).sort();
        const normalizedInvitedStaff = ensureCreatorInvited(invitedStaff);
        const nextInviteIds = Array.from(new Set(normalizedInvitedStaff.map((staff) => staff.ID))).sort();
        const normalizedAdditionalCost = toCurrencyNumber(additionalCost);
        const existingAdditionalCost = toCurrencyNumber(selectedQuickOrder.additionalCost);
        const existingAdditionalCostCurrency = selectedQuickOrder.additionalCostCurrency || 'VND';

        const hasMenuMetaChanges =
            trimmedMenuName !== (selectedQuickOrder.name || '') ||
            selectedIsShareBill !== (selectedQuickOrder.isShare ?? true) ||
            normalizedAdditionalCost !== existingAdditionalCost ||
            additionalCostCurrency !== existingAdditionalCostCurrency;
        const hasMenuItemChanges =
            existingMenuSignatures.length !== nextMenuSignatures.length ||
            existingMenuSignatures.some((signature, index) => signature !== nextMenuSignatures[index]);
        const hasInviteChanges =
            existingInviteIds.length !== nextInviteIds.length ||
            existingInviteIds.some((inviteId, index) => inviteId !== nextInviteIds[index]);

        if (!hasMenuMetaChanges && !hasMenuItemChanges && !hasInviteChanges) {
            toast.info('No changes to save');
            return;
        }

        setIsSavingInvites(true);
        try {
            if (hasMenuMetaChanges) {
                await dailyMenuService.updateQuickOrder(selectedQuickOrder.ID, {
                    name: trimmedMenuName,
                    isShare: selectedIsShareBill,
                    additionalCost: normalizedAdditionalCost,
                    additionalCostCurrency,
                });
            }

            if (hasMenuItemChanges) {
                const existingCatalogsById = new Map(existingCatalogs.map((catalog) => [catalog.ID, catalog]));
                const nextItemIds = new Set(
                    normalizedMenuItems
                        .map((item) => item.id)
                        .filter((itemId): itemId is string => Boolean(itemId))
                );

                const menuItemsToUpdate = normalizedMenuItems.filter(
                    (item) =>
                        item.id &&
                        (() => {
                            const existingCatalog = existingCatalogsById.get(item.id);
                            if (!existingCatalog) return false;
                            return (
                                item.name !== (existingCatalog.name || '') ||
                                item.currency !== (existingCatalog.currency || 'VND') ||
                                Number.parseFloat(item.price) !== toCurrencyNumber(existingCatalog.price)
                            );
                        })()
                );
                const menuItemsToCreate = normalizedMenuItems.filter((item) => !item.id);
                const catalogsToDelete = existingCatalogs.filter((catalog) => !nextItemIds.has(catalog.ID));

                await Promise.all(
                    menuItemsToUpdate.map((item) =>
                        foodService.updateQuickOrderItem(item.id!, {
                            name: item.name,
                            currency: item.currency,
                            price: Number.parseFloat(item.price),
                        })
                    )
                );

                await Promise.all(
                    menuItemsToCreate.map((item) =>
                        foodService.createQuickOrderItem(selectedQuickOrder.ID, {
                            name: item.name,
                            currency: item.currency,
                            price: Number.parseFloat(item.price),
                        })
                    )
                );

                await Promise.all(
                    catalogsToDelete.map(async (catalog) => {
                        await staffCatalogService.clearCatalogSelectionsByDate(
                            catalog.ID,
                            selectedQuickOrder.date,
                            selectedQuickOrder.ID
                        );
                        await foodService.delete(catalog.ID);
                    })
                );
            }

            if (hasInviteChanges) {
                await menuInviteStaffService.replaceForDailyMenu(
                    selectedQuickOrder.ID,
                    normalizedInvitedStaff.map((staff) => staff.ID)
                );
            }

            await queryClient.invalidateQueries({ queryKey: ['quickOrders'] });
            await queryClient.invalidateQueries({ queryKey: ['quickOrderStaffCatalogs', selectedQuickOrder.ID] });
            setIsEditingQuickMenu(false);
            const invitedCount = normalizedInvitedStaff.length;
            const saveDetails = [
                hasMenuMetaChanges || hasMenuItemChanges ? 'menu updated' : null,
                hasInviteChanges
                    ? `invitations sent to ${invitedCount} staff member${invitedCount === 1 ? '' : 's'}`
                    : null,
            ].filter(Boolean);
            toast.success(
                saveDetails.length > 0
                    ? `Quick order saved: ${saveDetails.join(', ')}.`
                    : 'Quick order saved successfully.'
            );
        } catch (err: any) {
            const backendMessage =
                err?.response?.data?.error?.message ||
                err?.response?.data?.message ||
                err?.message ||
                'Failed to save quick order';
            toast.error(backendMessage);
        } finally {
            setIsSavingInvites(false);
        }
    };

    const handleEditQuickMenu = () => {
        if (!selectedQuickOrder) {
            toast.info('Please select a quick order first');
            return;
        }

        if (selectedQuickOrder.status !== 'open') {
            toast.info('Only open orders can be edited');
            return;
        }

        setIsEditingQuickMenu(true);
    };

    const handleCancelQuickMenuEdit = () => {
        syncSelectedQuickOrderState(selectedQuickOrder);
        setIsEditingQuickMenu(false);
    };

    return (
        <div className={`bg-surface-custom font-body text-on-surface min-h-screen flex flex-col ${showModal ? 'overflow-hidden' : ''}`}>

            <div className={`flex flex-col min-h-screen transition-all duration-300 ${showModal ? 'blur-sm pointer-events-none' : ''}`}>
                <Navbar />

                <main className="flex-grow flex flex-col md:flex-row overflow-hidden h-[calc(100vh-80px)]">
                    <QuickOrderSidebar 
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={<>CREATED QUICK<br />ORDERS</>}
                        collapsedIcon="list_alt"
                        collapsedTitle="ORDERS"
                        items={managementItems}
                        onItemClick={(item) => {
                            setIsEditingQuickMenu(false);
                            setSelectedQuickOrderId(item.id);
                        }}
                        footer={
                            <Button
                                fullWidth
                                variant="secondary"
                                onClick={() => {
                                    resetQuickOrderModal();
                                    setShowModal(true);
                                }}
                                icon={<span className="material-icons-outlined text-[#0c0f0f]">add_circle</span>}
                                className="bg-white/40 hover:bg-white/60 text-sm py-3"
                            >
                                <span className="whitespace-nowrap overflow-visible">Create New Quick Order</span>
                            </Button>
                        }
                    />

                    {/* Main Content Section */}
                    <section className="flex-1 bg-[#f6f6f6] overflow-y-auto relative p-6 md:p-8">
                        {selectedQuickOrder ? (
                            <>
                                <PageHeader title="NEW QUICK ORDER">
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleToggleOrderStatus}
                                            disabled={isUpdatingOrderStatus || isSelectedOrderCompleted}
                                        >
                                            {isSelectedOrderClosed ? 'Open Order' : 'Close Order'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleExportPdf}
                                            disabled={isExportingPdf}
                                        >
                                            Export PDF
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleCompleteQuickOrder}
                                            disabled={
                                                !selectedQuickOrder ||
                                                bills.length === 0 ||
                                                selectedQuickOrder.status !== 'close' ||
                                                completeQuickOrderMutation.isPending
                                            }
                                        >
                                            {completeQuickOrderMutation.isPending ? 'Completing...' : 'Complete Order'}
                                        </Button>
                                    </div>
                                </PageHeader>

                                <SoftCard className="mb-6 p-3 flex flex-col md:flex-row items-center gap-4 border-[#acadad]">
                                    <div className="flex flex-col items-center md:items-start flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="material-icons-outlined text-[#a03a0f] text-base">group</span>
                                            <span className="font-headline font-bold text-[10px] uppercase tracking-tight text-gray-500">
                                                Choices Confirmed: <span className="text-[#a03a0f]">{choicesConfirmedCount}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons-outlined text-[#a03a0f] text-xl">payments</span>
                                            <span className="font-headline font-extrabold text-2xl tracking-tighter text-[#0c0f0f] whitespace-nowrap">
                                                {totalDisplayedAmount.toFixed(2)} {totalDisplayedCurrency}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-[#acadad] hidden md:block"></div>
                                    <div className="flex flex-col gap-1.5 md:min-w-[18rem]">
                                        <label className="font-headline font-bold text-[9px] uppercase tracking-widest text-[#5a5c5c] block">Additional Costs</label>
                                        <div className="flex gap-2 flex-nowrap">
                                            <input
                                                className={`w-24 md:w-28 shrink-0 neo-input px-2 py-1 text-xs ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'}`}
                                                placeholder="0.00"
                                                type="number"
                                                value={additionalCost}
                                                disabled={!isQuickMenuEditable}
                                                onChange={(e) => setAdditionalCost(e.target.value)}
                                                onBlur={() => {
                                                    if (!additionalCost.trim()) setAdditionalCost('0');
                                                }}
                                            />
                                            <select
                                                className={`w-16 md:w-20 shrink-0 neo-input px-2 py-1 text-[9px] uppercase ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'}`}
                                                value={additionalCostCurrency}
                                                disabled={!isQuickMenuEditable}
                                                onChange={(e) => setAdditionalCostCurrency(e.target.value)}
                                            >
                                                <option value="VND">VND</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </div>
                                    </div>
                                </SoftCard>

                                <form className="grid grid-cols-1 lg:grid-cols-12 gap-6" onSubmit={(e) => e.preventDefault()}>
                            <div className="lg:col-span-8 flex flex-col gap-6">
                                <SoftCard className="border-[#0c0f0f] overflow-visible p-4 lg:p-5">
                                    <h4 className="font-display font-extrabold text-base uppercase mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[10px]">01</span>
                                        Menu Name
                                    </h4>
                                    <input
                                        className={`w-full neo-input px-3 py-2.5 text-sm font-bold ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'}`}
                                        placeholder="e.g. Birthday Party"
                                        type="text"
                                        value={selectedMenuName}
                                        onChange={(e) => setSelectedMenuName(e.target.value)}
                                        disabled={!isQuickMenuEditable}
                                    />
                                    
                                    <div className="mt-3 flex items-center gap-2">
                                        <input
                                            className="custom-checkbox custom-checkbox-dark-border"
                                            id="share-bill-check"
                                            type="checkbox"
                                            checked={selectedIsShareBill}
                                            onChange={(e) => setSelectedIsShareBill(e.target.checked)}
                                            disabled={!isQuickMenuEditable}
                                        />
                                        <label className={`font-body text-xs font-bold uppercase tracking-widest leading-none ${isQuickMenuEditable ? 'cursor-pointer text-gray-700' : 'cursor-not-allowed text-gray-400'}`} htmlFor="share-bill-check">Share Bill Order</label>
                                    </div>
                                </SoftCard>

                                <SoftCard className="border-[#0c0f0f] overflow-visible p-4 lg:p-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-display font-extrabold text-base uppercase flex items-center gap-2">
                                            <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[10px]">02</span>
                                            Menu Items
                                        </h4>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={handleSelectedMenuScanClick} disabled={!isQuickMenuEditable || isExtractingMenu}>Scan Menu</Button>
                                            <Button variant="primary" size="sm" onClick={addSelectedMenuItem} disabled={!isQuickMenuEditable}>+ Add Item</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 min-h-[13.5rem]">
                                        {paginatedSelectedMenuItems.map((item, pageIndex) => {
                                            const index = (selectedMenuPage - 1) * MENU_ITEMS_PER_PAGE + pageIndex;
                                            const normalizedName = item.name.trim().toLowerCase();
                                            const isDuplicateName = !!normalizedName && selectedMenuItemNameCounts[normalizedName] > 1;
                                            return (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <div className="flex-[0_0_54%] relative">
                                                        <input
                                                            className={`w-full neo-input px-3 py-1.5 pr-8 text-xs ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'} ${isDuplicateName && isQuickMenuEditable ? 'border-[#b02500] text-[#b02500]' : ''}`}
                                                            placeholder="Food Name"
                                                            type="text"
                                                            title={isDuplicateName ? 'Duplicate menu items' : ''}
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                setSelectedMenuItems((prev) =>
                                                                    prev.map((menuItem, itemIndex) =>
                                                                        itemIndex === index ? { ...menuItem, name: e.target.value } : menuItem
                                                                    )
                                                                )
                                                            }
                                                            disabled={!isQuickMenuEditable}
                                                        />
                                                        {isDuplicateName && isQuickMenuEditable && (
                                                            <span
                                                                className="material-icons-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-[#b02500] cursor-help"
                                                                title="Duplicate menu items"
                                                            >
                                                                warning
                                                            </span>
                                                        )}
                                                    </div>
                                                    <select
                                                        className={`w-18 neo-input px-2 py-1.5 text-[9px] uppercase ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'}`}
                                                        value={item.currency}
                                                        onChange={(e) =>
                                                            setSelectedMenuItems((prev) =>
                                                                prev.map((menuItem, itemIndex) =>
                                                                    itemIndex === index ? { ...menuItem, currency: e.target.value } : menuItem
                                                                )
                                                            )
                                                        }
                                                        disabled={!isQuickMenuEditable}
                                                    >
                                                        {CURRENCY_OPTIONS.map((currency) => (
                                                            <option key={currency} value={currency}>
                                                                {currency}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        className={`flex-1 min-w-[110px] neo-input px-2.5 py-1.5 text-xs ${isQuickMenuEditable ? 'bg-white' : 'bg-[#eef0f2] text-[#6b7280] border-[#d1d5db] cursor-not-allowed'}`}
                                                        placeholder="0.00"
                                                        type="number"
                                                        value={item.price}
                                                        onChange={(e) =>
                                                            setSelectedMenuItems((prev) =>
                                                                prev.map((menuItem, itemIndex) =>
                                                                    itemIndex === index ? { ...menuItem, price: e.target.value } : menuItem
                                                                    )
                                                                )
                                                            }
                                                        disabled={!isQuickMenuEditable}
                                                    />
                                                    <button
                                                        className={`material-icons-outlined transition-colors ${isQuickMenuEditable ? 'text-[#acadad] hover:text-[#b02500]' : 'text-[#d1d5db] cursor-not-allowed'}`}
                                                        type="button"
                                                        onClick={() => removeSelectedMenuItem(index)}
                                                        disabled={!isQuickMenuEditable}
                                                    >
                                                        delete
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 flex items-center justify-center gap-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => setSelectedMenuPage((prev) => Math.max(1, prev - 1))}
                                            disabled={selectedMenuPage === 1}
                                        >
                                            Prev
                                        </Button>
                                        <span className="font-display font-extrabold text-sm uppercase text-[#0c0f0f]">
                                            {selectedMenuPage} / {totalSelectedMenuPages}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => setSelectedMenuPage((prev) => Math.min(totalSelectedMenuPages, prev + 1))}
                                            disabled={selectedMenuPage === totalSelectedMenuPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="sr-only"
                                        ref={scanMenuInputRef}
                                        onChange={handleSelectedMenuScanChange}
                                    />
                                </SoftCard>

                                <SoftCard className="border-[#0c0f0f] overflow-visible">
                                    <div className="flex items-center gap-4 mb-4">
                                        <h4 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                                            <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">03</span>
                                            Invite
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="custom-checkbox custom-checkbox-dark-border"
                                                id="invite-everyone-check"
                                                type="checkbox"
                                                checked={isEveryoneInvited}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setInvitedStaff(ensureCreatorInvited(activeStaff));
                                                    } else {
                                                        setInvitedStaff(ensureCreatorInvited([]));
                                                    }
                                                }}
                                                disabled={!isQuickMenuEditable}
                                            />
                                            <label className={`font-body text-xs font-bold uppercase tracking-widest leading-none ${isQuickMenuEditable ? 'cursor-pointer text-[#0c0f0f]' : 'cursor-not-allowed text-gray-400'}`} htmlFor="invite-everyone-check">Everyone</label>
                                        </div>
                                    </div>
                                    <div className="relative flex flex-wrap items-center gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {invitedStaff.map((staff) => (
                                                <Badge
                                                    key={staff.ID}
                                                    className={`flex items-center gap-1 border-2 text-xs py-1 ${isQuickMenuEditable ? 'border-black bg-white' : 'border-[#d1d5db] bg-[#eef0f2] text-[#6b7280]'}`}
                                                >
                                                    {staff.name}
                                                    <button
                                                        className={`material-icons-outlined text-[10px] focus:outline-none ${isQuickMenuEditable && staff.ID !== currentStaffId ? 'hover:text-red-600' : 'text-[#d1d5db] cursor-not-allowed'}`}
                                                        type="button"
                                                        onClick={() =>
                                                            setInvitedStaff((prev) =>
                                                                staff.ID === currentStaffId
                                                                    ? prev
                                                                    : ensureCreatorInvited(prev.filter((invited) => invited.ID !== staff.ID))
                                                            )
                                                        }
                                                        disabled={!isQuickMenuEditable || staff.ID === currentStaffId}
                                                    >
                                                        close
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setIsInviteModalOpen(true)}
                                            disabled={!isQuickMenuEditable}
                                        >
                                            + Add
                                        </Button>
                                    </div>
                                </SoftCard>
                            </div>

                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <SoftCard className={`border-[#0c0f0f] transition-colors group flex flex-col items-center text-center p-6 gap-2 ${isSelectedOrderCompleted ? 'bg-[#eef0f2]' : 'hover:bg-[#fff2cd] cursor-pointer'}`}>
                                    <h4 className="font-display font-extrabold text-sm uppercase flex items-center gap-2 self-start mb-2">
                                        <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[9px] font-bold">04</span>
                                        Upload Bill
                                    </h4>
                                    {bills.length > 0 ? (
                                        <div className="w-full flex flex-col gap-3">
                                            {bills.slice(0, 2).map((bill) => (
                                                <div
                                                    key={bill.ID}
                                                    className="w-full rounded-lg border-2 border-[#0c0f0f] bg-white px-3 py-2 flex items-center gap-3 text-left"
                                                >
                                                    <span className="material-icons-outlined text-[#0c0f0f]">
                                                        {bill.mediaType.startsWith('image/') ? 'image' : 'picture_as_pdf'}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-headline font-bold text-[11px] uppercase text-[#0c0f0f] truncate">
                                                            {bill.fileName}
                                                        </div>
                                                        <div className="font-body text-[10px] text-[#5a5c5c]">
                                                            {bill.mediaType.startsWith('image/') ? 'Image receipt' : 'PDF receipt'}
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={billService.getContentUrl(bill.ID)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="material-icons-outlined text-[#0c0f0f] hover:text-[#a03a0f] transition-colors"
                                                        title="Open bill"
                                                    >
                                                        open_in_new
                                                    </a>
                                                    <button
                                                        type="button"
                                                        className="material-icons-outlined text-[#0c0f0f] hover:text-[#b02500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Delete bill"
                                                        onClick={() => deleteBillMutation.mutate(bill.ID)}
                                                        disabled={deleteBillMutation.isPending || isSelectedOrderCompleted}
                                                    >
                                                        {deleteBillMutation.isPending ? 'hourglass_top' : 'delete_outline'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-lg h-32 w-full flex flex-col items-center justify-center">
                                            <span className="material-icons-outlined text-amber-400 text-4xl">receipt_long</span>
                                            <p className="text-xs text-amber-500 mt-1 font-medium">No bills uploaded yet</p>
                                        </div>
                                    )}

                                    <input
                                        ref={billInputRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        disabled={isSelectedOrderCompleted}
                                        onChange={(e) => {
                                            if (isSelectedOrderCompleted) {
                                                e.target.value = '';
                                                return;
                                            }
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                uploadBillMutation.mutate(file);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="mt-2 text-xs py-1 px-4"
                                        onClick={() => billInputRef.current?.click()}
                                        disabled={!selectedQuickOrder || uploadBillMutation.isPending || isSelectedOrderCompleted}
                                    >
                                        {uploadBillMutation.isPending ? 'Uploading...' : 'Upload File'}
                                    </Button>
                                </SoftCard>

                                <div className="pt-6 border-t-4 border-dashed border-[#dbdddd] flex flex-col gap-3">
                                    {isQuickMenuEditable ? (
                                        <>
                                            <Button
                                                variant="secondary"
                                                fullWidth
                                                size="md"
                                                onClick={handleCancelQuickMenuEdit}
                                                disabled={!selectedQuickOrder || isSavingInvites}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                size="md"
                                                onClick={handleSaveInvites}
                                                disabled={!selectedQuickOrder || isSavingInvites}
                                            >
                                                {isSavingInvites ? 'Saving...' : 'Confirm & Save'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            size="md"
                                            onClick={handleEditQuickMenu}
                                            disabled={!selectedQuickOrder || selectedQuickOrder.status !== 'open'}
                                        >
                                            Edit Quick Menu
                                        </Button>
                                    )}
                                </div>
                            </div>
                                </form>
                            </>
                        ) : null}
                    </section>
                </main>
            </div>

            {/* NEW QUICK ORDER MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0c0f0f]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full sm:max-w-3xl sm:my-8 align-middle bg-[#ffffff] rounded-2xl flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(12,15,15,1)] border-2 border-[#0c0f0f] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-[#ffd709] px-6 py-4 flex items-center justify-between border-b-2 border-[#0c0f0f]">
                            <h3 className="text-3xl font-extrabold font-display uppercase text-[#5b4b00] mb-0">NEW QUICK ORDER</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-[#0c0f0f]/60 hover:text-[#0c0f0f] transition-colors"
                            >
                                <span className="material-icons-outlined text-2xl">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                            {/* Restaurant Info */}
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <label className="font-headline font-bold text-sm tracking-tight flex items-center gap-2 uppercase text-[#2d2f2f]">
                                        <span className="material-icons-outlined text-[#6c5a00] text-xl">store</span>
                                        Menu Name
                                    </label>
                                    <input
                                        className="w-full neo-input px-3 py-2 text-sm bg-[#f0f1f1]"
                                        placeholder="e.g. Friday Team Lunch"
                                        type="text"
                                        value={menuName}
                                        onChange={(e) => setMenuName(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <input
                                        className="custom-checkbox custom-checkbox-dark-border"
                                        id="sharebill"
                                        type="checkbox"
                                        checked={isShareBill}
                                        onChange={(e) => setIsShareBill(e.target.checked)}
                                    />
                                    <label className="font-body text-xs font-bold uppercase cursor-pointer text-[#2d2f2f]" htmlFor="sharebill">Share Bill</label>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="space-y-4">
                                <h3 className="font-display font-extrabold text-base uppercase tracking-tighter border-b-2 border-[#0c0f0f] pb-2 mb-2 text-[#2d2f2f]">MENU ITEMS</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2 px-1">
                                        <div className="col-span-6 text-[10px] font-black uppercase tracking-widest text-[#5a5c5c]">Food Name</div>
                                        <div className="col-span-5 text-[10px] font-black uppercase tracking-widest text-[#5a5c5c]">Price & Currency</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {menuItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-6">
                                                <input
                                                    className="w-full neo-input py-2 px-3 text-sm bg-[#f0f1f1]"
                                                    placeholder="Item Name"
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-5 flex gap-1 relative">
                                                <select
                                                    className="neo-input py-2 px-2 w-[4.5rem] text-[10px] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:0.7em_0.7em] bg-[right_0.2rem_center] bg-no-repeat bg-[#f0f1f1]"
                                                    value={item.currency}
                                                    onChange={(e) => updateMenuItem(index, 'currency', e.target.value)}
                                                >
                                                    {CURRENCY_OPTIONS.map((currency) => (
                                                        <option key={currency} value={currency}>
                                                            {currency}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    className="w-full neo-input py-2 px-3 flex-1 text-sm bg-[#f0f1f1]"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <button
                                                    onClick={() => removeMenuItem(index)}
                                                    className="text-[#b02500] hover:scale-110 transition-transform"
                                                    title="Remove Item"
                                                    type="button"
                                                >
                                                    <span className="material-icons-outlined text-lg">delete_outline</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        onClick={addMenuItem}
                                        variant="primary"
                                        fullWidth
                                        size="sm"
                                        icon={<span className="material-icons-outlined text-lg">add_circle_outline</span>}
                                        className="mt-2"
                                    >
                                        Add Item
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-[#f0f1f1] border-t-2 border-[#0c0f0f] flex flex-col sm:flex-row items-center justify-between gap-4">
                            <Button
                                onClick={() => {
                                    setShowModal(false);
                                    resetQuickOrderModal();
                                }}
                                variant="secondary"
                                size="sm"
                                className="w-full sm:w-auto text-xs"
                            >
                                Cancel
                            </Button>
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-full sm:w-auto text-xs bg-white"
                                    icon={<span className="material-icons-outlined text-lg">upload_file</span>}
                                    onClick={handleMenuUploadClick}
                                    disabled={isExtractingMenu}
                                >
                                    {isExtractingMenu ? 'Uploading...' : 'Upload'}
                                </Button>
                                <Button
                                    onClick={handleConfirmQuickOrder}
                                    variant="primary"
                                    size="sm"
                                    className="w-full sm:w-auto text-xs"
                                    disabled={isSavingQuickOrder}
                                >
                                    {isSavingQuickOrder ? 'Saving...' : 'Confirm'}
                                </Button>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                ref={fileInputRef}
                                onChange={handleMenuFileChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            <AddInvitationModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                isLoading={false}
                staff={activeStaff}
                invitedStaffIds={invitedStaff.map((staff) => staff.ID)}
                onAdd={(staffList) => {
                    setInvitedStaff((prev) => ensureCreatorInvited([...prev, ...staffList]));
                    setIsInviteModalOpen(false);
                }}
            />

        </div>
    );
}
