import { useEffect, useState, useMemo } from 'react';
import {
    Search,
    Eye,
    CheckCircle,
    XCircle,
    Calendar,
    Bus,
    Building2,
    Utensils,
    ChevronLeft,
    ChevronRight,
    User,
    Phone,
    Mail,
    DollarSign,
} from 'lucide-react';
import { getAdminBookings, confirmBooking, cancelBooking } from '../../services/admin.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type BookingStatus = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type ServiceType = 'all' | 'transport' | 'accommodation' | 'restaurant';

const AdminBookingsPage = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BookingStatus>('all');
    const [typeFilter, setTypeFilter] = useState<ServiceType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params: any = { page: currentPage, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (typeFilter !== 'all') params.serviceType = typeFilter;

            const result = await getAdminBookings(params);
            setBookings(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Không thể tải danh sách đặt chỗ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [statusFilter, typeFilter, currentPage]);

    const filteredBookings = useMemo(() => {
        if (!searchQuery) return bookings;
        const query = searchQuery.toLowerCase();
        return bookings.filter(
            (b) =>
                b.serviceName?.toLowerCase().includes(query) ||
                b.userName?.toLowerCase().includes(query) ||
                b.id?.toLowerCase().includes(query)
        );
    }, [bookings, searchQuery]);

    const handleConfirm = async (id: string) => {
        try {
            await confirmBooking(id);
            toast.success('Đã xác nhận đặt chỗ');
            fetchBookings();
        } catch (error) {
            toast.error('Không thể xác nhận đặt chỗ');
        }
    };

    const handleCancel = async (id: string) => {
        if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
        try {
            await cancelBooking(id);
            toast.success('Đã hủy đặt chỗ');
            fetchBookings();
        } catch (error) {
            toast.error('Không thể hủy đặt chỗ');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const getServiceIcon = (type: string) => {
        switch (type) {
            case 'transport':
                return <Bus className="w-4 h-4" />;
            case 'accommodation':
                return <Building2 className="w-4 h-4" />;
            case 'restaurant':
                return <Utensils className="w-4 h-4" />;
            default:
                return <Calendar className="w-4 h-4" />;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(price || 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                    Quản lý đặt chỗ
                </h1>
                <p className="text-gray-500">
                    Xem và quản lý tất cả đơn đặt chỗ trên hệ thống
                </p>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, dịch vụ..."
                            className="input pl-10 w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        className="input w-40"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as BookingStatus)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>

                    {/* Type Filter */}
                    <select
                        className="input w-36"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as ServiceType)}
                    >
                        <option value="all">Tất cả loại</option>
                        <option value="transport">Nhà xe</option>
                        <option value="accommodation">Nhà trọ</option>
                        <option value="restaurant">Quán ăn</option>
                    </select>
                </div>
            </div>

            {/* Table */}
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
                                        Mã đơn
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
                                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBookings.length > 0 ? (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                #{booking.id.slice(-8)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {booking.userName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {booking.userEmail}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                                                        {getServiceIcon(booking.serviceType)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {booking.serviceName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 capitalize">
                                                            {booking.serviceType === 'transport'
                                                                ? 'Nhà xe'
                                                                : booking.serviceType === 'accommodation'
                                                                    ? 'Nhà trọ'
                                                                    : 'Quán ăn'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(booking.date).toLocaleDateString('vi-VN')}
                                                {booking.timeSlot && (
                                                    <span className="block text-xs text-gray-400">
                                                        {booking.timeSlot}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatPrice(booking.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleConfirm(booking.id)}
                                                                className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                                                                title="Xác nhận"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancel(booking.id)}
                                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Hủy"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            Không có đơn đặt chỗ nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Hiển thị {filteredBookings.length} / {pagination.total} đơn đặt chỗ
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                            Trang {currentPage} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col text-left">
                        {/* Header - Fixed */}
                        <div className="p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Chi tiết đặt chỗ (Admin)
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Mã: #{selectedBooking.id?.slice(-8).toUpperCase()}
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
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 font-semibold text-center flex flex-col items-center">
                                    <p className="text-xs text-green-600 font-medium mb-1 w-full text-left">Trạng thái thanh toán</p>
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
                                            #{selectedBooking.id?.slice(-8).toUpperCase()}
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
                                    {selectedBooking.route && (
                                        <div className="bg-white p-3 rounded-lg col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Tuyến đường</p>
                                            <p className="font-medium text-gray-950 font-semibold">{selectedBooking.route}</p>
                                        </div>
                                    )}
                                    {selectedBooking.seats && selectedBooking.seats.length > 0 && (
                                        <div className="bg-white p-3 rounded-lg col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Ghế đã đặt</p>
                                            <p className="font-medium text-primary-600 font-semibold">{selectedBooking.seats.join(', ')}</p>
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
                                                {selectedBooking.customerInfo?.name || selectedBooking.userName || 'N/A'}
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
                                                {selectedBooking.customerInfo?.email || selectedBooking.userEmail || 'N/A'}
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
                                            <span className="text-lg font-bold text-orange-650">
                                                {formatPrice(selectedBooking.remainingAmount !== undefined ? selectedBooking.remainingAmount : selectedBooking.totalAmount)}
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
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-55 transition-colors font-medium text-sm flex-1 text-center bg-gray-50"
                                >
                                    Đóng
                                </button>
                                {selectedBooking.status === 'pending' && (
                                    <button
                                        onClick={() => {
                                            handleConfirm(selectedBooking.id);
                                            setShowDetailModal(false);
                                        }}
                                        className="px-5 py-2.5 rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors font-semibold text-sm flex-1 text-center flex items-center justify-center gap-2"
                                    >
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

const getPaymentStatusBadge = (status: string) => {
    const badges: { [key: string]: { label: string; className: string } } = {
        pending: {
            label: 'Chưa thanh toán',
            className: 'bg-gray-150 text-gray-750 border border-gray-200',
        },
        deposit_paid: {
            label: 'Đã đặt cọc',
            className: 'bg-orange-100 text-orange-750 border border-orange-200',
        },
        fully_paid: {
            label: 'Đã thanh toán',
            className: 'bg-green-100 text-green-750 border border-green-200',
        },
        refunded: {
            label: 'Đã hoàn tiền',
            className: 'bg-blue-100 text-blue-750 border border-blue-200',
        },
    };

    const badge = badges[status] || badges.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
            {badge.label}
        </span>
    );
};

export default AdminBookingsPage;
