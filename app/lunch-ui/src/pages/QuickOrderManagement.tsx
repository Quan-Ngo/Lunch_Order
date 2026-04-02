import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function QuickOrderManagement() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f6f6] font-['Plus_Jakarta_Sans'] text-[#2d2f2f] min-h-screen flex flex-col">

            <Navbar />

            <main className="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[calc(100vh-80px)]">
                {/* Aside / Sidebar */}
                <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'md:col-span-1' : 'md:col-span-3'} bg-[#ffd709] p-8 flex flex-col gap-8 overflow-y-auto border-r-4 border-[#0c0f0f] relative`}>
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
                            <h2 className="font-headline font-black text-4xl leading-none uppercase tracking-tighter text-[#453900]">
                                CREATED QUICK<br/>ORDERS
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#5a5c5c]">OCT 24</span>
                                        <span className="bg-green-500 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">COMPLETED</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#5a5c5c] uppercase">The Burger Joint</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">2 Items • 28.00 VND</p>
                                </div>
                                <div className="bg-white pop-art-border p-4 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#a03a0f]">TODAY</span>
                                        <span className="bg-[#ffd709] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">OPEN</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#0c0f0f] uppercase italic">Artisan Pasta Lab</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]">1 Item • 15.50 VND</p>
                                </div>
                                <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#5a5c5c]">OCT 20</span>
                                        <span className="bg-[#f95630] text-[#520c00] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">CLOSED</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#5a5c5c] uppercase">Green Salad Co.</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">1 Item • 14.20 VND</p>
                                </div>
                            </div>
                            <div className="mt-auto pt-6 border-t-2 border-[#0c0f0f]/10">
                                <button className="w-full flex items-center justify-center gap-2 bg-white/40 pop-art-border hover:bg-white/60 p-4 rounded-xl transition-all group">
                                    <span className="material-icons-outlined text-[#0c0f0f] group-hover:scale-110 transition-transform">add_circle</span>
                                    <span className="font-headline font-black uppercase text-sm tracking-widest text-[#0c0f0f]">Create New Quick Order</span>
                                </button>
                            </div>
                        </>
                    )}
                </aside>

                {/* Main Content Section */}
                <section className={`${isSidebarCollapsed ? 'md:col-span-11' : 'md:col-span-9'} bg-[#f6f6f6] overflow-y-auto relative p-8 md:p-12`}>
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12 w-full border-b border-[#acadad]/30 pb-10">
                        <div className="flex flex-col">
                            <h1 className="font-headline font-black text-5xl tracking-tighter uppercase whitespace-nowrap text-[#0c0f0f]">
                                NEW <span className="text-[#a03a0f] italic">QUICK ORDER</span>
                            </h1>
                            <div className="flex gap-4 mt-6">
                                <button className="bg-white text-[#0c0f0f] pop-art-border pop-art-shadow-small px-6 py-2.5 font-headline font-black text-xs uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg">
                                    Close Order
                                </button>
                                <button className="bg-white text-[#0c0f0f] pop-art-border pop-art-shadow-small px-6 py-2.5 font-headline font-black text-xs uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg">
                                    Export PDF
                                </button>
                                <button className="bg-[#ffd709] text-[#0c0f0f] pop-art-border pop-art-shadow-small px-6 py-2.5 font-headline font-black text-xs uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg">
                                    Complete Order
                                </button>
                            </div>
                        </div>
                        <div className="bg-white border border-[#acadad] p-6 rounded-xl flex flex-col md:flex-row items-center gap-8 min-w-fit">
                            <div className="flex flex-col items-center md:items-start">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="material-icons-outlined text-[#a03a0f] text-base">group</span>
                                    <span className="font-headline font-black text-xs uppercase tracking-tight whitespace-nowrap">Choices Confirmed: <span className="text-[#a03a0f]">12</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-icons-outlined text-[#a03a0f] text-xl">payments</span>
                                    <span className="font-headline font-black text-3xl tracking-tighter text-[#0c0f0f] whitespace-nowrap">43.50 VND</span>
                                </div>
                            </div>
                            <div className="h-12 w-px bg-[#acadad] hidden md:block"></div>
                            <div className="flex flex-col gap-2">
                                <label className="font-headline font-bold text-[10px] uppercase tracking-widest text-[#5a5c5c] block">Additional Costs</label>
                                <div className="flex gap-2">
                                    <div className="relative w-28">
                                        <input className="w-full bg-[#f0f1f1] border border-[#acadad] p-2 text-sm font-bold rounded-lg focus:border-[#0c0f0f] outline-none transition-colors" placeholder="0.00" type="number"/>
                                    </div>
                                    <div className="relative w-20">
                                        <select className="w-full bg-[#f0f1f1] border border-[#acadad] px-2 py-2 text-[10px] font-bold rounded-lg focus:border-[#0c0f0f] outline-none transition-colors appearance-none pr-6 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%20%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:0.7em_0.7em] bg-[right_0.4rem_center] bg-no-repeat">
                                            <option value="VND">VND</option>
                                            <option value="USD">USD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form className="grid grid-cols-1 lg:grid-cols-10 gap-12" onSubmit={(e) => e.preventDefault()}>
                        <div className="lg:col-span-7 flex flex-col gap-10">
                            <div>
                                <h4 className="font-headline font-black text-2xl uppercase mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm font-bold">01</span>ORDER NAME
                                </h4>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-[#0c0f0f] translate-x-1 translate-y-1 rounded-lg"></div>
                                    <input className="relative w-full bg-white border-2 border-[#0c0f0f] p-6 text-xl font-bold rounded-lg outline-none focus:ring-0 focus:translate-x-1 focus:translate-y-1 transition-all" placeholder="e.g. Birthday Party" type="text"/>
                                </div>
                                <div className="mt-6 inline-flex items-center gap-2.5 bg-[#0c0f0f] text-white px-4 py-2.5 rounded-full cursor-pointer hover:opacity-95 transition-opacity">
                                    <input className="custom-checkbox" id="share-bill-check" type="checkbox" />
                                    <label className="font-label text-xs font-bold uppercase tracking-widest cursor-pointer leading-none" htmlFor="share-bill-check">Share Bill Order</label>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <h4 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
                                            <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm font-bold">02</span>
                                            Menu Items
                                        </h4>
                                        <button className="bg-white border-2 border-[#0c0f0f] px-6 py-2 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-[#f0f1f1] transition-colors" type="button">
                                            Scan Menu
                                        </button>
                                    </div>
                                    <button className="bg-[#ffd709] pop-art-border px-6 py-2 rounded-full font-headline font-black text-xs uppercase tracking-widest hover:bg-[#ffd709]/80 transition-colors" type="button">
                                        + Add Item
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="grid grid-cols-12 gap-3 items-center">
                                            <div className="col-span-6">
                                                <input className="w-full bg-white border-2 border-[#acadad] p-4 font-bold rounded-lg focus:border-[#0c0f0f] outline-none transition-colors" placeholder="Food Name" type="text"/>
                                            </div>
                                            <div className="col-span-5">
                                                <div className="flex items-center">
                                                    <div className="relative w-20 flex-shrink-0">
                                                        <select className="appearance-none w-full bg-[#f0f1f1] border-2 border-r-0 border-[#acadad] py-4 pl-3 pr-6 font-bold text-[10px] uppercase rounded-l-lg focus:border-[#0c0f0f] outline-none transition-colors cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:0.7em_0.7em] bg-[right_0.3rem_center] bg-no-repeat">
                                                            <option value="VND">VND</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                    </div>
                                                    <input className="flex-grow min-w-0 bg-white border-2 border-[#acadad] p-4 font-bold rounded-r-lg focus:border-[#0c0f0f] outline-none transition-colors" placeholder="0.00" type="number"/>
                                                </div>
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button className="material-icons-outlined text-[#acadad] hover:text-[#b02500] transition-colors" type="button">delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex items-center justify-center gap-6">
                                    <button className="bg-white text-[#0c0f0f] pop-art-border pop-art-shadow-small px-5 py-2 font-headline font-black text-[10px] uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg" type="button">
                                        Previous
                                    </button>
                                    <span className="font-headline font-black text-sm uppercase tracking-widest text-[#0c0f0f]">
                                        1 / X
                                    </span>
                                    <button className="bg-white text-[#0c0f0f] pop-art-border pop-art-shadow-small px-5 py-2 font-headline font-black text-[10px] uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg" type="button">
                                        Next
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-6 mb-6">
                                    <h4 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
                                        <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm font-bold">03</span>
                                        Invite
                                    </h4>
                                    <div className="inline-flex items-center gap-2.5">
                                        <input className="custom-checkbox custom-checkbox-dark-border" id="invite-everyone-check" type="checkbox" />
                                        <label className="font-label text-xs font-bold uppercase tracking-widest cursor-pointer leading-none text-[#0c0f0f]" htmlFor="invite-everyone-check">Everyone</label>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-2 bg-white pop-art-border pop-art-shadow-small px-3 py-1.5 rounded-lg">
                                            <span className="font-bold text-xs uppercase">John Doe</span>
                                            <button className="material-icons-outlined text-sm hover:text-[#b02500] transition-colors" type="button">close</button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white pop-art-border pop-art-shadow-small px-3 py-1.5 rounded-lg">
                                            <span className="font-bold text-xs uppercase">Jane Smith</span>
                                            <button className="material-icons-outlined text-sm hover:text-[#b02500] transition-colors" type="button">close</button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white pop-art-border pop-art-shadow-small px-3 py-1.5 rounded-lg">
                                            <span className="font-bold text-xs uppercase">Michael Lee</span>
                                            <button className="material-icons-outlined text-sm hover:text-[#b02500] transition-colors" type="button">close</button>
                                        </div>
                                    </div>
                                    <button className="bg-[#ffd709] text-[#0c0f0f] pop-art-border pop-art-shadow-small px-6 py-2.5 font-headline font-black text-xs uppercase tracking-widest hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all rounded-lg" type="button">
                                        + Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div>
                                <h4 className="font-headline font-black text-base uppercase flex items-center gap-3 mb-2">
                                    <span className="w-5 h-5 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-[9px] font-bold">04</span>
                                    Upload Bill
                                </h4>
                                <div className="relative group cursor-pointer">
                                    <div className="absolute inset-0 bg-[#0c0f0f] pop-art-shadow-small translate-x-1 translate-y-1 rounded-lg"></div>
                                    <div className="relative bg-white p-3 rounded-lg border-2 border-[#0c0f0f] flex flex-col items-center text-center gap-1.5 hover:bg-[#fff2cd] transition-colors">
                                        <div className="w-10 h-10 bg-[#ffd709] rounded-full flex items-center justify-center border-2 border-[#0c0f0f] sticker-rotate-left">
                                            <span className="material-icons-outlined text-xl text-[#0c0f0f]">receipt_long</span>
                                        </div>
                                        <h3 className="font-headline font-black text-base uppercase leading-tight">Upload Your Bill</h3>
                                        <p className="font-body text-[9px] font-medium text-[#5a5c5c] max-w-[160px]">
                                            Upload receipt PDF or Image.
                                        </p>
                                        <div className="mt-1 px-3 py-1 bg-[#0c0f0f] text-white rounded-full font-headline font-bold text-[8px] uppercase tracking-widest">
                                            Upload File
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t-4 border-dashed border-[#dbdddd] flex flex-col gap-4">
                                <button className="w-full bg-[#f0f1f1] border-2 border-[#0c0f0f] py-3 font-headline font-black text-base uppercase tracking-widest hover:bg-[#e7e8e8] transition-all rounded-lg" type="button">
                                    Cancel
                                </button>
                                <button className="w-full bg-[#ffd709] text-[#453900] pop-art-border pop-art-shadow-small py-3 font-headline font-black text-base uppercase tracking-tighter hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-all rounded-lg" type="submit">
                                    Confirm &amp; Save
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
