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
        </div>
    );
};

export default AdminBookingsPage;
