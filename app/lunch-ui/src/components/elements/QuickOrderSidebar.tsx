import React from 'react';

export interface QuickOrderItem {
    id: string;
    date: string;
    status: 'OPEN' | 'COMPLETED' | 'CLOSED';
    title: string;
    details: string;
    isActive?: boolean;
}

export interface QuickOrderSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    title: React.ReactNode;
    collapsedIcon?: string;
    collapsedTitle?: string;
    items: QuickOrderItem[];
    onItemClick?: (item: QuickOrderItem) => void;
    footer?: React.ReactNode;
}

export function QuickOrderSidebar({
    isCollapsed,
    onToggleCollapse,
    title,
    collapsedIcon = "history",
    collapsedTitle = "HISTORY",
    items,
    onItemClick,
    footer
}: QuickOrderSidebarProps) {
    
    const getStatusStyle = (status: QuickOrderItem['status']) => {
        const base = "border-2 border-[#0c0f0f] shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase rounded-md px-2.5 py-0.5 italic";
        switch (status) {
            case 'OPEN':
                return `bg-[#ffd709] text-black ${base}`;
            case 'COMPLETED':
                return `bg-[#4ade80] text-white ${base}`;
            case 'CLOSED':
                return `bg-[#f95630] text-[#520c00] ${base}`;
            default:
                return base;
        }
    };

    return (
        <aside className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'md:w-20 py-6 px-2' : 'md:w-64 p-5 lg:w-[280px] shrink-0'} bg-[#ffd709] flex flex-col gap-5 overflow-y-auto border-r-4 border-[#0c0f0f] relative`}>
            <button  
                onClick={onToggleCollapse}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center cursor-pointer bg-transparent border-0 hover:bg-white/20 transition-all z-20 rounded-lg"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                type="button"
            >
                <span className={`material-icons-outlined font-black text-[#0c0f0f] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>chevron_left</span>
            </button>

            {isCollapsed ? (
                <div className="flex flex-col items-center gap-6 mt-12">
                    <span className="material-icons-outlined text-[#0c0f0f] text-3xl font-bold">{collapsedIcon}</span>
                    <div className="[writing-mode:vertical-lr] font-headline font-black text-lg uppercase tracking-widest text-[#0c0f0f] rotate-180">{collapsedTitle}</div>
                </div>
            ) : (
                <>
                    <h2 className="font-extrabold font-display text-3xl uppercase mb-2 text-[#453900] pr-10">
                        {title}
                    </h2>
                    <div className="flex flex-col gap-4">
                        {items.map((item) => (
                            <div 
                                key={item.id} 
                                onClick={() => onItemClick?.(item)}
                                className={`${item.isActive ? 'bg-[#ffffff] pop-art-border active:scale-95' : 'bg-white/50 hover:bg-white'} p-4 flex flex-col gap-2 cursor-pointer transition-all rounded-lg`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-headline font-bold text-xs tracking-widest ${item.isActive ? 'text-[#a03a0f]' : 'text-[#5a5c5c]'}`}>
                                        {item.date}
                                    </span>
                                    <div className={getStatusStyle(item.status)}>
                                        {item.status}
                                    </div>
                                </div>
                                <h3 className={`font-headline font-extrabold text-lg uppercase ${item.isActive ? 'text-[#0c0f0f] italic' : 'text-[#5a5c5c]'}`}>
                                    {item.title}
                                </h3>
                                <p className={`font-body text-xs font-medium ${item.isActive ? 'text-[#5a5c5c]' : 'text-[#5a5c5c]/70'}`}>
                                    {item.details}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {!isCollapsed && footer && (
                <div className="mt-auto pt-4 border-t-2 border-[#0c0f0f]/10">
                    {footer}
                </div>
            )}
        </aside>
    );
}
