import { useEffect, useState, useMemo } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    DollarSign,
} from 'lucide-react';
import { getRevenueStats, type RevenueData } from '../../services/dashboard.service';
import { getPaymentStats } from '../../services/admin.service';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const RevenueDetailsSection = () => {
    const { user } = useAuthStore();
    const [adminStats, setAdminStats] = useState<any>(null);
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('year');
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
    const itemsPerPage = 12;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price || 0);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            if (user?.role === 'admin') {
                const now = new Date();
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);

                const [data, stats] = await Promise.all([
                    getRevenueStats(),
                    getPaymentStats(oneYearAgo.toISOString(), now.toISOString())
                ]);
                setRevenueData(data);
                setAdminStats(stats);
            } else {
                const data = await getRevenueStats();
                setRevenueData(data);
            }
        } catch (error) {
            console.error('Error fetching revenue details:', error);
            toast.error('Không thể tải dữ liệu doanh thu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter data based on date range
    const filteredData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        return revenueData.filter(item => {
            if (dateRange === 'week') {
                // Last 7 days - show current month only
                return item._id.year === currentYear && item._id.month === currentMonth;
            } else if (dateRange === 'month') {
                // Last 30 days - show last 3 months
                const itemDate = new Date(item._id.year, item._id.month - 1);
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                return itemDate >= threeMonthsAgo;
            }
            // Year - show all 12 months
            return true;
        });
    }, [revenueData, dateRange]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage]);

    const totalDeposits = useMemo(
        () => filteredData.reduce((acc, item) => acc + (item.totalRevenue || 0), 0),
        [filteredData]
    );

    const totalOrders = useMemo(
        () => filteredData.reduce((acc, item) => acc + (item.bookingCount || 0), 0),
        [filteredData]
    );

    const rangeLabel = useMemo(() => {
        const now = new Date();
        const targetDate = new Date(now.getFullYear(), now.getMonth() + currentMonthOffset, 1);

        if (dateRange === 'week') {
            return `Tháng ${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`;
        }
        if (dateRange === 'month') {
            return `3 tháng gần đây`;
        }
        return `Năm ${targetDate.getFullYear()}`;
    }, [dateRange, currentMonthOffset]);

    const handlePrevPeriod = () => {
        setCurrentMonthOffset(prev => prev - 1);
    };

    const handleNextPeriod = () => {
        if (currentMonthOffset < 0) {
            setCurrentMonthOffset(prev => prev + 1);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const chartData = useMemo(() => {
        if (!adminStats?.dailyStats) return null;

        const now = new Date();
        let days = 30;
        let titleRange = '30 ngày';
        if (dateRange === 'week') { days = 7; titleRange = '7 ngày'; }
        else if (dateRange === 'year') { days = 365; titleRange = 'Năm nay'; }

        const labels: string[] = [];
        const data: number[] = [];
        const dataMap = new Map();

        adminStats.dailyStats.forEach((d: any) => {
            dataMap.set(d._id.date, d.totalAmount);
        });

        const start = new Date(now);
        start.setDate(now.getDate() - days + 1);

        for (let i = 0; i < days; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);

            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            labels.push(`${day}/${month}`);
            data.push(dataMap.get(dateStr) || 0);
        }

        return {
            titleRange,
            data: {
                labels,
                datasets: [
                    {
                        fill: true,
                        label: 'Doanh thu',
                        data,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                    }
                ]
            }
        };
    }, [adminStats, dateRange]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value: any) {
                        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: 'compact' }).format(value);
                    }
                }
            }
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [dateRange]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">Thống kê chi tiết</h2>

            </div>

            {/* Summary Cards */}
            <div className={`grid gap-6 ${user?.role === 'admin' ? 'sm:grid-cols-3 lg:grid-cols-6' : 'sm:grid-cols-3'}`}>
                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(totalDeposits)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Kỳ thống kê</p>
                            <p className="text-base font-semibold text-gray-900">
                                {rangeLabel}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Tổng đặt chỗ</p>
                            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                        </div>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <>
                        <div className="card p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Từ Đặt chỗ</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPrice(adminStats?.bookingRevenue || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Từ Premium</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPrice(adminStats?.subscriptionRevenue || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Hoa hồng (5%)</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatPrice((adminStats?.bookingRevenue || 0) * 0.05)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Admin Line Chart */}
            {user?.role === 'admin' && chartData && (
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Biểu đồ doanh thu ({chartData.titleRange} gần nhất)</h3>
                    <div className="h-72 w-full">
                        <Line data={chartData.data} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDateRange('week')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'week'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            7 ngày
                        </button>
                        <button
                            onClick={() => setDateRange('month')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'month'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            30 ngày
                        </button>
                        <button
                            onClick={() => setDateRange('year')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === 'year'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Năm nay
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPeriod}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                            {rangeLabel}
                        </span>
                        <button
                            onClick={handleNextPeriod}
                            disabled={currentMonthOffset >= 0}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Kỳ
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Doanh thu
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                        Số đơn hàng
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {revenueData.map((item, index) => (
                                    <tr key={`${item._id.year}-${item._id.month}-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            Tháng {item._id.month}/{item._id.year}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-green-600 font-medium">
                                            +{formatPrice(item.totalRevenue)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 text-primary-600 font-medium text-sm">
                                                {item.bookingCount}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-medium">
                                <tr>
                                    <td className="px-6 py-4 text-sm text-gray-900">Tổng cộng</td>
                                    <td className="px-6 py-4 text-sm text-green-600">
                                        +{formatPrice(totalDeposits)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-primary-500 text-white text-sm">
                                            {totalOrders}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Hiển thị {paginatedData.length} / {filteredData.length} kỳ thống kê
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Trước
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueDetailsSection;
