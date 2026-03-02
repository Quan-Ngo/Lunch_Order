interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
}

export function SearchBar({ value, onChange, placeholder, className = '' }: SearchBarProps) {
    return (
        <div className={`relative w-full ${className}`.trim()}>
            <span className="material-icons-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                search
            </span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label={placeholder}
            />
        </div>
    );
}
