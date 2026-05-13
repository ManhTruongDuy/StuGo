import { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    PlusCircle,
    Zap,
    Map,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
    getDashboardOverview,
    getRevenueStats,
    getTopServices,
    getRecentBookings
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
    PointElement,
    LineElement
);

// Helper function
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const ManagerDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [topServices, setTopServices] = useState<any[]>([]);
    const [recentBookingsList, setRecentBookingsList] = useState<any[]>([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { user } = useAuthStore();

    useEffect(() => {
        fetchDashboardData();
    }, [selectedYear]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Calculate date range for selected year
            const startDate = new Date(selectedYear, 0, 1).toISOString();
            const endDate = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();

            const [overviewData, revenue, services, bookings] = await Promise.all([
                getDashboardOverview(),
                getRevenueStats(startDate, endDate),
                getTopServices(5),
                getRecentBookings(10)
            ]);

            setOverview(overviewData);
            setRevenueData(revenue);
            setTopServices(services);
            setRecentBookingsList(bookings);
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    const stats = overview ? [
        {
            label: 'Tổng doanh thu',
            value: formatPrice(overview.revenue.total),
            change: '+12.5%',
            trend: 'up',
            icon: DollarSign,
            color: 'from-teal-500 to-emerald-600',
        },
        {
            label: 'Doanh thu tháng này',
            value: formatPrice(overview.revenue.thisMonth),
            change: '+8.2%',
            trend: 'up',
            icon: TrendingUp,
            color: 'from-green-500 to-teal-600',
        },
        {
            label: 'Đặt chỗ hôm nay',
            value: overview.bookings.today.toString(),
            change: `${overview.bookings.pending} chờ`,
            trend: 'up',
            icon: CalendarDays,
            color: 'from-cyan-500 to-teal-600',
        },
        {
            label: 'Tổng dịch vụ',
            value: overview.services.total.toString(),
            change: `${overview.services.active} hoạt động`,
            trend: 'up',
            icon: Package,
            color: 'from-emerald-500 to-green-600',
        },
    ] : [];

    const chartData = {
        labels: revenueData.length > 0 ? revenueData.map(d => `T${d._id.month}`) : ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
        datasets: [
            {
                label: 'Doanh thu (VNĐ)',
                data: revenueData.length > 0 ? revenueData.map(d => d.totalRevenue) : [],
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderRadius: 8,
            },
            {
                label: 'Số đặt chỗ',
                data: revenueData.length > 0 ? revenueData.map(d => d.bookingCount) : [],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            if (context.datasetIndex === 0) {
                                // Revenue - format as currency
                                label += formatPrice(context.parsed.y);
                            } else {
                                // Booking count - just number
                                label += context.parsed.y;
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    callback: function (value: any) {
                        // Format large numbers
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'K';
                        }
                        return value;
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <span className="badge badge-info">Đã xác nhận</span>;
            case 'pending':
                return <span className="badge badge-warning">Chờ xác nhận</span>;
            case 'completed':
                return <span className="badge badge-success">Hoàn thành</span>;
            case 'cancelled':
                return <span className="badge badge-error">Đã hủy</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!overview) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Không thể tải dữ liệu dashboard</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Tổng quan
                </h1>
                <p className="text-gray-500">
                    Chào mừng trở lại! Đây là tình hình kinh doanh của bạn.
                </p>
            </div>

            {/* Subscription Banner */}
            {(!user?.plan || user.plan === 'free') ? (
                <div className="card p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-teal-900">Bạn đang dùng gói miễn phí</p>
                            <p className="text-sm text-teal-700">Nâng cấp để mở khóa đầy đủ tính năng quản lý</p>
                        </div>
                    </div>
                    <Link to="/subscription" className="btn-primary flex-shrink-0 text-sm py-2">
                        Nâng cấp ngay
                    </Link>
                </div>
            ) : (
                <div className="card p-4 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-teal-900">Gói <span className="uppercase">{user.plan}</span> đang hoạt động</p>
                        <p className="text-sm text-teal-700">Bạn đang sử dụng đầy đủ tính năng đối tác</p>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/manager/create" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <PlusCircle className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Tạo dịch vụ</span>
                </Link>
                <Link to="/manager/bookings" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Đặt chỗ</span>
                </Link>
                <Link to="/manager/services" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                        <Package className="w-5 h-5 text-cyan-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Dịch vụ của tôi</span>
                </Link>
                <Link to="/snap-map" className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Map className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Snap Map</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <span
                                className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {stat.trend === 'up' ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Thống kê doanh thu & đặt chỗ
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
                    {revenueData.length > 0 ? (
                        <div className="h-80">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-gray-500 mb-2">Chưa có dữ liệu doanh thu năm {selectedYear}</p>
                                <p className="text-sm text-gray-400">Hãy tạo booking đầu tiên để xem thống kê</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Popular Services */}
                <div className="card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        Dịch vụ phổ biến
                    </h2>
                    <div className="space-y-4">
                        {topServices.length > 0 ? (
                            topServices.map((service, index) => (
                                <div
                                    key={service._id}
                                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {service.serviceName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {service.bookingCount} đặt chỗ
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium text-green-600">
                                        {formatPrice(service.totalRevenue)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-8">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Bookings */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Đặt chỗ gần đây
                        </h2>
                        <button className="text-primary-600 text-sm font-medium hover:underline">
                            Xem tất cả
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Mã đặt
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Khách hàng
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Dịch vụ
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Ngày
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Số tiền
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {recentBookingsList.length > 0 ? (
                                recentBookingsList.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-primary-600">
                                            #{booking._id.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {booking.userId?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {booking.serviceName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(booking.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatPrice(booking.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Chưa có đặt chỗ nào
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
