import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPriceLabel } from '@/config/currency';

export interface PdfOrderRow {
    name: string;
    unitPrice: number;
    qty: number;
    subtotal: number;
    currency: string;
}

export interface PdfStaffCatalog {
    staff?: { name?: string };
    catalog?: { name?: string; price?: number; currency?: string };
    note?: string;
}

interface StaffFoodRow {
    foodName: string;
    note: string;
    unitPrice: number;
    qty: number;
    subtotal: number;
    currency: string;
}

interface StaffBreakdownGroup {
    staffName: string;
    rows: StaffFoodRow[];
    staffTotal: number;
}

interface StaffBreakdownResult {
    groups: StaffBreakdownGroup[];
    grandTotal: number;
}

function buildStaffBreakdown(
    staffCatalogs: PdfStaffCatalog[],
    fallbackCurrency: string
): StaffBreakdownResult {
    const staffMap = new Map<string, Map<string, StaffFoodRow>>();

    for (const sc of staffCatalogs) {
        const staffName = sc.staff?.name || 'Unknown';
        const foodName = sc.catalog?.name || 'Unknown';
        const note = sc.note?.trim() || '';
        const unitPrice = sc.catalog?.price || 0;
        const currency = sc.catalog?.currency || fallbackCurrency;

        if (!staffMap.has(staffName)) {
            staffMap.set(staffName, new Map());
        }

        const foodMap = staffMap.get(staffName)!;
        const rowKey = `${foodName}||${note}`;
        if (!foodMap.has(rowKey)) {
            foodMap.set(rowKey, { foodName, note, unitPrice, qty: 0, subtotal: 0, currency });
        }

        const row = foodMap.get(rowKey)!;
        row.qty += 1;
        row.subtotal = row.qty * row.unitPrice;
    }

    const groups: StaffBreakdownGroup[] = [];
    let grandTotal = 0;

    for (const [staffName, foodMap] of staffMap) {
        const rows = Array.from(foodMap.values());
        const staffTotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
        grandTotal += staffTotal;
        groups.push({ staffName, rows, staffTotal });
    }

    groups.sort((a, b) => a.staffName.localeCompare(b.staffName));
    return { groups, grandTotal };
}

async function registerPdfFont(doc: jsPDF) {
    try {
        const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf');
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';

        for (let i = 0; i < bytes.byteLength; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }

        const base64Font = window.btoa(binary);
        doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        doc.setFont('Roboto', 'normal');
    } catch (error) {
        console.error('Failed to load font for PDF:', error);
        doc.setFont('helvetica', 'normal');
    }
}

export async function exportOrderPdf(options: {
    title: string;
    dateLabel: string;
    fileName: string;
    orders: PdfOrderRow[];
    totalQty: number;
    total: number;
    language: string;
    labels: {
        date: string;
        item: string;
        unitPrice: string;
        qty: string;
        subtotal: string;
        total: string;
        noOrders: string;
        notes: string;
    };
    note?: string;
    staffCatalogs?: PdfStaffCatalog[];
    staffBreakdownTitle?: string;
}): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const {
        title,
        dateLabel,
        fileName,
        orders,
        totalQty,
        total,
        language,
        labels,
        note,
        staffCatalogs = [],
        staffBreakdownTitle = 'Staff Order Breakdown',
    } = options;

    await registerPdfFont(doc);

    doc.setFontSize(20);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`${labels.date}: ${dateLabel}`, pageWidth / 2, 30, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 35, pageWidth - 14, 35);

    if (orders.length > 0) {
        autoTable(doc, {
            startY: 40,
            head: [[labels.item, labels.unitPrice, labels.qty, labels.subtotal]],
            body: orders.map((order) => [
                order.name,
                formatPriceLabel(order.unitPrice, order.currency || 'VND', language),
                order.qty.toString(),
                formatPriceLabel(order.subtotal, order.currency || 'VND', language),
            ]),
            foot: [[
                labels.total,
                '',
                totalQty.toString(),
                formatPriceLabel(total, orders[0]?.currency || 'VND', language),
            ]],
            theme: 'grid',
            headStyles: { fillColor: [255, 214, 0], textColor: [0, 0, 0], fontStyle: 'bold', font: 'Roboto' },
            footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', font: 'Roboto' },
            styles: { fontSize: 10, font: 'Roboto' },
        });
    } else {
        doc.setFontSize(11);
        doc.text(labels.noOrders, pageWidth / 2, 50, { align: 'center' });
    }

    if (note) {
        const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
        doc.setFontSize(12);
        doc.text(`${labels.notes}:`, 14, finalY + 15);
        doc.setFontSize(10);
        const splitNotes = doc.splitTextToSize(note, pageWidth - 28);
        doc.text(splitNotes, 14, finalY + 23);
    }

    if (staffCatalogs.length > 0) {
        const currency = orders[0]?.currency || 'VND';
        const { groups, grandTotal } = buildStaffBreakdown(staffCatalogs, currency);

        doc.addPage();
        doc.setFontSize(16);
        doc.text(staffBreakdownTitle, pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.text(`${labels.date}: ${dateLabel}`, pageWidth / 2, 26, { align: 'center' });
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 30, pageWidth - 14, 30);

        const tableBody: any[][] = [];

        for (const group of groups) {
            tableBody.push([
                { content: group.staffName, colSpan: 5, styles: { fillColor: [255, 214, 0], fontStyle: 'bold', textColor: [0, 0, 0] } },
            ]);

            for (const row of group.rows) {
                tableBody.push([
                    row.foodName,
                    row.note || '-',
                    formatPriceLabel(row.unitPrice, row.currency, language),
                    row.qty.toString(),
                    formatPriceLabel(row.subtotal, row.currency, language),
                ]);
            }

            tableBody.push([
                { content: `Total (${group.staffName})`, colSpan: 4, styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'right' as const } },
                { content: formatPriceLabel(group.staffTotal, currency, language), styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } },
            ]);
        }

        tableBody.push([
            { content: 'Grand Total (All Staff)', colSpan: 4, styles: { fillColor: [30, 30, 30], fontStyle: 'bold', textColor: [255, 255, 255], halign: 'right' as const } },
            { content: formatPriceLabel(grandTotal, currency, language), styles: { fillColor: [30, 30, 30], fontStyle: 'bold', textColor: [255, 255, 255] } },
        ]);

        const mismatch = Math.abs(grandTotal - total);
        if (mismatch > 0.01) {
            console.warn(`[PDF] Grand total mismatch: staff grand total ${grandTotal} vs page 1 total ${total}, diff = ${mismatch}`);
            tableBody.push([
                { content: `Mismatch: ${formatPriceLabel(mismatch, currency, language)}`, colSpan: 5, styles: { fillColor: [255, 230, 230], textColor: [180, 0, 0], fontStyle: 'bold' } },
            ]);
        }

        autoTable(doc, {
            startY: 35,
            head: [['Food', 'Note', 'Unit Price', 'Qty', 'Subtotal']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60], textColor: [255, 255, 255], fontStyle: 'bold', font: 'Roboto' },
            styles: { fontSize: 9, font: 'Roboto' },
            columnStyles: {
                0: { cellWidth: 45 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 32, halign: 'right' as const },
                3: { cellWidth: 15, halign: 'center' as const },
                4: { cellWidth: 32, halign: 'right' as const },
            },
        });
    }

    doc.save(fileName);
}
