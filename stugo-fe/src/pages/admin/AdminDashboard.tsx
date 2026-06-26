import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Handshake,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import {
    getDashboardOverview,
    getBookingsByType,
    getRecentBookings,
    type DashboardOverview,
    type BookingByType,
    type RecentBooking,
} from '../../services/dashboard.service';
import RevenueDetailsSection from '../../components/dashboard/RevenueDetailsSection';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AdminDashboard = () => {
    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [bookingsByType, setBookingsByType] = useState<BookingByType[]>([]);
    const [recentBookings, setRecentBookingsState] = useState<RecentBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const [overviewRes, byTypeRes, recentRes] = await Promise.all([
                    getDashboardOverview(),
                    getBookingsByType(),
                    getRecentBookings(10),
                ]);

                setOverview(overviewRes);
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
    }, []);

    const stats = useMemo(() => {
        if (!overview) return [];

        return [
            {
                label: 'Tổng dịch vụ',
                value: overview.services.total.toString(),
                change: `${overview.services.active} hoạt động`,
                trend: 'up' as 'up' | 'down',
                icon: Handshake,
                color: 'from-amber-500 to-orange-600',
            },
            {
                label: 'Dịch vụ chờ duyệt',
                value: overview.services.pending.toString(),
                change: '',
                trend: 'up' as 'up' | 'down',
                icon: Clock,
                color: 'from-yellow-500 to-amber-600',
            },
            {
                label: 'Dịch vụ hoạt động',
                value: overview.services.active.toString(),
                change: '',
                trend: 'up' as 'up' | 'down',
                icon: CheckCircle,
                color: 'from-emerald-500 to-green-600',
            },
        ];
    }, [overview]);

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

            {/* Chi tiết doanh thu */}
            <div className="pt-4">
                <RevenueDetailsSection topCards={stats} />
            </div>

            {/* Charts and Lists */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Service Distribution */}
                <div className="card p-6 h-full">
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
                        {bookingsByType.map((b) => (
                            <div key={b._id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {b._id === 'transport'
                                        ? 'Nhà xe'
                                        : b._id === 'accommodation'
                                            ? 'Nhà trọ'
                                            : 'Quán ăn'}
                                </span>
                                <span className="font-medium text-gray-900">{b.count} đơn</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Bookings */}
                <div className="lg:col-span-2 card overflow-hidden h-full">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Đặt chỗ gần đây
                            </h2>
                            <Link to="/admin/bookings" className="text-primary-600 text-sm font-medium hover:underline">
                                Xem tất cả
                            </Link>
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
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Số tiền
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentBookings.length > 0 ? (
                                    recentBookings.map((booking) => (
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
                                            <td className="px-6 py-4">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {new Intl.NumberFormat('vi-VN', {
                                                    style: 'currency',
                                                    currency: 'VND',
                                                }).format(booking.totalAmount)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Chưa có đặt chỗ nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
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

        </div>
    );
};

export default AdminDashboard;
