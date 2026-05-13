import { useEffect, useMemo, useState } from 'react';
import {
    DollarSign,
    CalendarDays,
    Users,
    Handshake,
    MessageSquare,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    CheckCircle,
    Clock,
    Link as LinkIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    getDashboardOverview,
    getRevenueStats,
    getBookingsByType,
    getRecentBookings,
    type DashboardOverview,
    type RevenueData,
    type BookingByType,
    type RecentBooking,
} from '../../services/dashboard.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminDashboard = () => {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [bookingsByType, setBookingsByType] = useState<BookingByType[]>([]);
    const [recentBookings, setRecentBookingsState] = useState<RecentBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const startDate = new Date(selectedYear, 0, 1).toISOString();
                const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

                const [overviewRes, revenueRes, byTypeRes, recentRes] = await Promise.all([
                    getDashboardOverview(),
                    getRevenueStats(startDate, endDate),
                    getBookingsByType(),
                    getRecentBookings(10),
                ]);

                setOverview(overviewRes);
                setRevenueData(revenueRes);
                setBookingsByType(byTypeRes);
                setRecentBookingsState(recentRes);
            } catch (error) {
                console.error('Error fetching admin dashboard data:', error);
                toast.error('Không thể tải dữ liệu dashboard admin');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear]);

    const stats = useMemo(() => {
        if (!overview) return [];

        return [
            {
                label: 'Tổng doanh thu',
                value: new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                    maximumFractionDigits: 0,
                }).format(overview.revenue.total),
                change: '',
                trend: 'up',
                icon: DollarSign,
                color: 'from-orange-500 to-red-600',
            },
            {
                label: 'Tổng đặt chỗ',
                value: overview.bookings.total.toString(),
                change: `${overview.bookings.today} hôm nay`,
                trend: 'up',
                icon: CalendarDays,
                color: 'from-red-500 to-rose-600',
            },
            {
                label: 'Dịch vụ',
                value: overview.services.total.toString(),
                change: `${overview.services.active} hoạt động`,
                trend: 'up',
                icon: Handshake,
                color: 'from-amber-500 to-orange-600',
            },
            {
                label: 'Chờ xử lý',
                value: overview.bookings.pending.toString(),
                change: '',
                trend: 'up',
                icon: Clock,
                color: 'from-yellow-500 to-amber-600',
            },
            {
                label: 'Hoàn thành',
                value: overview.bookings.completed.toString(),
                change: '',
                trend: 'up',
                icon: CheckCircle,
                color: 'from-emerald-500 to-green-600',
            },
            {
                label: 'Tạm dừng',
                value: overview.services.inactive.toString(),
                change: '',
                trend: 'down',
                icon: AlertCircle,
                color: 'from-red-600 to-rose-700',
            },
        ];
    }, [overview]);

    const barChartData = useMemo(() => {
        return {
            labels:
                revenueData.length > 0
                    ? revenueData.map((d) => `T${d._id.month}`)
                    : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData.length > 0 ? revenueData.map((d) => d.totalRevenue) : [],
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 8,
                },
                {
                    label: 'Số đặt chỗ',
                    data: revenueData.length > 0 ? revenueData.map((d) => d.bookingCount) : [],
                    backgroundColor: 'rgba(249, 115, 22, 0.8)',
                    borderRadius: 8,
                },
            ],
        };
    }, [revenueData]);

    const doughnutChartData = useMemo(() => {
        const labels = bookingsByType.map((b) =>
            b._id === 'transport' ? 'Nhà xe' : b._id === 'accommodation' ? 'Nhà trọ' : 'Quán ăn'
        );
        const data = bookingsByType.map((b) => b.count);

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(168, 85, 247, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                    ],
                    borderWidth: 0,
                },
            ],
        };
    }, [bookingsByType]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-display font-bold text-gray-900">
                        Tổng quan hệ thống
                    </h1>
                    <p className="text-gray-500">
                        Giám sát toàn bộ hoạt động nền tảng StuGo.
                    </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Quản trị viên
                </span>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                            >
                                <stat.icon className="w-5 h-5 text-white" />
                            </div>
                            {!!stat.change && (
                                <span
                                    className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}
                                >
                                    {stat.trend === 'up' ? (
                                        <ArrowUpRight className="w-3 h-3" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3" />
                                    )}
                                    {stat.change}
                                </span>
                            )}
                        </div>
                        <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Doanh thu & đặt chỗ theo tháng
                        </h2>
                        <select
                            className="input py-2 w-32 text-sm"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            <option value={2026}>Năm 2026</option>
                            <option value={2025}>Năm 2025</option>
                            <option value={2024}>Năm 2024</option>
                        </select>
                    </div>
                    <div className="h-80">
                        {revenueData.length > 0 ? (
                            <Bar data={barChartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                Chưa có dữ liệu doanh thu năm {selectedYear}
                            </div>
                        )}
                    </div>
                </div>

                {/* Service Distribution */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Phân bố dịch vụ
                    </h2>
                    <div className="h-64">
                        {bookingsByType.length > 0 ? (
                            <Doughnut data={doughnutChartData} options={chartOptions} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                                Chưa có dữ liệu phân bố dịch vụ
                            </div>
                        )}
                    </div>
                    <div className="mt-4 space-y-2">
                        {bookingsByType.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded ${index === 0
                                                ? 'bg-blue-500'
                                                : index === 1
                                                    ? 'bg-purple-500'
                                                    : 'bg-orange-500'
                                            }`}
                                    ></div>
                                    <span className="text-gray-600">
                                        {item._id === 'transport'
                                            ? 'Nhà xe'
                                            : item._id === 'accommodation'
                                                ? 'Nhà trọ'
                                                : 'Quán ăn'}
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900">{item.count} đặt chỗ</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions — Pending Approvals */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Link
                    to="/admin/services"
                    className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-orange-500"
                >
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Handshake className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Duyệt dịch vụ</p>
                        <p className="text-sm text-gray-500">Xem dịch vụ chờ duyệt</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                    to="/admin/complaints"
                    className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-red-500"
                >
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Khiếu nại</p>
                        <p className="text-sm text-gray-500">Xử lý phản hồi người dùng</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
                <Link
                    to="/admin/partners"
                    className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow border-l-4 border-amber-500"
                >
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Đối tác mới</p>
                        <p className="text-sm text-gray-500">Quản lý đối tác nền tảng</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Đặt chỗ gần đây
                    </h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentBookings.length > 0 ? (
                        recentBookings.map((booking) => (
                            <div
                                key={booking._id}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {booking.serviceName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {booking.userId?.fullName} •{' '}
                                        {new Date(booking.createdAt).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                            maximumFractionDigits: 0,
                                        }).format(booking.totalAmount)}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {booking.status}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">
                            Chưa có đặt chỗ nào
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 text-center">
                    <button className="text-primary-600 text-sm font-medium hover:underline">
                        Xem tất cả hoạt động
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
