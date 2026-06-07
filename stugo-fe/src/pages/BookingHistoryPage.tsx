import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    MapPin,
    Package,
    Users,
    CreditCard,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    X,
    Bus,
    Home,
    UtensilsCrossed,
    ChevronLeft,
    ChevronRight,
    Filter,
    Info,
    User,
} from 'lucide-react';
import { getBookings, cancelBooking } from '../services/booking.service';
import { createRemainingPayment } from '../services/payment.service';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Booking, ServiceType } from '../types';

type TabType = 'all' | 'transport' | 'accommodation' | 'restaurant';

const BookingHistoryPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Date filter state
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month' | 'year' | 'custom'>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showDateFilter, setShowDateFilter] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setCurrentPage(1); // Reset to first page when filters change
    }, [activeTab, dateFilter, startDate, endDate, isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchBookings();
        }
    }, [currentPage, activeTab, dateFilter, startDate, endDate]);


    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
            case 'today':
                return {
                    startDate: today.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                };
            case 'month':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    startDate: monthStart.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                };
            case 'year':
                const yearStart = new Date(today.getFullYear(), 0, 1);
                return {
                    startDate: yearStart.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0],
                };
            case 'custom':
                return {
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                };
            default:
                return {
                    startDate: undefined,
                    endDate: undefined,
                };
        }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const filters: any = {
                page: currentPage,
                limit: limit,
            };

            if (activeTab !== 'all') {
                filters.serviceType = activeTab;
            }

            // Add date filters
            const dateRange = getDateRange();
            if (dateRange.startDate) {
                filters.startDate = dateRange.startDate;
            }
            if (dateRange.endDate) {
                filters.endDate = dateRange.endDate;
            }

            const result = await getBookings(filters);
            const filteredBookings = result.data || [];
            setBookings(filteredBookings);

            // Update pagination
            if (result.pagination) {
                setTotalPages(result.pagination.totalPages || 1);
                setTotal(result.pagination.total || 0);
            }

            // Fetch all bookings for tab counts (without pagination)
            const countFilters: any = {};
            if (activeTab !== 'all') {
                countFilters.serviceType = activeTab;
            }
            const countDateRange = getDateRange();
            if (countDateRange.startDate) {
                countFilters.startDate = countDateRange.startDate;
            }
            if (countDateRange.endDate) {
                countFilters.endDate = countDateRange.endDate;
            }

            const allResult = await getBookings({ ...countFilters, limit: 1000 });
            setAllBookings(allResult.data || []);
        } catch (error: any) {
            console.error('Error fetching bookings:', error);
            toast.error('Không thể tải danh sách đặt chỗ');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        if (!selectedBooking) return;

        try {
            setCancelling(true);
            const success = await cancelBooking(selectedBooking.id);
            if (success) {
                toast.success('Đã hủy đặt chỗ thành công');
                setShowCancelModal(false);
                setSelectedBooking(null);
                fetchBookings();
            } else {
                toast.error('Không thể hủy đặt chỗ');
            }
        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            toast.error(error.message || 'Không thể hủy đặt chỗ');
        } finally {
            setCancelling(false);
        }
    };

    const handlePayRemaining = async (bookingId: string) => {
        try {
            setProcessingPayment(true);
            toast.loading('Đang tạo link thanh toán...', { id: 'payment-loading' });

            const result = await createRemainingPayment(bookingId);

            if (result && result.checkoutUrl) {
                toast.success('Đã tạo link thanh toán!', { id: 'payment-loading' });

                // Save token to sessionStorage before redirect
                const token = localStorage.getItem('token');
                const user = localStorage.getItem('user');
                if (token) sessionStorage.setItem('token', token);
                if (user) sessionStorage.setItem('user', user);

                // Store orderCode for later verification
                localStorage.setItem('pendingOrderCode', result.orderCode.toString());

                // Redirect to PayOS
                window.location.href = result.checkoutUrl;
            } else {
                toast.error('Không thể tạo link thanh toán', { id: 'payment-loading' });
            }
        } catch (error: any) {
            console.error('Error creating remaining payment:', error);
            toast.error(error.response?.data?.message || 'Không thể tạo link thanh toán', { id: 'payment-loading' });
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // const formatDate = (dateString: string) => {
    //     const date = new Date(dateString);
    //     return date.toLocaleDateString('vi-VN', {
    //         day: '2-digit',
    //         month: '2-digit',
    //         year: 'numeric',
    //     });
    // };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTimeWithTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: { label: string; className: string; icon: any } } = {
            pending: {
                label: 'Chờ xác nhận',
                className: 'bg-yellow-100 text-yellow-700',
                icon: AlertCircle,
            },
            confirmed: {
                label: 'Đã xác nhận',
                className: 'bg-blue-100 text-blue-700',
                icon: CheckCircle,
            },
            completed: {
                label: 'Hoàn thành',
                className: 'bg-green-100 text-green-700',
                icon: CheckCircle,
            },
            cancelled: {
                label: 'Đã hủy',
                className: 'bg-red-100 text-red-700',
                icon: XCircle,
            },
            no_show: {
                label: 'Không đến',
                className: 'bg-gray-100 text-gray-700',
                icon: XCircle,
            },
        };

        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (status: string) => {
        const badges: { [key: string]: { label: string; className: string } } = {
            pending: {
                label: 'Chưa thanh toán',
                className: 'bg-gray-100 text-gray-700',
            },
            deposit_paid: {
                label: 'Đã đặt cọc',
                className: 'bg-orange-100 text-orange-700',
            },
            fully_paid: {
                label: 'Đã thanh toán',
                className: 'bg-green-100 text-green-700',
            },
            refunded: {
                label: 'Đã hoàn tiền',
                className: 'bg-blue-100 text-blue-700',
            },
        };

        const badge = badges[status] || badges.pending;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                {badge.label}
            </span>
        );
    };

    const getServiceIcon = (type: ServiceType) => {
        const icons = {
            transport: Bus,
            accommodation: Home,
            restaurant: UtensilsCrossed,
        };
        return icons[type] || Package;
    };

    const tabs = [
        { id: 'all' as TabType, label: 'Tất cả', count: allBookings.length },
        { id: 'transport' as TabType, label: 'Nhà xe', count: allBookings.filter(b => b.serviceType === 'transport').length },
        { id: 'accommodation' as TabType, label: 'Nhà trọ', count: allBookings.filter(b => b.serviceType === 'accommodation').length },
        { id: 'restaurant' as TabType, label: 'Quán ăn', count: allBookings.filter(b => b.serviceType === 'restaurant').length },
    ];

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                                Lịch sử đặt chỗ
                            </h1>
                            <p className="text-gray-600">
                                Quản lý và theo dõi tất cả các đặt chỗ của bạn
                            </p>
                        </div>

                        {/* Date Filter */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDateFilter(!showDateFilter)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    {dateFilter === 'all' ? 'Tất cả thời gian' :
                                        dateFilter === 'today' ? 'Hôm nay' :
                                            dateFilter === 'month' ? 'Tháng này' :
                                                dateFilter === 'year' ? 'Năm này' :
                                                    'Tùy chọn'}
                                </span>
                            </button>

                            {showDateFilter && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-10 animate-slide-down">
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => {
                                                    setDateFilter('all');
                                                    setShowDateFilter(false);
                                                }}
                                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateFilter === 'all' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                Tất cả thời gian
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDateFilter('today');
                                                    setShowDateFilter(false);
                                                }}
                                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateFilter === 'today' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                Hôm nay
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDateFilter('month');
                                                    setShowDateFilter(false);
                                                }}
                                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateFilter === 'month' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                Tháng này
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDateFilter('year');
                                                    setShowDateFilter(false);
                                                }}
                                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateFilter === 'year' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                Năm này
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDateFilter('custom');
                                                }}
                                                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${dateFilter === 'custom' ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-50'
                                                    }`}
                                            >
                                                Tùy chọn
                                            </button>
                                        </div>

                                        {dateFilter === 'custom' && (
                                            <div className="pt-3 border-t border-gray-200 space-y-2">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Từ ngày
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Đến ngày
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setShowDateFilter(false)}
                                                    className="w-full px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = getServiceIcon(tab.id === 'all' ? 'transport' : tab.id);
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-primary-500 text-white shadow-md'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    {tab.id !== 'all' && <Icon className="w-4 h-4" />}
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bookings List */}
                {bookings.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Chưa có đặt chỗ nào
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {activeTab === 'all'
                                ? 'Bạn chưa có đặt chỗ nào. Hãy khám phá các dịch vụ của chúng tôi!'
                                : `Bạn chưa có đặt chỗ nào cho dịch vụ ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}.`}
                        </p>
                        <button
                            onClick={() => navigate('/services')}
                            className="btn-primary"
                        >
                            Khám phá dịch vụ
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookings.map((booking) => {
                            const ServiceIcon = getServiceIcon(booking.serviceType);
                            return (
                                <div
                                    key={booking.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                        {/* Left: Service Info */}
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <ServiceIcon className="w-6 h-6 text-primary-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                        {booking.serviceName}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formatDateTime(booking.date)}</span>
                                                        </div>
                                                        {booking.timeSlot && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                <span>{booking.timeSlot}</span>
                                                            </div>
                                                        )}
                                                        {booking.route && (
                                                            <div className="flex items-center gap-1.5">
                                                                <MapPin className="w-4 h-4" />
                                                                <span>{booking.route}</span>
                                                            </div>
                                                        )}
                                                        {booking.roomTypeName && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Home className="w-4 h-4" />
                                                                <span>{booking.roomTypeName}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="w-4 h-4" />
                                                            <span>Số lượng: {booking.quantity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {getStatusBadge(booking.status)}
                                                        {getPaymentStatusBadge(booking.paymentStatus)}
                                                        {booking.serviceType === 'restaurant' && booking.bookingType === 'order' && booking.orderType && (
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                                booking.orderType === 'delivery'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : booking.orderType === 'pickup'
                                                                    ? 'bg-purple-100 text-purple-700'
                                                                    : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {booking.orderType === 'delivery' ? '🚚 Giao hàng' : booking.orderType === 'pickup' ? '🛍️ Tự lấy' : '🍽️ Tại chỗ'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Price & Actions */}
                                        <div className="flex flex-col items-end gap-4 lg:min-w-[200px]">
                                            <div className="text-right">
                                                {booking.paymentStatus === 'pending' ? (
                                                    <>
                                                        <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                                                        <p className="text-xl font-bold text-gray-900">
                                                            {formatPrice(booking.totalAmount)}
                                                        </p>
                                                        <p className="text-xs text-red-600 mt-1 font-medium">
                                                            Chưa thanh toán
                                                        </p>
                                                    </>
                                                ) : booking.paymentStatus === 'deposit_paid' ? (
                                                    <>
                                                        <p className="text-sm text-gray-500 mb-1">Đã thanh toán</p>
                                                        <p className="text-xl font-bold text-green-600">
                                                            {formatPrice(booking.depositAmount)}
                                                        </p>
                                                        <p className="text-xs text-orange-600 mt-1 font-medium">
                                                            Còn nợ: {formatPrice(booking.totalAmount - booking.depositAmount)}
                                                        </p>
                                                    </>
                                                ) : booking.paymentStatus === 'fully_paid' ? (
                                                    <>
                                                        <p className="text-sm text-gray-500 mb-1">Đã thanh toán</p>
                                                        <p className="text-xl font-bold text-green-600">
                                                            {formatPrice(booking.totalAmount)}
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-1 font-medium">
                                                            ✓ Đã thanh toán đủ
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                                                        <p className="text-xl font-bold text-gray-900">
                                                            {formatPrice(booking.totalAmount)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {/* Pay Remaining Button - Show if deposit paid and not cancelled/completed */}
                                                {booking.paymentStatus === 'deposit_paid' &&
                                                    booking.status !== 'cancelled' &&
                                                    booking.status !== 'completed' && (
                                                        <button
                                                            onClick={() => handlePayRemaining(booking.id)}
                                                            disabled={processingPayment}
                                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <CreditCard className="w-4 h-4" />
                                                            Thanh toán còn lại
                                                        </button>
                                                    )}

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Chi tiết
                                                    </button>
                                                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBooking(booking);
                                                                setShowCancelModal(true);
                                                            }}
                                                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            Hủy
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                        <div className="text-sm text-gray-600">
                            Hiển thị <span className="font-medium text-gray-900">
                                {(currentPage - 1) * limit + 1}
                            </span> - <span className="font-medium text-gray-900">
                                {Math.min(currentPage * limit, total)}
                            </span> trong tổng số <span className="font-medium text-gray-900">{total}</span> đặt chỗ
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-primary-500 text-white'
                                                : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Booking Modal */}
            {showCancelModal && selectedBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Xác nhận hủy đặt chỗ
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Bạn có chắc chắn muốn hủy đặt chỗ này?
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">Dịch vụ</p>
                            <p className="font-medium text-gray-900">{selectedBooking.serviceName}</p>
                            <p className="text-sm text-gray-600 mt-2 mb-1">Ngày</p>
                            <p className="font-medium text-gray-900">{formatDateTime(selectedBooking.date)}</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Lưu ý: Việc hủy đặt chỗ có thể áp dụng chính sách hoàn tiền theo quy định của dịch vụ.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setSelectedBooking(null);
                                }}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                disabled={cancelling}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={cancelling}
                                className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDetailModal(false);
                            setSelectedBooking(null);
                        }
                    }}
                >
                    <div className="card max-w-2xl w-full my-8 animate-scale-in overflow-hidden">
                        {/* Gradient header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        {(() => { const I = getServiceIcon((selectedBooking as any).serviceType); return <I className="w-6 h-6 text-white" />; })()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-primary-100 text-sm mb-0.5">Chi tiết đặt chỗ</p>
                                        <h2 className="text-xl font-bold text-white mb-2">{(selectedBooking as any).serviceName}</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {getStatusBadge((selectedBooking as any).status)}
                                            {getPaymentStatusBadge((selectedBooking as any).paymentStatus)}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setShowDetailModal(false); setSelectedBooking(null); }} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                        {/* Booking Info */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thông tin đặt chỗ</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500">Ngày sử dụng</p>
                                            <p className="text-sm font-semibold text-gray-900">{formatDateTime((selectedBooking as any).date)}</p>
                                        </div>
                                    </div>
                                    {(selectedBooking as any).timeSlot && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">Giờ khởi hành</p>
                                                <p className="text-sm font-semibold text-gray-900">{(selectedBooking as any).timeSlot}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(selectedBooking as any).route && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                                            <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">Tuyến đường</p>
                                                <p className="text-sm font-semibold text-gray-900">{(selectedBooking as any).route}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(selectedBooking as any).seats && (selectedBooking as any).seats.length > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                                            <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">Chỗ ngồi đã đặt</p>
                                                <p className="text-sm font-semibold text-gray-900">{(selectedBooking as any).seats.join(', ')}</p>
                                            </div>
                                        </div>
                                    )}
                                    {(selectedBooking as any).roomTypeName && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Home className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">Loại phòng</p>
                                                <p className="text-sm font-semibold text-gray-900">{(selectedBooking as any).roomTypeName}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-xs text-gray-500">Số lượng</p>
                                            <p className="text-sm font-semibold text-gray-900">{(selectedBooking as any).quantity}</p>
                                        </div>
                                    </div>
                                    {(selectedBooking as any).bookingType && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            <Package className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">Loại đặt</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {(selectedBooking as any).bookingType === 'reservation' ? '🍽️ Đặt bàn' :
                                                     (selectedBooking as any).orderType === 'delivery' ? '🚚 Giao hàng' :
                                                     (selectedBooking as any).orderType === 'pickup' ? '🛍️ Tự lấy' : '🍽️ Tại chỗ'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            {(selectedBooking as any).orderItems?.length > 0 && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Món đã đặt</h4>
                                    <div className="space-y-2">
                                        {(selectedBooking as any).orderItems.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs flex items-center justify-center font-medium">{item.quantity}</span>
                                                    <span className="text-sm text-gray-900">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Payment */}
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5" /> Thanh toán
                                </h4>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tổng đơn hàng</span>
                                        <span className="font-semibold text-gray-900">{formatPrice((selectedBooking as any).totalAmount)}</span>
                                    </div>
                                    {(selectedBooking as any).depositAmount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Đã đặt cọc (30%)</span>
                                            <span className="font-medium text-green-600">{formatPrice((selectedBooking as any).depositAmount)}</span>
                                        </div>
                                    )}
                                    {(selectedBooking as any).paymentStatus === 'deposit_paid' && (
                                        <>
                                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                                <span className="font-medium text-orange-600">Còn phải trả</span>
                                                <span className="font-bold text-orange-600">{formatPrice((selectedBooking as any).totalAmount - (selectedBooking as any).depositAmount)}</span>
                                            </div>
                                            {(selectedBooking as any).status !== 'cancelled' && (selectedBooking as any).status !== 'completed' && (
                                                <button onClick={() => handlePayRemaining((selectedBooking as any).id)} disabled={processingPayment}
                                                    className="w-full mt-2 py-2.5 text-white bg-green-600 rounded-xl hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                                    <CreditCard className="w-4 h-4" />
                                                    {processingPayment ? 'Đang xử lý...' : 'Thanh toán phần còn lại'}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {(selectedBooking as any).paymentStatus === 'fully_paid' && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-sm text-green-600">
                                            <CheckCircle className="w-4 h-4" /><span className="font-medium">Đã thanh toán đầy đủ</span>
                                        </div>
                                    )}
                                    {(selectedBooking as any).paymentStatus === 'pending' && (
                                        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                                            💡 Chưa thanh toán. Vui lòng hoàn tất thanh toán để xác nhận đặt chỗ.
                                        </p>
                                    )}
                                    {(selectedBooking as any).paymentStatus === 'refunded' && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-sm text-blue-600">
                                            <Info className="w-4 h-4" />
                                            <span>Đã hoàn tiền{(selectedBooking as any).refundAmount ? `: ${formatPrice((selectedBooking as any).refundAmount)}` : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cancel reason */}
                            {(selectedBooking as any).status === 'cancelled' && (selectedBooking as any).cancelReason && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Lý do hủy</h4>
                                    <p className="text-sm text-gray-700 bg-red-50 border border-red-100 rounded-xl p-3">{(selectedBooking as any).cancelReason}</p>
                                </div>
                            )}

                            {/* Customer Info */}
                            {(selectedBooking as any).customerInfo && (
                                <div className="border-t border-gray-100 pt-4">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> Thông tin liên hệ
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        {(selectedBooking as any).customerInfo.name && (
                                            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
                                                <span className="text-gray-500 flex-shrink-0">Tên:</span>
                                                <span className="font-medium text-gray-900">{(selectedBooking as any).customerInfo.name}</span>
                                            </div>
                                        )}
                                        {(selectedBooking as any).customerInfo.phone && (
                                            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
                                                <span className="text-gray-500 flex-shrink-0">SĐT:</span>
                                                <span className="font-medium text-gray-900">{(selectedBooking as any).customerInfo.phone}</span>
                                            </div>
                                        )}
                                        {(selectedBooking as any).customerInfo.email && (
                                            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                                                <span className="text-gray-500 flex-shrink-0">Email:</span>
                                                <span className="font-medium text-gray-900 break-all">{(selectedBooking as any).customerInfo.email}</span>
                                            </div>
                                        )}
                                        {(selectedBooking as any).customerInfo.note && (
                                            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl sm:col-span-2">
                                                <span className="text-gray-500 flex-shrink-0">Ghi chú:</span>
                                                <span className="text-gray-900">{(selectedBooking as any).customerInfo.note}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="border-t border-gray-100 pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Mã đặt chỗ</p>
                                        <p className="font-mono font-semibold text-gray-900 text-base">#{((selectedBooking as any).id || (selectedBooking as any)._id || '').slice(-8).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Thời gian đặt</p>
                                        <p className="font-medium text-gray-900">{formatDateTimeWithTime((selectedBooking as any).createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-5 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    const sid = typeof (selectedBooking as any).serviceId === 'object'
                                        ? (selectedBooking as any).serviceId?._id
                                        : (selectedBooking as any).serviceId;
                                    navigate(`/service/${sid}`);
                                }}
                                className="flex-1 py-2.5 px-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" /> Xem dịch vụ
                            </button>
                            {(selectedBooking as any).status !== 'cancelled' && (selectedBooking as any).status !== 'completed' && (
                                <button
                                    onClick={() => { setShowDetailModal(false); setShowCancelModal(true); }}
                                    className="flex-1 py-2.5 px-4 text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Hủy đặt chỗ
                                </button>
                            )}
                            <button onClick={() => { setShowDetailModal(false); setSelectedBooking(null); }}
                                className="py-2.5 px-4 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-medium text-sm">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingHistoryPage;
