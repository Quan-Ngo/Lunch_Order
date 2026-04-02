import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function QuickOrderHistory() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f6f6] font-['Plus_Jakarta_Sans'] text-[#2d2f2f] min-h-screen flex flex-col overflow-x-hidden">
            <Navbar />
            <main className="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[calc(100vh-80px)]">
                {/* Sidebar */}
                <aside className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:col-span-1 py-6 px-2' : 'md:col-span-3 p-8'} bg-[#ffd709] flex flex-col gap-8 overflow-y-auto border-r-4 border-[#0c0f0f] relative`}>
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all z-20 rounded-lg"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <span className={`material-icons-outlined font-black text-[#0c0f0f] transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>chevron_left</span>
                    </button>

                    {isSidebarCollapsed ? (
                        <div className="flex flex-col items-center gap-6 mt-12">
                            <span className="material-icons-outlined text-[#0c0f0f] text-3xl font-bold">history</span>
                            <div className="[writing-mode:vertical-lr] font-headline font-black text-xl uppercase tracking-widest text-[#0c0f0f] rotate-180">HISTORY</div>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-headline font-black text-4xl leading-none uppercase tracking-tighter text-[#5b4b00] pr-10">
                                QUICK ORDER<br/>HISTORY
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="bg-[#ffffff] pop-art-border p-4 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#a03a0f]">NOV 04</span>
                                        <span className="bg-[#ffd709] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">OPEN</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#0c0f0f] uppercase italic">Tsukuyomi Express</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]">4 Items • $42.50</p>
                                </div>
                                <div className="bg-[#ffffff]/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-[#ffffff] transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#5a5c5c]">NOV 01</span>
                                        <span className="bg-[#4ade80] text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">COMPLETED</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#5a5c5c] uppercase">The Burger Joint</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">2 Items • $28.00</p>
                                </div>
                                <div className="bg-[#ffffff]/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-[#ffffff] transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-sm tracking-widest text-[#5a5c5c]">OCT 28</span>
                                        <span className="bg-[#f95630] text-[#520c00] px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-[#0c0f0f]">CLOSED</span>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-xl text-[#5a5c5c] uppercase">Green Salad Co.</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">1 Item • $14.20</p>
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                {/* Main Section */}
                <section className={`${isSidebarCollapsed ? 'md:col-span-11' : 'md:col-span-9'} bg-[#f6f6f6] overflow-y-auto relative p-8 md:p-12 transition-all duration-300`}>
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                        <div>
                            <h1 className="font-headline font-black text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase leading-tight text-[#0c0f0f]">
                                TSUKUYOMI <span className="text-[#a03a0f] italic">EXPRESS</span>
                            </h1>
                            <div className="mt-4 inline-flex items-center gap-3 bg-[#0c0f0f] text-[#ffffff] px-4 py-2 rounded-full">
                                <span className="material-icons-outlined text-sm">person</span>
                                <span className="font-label text-xs font-bold uppercase tracking-widest">Created by Sarah J.</span>
                            </div>
                        </div>
                        <div className="bg-[#ffd709] pop-art-border pop-art-shadow px-8 py-6 flex flex-col items-center justify-center sticker-rotate-right rounded-lg">
                            <span className="font-headline font-black text-4xl italic uppercase">OPEN</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row gap-12">
                        <div className="flex flex-col gap-10 lg:flex-[0_0_75%]">
                            <div>
                                <h4 className="font-headline font-black text-2xl uppercase mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm">01</span>
                                    Select Option
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                    <button className="bg-[#ffd709] pop-art-border px-6 py-4 flex flex-col items-start gap-1 group active:scale-95 transition-all rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase group-hover:italic transition-all">Truffle Ramen</span>
                                        <span className="font-body text-sm font-bold opacity-70">$12.50</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-6 py-4 flex flex-col items-start gap-1 hover:border-[#0c0f0f] transition-colors rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase">Salmon Aburi</span>
                                        <span className="font-body text-sm font-bold text-[#5a5c5c]">$14.00</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-6 py-4 flex flex-col items-start gap-1 hover:border-[#0c0f0f] transition-colors rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase">Spicy Miso</span>
                                        <span className="font-body text-sm font-bold text-[#5a5c5c]">$11.50</span>
                                    </button>
                                    <button className="bg-[#ffd709] pop-art-border px-6 py-4 flex flex-col items-start gap-1 group transition-all rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase italic">Gyoza (6pc)</span>
                                        <span className="font-body text-sm font-bold opacity-70">$8.00</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-6 py-4 flex flex-col items-start gap-1 hover:border-[#0c0f0f] transition-colors rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase">Edamame</span>
                                        <span className="font-body text-sm font-bold text-[#5a5c5c]">$5.50</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-6 py-4 flex flex-col items-start gap-1 hover:border-[#0c0f0f] transition-colors rounded-lg">
                                        <span className="font-headline font-bold text-lg uppercase">Pancakes</span>
                                        <span className="font-body text-sm font-bold text-[#5a5c5c]">$9.00</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-headline font-black text-2xl uppercase mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm">03</span>
                                    Add Comments
                                </h4>
                                <textarea className="w-full h-32 bg-[#ffffff] border-2 border-[#0c0f0f] p-4 rounded-xl focus:ring-2 focus:ring-[#ffd709] focus:outline-none font-body text-sm font-medium resize-none placeholder:text-[#acadad]" placeholder="Add special requests or notes for the kitchen..."></textarea>
                            </div>
                            
                            <div className="mt-4 pt-8 border-t-4 border-dashed border-[#dbdddd]">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <span className="font-label text-xs font-black uppercase tracking-[0.2em] text-[#5a5c5c]">Total Selection</span>
                                        <div className="font-headline font-black text-5xl text-[#0c0f0f]">$20.50</div>
                                    </div>
                                    <span className="font-body text-xs text-[#5a5c5c] font-medium">Incl. service &amp; taxes</span>
                                </div>
                                <button className="w-full bg-[#ffd709] text-[#5b4b00] pop-art-border pop-art-shadow py-6 font-headline font-black text-2xl uppercase tracking-tighter hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 transition-all rounded-lg">
                                    Confirm Choice
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 lg:flex-[0_0_25%]">
                            <h4 className="font-headline font-black text-2xl uppercase flex items-center gap-3">
                                <span className="w-8 h-8 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-sm">02</span>
                                Bill
                            </h4>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-[#0c0f0f] pop-art-shadow-small translate-x-1.5 translate-y-1.5 rounded-xl"></div>
                                <div className="relative bg-[#ffffff] p-3 lg:p-4 rounded-xl border-2 border-[#0c0f0f] overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 z-10">
                                        <span className="bg-[#a03a0f] text-[#ffefeb] px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest sticker-rotate-right">Verified</span>
                                    </div>
                                    <img alt="Restaurant receipt" className="w-full h-auto max-h-[350px] object-contain rounded-lg filter grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe81kb-s2v3BUo25hPzDYyUHStUwa-i2LRw5h3do-PSUM-BmnJt7tcnzyMKSgit04ZYllD14OLWlf04Ya25atblAJP35-dgMUBtmL8jDlpVzhfnC_vQtdUcX3AJpAXkostZi9c0gTW73Q0JNkNlyTipFXmnmnSnrWgpQZtuSURBYBdV3rAMp1VdaB9UkPcTB5xGnw8HLA51SyJpIPPE6g7HaMEbGPqoQJ8mb8Bgb0Zf7r7Ab9XlhH66YMtVvLzOQW8u2lpGZgTdD0"/>
                                    <div className="mt-4 border-t-2 border-dashed border-[#e4e4e7] pt-3">
                                        <div className="flex justify-between font-headline font-bold text-xs uppercase">
                                            <span>Subtotal</span>
                                            <span>$18.50</span>
                                        </div>
                                        <div className="flex justify-between font-headline font-bold text-xs uppercase mt-1">
                                            <span>Tax</span>
                                            <span>$2.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
