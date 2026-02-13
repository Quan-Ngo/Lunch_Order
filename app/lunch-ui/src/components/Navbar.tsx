import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
    { to: '/', label: 'Daily Menu' },
    { to: '/employees', label: 'Employees' },
    { to: '/catalog', label: 'Catalog' },
    { to: '/manage-menu', label: 'Manage Menu' },
    { to: '/daily-orders', label: 'Daily Orders' },
];

export default function Navbar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    const isActive = (path: string): boolean => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-lg border-2 border-black shadow-[var(--shadow-neobrutalism)]">
                            <span className="material-icons text-black text-2xl">lunch_dining</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-text-primary-light font-display">
                            Conarum <span className="text-primary-hover">Lunch</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm font-medium transition-colors ${isActive(link.to)
                                        ? 'text-text-primary-light font-bold border-b-2 border-primary'
                                        : 'text-text-secondary-light hover:text-primary'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                            <span className="material-icons text-yellow-500 text-sm">star</span>
                            <span className="text-sm font-bold text-text-primary-light">450 pts</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gray-300 overflow-hidden border-2 border-primary">
                            <img
                                alt="User Avatar"
                                className="h-full w-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2S5dxnwm_fqnD7oPOCT9w_85nvWWQ6m02iaf1UbJr6503WMmvZn-M1btT14J4b-pBFfOxhUFFv-QA_uzW_ytwSJCozaq0g3JgxP2rlgTwKOHc1cBGtGJAEsIIukEUa99PJlxrCHB5_vGiPTLuRVgA2L4sTqaRM1EaqieOqpFg4YzuXzXMGjTrlptJFQ0KJ3cMHhMcAh5nKO4NESIF3A3yL8WJ0_hyR8DlsMhS-gkN7-RSSR4JcfudC_XugaNWBmg3ULFkxsNUnvI"
                            />
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <span className="material-icons text-2xl">
                                {isMobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${isActive(link.to)
                                        ? 'bg-primary text-black font-bold border-2 border-black shadow-[var(--shadow-neobrutalism-sm)]'
                                        : 'text-text-secondary-light hover:bg-gray-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
