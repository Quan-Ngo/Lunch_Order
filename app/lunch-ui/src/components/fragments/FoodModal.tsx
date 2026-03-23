import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/elements/Button';
import { CURRENCY_OPTIONS } from '@/config/currency';
import { foodService } from '@/services/api';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { ExtractedMenuModal, type ExtractedItem } from './ExtractedMenuModal';

export interface FoodFormData {
    name: string;
    price: string;
    currency: string;
    description: string;
    image: File | null;
}

interface FoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FoodFormData) => void;
    mode?: 'create' | 'edit';
    initialData?: Partial<FoodFormData> | null;
}

export function FoodModal({ isOpen, onClose, onSave, mode = 'create', initialData }: FoodModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [currency, setCurrency] = useState<string>('VND');
    const [description, setDescription] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name: boolean; price: boolean }>({ name: false, price: false });
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
    const [isExtractedModalOpen, setIsExtractedModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const invalidateFoods = () => queryClient.invalidateQueries({ queryKey: ['foods'] });

    // Populate data when editing
    React.useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setName(initialData.name || '');
                setPrice(initialData.price?.toString() || '');
                setCurrency(initialData.currency || 'VND');
                setDescription(initialData.description || '');
                setImageFile(null);
                setImagePreview(null);
            } else {
                // Reset for create
                setName('');
                setPrice('');
                setCurrency('VND');
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
            }
            setErrors({ name: false, price: false });
        }
    }, [isOpen, mode, initialData]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state on close could be done here if we used useEffect, but for simplicity we rely on isOpen prop
    // to mount/unmount or just return null.
    // However, if we return null, state is lost if we unmount.
    // If the parent keeps it mounted but hidden (not the case here), state persists.
    // Given the structure, we return null to not render.
    if (!isOpen) return null;

    const handleMenuUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleMenuFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsExtracting(true);
            const loadingToastId = toast.loading(t('foodModal.extracting', 'Extracting menu items...'));
            try {
                const items = await foodService.extractMenuFromImage(file);
                if (items && items.length > 0) {
                    toast.dismiss(loadingToastId);
                    setExtractedItems(items.map((it, idx) => ({
                        id: `item-${Date.now()}-${idx}`,
                        name: it.name,
                        price: it.price,
                        description: it.description || '',
                        imageFile: null,
                        imagePreview: null
                    })));
                    setIsExtractedModalOpen(true);
                } else {
                    toast.update(loadingToastId, { render: t('foodModal.extractEmpty', 'No items extracted'), type: 'info', isLoading: false, autoClose: 3000 });
                }
            } catch (err: any) {
                const backendMessage =
                    err?.response?.data?.error?.message ||
                    err?.response?.data?.message ||
                    err?.message ||
                    '';
                const baseMessage = t('foodModal.extractFailed', 'Failed to extract menu');
                toast.update(loadingToastId, {
                    render: backendMessage ? `${baseMessage}: ${backendMessage}` : baseMessage,
                    type: 'error',
                    isLoading: false,
                    autoClose: 5000
                });
            } finally {
                setIsExtracting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleSaveExtracted = async (itemsToSave: ExtractedItem[]) => {
        const saveToastId = toast.loading(t('foodModal.savingExtracted', 'Saving extracted items...'));
        try {
            const insertPromises = itemsToSave.map(async (item) => {
                if (!item.name.trim()) return;
                try {
                    const parsedPrice = parseFloat(item.price as any) || 0;
                    const newId = await foodService.create({
                        name: item.name,
                        price: parsedPrice,
                        currency: 'VND',
                        description: item.description,
                    });
                    if (item.imageFile && newId) {
                        await foodService.uploadImage(newId, item.imageFile);
                    }
                } catch (e) {
                     console.error("Failed to insert item:", item, e);
                     throw e;
                }
            });
            
            await Promise.all(insertPromises);
            
            invalidateFoods();
            toast.update(saveToastId, { render: t('foodModal.extractSuccess', `Saved ${itemsToSave.length} items successfully!`), type: 'success', isLoading: false, autoClose: 3000 });
            setIsExtractedModalOpen(false);
            onClose(); 
        } catch (err) {
            toast.update(saveToastId, { render: t('foodModal.saveExtractedFailed', 'Some items failed to save'), type: 'error', isLoading: false, autoClose: 3000 });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file: File | undefined = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader: FileReader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        const newErrors = {
            name: !name.trim(),
            price: !price.trim(),
        };

        if (newErrors.name || newErrors.price) {
            setErrors(newErrors);
            return;
        }

        onSave({ name, price, currency, description, image: imageFile });
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
                onClick={handleBackdropClick}
            >
                <div className="fixed inset-0 bg-black/60 transition-opacity" aria-hidden="true" />

                {/* Modal Panel — desktop max-width, full-width on mobile */}
                <div className="relative inline-block w-full sm:max-w-lg sm:my-8 align-bottom sm:align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all border border-gray-200">

                    {/* Header — Yellow banner */}
                    <div className="bg-primary border-b border-gray-200 p-6">
                        <div className="flex justify-between items-center">
                            <h3
                                id="modal-title"
                                className="text-2xl font-extrabold text-black uppercase tracking-tight font-display"
                            >
                                {mode === 'edit' ? t('foodModal.titleEdit') : t('foodModal.titleCreate')}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-black/60 hover:text-black transition-colors"
                                aria-label={t('foodModal.closeAriaLabel')}
                            >
                                <span className="material-icons-outlined text-2xl">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Body — Form fields */}
                    <div className="px-6 py-6 space-y-6">

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                                {t('foodModal.imageSectionLabel')}
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <div className="relative w-24 h-24 mx-auto mb-3">
                                            <img
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
                                                src={imagePreview}
                                            />
                                            <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1 rounded-full border border-gray-200">
                                                <span className="material-icons-outlined text-sm">edit</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="material-icons-outlined text-gray-400 text-4xl mb-2">
                                            cloud_upload
                                        </span>
                                    )}
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md font-bold text-black hover:underline focus-within:outline-none"
                                        >
                                            <span>{t('foodModal.uploadCta')}</span>
                                            <p className="pl-1">{t('foodModal.uploadOr')}</p>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">{t('foodModal.uploadHint')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-12">
                            {/* Item Name */}
                            <div className="sm:col-span-5">
                                <label
                                    htmlFor="food-name"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    {t('foodModal.fieldName')}
                                </label>
                                <input
                                    id="food-name"
                                    type="text"
                                    placeholder={t('foodModal.fieldNamePlaceholder')}
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors({ ...errors, name: false });
                                    }}
                                    className={`block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 font-medium bg-white ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">{t('foodModal.fieldNameError')}</p>}
                            </div>

                            {/* Price + Currency */}
                            <div className="sm:col-span-7">
                                <label
                                    htmlFor="food-price"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    {t('foodModal.fieldPrice')}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="food-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                setPrice(val);
                                                if (errors.price) setErrors({ ...errors, price: false });
                                            }
                                        }}
                                        className={`w-24 sm:w-28 shrink-0 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 font-medium bg-white ${errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'}`}
                                    />
                                    <select
                                        id="food-currency"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        aria-label={t('foodModal.fieldCurrency')}
                                        className="w-24 sm:w-28 shrink-0 border border-gray-200 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 font-bold bg-white text-gray-800 cursor-pointer"
                                    >
                                        {CURRENCY_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.price && <p className="mt-1 text-xs text-red-500 font-bold">{t('foodModal.fieldPriceError')}</p>}
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-12">
                                <label
                                    htmlFor="food-description"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    {t('foodModal.fieldDescription')}
                                </label>
                                <textarea
                                    id="food-description"
                                    rows={3}
                                    placeholder={t('foodModal.fieldDescriptionPlaceholder')}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="block w-full border border-gray-200 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer — Actions */}
                    <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row-reverse gap-3 border-t border-gray-200">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            className="w-full sm:w-auto"
                        >
                            {t('foodModal.saveChanges')}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="w-full sm:w-auto"
                        >
                            {t('foodModal.cancel')}
                        </Button>
                        <button
                            type="button"
                            disabled={isExtracting}
                            className={`sm:mr-auto w-full sm:w-auto inline-flex items-center justify-center rounded-md border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-4 py-2 bg-white text-sm font-bold text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-transform whitespace-nowrap ${isExtracting ? 'opacity-50 cursor-not-allowed' : 'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'}`}
                            onClick={handleMenuUploadClick}
                        >
                            <span className="material-icons-outlined mr-2 text-lg">
                                {isExtracting ? 'hourglass_empty' : 'image'}
                            </span>
                            {isExtracting ? t('foodModal.extractingBtn', 'Extracting...') : t('foodModal.uploadMenu', 'Upload Menu')}
                        </button>
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
            {isExtractedModalOpen && (
                <ExtractedMenuModal 
                    isOpen={isExtractedModalOpen} 
                    onClose={() => setIsExtractedModalOpen(false)} 
                    items={extractedItems} 
                    onSave={handleSaveExtracted} 
                />
            )}
        </div>
    );
}
