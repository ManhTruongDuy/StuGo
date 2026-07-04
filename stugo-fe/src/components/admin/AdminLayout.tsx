import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Handshake,
    LogOut,
    Menu,
    X,
    ChevronRight,
    User,
    Shield,
    CalendarDays,
    CreditCard,
    MessageSquare,
    Bell,
    Package,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    useEffect(() => {
        if (user && user.role !== 'admin') {
            toast.error('Bạn không có quyền truy cập trang quản trị!');
            navigate('/');
        }
    }, [user, navigate]);

    const menuItems = [
        {
            icon: LayoutDashboard,
            label: 'Tổng quan',
            path: '/admin',
        },
        {
            icon: CalendarDays,
            label: 'Lịch sử đặt chỗ',
            path: '/admin/bookings',
        },
        {
            icon: CreditCard,
            label: 'Lịch sử giao dịch',
            path: '/admin/transactions',
        },
        {
            icon: CreditCard,
            label: 'Quản lý rút tiền',
            path: '/admin/withdrawals',
        },
        {
            icon: Handshake,
            label: 'Quản lý dịch vụ',
            path: '/admin/services',
        },
        {
            icon: CreditCard,
            label: 'Yêu cầu hoàn tiền',
            path: '/admin/refunds',
        },
        {
            icon: Package,
            label: 'Quản lý Combo',
            path: '/admin/combos',
        },
        {
            icon: Users,
            label: 'Người dùng',
            path: '/admin/users',
        },
        {
            icon: Handshake,
            label: 'Đối tác',
            path: '/admin/partners',
        },
        {
            icon: MessageSquare,
            label: 'Khiếu nại & Phản hồi',
            path: '/admin/complaints',
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
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-dark-200 to-dark-300 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-display font-bold text-white">
                                Admin
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
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                    {user?.fullName}
                                </p>
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium mt-0.5">
                                    <Shield className="w-3 h-3" />
                                    Quản trị viên
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
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
                            Bảng điều khiển Admin
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
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

export default AdminLayout;
