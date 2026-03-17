import React, { useState, useEffect } from 'react';

export interface ExtractedItem {
    id: string;
    name: string;
    price: number | string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
}

interface ExtractedMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ExtractedItem[];
    onSave: (items: ExtractedItem[]) => void;
}

export function ExtractedMenuModal({ isOpen, onClose, items: initialItems, onSave }: ExtractedMenuModalProps) {
    const [items, setItems] = useState<ExtractedItem[]>(initialItems);

    useEffect(() => {
        if (isOpen) {
            setItems(initialItems);
        }
    }, [initialItems, isOpen]);

    if (!isOpen) return null;

    const handleFieldChange = (id: string, field: keyof ExtractedItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setItems(prev => prev.map(item => item.id === id ? { ...item, imageFile: file, imagePreview: reader.result as string } : item));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddRow = () => {
        setItems(prev => [
            ...prev,
            {
                id: `item-${Date.now()}-${Math.random()}`,
                name: '',
                price: '',
                description: '',
                imageFile: null,
                imagePreview: null
            }
        ]);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <style>
                {`
                .neo-border { border: 2px solid #000000; }
                .neo-input { border: 2px solid #000000; box-shadow: 2px 2px 0px 0px #000000; transition: all 0.1s ease; outline: none; }
                .neo-input:focus { box-shadow: 4px 4px 0px 0px #000000; transform: translate(-1px, -1px); }
                .neo-button-primary { background-color: #FACC15; border: 2px solid #000000; box-shadow: 4px 4px 0px 0px #000000; font-weight: 800; text-transform: uppercase; transition: all 0.1s ease; }
                .neo-button-primary:active { box-shadow: 0px 0px 0px 0px #000000; transform: translate(4px, 4px); }
                .neo-button-secondary { background-color: #FFFFFF; border: 2px solid #000000; box-shadow: 4px 4px 0px 0px #000000; font-weight: 800; text-transform: uppercase; transition: all 0.1s ease; }
                .neo-button-secondary:active { box-shadow: 0px 0px 0px 0px #000000; transform: translate(4px, 4px); }
                .bg-brand-yellow { background-color: #FACC15; }
                `}
            </style>
            <div className="bg-white neo-border w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-2xl" data-purpose="extracted-catalog-modal">
                <header className="bg-brand-yellow p-6 border-b-4 border-black">
                    <h2 className="text-3xl font-black uppercase tracking-tight m-0 text-black">Extracted Food Catalog</h2>
                </header>
                <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
                    <table className="w-full border-separate border-spacing-y-4">
                        <thead>
                            <tr className="text-left uppercase font-black text-sm tracking-widest text-gray-500">
                                <th className="px-4 pb-2">Image</th>
                                <th className="px-4 pb-2">Name</th>
                                <th className="px-4 pb-2 w-32">Price ($)</th>
                                <th className="px-4 pb-2">Description</th>
                                <th className="px-4 pb-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="catalog-rows">
                            {items.map((item) => (
                                <tr key={item.id} className="bg-white neo-border group">
                                    <td className="p-4 border-y-2 border-l-2 border-black rounded-l-xl">
                                        <div className="relative w-16 h-16 bg-gray-200 neo-border overflow-hidden rounded-md flex items-center justify-center group-hover:bg-gray-300 transition-colors cursor-pointer text-gray-800">
                                            {item.imagePreview ? (
                                                <img alt={item.name} className="w-full h-full object-cover" src={item.imagePreview} />
                                            ) : (
                                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => handleImageChange(item.id, e)}
                                                title="Upload Image"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 border-y-2 border-black text-gray-900">
                                        <input
                                            type="text"
                                            className="neo-input w-full p-2 font-bold focus:ring-0 text-black placeholder-gray-500"
                                            placeholder="Item Name"
                                            value={item.name}
                                            onChange={(e) => handleFieldChange(item.id, 'name', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4 border-y-2 border-black text-gray-900">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="neo-input w-full p-2 font-bold focus:ring-0 text-black placeholder-gray-500"
                                            placeholder="0.00"
                                            value={item.price}
                                            onChange={(e) => handleFieldChange(item.id, 'price', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4 border-y-2 border-black text-gray-900">
                                        <textarea
                                            rows={2}
                                            className="neo-input w-full p-2 text-sm resize-none focus:ring-0 text-black placeholder-gray-500"
                                            placeholder="Description of the item..."
                                            value={item.description}
                                            onChange={(e) => handleFieldChange(item.id, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4 border-y-2 border-r-2 border-black rounded-r-xl text-center">
                                        <button
                                            type="button"
                                            className="mx-auto w-10 h-10 neo-button-secondary flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-black"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        type="button"
                        className="mt-4 flex items-center gap-2 font-black text-sm uppercase hover:underline text-gray-900 bg-transparent border-0"
                        onClick={handleAddRow}
                    >
                        <span className="w-8 h-8 flex items-center justify-center neo-button-secondary rounded-full text-black">+</span>
                        Add New Row Manually
                    </button>
                </main>
                <footer className="p-6 bg-white border-t-4 border-black flex justify-end gap-4">
                    <button type="button" className="neo-button-secondary px-8 py-3 text-lg rounded-xl text-black" onClick={onClose}>Cancel</button>
                    <button type="button" className="neo-button-primary px-12 py-3 text-lg rounded-xl text-black" onClick={() => onSave(items)}>Save Changes</button>
                </footer>
            </div>
        </div>
    );
}
