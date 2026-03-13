import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationPageSelect } from '@/components/elements/NavigationPageSelect';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/i18n';

const navLinks = [
    { to: '/', labelKey: 'navbar.dailyMenu', allowedRoles: ['admin', 'staff'] },
    { to: '/employees', labelKey: 'navbar.employees', allowedRoles: ['admin'] },
    { to: '/catalog', labelKey: 'navbar.catalog', allowedRoles: ['admin'] },
    { to: '/manage-menu', labelKey: 'navbar.manageMenu', allowedRoles: ['admin'] },
    { to: '/daily-orders', labelKey: 'navbar.dailyOrders', allowedRoles: ['admin'] },
];

const LANGUAGE_LABELS: Record<string, string> = {
    en: 'English',
    vi: 'Tiếng Việt',
    de: 'Deutsch',
    ja: '日本語',
};

export default function Navbar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const { currentUser, isLoadingUser, setCurrentUser } = useAuth();
    const { t, i18n } = useTranslation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isActive = (path: string): boolean => location.pathname === path;

    const displayName = currentUser?.role === 'admin'
        ? t('navbar.admin')
        : currentUser?.staff?.name ?? t('navbar.staffProfileMissing');

    const mobileDisplayName = currentUser?.role === 'admin'
        ? t('navbar.admin')
        : currentUser?.staff?.name?.trim().split(/\s+/)[0] ?? t('navbar.staffProfileMissing');

    const avatarInitial = currentUser?.role === 'admin'
        ? 'A'
        : (currentUser?.staff?.name?.[0] ?? '?');

    const handleLogout = () => {
        setCurrentUser(null);
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        if (!import.meta.env.DEV) {
            window.location.assign('/logout');
        }
    };

    const handleLanguageChange = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, lang);
        setIsDropdownOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userDropdown = (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)] hover:bg-gray-50 transition-colors cursor-pointer"
            >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border-2 border-accent-green text-xs sm:text-sm font-bold bg-primary text-black">
                    {avatarInitial}
                </div>
                <span className="text-sm font-semibold text-gray-800 hidden sm:block">
                    {displayName}
                </span>
                <span className="material-icons text-sm text-gray-500 hidden sm:block" style={{ transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    expand_more
                </span>
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-black rounded-xl shadow-[var(--shadow-neobrutalism)] z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{currentUser?.staff?.email ?? t('navbar.staff')}</p>
                    </div>

                    {/* Language section */}
                    <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('navbar.toggleLanguage')}</p>
                        <div className="flex flex-wrap gap-1">
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                                        i18n.language === lang
                                            ? 'bg-primary border-black text-black'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                        <span className="material-icons text-base">logout</span>
                        {t('navbar.logout')}
                    </button>
                </div>
            )}
        </div>
    );

    const noProfileBadge = (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)] text-sm font-semibold text-gray-800">
            <span className="material-icons text-base">person_off</span>
            <span>{t('navbar.staffProfileMissing')}</span>
        </div>
    );

    const mobileUserBadge = (
        <div className="md:hidden flex items-center gap-2 px-2.5 py-1.5 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)]">
            <div className="h-7 w-7 rounded-full flex items-center justify-center border-2 border-accent-green text-xs font-bold bg-primary text-black">
                {avatarInitial}
            </div>
            <span className="text-sm font-semibold text-gray-800 max-w-20 truncate">
                {mobileDisplayName}
            </span>
        </div>
    );

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 sm:h-20 items-center gap-3">
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
                        <div className="bg-primary p-1.5 sm:p-2 rounded-lg border-2 border-black shadow-[var(--shadow-neobrutalism)] transition-transform group-hover:rotate-3">
                            <span className="material-icons text-black text-xl sm:text-2xl">lunch_dining</span>
                        </div>
                        <span className="text-base sm:text-2xl font-bold tracking-tight text-text-primary-light font-display whitespace-nowrap">
                            conarum <span style={{ color: '#E6C200' }}>Lunch</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navLinks
                            .filter((link) => link.allowedRoles.includes(currentUser?.role ?? 'staff'))
                            .map((link) => (
                            <Link key={link.to} to={link.to}>
                                <NavigationPageSelect
                                    variant={isActive(link.to) ? 'primary' : 'ghost'}
                                    size="sm"
                                    className={isActive(link.to) ? '' : 'border-transparent font-medium hover:border-gray-200'}
                                >
                                    {t(link.labelKey)}
                                </NavigationPageSelect>
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {isLoadingUser ? (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)]">
                                <span className="material-icons animate-spin text-base">progress_activity</span>
                                <span className="text-sm font-semibold text-gray-800">{t('navbar.loadingUser')}</span>
                            </div>
                        ) : currentUser ? (
                            <>
                                <div className="hidden md:block">
                                    {userDropdown}
                                </div>
                                {mobileUserBadge}
                            </>
                        ) : (
                            noProfileBadge
                        )}

                        <button
                            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <span className="material-icons text-xl sm:text-2xl">
                                {isMobileMenuOpen ? 'close' : 'menu'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks
                            .filter((link) => link.allowedRoles.includes(currentUser?.role ?? 'staff'))
                            .map((link) => (
                        {isLoadingUser ? (
                            <div className="flex items-center gap-2 pb-3 border-b border-gray-200 text-sm font-semibold text-gray-800">
                                <span className="material-icons animate-spin text-base">progress_activity</span>
                                <span>{t('navbar.loadingUser')}</span>
                            </div>
                        ) : currentUser ? (
                            <div className="pb-3 border-b border-gray-200 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{mobileDisplayName}</p>
                                        <p className="text-xs text-gray-500 truncate">{currentUser.staff?.email ?? t('navbar.staff')}</p>
                                    </div>
                                </div>
                                {/* Language switcher mobile */}
                                <div className="flex flex-wrap gap-1">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => handleLanguageChange(lang)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                                                i18n.language === lang
                                                    ? 'bg-primary border-black text-black'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                                            }`}
                                        >
                                            {LANGUAGE_LABELS[lang] ?? lang.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                {/* Logout mobile */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                    <span className="material-icons text-base">logout</span>
                                    {t('navbar.logout')}
                                </button>
                            </div>
                        ) : (
                            <div className="pb-3 border-b border-gray-200 text-sm font-semibold text-gray-800">
                                {t('navbar.staffProfileMissing')}
                            </div>
                        )}

                        {navLinks.map((link) => (
                            <Link key={link.to} to={link.to} onClick={() => setIsMobileMenuOpen(false)}>
                                <NavigationPageSelect
                                    fullWidth
                                    variant={isActive(link.to) ? 'primary' : 'ghost'}
                                    className="justify-start"
                                >
                                    {t(link.labelKey)}
                                </NavigationPageSelect>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
