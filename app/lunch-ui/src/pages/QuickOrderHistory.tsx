import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { Button } from '@/components/elements/Button';
import { Badge } from '@/components/elements/Badge';

export default function QuickOrderHistory() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="bg-[#f6f6f6] font-body text-[#2d2f2f] min-h-screen flex flex-col overflow-x-hidden">
            <Navbar />
            <main className="flex-grow grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[calc(100vh-80px)]">
                {/* Sidebar */}
                <aside className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:col-span-1 py-6 px-2' : 'md:col-span-3 p-6'} bg-[#ffd709] flex flex-col gap-6 overflow-y-auto border-r-4 border-[#0c0f0f] relative`}>
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
                            <div className="[writing-mode:vertical-lr] font-headline font-black text-lg uppercase tracking-widest text-[#0c0f0f] rotate-180">HISTORY</div>
                        </div>
                    ) : (
                        <>
                            <h2 className="font-extrabold font-display text-3xl uppercase mb-2 text-[#453900] pr-10">
                                QUICK ORDER<br/>HISTORY
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="bg-[#ffffff] pop-art-border p-4 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-xs tracking-widest text-[#a03a0f]">NOV 04</span>
                                        <Badge className="bg-[#ffd709] text-black border-2 border-[#0c0f0f] text-[9px]">OPEN</Badge>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-lg text-[#0c0f0f] uppercase italic">Tsukuyomi Express</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]">4 Items • $42.50</p>
                                </div>
                                <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-xs tracking-widest text-[#5a5c5c]">NOV 01</span>
                                        <Badge className="bg-green-500 text-white border-2 border-[#0c0f0f] text-[9px]">COMPLETED</Badge>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-lg text-[#5a5c5c] uppercase">The Burger Joint</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">2 Items • $28.00</p>
                                </div>
                                <div className="bg-white/50 p-4 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-headline font-bold text-xs tracking-widest text-[#5a5c5c]">OCT 28</span>
                                        <Badge className="bg-[#f95630] text-[#520c00] border-2 border-[#0c0f0f] text-[9px]">CLOSED</Badge>
                                    </div>
                                    <h3 className="font-headline font-extrabold text-lg text-[#5a5c5c] uppercase">Green Salad Co.</h3>
                                    <p className="font-body text-xs font-medium text-[#5a5c5c]/70">1 Item • $14.20</p>
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                {/* Main Section */}
                <section className={`${isSidebarCollapsed ? 'md:col-span-11' : 'md:col-span-9'} bg-[#f6f6f6] overflow-y-auto relative p-6 md:p-8 transition-all duration-300`}>
                    <PageHeader title="TSUKUYOMI EXPRESS">
                        <div className="flex flex-col items-end gap-3">
                            <Badge className="bg-[#ffd709] border-[3px] border-[#0c0f0f] px-6 py-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[#0c0f0f] font-extrabold text-xl uppercase">
                                OPEN
                            </Badge>
                            <div className="inline-flex items-center gap-2 bg-[#0c0f0f] text-[#ffffff] px-3 py-1.5 rounded-full">
                                <span className="material-icons-outlined text-[10px]">person</span>
                                <span className="font-headline font-bold text-[10px] uppercase tracking-wider">Created by Sarah J.</span>
                            </div>
                        </div>
                    </PageHeader>
                    
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex flex-col gap-8 lg:flex-[0_0_75%]">
                            <SoftCard className="border-[#0c0f0f] p-6 lg:p-8 overflow-visible">
                                <h4 className="font-display font-extrabold text-lg uppercase mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">01</span>
                                    Select Option
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                    <button className="bg-[#ffd709] border-2 border-[#0c0f0f] shadow-[2px_2px_0px_#0c0f0f] px-4 py-3 flex flex-col items-start gap-1 group active:scale-95 transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase group-hover:italic transition-all">Truffle Ramen</span>
                                        <span className="font-body text-xs font-bold opacity-70">$12.50</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-4 py-3 flex flex-col items-start gap-1 hover:border-[#0c0f0f] hover:shadow-[2px_2px_0px_#0c0f0f] transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase">Salmon Aburi</span>
                                        <span className="font-body text-xs font-bold text-[#5a5c5c]">$14.00</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-4 py-3 flex flex-col items-start gap-1 hover:border-[#0c0f0f] hover:shadow-[2px_2px_0px_#0c0f0f] transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase">Spicy Miso</span>
                                        <span className="font-body text-xs font-bold text-[#5a5c5c]">$11.50</span>
                                    </button>
                                    <button className="bg-[#ffd709] border-2 border-[#0c0f0f] shadow-[2px_2px_0px_#0c0f0f] px-4 py-3 flex flex-col items-start gap-1 group transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase italic">Gyoza (6pc)</span>
                                        <span className="font-body text-xs font-bold opacity-70">$8.00</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-4 py-3 flex flex-col items-start gap-1 hover:border-[#0c0f0f] hover:shadow-[2px_2px_0px_#0c0f0f] transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase">Edamame</span>
                                        <span className="font-body text-xs font-bold text-[#5a5c5c]">$5.50</span>
                                    </button>
                                    <button className="bg-[#ffffff] border-2 border-[#acadad] px-4 py-3 flex flex-col items-start gap-1 hover:border-[#0c0f0f] hover:shadow-[2px_2px_0px_#0c0f0f] transition-all rounded-lg">
                                        <span className="font-headline font-bold text-sm uppercase">Pancakes</span>
                                        <span className="font-body text-xs font-bold text-[#5a5c5c]">$9.00</span>
                                    </button>
                                </div>
                            </SoftCard>
                            
                            <SoftCard className="border-[#0c0f0f] p-6 lg:p-8 overflow-visible">
                                <h4 className="font-display font-extrabold text-lg uppercase mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">03</span>
                                    Add Comments
                                </h4>
                                <textarea className="w-full h-24 neo-input p-3 text-sm resize-none placeholder:text-[#acadad]" placeholder="Add special requests or notes for the kitchen..."></textarea>
                            </SoftCard>
                            
                            <div className="pt-4 border-t-2 border-dashed border-[#dbdddd]">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <span className="font-headline font-bold text-[10px] uppercase tracking-widest text-[#5a5c5c] block mb-1">Total Selection</span>
                                        <div className="font-display font-extrabold text-3xl text-[#0c0f0f]">$20.50</div>
                                    </div>
                                    <span className="font-body text-[10px] text-[#5a5c5c] font-medium">Incl. service &amp; taxes</span>
                                </div>
                                <Button variant="primary" fullWidth size="lg" className="py-4 text-base">
                                    Confirm Choice
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-[0_0_25%]">
                            <h4 className="font-display font-extrabold text-lg uppercase flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 bg-[#0c0f0f] text-[#ffd709] rounded-full flex items-center justify-center text-xs">02</span>
                                Bill
                            </h4>
                            <SoftCard className="w-full border-[#0c0f0f] p-3 text-center transition-colors group relative overflow-visible flex flex-col gap-2">
                                <div className="absolute top-[-10px] right-[-10px] z-10">
                                    <Badge className="bg-[#a03a0f] text-white px-2 py-0.5 border-2 border-[#0c0f0f] text-[7px] tracking-widest sticker-rotate-right">Verified</Badge>
                                </div>
                                <img alt="Restaurant receipt" className="w-[85%] mx-auto h-auto max-h-[300px] object-contain rounded-lg filter grayscale contrast-125 border border-dashed border-[#e4e4e7] p-1 bg-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe81kb-s2v3BUo25hPzDYyUHStUwa-i2LRw5h3do-PSUM-BmnJt7tcnzyMKSgit04ZYllD14OLWlf04Ya25atblAJP35-dgMUBtmL8jDlpVzhfnC_vQtdUcX3AJpAXkostZi9c0gTW73Q0JNkNlyTipFXmnmnSnrWgpQZtuSURBYBdV3rAMp1VdaB9UkPcTB5xGnw8HLA51SyJpIPPE6g7HaMEbGPqoQJ8mb8Bgb0Zf7r7Ab9XlhH66YMtVvLzOQW8u2lpGZgTdD0"/>
                                <div className="mt-2 border-t-2 border-dashed border-[#e4e4e7] pt-2">
                                    <div className="flex justify-between font-headline font-bold text-[10px] uppercase">
                                        <span>Subtotal</span>
                                        <span>$18.50</span>
                                    </div>
                                    <div className="flex justify-between font-headline font-bold text-[10px] uppercase mt-0.5">
                                        <span>Tax</span>
                                        <span>$2.00</span>
                                    </div>
                                </div>
                            </SoftCard>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
