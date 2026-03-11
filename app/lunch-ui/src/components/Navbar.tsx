import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavigationPageSelect } from '@/components/elements/NavigationPageSelect';
import { useAuth, type AuthUser } from '@/contexts/AuthContext';
import { employeeService, type StaffEntity } from '@/services/api';
import { useTranslation } from 'react-i18next';
import { APP_LANGUAGE_STORAGE_KEY } from '@/i18n';

const navLinks = [
    { to: '/', labelKey: 'navbar.dailyMenu' },
    { to: '/employees', labelKey: 'navbar.employees' },
    { to: '/catalog', labelKey: 'navbar.catalog' },
    { to: '/manage-menu', labelKey: 'navbar.manageMenu' },
    { to: '/daily-orders', labelKey: 'navbar.dailyOrders' },
];

export default function Navbar() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState<boolean>(false);
    const [staffList, setStaffList] = useState<StaffEntity[]>([]);
    const { currentUser, setCurrentUser } = useAuth();
    const { t, i18n } = useTranslation();

    const isActive = (path: string): boolean => location.pathname === path;

    useEffect(() => {
        employeeService.getAll().then(setStaffList).catch(console.error);
    }, []);

    const handleSelectUser = (user: AuthUser | null) => {
        setCurrentUser(user);
        setIsUserDropdownOpen(false);
    };

    const toggleLanguage = () => {
        const nextLanguage = i18n.language === 'en' ? 'vi' : 'en';
        localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, nextLanguage);
        i18n.changeLanguage(nextLanguage);
    };

    const displayName = currentUser
        ? currentUser.role === 'admin'
            ? t('navbar.admin')
            : currentUser.staff?.name ?? t('navbar.staff')
        : t('navbar.selectUser');

    const avatarInitial = currentUser
        ? currentUser.role === 'admin'
            ? 'A'
            : (currentUser.staff?.name?.[0] ?? 'S')
        : '?';

    const ringColor = currentUser
        ? currentUser.role === 'admin'
            ? 'border-accent-pink'
            : 'border-accent-green'
        : 'border-gray-300';

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 sm:h-20 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
                        <div className="bg-primary p-1.5 sm:p-2 rounded-lg border-2 border-black shadow-[var(--shadow-neobrutalism)] transition-transform group-hover:rotate-3">
                            <span className="material-icons text-black text-xl sm:text-2xl">lunch_dining</span>
                        </div>
                        <span className="text-base sm:text-2xl font-bold tracking-tight text-text-primary-light font-display whitespace-nowrap">
                            conarum <span style={{ color: '#E6C200' }}>Lunch</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
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

                    {/* User Selector & Lang Toggle */}
                    <div className="flex items-center gap-2 sm:gap-4 relative shrink-0">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)] hover:shadow-[var(--shadow-neobrutalism)] hover:-translate-y-0.5 transition-all font-bold text-xs sm:text-sm hover:bg-primary/20"
                            title={t('navbar.toggleLanguage')}
                        >
                            {i18n.language === 'vi' ? 'VI' : 'EN'}
                        </button>

                        <button
                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full border-2 border-black bg-white shadow-[var(--shadow-neobrutalism-sm)] hover:shadow-[var(--shadow-neobrutalism)] hover:-translate-y-0.5 transition-all"
                        >
                            {/* Avatar circle */}
                            <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border-2 ${ringColor} text-xs sm:text-sm font-bold bg-primary text-black`}>
                                {avatarInitial}
                            </div>
                            <span className="text-sm font-semibold text-gray-800 hidden sm:block">{displayName}</span>
                            <span className="material-icons text-sm text-gray-500">
                                {isUserDropdownOpen ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {/* Dropdown */}
                        {isUserDropdownOpen && (
                            <div
                                className="absolute right-0 top-12 bg-white border-2 border-black rounded-xl shadow-[var(--shadow-neobrutalism-lg)] z-50 min-w-[200px] overflow-hidden"
                            >
                                {/* Admin option */}
                                <button
                                    onClick={() => handleSelectUser({ role: 'admin' })}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/20 transition-colors text-left ${currentUser?.role === 'admin' ? 'bg-primary/30 font-bold' : ''}`}
                                >
                                    <span className="h-7 w-7 rounded-full border-2 border-accent-pink bg-primary flex items-center justify-center font-bold text-xs">A</span>
                                    <span>{t('navbar.admin')}</span>
                                    {currentUser?.role === 'admin' && <span className="material-icons text-accent-green text-sm ml-auto">check_circle</span>}
                                </button>

                                {/* Divider */}
                                <div className="border-t border-gray-100 mx-3 my-1" />

                                {/* Staff options */}
                                {staffList.map((staff) => (
                                    <button
                                        key={staff.ID}
                                        onClick={() => handleSelectUser({ role: 'staff', staff })}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/20 transition-colors text-left ${currentUser?.staff?.ID === staff.ID ? 'bg-primary/30 font-bold' : ''}`}
                                    >
                                        <span className="h-7 w-7 rounded-full border-2 border-accent-green bg-gray-100 flex items-center justify-center font-bold text-xs">
                                            {staff.name?.[0] ?? '?'}
                                        </span>
                                        <span>{staff.name}</span>
                                        {currentUser?.staff?.ID === staff.ID && <span className="material-icons text-accent-green text-sm ml-auto">check_circle</span>}
                                    </button>
                                ))}

                                {/* Clear */}
                                {currentUser && (
                                    <>
                                        <div className="border-t border-gray-100 mx-3 my-1" />
                                        <button
                                            onClick={() => handleSelectUser(null)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <span className="material-icons text-sm">swap_horiz</span>
                                            <span>{t('navbar.clearSelection')}</span>
                                        </button>
                                    </>
                                )}
                                <div className="border-t border-gray-100 mx-3 my-1" />
                                <button
                                    onClick={() => {
                                        setCurrentUser(null);
                                        window.location.assign('logout');
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-pink hover:bg-red-50 transition-colors text-left"
                                >
                                    <span className="material-icons text-sm">logout</span>
                                    <span>{t('navbar.logout', 'Logout')}</span>
                                </button>
                            </div>
                        )}

                        {/* Mobile Hamburger */}
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

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
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
