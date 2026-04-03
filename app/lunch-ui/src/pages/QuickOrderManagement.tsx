import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';

export default function QuickOrderManagement() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [menuItems, setMenuItems] = useState([{ name: '', price: '0.00', currency: 'VND' }]);

    const addMenuItem = () => {
        setMenuItems([...menuItems, { name: '', price: '0.00', currency: 'VND' }]);
    };

    const removeMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    return (
        <div className={`bg-surface-custom font-body text-on-surface min-h-screen flex flex-col ${showModal ? 'overflow-hidden' : ''}`}>

            <div className={`flex flex-col min-h-screen transition-all duration-300 ${showModal ? 'blur-sm pointer-events-none' : ''}`}>
                <Navbar />

                <main className="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[calc(100vh-80px)]">
                    {/* Aside / Sidebar */}
                    <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'} bg-[#ffd709] p-6 flex flex-col gap-6 overflow-y-auto border-r-4 border-[#0c0f0f] relative`}>
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="absolute top-4 right-0 z-20 w-10 h-10 bg-transparent border-0 flex items-center justify-center rounded-md hover:bg-white/10 transition-all active:translate-x-0.5 active:translate-y-0.5"
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <span className="material-icons-outlined font-black">
                                {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
                            </span>
                        </button>
                        {!isSidebarCollapsed && (
                            <>
                                <h2 className="text-3xl font-extrabold font-display uppercase mb-2 text-[#453900]">
                                    CREATED QUICK<br />ORDERS
                                </h2>
                                <div className="flex flex-col gap-4">
                                    <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-bold text-xs tracking-widest text-[#5a5c5c]">OCT 24</span>
                                            <Badge className="bg-green-500 text-white border-2 border-[#0c0f0f] text-[9px]">COMPLETED</Badge>
                                        </div>
                                        <h3 className="font-headline font-extrabold text-lg text-[#5a5c5c] uppercase">The Burger Joint</h3>
                                        <p className="font-body text-xs font-medium text-[#5a5c5c]/70">2 Items • 28.00 VND</p>
                                    </div>
                                    <div className="bg-white pop-art-border p-4 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-bold text-xs tracking-widest text-[#a03a0f]">TODAY</span>
                                            <Badge className="bg-[#ffd709] text-black border-2 border-[#0c0f0f] text-[9px]">OPEN</Badge>
                                        </div>
                                        <h3 className="font-headline font-extrabold text-lg text-[#0c0f0f] uppercase italic">Artisan Pasta Lab</h3>
                                        <p className="font-body text-xs font-medium text-[#5a5c5c]">1 Item • 15.50 VND</p>
                                    </div>
                                    <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-headline font-bold text-xs tracking-widest text-[#5a5c5c]">OCT 20</span>
                                            <Badge className="bg-[#f95630] text-[#520c00] border-2 border-[#0c0f0f] text-[9px]">CLOSED</Badge>
                                        </div>
                                        <h3 className="font-headline font-extrabold text-lg text-[#5a5c5c] uppercase">Green Salad Co.</h3>
                                        <p className="font-body text-xs font-medium text-[#5a5c5c]/70">1 Item • 14.20 VND</p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-6 border-t-2 border-[#0c0f0f]/10">
                                    <Button
                                        fullWidth
                                        variant="secondary"
                                        onClick={() => setShowModal(true)}
                                        icon={<span className="material-icons-outlined text-[#0c0f0f]">add_circle</span>}
                                        className="bg-white/40 hover:bg-white/60 text-sm"
                                    >
                                        Create New Quick Order
                                    </Button>
                                </div>
                            </>
                        )}
                    </aside>

                    {/* Main Content Section */}
                    <section className={`${isSidebarCollapsed ? 'md:col-span-11' : 'md:col-span-9'} bg-[#f6f6f6] overflow-y-auto relative p-6 md:p-8`}>
                        <PageHeader title="NEW QUICK ORDER">
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm">Close Order</Button>
                                <Button variant="secondary" size="sm">Export PDF</Button>
                                <Button variant="primary" size="sm">Complete Order</Button>
                            </div>
                        </PageHeader>

                        <SoftCard className="mb-8 p-4 flex flex-col md:flex-row items-center gap-6 border-[#acadad]">
                            <div className="flex flex-col items-center md:items-start flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-icons-outlined text-[#a03a0f] text-base">group</span>
                                    <span className="font-headline font-bold text-[10px] uppercase tracking-tight text-gray-500">Choices Confirmed: <span className="text-[#a03a0f]">12</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-outlined text-[#a03a0f] text-xl">payments</span>
                                    <span className="font-headline font-extrabold text-2xl tracking-tighter text-[#0c0f0f] whitespace-nowrap">43.50 VND</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-[#acadad] hidden md:block"></div>
                            <div className="flex flex-col gap-2">
                                <label className="font-headline font-bold text-[10px] uppercase tracking-widest text-[#5a5c5c] block">Additional Costs</label>
                                <div className="flex gap-2">
                                    <input className="w-24 neo-input px-2 py-1.5 text-sm" placeholder="0.00" type="number" />
                                    <select className="w-16 neo-input px-2 py-1.5 text-[10px] uppercase">
                                        <option value="VND">VND</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>
                        </SoftCard>

                        <form className="grid grid-cols-1 lg:grid-cols-12 gap-8" onSubmit={(e) => e.preventDefault()}>
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                <SoftCard className="border-[#0c0f0f] overflow-visible">
                                    <h4 className="font-display font-extrabold text-lg uppercase mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">01</span>
                                        ORDER NAME
                                    </h4>
                                    <input className="w-full neo-input px-4 py-3 text-base font-bold bg-white" placeholder="e.g. Birthday Party" type="text" />
                                    
                                    <div className="mt-4 flex items-center gap-2">
                                        <input className="custom-checkbox custom-checkbox-dark-border" id="share-bill-check" type="checkbox" />
                                        <label className="font-body text-xs font-bold uppercase tracking-widest cursor-pointer leading-none text-gray-700" htmlFor="share-bill-check">Share Bill Order</label>
                                    </div>
                                </SoftCard>

                                <SoftCard className="border-[#0c0f0f] overflow-visible">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                                            <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">02</span>
                                            Menu Items
                                        </h4>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm">Scan Menu</Button>
                                            <Button variant="primary" size="sm">+ Add Item</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <input className="flex-1 neo-input px-3 py-2 text-sm bg-white" placeholder="Food Name" type="text" />
                                                <select className="w-16 neo-input px-2 py-2 text-[10px] uppercase bg-white">
                                                    <option value="VND">VND</option>
                                                    <option value="USD">USD</option>
                                                </select>
                                                <input className="w-20 neo-input px-3 py-2 text-sm bg-white" placeholder="0.00" type="number" />
                                                <button className="material-icons-outlined text-[#acadad] hover:text-[#b02500] transition-colors" type="button">delete</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 flex items-center justify-center gap-4">
                                        <Button variant="secondary" size="sm" className="text-xs">Prev</Button>
                                        <span className="font-display font-extrabold text-sm uppercase text-[#0c0f0f]">1 / X</span>
                                        <Button variant="secondary" size="sm" className="text-xs">Next</Button>
                                    </div>
                                </SoftCard>

                                <SoftCard className="border-[#0c0f0f] overflow-visible">
                                    <div className="flex items-center gap-4 mb-4">
                                        <h4 className="font-display font-extrabold text-lg uppercase flex items-center gap-2">
                                            <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">03</span>
                                            Invite
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <input className="custom-checkbox custom-checkbox-dark-border" id="invite-everyone-check" type="checkbox" />
                                            <label className="font-body text-xs font-bold uppercase tracking-widest cursor-pointer leading-none text-[#0c0f0f]" htmlFor="invite-everyone-check">Everyone</label>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {['John Doe', 'Jane Smith', 'Michael Lee'].map(name => (
                                                <Badge key={name} className="flex items-center gap-1 border-2 border-black bg-white text-xs py-1">
                                                    {name}
                                                    <button className="material-icons-outlined text-[10px] hover:text-red-600 focus:outline-none" type="button">close</button>
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button variant="primary" size="sm">+ Add</Button>
                                    </div>
                                </SoftCard>
                            </div>

                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <SoftCard className="border-[#0c0f0f] hover:bg-[#fff2cd] cursor-pointer transition-colors group flex flex-col items-center text-center p-6 gap-2">
                                    <h4 className="font-display font-extrabold text-sm uppercase flex items-center gap-2 self-start mb-2">
                                        <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[9px] font-bold">04</span>
                                        Upload Bill
                                    </h4>
                                    <div className="w-12 h-12 bg-[#ffd709] rounded-full flex items-center justify-center border-2 border-[#0c0f0f] sticker-rotate-left mb-2">
                                        <span className="material-icons-outlined text-2xl text-[#0c0f0f]">receipt_long</span>
                                    </div>
                                    <h3 className="font-display font-extrabold text-base uppercase leading-tight">Upload Your Bill</h3>
                                    <p className="font-body text-[10px] text-gray-500 max-w-[140px]">
                                        Upload receipt PDF or Image.
                                    </p>
                                    <Button variant="primary" size="sm" className="mt-2 text-xs py-1 px-4">Upload File</Button>
                                </SoftCard>

                                <div className="pt-6 border-t-4 border-dashed border-[#dbdddd] flex flex-col gap-3">
                                    <Button variant="secondary" fullWidth size="md">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" fullWidth size="md">
                                        Confirm &amp; Save
                                    </Button>
                                </div>
                            </div>
                        </form>
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
                                        Restaurant Name
                                    </label>
                                    <input className="w-full neo-input px-3 py-2 text-sm bg-[#f0f1f1]" placeholder="e.g. The Brutalist Burger Bar" type="text" />
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <input className="custom-checkbox custom-checkbox-dark-border" id="sharebill" type="checkbox" />
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
                                                <input className="w-full neo-input py-2 px-3 text-sm bg-[#f0f1f1]" placeholder="Item Name" type="text" defaultValue={item.name} />
                                            </div>
                                            <div className="col-span-5 flex gap-1 relative">
                                                <select className="neo-input py-2 px-2 w-[4.5rem] text-[10px] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:0.7em_0.7em] bg-[right_0.2rem_center] bg-no-repeat bg-[#f0f1f1]">
                                                    <option>$</option>
                                                    <option>€</option>
                                                    <option>£</option>
                                                    <option>¥</option>
                                                    <option>VND</option>
                                                </select>
                                                <input className="w-full neo-input py-2 px-3 flex-1 text-sm bg-[#f0f1f1]" placeholder="0.00" step="0.01" type="number" defaultValue={item.price} />
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
                                onClick={() => setShowModal(false)}
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
                                >
                                    Upload
                                </Button>
                                <Button
                                    onClick={() => setShowModal(false)}
                                    variant="primary"
                                    size="sm"
                                    className="w-full sm:w-auto text-xs"
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
