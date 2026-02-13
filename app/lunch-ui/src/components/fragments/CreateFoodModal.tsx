import React, { useState } from 'react';
import { Button } from '@/components/elements/Button';

interface CreateFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: FoodFormData) => void;
}

export interface FoodFormData {
    name: string;
    price: string;
    description: string;
    image: File | null;
}

export function CreateFoodModal({ isOpen, onClose, onSave }: CreateFoodModalProps) {
    const [name, setName] = useState<string>('');
    const [price, setPrice] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name: boolean; price: boolean }>({ name: false, price: false });

    // Reset state on close could be done here if we used useEffect, but for simplicity we rely on isOpen prop
    // to mount/unmount or just return null.
    // However, if we return null, state is lost if we unmount.
    // If the parent keeps it mounted but hidden (not the case here), state persists.
    // Given the structure, we return null to not render.
    if (!isOpen) return null;

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

        onSave({ name, price, description, image: imageFile });
        // Reset form
        setName('');
        setPrice('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        setErrors({ name: false, price: false });
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
                                Add New Food
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-black/60 hover:text-black transition-colors"
                                aria-label="Close modal"
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
                                Food Image
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
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                accept="image/*"
                                                className="sr-only"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Grid */}
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Item Name */}
                            <div className="sm:col-span-4">
                                <label
                                    htmlFor="food-name"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    Item Name
                                </label>
                                <input
                                    id="food-name"
                                    type="text"
                                    placeholder="e.g. Cheese Burger"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (errors.name) setErrors({ ...errors, name: false });
                                    }}
                                    className={`block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 font-medium bg-white ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.name && <p className="mt-1 text-xs text-red-500 font-bold">Name is required.</p>}
                            </div>

                            {/* Price */}
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="food-price"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    Price ($)
                                </label>
                                <input
                                    id="food-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Basic numeric validation to ensure we only set relevant values
                                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                            setPrice(val);
                                            if (errors.price) setErrors({ ...errors, price: false });
                                        }
                                    }}
                                    className={`block w-full border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm py-2 px-3 font-medium bg-white ${errors.price ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.price && <p className="mt-1 text-xs text-red-500 font-bold">Price is required.</p>}
                            </div>

                            {/* Description */}
                            <div className="sm:col-span-6">
                                <label
                                    htmlFor="food-description"
                                    className="block text-sm font-bold text-gray-900 mb-1 uppercase"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="food-description"
                                    rows={3}
                                    placeholder="Describe the dish..."
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
                            Save Changes
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
