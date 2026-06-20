import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    DollarSign,
    PlusCircle,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    User,
    MapPin,
    ListChecks,
    Wallet,
    Zap,
    FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ManagerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Tổng quan',
            path: '/manager',
        },
        {
            icon: CalendarDays,
            label: 'Đặt chỗ',
            path: '/manager/bookings',
        },
        {
            icon: ListChecks,
            label: 'Dịch vụ của tôi',
            path: '/manager/services',
        },
        {
            icon: PlusCircle,
            label: 'Tạo dịch vụ',
            path: '/manager/create',
        },
        {
            icon: Wallet,
            label: 'Lịch sử rút tiền',
            path: '/manager/withdrawals',
        },
        {
            icon: MapPin,
            label: 'Bản đồ dịch vụ',
            path: '/snap-map',
        },
        {
            icon: FileText,
            label: 'Hợp đồng',
            path: '/manager/contract',
        },
        {
            icon: Settings,
            label: 'Cài đặt',
            path: '/manager/settings',
        },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-display font-bold text-white">
                                StuGo
                            </span>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.fullName}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                    {user?.fullName}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Đang hoạt động
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Status */}
                    <div className="px-4 pb-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                            <Zap className="w-4 h-4 text-teal-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-teal-300 uppercase tracking-wide">
                                    {
                                        user?.plan === 'business_basic' 
                                            ? 'BUSINESS BASIC' 
                                            : user?.plan === 'business_premium' 
                                                ? 'BUSINESS PREMIUM' 
                                                : 'GÓI DÙNG THỬ'
                                    }
                                </p>
                            </div>
                            {(!user?.plan || user.plan === 'free') && (
                                <Link to="/subscription?type=partner" className="text-xs text-teal-400 hover:text-teal-300 font-medium flex-shrink-0">
                                    Nâng cấp
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>

                    <div className="hidden lg:block">
                        <h1 className="text-lg font-semibold text-gray-900">
                            Quản lý dịch vụ
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">

                        <Link
                            to="/"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <span className="text-sm font-medium text-gray-700">
                                Xem website
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ManagerLayout;
