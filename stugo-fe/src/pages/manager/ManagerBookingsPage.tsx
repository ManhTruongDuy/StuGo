import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    User,
    Phone,
    Mail,
    DollarSign,
} from 'lucide-react';
import { getBookings } from '../../services/booking.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Helper function
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price);
};

const ManagerBookingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<any[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchTerm, statusFilter, bookings]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await getBookings();
            setBookings(response.data || []);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            toast.error('Không thể tải danh sách đặt chỗ');
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.serviceName?.toLowerCase().includes(term) ||
                b.customerInfo?.name?.toLowerCase().includes(term) ||
                b.customerInfo?.phone?.includes(term) ||
                b._id?.toLowerCase().includes(term) ||
                b.id?.toLowerCase().includes(term)
            );
        }

        setFilteredBookings(filtered);
    };

    const handleExportExcel = () => {
        try {
            if (filteredBookings.length === 0) {
                toast.error('Không có dữ liệu để xuất');
                return;
            }

            // Create CSV content with semicolon separator for Vietnamese Excel
            const headers = [
                'Mã đặt chỗ',
                'Khách hàng',
                'Số điện thoại',
                'Email',
                'Dịch vụ',
                'Loại dịch vụ',
                'Ngày sử dụng',
                'Giờ',
                'Số lượng',
                'Tổng tiền (VND)',
                'Đã thanh toán (VND)',
                'Còn lại (VND)',
                'Trạng thái đặt chỗ',
                'Trạng thái thanh toán'
            ];
            let csv = headers.join(';') + '\n';

            filteredBookings.forEach(booking => {
                const statusMap: Record<string, string> = {
                    'pending': 'Chờ xác nhận',
                    'confirmed': 'Đã xác nhận',
                    'completed': 'Hoàn thành',
                    'cancelled': 'Đã hủy'
                };

                const paymentStatusMap: Record<string, string> = {
                    'pending': 'Chưa thanh toán',
                    'deposit_paid': 'Đã đặt cọc',
                    'fully_paid': 'Đã thanh toán'
                };

                const row = [
                    `"'${(booking._id || booking.id)?.slice(-8).toUpperCase() || 'N/A'}"`,
                    `"${booking.customerInfo?.name || booking.userId?.fullName || 'N/A'}"`,
                    `"'${booking.customerInfo?.phone || booking.userId?.phone || 'N/A'}"`,
                    `"${booking.customerInfo?.email || 'N/A'}"`,
                    `"${booking.serviceName || 'N/A'}"`,
                    `"${booking.serviceType || 'N/A'}"`,
                    `"'${new Date(booking.date).toLocaleDateString('vi-VN')}"`,
                    `"${booking.timeSlot || 'N/A'}"`,
                    `"${booking.quantity || 0}"`,
                    `"${booking.totalAmount || 0}"`,
                    `"${(booking.totalAmount || 0) - (booking.remainingAmount || 0)}"`,
                    `"${booking.remainingAmount || 0}"`,
                    `"${statusMap[booking.status] || booking.status}"`,
                    `"${paymentStatusMap[booking.paymentStatus] || booking.paymentStatus}"`
                ];
                csv += row.join(';') + '\n';
            });

            // Add summary row
            const totalAmount = filteredBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const totalPaid = filteredBookings.reduce((sum, b) => sum + ((b.totalAmount || 0) - (b.remainingAmount || 0)), 0);
            const totalRemaining = filteredBookings.reduce((sum, b) => sum + (b.remainingAmount || 0), 0);

            csv += '\n';
            csv += [
                '"Tổng cộng"',
                `"${filteredBookings.length} đặt chỗ"`,
                '""', '""', '""', '""', '""', '""', '""',
                `"${totalAmount}"`,
                `"${totalPaid}"`,
                `"${totalRemaining}"`,
                '""', '""'
            ].join(';') + '\n';

            // Create blob with UTF-8 BOM for Excel compatibility
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `danh-sach-dat-cho-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Xuất báo cáo thành công!');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Không thể xuất báo cáo');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <CheckCircle className="w-3 h-3" />
                        Đã xác nhận
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3" />
                        Chờ xác nhận
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        Hoàn thành
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3" />
                        Đã hủy
                    </span>
                );
            default:
                return <span className="badge">{status}</span>;
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'fully_paid':
                return <span className="text-xs text-green-600 font-medium">Đã thanh toán</span>;
            case 'deposit_paid':
                return <span className="text-xs text-blue-600 font-medium">Đã đặt cọc</span>;
            case 'pending':
                return <span className="text-xs text-gray-500 font-medium">Chưa thanh toán</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    const stats = [
        {
            label: 'Tổng đặt chỗ',
            value: bookings.length,
            color: 'from-blue-500 to-blue-600',
        },
        {
            label: 'Chờ xác nhận',
            value: bookings.filter(b => b.status === 'pending').length,
            color: 'from-yellow-500 to-yellow-600',
        },
        {
            label: 'Đã xác nhận',
            value: bookings.filter(b => b.status === 'confirmed').length,
            color: 'from-green-500 to-green-600',
        },
        {
            label: 'Hoàn thành',
            value: bookings.filter(b => b.status === 'completed').length,
            color: 'from-blue-500 to-blue-600',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Quản lý đặt chỗ
                </h1>
                <p className="text-gray-500">
                    Theo dõi và quản lý tất cả đặt chỗ của dịch vụ
                </p>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="card p-4">
                        <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, SĐT, mã đặt chỗ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="input w-full sm:w-48"
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                        </select>
                    </div>

                    {/* Export */}
                    <button
                        onClick={handleExportExcel}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </button>

                </div>
            </div>

            {/* Bookings Table */}
            <div className="card overflow-hidden">
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
                                    Ngày sử dụng
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Số tiền
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Thanh toán
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-primary-600">
                                            #{booking._id?.slice(-8).toUpperCase() || booking.id?.slice(-8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="font-medium text-gray-900">
                                                    {booking.customerInfo?.name || booking.userId?.fullName || 'N/A'}
                                                </p>
                                                <p className="text-gray-500">
                                                    {booking.customerInfo?.phone || booking.userId?.phone || 'N/A'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {booking.serviceName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(booking.date).toLocaleDateString('vi-VN')}
                                            {booking.timeSlot && (
                                                <span className="block text-xs text-gray-500">
                                                    {booking.timeSlot}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatPrice(booking.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPaymentStatusBadge(booking.paymentStatus)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setShowDetailModal(true);
                                                }}
                                                className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || statusFilter !== 'all'
                                            ? 'Không tìm thấy đặt chỗ nào'
                                            : 'Chưa có đặt chỗ nào'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
                        {/* Header - Fixed */}
                        <div className="p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Chi tiết đặt chỗ
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Mã: #{(selectedBooking._id || selectedBooking.id)?.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Status Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Trạng thái đặt chỗ</p>
                                    <div className="flex items-center justify-center">
                                        {getStatusBadge(selectedBooking.status)}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                    <p className="text-xs text-green-600 font-medium mb-1">Trạng thái thanh toán</p>
                                    <div className="flex items-center justify-center">
                                        {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                    </div>
                                </div>
                            </div>

                            {/* Booking Info Card */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Thông tin đặt chỗ</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Mã đặt chỗ</p>
                                        <p className="font-medium text-primary-600">
                                            #{(selectedBooking._id || selectedBooking.id)?.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Loại dịch vụ</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedBooking.serviceType}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Dịch vụ</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.serviceName}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Ngày sử dụng</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(selectedBooking.date).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    {selectedBooking.timeSlot && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Giờ</p>
                                            <p className="font-medium text-gray-900">{selectedBooking.timeSlot}</p>
                                        </div>
                                    )}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Số lượng</p>
                                        <p className="font-medium text-gray-900">{selectedBooking.quantity}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info Card */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Thông tin khách hàng</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500">Họ tên</p>
                                            <p className="font-medium text-gray-900 truncate">
                                                {selectedBooking.customerInfo?.name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500">Số điện thoại</p>
                                            <p className="font-medium text-gray-900">
                                                {selectedBooking.customerInfo?.phone || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium text-gray-900 truncate">
                                                {selectedBooking.customerInfo?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Info Card */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Thông tin thanh toán</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tổng tiền</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {formatPrice(selectedBooking.totalAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Đã thanh toán</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatPrice((selectedBooking.totalAmount || 0) - (selectedBooking.remainingAmount || 0))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Còn lại</span>
                                            <span className="text-lg font-bold text-orange-600">
                                                {formatPrice(selectedBooking.remainingAmount || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer - Fixed */}
                        <div className="p-6 border-t border-gray-200 flex-shrink-0">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="btn btn-primary flex-1"
                                >
                                    Đóng
                                </button>
                                {selectedBooking.status === 'pending' && (
                                    <button className="btn btn-primary flex-1">
                                        <CheckCircle className="w-5 h-5" />
                                        Xác nhận đặt chỗ
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerBookingsPage;
