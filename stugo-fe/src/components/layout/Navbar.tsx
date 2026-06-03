import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    Menu,
    X,
    User,
    LogOut,
    Settings,
    ChevronDown,
    Calendar,
    Map,
    LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setShowUserMenu(false);
    };

    const navLinks = [
        { name: 'Trang chủ', path: '/' },
        { name: 'Nhà xe', path: '/services/transport' },
        { name: 'Nhà trọ', path: '/services/accommodation' },
        { name: 'Quán ăn', path: '/services/restaurant' },
        { name: 'Bản đồ dịch vụ', path: '/snap-map' },
    ];

    const roleBadge = user?.role === 'admin'
        ? { label: 'Admin', color: 'bg-red-100 text-red-600' }
        : user?.role === 'partner'
        ? { label: 'Đối tác', color: 'bg-teal-100 text-teal-600' }
        : null;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/95 backdrop-blur-lg shadow-lg'
                : 'bg-white/90 backdrop-blur-sm shadow-sm'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src="/logo.jpg"
                            alt="StuGo Logo"
                            className="w-10 h-10 rounded-xl object-cover transform group-hover:scale-105 transition-transform shadow-md"
                        />
                        <span className="text-2xl font-display font-bold gradient-text">
                            StuGo
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-semibold transition-colors duration-200 ${location.pathname === link.path
                                    ? 'text-primary-600'
                                    : 'text-gray-700 hover:text-primary-600'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-3">
                        {/* Search Button */}
                        {/* <button className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                            <Search className="w-5 h-5 text-gray-600" />
                        </button> */}

                        {isAuthenticated && user ? (
                            <>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                                    >
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                                <User className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <span className="font-medium text-gray-700">
                                            {user.fullName}
                                        </span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-slide-down">
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {user.fullName}
                                                    </p>
                                                    {roleBadge && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleBadge.color}`}>
                                                            {roleBadge.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>



                                            <Link
                                                to="/account"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                            >
                                                <User className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">Tài khoản</span>
                                            </Link>

                                            <Link
                                                to="/bookings"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                            >
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">Lịch sử đặt chỗ</span>
                                            </Link>

                                            <Link
                                                to="/snap-map"
                                                onClick={() => setShowUserMenu(false)}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                            >
                                                <Map className="w-4 h-4 text-gray-500" />
                                                <span className="text-gray-700">Bản đồ dịch vụ</span>
                                            </Link>

                                            {(user.role === 'partner' || user.role === 'admin') && (
                                                <Link
                                                    to={user.role === 'admin' ? '/admin' : '/manager'}
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-700">
                                                        {user.role === 'admin'
                                                            ? 'Quản trị'
                                                            : 'Quản lý dịch vụ'}
                                                    </span>
                                                </Link>
                                            )}

                                            <div className="border-t border-gray-100 mt-2 pt-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-50 transition-colors text-red-600"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Đăng xuất</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn-primary">
                                    Đăng nhập
                                </Link>
                                <Link to="/register" className="px-6 py-3 font-semibold text-white bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl hover:from-blue-500 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                    Tạo tài khoản
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        {isOpen ? (
                            <X className="w-6 h-6 text-gray-700" />
                        ) : (
                            <Menu className="w-6 h-6 text-gray-700" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 animate-slide-down">
                    <div className="px-4 py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-4 py-3 rounded-xl font-medium transition-colors ${location.pathname === link.path
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="pt-4 border-t border-gray-100">
                            {isAuthenticated && user ? (
                                <>
                                    <div className="flex items-center gap-3 px-4 py-3">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.fullName}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {user.fullName}
                                            </p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>

                                    <Link
                                        to="/account"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl"
                                    >
                                        Tài khoản
                                    </Link>

                                    <Link
                                        to="/bookings"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl"
                                    >
                                        Lịch sử đặt chỗ
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="block btn-primary text-center mb-2"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setIsOpen(false)}
                                        className="block px-6 py-3 text-center font-semibold text-white bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl hover:from-blue-500 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Tạo tài khoản
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
