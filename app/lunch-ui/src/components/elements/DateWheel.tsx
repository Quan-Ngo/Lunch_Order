import { useRef } from 'react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateRange(centerDate: Date): Date[] {
    const days: Date[] = [];
    for (let i = -3; i <= 3; i += 1) {
        const d = new Date(centerDate);
        d.setDate(centerDate.getDate() + i);
        days.push(d);
    }
    return days;
}

export function toISODate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

interface DateWheelProps {
    selected: string;
    onChange: (d: string) => void;
    className?: string;
    todayLabel?: string;
}

export function DateWheel({
    selected,
    onChange,
    className = '',
    todayLabel = 'TODAY',
}: DateWheelProps) {
    const dateInputRef = useRef<HTMLInputElement>(null);
    const today = toISODate(new Date());
    const selectedDate = new Date(`${selected}T00:00:00`);
    const days = getDateRange(selectedDate);
    const monthName = selectedDate.toLocaleString('default', { month: 'long' });
    const monthLabel = `${monthName} ${selectedDate.getFullYear()}`;

    const handleOpenDatePicker = () => {
        const input = dateInputRef.current;
        if (!input) return;
        const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
        if (pickerInput.showPicker) {
            pickerInput.showPicker();
            return;
        }
        input.click();
    };

    return (
        <div className={className}>
            <div className="flex items-center gap-2 mb-4">
                <button
                    type="button"
                    onClick={handleOpenDatePicker}
                    className="flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Open date picker"
                >
                    <span className="material-icons text-base">calendar_today</span>
                </button>
                <span className="text-sm font-semibold text-gray-600">{monthLabel}</span>
                <input
                    ref={dateInputRef}
                    type="date"
                    value={selected}
                    onChange={(e) => {
                        if (e.target.value) onChange(e.target.value);
                    }}
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {days.map((d) => {
                    const iso = toISODate(d);
                    const isSelected = iso === selected;
                    const isToday = iso === today;
                    return (
                        <button
                            key={iso}
                            onClick={() => onChange(iso)}
                            className={`flex flex-col items-center min-w-[58px] px-2 py-3 rounded-xl border-2 transition-all font-body
                                ${isSelected
                                    ? 'bg-primary border-black shadow-[var(--shadow-neobrutalism)] -translate-y-1 font-bold'
                                    : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xs text-gray-500">{DAY_LABELS[d.getDay()]}</span>
                            <span className={`text-lg font-bold mt-0.5 ${isSelected ? 'text-black' : 'text-gray-800'}`}>
                                {d.getDate()}
                            </span>
                            {isToday && (
                                <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'text-black' : 'text-primary-hover'}`}>
                                    {todayLabel}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
